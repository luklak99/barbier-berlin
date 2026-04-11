import { env } from 'cloudflare:workers';
import type { APIContext } from 'astro';
import { and, eq } from 'drizzle-orm';
import { bookings, reviews } from '../../../db/schema';
import { generateId } from '../../../lib/crypto';
import { getDb } from '../../../lib/db';
import { getSessionToken, validateSession } from '../../../lib/session';
import { validateRating, validateReviewText, jsonResponse, errorResponse } from '../../../lib/validation';

export async function POST(context: APIContext) {
  const token = getSessionToken(context.request);
  if (!token) return errorResponse('Nicht angemeldet.', 401);

  const db = getDb(env.DB);
  const user = await validateSession(db, token);
  if (!user) return errorResponse('Sitzung abgelaufen.', 401);

  const body = await context.request.json();
  const bookingId = typeof body.bookingId === 'string' ? body.bookingId : null;
  const rating = validateRating(body.rating);
  const text = validateReviewText(body.text);

  if (!bookingId) return errorResponse('Buchungs-ID fehlt.');
  if (!rating) return errorResponse('Bewertung (1-5 Sterne) ist erforderlich.');

  // Verify the booking belongs to the user and is completed
  const result = await db
    .select()
    .from(bookings)
    .where(and(eq(bookings.id, bookingId), eq(bookings.userId, user.id), eq(bookings.status, 'completed')))
    .limit(1);

  if (result.length === 0) {
    return errorResponse('Nur abgeschlossene Termine können bewertet werden.', 404);
  }

  // Check if already reviewed
  const existingReview = await db
    .select({ id: reviews.id })
    .from(reviews)
    .where(and(eq(reviews.bookingId, bookingId), eq(reviews.userId, user.id)))
    .limit(1);

  if (existingReview.length > 0) {
    return errorResponse('Sie haben diesen Termin bereits bewertet.');
  }

  await db.insert(reviews).values({
    id: generateId(),
    userId: user.id,
    bookingId,
    rating,
    text,
  });

  return jsonResponse({ success: true }, 201);
}
