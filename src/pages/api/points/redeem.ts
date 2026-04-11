import { env } from 'cloudflare:workers';
import type { APIContext } from 'astro';
import { and, eq } from 'drizzle-orm';
import { bookings, pointsTransactions, users } from '../../../db/schema';
import { generateId } from '../../../lib/crypto';
import { getDb } from '../../../lib/db';
import { getSessionToken, validateSession } from '../../../lib/session';
import { getServiceById } from '../../../data/services';
import { validateBookingId, jsonResponse, errorResponse } from '../../../lib/validation';

export async function POST(context: APIContext) {
  const token = getSessionToken(context.request);
  if (!token) return errorResponse('Nicht angemeldet.', 401);

  const db = getDb(env.DB);
  const user = await validateSession(db, token);
  if (!user) return errorResponse('Sitzung abgelaufen.', 401);

  let body: Record<string, unknown>;
  try {
    body = await context.request.json();
  } catch {
    return errorResponse('Ungültiger Request-Body.', 400);
  }

  const bookingId = validateBookingId(body.bookingId);
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

  // Frischen Balance aus der DB lesen (nicht aus Session-Cache)
  const freshUser = await db.select({ pointsBalance: users.pointsBalance }).from(users).where(eq(users.id, user.id)).limit(1);
  if (!freshUser[0]) return errorResponse('Benutzer nicht gefunden.', 404);
  const currentBalance = freshUser[0].pointsBalance;

  if (currentBalance < pointsNeeded) {
    return errorResponse(`Nicht genügend Punkte. Benötigt: ${pointsNeeded}, Verfügbar: ${currentBalance}.`);
  }

  // Optimistic locking: Punkte abziehen NUR wenn Balance noch ausreicht
  const now = new Date().toISOString();
  const deductResult = await env.DB.prepare(
    `UPDATE users SET points_balance = points_balance - ?, updated_at = ? WHERE id = ? AND points_balance >= ?`
  ).bind(pointsNeeded, now, user.id, pointsNeeded).run();

  if (deductResult.meta.changes === 0) {
    return errorResponse('Nicht genügend Punkte (gleichzeitige Einlösung).');
  }

  // Record transaction
  await db.insert(pointsTransactions).values({
    id: generateId(),
    userId: user.id,
    bookingId,
    amount: -pointsNeeded,
    type: 'redeemed',
    description: `Eingelöst für ${service.name.de}`,
  });

  // Mark booking as paid with points (optimistic locking)
  const bookingUpdate = await env.DB.prepare(
    `UPDATE bookings SET paid_with_points = 1, points_used = ?, updated_at = ? WHERE id = ? AND paid_with_points = 0`
  ).bind(pointsNeeded, now, bookingId).run();

  if (bookingUpdate.meta.changes === 0) {
    // Punkte zurückerstatten wenn Booking bereits bezahlt
    await env.DB.prepare(
      `UPDATE users SET points_balance = points_balance + ? WHERE id = ?`
    ).bind(pointsNeeded, user.id).run();
    return errorResponse('Buchung wurde bereits mit Punkten bezahlt.');
  }

  return jsonResponse({ success: true, pointsUsed: pointsNeeded, newBalance: currentBalance - pointsNeeded });
}
