import { env } from 'cloudflare:workers';
import type { APIContext } from 'astro';
import { pushSubscriptions } from '../../../db/schema';
import { generateId } from '../../../lib/crypto';
import { getDb } from '../../../lib/db';
import { getSessionToken, validateSession } from '../../../lib/session';
import { jsonResponse, errorResponse } from '../../../lib/validation';

export async function POST(context: APIContext) {
  const token = getSessionToken(context.request);
  if (!token) return errorResponse('Nicht angemeldet.', 401);

  const db = getDb(env.DB);
  const user = await validateSession(db, token);
  if (!user) return errorResponse('Sitzung abgelaufen.', 401);

  let body: Record<string, unknown>;
  try { body = await context.request.json(); } catch { return errorResponse('Ungültiger Request.', 400); }

  const endpoint = typeof body.endpoint === 'string' ? body.endpoint : null;
  const keys = body.keys as Record<string, string> | undefined;
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return errorResponse('Ungültige Push-Subscription.');
  }

  await db.insert(pushSubscriptions).values({
    id: generateId(),
    userId: user.id,
    endpoint,
    p256dh: keys.p256dh,
    auth: keys.auth,
  });

  return jsonResponse({ success: true }, 201);
}
