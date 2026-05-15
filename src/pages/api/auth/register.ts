import { env } from 'cloudflare:workers';
import type { APIContext } from 'astro';
import { eq } from 'drizzle-orm';
import { users, emailVerificationTokens } from '../../../db/schema';
import { generateId, generateSessionToken, hashPassword, hashToken } from '../../../lib/crypto';
import { getDb } from '../../../lib/db';
import {
  validateEmail,
  validatePassword,
  validateName,
  validatePhone,
  jsonResponse,
  errorResponse,
} from '../../../lib/validation';
import { sendVerificationEmail, sendWelcomeEmail, isMailConfigured } from '../../../lib/email';

const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24h

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
    const name = validateName(body.name);
    const phone = validatePhone(body.phone);

    if (!email) return errorResponse('Ungültige E-Mail-Adresse.');
    if (!password) return errorResponse('Passwort muss mindestens 8 Zeichen lang sein.');
    if (!name) return errorResponse('Name ist erforderlich.');

    const db = getDb(env.DB);

    // Existence check + Insert: bei UNIQUE-Konflikt fängt der INSERT die Race-Condition.
    const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
    if (existing.length > 0) {
      return errorResponse('Ein Konto mit dieser E-Mail existiert bereits.');
    }

    const passwordHash = await hashPassword(password);
    const userId = generateId();
    const now = new Date().toISOString();

    // Dev-Bypass: ohne Mail-Config wird sofort auto-verifiziert (lokales Testing).
    // In Production ist Mail konfiguriert → User muss Link aus Mail klicken.
    const mailConfigured = isMailConfigured(env);
    const autoVerify = !mailConfigured;

    try {
      await db.insert(users).values({
        id: userId,
        email,
        passwordHash,
        name,
        phone,
        role: 'customer',
        emailVerified: autoVerify,
        createdAt: now,
        updatedAt: now,
      });
    } catch (err) {
      // UNIQUE-Konflikt auf email (Race) → höflich behandeln
      const msg = err instanceof Error ? err.message : '';
      if (/UNIQUE|unique/i.test(msg)) {
        return errorResponse('Ein Konto mit dieser E-Mail existiert bereits.');
      }
      throw err;
    }

    // Verify-Token erzeugen und Mail rausschicken (wenn konfiguriert)
    if (mailConfigured) {
      const verifyToken = generateSessionToken();
      const verifyTokenHash = await hashToken(verifyToken);
      await db.insert(emailVerificationTokens).values({
        id: generateId(),
        userId,
        tokenHash: verifyTokenHash,
        expiresAt: new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS).toISOString(),
      });
      const verifyUrl = `https://barbier.berlin/verify-email?token=${verifyToken}`;
      sendVerificationEmail(env, { to: email, customerName: name, verifyUrl })
        .catch((err) => console.error('Verifizierungs-E-Mail fehlgeschlagen:', err));
    } else {
      // Ohne Mail-Config keinen Token erzeugen, User ist auto-verifiziert.
      sendWelcomeEmail(env, { to: email, customerName: name })
        .catch(() => { /* no-op, mail not configured */ });
    }

    return jsonResponse({
      success: true,
      message: mailConfigured
        ? 'Konto erstellt. Bitte E-Mail-Adresse über den zugesandten Link bestätigen, dann anmelden.'
        : 'Konto erstellt. Sie können sich jetzt anmelden.',
      requiresVerification: mailConfigured,
    }, 201);
  } catch (err) {
    console.error('Register error:', err instanceof Error ? err.message : 'Unbekannter Fehler');
    return errorResponse('Registrierung fehlgeschlagen.', 500);
  }
}
