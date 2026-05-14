import { env } from 'cloudflare:workers';
import type { APIContext } from 'astro';
import { and, eq } from 'drizzle-orm';
import { bookings, pointsTransactions, users } from '../../../db/schema';
import { generateId } from '../../../lib/crypto';
import { getDb } from '../../../lib/db';
import { getSessionToken, validateSession } from '../../../lib/session';
import { validateBookingId, jsonResponse, errorResponse } from '../../../lib/validation';
import { sendBookingCancellation, isMailConfigured } from '../../../lib/email';
import { getServiceById } from '../../../data/services';

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

  const lang = (['de', 'en', 'tr', 'ar'] as const).includes(body.lang as 'de' | 'en' | 'tr' | 'ar')
    ? (body.lang as 'de' | 'en' | 'tr' | 'ar')
    : ('de' as const);

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

  // Optimistic locking: Update NUR wenn status noch 'confirmed' ist
  const now = new Date().toISOString();
  const cancelResult = await env.DB.prepare(
    `UPDATE bookings SET status = 'cancelled', updated_at = ? WHERE id = ? AND user_id = ? AND status = 'confirmed'`
  ).bind(now, bookingId, user.id).run();

  if (cancelResult.meta.changes === 0) {
    return errorResponse('Buchung bereits storniert oder nicht gefunden.');
  }

  // Refund points if paid with points
  if (booking.paidWithPoints && booking.pointsUsed > 0) {
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
  const service = getServiceById(booking.serviceId);
  if (isMailConfigured(env) && service) {
    sendBookingCancellation(env, {
      to: user.email,
      customerName: user.name,
      serviceName: service.name.de,
      date: booking.date,
      startTime: booking.startTime,
      bookingId,
      lang,
    }).catch((err) => console.error('E-Mail fehlgeschlagen:', err));
  }

  return jsonResponse({ success: true });
}
