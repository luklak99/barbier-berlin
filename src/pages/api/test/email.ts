import { env } from 'cloudflare:workers';
import type { APIContext } from 'astro';
import { getDb } from '../../../lib/db';
import { getSessionToken, validateSession } from '../../../lib/session';
import { sendWelcomeEmail } from '../../../lib/email';
import { jsonResponse, errorResponse } from '../../../lib/validation';

export async function GET(context: APIContext) {
  const token = getSessionToken(context.request);
  if (!token) return errorResponse('Nicht angemeldet.', 401);

  const db = getDb(env.DB);
  const user = await validateSession(db, token);
  if (!user || user.role !== 'admin') return errorResponse('Keine Berechtigung.', 403);

  if (!env.BREVO_API_KEY) {
    return jsonResponse({ error: 'BREVO_API_KEY nicht konfiguriert' });
  }

  try {
    await sendWelcomeEmail(env, { to: user.email, customerName: user.name });
    return jsonResponse({ success: true, sentTo: user.email });
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
}
