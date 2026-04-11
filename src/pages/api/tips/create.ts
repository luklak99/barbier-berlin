import { env } from 'cloudflare:workers';
import type { APIContext } from 'astro';
import { and, eq } from 'drizzle-orm';
import { tips, bookings, users, pointsTransactions } from '../../../db/schema';
import { generateId } from '../../../lib/crypto';
import { getDb } from '../../../lib/db';
import { getSessionToken, validateSession } from '../../../lib/session';
import { validateBookingId, jsonResponse, errorResponse } from '../../../lib/validation';

export async function POST(context: APIContext) {
  const token = getSessionToken(context.request);
  if (!token) return errorResponse('Nicht angemeldet.', 401);

  const db = getDb(env.DB);
  const user = await validateSession(db, token);
  if (!user) return errorResponse('Sitzung abgelaufen.', 401);

  let body: Record<string, unknown>;
  try { body = await context.request.json(); } catch { return errorResponse('Ungültiger Request.', 400); }

  const bookingId = validateBookingId(body.bookingId);
  const amountPoints = typeof body.amountPoints === 'number' && Number.isInteger(body.amountPoints) && body.amountPoints > 0
    ? body.amountPoints : null;
  if (!bookingId) return errorResponse('Buchungs-ID fehlt.');
  if (!amountPoints) return errorResponse('Ungültiger Punktebetrag.');

  // Verify booking belongs to user and is completed
  const booking = await db.select().from(bookings)
    .where(and(eq(bookings.id, bookingId), eq(bookings.userId, user.id), eq(bookings.status, 'completed')))
    .limit(1);
  if (booking.length === 0) return errorResponse('Nur abgeschlossene Termine können Trinkgeld erhalten.', 404);

  // Check already tipped
  const existingTip = await db.select({ id: tips.id }).from(tips).where(eq(tips.bookingId, bookingId)).limit(1);
  if (existingTip.length > 0) return errorResponse('Für diesen Termin wurde bereits Trinkgeld gegeben.');

  // Check balance (atomically)
  const result = await env.DB.prepare(
    `UPDATE users SET points_balance = points_balance - ?, updated_at = datetime() WHERE id = ? AND points_balance >= ?`
  ).bind(amountPoints, user.id, amountPoints).run();

  if (result.meta.changes === 0) return errorResponse('Nicht genügend Punkte.');

  await db.insert(tips).values({ id: generateId(), userId: user.id, bookingId, amountPoints });
  await db.insert(pointsTransactions).values({
    id: generateId(),
    userId: user.id,
    bookingId,
    amount: -amountPoints,
    type: 'redeemed',
    description: `Trinkgeld (${(amountPoints / 100).toFixed(2)}€)`,
  });

  return jsonResponse({ success: true, pointsUsed: amountPoints });
}
