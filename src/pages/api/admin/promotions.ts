import { env } from 'cloudflare:workers';
import type { APIContext } from 'astro';
import { eq } from 'drizzle-orm';
import { promotions } from '../../../db/schema';
import { generateId } from '../../../lib/crypto';
import { getDb } from '../../../lib/db';
import { getSessionToken, validateSession } from '../../../lib/session';
import { jsonResponse, errorResponse } from '../../../lib/validation';

// GET: List all promotions
export async function GET(context: APIContext) {
  const token = getSessionToken(context.request);
  if (!token) return errorResponse('Nicht angemeldet.', 401);
  const db = getDb(env.DB);
  const admin = await validateSession(db, token);
  if (!admin || admin.role !== 'admin') return errorResponse('Keine Berechtigung.', 403);

  const all = await db.select().from(promotions);
  return jsonResponse({ promotions: all });
}

// POST: Create or update promotion
export async function POST(context: APIContext) {
  const token = getSessionToken(context.request);
  if (!token) return errorResponse('Nicht angemeldet.', 401);
  const db = getDb(env.DB);
  const admin = await validateSession(db, token);
  if (!admin || admin.role !== 'admin') return errorResponse('Keine Berechtigung.', 403);

  let body: Record<string, unknown>;
  try { body = await context.request.json(); } catch { return errorResponse('Ungültiger Request.', 400); }

  const name = typeof body.name === 'string' ? body.name.trim() : null;
  const discountPercent = typeof body.discountPercent === 'number' ? body.discountPercent : null;
  const validFrom = typeof body.validFrom === 'string' ? body.validFrom : null;
  const validUntil = typeof body.validUntil === 'string' ? body.validUntil : null;

  if (!name || !discountPercent || !validFrom || !validUntil) {
    return errorResponse('Name, Rabatt, Gültig von/bis sind erforderlich.');
  }

  const id = typeof body.id === 'string' ? body.id : generateId();

  if (body.id) {
    // Update existing
    await db.update(promotions).set({
      name,
      description: typeof body.description === 'string' ? body.description : null,
      discountPercent,
      serviceIds: typeof body.serviceIds === 'string' ? body.serviceIds : null,
      dayOfWeek: typeof body.dayOfWeek === 'string' ? body.dayOfWeek : null,
      startTime: typeof body.startTime === 'string' ? body.startTime : null,
      endTime: typeof body.endTime === 'string' ? body.endTime : null,
      validFrom,
      validUntil,
      active: body.active !== false,
    }).where(eq(promotions.id, id));
  } else {
    await db.insert(promotions).values({
      id,
      name,
      description: typeof body.description === 'string' ? body.description : null,
      discountPercent,
      serviceIds: typeof body.serviceIds === 'string' ? body.serviceIds : null,
      dayOfWeek: typeof body.dayOfWeek === 'string' ? body.dayOfWeek : null,
      startTime: typeof body.startTime === 'string' ? body.startTime : null,
      endTime: typeof body.endTime === 'string' ? body.endTime : null,
      validFrom,
      validUntil,
    });
  }

  return jsonResponse({ success: true, id });
}
