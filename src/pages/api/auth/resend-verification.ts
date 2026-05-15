import { env } from 'cloudflare:workers';
import type { APIContext } from 'astro';
import { eq } from 'drizzle-orm';
import { users, emailVerificationTokens } from '../../../db/schema';
import { generateId, generateSessionToken, hashToken } from '../../../lib/crypto';
import { getDb } from '../../../lib/db';
import { isMailConfigured, sendVerificationEmail } from '../../../lib/email';
import { validateEmail, jsonResponse, errorResponse } from '../../../lib/validation';

const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24h

export async function POST(context: APIContext) {
  let body: Record<string, unknown>;
  try { body = await context.request.json(); } catch { return errorResponse('Ungültiger Request.', 400); }

  const email = validateEmail(body.email);
  if (!email) return errorResponse('Ungültige E-Mail-Adresse.');

  const db = getDb(env.DB);

  // Generic success-Antwort, um keine User-Enumeration zuzulassen
  const respond = () => jsonResponse({
    success: true,
    message: 'Falls ein noch nicht verifiziertes Konto existiert, wurde eine neue Verifizierungs-E-Mail gesendet.',
  });

  if (!isMailConfigured(env)) return respond();

  const result = await db
    .select({ id: users.id, name: users.name, emailVerified: users.emailVerified })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (result.length === 0) return respond();
  const user = result[0]!;
  if (user.emailVerified) return respond();

  // Alte Tokens des Users löschen, neuen ausstellen
  await db.delete(emailVerificationTokens).where(eq(emailVerificationTokens.userId, user.id));

  const verifyToken = generateSessionToken();
  const verifyTokenHash = await hashToken(verifyToken);
  await db.insert(emailVerificationTokens).values({
    id: generateId(),
    userId: user.id,
    tokenHash: verifyTokenHash,
    expiresAt: new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS).toISOString(),
  });

  const verifyUrl = `https://barbier.berlin/verify-email?token=${verifyToken}`;
  sendVerificationEmail(env, { to: email, customerName: user.name, verifyUrl })
    .catch((err) => console.error('Resend-Verification fehlgeschlagen:', err));

  return respond();
}
