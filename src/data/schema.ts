/** Schema.org JSON-LD blocks for Barbier Berlin */

const SITE_URL = 'https://barbier.berlin';

export const barberShopSchema = {
  '@context': 'https://schema.org',
  '@type': 'BarberShop',
  '@id': `${SITE_URL}/#barbershop`,
  name: 'Barbier Berlin',
  url: SITE_URL,
  telephone: '+493025926500',
  email: 'info@barbier.berlin',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Markgrafenstraße 88',
    addressLocality: 'Berlin',
    addressRegion: 'BE',
    postalCode: '10969',
    addressCountry: 'DE',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 52.50334,
    longitude: 13.39262,
  },
  areaServed: { '@type': 'City', name: 'Berlin' },
  priceRange: '€€',
  currenciesAccepted: 'EUR',
  paymentAccepted: 'Cash, EC-Karte',
  image: `${SITE_URL}/images/barbier-berlin.jpg`,
  hasMap: 'https://maps.app.goo.gl/Ed2sUihwZV5pMmHb6',
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '10:00',
      closes: '18:00',
    },
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: 'Saturday',
      opens: '10:00',
      closes: '17:00',
    },
  ],
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    bestRating: '5',
    worstRating: '1',
    reviewCount: '1459',
  },
  sameAs: [
    'https://www.instagram.com/barbier.berlin',
    'https://www.treatwell.de/ort/barbier-berlin/',
  ],
};

export const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${SITE_URL}/#website`,
  name: 'Barbier Berlin',
  url: SITE_URL,
  inLanguage: ['de', 'en', 'tr', 'ar'],
  publisher: { '@type': 'BarberShop', '@id': `${SITE_URL}/#barbershop` },
};

export function webPageSchema(name: string, description: string, path: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${SITE_URL}${path}#webpage`,
    url: `${SITE_URL}${path}`,
    name,
    description,
    inLanguage: 'de',
    isPartOf: { '@type': 'WebSite', '@id': `${SITE_URL}/#website` },
    about: { '@type': 'BarberShop', '@id': `${SITE_URL}/#barbershop` },
  };
}

export function breadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.url}`,
    })),
  };
}

export function serviceSchema(name: string, price: number, description?: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name,
    description,
    provider: { '@type': 'BarberShop', '@id': `${SITE_URL}/#barbershop` },
    areaServed: { '@type': 'City', name: 'Berlin' },
    offers: {
      '@type': 'Offer',
      price: price.toFixed(2),
      priceCurrency: 'EUR',
    },
  };
}
