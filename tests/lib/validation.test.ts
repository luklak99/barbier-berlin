import { describe, it, expect } from 'vitest';
import {
  validateEmail,
  validatePassword,
  validateName,
  validatePhone,
  validateTotpCode,
  validateDate,
  validateTime,
  validateServiceId,
  validateRating,
  validateReviewText,
  validateBookingId,
  sanitizeEmailForSmtp,
  JsonParseError,
  jsonResponse,
  errorResponse,
} from '../../src/lib/validation';

describe('validateEmail', () => {
  it('gibt trimmed lowercase für valide E-Mail zurück', () => {
    expect(validateEmail('  Test@Example.COM  ')).toBe('test@example.com');
  });

  it('akzeptiert normale E-Mail-Adressen', () => {
    expect(validateEmail('user@domain.de')).toBe('user@domain.de');
    expect(validateEmail('user.name@domain.co.uk')).toBe('user.name@domain.co.uk');
  });

  it('gibt null für invalide E-Mail zurück', () => {
    expect(validateEmail('keine-email')).toBeNull();
    expect(validateEmail('@domain.de')).toBeNull();
    expect(validateEmail('user@')).toBeNull();
  });

  it('gibt null für zu lange E-Mail zurück (>254 Zeichen)', () => {
    const longEmail = 'a'.repeat(250) + '@b.de';
    expect(validateEmail(longEmail)).toBeNull();
  });

  it('gibt null für nicht-string Input zurück', () => {
    expect(validateEmail(123)).toBeNull();
    expect(validateEmail(null)).toBeNull();
    expect(validateEmail(undefined)).toBeNull();
    expect(validateEmail({})).toBeNull();
  });
});

describe('validatePassword', () => {
  it('akzeptiert Passwort mit min 10 Zeichen und 3/4 Kategorien', () => {
    // Kleinbuchstaben + Großbuchstaben + Zahlen
    expect(validatePassword('Abcdefgh12')).toBe('Abcdefgh12');
    // Kleinbuchstaben + Großbuchstaben + Sonderzeichen
    expect(validatePassword('Abcdefgh!!')).toBe('Abcdefgh!!');
    // Kleinbuchstaben + Zahlen + Sonderzeichen
    expect(validatePassword('abcdefg12!')).toBe('abcdefg12!');
  });

  it('gibt null für zu kurzes Passwort zurück', () => {
    expect(validatePassword('Ab1!')).toBeNull();
    expect(validatePassword('Abcde123')).toBeNull(); // 8 Zeichen
  });

  it('gibt null für Passwort mit nur Kleinbuchstaben zurück', () => {
    expect(validatePassword('abcdefghijklm')).toBeNull();
  });

  it('gibt null für Passwort mit nur 2 Kategorien zurück', () => {
    // Nur Klein + Groß
    expect(validatePassword('AbcdefghijK')).toBeNull();
  });

  it('gibt null für nicht-string Input zurück', () => {
    expect(validatePassword(123456789012)).toBeNull();
    expect(validatePassword(null)).toBeNull();
  });

  it('gibt null für zu langes Passwort zurück (>128 Zeichen)', () => {
    const longPw = 'Abc1!' + 'x'.repeat(130);
    expect(validatePassword(longPw)).toBeNull();
  });
});

describe('validateName', () => {
  it('gibt getrimmten Namen zurück', () => {
    expect(validateName('  Max Mustermann  ')).toBe('Max Mustermann');
  });

  it('akzeptiert 1-100 Zeichen', () => {
    expect(validateName('A')).toBe('A');
    expect(validateName('X'.repeat(100))).toBe('X'.repeat(100));
  });

  it('gibt null für leeren String zurück', () => {
    expect(validateName('')).toBeNull();
    expect(validateName('   ')).toBeNull();
  });

  it('gibt null für zu langen Namen zurück', () => {
    expect(validateName('X'.repeat(101))).toBeNull();
  });

  it('gibt null für nicht-string zurück', () => {
    expect(validateName(42)).toBeNull();
    expect(validateName(null)).toBeNull();
  });
});

describe('validatePhone', () => {
  it('akzeptiert valide Telefonnummern und entfernt Sonderzeichen', () => {
    expect(validatePhone('+49 30 1234567')).toBe('+49301234567');
    expect(validatePhone('(030) 123-4567')).toBe('0301234567');
  });

  it('gibt null für zu kurze Nummer zurück', () => {
    expect(validatePhone('123')).toBeNull();
  });

  it('gibt null für leeren String zurück', () => {
    expect(validatePhone('')).toBeNull();
    expect(validatePhone('   ')).toBeNull();
  });

  it('gibt null für nicht-string zurück', () => {
    expect(validatePhone(123456)).toBeNull();
  });

  it('gibt null für Nummer mit Buchstaben zurück', () => {
    expect(validatePhone('+49abc123456')).toBeNull();
  });
});

describe('validateTotpCode', () => {
  it('akzeptiert 6 Ziffern', () => {
    expect(validateTotpCode('123456')).toBe('123456');
    expect(validateTotpCode('000000')).toBe('000000');
  });

  it('gibt null für Buchstaben zurück', () => {
    expect(validateTotpCode('abcdef')).toBeNull();
  });

  it('gibt null für zu kurzen Code zurück', () => {
    expect(validateTotpCode('12345')).toBeNull();
  });

  it('gibt null für zu langen Code zurück', () => {
    expect(validateTotpCode('1234567')).toBeNull();
  });

  it('gibt null für nicht-string zurück', () => {
    expect(validateTotpCode(123456)).toBeNull();
  });
});

describe('validateDate', () => {
  it('akzeptiert YYYY-MM-DD Format', () => {
    expect(validateDate('2025-01-15')).toBe('2025-01-15');
    expect(validateDate('2024-12-31')).toBe('2024-12-31');
  });

  it('gibt null für ungültiges Datum zurück', () => {
    expect(validateDate('2025-13-01')).toBeNull(); // Monat 13
    expect(validateDate('2025-00-01')).toBeNull(); // Monat 0
    expect(validateDate('nicht-ein-datum')).toBeNull();
  });

  it('gibt null für falsches Format zurück', () => {
    expect(validateDate('15.01.2025')).toBeNull();
    expect(validateDate('01/15/2025')).toBeNull();
    expect(validateDate('2025-1-5')).toBeNull();
  });

  it('gibt null für nicht-string zurück', () => {
    expect(validateDate(20250115)).toBeNull();
    expect(validateDate(null)).toBeNull();
  });
});

describe('validateTime', () => {
  it('akzeptiert HH:MM Format', () => {
    expect(validateTime('09:30')).toBe('09:30');
    expect(validateTime('23:59')).toBe('23:59');
    expect(validateTime('00:00')).toBe('00:00');
  });

  it('gibt null für 24:00 zurück', () => {
    expect(validateTime('24:00')).toBeNull();
  });

  it('gibt null für ungültige Minuten zurück', () => {
    expect(validateTime('12:60')).toBeNull();
  });

  it('gibt null für falsches Format zurück', () => {
    expect(validateTime('9:30')).toBeNull();
    expect(validateTime('09:3')).toBeNull();
    expect(validateTime('0930')).toBeNull();
  });

  it('gibt null für nicht-string zurück', () => {
    expect(validateTime(930)).toBeNull();
  });
});

describe('validateServiceId', () => {
  it('akzeptiert lowercase alphanumeric mit Bindestrichen', () => {
    expect(validateServiceId('herren-rasur')).toBe('herren-rasur');
    expect(validateServiceId('service-123')).toBe('service-123');
  });

  it('gibt null für Großbuchstaben zurück', () => {
    expect(validateServiceId('Herren-Rasur')).toBeNull();
  });

  it('gibt null für Sonderzeichen zurück', () => {
    expect(validateServiceId('service_id')).toBeNull();
    expect(validateServiceId('service id')).toBeNull();
    expect(validateServiceId('service/id')).toBeNull();
  });

  it('gibt null für leeren String zurück', () => {
    expect(validateServiceId('')).toBeNull();
  });

  it('gibt null für zu langen String zurück (>100)', () => {
    expect(validateServiceId('a'.repeat(101))).toBeNull();
  });

  it('gibt null für nicht-string zurück', () => {
    expect(validateServiceId(123)).toBeNull();
  });
});

describe('validateRating', () => {
  it('akzeptiert Integer 1-5', () => {
    expect(validateRating(1)).toBe(1);
    expect(validateRating(3)).toBe(3);
    expect(validateRating(5)).toBe(5);
  });

  it('gibt null für 0 zurück', () => {
    expect(validateRating(0)).toBeNull();
  });

  it('gibt null für 6 zurück', () => {
    expect(validateRating(6)).toBeNull();
  });

  it('gibt null für Float zurück', () => {
    expect(validateRating(3.5)).toBeNull();
    expect(validateRating(1.1)).toBeNull();
  });

  it('gibt null für nicht-number zurück', () => {
    expect(validateRating('3')).toBeNull();
    expect(validateRating(null)).toBeNull();
  });
});

describe('validateReviewText', () => {
  it('gibt getrimmten Text zurück', () => {
    expect(validateReviewText('  Toller Service!  ')).toBe('Toller Service!');
  });

  it('gibt null für Text über 1000 Zeichen zurück', () => {
    expect(validateReviewText('x'.repeat(1001))).toBeNull();
  });

  it('gibt null für leeren/nur-Whitespace String zurück', () => {
    expect(validateReviewText('')).toBeNull();
    expect(validateReviewText('   ')).toBeNull();
  });

  it('akzeptiert genau 1000 Zeichen', () => {
    const text = 'x'.repeat(1000);
    expect(validateReviewText(text)).toBe(text);
  });

  it('gibt null für nicht-string zurück', () => {
    expect(validateReviewText(42)).toBeNull();
    expect(validateReviewText(null)).toBeNull();
  });
});

describe('validateBookingId', () => {
  it('akzeptiert Hex-String', () => {
    expect(validateBookingId('abcdef0123456789')).toBe('abcdef0123456789');
  });

  it('akzeptiert max 64 Zeichen', () => {
    const hex64 = 'a'.repeat(64);
    expect(validateBookingId(hex64)).toBe(hex64);
  });

  it('gibt null für Sonderzeichen zurück', () => {
    expect(validateBookingId('abc-123')).toBeNull();
    expect(validateBookingId('abc_123')).toBeNull();
  });

  it('gibt null für Großbuchstaben zurück', () => {
    expect(validateBookingId('ABCDEF')).toBeNull();
  });

  it('gibt null für leeren String zurück', () => {
    expect(validateBookingId('')).toBeNull();
  });

  it('gibt null für zu langen String zurück (>64)', () => {
    expect(validateBookingId('a'.repeat(65))).toBeNull();
  });

  it('gibt null für nicht-string zurück', () => {
    expect(validateBookingId(123)).toBeNull();
  });
});

describe('sanitizeEmailForSmtp', () => {
  it('gibt E-Mail ohne CRLF unverändert zurück', () => {
    expect(sanitizeEmailForSmtp('test@example.com')).toBe('test@example.com');
  });

  it('wirft Error bei \\r', () => {
    expect(() => sanitizeEmailForSmtp('test@example.com\r')).toThrow('Invalid email');
  });

  it('wirft Error bei \\n', () => {
    expect(() => sanitizeEmailForSmtp('test@example.com\n')).toThrow('Invalid email');
  });

  it('wirft Error bei \\r\\n', () => {
    expect(() => sanitizeEmailForSmtp('test\r\n@example.com')).toThrow('Invalid email');
  });

  it('wirft Error bei Null-Byte', () => {
    expect(() => sanitizeEmailForSmtp('test\0@example.com')).toThrow('Invalid email');
  });
});

describe('JsonParseError', () => {
  it('ist eine Instanz von Error', () => {
    const error = new JsonParseError();
    expect(error).toBeInstanceOf(Error);
  });

  it('hat die richtige Message', () => {
    const error = new JsonParseError();
    expect(error.message).toBe('Ungültiger Request-Body.');
  });
});

describe('jsonResponse', () => {
  it('gibt Response mit JSON Content-Type zurück', async () => {
    const res = jsonResponse({ ok: true });
    expect(res).toBeInstanceOf(Response);
    expect(res.headers.get('Content-Type')).toBe('application/json');
  });

  it('hat Standard-Status 200', () => {
    const res = jsonResponse({ ok: true });
    expect(res.status).toBe(200);
  });

  it('setzt benutzerdefinierten Status', () => {
    const res = jsonResponse({ ok: true }, 201);
    expect(res.status).toBe(201);
  });

  it('serialisiert Body als JSON', async () => {
    const data = { name: 'Test', value: 42 };
    const res = jsonResponse(data);
    const body = await res.json();
    expect(body).toEqual(data);
  });

  it('übernimmt zusätzliche Headers', () => {
    const res = jsonResponse({}, 200, { 'X-Custom': 'value' });
    expect(res.headers.get('X-Custom')).toBe('value');
  });
});

describe('errorResponse', () => {
  it('hat den korrekten Status-Code', () => {
    const res = errorResponse('Nicht gefunden', 404);
    expect(res.status).toBe(404);
  });

  it('hat Standard-Status 400', () => {
    const res = errorResponse('Fehler');
    expect(res.status).toBe(400);
  });

  it('hat Error-Feld im Body', async () => {
    const res = errorResponse('Etwas ging schief', 500);
    const body = await res.json();
    expect(body).toEqual({ error: 'Etwas ging schief' });
  });

  it('hat JSON Content-Type', () => {
    const res = errorResponse('Fehler');
    expect(res.headers.get('Content-Type')).toBe('application/json');
  });
});
