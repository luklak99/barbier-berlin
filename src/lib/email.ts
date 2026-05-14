/**
 * E-Mail-Versand über Microsoft Graph API (Exchange Online).
 *
 * Authentifizierung: OAuth 2.0 Client Credentials Flow (App-only).
 * - App-Registrierung in Azure AD mit Application Permission `Mail.Send`
 * - Admin Consent erteilt
 * - Application Access Policy in EXO beschränkt App auf MAIL_SENDER-Mailbox
 *
 * Benötigte Cloudflare Pages Secrets:
 *   MS_TENANT_ID     – GUID des Azure AD Tenants
 *   MS_CLIENT_ID     – Application (Client) ID der App-Registrierung
 *   MS_CLIENT_SECRET – Client Secret der App-Registrierung
 *   MAIL_SENDER      – Absender-Mailbox (z. B. info@barbier.berlin)
 */

import { sanitizeEmailForSmtp } from './validation';
import {
  type BookingEmailData,
  type CancellationEmailData,
  type ReminderEmailData,
  type WelcomeEmailData,
  bookingConfirmationHtml,
  bookingConfirmationText,
  bookingCancellationHtml,
  bookingCancellationText,
  bookingReminderHtml,
  bookingReminderText,
  welcomeEmailHtml,
  welcomeEmailText,
} from './email-templates';

const FROM_NAME = 'Barbier Berlin';
const GRAPH_BASE = 'https://graph.microsoft.com/v1.0';
const TOKEN_EXPIRY_BUFFER_MS = 60_000;

interface EmailEnv {
  MS_TENANT_ID: string;
  MS_CLIENT_ID: string;
  MS_CLIENT_SECRET: string;
  MAIL_SENDER: string;
}

// In-memory token cache per Worker isolate.
// Graph access tokens are valid for ~1h; we refresh 1 min early to avoid edge cases.
let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(env: EmailEnv): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + TOKEN_EXPIRY_BUFFER_MS) {
    return cachedToken.value;
  }

  if (!env.MS_TENANT_ID || !env.MS_CLIENT_ID || !env.MS_CLIENT_SECRET) {
    throw new Error('Microsoft Graph nicht konfiguriert: MS_TENANT_ID / MS_CLIENT_ID / MS_CLIENT_SECRET fehlen.');
  }

  const url = `https://login.microsoftonline.com/${encodeURIComponent(env.MS_TENANT_ID)}/oauth2/v2.0/token`;
  const body = new URLSearchParams({
    client_id: env.MS_CLIENT_ID,
    client_secret: env.MS_CLIENT_SECRET,
    scope: 'https://graph.microsoft.com/.default',
    grant_type: 'client_credentials',
  });

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Graph Token-Endpoint ${res.status}: ${detail}`);
  }

  const json = await res.json() as { access_token: string; expires_in: number };
  cachedToken = {
    value: json.access_token,
    expiresAt: now + json.expires_in * 1000,
  };
  return json.access_token;
}

async function sendViaGraph(
  env: EmailEnv,
  to: string,
  subject: string,
  html: string,
  text: string,
): Promise<void> {
  if (!env.MAIL_SENDER) {
    throw new Error('Microsoft Graph nicht konfiguriert: MAIL_SENDER fehlt.');
  }

  const safeTo = sanitizeEmailForSmtp(to);
  const token = await getAccessToken(env);

  const url = `${GRAPH_BASE}/users/${encodeURIComponent(env.MAIL_SENDER)}/sendMail`;
  const payload = {
    message: {
      subject,
      body: { contentType: 'HTML', content: html },
      toRecipients: [{ emailAddress: { address: safeTo } }],
      from: { emailAddress: { name: FROM_NAME, address: env.MAIL_SENDER } },
    },
    saveToSentItems: true,
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'authorization': `Bearer ${token}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  // 401 → Token könnte revoked sein, einmal Cache invalidieren und retry
  if (res.status === 401) {
    cachedToken = null;
    const fresh = await getAccessToken(env);
    const retry = await fetch(url, {
      method: 'POST',
      headers: {
        'authorization': `Bearer ${fresh}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (!retry.ok) {
      const detail = await retry.text().catch(() => '');
      throw new Error(`Graph sendMail (retry) ${retry.status}: ${detail}`);
    }
    return;
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Graph sendMail ${res.status}: ${detail}`);
  }

  // Plain-Text-Variante landet nicht direkt im Graph-Payload (HTML reicht).
  // Text-Argument ist für künftige multipart/alternative-Varianten erhalten.
  void text;
}

// --- Public API ---

export function isMailConfigured(env: Partial<EmailEnv>): boolean {
  return !!(env.MS_TENANT_ID && env.MS_CLIENT_ID && env.MS_CLIENT_SECRET && env.MAIL_SENDER);
}

export interface CustomEmailParams { to: string; subject: string; html: string; text: string; }

/** Generischer Versand für Spezialfälle (z. B. Gast-Buchungen mit ad-hoc Template). */
export async function sendCustomEmail(env: EmailEnv, params: CustomEmailParams): Promise<void> {
  await sendViaGraph(env, params.to, params.subject, params.html, params.text);
}

type EmailLang = 'de' | 'en' | 'tr' | 'ar';

function confirmationSubject(serviceName: string, date: string, lang: EmailLang): string {
  const d = fmtDate(date);
  switch (lang) {
    case 'en': return `Booking confirmed: ${serviceName} on ${d}`;
    case 'tr': return `Randevu onaylandı: ${serviceName} - ${d}`;
    case 'ar': return `تأكيد الحجز: ${serviceName} في ${d}`;
    default:   return `Buchung bestätigt: ${serviceName} am ${d}`;
  }
}

function cancellationSubject(serviceName: string, date: string, lang: EmailLang): string {
  const d = fmtDate(date);
  switch (lang) {
    case 'en': return `Appointment cancelled: ${serviceName} on ${d}`;
    case 'tr': return `Randevu iptal edildi: ${serviceName} - ${d}`;
    case 'ar': return `تم إلغاء الموعد: ${serviceName} في ${d}`;
    default:   return `Termin storniert: ${serviceName} am ${d}`;
  }
}

function reminderSubject(startTime: string, lang: EmailLang): string {
  switch (lang) {
    case 'en': return `Reminder: Your appointment tomorrow at ${startTime}`;
    case 'tr': return `Hatırlatma: Randevunuz yarın saat ${startTime}`;
    case 'ar': return `تذكير: موعدك غداً الساعة ${startTime}`;
    default:   return `Erinnerung: Ihr Termin morgen um ${startTime} Uhr`;
  }
}

export interface BookingConfirmationParams extends BookingEmailData { to: string; lang?: EmailLang; }
export interface BookingCancellationParams extends CancellationEmailData { to: string; lang?: EmailLang; }
export interface BookingReminderParams extends ReminderEmailData { to: string; lang?: EmailLang; }
export interface WelcomeEmailParams extends WelcomeEmailData { to: string; }

export async function sendBookingConfirmation(env: EmailEnv, params: BookingConfirmationParams): Promise<void> {
  const { to, lang = 'de', ...data } = params;
  await sendViaGraph(env, to,
    confirmationSubject(data.serviceName, data.date, lang),
    bookingConfirmationHtml(data), bookingConfirmationText(data));
}

export async function sendBookingCancellation(env: EmailEnv, params: BookingCancellationParams): Promise<void> {
  const { to, lang = 'de', ...data } = params;
  await sendViaGraph(env, to,
    cancellationSubject(data.serviceName, data.date, lang),
    bookingCancellationHtml(data), bookingCancellationText(data));
}

export async function sendBookingReminder(env: EmailEnv, params: BookingReminderParams): Promise<void> {
  const { to, lang = 'de', ...data } = params;
  await sendViaGraph(env, to,
    reminderSubject(data.startTime, lang),
    bookingReminderHtml(data), bookingReminderText(data));
}

export async function sendWelcomeEmail(env: EmailEnv, params: WelcomeEmailParams): Promise<void> {
  const { to, ...data } = params;
  await sendViaGraph(env, to, 'Willkommen bei Barbier Berlin!',
    welcomeEmailHtml(data), welcomeEmailText(data));
}

export interface PasswordResetParams { to: string; customerName: string; resetUrl: string; }

export async function sendPasswordResetEmail(env: EmailEnv, params: PasswordResetParams): Promise<void> {
  const html = `<!DOCTYPE html><html lang="de"><head><meta charset="UTF-8"></head><body style="margin:0;padding:0;background:#121212;font-family:sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#121212;padding:24px"><tr><td align="center">
    <table width="560" style="max-width:560px;background:#2a2a4e;border-radius:12px;overflow:hidden">
    <tr><td style="background:#1a1a2e;padding:28px 32px;text-align:center"><div style="color:#C8A55A;font-size:22px;font-weight:600">Barbier Berlin</div></td></tr>
    <tr><td style="padding:32px"><h1 style="color:#C8A55A;font-size:22px;margin:0 0 16px">Passwort zurücksetzen</h1>
    <p style="color:#e0e0e0;font-size:15px;line-height:1.6;margin:0 0 24px">Hallo ${params.customerName},<br>Sie haben eine Passwort-Zurücksetzung angefordert.</p>
    <table cellpadding="0" cellspacing="0" style="margin:24px auto"><tr><td style="background:#C8A55A;border-radius:6px;padding:14px 32px">
    <a href="${params.resetUrl}" style="color:#1a1a2e;text-decoration:none;font-weight:700;font-size:15px">Neues Passwort setzen</a></td></tr></table>
    <p style="color:#a0a0a0;font-size:13px;margin:24px 0 0">Dieser Link ist 1 Stunde gültig.</p></td></tr></table></td></tr></table></body></html>`;
  const text = `Passwort zurücksetzen\n\nHallo ${params.customerName},\n${params.resetUrl}\n\n1h gültig.\n\nBarbier Berlin`;
  await sendViaGraph(env, params.to, 'Passwort zurücksetzen – Barbier Berlin', html, text);
}

export interface VerificationEmailParams { to: string; customerName: string; verifyUrl: string; }

export async function sendVerificationEmail(env: EmailEnv, params: VerificationEmailParams): Promise<void> {
  const html = `<!DOCTYPE html><html lang="de"><head><meta charset="UTF-8"></head><body style="margin:0;padding:0;background:#121212;font-family:sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#121212;padding:24px"><tr><td align="center">
    <table width="560" style="max-width:560px;background:#2a2a4e;border-radius:12px;overflow:hidden">
    <tr><td style="background:#1a1a2e;padding:28px 32px;text-align:center"><div style="color:#C8A55A;font-size:22px;font-weight:600">Barbier Berlin</div></td></tr>
    <tr><td style="padding:32px"><h1 style="color:#C8A55A;font-size:22px;margin:0 0 16px">E-Mail bestätigen</h1>
    <p style="color:#e0e0e0;font-size:15px;line-height:1.6;margin:0 0 24px">Hallo ${params.customerName},<br>Bitte bestätigen Sie Ihre E-Mail-Adresse.</p>
    <table cellpadding="0" cellspacing="0" style="margin:24px auto"><tr><td style="background:#C8A55A;border-radius:6px;padding:14px 32px">
    <a href="${params.verifyUrl}" style="color:#1a1a2e;text-decoration:none;font-weight:700;font-size:15px">E-Mail bestätigen</a></td></tr></table>
    <p style="color:#a0a0a0;font-size:13px;margin:24px 0 0">24 Stunden gültig.</p></td></tr></table></td></tr></table></body></html>`;
  const text = `E-Mail bestätigen\n\nHallo ${params.customerName},\n${params.verifyUrl}\n\nBarbier Berlin`;
  await sendViaGraph(env, params.to, 'E-Mail bestätigen – Barbier Berlin', html, text);
}

function fmtDate(d: string): string { const [y,m,dd] = d.split('-'); return `${dd}.${m}.${y}`; }
