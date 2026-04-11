/**
 * Minimal SMTP client for Cloudflare Workers using TCP connect().
 * Sends emails via Strato SMTP (smtp.strato.de:465, implicit TLS).
 *
 * Credentials are stored as Cloudflare Secrets:
 *   - SMTP_USER: info@barbier.berlin
 *   - SMTP_PASS: (Strato email password)
 */

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
}

export async function sendEmail(
  config: SmtpConfig,
  options: EmailOptions,
): Promise<{ success: boolean; error?: string }> {
  const from = options.from || 'Barbier Berlin <info@barbier.berlin>';

  try {
    const socket = connect(
      { hostname: config.host, port: config.port },
      { secureTransport: 'on' },
    );

    const writer = socket.writable.getWriter();
    const reader = socket.readable.getReader();
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();

    async function readResponse(): Promise<string> {
      let result = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        result += decoder.decode(value);
        if (result.includes('\r\n') && !result.match(/^\d{3}-/m)) break;
      }
      return result.trim();
    }

    async function sendCommand(cmd: string): Promise<string> {
      await writer.write(encoder.encode(cmd + '\r\n'));
      return readResponse();
    }

    // Read greeting
    const greeting = await readResponse();
    if (!greeting.startsWith('220')) {
      throw new Error(`SMTP greeting failed: ${greeting}`);
    }

    // EHLO
    const ehlo = await sendCommand(`EHLO barbier.berlin`);
    if (!ehlo.startsWith('250')) {
      throw new Error(`EHLO failed: ${ehlo}`);
    }

    // AUTH LOGIN
    const authStart = await sendCommand('AUTH LOGIN');
    if (!authStart.startsWith('334')) {
      throw new Error(`AUTH LOGIN failed: ${authStart}`);
    }

    // Username (Base64)
    const userResp = await sendCommand(btoa(config.user));
    if (!userResp.startsWith('334')) {
      throw new Error(`AUTH user failed: ${userResp}`);
    }

    // Password (Base64)
    const passResp = await sendCommand(btoa(config.pass));
    if (!passResp.startsWith('235')) {
      throw new Error(`AUTH password failed: ${passResp}`);
    }

    // MAIL FROM
    const mailFrom = await sendCommand(`MAIL FROM:<${config.user}>`);
    if (!mailFrom.startsWith('250')) {
      throw new Error(`MAIL FROM failed: ${mailFrom}`);
    }

    // RCPT TO
    const rcptTo = await sendCommand(`RCPT TO:<${options.to}>`);
    if (!rcptTo.startsWith('250')) {
      throw new Error(`RCPT TO failed: ${rcptTo}`);
    }

    // DATA
    const dataResp = await sendCommand('DATA');
    if (!dataResp.startsWith('354')) {
      throw new Error(`DATA failed: ${dataResp}`);
    }

    // Construct email with MIME headers
    const boundary = `boundary-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const emailContent = [
      `From: ${from}`,
      `To: ${options.to}`,
      `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(options.subject)))}?=`,
      `MIME-Version: 1.0`,
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      `Date: ${new Date().toUTCString()}`,
      `Message-ID: <${Date.now()}.${Math.random().toString(36).slice(2)}@barbier.berlin>`,
      ``,
      `--${boundary}`,
      `Content-Type: text/html; charset=UTF-8`,
      `Content-Transfer-Encoding: base64`,
      ``,
      btoa(unescape(encodeURIComponent(options.html))),
      ``,
      `--${boundary}--`,
      `.`,
    ].join('\r\n');

    const endResp = await sendCommand(emailContent);
    if (!endResp.startsWith('250')) {
      throw new Error(`Message send failed: ${endResp}`);
    }

    // QUIT
    await sendCommand('QUIT');
    writer.close();

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown SMTP error';
    console.error('SMTP Error:', message);
    return { success: false, error: message };
  }
}

/**
 * Helper to send email using environment variables.
 * Call from API endpoints: sendEmailFromEnv(env, { to, subject, html })
 *
 * Fire-and-forget: use context.waitUntil() so it doesn't block the response.
 */
export function sendEmailFromEnv(
  env: { SMTP_USER: string; SMTP_PASS: string },
  options: EmailOptions,
): Promise<{ success: boolean; error?: string }> {
  return sendEmail(
    {
      host: 'smtp.strato.de',
      port: 465,
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
    options,
  );
}
