import { env } from 'cloudflare:workers';
import type { APIContext } from 'astro';
import { getDb } from '../../../lib/db';
import { getSessionToken, validateSession } from '../../../lib/session';
import { jsonResponse, errorResponse } from '../../../lib/validation';

export async function GET(context: APIContext) {
  const token = getSessionToken(context.request);
  if (!token) return errorResponse('Nicht angemeldet.', 401);

  const db = getDb(env.DB);
  const user = await validateSession(db, token);
  if (!user || user.role !== 'admin') return errorResponse('Keine Berechtigung.', 403);

  if (!env.SMTP_USER || !env.SMTP_PASS) {
    return jsonResponse({ error: 'SMTP nicht konfiguriert', hasUser: !!env.SMTP_USER, hasPass: !!env.SMTP_PASS });
  }

  try {
    // Test if connect() is available
    const hasConnect = typeof globalThis.connect === 'function';

    if (!hasConnect) {
      return jsonResponse({ error: 'connect() TCP API nicht verfügbar in dieser Umgebung', hasConnect });
    }

    // Try to connect to Strato SMTP
    const socket = connect(
      { hostname: 'smtp.strato.de', port: 465 },
      { secureTransport: 'on' },
    );

    const reader = socket.readable.getReader();
    const decoder = new TextDecoder();

    // Read greeting with timeout
    const readPromise = reader.read().then(({ value }) => decoder.decode(value));
    const timeoutPromise = new Promise<string>((_, reject) => setTimeout(() => reject(new Error('Timeout nach 5s')), 5000));

    const greeting = await Promise.race([readPromise, timeoutPromise]);

    // Close connection
    try { reader.cancel(); socket.close(); } catch {}

    return jsonResponse({
      success: true,
      hasConnect,
      smtpGreeting: greeting.trim().substring(0, 100),
      smtpUser: env.SMTP_USER,
    });
  } catch (err) {
    return jsonResponse({
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack?.split('\n').slice(0, 3) : undefined,
    }, 500);
  }
}
