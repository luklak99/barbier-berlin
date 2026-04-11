import { describe, it, expect } from 'vitest';
import { sessionCookie, clearSessionCookie } from '../../src/lib/session';
import { validatePassword, sanitizeEmailForSmtp, validateBookingId } from '../../src/lib/validation';

// --- Session Cookie ---

describe('Session Cookie Format', () => {
  const cookie = sessionCookie('test-token-123');

  it('hat __Host-session Prefix', () => {
    expect(cookie).toMatch(/^__Host-session=/);
  });

  it('hat HttpOnly Flag', () => {
    expect(cookie).toContain('HttpOnly');
  });

  it('hat Secure Flag', () => {
    expect(cookie).toContain('Secure');
  });

  it('hat SameSite=Lax', () => {
    expect(cookie).toContain('SameSite=Lax');
  });

  it('hat Path=/', () => {
    expect(cookie).toContain('Path=/');
  });
});

describe('Clear Session Cookie', () => {
  it('hat Max-Age=0', () => {
    const cookie = clearSessionCookie();
    expect(cookie).toContain('Max-Age=0');
  });

  it('hat __Host-session Prefix', () => {
    const cookie = clearSessionCookie();
    expect(cookie).toMatch(/^__Host-session=/);
  });
});

// --- Password Validation ---

describe('Password Validation', () => {
  it('lehnt "aaaaaaaa" ab (keine Komplexitaet, nur 1 Kategorie)', () => {
    expect(validatePassword('aaaaaaaa')).toBeNull();
  });

  it('akzeptiert "Abcdef1234" (3 Kategorien: a-z, A-Z, 0-9, >= 10 Zeichen)', () => {
    expect(validatePassword('Abcdef1234')).toBe('Abcdef1234');
  });

  it('lehnt "short" ab (< 10 Zeichen)', () => {
    expect(validatePassword('short')).toBeNull();
  });

  it('lehnt "ALLCAPSONLY1" ab (nur 2 Kategorien: A-Z + 0-9)', () => {
    expect(validatePassword('ALLCAPSONLY1')).toBeNull();
  });

  it('akzeptiert Passwort mit 3 Kategorien inkl. Sonderzeichen', () => {
    expect(validatePassword('password!1')).toBe('password!1');
  });

  it('lehnt nicht-string Eingabe ab', () => {
    expect(validatePassword(undefined)).toBeNull();
    expect(validatePassword(12345)).toBeNull();
    expect(validatePassword(null)).toBeNull();
  });
});

// --- SMTP Sanitization ---

describe('SMTP Email Sanitization', () => {
  it('laesst normale E-Mail durch', () => {
    expect(sanitizeEmailForSmtp('test@example.com')).toBe('test@example.com');
  });

  it('wirft Error bei CRLF-Injection (\\r\\n)', () => {
    expect(() => sanitizeEmailForSmtp('test@example.com\r\nBCC: evil@attacker.com')).toThrow();
  });

  it('wirft Error bei LF-Injection (\\n)', () => {
    expect(() => sanitizeEmailForSmtp('test@example.com\nSubject: hacked')).toThrow();
  });

  it('wirft Error bei CR-only (\\r)', () => {
    expect(() => sanitizeEmailForSmtp('test@example.com\rBCC: evil@attacker.com')).toThrow();
  });

  it('wirft Error bei Null-Byte (\\0)', () => {
    expect(() => sanitizeEmailForSmtp('test@example.com\0')).toThrow();
  });
});

// --- BookingId Validation ---

describe('BookingId Validation', () => {
  it('akzeptiert gueltigen Hex-String', () => {
    expect(validateBookingId('abc123def456')).toBe('abc123def456');
  });

  it('lehnt SQL-Injection-Versuch ab', () => {
    expect(validateBookingId("'; DROP TABLE bookings; --")).toBeNull();
  });

  it('lehnt zu langen String ab (> 64 Zeichen)', () => {
    expect(validateBookingId('a'.repeat(100))).toBeNull();
  });

  it('lehnt Grossbuchstaben ab (nur lowercase hex)', () => {
    expect(validateBookingId('ABC123DEF456')).toBeNull();
  });

  it('lehnt leeren String ab', () => {
    expect(validateBookingId('')).toBeNull();
  });

  it('lehnt nicht-string Eingabe ab', () => {
    expect(validateBookingId(undefined)).toBeNull();
    expect(validateBookingId(12345)).toBeNull();
  });
});
