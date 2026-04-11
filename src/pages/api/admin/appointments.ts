import type { APIContext } from 'astro';
import { eq, desc, and } from 'drizzle-orm';
import { bookings, users } from '../../../db/schema';
import { getDb } from '../../../lib/db';
import { getSessionToken, validateSession } from '../../../lib/session';
import { getServiceById } from '../../../data/services';
import { jsonResponse, errorResponse, validateDate } from '../../../lib/validation';

export async function GET(context: APIContext) {
  const token = getSessionToken(context.request);
  if (!token) return errorResponse('Nicht angemeldet.', 401);

  const db = getDb(context.locals.runtime.env.DB);
  const user = await validateSession(db, token);
  if (!user || user.role !== 'admin') return errorResponse('Keine Berechtigung.', 403);

  const url = new URL(context.request.url);
  const date = validateDate(url.searchParams.get('date'));

  let query = db
    .select({
      booking: bookings,
      customerName: users.name,
      customerEmail: users.email,
      customerPhone: users.phone,
    })
    .from(bookings)
    .innerJoin(users, eq(bookings.userId, users.id))
    .orderBy(desc(bookings.date));

  const results = date
    ? await query.where(eq(bookings.date, date))
    : await query.limit(100);

  const enriched = results.map((r) => {
    const service = getServiceById(r.booking.serviceId);
    return {
      ...r.booking,
      serviceName: service?.name.de ?? r.booking.serviceId,
      servicePrice: service?.price ?? 0,
      customerName: r.customerName,
      customerEmail: r.customerEmail,
      customerPhone: r.customerPhone,
    };
  });

  return jsonResponse({ appointments: enriched });
}
