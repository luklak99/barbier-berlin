import { env } from 'cloudflare:workers';
import type { APIContext } from 'astro';
import { and, eq } from 'drizzle-orm';
import { bookings, users } from '../../../db/schema';
import { getDb } from '../../../lib/db';
import { getServiceById } from '../../../data/services';
import { jsonResponse, errorResponse } from '../../../lib/validation';

export async function GET(context: APIContext) {
  // Verify cron secret
  const secret = context.request.headers.get('X-Cron-Secret') || new URL(context.request.url).searchParams.get('secret');
  if (!env.CRON_SECRET || secret !== env.CRON_SECRET) {
    return errorResponse('Unauthorized.', 401);
  }

  const db = getDb(env.DB);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0]!;

  const tomorrowBookings = await db
    .select({ booking: bookings, userName: users.name, userEmail: users.email })
    .from(bookings)
    .innerJoin(users, eq(bookings.userId, users.id))
    .where(and(eq(bookings.date, tomorrowStr), eq(bookings.status, 'confirmed')));

  let sent = 0;
  if (env.RELAY_SECRET) {
    const { sendBookingReminder } = await import('../../../lib/email');
    for (const { booking, userName, userEmail } of tomorrowBookings) {
      const service = getServiceById(booking.serviceId);
      if (!service) continue;
      try {
        await sendBookingReminder(env, {
          to: userEmail,
          customerName: userName,
          serviceName: service.name.de,
          date: booking.date,
          startTime: booking.startTime,
          endTime: booking.endTime,
          price: service.price,
        });
        sent++;
      } catch (err) {
        console.error(`Erinnerung fehlgeschlagen für ${userEmail}:`, err);
      }
    }
  }

  return jsonResponse({ success: true, reminders: tomorrowBookings.length, sent });
}
