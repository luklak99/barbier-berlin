import { env } from 'cloudflare:workers';
import type { APIContext } from 'astro';
import { eq } from 'drizzle-orm';
import { users } from '../../../db/schema';
import { generateTotpSecret, getTotpUri, verifyTotp } from '../../../lib/crypto';
import { getDb } from '../../../lib/db';
import { getSessionToken, validateSession } from '../../../lib/session';
import { validateTotpCode, jsonResponse, errorResponse } from '../../../lib/validation';

// GET: Generate a new TOTP secret and return the URI
export async function GET(context: APIContext) {
  const token = getSessionToken(context.request);
  if (!token) return errorResponse('Nicht angemeldet.', 401);

  const db = getDb(env.DB);
  const user = await validateSession(db, token);
  if (!user) return errorResponse('Sitzung abgelaufen.', 401);

  const secret = generateTotpSecret();
  const uri = getTotpUri(secret, user.email);

  // Store secret temporarily (not yet enabled)
  await db.update(users).set({ totpSecret: secret }).where(eq(users.id, user.id));

  return jsonResponse({ secret, uri });
}

// POST: Verify code and enable TOTP
export async function POST(context: APIContext) {
  const token = getSessionToken(context.request);
  if (!token) return errorResponse('Nicht angemeldet.', 401);

  const db = getDb(env.DB);
  const user = await validateSession(db, token);
  if (!user) return errorResponse('Sitzung abgelaufen.', 401);

  const body = await context.request.json();
  const code = validateTotpCode(body.code);
  if (!code) return errorResponse('Ungültiger Code.');

  // Get the stored secret
  const result = await db.select({ totpSecret: users.totpSecret }).from(users).where(eq(users.id, user.id)).limit(1);
  const secret = result[0]?.totpSecret;
  if (!secret) return errorResponse('Kein 2FA-Secret gefunden. Bitte neu einrichten.');

  const valid = await verifyTotp(secret, code);
  if (!valid) return errorResponse('Ungültiger Code. Bitte erneut versuchen.');

  await db.update(users).set({ totpEnabled: true }).where(eq(users.id, user.id));

  return jsonResponse({ success: true });
}
