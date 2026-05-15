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

  // Validate new slot: not in past, not Sunday, within opening hours
  const newDateTime = new Date(`${newDate}T${newStartTime}:00`);
  if (newDateTime <= new Date()) return errorResponse('Termine können nur in der Zukunft gebucht werden.');
  if (newDateTime.getDay() === 0) return errorResponse('Sonntags geschlossen.');
  const closingHour = newDateTime.getDay() === 6 ? 17 : 18;
  const startMin = h! * 60 + m!;
  if (startMin < 10 * 60 || totalMin > closingHour * 60) {
    return errorResponse(`Termine nur zwischen 10:00 und ${closingHour}:00 Uhr.`);
  }

  // Atomare Umbuchung: NEUER Slot wird ZUERST reserviert (mit Conflict-Check gegen
  // bookings UND guest_bookings, aber excluding-self für den eigenen alten Booking),
  // erst danach wird der alte storniert. So gibt es nie ein Window in dem der Slot
  // freigegeben wurde aber jemand anders reinrutschen könnte.
  const newBookingId = generateId();
  const insertResult = await env.DB.prepare(`
    INSERT INTO bookings (id, user_id, service_id, date, start_time, end_time, status)
    SELECT ?, ?, ?, ?, ?, ?, 'confirmed'
    WHERE NOT EXISTS (
      SELECT 1 FROM bookings
      WHERE id != ? AND date = ? AND status = 'confirmed'
      AND start_time < ? AND end_time > ?
    ) AND NOT EXISTS (
      SELECT 1 FROM guest_bookings
      WHERE date = ? AND status = 'confirmed'
      AND start_time < ? AND end_time > ?
    )
  `).bind(
    newBookingId, user.id, booking.serviceId, newDate, newStartTime, newEndTime,
    bookingId, newDate, newEndTime, newStartTime,
    newDate, newEndTime, newStartTime,
  ).run();

  if (insertResult.meta.changes === 0) {
    return errorResponse('Neuer Zeitslot ist nicht verfügbar.');
  }

  // Alten Slot stornieren — wenn das fehlschlägt, neu eingefügte Buchung wieder entfernen
  const cancelResult = await env.DB.prepare(
    `UPDATE bookings SET status = 'cancelled', updated_at = datetime() WHERE id = ? AND user_id = ? AND status = 'confirmed'`
  ).bind(bookingId, user.id).run();

  if (cancelResult.meta.changes === 0) {
    await env.DB.prepare(`DELETE FROM bookings WHERE id = ?`).bind(newBookingId).run();
    return errorResponse('Buchung konnte nicht umgebucht werden.');
  }

  return jsonResponse({ success: true, booking: { id: newBookingId, date: newDate, startTime: newStartTime, endTime: newEndTime } });
}
