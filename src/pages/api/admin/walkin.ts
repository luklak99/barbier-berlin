import { env } from 'cloudflare:workers';
import type { APIContext } from 'astro';
import { eq } from 'drizzle-orm';
import { bookings, users, pointsTransactions } from '../../../db/schema';
import { generateId, hashPassword } from '../../../lib/crypto';
import { getDb } from '../../../lib/db';
import { getSessionToken, validateSession } from '../../../lib/session';
import { getServiceById } from '../../../data/services';
import {
  validateName,
  validateEmail,
  validatePhone,
  validateServiceId,
  jsonResponse,
  errorResponse,
} from '../../../lib/validation';

const CASHBACK_RATE = 0.05;

export async function POST(context: APIContext) {
  const token = getSessionToken(context.request);
  if (!token) return errorResponse('Nicht angemeldet.', 401);

  const db = getDb(env.DB);
  const admin = await validateSession(db, token);
  if (!admin || admin.role !== 'admin') return errorResponse('Keine Berechtigung.', 403);

  let body: Record<string, unknown>;
  try {
    body = await context.request.json();
  } catch {
    return errorResponse('Ungültiger Request-Body.', 400);
  }

  const name = validateName(body.name);
  const email = validateEmail(body.email);
  const phone = validatePhone(body.phone);
  const serviceId = validateServiceId(body.serviceId);

  if (!name) return errorResponse('Name ist erforderlich.');
  if (!serviceId) return errorResponse('Service ist erforderlich.');

  const service = getServiceById(serviceId);
  if (!service) return errorResponse('Service nicht gefunden.');

  let userId: string;

  // Try to find existing customer by email
  if (email) {
    const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
    if (existing.length > 0) {
      userId = existing[0]!.id;
    } else {
      // Create a minimal account for the walk-in customer
      userId = generateId();
      const tempPassword = await hashPassword(generateId()); // Random, customer can reset later
      const ts = new Date().toISOString();
      await db.insert(users).values({
        id: userId,
        email,
        passwordHash: tempPassword,
        name,
        phone,
        role: 'customer',
        createdAt: ts,
        updatedAt: ts,
      });
    }
  } else {
    // Create anonymous walk-in (no email)
    userId = generateId();
    const anonEmail = `walkin-${userId}@barbier.berlin`;
    const tempPassword = await hashPassword(generateId());
    const ts = new Date().toISOString();
    await db.insert(users).values({
      id: userId,
      email: anonEmail,
      passwordHash: tempPassword,
      name,
      phone,
      role: 'customer',
      createdAt: ts,
      updatedAt: ts,
    });
  }

  const now = new Date();
  const date = now.toISOString().split('T')[0]!;
  const startTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  const totalMin = now.getHours() * 60 + now.getMinutes() + service.duration;
  const endTime = `${Math.floor(totalMin / 60).toString().padStart(2, '0')}:${(totalMin % 60).toString().padStart(2, '0')}`;

  const bookingId = generateId();
  await db.insert(bookings).values({
    id: bookingId,
    userId,
    serviceId,
    date,
    startTime,
    endTime,
    status: 'completed',
    isWalkIn: true,
  });

  // Award cashback points - atomares Balance-Update via D1
  const pointsEarned = Math.floor(service.price * 100 * CASHBACK_RATE);
  if (pointsEarned > 0) {
    await db.insert(pointsTransactions).values({
      id: generateId(),
      userId,
      bookingId,
      amount: pointsEarned,
      type: 'earned',
      description: `5% Cashback für ${service.name.de} (Walk-in)`,
    });

    await env.DB.prepare(
      `UPDATE users SET points_balance = points_balance + ?, last_visit_at = ?, updated_at = ? WHERE id = ?`
    ).bind(pointsEarned, now.toISOString(), now.toISOString(), userId).run();
  }

  return jsonResponse({ success: true, bookingId }, 201);
}
