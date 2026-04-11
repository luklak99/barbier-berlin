import { env } from 'cloudflare:workers';
import type { APIContext } from 'astro';
import { eq } from 'drizzle-orm';
import { bookings, pointsTransactions, users } from '../../../db/schema';
import { generateId } from '../../../lib/crypto';
import { getDb } from '../../../lib/db';
import { getSessionToken, validateSession } from '../../../lib/session';
import { getServiceById } from '../../../data/services';
import { validateBookingId, jsonResponse, errorResponse } from '../../../lib/validation';

const CASHBACK_RATE = 0.05; // 5%

export async function POST(context: APIContext) {
  const token = getSessionToken(context.request);
  if (!token) return errorResponse('Nicht angemeldet.', 401);

  const db = getDb(env.DB);
  const admin = await validateSession(db, token);
  if (!admin || admin.role !== 'admin') return errorResponse('Keine Berechtigung.', 403);

  let body: Record<string, unknown>;
  try {
    body = await context.request.json();
  } catch {
    return errorResponse('Ungültiger Request-Body.', 400);
  }

  const bookingId = validateBookingId(body.bookingId);
  if (!bookingId) return errorResponse('Buchungs-ID fehlt.');

  // Get booking
  const result = await db.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1);
  if (result.length === 0) return errorResponse('Buchung nicht gefunden.', 404);
  const booking = result[0]!;

  if (booking.status !== 'confirmed') {
    return errorResponse('Nur bestätigte Termine können abgeschlossen werden.');
  }

  // Optimistic locking: Update NUR wenn status noch 'confirmed' ist
  const now = new Date().toISOString();
  const completeResult = await env.DB.prepare(
    `UPDATE bookings SET status = 'completed', updated_at = ? WHERE id = ? AND status = 'confirmed'`
  ).bind(now, bookingId).run();

  if (completeResult.meta.changes === 0) {
    return errorResponse('Buchung wurde bereits abgeschlossen oder ist nicht mehr bestätigt.');
  }

  // Award cashback points (only if not paid with points)
  if (!booking.paidWithPoints) {
    const service = getServiceById(booking.serviceId);
    if (service) {
      // 5% cashback: price in EUR * 100 (cents) * 0.05 = points
      const pointsEarned = Math.floor(service.price * 100 * CASHBACK_RATE);

      if (pointsEarned > 0) {
        await db.insert(pointsTransactions).values({
          id: generateId(),
          userId: booking.userId,
          bookingId,
          amount: pointsEarned,
          type: 'earned',
          description: `5% Cashback für ${service.name.de}`,
        });

        // Atomares Balance-Update via D1
        await env.DB.prepare(
          `UPDATE users SET points_balance = points_balance + ?, last_visit_at = ?, updated_at = ? WHERE id = ?`
        ).bind(pointsEarned, now, now, booking.userId).run();
      }
    }
  }

  return jsonResponse({ success: true });
}
