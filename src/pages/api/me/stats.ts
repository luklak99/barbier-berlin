import { env } from 'cloudflare:workers';
import type { APIContext } from 'astro';
import { eq, desc, sql } from 'drizzle-orm';
import { bookings, pointsTransactions, users } from '../../../db/schema';
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

  // Total visits
  const completedBookings = await db.select().from(bookings)
    .where(eq(bookings.userId, user.id));
  const completed = completedBookings.filter(b => b.status === 'completed');
  const totalVisits = completed.length;

  // Favorite service
  const serviceCounts: Record<string, number> = {};
  for (const b of completed) {
    serviceCounts[b.serviceId] = (serviceCounts[b.serviceId] || 0) + 1;
  }
  const favoriteServiceId = Object.entries(serviceCounts).sort(([, a], [, b]) => b - a)[0]?.[0];
  const favoriteService = favoriteServiceId ? getServiceById(favoriteServiceId) : null;

  // Total points earned
  const earnedTx = await db.select({ total: sql<number>`SUM(amount)` }).from(pointsTransactions)
    .where(eq(pointsTransactions.userId, user.id));
  const totalPointsEarned = earnedTx[0]?.total || 0;

  // Total money spent
  const totalSpent = completed.reduce((sum, b) => {
    const svc = getServiceById(b.serviceId);
    return sum + (svc?.price || 0);
  }, 0);

  // Points saved (redeemed)
  const redeemedTx = await db.select().from(pointsTransactions)
    .where(eq(pointsTransactions.userId, user.id));
  const totalRedeemed = redeemedTx.filter(t => t.type === 'redeemed').reduce((s, t) => s + Math.abs(t.amount), 0);

  // Next milestone (every 1000 points = free service tier)
  const pointsToNextReward = 1000 - (user.pointsBalance % 1000);

  // Member since
  const userRecord = await db.select({ createdAt: users.createdAt }).from(users).where(eq(users.id, user.id)).limit(1);

  // Referral code
  const referralRecord = await db.select({ referralCode: users.referralCode }).from(users).where(eq(users.id, user.id)).limit(1);

  return jsonResponse({
    totalVisits,
    favoriteService: favoriteService ? { name: favoriteService.name.de, count: serviceCounts[favoriteServiceId!] } : null,
    totalSpent,
    totalPointsEarned: Math.abs(totalPointsEarned),
    totalPointsRedeemed: totalRedeemed,
    currentBalance: user.pointsBalance,
    pointsToNextReward,
    memberSince: userRecord[0]?.createdAt || '',
    referralCode: referralRecord[0]?.referralCode || null,
  });
}
