import { env } from 'cloudflare:workers';
import type { APIContext } from 'astro';
import { generateId } from '../../../lib/crypto';
import { getDb } from '../../../lib/db';
import { getSessionToken, validateSession } from '../../../lib/session';
import { getServiceById } from '../../../data/services';
import {
  validateServiceId,
  validateDate,
  validateTime,
  jsonResponse,
  errorResponse,
} from '../../../lib/validation';
import { sendBookingConfirmation, isMailConfigured } from '../../../lib/email';

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

  const serviceId = validateServiceId(body.serviceId);
  const date = validateDate(body.date);
  const startTime = validateTime(body.startTime);
  const lang = (['de', 'en', 'tr', 'ar'] as const).includes(body.lang as 'de' | 'en' | 'tr' | 'ar')
    ? (body.lang as 'de' | 'en' | 'tr' | 'ar')
    : ('de' as const);

  if (!serviceId) return errorResponse('Ungültiger Service.');
  if (!date) return errorResponse('Ungültiges Datum.');
  if (!startTime) return errorResponse('Ungültige Uhrzeit.');

  const service = getServiceById(serviceId);
  if (!service) return errorResponse('Service nicht gefunden.');

  // Calculate end time
  const [startH, startM] = startTime.split(':').map(Number);
  const totalMinutes = startH! * 60 + startM! + service.duration;
  const endH = Math.floor(totalMinutes / 60);
  const endM = totalMinutes % 60;
  const endTime = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;

  // Validate booking date is in the future
  const bookingDate = new Date(`${date}T${startTime}:00`);
  if (bookingDate <= new Date()) {
    return errorResponse('Termine können nur in der Zukunft gebucht werden.');
  }

  // Validate not on Sunday
  if (bookingDate.getDay() === 0) {
    return errorResponse('Sonntags geschlossen.');
  }

  // Validate within opening hours — Start UND End müssen drin liegen
  const closingHour = bookingDate.getDay() === 6 ? 17 : 18;
  const startMin = startH! * 60 + startM!;
  const endMin = totalMinutes;
  if (startMin < 10 * 60 || endMin > closingHour * 60) {
    return errorResponse(`Termine nur zwischen 10:00 und ${closingHour}:00 Uhr.`);
  }

  // Atomare Konfliktprüfung + INSERT — prüft sowohl bookings ALS AUCH guest_bookings
  const bookingId = generateId();
  const result = await env.DB.prepare(`
    INSERT INTO bookings (id, user_id, service_id, date, start_time, end_time, status, paid_with_points, points_used, is_walk_in)
    SELECT ?, ?, ?, ?, ?, ?, 'confirmed', 0, 0, 0
    WHERE NOT EXISTS (
      SELECT 1 FROM bookings
      WHERE date = ? AND status = 'confirmed'
      AND start_time < ? AND end_time > ?
    ) AND NOT EXISTS (
      SELECT 1 FROM guest_bookings
      WHERE date = ? AND status = 'confirmed'
      AND start_time < ? AND end_time > ?
    )
  `).bind(
    bookingId, user.id, serviceId, date, startTime, endTime,
    date, endTime, startTime,
    date, endTime, startTime,
  ).run();

  if (result.meta.changes === 0) {
    return errorResponse('Dieser Zeitslot ist leider nicht verfügbar.');
  }

  // E-Mail-Bestätigung (fire and forget)
  if (isMailConfigured(env)) {
    sendBookingConfirmation(env, {
      to: user.email,
      customerName: user.name,
      serviceName: service.name.de,
      date,
      startTime,
      endTime,
      price: service.price,
      bookingId,
      lang,
    }).catch((err) => console.error('E-Mail fehlgeschlagen:', err));
  }

  return jsonResponse({
    success: true,
    booking: { id: bookingId, serviceId, date, startTime, endTime, price: service.price },
  }, 201);
}
