import { env } from 'cloudflare:workers';
import type { APIContext } from 'astro';
import { getDb } from '../../../lib/db';
import { deleteSession, getSessionToken, clearSessionCookie } from '../../../lib/session';
import { jsonResponse } from '../../../lib/validation';

export async function POST(context: APIContext) {
  const token = getSessionToken(context.request);
  if (token) {
    const db = getDb(env.DB);
    await deleteSession(db, token);
  }

  return jsonResponse(
    { success: true, redirect: '/' },
    200,
    { 'Set-Cookie': clearSessionCookie() },
  );
}
