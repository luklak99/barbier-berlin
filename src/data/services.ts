export interface Service {
  id: string;
  name: { de: string; en: string; tr: string; ar: string };
  description?: { de: string; en?: string; tr?: string; ar?: string };
  price: number;
  duration: number;
  category: ServiceCategory;
}

export type ServiceCategory = 'haircut' | 'beard' | 'face' | 'color' | 'kids' | 'specials';

export const services: Service[] = [
  // Haarschnitte
  {
    id: 'herren-schneiden-styling',
    name: {
      de: 'Herren Schneiden & Styling',
      en: "Men's Cut & Styling",
      tr: 'Erkek Sac Kesimi & Sekillendirme',
      ar: 'قص وتصفيف رجالي',
    },
    price: 25,
    duration: 30,
    category: 'haircut',
  },
  {
    id: 'herren-trockenhaarschnitt',
    name: {
      de: 'Herren - Trockenhaarschnitt',
      en: "Men's Dry Haircut",
      tr: 'Erkek Kuru Sac Kesimi',
      ar: 'قص شعر جاف رجالي',
    },
    price: 25,
    duration: 25,
    category: 'haircut',
  },
  {
    id: 'herren-maschinenhaarschnitt',
    name: {
      de: 'Herren - Maschinenhaarschnitt Komplett eine Länge',
      en: "Men's Clipper Cut - One Length",
      tr: 'Erkek Makine Kesimi - Tek Boy',
      ar: 'قص بالماكينة - طول واحد',
    },
    price: 20,
    duration: 20,
    category: 'haircut',
  },
  {
    id: 'herren-waschen-schneiden',
    name: {
      de: 'Herren - Waschen & Schneiden',
      en: "Men's Wash & Cut",
      tr: 'Erkek Yikama & Kesim',
      ar: 'غسل وقص رجالي',
    },
    price: 30,
    duration: 35,
    category: 'haircut',
  },
  {
    id: 'herren-haarschnitt-schere-waschen-foehnen',
    name: {
      de: 'Herren - Haarschnitt mit Schere, Waschen & Föhnen',
      en: "Men's Scissor Cut, Wash & Blow Dry",
      tr: 'Erkek Makas Kesimi, Yikama & Fon',
      ar: 'قص بالمقص وغسل وتجفيف',
    },
    price: 30,
    duration: 40,
    category: 'haircut',
  },
  {
    id: 'herren-kopf-nassrasur',
    name: {
      de: 'Herren - Kopf Nassrasur',
      en: "Men's Head Wet Shave",
      tr: 'Erkek Kafa Islak Tras',
      ar: 'حلاقة رأس بالموس',
    },
    price: 20,
    duration: 25,
    category: 'haircut',
  },
  {
    id: 'herren-haarschnitt-rasur',
    name: {
      de: 'Herren - Haarschnitt & Rasur',
      en: "Men's Haircut & Shave",
      tr: 'Erkek Sac Kesimi & Tras',
      ar: 'قص شعر وحلاقة رجالي',
    },
    price: 40,
    duration: 50,
    category: 'haircut',
  },

  // Bart & Rasur
  {
    id: 'herren-rasur',
    name: {
      de: 'Herren - Rasur',
      en: "Men's Shave",
      tr: 'Erkek Tras',
      ar: 'حلاقة رجالية',
    },
    price: 17,
    duration: 20,
    category: 'beard',
  },
  {
    id: 'herren-bart-trimmen',
    name: {
      de: 'Herren - Bart trimmen',
      en: "Men's Beard Trim",
      tr: 'Erkek Sakal Duzeltme',
      ar: 'تشذيب اللحية',
    },
    price: 17,
    duration: 15,
    category: 'beard',
  },
  {
    id: 'herren-vollbart-nassrasur',
    name: {
      de: 'Herren - Vollbart in Form schneiden & Nassrasur',
      en: "Men's Full Beard Shaping & Wet Shave",
      tr: 'Erkek Sakal Sekillendirme & Islak Tras',
      ar: 'تشكيل اللحية الكاملة وحلاقة بالموس',
    },
    price: 18,
    duration: 25,
    category: 'beard',
  },
  {
    id: 'herren-bart-faerben',
    name: {
      de: 'Herren - Bart färben',
      en: "Men's Beard Coloring",
      tr: 'Erkek Sakal Boyama',
      ar: 'صبغ اللحية',
    },
    price: 30,
    duration: 30,
    category: 'beard',
  },

  // Gesicht & Pflege
  {
    id: 'haarentfernung-faden-gesicht',
    name: {
      de: 'Haarentfernung mit Fadentechnik - Gesicht Komplett',
      en: 'Threading Hair Removal - Full Face',
      tr: 'Iplikle Epilasyon - Tum Yuz',
      ar: 'إزالة الشعر بالخيط - الوجه كاملا',
    },
    price: 15,
    duration: 20,
    category: 'face',
  },
  {
    id: 'haarentfernung-faden-wax-gesicht',
    name: {
      de: 'Herren - Haarentfernung mit Fadentechnik/Wax - Gesicht',
      en: "Men's Threading/Wax Hair Removal - Face",
      tr: 'Iplik/Wax Epilasyon - Yuz',
      ar: 'إزالة الشعر بالخيط/الشمع - الوجه',
    },
    price: 10,
    duration: 15,
    category: 'face',
  },
  {
    id: 'haarentfernung-faden-wangen',
    name: {
      de: 'Haarentfernung mit Fadentechnik - Wangen',
      en: 'Threading Hair Removal - Cheeks',
      tr: 'Iplikle Epilasyon - Yanaklar',
      ar: 'إزالة الشعر بالخيط - الخدين',
    },
    price: 10,
    duration: 10,
    category: 'face',
  },
  {
    id: 'herren-waxing-ohren',
    name: {
      de: 'Herren Waxing - Ohren',
      en: "Men's Ear Waxing",
      tr: 'Erkek Kulak Agdasi',
      ar: 'إزالة شعر الأذن بالشمع',
    },
    price: 10,
    duration: 10,
    category: 'face',
  },
  {
    id: 'herren-waxing-augenbrauen',
    name: {
      de: 'Herren Waxing - Augenbrauen',
      en: "Men's Eyebrow Waxing",
      tr: 'Erkek Kas Agdasi',
      ar: 'إزالة شعر الحاجب بالشمع',
    },
    price: 10,
    duration: 10,
    category: 'face',
  },

  // Farbe & Styling
  {
    id: 'herren-farbe',
    name: {
      de: 'Herren - Farbe',
      en: "Men's Hair Color",
      tr: 'Erkek Sac Boyama',
      ar: 'صبغة شعر رجالية',
    },
    price: 40,
    duration: 45,
    category: 'color',
  },
  {
    id: 'herren-grauhaarkaschierung',
    name: {
      de: 'Herren - Grauhaarkaschierung',
      en: "Men's Grey Hair Concealing",
      tr: 'Erkek Beyaz Sac Kapatma',
      ar: 'إخفاء الشعر الأبيض',
    },
    price: 35,
    duration: 35,
    category: 'color',
  },
  {
    id: 'herren-grauhaarkaschierung-schnitt-foehnen',
    name: {
      de: 'Herren - Grauhaarkaschierung, Schnitt & Föhnen',
      en: "Men's Grey Concealing, Cut & Blow Dry",
      tr: 'Beyaz Sac Kapatma, Kesim & Fon',
      ar: 'إخفاء الشعر الأبيض وقص وتجفيف',
    },
    price: 55,
    duration: 60,
    category: 'color',
  },
  {
    id: 'herren-farbe-schnitt-foehnen',
    name: {
      de: 'Herren - Farbe, Schnitt & Föhnen',
      en: "Men's Color, Cut & Blow Dry",
      tr: 'Erkek Boyama, Kesim & Fon',
      ar: 'صبغة وقص وتجفيف رجالي',
    },
    price: 65,
    duration: 75,
    category: 'color',
  },

  // Kinder & Jugend
  {
    id: 'jungs-haarschnitt',
    name: {
      de: 'Jungs - Haarschnitt (max. 12 Jahre)',
      en: "Boy's Haircut (up to 12 years)",
      tr: 'Cocuk Sac Kesimi (maks. 12 yas)',
      ar: 'قص شعر أولاد (حتى 12 سنة)',
    },
    price: 17,
    duration: 20,
    category: 'kids',
  },
  {
    id: 'kinder-waschen-schneiden-foehnen',
    name: {
      de: 'Kinder - Waschen, Schneiden & Föhnen',
      en: "Kids - Wash, Cut & Blow Dry",
      tr: 'Cocuk Yikama, Kesim & Fon',
      ar: 'أطفال - غسل وقص وتجفيف',
    },
    price: 20,
    duration: 25,
    category: 'kids',
  },

  // Angebote
  {
    id: 'angebot-waschen-schneiden',
    name: {
      de: 'Angebot: Herren-Waschen & Schneiden',
      en: "Special: Men's Wash & Cut",
      tr: 'Ozel Teklif: Erkek Yikama & Kesim',
      ar: 'عرض خاص: غسل وقص رجالي',
    },
    price: 30,
    duration: 35,
    category: 'specials',
  },
];

export function getServicesByCategory(category: ServiceCategory): Service[] {
  return services.filter((s) => s.category === category);
}

export function getServiceById(id: string): Service | undefined {
  return services.find((s) => s.id === id);
}
