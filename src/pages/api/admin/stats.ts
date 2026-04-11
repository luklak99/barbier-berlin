import { env } from 'cloudflare:workers';
import type { APIContext } from 'astro';
import { eq, desc, and, gte, sql } from 'drizzle-orm';
import { bookings, users, pointsTransactions, reviews } from '../../../db/schema';
import { getDb } from '../../../lib/db';
import { getSessionToken, validateSession } from '../../../lib/session';
import { getServiceById } from '../../../data/services';
import { jsonResponse, errorResponse } from '../../../lib/validation';

export async function GET(context: APIContext) {
  const token = getSessionToken(context.request);
  if (!token) return errorResponse('Nicht angemeldet.', 401);

  const db = getDb(env.DB);
  const admin = await validateSession(db, token);
  if (!admin || admin.role !== 'admin') return errorResponse('Keine Berechtigung.', 403);

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0]!;

  // Last 7 days
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0]!;

  // Last 30 days
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0]!;

  // Bookings today
  const todayBookings = await db.select().from(bookings).where(eq(bookings.date, todayStr));
  const todayConfirmed = todayBookings.filter(b => b.status === 'confirmed' || b.status === 'completed');
  const todayRevenue = todayConfirmed.reduce((sum, b) => {
    if (b.paidWithPoints) return sum;
    const svc = getServiceById(b.serviceId);
    return sum + (svc?.price || 0);
  }, 0);

  // Revenue per day (last 7 days)
  const weekBookings = await db.select().from(bookings).where(gte(bookings.date, sevenDaysAgoStr));
  const revenueByDay: Record<string, number> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    revenueByDay[d.toISOString().split('T')[0]!] = 0;
  }
  for (const b of weekBookings) {
    if (b.status === 'cancelled' || b.paidWithPoints) continue;
    const svc = getServiceById(b.serviceId);
    if (svc && revenueByDay[b.date] !== undefined) {
      revenueByDay[b.date]! += svc.price;
    }
  }

  // Popular services (last 30 days)
  const monthBookings = await db.select().from(bookings).where(gte(bookings.date, thirtyDaysAgoStr));
  const serviceCounts: Record<string, { name: string; count: number; revenue: number }> = {};
  for (const b of monthBookings) {
    if (b.status === 'cancelled') continue;
    const svc = getServiceById(b.serviceId);
    if (!svc) continue;
    if (!serviceCounts[b.serviceId]) {
      serviceCounts[b.serviceId] = { name: svc.name.de, count: 0, revenue: 0 };
    }
    serviceCounts[b.serviceId]!.count++;
    if (!b.paidWithPoints) serviceCounts[b.serviceId]!.revenue += svc.price;
  }
  const topServices = Object.values(serviceCounts).sort((a, b) => b.count - a.count).slice(0, 5);

  // Bookings per time slot (last 30 days) for heatmap
  const slotCounts: Record<string, number> = {};
  for (const b of monthBookings) {
    if (b.status === 'cancelled') continue;
    const hour = b.startTime.split(':')[0]!;
    slotCounts[hour] = (slotCounts[hour] || 0) + 1;
  }

  // Customer stats
  const totalCustomers = await db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.role, 'customer'));
  const totalReviews = await db.select({ count: sql<number>`count(*)` }).from(reviews);

  // Week revenue total
  const weekRevenue = Object.values(revenueByDay).reduce((a, b) => a + b, 0);

  // Month bookings count
  const monthBookingCount = monthBookings.filter(b => b.status !== 'cancelled').length;

  return jsonResponse({
    today: {
      bookings: todayBookings.length,
      confirmed: todayConfirmed.length,
      revenue: todayRevenue,
      pointsPaid: todayConfirmed.filter(b => b.paidWithPoints).length,
    },
    week: {
      revenue: weekRevenue,
      revenueByDay,
    },
    month: {
      bookings: monthBookingCount,
      topServices,
      slotHeatmap: slotCounts,
    },
    totals: {
      customers: totalCustomers[0]?.count || 0,
      reviews: totalReviews[0]?.count || 0,
    },
  });
}
