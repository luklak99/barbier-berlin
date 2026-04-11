import { env } from 'cloudflare:workers';
import type { APIContext } from 'astro';
import { and, eq, lt } from 'drizzle-orm';
import { bookings, users, settings } from '../../../db/schema';
import { getDb } from '../../../lib/db';
import { jsonResponse, errorResponse } from '../../../lib/validation';

export async function GET(context: APIContext) {
  const secret = context.request.headers.get('X-Cron-Secret') || new URL(context.request.url).searchParams.get('secret');
  if (!env.CRON_SECRET || secret !== env.CRON_SECRET) return errorResponse('Unauthorized.', 401);

  const db = getDb(env.DB);

  // Check if feature is enabled
  const setting = await db.select().from(settings).where(eq(settings.key, 'noshow_detection')).limit(1);
  if (setting[0]?.value === 'false') return jsonResponse({ success: true, message: 'No-Show-Erkennung deaktiviert.', processed: 0 });

  const thresholdSetting = await db.select().from(settings).where(eq(settings.key, 'noshow_threshold')).limit(1);
  const threshold = parseInt(thresholdSetting[0]?.value || '3', 10);

  // Find confirmed bookings from the past (> 2 hours ago)
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
  const cutoffDate = twoHoursAgo.toISOString().split('T')[0]!;
  const cutoffTime = `${twoHoursAgo.getHours().toString().padStart(2, '0')}:${twoHoursAgo.getMinutes().toString().padStart(2, '0')}`;

  // Get bookings that are still 'confirmed' but should be completed by now
  const overdueBookings = await db.select().from(bookings)
    .where(and(eq(bookings.status, 'confirmed'), lt(bookings.date, cutoffDate)));

  // Also check today's bookings where endTime < cutoffTime
  const todayOverdue = await db.select().from(bookings)
    .where(and(eq(bookings.status, 'confirmed'), eq(bookings.date, cutoffDate), lt(bookings.endTime, cutoffTime)));

  const allOverdue = [...overdueBookings, ...todayOverdue];
  let processed = 0;
  let blocked = 0;

  for (const booking of allOverdue) {
    // Mark as no_show
    await env.DB.prepare(`UPDATE bookings SET status = 'no_show', updated_at = datetime() WHERE id = ? AND status = 'confirmed'`)
      .bind(booking.id).run();

    // Increment no_show_count
    await env.DB.prepare(`UPDATE users SET no_show_count = no_show_count + 1, updated_at = datetime() WHERE id = ?`)
      .bind(booking.userId).run();

    // Check if threshold reached
    const user = await db.select({ noShowCount: users.noShowCount }).from(users).where(eq(users.id, booking.userId)).limit(1);
    if (user[0] && user[0].noShowCount >= threshold) {
      await env.DB.prepare(`UPDATE users SET booking_blocked = 1, updated_at = datetime() WHERE id = ?`)
        .bind(booking.userId).run();
      blocked++;
    }
    processed++;
  }

  return jsonResponse({ success: true, processed, blocked, threshold });
}
