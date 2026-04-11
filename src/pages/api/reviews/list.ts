import type { APIContext } from 'astro';
import { desc, eq } from 'drizzle-orm';
import { reviews, users } from '../../../db/schema';
import { getDb } from '../../../lib/db';
import { jsonResponse } from '../../../lib/validation';

export async function GET(context: APIContext) {
  const db = getDb(context.locals.runtime.env.DB);

  const allReviews = await db
    .select({
      id: reviews.id,
      rating: reviews.rating,
      text: reviews.text,
      createdAt: reviews.createdAt,
      userName: users.name,
    })
    .from(reviews)
    .innerJoin(users, eq(reviews.userId, users.id))
    .orderBy(desc(reviews.createdAt))
    .limit(50);

  // Anonymize names (show first name + initial)
  const anonymized = allReviews.map((r) => {
    const parts = r.userName.split(' ');
    const displayName = parts.length > 1
      ? `${parts[0]} ${parts[parts.length - 1]![0]}.`
      : parts[0];
    return { ...r, userName: displayName };
  });

  return jsonResponse({ reviews: anonymized });
}
