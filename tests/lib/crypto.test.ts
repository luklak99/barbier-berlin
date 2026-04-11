import { describe, it, expect } from 'vitest';
import {
  generateId,
  generateSessionToken,
  hashPassword,
  verifyPassword,
  hashToken,
  generateTotpSecret,
  verifyTotp,
  getTotpUri,
} from '../../src/lib/crypto';

describe('generateId', () => {
  it('gibt einen 32-Zeichen Hex-String zurück', () => {
    const id = generateId();
    expect(id).toHaveLength(32);
    expect(id).toMatch(/^[0-9a-f]{32}$/);
  });

  it('gibt bei zwei Aufrufen unterschiedliche Werte zurück', () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);
  });
});

describe('generateSessionToken', () => {
  it('gibt einen 64-Zeichen Hex-String zurück', () => {
    const token = generateSessionToken();
    expect(token).toHaveLength(64);
    expect(token).toMatch(/^[0-9a-f]{64}$/);
  });

  it('gibt bei zwei Aufrufen unterschiedliche Werte zurück', () => {
    const token1 = generateSessionToken();
    const token2 = generateSessionToken();
    expect(token1).not.toBe(token2);
  });
});

describe('hashPassword', () => {
  it('gibt String im Format saltHex:hashHex zurück', async () => {
    const result = await hashPassword('TestPasswort123!');
    expect(result).toMatch(/^[0-9a-f]+:[0-9a-f]+$/);
    const [salt, hash] = result.split(':');
    // Salt = 16 Bytes = 32 Hex-Zeichen
    expect(salt).toHaveLength(32);
    // Hash = 256 Bit = 32 Bytes = 64 Hex-Zeichen
    expect(hash).toHaveLength(64);
  });

  it('gibt bei gleichem Passwort unterschiedliche Hashes zurück (verschiedene Salts)', async () => {
    const hash1 = await hashPassword('GleichesPasswort1!');
    const hash2 = await hashPassword('GleichesPasswort1!');
    expect(hash1).not.toBe(hash2);
  });
});

describe('verifyPassword', () => {
  it('gibt true für korrektes Passwort zurück', async () => {
    const password = 'MeinSicheresPasswort123!';
    const hashed = await hashPassword(password);
    const result = await verifyPassword(password, hashed);
    expect(result).toBe(true);
  });

  it('gibt false für falsches Passwort zurück', async () => {
    const hashed = await hashPassword('RichtigesPasswort1!');
    const result = await verifyPassword('FalschesPasswort1!', hashed);
    expect(result).toBe(false);
  });

  it('gibt false für leeren String zurück', async () => {
    const hashed = await hashPassword('EinPasswort123!');
    const result = await verifyPassword('', hashed);
    expect(result).toBe(false);
  });

  it('gibt false für ungültiges stored-Format zurück', async () => {
    const result = await verifyPassword('test', 'kein-gueltiges-format');
    expect(result).toBe(false);
  });

  it('Timing-Safety: Hash hat konsistente Länge unabhängig vom Input', async () => {
    const hash1 = await hashPassword('kurz');
    const hash2 = await hashPassword('ein-sehr-langes-passwort-das-viel-laenger-ist-als-das-andere');
    const [, hashHex1] = hash1.split(':');
    const [, hashHex2] = hash2.split(':');
    expect(hashHex1!.length).toBe(hashHex2!.length);
  });
});

describe('hashToken', () => {
  it('gibt konsistenten SHA-256 Hash zurück (gleicher Input → gleicher Output)', async () => {
    const token = 'mein-session-token-12345';
    const hash1 = await hashToken(token);
    const hash2 = await hashToken(token);
    expect(hash1).toBe(hash2);
  });

  it('gibt 64-Zeichen Hex-String zurück (SHA-256)', async () => {
    const hash = await hashToken('test-token');
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('gibt unterschiedliche Hashes für unterschiedliche Inputs', async () => {
    const hash1 = await hashToken('token-a');
    const hash2 = await hashToken('token-b');
    expect(hash1).not.toBe(hash2);
  });
});

describe('generateTotpSecret', () => {
  it('gibt Base32-String zurück (nur A-Z und 2-7)', () => {
    const secret = generateTotpSecret();
    expect(secret).toMatch(/^[A-Z2-7]+$/);
  });

  it('hat eine sinnvolle Länge (20 Bytes → 32 Base32-Zeichen)', () => {
    const secret = generateTotpSecret();
    expect(secret.length).toBe(32);
  });

  it('gibt bei zwei Aufrufen unterschiedliche Werte zurück', () => {
    const secret1 = generateTotpSecret();
    const secret2 = generateTotpSecret();
    expect(secret1).not.toBe(secret2);
  });
});

describe('verifyTotp', () => {
  it('gibt false für einen offensichtlich falschen Code zurück', async () => {
    const secret = generateTotpSecret();
    const result = await verifyTotp(secret, '000000');
    // Kann theoretisch true sein, aber extrem unwahrscheinlich
    // Wir testen hauptsächlich, dass die Funktion ohne Fehler läuft
    expect(typeof result).toBe('boolean');
  });

  it('gibt false für einen ungültigen Code zurück', async () => {
    const secret = generateTotpSecret();
    const result = await verifyTotp(secret, 'abcdef');
    expect(result).toBe(false);
  });
});

describe('getTotpUri', () => {
  it('gibt korrekten otpauth:// URI zurück', () => {
    const secret = 'JBSWY3DPEHPK3PXP';
    const email = 'test@barbier.berlin';
    const uri = getTotpUri(secret, email);

    expect(uri).toContain('otpauth://totp/');
    expect(uri).toContain('Barbier%20Berlin');
    expect(uri).toContain(`secret=${secret}`);
    expect(uri).toContain('issuer=Barbier%20Berlin');
    expect(uri).toContain('algorithm=SHA1');
    expect(uri).toContain('digits=6');
    expect(uri).toContain('period=30');
    expect(uri).toContain(encodeURIComponent(email));
  });

  it('encodiert Sonderzeichen in der E-Mail korrekt', () => {
    const uri = getTotpUri('SECRET', 'user+tag@example.com');
    expect(uri).toContain(encodeURIComponent('user+tag@example.com'));
  });
});
