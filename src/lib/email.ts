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

function formatDateShort(dateStr: string): string {
  const [year, month, day] = dateStr.split('-');
  return `${day}.${month}.${year}`;
}
