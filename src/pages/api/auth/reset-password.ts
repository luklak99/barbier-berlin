import { env } from 'cloudflare:workers';
import type { APIContext } from 'astro';
import { eq } from 'drizzle-orm';
import { users, passwordResetTokens, sessions } from '../../../db/schema';
import { hashPassword, hashToken } from '../../../lib/crypto';
import { getDb } from '../../../lib/db';
import { validatePassword, jsonResponse, errorResponse } from '../../../lib/validation';

export async function POST(context: APIContext) {
  let body: Record<string, unknown>;
  try { body = await context.request.json(); } catch { return errorResponse('Ungültiger Request.', 400); }

  const token = typeof body.token === 'string' ? body.token : null;
  const newPassword = validatePassword(body.newPassword);
  if (!token) return errorResponse('Token fehlt.');
  if (!newPassword) return errorResponse('Passwort muss min. 10 Zeichen, 3 von 4 Kategorien (Groß/Klein/Zahl/Sonder).');

  const db = getDb(env.DB);
  const tokenHash = await hashToken(token);

  const result = await db.select().from(passwordResetTokens).where(eq(passwordResetTokens.tokenHash, tokenHash)).limit(1);
  if (result.length === 0) return errorResponse('Ungültiger oder abgelaufener Link.', 400);

  const resetToken = result[0]!;
  if (new Date(resetToken.expiresAt) < new Date()) return errorResponse('Link abgelaufen. Bitte erneut anfordern.', 400);
  if (resetToken.usedAt) return errorResponse('Dieser Link wurde bereits verwendet.', 400);

  const passwordHash = await hashPassword(newPassword);

  // Update password + mark token as used + delete all sessions
  await db.update(users).set({ passwordHash, updatedAt: new Date().toISOString() }).where(eq(users.id, resetToken.userId));
  await db.update(passwordResetTokens).set({ usedAt: new Date().toISOString() }).where(eq(passwordResetTokens.id, resetToken.id));
  await db.delete(sessions).where(eq(sessions.userId, resetToken.userId));

  return jsonResponse({ success: true, redirect: '/login' });
}
