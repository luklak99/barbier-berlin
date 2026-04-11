import { env } from 'cloudflare:workers';
import type { APIContext } from 'astro';
import { and, eq } from 'drizzle-orm';
import { bookings } from '../../../db/schema';
import { generateId } from '../../../lib/crypto';
import { getDb } from '../../../lib/db';
import { getSessionToken, validateSession } from '../../../lib/session';
import { getServiceById } from '../../../data/services';
import { validateBookingId, validateDate, validateTime, jsonResponse, errorResponse } from '../../../lib/validation';

export async function POST(context: APIContext) {
  const token = getSessionToken(context.request);
  if (!token) return errorResponse('Nicht angemeldet.', 401);

  const db = getDb(env.DB);
  const user = await validateSession(db, token);
  if (!user) return errorResponse('Sitzung abgelaufen.', 401);

  let body: Record<string, unknown>;
  try { body = await context.request.json(); } catch { return errorResponse('Ungültiger Request.', 400); }

  const bookingId = validateBookingId(body.bookingId);
  const newDate = validateDate(body.newDate);
  const newStartTime = validateTime(body.newStartTime);
  if (!bookingId) return errorResponse('Buchungs-ID fehlt.');
  if (!newDate) return errorResponse('Ungültiges Datum.');
  if (!newStartTime) return errorResponse('Ungültige Uhrzeit.');

  // Get existing booking
  const existing = await db.select().from(bookings)
    .where(and(eq(bookings.id, bookingId), eq(bookings.userId, user.id), eq(bookings.status, 'confirmed')))
    .limit(1);
  if (existing.length === 0) return errorResponse('Buchung nicht gefunden.', 404);
  const booking = existing[0]!;

  // 24h policy
  const oldDateTime = new Date(`${booking.date}T${booking.startTime}:00`);
  if ((oldDateTime.getTime() - Date.now()) / (1000 * 60 * 60) < 24) {
    return errorResponse('Umbuchung nur bis 24h vor dem Termin möglich.');
  }

  const service = getServiceById(booking.serviceId);
  if (!service) return errorResponse('Service nicht gefunden.');

  // Calculate new end time
  const [h, m] = newStartTime.split(':').map(Number);
  const totalMin = h! * 60 + m! + service.duration;
  const newEndTime = `${Math.floor(totalMin / 60).toString().padStart(2, '0')}:${(totalMin % 60).toString().padStart(2, '0')}`;

  // Atomically: cancel old + insert new if slot available
  const newBookingId = generateId();
  const cancelResult = await env.DB.prepare(
    `UPDATE bookings SET status = 'cancelled', updated_at = ? WHERE id = ? AND user_id = ? AND status = 'confirmed'`
  ).bind(new Date().toISOString(), bookingId, user.id).run();

  if (cancelResult.meta.changes === 0) return errorResponse('Buchung konnte nicht umgebucht werden.');

  const insertResult = await env.DB.prepare(`
    INSERT INTO bookings (id, user_id, service_id, date, start_time, end_time, status, created_at, updated_at)
    SELECT ?, ?, ?, ?, ?, ?, 'confirmed', datetime(), datetime()
    WHERE NOT EXISTS (
      SELECT 1 FROM bookings WHERE date = ? AND status = 'confirmed' AND start_time < ? AND end_time > ?
    )
  `).bind(newBookingId, user.id, booking.serviceId, newDate, newStartTime, newEndTime, newDate, newEndTime, newStartTime).run();

  if (insertResult.meta.changes === 0) {
    // Rollback: re-confirm old booking
    await env.DB.prepare(`UPDATE bookings SET status = 'confirmed', updated_at = ? WHERE id = ?`)
      .bind(new Date().toISOString(), bookingId).run();
    return errorResponse('Neuer Zeitslot ist nicht verfügbar.');
  }

  return jsonResponse({ success: true, booking: { id: newBookingId, date: newDate, startTime: newStartTime, endTime: newEndTime } });
}
