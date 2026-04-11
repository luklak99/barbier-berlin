import { env } from 'cloudflare:workers';
import type { APIContext } from 'astro';
import { and, eq } from 'drizzle-orm';
import { bookings } from '../../../db/schema';
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
import { sendBookingConfirmation } from '../../../lib/email';

export async function POST(context: APIContext) {
  const token = getSessionToken(context.request);
  if (!token) return errorResponse('Nicht angemeldet.', 401);

  const db = getDb(env.DB);
  const user = await validateSession(db, token);
  if (!user) return errorResponse('Sitzung abgelaufen.', 401);

  const body = await context.request.json();

  const serviceId = validateServiceId(body.serviceId);
  const date = validateDate(body.date);
  const startTime = validateTime(body.startTime);

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

  // Validate within opening hours
  const [h] = startTime.split(':').map(Number);
  const maxHour = bookingDate.getDay() === 6 ? 17 : 18;
  if (h! < 10 || h! >= maxHour) {
    return errorResponse(`Termine nur zwischen 10:00 und ${maxHour}:00 Uhr.`);
  }

  // Check for conflicts (simple overlap check)
  const existingBookings = await db
    .select()
    .from(bookings)
    .where(
      and(
        eq(bookings.date, date),
        eq(bookings.status, 'confirmed'),
      ),
    );

  const hasConflict = existingBookings.some((b) => {
    return startTime < b.endTime && endTime > b.startTime;
  });

  if (hasConflict) {
    return errorResponse('Dieser Zeitslot ist leider nicht verfügbar.');
  }

  const bookingId = generateId();
  await db.insert(bookings).values({
    id: bookingId,
    userId: user.id,
    serviceId,
    date,
    startTime,
    endTime,
    status: 'confirmed',
  });

  // E-Mail-Bestätigung (fire and forget)
  if (env.SMTP_USER && env.SMTP_PASS) {
    sendBookingConfirmation(env, {
      to: user.email,
      customerName: user.name,
      serviceName: service.name.de,
      date,
      startTime,
      endTime,
      price: service.price,
      bookingId,
    }).catch(() => {});
  }

  return jsonResponse({
    success: true,
    booking: { id: bookingId, serviceId, date, startTime, endTime, price: service.price },
  }, 201);
}
