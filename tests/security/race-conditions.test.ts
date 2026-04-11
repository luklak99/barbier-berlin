import { describe, it, expect } from 'vitest';
import { validateBookingId, sanitizeEmailForSmtp } from '../../src/lib/validation';

// --- validateBookingId: Injection-Payloads ---

describe('validateBookingId - Injection-Payloads', () => {
  it('lehnt SQL-Injection ab', () => {
    expect(validateBookingId("'; DROP TABLE bookings; --")).toBeNull();
  });

  it('lehnt XSS-Payload ab', () => {
    expect(validateBookingId('<script>alert(1)</script>')).toBeNull();
  });

  it('lehnt Path-Traversal ab', () => {
    expect(validateBookingId('../../../etc/passwd')).toBeNull();
  });

  it('lehnt zu langen String ab (100 Zeichen)', () => {
    expect(validateBookingId('a'.repeat(100))).toBeNull();
  });

  it('akzeptiert gueltigen hex String', () => {
    expect(validateBookingId('abc123def456')).toBe('abc123def456');
  });

  it('lehnt String mit Leerzeichen ab', () => {
    expect(validateBookingId('abc 123')).toBeNull();
  });

  it('lehnt String mit Sonderzeichen ab', () => {
    expect(validateBookingId('abc!@#$%')).toBeNull();
  });

  it('lehnt Unicode-Injection ab', () => {
    expect(validateBookingId('abc\u0000def')).toBeNull();
  });

  it('akzeptiert maximale Laenge (64 Zeichen hex)', () => {
    const maxHex = 'a'.repeat(64);
    expect(validateBookingId(maxHex)).toBe(maxHex);
  });

  it('lehnt 65 Zeichen ab (1 ueber Maximum)', () => {
    expect(validateBookingId('a'.repeat(65))).toBeNull();
  });
});

// --- sanitizeEmailForSmtp: CRLF-Injection ---

describe('sanitizeEmailForSmtp - CRLF-Injection', () => {
  it('lehnt CRLF mit BCC-Injection ab', () => {
    expect(() =>
      sanitizeEmailForSmtp('test@example.com\r\nBCC: evil@attacker.com'),
    ).toThrow('Invalid email: contains control characters');
  });

  it('lehnt LF mit Subject-Injection ab', () => {
    expect(() =>
      sanitizeEmailForSmtp('test@example.com\nSubject: hacked'),
    ).toThrow('Invalid email: contains control characters');
  });

  it('lehnt Null-Byte ab', () => {
    expect(() =>
      sanitizeEmailForSmtp('test@example.com\0'),
    ).toThrow('Invalid email: contains control characters');
  });

  it('laesst normale E-Mail-Adresse durch', () => {
    expect(sanitizeEmailForSmtp('normal@example.com')).toBe('normal@example.com');
  });

  it('lehnt CR-only Injection ab', () => {
    expect(() =>
      sanitizeEmailForSmtp('test@example.com\rBCC: evil@attacker.com'),
    ).toThrow('Invalid email: contains control characters');
  });

  it('laesst E-Mail mit erlaubten Sonderzeichen durch', () => {
    expect(sanitizeEmailForSmtp('user+tag@example.com')).toBe('user+tag@example.com');
  });

  it('laesst E-Mail mit Punkt im Local-Part durch', () => {
    expect(sanitizeEmailForSmtp('first.last@example.com')).toBe('first.last@example.com');
  });

  it('lehnt mehrfache CRLF-Sequenzen ab', () => {
    expect(() =>
      sanitizeEmailForSmtp('a@b.com\r\nTo: x@y.com\r\nBCC: z@w.com'),
    ).toThrow();
  });
});
