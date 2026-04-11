import { env } from 'cloudflare:workers';
import type { APIContext } from 'astro';
import { eq } from 'drizzle-orm';
import { users } from '../../../db/schema';
import { verifyPassword, verifyTotp } from '../../../lib/crypto';
import { getDb } from '../../../lib/db';
import { createSession, sessionCookie } from '../../../lib/session';
import {
  validateEmail,
  validatePassword,
  validateTotpCode,
  jsonResponse,
  errorResponse,
} from '../../../lib/validation';

export async function POST(context: APIContext) {
  try {
    const body = await context.request.json();
    const email = validateEmail(body.email);
    const password = validatePassword(body.password);

    if (!email || !password) {
      return errorResponse('E-Mail und Passwort sind erforderlich.');
    }

    const db = getDb(env.DB);

    const result = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (result.length === 0) {
      return errorResponse('Ungültige E-Mail oder Passwort.', 401);
    }

    const user = result[0]!;
    const passwordValid = await verifyPassword(password, user.passwordHash);

    if (!passwordValid) {
      return errorResponse('Ungültige E-Mail oder Passwort.', 401);
    }

    // Check MFA if enabled
    if (user.totpEnabled && user.totpSecret) {
      const mfaCode = validateTotpCode(body.mfaCode);

      if (!mfaCode) {
        return jsonResponse({ requireMfa: true }, 200);
      }

      const mfaValid = await verifyTotp(user.totpSecret, mfaCode);
      if (!mfaValid) {
        return errorResponse('Ungültiger 2FA-Code.', 401);
      }
    }

    const token = await createSession(db, user.id);

    const redirect = user.role === 'admin' ? '/admin' : '/dashboard';

    return jsonResponse(
      { success: true, redirect },
      200,
      { 'Set-Cookie': sessionCookie(token) },
    );
  } catch {
    return errorResponse('Anmeldung fehlgeschlagen.', 500);
  }
}
