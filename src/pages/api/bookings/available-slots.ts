import type { APIContext } from 'astro';
import { and, eq } from 'drizzle-orm';
import { bookings } from '../../../db/schema';
import { getDb } from '../../../lib/db';
import { getServiceById } from '../../../data/services';
import { validateDate, validateServiceId, jsonResponse, errorResponse } from '../../../lib/validation';

export async function GET(context: APIContext) {
  const url = new URL(context.request.url);
  const date = validateDate(url.searchParams.get('date'));
  const serviceId = validateServiceId(url.searchParams.get('serviceId'));

  if (!date) return errorResponse('Ungültiges Datum.');
  if (!serviceId) return errorResponse('Ungültiger Service.');

  const service = getServiceById(serviceId);
  if (!service) return errorResponse('Service nicht gefunden.');

  const requestDate = new Date(date);
  const dayOfWeek = requestDate.getDay();

  // Closed on Sunday
  if (dayOfWeek === 0) {
    return jsonResponse({ slots: [] });
  }

  // Determine closing hour
  const closingHour = dayOfWeek === 6 ? 17 : 18;
  const openingHour = 10;

  const db = getDb(context.locals.runtime.env.DB);

  // Get existing bookings for this date
  const existing = await db
    .select({ startTime: bookings.startTime, endTime: bookings.endTime })
    .from(bookings)
    .where(and(eq(bookings.date, date), eq(bookings.status, 'confirmed')));

  // Generate 30-minute slots
  const slots: { time: string; available: boolean }[] = [];
  for (let h = openingHour; h < closingHour; h++) {
    for (const m of [0, 30]) {
      const slotStart = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      const totalEnd = h * 60 + m + service.duration;
      const endH = Math.floor(totalEnd / 60);
      const endM = totalEnd % 60;
      const slotEnd = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;

      // Check if slot ends within opening hours
      if (endH > closingHour || (endH === closingHour && endM > 0)) continue;

      // Check if slot is in the past
      const slotDateTime = new Date(`${date}T${slotStart}:00`);
      if (slotDateTime <= new Date()) {
        slots.push({ time: slotStart, available: false });
        continue;
      }

      // Check for conflicts
      const hasConflict = existing.some((b) => slotStart < b.endTime && slotEnd > b.startTime);
      slots.push({ time: slotStart, available: !hasConflict });
    }
  }

  return jsonResponse({ slots, service: { name: service.name.de, price: service.price, duration: service.duration } });
}
