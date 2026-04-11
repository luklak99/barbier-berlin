/**
 * Shared API helper fuer Frontend-Komponenten.
 * Wrapper um fetch mit JSON-Parsing, Error-Handling und Auth-Redirect.
 */

export interface ApiError {
  error: string;
  status: number;
}

export class ApiRequestError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
  }
}

/**
 * Generischer API-Wrapper mit JSON-Parsing und Error-Handling.
 * Bei 401 wird automatisch zu /login redirected.
 */
export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    credentials: 'same-origin',
  });

  if (res.status === 401) {
    window.location.href = '/login';
    throw new ApiRequestError('Nicht angemeldet.', 401);
  }

  const data = await res.json();

  if (!res.ok) {
    throw new ApiRequestError(data.error || 'Ein Fehler ist aufgetreten.', res.status);
  }

  return data as T;
}

// --- User-Cache ---

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'customer' | 'admin';
  pointsBalance: number;
  totpEnabled: boolean;
  language: string;
}

let cachedUser: User | null | undefined = undefined;
let userPromise: Promise<User | null> | null = null;

/**
 * Cached User-Abfrage von /api/auth/me.
 * Gibt null zurueck wenn nicht eingeloggt (ohne Redirect).
 */
export async function getUser(): Promise<User | null> {
  if (cachedUser !== undefined) return cachedUser;

  if (userPromise) return userPromise;

  userPromise = (async () => {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'same-origin' });
      if (!res.ok) {
        cachedUser = null;
        return null;
      }
      const data = await res.json();
      cachedUser = data.user as User;
      return cachedUser;
    } catch {
      cachedUser = null;
      return null;
    } finally {
      userPromise = null;
    }
  })();

  return userPromise;
}

/**
 * User-Cache leeren (z.B. nach Login/Logout).
 */
export function clearUserCache(): void {
  cachedUser = undefined;
  userPromise = null;
}
