import { describe, it, expect } from 'vitest';
import { getSessionToken, sessionCookie, clearSessionCookie } from '../../src/lib/session';

describe('getSessionToken', () => {
  it('extrahiert __Host-session aus Cookie-Header', () => {
    const request = new Request('https://barbier.berlin', {
      headers: { Cookie: '__Host-session=abc123def456; other=value' },
    });
    expect(getSessionToken(request)).toBe('abc123def456');
  });

  it('gibt null zurück wenn Cookie nicht vorhanden', () => {
    const request = new Request('https://barbier.berlin');
    expect(getSessionToken(request)).toBeNull();
  });

  it('gibt null zurück bei leerem Cookie-Header', () => {
    const request = new Request('https://barbier.berlin', {
      headers: { Cookie: '' },
    });
    expect(getSessionToken(request)).toBeNull();
  });

  it('gibt null zurück wenn __Host-session nicht im Cookie ist', () => {
    const request = new Request('https://barbier.berlin', {
      headers: { Cookie: 'other=value; another=test' },
    });
    expect(getSessionToken(request)).toBeNull();
  });

  it('extrahiert korrekten Wert wenn mehrere Cookies vorhanden', () => {
    const request = new Request('https://barbier.berlin', {
      headers: { Cookie: 'first=1; __Host-session=mein-token-wert; last=3' },
    });
    expect(getSessionToken(request)).toBe('mein-token-wert');
  });
});

describe('sessionCookie', () => {
  it('enthält den Cookie-Namen __Host-session', () => {
    const cookie = sessionCookie('my-token');
    expect(cookie).toContain('__Host-session=my-token');
  });

  it('enthält HttpOnly Flag', () => {
    const cookie = sessionCookie('token');
    expect(cookie).toContain('HttpOnly');
  });

  it('enthält Secure Flag', () => {
    const cookie = sessionCookie('token');
    expect(cookie).toContain('Secure');
  });

  it('enthält SameSite=Lax', () => {
    const cookie = sessionCookie('token');
    expect(cookie).toContain('SameSite=Lax');
  });

  it('enthält Path=/', () => {
    const cookie = sessionCookie('token');
    expect(cookie).toContain('Path=/');
  });

  it('enthält Max-Age', () => {
    const cookie = sessionCookie('token');
    expect(cookie).toContain('Max-Age=');
  });

  it('nutzt Standard Max-Age von 24 Stunden', () => {
    const cookie = sessionCookie('token');
    // 24 * 60 * 60 = 86400
    expect(cookie).toContain('Max-Age=86400');
  });

  it('akzeptiert benutzerdefinierten maxAge', () => {
    const cookie = sessionCookie('token', 3600);
    expect(cookie).toContain('Max-Age=3600');
  });
});

describe('clearSessionCookie', () => {
  it('hat Max-Age=0', () => {
    const cookie = clearSessionCookie();
    expect(cookie).toContain('Max-Age=0');
  });

  it('nutzt den selben Cookie-Namen __Host-session', () => {
    const cookie = clearSessionCookie();
    expect(cookie).toContain('__Host-session=');
  });

  it('enthält die Security-Flags', () => {
    const cookie = clearSessionCookie();
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('Secure');
    expect(cookie).toContain('SameSite=Lax');
    expect(cookie).toContain('Path=/');
  });
});
