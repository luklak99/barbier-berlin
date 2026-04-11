import { env } from 'cloudflare:workers';
import type { APIContext } from 'astro';
import { and, gt, lt, eq } from 'drizzle-orm';
import { users, pointsTransactions } from '../../../db/schema';
import { generateId } from '../../../lib/crypto';
import { getDb } from '../../../lib/db';
import { jsonResponse, errorResponse } from '../../../lib/validation';

export async function GET(context: APIContext) {
  const secret = context.request.headers.get('X-Cron-Secret') || new URL(context.request.url).searchParams.get('secret');
  if (!env.CRON_SECRET || secret !== env.CRON_SECRET) {
    return errorResponse('Unauthorized.', 401);
  }

  const db = getDb(env.DB);
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const cutoff = sixMonthsAgo.toISOString();

  // Find users with points > 0 whose last visit was > 6 months ago (or never visited)
  const expiredUsers = await db
    .select({ id: users.id, pointsBalance: users.pointsBalance, lastVisitAt: users.lastVisitAt })
    .from(users)
    .where(gt(users.pointsBalance, 0));

  let expired = 0;
  for (const user of expiredUsers) {
    if (user.lastVisitAt && user.lastVisitAt > cutoff) continue; // Still active
    if (!user.lastVisitAt || user.lastVisitAt < cutoff) {
      await db.insert(pointsTransactions).values({
        id: generateId(),
        userId: user.id,
        amount: -user.pointsBalance,
        type: 'expired',
        description: `Punkte verfallen (6 Monate ohne Besuch)`,
      });
      await db.update(users).set({ pointsBalance: 0, updatedAt: new Date().toISOString() }).where(eq(users.id, user.id));
      expired++;
    }
  }

  return jsonResponse({ success: true, checked: expiredUsers.length, expired });
}
