import { env } from 'cloudflare:workers';
import type { APIContext } from 'astro';
import { eq } from 'drizzle-orm';
import { users } from '../../../db/schema';
import { decryptSecret, isEncryptedSecret, verifyPassword, verifyTotp } from '../../../lib/crypto';
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
    let body: Record<string, unknown>;
    try {
      body = await context.request.json();
    } catch {
      return errorResponse('Ungültiger Request-Body.', 400);
    }

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
      // Brute-Force-Schutz: Delay bei ungültigen Credentials
      await new Promise(r => setTimeout(r, 1000));
      return errorResponse('Ungültige E-Mail oder Passwort.', 401);
    }

    const user = result[0]!;
    const passwordValid = await verifyPassword(password, user.passwordHash);

    if (!passwordValid) {
      // Brute-Force-Schutz: Delay bei falschem Passwort
      await new Promise(r => setTimeout(r, 1000));
      return errorResponse('Ungültige E-Mail oder Passwort.', 401);
    }

    // E-Mail muss bestätigt sein — Hinweis erst NACH Passwortprüfung, damit das
    // keine User-Enumeration ermöglicht (Antwort hängt vom korrekten Passwort ab).
    if (!user.emailVerified) {
      return errorResponse(
        'Bitte bestätigen Sie Ihre E-Mail-Adresse über den zugesandten Link, bevor Sie sich anmelden.',
        403,
      );
    }

    // Check MFA if enabled
    if (user.totpEnabled && user.totpSecret) {
      const mfaCode = validateTotpCode(body.mfaCode);

      if (!mfaCode) {
        return jsonResponse({ requireMfa: true }, 200);
      }

      if (!env.TOTP_ENCRYPTION_KEY && isEncryptedSecret(user.totpSecret)) {
        return errorResponse('2FA serverseitig nicht konfiguriert.', 500);
      }
      const secret = isEncryptedSecret(user.totpSecret)
        ? await decryptSecret(user.totpSecret, env.TOTP_ENCRYPTION_KEY)
        : user.totpSecret;

      const mfaValid = await verifyTotp(secret, mfaCode);
      if (!mfaValid) {
        // Brute-Force-Schutz: Delay bei falschem MFA-Code
        await new Promise(r => setTimeout(r, 1000));
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
