import { env } from 'cloudflare:workers';
import type { APIContext } from 'astro';
import { eq } from 'drizzle-orm';
import { settings } from '../../../db/schema';
import { getDb } from '../../../lib/db';
import { getSessionToken, validateSession } from '../../../lib/session';
import { jsonResponse, errorResponse } from '../../../lib/validation';

// Feature toggles
const VALID_KEYS = ['noshow_detection', 'noshow_threshold', 'referral_bonus_points', 'tip_enabled'];

export async function GET(context: APIContext) {
  const token = getSessionToken(context.request);
  if (!token) return errorResponse('Nicht angemeldet.', 401);
  const db = getDb(env.DB);
  const admin = await validateSession(db, token);
  if (!admin || admin.role !== 'admin') return errorResponse('Keine Berechtigung.', 403);

  const all = await db.select().from(settings);
  const result: Record<string, string> = {};
  for (const s of all) result[s.key] = s.value;

  // Defaults
  return jsonResponse({
    noshow_detection: result.noshow_detection || 'true',
    noshow_threshold: result.noshow_threshold || '3',
    referral_bonus_points: result.referral_bonus_points || '500',
    tip_enabled: result.tip_enabled || 'true',
  });
}

export async function POST(context: APIContext) {
  const token = getSessionToken(context.request);
  if (!token) return errorResponse('Nicht angemeldet.', 401);
  const db = getDb(env.DB);
  const admin = await validateSession(db, token);
  if (!admin || admin.role !== 'admin') return errorResponse('Keine Berechtigung.', 403);

  let body: Record<string, unknown>;
  try { body = await context.request.json(); } catch { return errorResponse('Ungültiger Request.', 400); }

  for (const [key, value] of Object.entries(body)) {
    if (!VALID_KEYS.includes(key) || typeof value !== 'string') continue;
    const existing = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
    if (existing.length > 0) {
      await db.update(settings).set({ value, updatedAt: new Date().toISOString() }).where(eq(settings.key, key));
    } else {
      await db.insert(settings).values({ key, value });
    }
  }

  return jsonResponse({ success: true });
}
