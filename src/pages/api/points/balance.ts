import { env } from 'cloudflare:workers';
import type { APIContext } from 'astro';
import { eq, desc } from 'drizzle-orm';
import { pointsTransactions, users } from '../../../db/schema';
import { getDb } from '../../../lib/db';
import { getSessionToken, validateSession } from '../../../lib/session';
import { jsonResponse, errorResponse } from '../../../lib/validation';

export async function GET(context: APIContext) {
  const token = getSessionToken(context.request);
  if (!token) return errorResponse('Nicht angemeldet.', 401);

  const db = getDb(env.DB);
  const user = await validateSession(db, token);
  if (!user) return errorResponse('Sitzung abgelaufen.', 401);

  const transactions = await db
    .select()
    .from(pointsTransactions)
    .where(eq(pointsTransactions.userId, user.id))
    .orderBy(desc(pointsTransactions.createdAt))
    .limit(50);

  return jsonResponse({
    balance: user.pointsBalance,
    valueEur: (user.pointsBalance / 100).toFixed(2),
    transactions,
  });
}
