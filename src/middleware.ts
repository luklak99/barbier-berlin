import { defineMiddleware } from 'astro:middleware';

/**
 * Simple in-memory rate limiter for Cloudflare Workers.
 * Each Worker instance has its own memory, so this is per-isolate.
 * For distributed rate limiting, use Cloudflare Rate Limiting Rules on a custom domain.
 */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  entry.count++;
  return entry.count > maxRequests;
}

function getClientIp(request: Request): string {
  return request.headers.get('CF-Connecting-IP')
    || request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim()
    || 'unknown';
}

// Rate limit configs per path pattern
const RATE_LIMITS: { pattern: RegExp; max: number; windowMs: number }[] = [
  { pattern: /^\/api\/auth\/(login|register)$/, max: 10, windowMs: 60_000 },    // Auth: 10/min
  { pattern: /^\/api\/auth\/mfa-setup$/, max: 5, windowMs: 60_000 },             // MFA: 5/min
  { pattern: /^\/api\/bookings\/create$/, max: 10, windowMs: 60_000 },            // Booking: 10/min
  { pattern: /^\/api\/reviews\/create$/, max: 5, windowMs: 60_000 },              // Reviews: 5/min
  { pattern: /^\/api\/points\/redeem$/, max: 5, windowMs: 60_000 },               // Points: 5/min
  { pattern: /^\/api\/admin\//, max: 30, windowMs: 60_000 },                      // Admin: 30/min
  { pattern: /^\/api\//, max: 60, windowMs: 60_000 },                             // General API: 60/min
];

export const onRequest = defineMiddleware(async (context, next) => {
  const path = new URL(context.request.url).pathname;

  // Rate limiting on API endpoints
  if (path.startsWith('/api/')) {
    const ip = getClientIp(context.request);

    for (const rule of RATE_LIMITS) {
      if (rule.pattern.test(path)) {
        const key = `${ip}:${rule.pattern.source}`;
        if (isRateLimited(key, rule.max, rule.windowMs)) {
          return new Response(JSON.stringify({ error: 'Zu viele Anfragen. Bitte warten.' }), {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': '60',
            },
          });
        }
        break;
      }
    }
  }

  const response = await next();

  // Security Headers
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '0');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https://images.unsplash.com https://maps.googleapis.com https://maps.gstatic.com",
      "frame-src https://www.google.com",
      "connect-src 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join('; '),
  );

  return response;
});
