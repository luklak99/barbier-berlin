import { env } from 'cloudflare:workers';
import type { APIContext } from 'astro';
import { eq } from 'drizzle-orm';
import { users, emailVerificationTokens } from '../../../db/schema';
import { hashToken } from '../../../lib/crypto';
import { getDb } from '../../../lib/db';
import { jsonResponse, errorResponse } from '../../../lib/validation';

export async function POST(context: APIContext) {
  let body: Record<string, unknown>;
  try { body = await context.request.json(); } catch { return errorResponse('Ungültiger Request.', 400); }

  const token = typeof body.token === 'string' ? body.token : null;
  if (!token) return errorResponse('Token fehlt.');

  const db = getDb(env.DB);
  const tokenHash = await hashToken(token);

  const result = await db.select().from(emailVerificationTokens).where(eq(emailVerificationTokens.tokenHash, tokenHash)).limit(1);
  if (result.length === 0) return errorResponse('Ungültiger Verifizierungslink.', 400);

  const verifyToken = result[0]!;
  if (new Date(verifyToken.expiresAt) < new Date()) return errorResponse('Link abgelaufen.', 400);

  await db.update(users).set({ emailVerified: true, updatedAt: new Date().toISOString() }).where(eq(users.id, verifyToken.userId));
  await db.delete(emailVerificationTokens).where(eq(emailVerificationTokens.id, verifyToken.id));

  return jsonResponse({ success: true });
}
