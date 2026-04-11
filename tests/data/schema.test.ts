import { describe, it, expect } from 'vitest';
import {
  barberShopSchema,
  websiteSchema,
  webPageSchema,
  breadcrumbSchema,
  serviceSchema,
} from '../../src/data/schema';

describe('barberShopSchema', () => {
  it('hat @context', () => {
    expect(barberShopSchema['@context']).toBe('https://schema.org');
  });

  it('hat @type BarberShop', () => {
    expect(barberShopSchema['@type']).toBe('BarberShop');
  });

  it('hat name Barbier Berlin', () => {
    expect(barberShopSchema.name).toBe('Barbier Berlin');
  });

  it('hat telephone', () => {
    expect(barberShopSchema.telephone).toBeDefined();
    expect(typeof barberShopSchema.telephone).toBe('string');
    expect(barberShopSchema.telephone.length).toBeGreaterThan(0);
  });

  it('hat address mit PostalAddress Typ', () => {
    expect(barberShopSchema.address).toBeDefined();
    expect(barberShopSchema.address['@type']).toBe('PostalAddress');
    expect(barberShopSchema.address.addressCountry).toBe('DE');
    expect(barberShopSchema.address.addressLocality).toBe('Berlin');
  });

  it('hat openingHoursSpecification', () => {
    expect(barberShopSchema.openingHoursSpecification).toBeDefined();
    expect(Array.isArray(barberShopSchema.openingHoursSpecification)).toBe(true);
    expect(barberShopSchema.openingHoursSpecification.length).toBeGreaterThan(0);

    for (const spec of barberShopSchema.openingHoursSpecification) {
      expect(spec['@type']).toBe('OpeningHoursSpecification');
      expect(spec.opens).toBeDefined();
      expect(spec.closes).toBeDefined();
    }
  });

  it('hat aggregateRating', () => {
    expect(barberShopSchema.aggregateRating).toBeDefined();
    expect(barberShopSchema.aggregateRating['@type']).toBe('AggregateRating');
    expect(barberShopSchema.aggregateRating.ratingValue).toBeDefined();
    expect(barberShopSchema.aggregateRating.reviewCount).toBeDefined();
  });
});

describe('websiteSchema', () => {
  it('hat @type WebSite', () => {
    expect(websiteSchema['@type']).toBe('WebSite');
  });

  it('hat name Barbier Berlin', () => {
    expect(websiteSchema.name).toBe('Barbier Berlin');
  });

  it('hat url', () => {
    expect(websiteSchema.url).toBeDefined();
    expect(websiteSchema.url).toContain('https://');
  });

  it('hat @context', () => {
    expect(websiteSchema['@context']).toBe('https://schema.org');
  });
});

describe('webPageSchema', () => {
  it('gibt korrektes WebPage-Objekt zurück', () => {
    const page = webPageSchema('Startseite', 'Die Startseite von Barbier Berlin', '/');
    expect(page['@type']).toBe('WebPage');
    expect(page['@context']).toBe('https://schema.org');
  });

  it('hat @id mit Pfad', () => {
    const page = webPageSchema('Test', 'Beschreibung', '/test');
    expect(page['@id']).toContain('/test#webpage');
  });

  it('hat url mit Pfad', () => {
    const page = webPageSchema('Test', 'Beschreibung', '/services');
    expect(page.url).toContain('/services');
  });

  it('übernimmt name und description', () => {
    const page = webPageSchema('Mein Name', 'Meine Beschreibung', '/');
    expect(page.name).toBe('Mein Name');
    expect(page.description).toBe('Meine Beschreibung');
  });

  it('referenziert die WebSite via isPartOf', () => {
    const page = webPageSchema('Test', 'Desc', '/');
    expect(page.isPartOf).toBeDefined();
    expect(page.isPartOf['@type']).toBe('WebSite');
  });
});

describe('breadcrumbSchema', () => {
  it('gibt BreadcrumbList zurück', () => {
    const bc = breadcrumbSchema([{ name: 'Home', url: '/' }]);
    expect(bc['@type']).toBe('BreadcrumbList');
    expect(bc['@context']).toBe('https://schema.org');
  });

  it('hat korrekte ListItems', () => {
    const items = [
      { name: 'Home', url: '/' },
      { name: 'Services', url: '/services' },
      { name: 'Haarschnitt', url: '/services/haircut' },
    ];
    const bc = breadcrumbSchema(items);

    expect(bc.itemListElement).toHaveLength(3);

    expect(bc.itemListElement[0]['@type']).toBe('ListItem');
    expect(bc.itemListElement[0].position).toBe(1);
    expect(bc.itemListElement[0].name).toBe('Home');
    expect(bc.itemListElement[0].item).toContain('/');

    expect(bc.itemListElement[1].position).toBe(2);
    expect(bc.itemListElement[1].name).toBe('Services');

    expect(bc.itemListElement[2].position).toBe(3);
    expect(bc.itemListElement[2].name).toBe('Haarschnitt');
  });

  it('gibt leere Liste für leeres Array zurück', () => {
    const bc = breadcrumbSchema([]);
    expect(bc.itemListElement).toHaveLength(0);
  });
});

describe('serviceSchema', () => {
  it('hat @type Service', () => {
    const schema = serviceSchema('Haarschnitt', 25);
    expect(schema['@type']).toBe('Service');
    expect(schema['@context']).toBe('https://schema.org');
  });

  it('übernimmt name', () => {
    const schema = serviceSchema('Rasur', 17);
    expect(schema.name).toBe('Rasur');
  });

  it('hat offers mit price', () => {
    const schema = serviceSchema('Schnitt', 25);
    expect(schema.offers).toBeDefined();
    expect(schema.offers['@type']).toBe('Offer');
    expect(schema.offers.price).toBe('25.00');
    expect(schema.offers.priceCurrency).toBe('EUR');
  });

  it('formatiert Preis als String mit 2 Dezimalstellen', () => {
    const schema = serviceSchema('Test', 17);
    expect(schema.offers.price).toBe('17.00');
  });

  it('übernimmt optionale description', () => {
    const schema = serviceSchema('Schnitt', 25, 'Ein toller Haarschnitt');
    expect(schema.description).toBe('Ein toller Haarschnitt');
  });

  it('hat provider als BarberShop', () => {
    const schema = serviceSchema('Test', 10);
    expect(schema.provider['@type']).toBe('BarberShop');
  });
});
