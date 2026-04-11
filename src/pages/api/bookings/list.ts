import { env } from 'cloudflare:workers';
import type { APIContext } from 'astro';
import { eq, desc } from 'drizzle-orm';
import { bookings } from '../../../db/schema';
import { getDb } from '../../../lib/db';
import { getSessionToken, validateSession } from '../../../lib/session';
import { getServiceById } from '../../../data/services';
import { jsonResponse, errorResponse } from '../../../lib/validation';

export async function GET(context: APIContext) {
  const token = getSessionToken(context.request);
  if (!token) return errorResponse('Nicht angemeldet.', 401);

  const db = getDb(env.DB);
  const user = await validateSession(db, token);
  if (!user) return errorResponse('Sitzung abgelaufen.', 401);

  const userBookings = await db
    .select()
    .from(bookings)
    .where(eq(bookings.userId, user.id))
    .orderBy(desc(bookings.date));

  const enriched = userBookings.map((b) => {
    const service = getServiceById(b.serviceId);
    return {
      id: b.id,
      serviceId: b.serviceId,
      date: b.date,
      startTime: b.startTime,
      endTime: b.endTime,
      status: b.status,
      paidWithPoints: b.paidWithPoints,
      pointsUsed: b.pointsUsed,
      serviceName: service?.name.de ?? b.serviceId,
      servicePrice: service?.price ?? 0,
    };
  });

  return jsonResponse({ bookings: enriched });
}
