import { env } from 'cloudflare:workers';
import type { APIContext } from 'astro';
import { eq } from 'drizzle-orm';
import { users, passwordResetTokens } from '../../../db/schema';
import { generateId, generateSessionToken, hashToken } from '../../../lib/crypto';
import { getDb } from '../../../lib/db';
import { isMailConfigured, sendPasswordResetEmail } from '../../../lib/email';
import { validateEmail, jsonResponse, errorResponse } from '../../../lib/validation';

export async function POST(context: APIContext) {
  let body: Record<string, unknown>;
  try { body = await context.request.json(); } catch { return errorResponse('Ungültiger Request.', 400); }

  const email = validateEmail(body.email);
  if (!email) return errorResponse('Ungültige E-Mail-Adresse.');

  const db = getDb(env.DB);
  const result = await db.select({ id: users.id, name: users.name }).from(users).where(eq(users.email, email)).limit(1);

  // Always return success (no user enumeration)
  if (result.length > 0) {
    const user = result[0]!;
    const token = generateSessionToken();
    const tokenHash = await hashToken(token);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1h

    await db.insert(passwordResetTokens).values({
      id: generateId(),
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    // Send reset email (fire and forget)
    if (isMailConfigured(env)) {
      sendPasswordResetEmail(env, {
        to: email,
        customerName: user.name,
        resetUrl: `https://barbier.berlin/reset-password?token=${token}`,
      }).catch((err: unknown) => console.error('Reset-E-Mail fehlgeschlagen:', err));
    }
  }

  return jsonResponse({ success: true, message: 'Falls ein Konto existiert, wurde eine E-Mail gesendet.' });
}
