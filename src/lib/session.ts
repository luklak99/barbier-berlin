import { eq } from 'drizzle-orm';
import { sessions, users } from '../db/schema';
import { generateId, generateSessionToken, hashToken } from './crypto';
import type { Database } from './db';

const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours (reduced from 7 days)
const COOKIE_NAME = '__Host-session';

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: 'customer' | 'admin';
  pointsBalance: number;
  totpEnabled: boolean;
  language: string;
}

export async function createSession(db: Database, userId: string): Promise<string> {
  // Invalidate all existing sessions for this user (session rotation)
  await db.delete(sessions).where(eq(sessions.userId, userId));

  const token = generateSessionToken();
  const tokenHash = await hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString();

  await db.insert(sessions).values({
    id: generateId(),
    userId,
    tokenHash,
    expiresAt,
  });

  return token;
}

export async function validateSession(db: Database, token: string): Promise<SessionUser | null> {
  const tokenHash = await hashToken(token);

  const result = await db
    .select({
      session: sessions,
      user: users,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.tokenHash, tokenHash))
    .limit(1);

  if (result.length === 0) return null;

  const { session, user } = result[0]!;

  if (new Date(session.expiresAt) < new Date()) {
    await db.delete(sessions).where(eq(sessions.id, session.id));
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as 'customer' | 'admin',
    pointsBalance: user.pointsBalance,
    totpEnabled: user.totpEnabled,
    language: user.language,
  };
}

export async function deleteSession(db: Database, token: string): Promise<void> {
  const tokenHash = await hashToken(token);
  await db.delete(sessions).where(eq(sessions.tokenHash, tokenHash));
}

export function getSessionToken(request: Request): string | null {
  const cookie = request.headers.get('Cookie');
  if (!cookie) return null;
  const match = cookie.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  return match ? match[1] : null;
}

export function sessionCookie(token: string, maxAge = SESSION_DURATION_MS / 1000): string {
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${Math.floor(maxAge)}`;
}

export function clearSessionCookie(): string {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}
