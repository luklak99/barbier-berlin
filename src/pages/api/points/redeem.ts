import { env } from 'cloudflare:workers';
import type { APIContext } from 'astro';
import { and, eq } from 'drizzle-orm';
import { bookings, pointsTransactions, users } from '../../../db/schema';
import { generateId } from '../../../lib/crypto';
import { getDb } from '../../../lib/db';
import { getSessionToken, validateSession } from '../../../lib/session';
import { getServiceById } from '../../../data/services';
import { jsonResponse, errorResponse } from '../../../lib/validation';

export async function POST(context: APIContext) {
  const token = getSessionToken(context.request);
  if (!token) return errorResponse('Nicht angemeldet.', 401);

  const db = getDb(env.DB);
  const user = await validateSession(db, token);
  if (!user) return errorResponse('Sitzung abgelaufen.', 401);

  const body = await context.request.json();
  const bookingId = typeof body.bookingId === 'string' ? body.bookingId : null;
  if (!bookingId) return errorResponse('Buchungs-ID fehlt.');

  // Get booking
  const result = await db
    .select()
    .from(bookings)
    .where(and(eq(bookings.id, bookingId), eq(bookings.userId, user.id), eq(bookings.status, 'confirmed')))
    .limit(1);

  if (result.length === 0) return errorResponse('Buchung nicht gefunden.', 404);
  const booking = result[0]!;

  if (booking.paidWithPoints) return errorResponse('Bereits mit Punkten bezahlt.');

  const service = getServiceById(booking.serviceId);
  if (!service) return errorResponse('Service nicht gefunden.');

  // Points needed = price in cents (1 point = 1 cent)
  const pointsNeeded = service.price * 100;

  if (user.pointsBalance < pointsNeeded) {
    return errorResponse(`Nicht genügend Punkte. Benötigt: ${pointsNeeded}, Verfügbar: ${user.pointsBalance}.`);
  }

  // Deduct points
  await db.update(users).set({
    pointsBalance: user.pointsBalance - pointsNeeded,
    updatedAt: new Date().toISOString(),
  }).where(eq(users.id, user.id));

  // Record transaction
  await db.insert(pointsTransactions).values({
    id: generateId(),
    userId: user.id,
    bookingId,
    amount: -pointsNeeded,
    type: 'redeemed',
    description: `Eingelöst für ${service.name.de}`,
  });

  // Mark booking as paid with points
  await db.update(bookings).set({
    paidWithPoints: true,
    pointsUsed: pointsNeeded,
    updatedAt: new Date().toISOString(),
  }).where(eq(bookings.id, bookingId));

  return jsonResponse({ success: true, pointsUsed: pointsNeeded, newBalance: user.pointsBalance - pointsNeeded });
}
