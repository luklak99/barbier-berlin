import { describe, it, expect } from 'vitest';
import {
  bookingConfirmationHtml,
  bookingConfirmationText,
  bookingCancellationHtml,
  bookingCancellationText,
  bookingReminderHtml,
  bookingReminderText,
  welcomeEmailHtml,
  welcomeEmailText,
} from '../../src/lib/email-templates';

// --- Testdaten ---

const bookingData = {
  customerName: 'Max Mustermann',
  serviceName: 'Klassischer Haarschnitt',
  date: '2026-04-15',
  startTime: '14:30',
  endTime: '15:00',
  price: 35,
  bookingId: 'abc123def456789012345678',
};

const cancellationData = {
  customerName: 'Max Mustermann',
  serviceName: 'Klassischer Haarschnitt',
  date: '2026-04-15',
  startTime: '14:30',
  bookingId: 'abc123def456789012345678',
};

const reminderData = {
  customerName: 'Max Mustermann',
  serviceName: 'Klassischer Haarschnitt',
  date: '2026-04-15',
  startTime: '14:30',
  endTime: '15:00',
  price: 35,
};

const welcomeData = {
  customerName: 'Max Mustermann',
};

// --- bookingConfirmationHtml ---

describe('bookingConfirmationHtml', () => {
  it('enthaelt den Kundennamen', () => {
    const html = bookingConfirmationHtml(bookingData);
    expect(html).toContain('Max Mustermann');
  });

  it('enthaelt den Servicenamen', () => {
    const html = bookingConfirmationHtml(bookingData);
    expect(html).toContain('Klassischer Haarschnitt');
  });

  it('enthaelt das formatierte Datum', () => {
    const html = bookingConfirmationHtml(bookingData);
    expect(html).toContain('15.04.2026');
  });

  it('enthaelt die Uhrzeit', () => {
    const html = bookingConfirmationHtml(bookingData);
    expect(html).toContain('14:30');
    expect(html).toContain('15:00');
  });

  it('enthaelt den Preis', () => {
    const html = bookingConfirmationHtml(bookingData);
    expect(html).toContain('35,00');
  });

  it('enthaelt die Buchungsnummer (erste 8 Zeichen, uppercase)', () => {
    const html = bookingConfirmationHtml(bookingData);
    expect(html).toContain('ABC123DE');
  });
});

// --- bookingConfirmationText ---

describe('bookingConfirmationText', () => {
  it('enthaelt Kundenname, Service, Datum, Uhrzeit, Preis, Buchungs-Nr', () => {
    const text = bookingConfirmationText(bookingData);
    expect(text).toContain('Max Mustermann');
    expect(text).toContain('Klassischer Haarschnitt');
    expect(text).toContain('15.04.2026');
    expect(text).toContain('14:30');
    expect(text).toContain('35,00');
    expect(text).toContain('ABC123DE');
  });
});

// --- bookingCancellationHtml ---

describe('bookingCancellationHtml', () => {
  it('enthaelt "storniert"', () => {
    const html = bookingCancellationHtml(cancellationData);
    expect(html.toLowerCase()).toContain('storniert');
  });

  it('enthaelt Kundenname und Service', () => {
    const html = bookingCancellationHtml(cancellationData);
    expect(html).toContain('Max Mustermann');
    expect(html).toContain('Klassischer Haarschnitt');
  });
});

// --- bookingCancellationText ---

describe('bookingCancellationText', () => {
  it('Plaintext-Version enthaelt storniert, Kundenname, Service', () => {
    const text = bookingCancellationText(cancellationData);
    expect(text.toLowerCase()).toContain('storniert');
    expect(text).toContain('Max Mustermann');
    expect(text).toContain('Klassischer Haarschnitt');
  });
});

// --- bookingReminderHtml ---

describe('bookingReminderHtml', () => {
  it('enthaelt "Erinnerung" oder "morgen"', () => {
    const html = bookingReminderHtml(reminderData);
    const lower = html.toLowerCase();
    expect(lower.includes('erinnerung') || lower.includes('morgen')).toBe(true);
  });

  it('enthaelt die Uhrzeit', () => {
    const html = bookingReminderHtml(reminderData);
    expect(html).toContain('14:30');
  });
});

// --- bookingReminderText ---

describe('bookingReminderText', () => {
  it('Plaintext enthaelt Erinnerung/morgen und Uhrzeit', () => {
    const text = bookingReminderText(reminderData);
    const lower = text.toLowerCase();
    expect(lower.includes('erinnerung') || lower.includes('morgen')).toBe(true);
    expect(text).toContain('14:30');
  });
});

// --- welcomeEmailHtml ---

describe('welcomeEmailHtml', () => {
  it('enthaelt "Willkommen"', () => {
    const html = welcomeEmailHtml(welcomeData);
    expect(html).toContain('Willkommen');
  });

  it('enthaelt den Kundennamen', () => {
    const html = welcomeEmailHtml(welcomeData);
    expect(html).toContain('Max Mustermann');
  });

  it('enthaelt Bonuspunkte-Referenz', () => {
    const html = welcomeEmailHtml(welcomeData);
    expect(html.toLowerCase()).toContain('bonus');
  });
});

// --- welcomeEmailText ---

describe('welcomeEmailText', () => {
  it('Plaintext enthaelt Willkommen und Kundennamen', () => {
    const text = welcomeEmailText(welcomeData);
    expect(text).toContain('Willkommen');
    expect(text).toContain('Max Mustermann');
  });
});

// --- Uebergreifende Template-Tests ---

describe('Alle HTML-Templates', () => {
  const allHtml = [
    bookingConfirmationHtml(bookingData),
    bookingCancellationHtml(cancellationData),
    bookingReminderHtml(reminderData),
    welcomeEmailHtml(welcomeData),
  ];

  it('enthalten <!DOCTYPE html>', () => {
    for (const html of allHtml) {
      expect(html).toContain('<!DOCTYPE html>');
    }
  });

  it('enthalten </html> (geschlossen)', () => {
    for (const html of allHtml) {
      expect(html).toContain('</html>');
    }
  });

  it('sind valide HTML-Struktur (html, head, body Tags)', () => {
    for (const html of allHtml) {
      expect(html).toContain('<html');
      expect(html).toContain('<head>');
      expect(html).toContain('</head>');
      expect(html).toContain('<body');
      expect(html).toContain('</body>');
    }
  });

  it('enthalten Brand-Farbe Gold (#c8a55a)', () => {
    for (const html of allHtml) {
      expect(html.toLowerCase()).toContain('#c8a55a');
    }
  });

  it('enthalten "barbier.berlin" Link', () => {
    for (const html of allHtml) {
      expect(html).toContain('barbier.berlin');
    }
  });
});

describe('Alle Text-Templates', () => {
  const allText = [
    bookingConfirmationText(bookingData),
    bookingCancellationText(cancellationData),
    bookingReminderText(reminderData),
    welcomeEmailText(welcomeData),
  ];

  it('enthalten "barbier.berlin" Link', () => {
    for (const text of allText) {
      expect(text).toContain('barbier.berlin');
    }
  });
});
