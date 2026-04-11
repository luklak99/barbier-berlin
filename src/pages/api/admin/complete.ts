import type { APIContext } from 'astro';
import { eq } from 'drizzle-orm';
import { bookings, pointsTransactions, users } from '../../../db/schema';
import { generateId } from '../../../lib/crypto';
import { getDb } from '../../../lib/db';
import { getSessionToken, validateSession } from '../../../lib/session';
import { getServiceById } from '../../../data/services';
import { jsonResponse, errorResponse } from '../../../lib/validation';

const CASHBACK_RATE = 0.05; // 5%

export async function POST(context: APIContext) {
  const token = getSessionToken(context.request);
  if (!token) return errorResponse('Nicht angemeldet.', 401);

  const db = getDb(context.locals.runtime.env.DB);
  const admin = await validateSession(db, token);
  if (!admin || admin.role !== 'admin') return errorResponse('Keine Berechtigung.', 403);

  const body = await context.request.json();
  const bookingId = typeof body.bookingId === 'string' ? body.bookingId : null;
  if (!bookingId) return errorResponse('Buchungs-ID fehlt.');

  // Get booking
  const result = await db.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1);
  if (result.length === 0) return errorResponse('Buchung nicht gefunden.', 404);
  const booking = result[0]!;

  if (booking.status !== 'confirmed') {
    return errorResponse('Nur bestätigte Termine können abgeschlossen werden.');
  }

  // Mark as completed
  await db.update(bookings).set({
    status: 'completed',
    updatedAt: new Date().toISOString(),
  }).where(eq(bookings.id, bookingId));

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

        // Update user points balance
        const userResult = await db.select({ pointsBalance: users.pointsBalance }).from(users).where(eq(users.id, booking.userId)).limit(1);
        if (userResult[0]) {
          await db.update(users).set({
            pointsBalance: userResult[0].pointsBalance + pointsEarned,
            lastVisitAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }).where(eq(users.id, booking.userId));
        }
      }
    }
  }

  return jsonResponse({ success: true });
}
