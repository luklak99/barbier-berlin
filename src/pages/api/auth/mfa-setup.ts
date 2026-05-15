import { env } from 'cloudflare:workers';
import type { APIContext } from 'astro';
import { eq } from 'drizzle-orm';
import { users } from '../../../db/schema';
import {
  decryptSecret,
  encryptSecret,
  generateTotpSecret,
  getTotpUri,
  isEncryptedSecret,
  verifyTotp,
} from '../../../lib/crypto';
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

  if (!env.TOTP_ENCRYPTION_KEY) {
    return errorResponse('2FA serverseitig nicht konfiguriert (Master-Key fehlt).', 500);
  }

  if (user.totpEnabled) {
    return errorResponse('2FA ist bereits aktiviert. Bitte zuerst deaktivieren.');
  }

  const secret = generateTotpSecret();
  const uri = getTotpUri(secret, user.email);

  // Encrypt at rest before persisting
  const encrypted = await encryptSecret(secret, env.TOTP_ENCRYPTION_KEY);
  await db.update(users).set({ totpSecret: encrypted }).where(eq(users.id, user.id));

  return jsonResponse({ secret, uri });
}

// POST: Verify code and enable TOTP
export async function POST(context: APIContext) {
  const token = getSessionToken(context.request);
  if (!token) return errorResponse('Nicht angemeldet.', 401);

  const db = getDb(env.DB);
  const user = await validateSession(db, token);
  if (!user) return errorResponse('Sitzung abgelaufen.', 401);

  if (!env.TOTP_ENCRYPTION_KEY) {
    return errorResponse('2FA serverseitig nicht konfiguriert (Master-Key fehlt).', 500);
  }

  let body: Record<string, unknown>;
  try {
    body = await context.request.json();
  } catch {
    return errorResponse('Ungültiger Request-Body.', 400);
  }

  const code = validateTotpCode(body.code);
  if (!code) return errorResponse('Ungültiger Code.');

  const result = await db.select({ totpSecret: users.totpSecret }).from(users).where(eq(users.id, user.id)).limit(1);
  const stored = result[0]?.totpSecret;
  if (!stored) return errorResponse('Kein 2FA-Secret gefunden. Bitte neu einrichten.');

  const secret = isEncryptedSecret(stored) ? await decryptSecret(stored, env.TOTP_ENCRYPTION_KEY) : stored;

  const valid = await verifyTotp(secret, code);
  if (!valid) return errorResponse('Ungültiger Code. Bitte erneut versuchen.');

  // Legacy-Migration: wenn Secret unverschlüsselt war, jetzt verschlüsselt nachspeichern
  if (!isEncryptedSecret(stored)) {
    const encrypted = await encryptSecret(secret, env.TOTP_ENCRYPTION_KEY);
    await db.update(users).set({ totpSecret: encrypted, totpEnabled: true }).where(eq(users.id, user.id));
  } else {
    await db.update(users).set({ totpEnabled: true }).where(eq(users.id, user.id));
  }

  return jsonResponse({ success: true });
}
