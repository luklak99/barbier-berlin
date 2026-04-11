/**
 * E-Mail-Versand über Strato SMTP (smtp.strato.de:465, implicit TLS).
 * Cloudflare Workers kompatibel via connect() TCP API.
 *
 * Credentials als Cloudflare Secrets:
 *   - SMTP_USER: info@barbier.berlin
 *   - SMTP_PASS: (Strato E-Mail-Passwort)
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

const FROM_ADDRESS = 'Barbier Berlin <info@barbier.berlin>';
const FROM_EMAIL = 'info@barbier.berlin';

// --- SMTP Client (Cloudflare Workers TCP connect) ---

interface SmtpEnv {
  SMTP_USER: string;
  SMTP_PASS: string;
}

async function sendViaSMTP(
  env: SmtpEnv,
  to: string,
  subject: string,
  html: string,
  text: string,
): Promise<void> {
  // Sanitize against SMTP header injection
  const safeTo = sanitizeEmailForSmtp(to);

  const socket = connect(
    { hostname: 'smtp.strato.de', port: 465 },
    { secureTransport: 'on' },
  );

  const writer = socket.writable.getWriter();
  const reader = socket.readable.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  async function readResponse(): Promise<string> {
    let result = '';
    // Read until we get a complete response (line ending with \r\n and no continuation)
    for (let i = 0; i < 20; i++) {
      const { value, done } = await reader.read();
      if (done) break;
      result += decoder.decode(value);
      // SMTP responses end with "code space" (not "code dash" which is continuation)
      const lines = result.split('\r\n').filter(Boolean);
      const lastLine = lines[lines.length - 1];
      if (lastLine && /^\d{3} /.test(lastLine)) break;
      if (lastLine && /^\d{3}$/.test(lastLine)) break;
    }
    return result.trim();
  }

  async function send(cmd: string): Promise<string> {
    await writer.write(encoder.encode(cmd + '\r\n'));
    return readResponse();
  }

  // Read server greeting
  const greeting = await readResponse();
  if (!greeting.startsWith('220')) throw new Error(`SMTP greeting: ${greeting}`);

  // EHLO
  const ehlo = await send('EHLO barbier.berlin');
  if (!ehlo.includes('250')) throw new Error(`EHLO: ${ehlo}`);

  // AUTH LOGIN
  const auth = await send('AUTH LOGIN');
  if (!auth.startsWith('334')) throw new Error(`AUTH: ${auth}`);

  const userResp = await send(btoa(env.SMTP_USER));
  if (!userResp.startsWith('334')) throw new Error(`AUTH user: ${userResp}`);

  const passResp = await send(btoa(env.SMTP_PASS));
  if (!passResp.startsWith('235')) throw new Error(`AUTH pass: ${passResp}`);

  // MAIL FROM
  const from = await send(`MAIL FROM:<${FROM_EMAIL}>`);
  if (!from.startsWith('250')) throw new Error(`MAIL FROM: ${from}`);

  // RCPT TO
  const rcpt = await send(`RCPT TO:<${safeTo}>`);
  if (!rcpt.startsWith('250')) throw new Error(`RCPT TO: ${rcpt}`);

  // DATA
  const data = await send('DATA');
  if (!data.startsWith('354')) throw new Error(`DATA: ${data}`);

  // Build MIME message
  const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const encodedSubject = `=?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;
  const messageId = `<${Date.now()}.${Math.random().toString(36).slice(2)}@barbier.berlin>`;

  const message = [
    `From: ${FROM_ADDRESS}`,
    `To: ${safeTo}`,
    `Subject: ${encodedSubject}`,
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: ${messageId}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    ``,
    `--${boundary}`,
    `Content-Type: text/plain; charset=UTF-8`,
    `Content-Transfer-Encoding: base64`,
    ``,
    btoa(unescape(encodeURIComponent(text))),
    ``,
    `--${boundary}`,
    `Content-Type: text/html; charset=UTF-8`,
    `Content-Transfer-Encoding: base64`,
    ``,
    btoa(unescape(encodeURIComponent(html))),
    ``,
    `--${boundary}--`,
    `.`,
  ].join('\r\n');

  const endResp = await send(message);
  if (!endResp.startsWith('250')) throw new Error(`Send: ${endResp}`);

  // QUIT
  await send('QUIT');

  try { writer.close(); } catch {}
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

export async function sendBookingConfirmation(env: SmtpEnv, params: BookingConfirmationParams): Promise<void> {
  const { to, ...data } = params;
  await sendViaSMTP(
    env,
    to,
    `Buchung bestätigt: ${data.serviceName} am ${formatDateShort(data.date)}`,
    bookingConfirmationHtml(data),
    bookingConfirmationText(data),
  );
}

export async function sendBookingCancellation(env: SmtpEnv, params: BookingCancellationParams): Promise<void> {
  const { to, ...data } = params;
  await sendViaSMTP(
    env,
    to,
    `Termin storniert: ${data.serviceName} am ${formatDateShort(data.date)}`,
    bookingCancellationHtml(data),
    bookingCancellationText(data),
  );
}

export async function sendBookingReminder(env: SmtpEnv, params: BookingReminderParams): Promise<void> {
  const { to, ...data } = params;
  await sendViaSMTP(
    env,
    to,
    `Erinnerung: Ihr Termin morgen um ${data.startTime} Uhr`,
    bookingReminderHtml(data),
    bookingReminderText(data),
  );
}

export async function sendWelcomeEmail(env: SmtpEnv, params: WelcomeEmailParams): Promise<void> {
  const { to, ...data } = params;
  await sendViaSMTP(
    env,
    to,
    'Willkommen bei Barbier Berlin!',
    welcomeEmailHtml(data),
    welcomeEmailText(data),
  );
}

export interface PasswordResetParams {
  to: string;
  customerName: string;
  resetUrl: string;
}

export async function sendPasswordResetEmail(env: SmtpEnv, params: PasswordResetParams): Promise<void> {
  const html = `<!DOCTYPE html><html lang="de"><head><meta charset="UTF-8"></head><body style="margin:0;padding:0;background:#121212;font-family:sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#121212;padding:24px"><tr><td align="center">
    <table width="560" style="max-width:560px;background:#2a2a4e;border-radius:12px;overflow:hidden">
    <tr><td style="background:#1a1a2e;padding:28px 32px;text-align:center"><div style="color:#C8A55A;font-size:22px;font-weight:600">Barbier Berlin</div></td></tr>
    <tr><td style="padding:32px"><h1 style="color:#C8A55A;font-size:22px;margin:0 0 16px">Passwort zurücksetzen</h1>
    <p style="color:#e0e0e0;font-size:15px;line-height:1.6;margin:0 0 24px">Hallo ${params.customerName},<br>Sie haben eine Passwort-Zurücksetzung angefordert.</p>
    <table cellpadding="0" cellspacing="0" style="margin:24px auto"><tr><td style="background:#C8A55A;border-radius:6px;padding:14px 32px">
    <a href="${params.resetUrl}" style="color:#1a1a2e;text-decoration:none;font-weight:700;font-size:15px">Neues Passwort setzen</a>
    </td></tr></table>
    <p style="color:#a0a0a0;font-size:13px;margin:24px 0 0">Dieser Link ist 1 Stunde gültig. Falls Sie dies nicht angefordert haben, ignorieren Sie diese E-Mail.</p>
    </td></tr></table></td></tr></table></body></html>`;
  const text = `Passwort zurücksetzen\n\nHallo ${params.customerName},\nSetzen Sie Ihr Passwort zurück: ${params.resetUrl}\n\nDieser Link ist 1 Stunde gültig.\n\nBarbier Berlin`;
  await sendViaSMTP(env, params.to, 'Passwort zurücksetzen – Barbier Berlin', html, text);
}

export interface VerificationEmailParams {
  to: string;
  customerName: string;
  verifyUrl: string;
}

export async function sendVerificationEmail(env: SmtpEnv, params: VerificationEmailParams): Promise<void> {
  const html = `<!DOCTYPE html><html lang="de"><head><meta charset="UTF-8"></head><body style="margin:0;padding:0;background:#121212;font-family:sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#121212;padding:24px"><tr><td align="center">
    <table width="560" style="max-width:560px;background:#2a2a4e;border-radius:12px;overflow:hidden">
    <tr><td style="background:#1a1a2e;padding:28px 32px;text-align:center"><div style="color:#C8A55A;font-size:22px;font-weight:600">Barbier Berlin</div></td></tr>
    <tr><td style="padding:32px"><h1 style="color:#C8A55A;font-size:22px;margin:0 0 16px">E-Mail bestätigen</h1>
    <p style="color:#e0e0e0;font-size:15px;line-height:1.6;margin:0 0 24px">Hallo ${params.customerName},<br>Bitte bestätigen Sie Ihre E-Mail-Adresse.</p>
    <table cellpadding="0" cellspacing="0" style="margin:24px auto"><tr><td style="background:#C8A55A;border-radius:6px;padding:14px 32px">
    <a href="${params.verifyUrl}" style="color:#1a1a2e;text-decoration:none;font-weight:700;font-size:15px">E-Mail bestätigen</a>
    </td></tr></table>
    <p style="color:#a0a0a0;font-size:13px;margin:24px 0 0">Dieser Link ist 24 Stunden gültig.</p>
    </td></tr></table></td></tr></table></body></html>`;
  const text = `E-Mail bestätigen\n\nHallo ${params.customerName},\nBestätigen Sie Ihre E-Mail: ${params.verifyUrl}\n\nBarbier Berlin`;
  await sendViaSMTP(env, params.to, 'E-Mail bestätigen – Barbier Berlin', html, text);
}

function formatDateShort(dateStr: string): string {
  const [year, month, day] = dateStr.split('-');
  return `${day}.${month}.${year}`;
}
