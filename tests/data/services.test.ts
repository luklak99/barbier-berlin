import { describe, it, expect } from 'vitest';
import {
  services,
  getServicesByCategory,
  getServiceById,
  type ServiceCategory,
} from '../../src/data/services';

const VALID_CATEGORIES: ServiceCategory[] = ['haircut', 'beard', 'face', 'color', 'kids', 'specials'];

describe('services Array', () => {
  it('hat mehr als 20 Einträge', () => {
    expect(services.length).toBeGreaterThan(20);
  });

  it('jeder Service hat id, name, price, duration und category', () => {
    for (const service of services) {
      expect(service.id).toBeDefined();
      expect(typeof service.id).toBe('string');
      expect(service.id.length).toBeGreaterThan(0);

      expect(service.name).toBeDefined();
      expect(typeof service.name).toBe('object');

      expect(service.price).toBeDefined();
      expect(typeof service.price).toBe('number');

      expect(service.duration).toBeDefined();
      expect(typeof service.duration).toBe('number');

      expect(service.category).toBeDefined();
      expect(typeof service.category).toBe('string');
    }
  });

  it('alle IDs sind unique', () => {
    const ids = services.map((s) => s.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('alle Preise sind > 0', () => {
    for (const service of services) {
      expect(service.price).toBeGreaterThan(0);
    }
  });

  it('alle Kategorien sind gültige ServiceCategory Werte', () => {
    for (const service of services) {
      expect(VALID_CATEGORIES).toContain(service.category);
    }
  });

  it('alle Services haben 4-sprachige Namen (de, en, tr, ar)', () => {
    for (const service of services) {
      expect(service.name.de).toBeDefined();
      expect(typeof service.name.de).toBe('string');
      expect(service.name.de.length).toBeGreaterThan(0);

      expect(service.name.en).toBeDefined();
      expect(typeof service.name.en).toBe('string');
      expect(service.name.en.length).toBeGreaterThan(0);

      expect(service.name.tr).toBeDefined();
      expect(typeof service.name.tr).toBe('string');
      expect(service.name.tr.length).toBeGreaterThan(0);

      expect(service.name.ar).toBeDefined();
      expect(typeof service.name.ar).toBe('string');
      expect(service.name.ar.length).toBeGreaterThan(0);
    }
  });
});

describe('getServicesByCategory', () => {
  it('gibt nur Services der Kategorie haircut zurück', () => {
    const haircuts = getServicesByCategory('haircut');
    expect(haircuts.length).toBeGreaterThan(0);
    for (const service of haircuts) {
      expect(service.category).toBe('haircut');
    }
  });

  it('gibt leeres Array für nicht vorhandene Kategorie zurück', () => {
    // TypeScript erlaubt das nicht, aber zur Sicherheit
    const result = getServicesByCategory('nonexistent' as ServiceCategory);
    expect(result).toEqual([]);
  });

  it('gibt alle Kategorien korrekt gefiltert zurück', () => {
    for (const category of VALID_CATEGORIES) {
      const result = getServicesByCategory(category);
      for (const service of result) {
        expect(service.category).toBe(category);
      }
    }
  });
});

describe('getServiceById', () => {
  it('gibt korrekten Service für herren-rasur zurück', () => {
    const service = getServiceById('herren-rasur');
    expect(service).toBeDefined();
    expect(service!.id).toBe('herren-rasur');
    expect(service!.category).toBe('beard');
    expect(service!.price).toBe(17);
  });

  it('gibt undefined für nicht existente ID zurück', () => {
    expect(getServiceById('nonexistent')).toBeUndefined();
  });

  it('gibt undefined für leeren String zurück', () => {
    expect(getServiceById('')).toBeUndefined();
  });
});
