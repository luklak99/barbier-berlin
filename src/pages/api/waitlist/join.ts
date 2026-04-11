import { env } from 'cloudflare:workers';
import type { APIContext } from 'astro';
import { and, eq } from 'drizzle-orm';
import { waitlist } from '../../../db/schema';
import { generateId } from '../../../lib/crypto';
import { getDb } from '../../../lib/db';
import { getSessionToken, validateSession } from '../../../lib/session';
import { validateServiceId, validateDate, validateTime, jsonResponse, errorResponse } from '../../../lib/validation';

export async function POST(context: APIContext) {
  const token = getSessionToken(context.request);
  if (!token) return errorResponse('Nicht angemeldet.', 401);

  const db = getDb(env.DB);
  const user = await validateSession(db, token);
  if (!user) return errorResponse('Sitzung abgelaufen.', 401);

  let body: Record<string, unknown>;
  try { body = await context.request.json(); } catch { return errorResponse('Ungültiger Request.', 400); }

  const serviceId = validateServiceId(body.serviceId);
  const date = validateDate(body.date);
  const preferredStartTime = validateTime(body.preferredStartTime);
  if (!serviceId || !date) return errorResponse('Service und Datum sind erforderlich.');

  // Check if already on waitlist for this date/service
  const existing = await db.select({ id: waitlist.id }).from(waitlist)
    .where(and(eq(waitlist.userId, user.id), eq(waitlist.date, date), eq(waitlist.serviceId, serviceId), eq(waitlist.status, 'waiting')))
    .limit(1);
  if (existing.length > 0) return errorResponse('Sie stehen bereits auf der Warteliste für diesen Tag.');

  await db.insert(waitlist).values({
    id: generateId(),
    userId: user.id,
    serviceId,
    date,
    preferredStartTime,
  });

  return jsonResponse({ success: true, message: 'Sie wurden auf die Warteliste gesetzt. Wir benachrichtigen Sie bei Verfügbarkeit.' }, 201);
}
