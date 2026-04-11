import type { APIContext } from 'astro';
import { and, eq } from 'drizzle-orm';
import { bookings, pointsTransactions, users } from '../../../db/schema';
import { getDb } from '../../../lib/db';
import { getSessionToken, validateSession } from '../../../lib/session';
import { jsonResponse, errorResponse } from '../../../lib/validation';
import { sendBookingCancellation } from '../../../lib/email';
import { getServiceById } from '../../../data/services';

export async function POST(context: APIContext) {
  const token = getSessionToken(context.request);
  if (!token) return errorResponse('Nicht angemeldet.', 401);

  const db = getDb(context.locals.runtime.env.DB);
  const user = await validateSession(db, token);
  if (!user) return errorResponse('Sitzung abgelaufen.', 401);

  const body = await context.request.json();
  const bookingId = typeof body.bookingId === 'string' ? body.bookingId : null;
  if (!bookingId) return errorResponse('Buchungs-ID fehlt.');

  // Get the booking
  const result = await db
    .select()
    .from(bookings)
    .where(and(eq(bookings.id, bookingId), eq(bookings.userId, user.id)))
    .limit(1);

  if (result.length === 0) return errorResponse('Buchung nicht gefunden.', 404);
  const booking = result[0]!;

  if (booking.status !== 'confirmed') {
    return errorResponse('Diese Buchung kann nicht mehr storniert werden.');
  }

  // Check 24h cancellation policy
  const bookingDateTime = new Date(`${booking.date}T${booking.startTime}:00`);
  const hoursUntilBooking = (bookingDateTime.getTime() - Date.now()) / (1000 * 60 * 60);

  if (hoursUntilBooking < 24) {
    return errorResponse('Stornierung nur bis 24 Stunden vor dem Termin möglich.');
  }

  await db.update(bookings).set({ status: 'cancelled', updatedAt: new Date().toISOString() }).where(eq(bookings.id, bookingId));

  // Refund points if paid with points
  if (booking.paidWithPoints && booking.pointsUsed > 0) {
    const { generateId } = await import('../../../lib/crypto');
    await db.insert(pointsTransactions).values({
      id: generateId(),
      userId: user.id,
      bookingId,
      amount: booking.pointsUsed,
      type: 'earned',
      description: 'Punkte-Rückerstattung (Stornierung)',
    });
    await db
      .update(users)
      .set({ pointsBalance: user.pointsBalance + booking.pointsUsed })
      .where(eq(users.id, user.id));
  }

  // E-Mail-Bestätigung (fire and forget)
  const env = context.locals.runtime.env;
  const service = getServiceById(booking.serviceId);
  if (env.SMTP_USER && env.SMTP_PASS && service) {
    sendBookingCancellation(env, {
      to: user.email,
      customerName: user.name,
      serviceName: service.name.de,
      date: booking.date,
      startTime: booking.startTime,
      bookingId,
    }).catch(() => {});
  }

  return jsonResponse({ success: true });
}
