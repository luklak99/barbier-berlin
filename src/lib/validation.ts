// Input validation at system boundary (API endpoints)

export interface ValidationError {
  field: string;
  message: string;
}

export function validateEmail(email: unknown): string | null {
  if (typeof email !== 'string') return null;
  const trimmed = email.trim().toLowerCase();
  if (trimmed.length > 254) return null;
  const re = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return re.test(trimmed) ? trimmed : null;
}

export function validatePassword(password: unknown): string | null {
  if (typeof password !== 'string') return null;
  if (password.length < 10 || password.length > 128) return null;
  // Mindestens 3 von 4 Kategorien
  let categories = 0;
  if (/[a-z]/.test(password)) categories++;
  if (/[A-Z]/.test(password)) categories++;
  if (/[0-9]/.test(password)) categories++;
  if (/[^a-zA-Z0-9]/.test(password)) categories++;
  if (categories < 3) return null;
  return password;
}

export function validateBookingId(id: unknown): string | null {
  if (typeof id !== 'string') return null;
  if (id.length > 64 || id.length < 1) return null;
  if (!/^[a-f0-9]+$/.test(id)) return null;
  return id;
}

export function sanitizeEmailForSmtp(email: string): string {
  if (/[\r\n\0]/.test(email)) throw new Error('Invalid email: contains control characters');
  return email;
}

export function parseJsonBody(request: Request): Promise<Record<string, unknown>> {
  return request.json().catch(() => {
    throw new JsonParseError();
  });
}

export class JsonParseError extends Error {
  constructor() { super('Ungültiger Request-Body.'); }
}

export function validateName(name: unknown): string | null {
  if (typeof name !== 'string') return null;
  const trimmed = name.trim();
  if (trimmed.length < 1 || trimmed.length > 100) return null;
  return trimmed;
}

export function validatePhone(phone: unknown): string | null {
  if (typeof phone !== 'string' || phone.trim() === '') return null;
  const cleaned = phone.replace(/[\s\-()]/g, '');
  if (cleaned.length < 6 || cleaned.length > 20) return null;
  if (!/^\+?[0-9]+$/.test(cleaned)) return null;
  return cleaned;
}

export function validateTotpCode(code: unknown): string | null {
  if (typeof code !== 'string') return null;
  const cleaned = code.replace(/\D/g, '');
  if (cleaned.length !== 6) return null;
  return cleaned;
}

export function validateDate(date: unknown): string | null {
  if (typeof date !== 'string') return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const parsed = new Date(date);
  if (isNaN(parsed.getTime())) return null;
  return date;
}

export function validateTime(time: unknown): string | null {
  if (typeof time !== 'string') return null;
  if (!/^\d{2}:\d{2}$/.test(time)) return null;
  const [h, m] = time.split(':').map(Number);
  if (h === undefined || m === undefined) return null;
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  return time;
}

export function validateServiceId(id: unknown): string | null {
  if (typeof id !== 'string') return null;
  if (id.length > 100 || !/^[a-z0-9-]+$/.test(id)) return null;
  return id;
}

export function validateRating(rating: unknown): number | null {
  if (typeof rating !== 'number') return null;
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return null;
  return rating;
}

export function validateReviewText(text: unknown): string | null {
  if (typeof text !== 'string') return null;
  const trimmed = text.trim();
  if (trimmed.length > 1000) return null;
  return trimmed || null;
}

export function jsonResponse(data: unknown, status = 200, headers?: Record<string, string>): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
}

export function errorResponse(error: string, status = 400): Response {
  return jsonResponse({ error }, status);
}
