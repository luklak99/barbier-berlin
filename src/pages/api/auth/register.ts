import { env } from 'cloudflare:workers';
import type { APIContext } from 'astro';
import { eq } from 'drizzle-orm';
import { users } from '../../../db/schema';
import { generateId, hashPassword } from '../../../lib/crypto';
import { getDb } from '../../../lib/db';
import { createSession, sessionCookie } from '../../../lib/session';
import {
  validateEmail,
  validatePassword,
  validateName,
  validatePhone,
  jsonResponse,
  errorResponse,
} from '../../../lib/validation';
import { sendWelcomeEmail } from '../../../lib/email';

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

    // Check if user exists
    const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
    if (existing.length > 0) {
      return errorResponse('Ein Konto mit dieser E-Mail existiert bereits.');
    }

    const passwordHash = await hashPassword(password);
    const userId = generateId();

    await db.insert(users).values({
      id: userId,
      email,
      passwordHash,
      name,
      phone,
      role: 'customer',
    });

    const token = await createSession(db, userId);

    // Willkommens-E-Mail (fire and forget)
    if (env.SMTP_USER && env.SMTP_PASS) {
      sendWelcomeEmail(env, { to: email, customerName: name }).catch((err) => console.error('E-Mail fehlgeschlagen:', err));
    }

    return jsonResponse(
      { success: true, redirect: '/dashboard' },
      201,
      { 'Set-Cookie': sessionCookie(token) },
    );
  } catch (err) {
    console.error('Register error:', err instanceof Error ? err.message : 'Unbekannter Fehler');
    return errorResponse('Registrierung fehlgeschlagen.', 500);
  }
}
