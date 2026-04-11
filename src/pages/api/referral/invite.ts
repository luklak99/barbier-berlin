import { env } from 'cloudflare:workers';
import type { APIContext } from 'astro';
import { eq } from 'drizzle-orm';
import { users } from '../../../db/schema';
import { generateId } from '../../../lib/crypto';
import { getDb } from '../../../lib/db';
import { getSessionToken, validateSession } from '../../../lib/session';
import { jsonResponse, errorResponse } from '../../../lib/validation';

export async function GET(context: APIContext) {
  const token = getSessionToken(context.request);
  if (!token) return errorResponse('Nicht angemeldet.', 401);

  const db = getDb(env.DB);
  const user = await validateSession(db, token);
  if (!user) return errorResponse('Sitzung abgelaufen.', 401);

  // Get or create referral code
  const userRecord = await db.select({ referralCode: users.referralCode }).from(users).where(eq(users.id, user.id)).limit(1);
  let code = userRecord[0]?.referralCode;

  if (!code) {
    code = generateId().slice(0, 8).toUpperCase();
    await db.update(users).set({ referralCode: code }).where(eq(users.id, user.id));
  }

  const inviteUrl = `https://barbier.berlin/register?ref=${code}`;

  return jsonResponse({
    referralCode: code,
    inviteUrl,
    whatsappUrl: `https://wa.me/?text=${encodeURIComponent(`Komm zu Barbier Berlin! Wir bekommen beide 500 Bonuspunkte: ${inviteUrl}`)}`,
  });
}
