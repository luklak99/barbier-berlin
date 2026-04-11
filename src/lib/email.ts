/**
 * E-Mail-Versand über PHP-Relay auf Strato Webspace.
 * Das Relay läuft unter https://barbier.berlin/api-relay/send.php
 * und wird per HTTP POST von Cloudflare Workers aufgerufen.
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

const RELAY_URL = 'https://barbier.berlin/api-relay/send.php';

interface EmailEnv {
  RELAY_SECRET: string;
  SMTP_USER?: string;
  SMTP_PASS?: string;
}

async function sendViaRelay(
  env: EmailEnv,
  to: string,
  subject: string,
  html: string,
  text: string,
): Promise<void> {
  const safeTo = sanitizeEmailForSmtp(to);

  const res = await fetch(RELAY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Relay-Secret': env.RELAY_SECRET,
    },
    body: JSON.stringify({ to: safeTo, subject, html, text }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`E-Mail-Relay Fehler (${res.status}): ${body}`);
  }
}

// --- Public API ---

export interface BookingConfirmationParams extends BookingEmailData {
  to: string;
}

export interface BookingCancellationParams extends CancellationEmailData {
  to: string;
}

export interface BookingReminderParams extends ReminderEmailData {
  to: string;
}

export interface WelcomeEmailParams extends WelcomeEmailData {
  to: string;
}

export async function sendBookingConfirmation(env: EmailEnv, params: BookingConfirmationParams): Promise<void> {
  const { to, ...data } = params;
  await sendViaRelay(env, to,
    `Buchung bestätigt: ${data.serviceName} am ${formatDateShort(data.date)}`,
    bookingConfirmationHtml(data), bookingConfirmationText(data));
}

export async function sendBookingCancellation(env: EmailEnv, params: BookingCancellationParams): Promise<void> {
  const { to, ...data } = params;
  await sendViaRelay(env, to,
    `Termin storniert: ${data.serviceName} am ${formatDateShort(data.date)}`,
    bookingCancellationHtml(data), bookingCancellationText(data));
}

export async function sendBookingReminder(env: EmailEnv, params: BookingReminderParams): Promise<void> {
  const { to, ...data } = params;
  await sendViaRelay(env, to,
    `Erinnerung: Ihr Termin morgen um ${data.startTime} Uhr`,
    bookingReminderHtml(data), bookingReminderText(data));
}

export async function sendWelcomeEmail(env: EmailEnv, params: WelcomeEmailParams): Promise<void> {
  const { to, ...data } = params;
  await sendViaRelay(env, to, 'Willkommen bei Barbier Berlin!',
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
  const text = `Passwort zurücksetzen\n\nHallo ${params.customerName},\n${params.resetUrl}\n\n1 Stunde gültig.\n\nBarbier Berlin`;
  await sendViaRelay(env, params.to, 'Passwort zurücksetzen – Barbier Berlin', html, text);
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
    <p style="color:#a0a0a0;font-size:13px;margin:24px 0 0">Dieser Link ist 24 Stunden gültig.</p></td></tr></table></td></tr></table></body></html>`;
  const text = `E-Mail bestätigen\n\nHallo ${params.customerName},\n${params.verifyUrl}\n\nBarbier Berlin`;
  await sendViaRelay(env, params.to, 'E-Mail bestätigen – Barbier Berlin', html, text);
}

function formatDateShort(dateStr: string): string {
  const [year, month, day] = dateStr.split('-');
  return `${day}.${month}.${year}`;
}
