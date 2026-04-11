import { env } from 'cloudflare:workers';
import type { APIContext } from 'astro';
import { eq, desc } from 'drizzle-orm';
import { bookings, users } from '../../../db/schema';
import { getDb } from '../../../lib/db';
import { getSessionToken, validateSession } from '../../../lib/session';
import { getServiceById } from '../../../data/services';
import { errorResponse } from '../../../lib/validation';

export async function GET(context: APIContext) {
  const token = getSessionToken(context.request);
  if (!token) return errorResponse('Nicht angemeldet.', 401);

  const db = getDb(env.DB);
  const admin = await validateSession(db, token);
  if (!admin || admin.role !== 'admin') return errorResponse('Keine Berechtigung.', 403);

  const url = new URL(context.request.url);
  const type = url.searchParams.get('type') || 'bookings';

  console.log(`[AUDIT] Admin ${admin.id} exportiert ${type}`);

  if (type === 'bookings') {
    const allBookings = await db
      .select({ booking: bookings, customerName: users.name, customerEmail: users.email })
      .from(bookings)
      .innerJoin(users, eq(bookings.userId, users.id))
      .orderBy(desc(bookings.date))
      .limit(1000);

    const csv = [
      'Datum,Uhrzeit,Kunde,E-Mail,Service,Preis,Status,Bezahlt mit Punkten',
      ...allBookings.map(({ booking: b, customerName, customerEmail }) => {
        const service = getServiceById(b.serviceId);
        return `${b.date},${b.startTime},${customerName},${customerEmail},${service?.name.de || b.serviceId},${service?.price || 0}€,${b.status},${b.paidWithPoints ? 'Ja' : 'Nein'}`;
      }),
    ].join('\n');

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="barbier-berlin-termine-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  }

  if (type === 'customers') {
    const allUsers = await db.select({
      name: users.name,
      email: users.email,
      phone: users.phone,
      pointsBalance: users.pointsBalance,
      lastVisitAt: users.lastVisitAt,
      createdAt: users.createdAt,
    }).from(users).where(eq(users.role, 'customer')).limit(5000);

    const csv = [
      'Name,E-Mail,Telefon,Punkte,Letzter Besuch,Registriert',
      ...allUsers.map(u => `${u.name},${u.email},${u.phone || ''},${u.pointsBalance},${u.lastVisitAt || ''},${u.createdAt}`),
    ].join('\n');

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="barbier-berlin-kunden-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  }

  return errorResponse('Unbekannter Export-Typ. Verwende ?type=bookings oder ?type=customers');
}
