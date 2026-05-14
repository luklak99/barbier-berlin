import { env } from 'cloudflare:workers';
import type { APIContext } from 'astro';
import { jsonResponse, errorResponse } from '../../../lib/validation';

export async function POST(context: APIContext) {
  let body: Record<string, unknown>;
  try {
    body = await context.request.json();
  } catch {
    return errorResponse('Ungültiger Request-Body.', 400);
  }

  const token = body.token;
  if (typeof token !== 'string' || token.length < 10 || token.length > 128) {
    return errorResponse('Ungültiger Token.', 400);
  }

  const booking = await env.DB.prepare(
    `SELECT id, status, date, start_time FROM guest_bookings WHERE cancel_token = ? LIMIT 1`
  ).bind(token).first<{ id: string; status: string; date: string; start_time: string }>();

  if (!booking) return errorResponse('Buchung nicht gefunden.', 404);
  if (booking.status === 'cancelled') return errorResponse('Bereits storniert.', 409);

  // Stornierung nur bis 24h vorher
  const appointmentTime = new Date(`${booking.date}T${booking.start_time}:00`);
  const cutoff = new Date(appointmentTime.getTime() - 24 * 60 * 60 * 1000);
  if (new Date() > cutoff) {
    return errorResponse('Stornierung nur bis 24 Stunden vor dem Termin möglich.', 409);
  }

  await env.DB.prepare(
    `UPDATE guest_bookings SET status = 'cancelled' WHERE id = ?`
  ).bind(booking.id).run();

  return jsonResponse({ success: true });
}
