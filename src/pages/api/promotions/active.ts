import { env } from 'cloudflare:workers';
import type { APIContext } from 'astro';
import { and, eq, lte, gte } from 'drizzle-orm';
import { promotions } from '../../../db/schema';
import { getDb } from '../../../lib/db';
import { jsonResponse } from '../../../lib/validation';

export async function GET(context: APIContext) {
  const db = getDb(env.DB);
  const today = new Date().toISOString().split('T')[0]!;

  const active = await db.select().from(promotions)
    .where(and(
      eq(promotions.active, true),
      lte(promotions.validFrom, today),
      gte(promotions.validUntil, today),
    ));

  return jsonResponse({ promotions: active });
}
