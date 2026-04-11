import { describe, it, expect } from 'vitest';
import { languages, defaultLang, t, isRTL, translations } from '../../src/i18n/translations';

describe('languages', () => {
  it('hat genau de, en, tr, ar als Keys', () => {
    const keys = Object.keys(languages);
    expect(keys).toHaveLength(4);
    expect(keys).toContain('de');
    expect(keys).toContain('en');
    expect(keys).toContain('tr');
    expect(keys).toContain('ar');
  });
});

describe('defaultLang', () => {
  it('ist "de"', () => {
    expect(defaultLang).toBe('de');
  });
});

describe('t()', () => {
  it('gibt deutsche Uebersetzungen zurueck', () => {
    const de = t('de');
    expect(de.nav.home).toBe('Startseite');
    expect(de.hero.title).toBe('Barbier Berlin');
    expect(de.services.title).toBe('Services & Preise');
  });

  it('gibt englische Uebersetzungen zurueck', () => {
    const en = t('en');
    expect(en.nav.home).toBe('Home');
    expect(en.hero.cta).toBe('Book Appointment');
    expect(en.services.bookNow).toBe('Book Now');
  });

  it('gibt tuerkische Uebersetzungen zurueck', () => {
    const tr = t('tr');
    expect(tr.nav.home).toBe('Ana Sayfa');
    expect(tr.hero.cta).toBe('Randevu Al');
    expect(tr.booking.title).toBe('Randevu Al');
  });

  it('gibt arabische Uebersetzungen zurueck', () => {
    const ar = t('ar');
    expect(ar.nav.home).toBe('الرئيسية');
    expect(ar.hero.cta).toBe('احجز موعدك');
    expect(ar.booking.title).toBe('حجز موعد');
  });

  it('alle Sprachen haben die gleiche Struktur', () => {
    const langs = ['de', 'en', 'tr', 'ar'] as const;
    const deKeys = getDeepKeys(translations.de);

    for (const lang of langs) {
      const langKeys = getDeepKeys(translations[lang]);
      expect(langKeys).toEqual(deKeys);
    }
  });
});

describe('isRTL()', () => {
  it('gibt true fuer Arabisch zurueck', () => {
    expect(isRTL('ar')).toBe(true);
  });

  it('gibt false fuer Deutsch zurueck', () => {
    expect(isRTL('de')).toBe(false);
  });

  it('gibt false fuer Englisch zurueck', () => {
    expect(isRTL('en')).toBe(false);
  });

  it('gibt false fuer Tuerkisch zurueck', () => {
    expect(isRTL('tr')).toBe(false);
  });
});

// Hilfsfunktion: Alle verschachtelten Keys extrahieren
function getDeepKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  const keys: string[] = [];
  for (const key of Object.keys(obj).sort()) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      keys.push(...getDeepKeys(value as Record<string, unknown>, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}
