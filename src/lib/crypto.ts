// All crypto operations use Web Crypto API (Cloudflare Workers compatible)

export function generateId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function generateSessionToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

// --- Password Hashing (PBKDF2 - Web Crypto API) ---

const PBKDF2_ITERATIONS = 100_000;
const SALT_LENGTH = 16;

export async function hashPassword(password: string): Promise<string> {
  const salt = new Uint8Array(SALT_LENGTH);
  crypto.getRandomValues(salt);

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );

  const derivedBits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    key,
    256,
  );

  const hash = new Uint8Array(derivedBits);
  const saltHex = Array.from(salt, (b) => b.toString(16).padStart(2, '0')).join('');
  const hashHex = Array.from(hash, (b) => b.toString(16).padStart(2, '0')).join('');

  return `${saltHex}:${hashHex}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltHex, storedHashHex] = stored.split(':');
  if (!saltHex || !storedHashHex) return false;

  const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map((b) => parseInt(b, 16)));

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );

  const derivedBits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    key,
    256,
  );

  const hash = new Uint8Array(derivedBits);
  const hashHex = Array.from(hash, (b) => b.toString(16).padStart(2, '0')).join('');

  // Constant-time comparison to prevent timing attacks
  if (hashHex.length !== storedHashHex.length) return false;
  let result = 0;
  for (let i = 0; i < hashHex.length; i++) {
    result |= hashHex.charCodeAt(i) ^ storedHashHex.charCodeAt(i);
  }
  return result === 0;
}

// --- Session Token Hashing ---

export async function hashToken(token: string): Promise<string> {
  const data = new TextEncoder().encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hash = new Uint8Array(hashBuffer);
  return Array.from(hash, (b) => b.toString(16).padStart(2, '0')).join('');
}

// --- Symmetric encryption for TOTP secrets at rest (AES-GCM) ---
//
// Format: <iv-hex>:<ciphertext-hex>
// Key:    32 Bytes (256 Bit), Hex-codiert in Env-Var TOTP_ENCRYPTION_KEY (64 Zeichen)
// IV:     12 zufällige Bytes pro Verschlüsselung (AES-GCM-Standard)

async function importAesKey(keyHex: string): Promise<CryptoKey> {
  if (!/^[0-9a-fA-F]{64}$/.test(keyHex)) {
    throw new Error('TOTP_ENCRYPTION_KEY muss genau 64 Hex-Zeichen (32 Byte) lang sein.');
  }
  const raw = new Uint8Array(keyHex.match(/.{2}/g)!.map((b) => parseInt(b, 16)));
  return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

export async function encryptSecret(plaintext: string, keyHex: string): Promise<string> {
  const key = await importAesKey(keyHex);
  const iv = new Uint8Array(12);
  crypto.getRandomValues(iv);
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(plaintext),
  );
  const ivHex = Array.from(iv, (b) => b.toString(16).padStart(2, '0')).join('');
  const ctHex = Array.from(new Uint8Array(ciphertext), (b) => b.toString(16).padStart(2, '0')).join('');
  return `${ivHex}:${ctHex}`;
}

export async function decryptSecret(stored: string, keyHex: string): Promise<string> {
  const [ivHex, ctHex] = stored.split(':');
  if (!ivHex || !ctHex) throw new Error('Ungültiges Encryption-Format.');
  const iv = new Uint8Array(ivHex.match(/.{2}/g)!.map((b) => parseInt(b, 16)));
  const ct = new Uint8Array(ctHex.match(/.{2}/g)!.map((b) => parseInt(b, 16)));
  const key = await importAesKey(keyHex);
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
  return new TextDecoder().decode(pt);
}

// Erkennt verschlüsselte Werte am Format <hex>:<hex> mit korrekter IV-Länge (24 hex chars)
export function isEncryptedSecret(stored: string): boolean {
  return /^[0-9a-f]{24}:[0-9a-f]+$/i.test(stored);
}

// --- TOTP (Time-based One-Time Password - RFC 6238) ---

export function generateTotpSecret(): string {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  return base32Encode(bytes);
}

export async function verifyTotp(secret: string, code: string): Promise<boolean> {
  const now = Math.floor(Date.now() / 1000);
  const timeStep = 30;

  // Check current and adjacent time steps (±1) for clock drift
  for (let i = -1; i <= 1; i++) {
    const counter = Math.floor((now + i * timeStep) / timeStep);
    const expected = await generateTotpCode(secret, counter);
    if (expected === code) return true;
  }
  return false;
}

async function generateTotpCode(secret: string, counter: number): Promise<string> {
  const secretBytes = base32Decode(secret);
  const counterBytes = new ArrayBuffer(8);
  const view = new DataView(counterBytes);
  view.setBigUint64(0, BigInt(counter));

  const key = await crypto.subtle.importKey(
    'raw',
    secretBytes,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign'],
  );

  const hmac = await crypto.subtle.sign('HMAC', key, counterBytes);
  const hmacBytes = new Uint8Array(hmac);

  const offset = hmacBytes[19]! & 0x0f;
  const binary =
    ((hmacBytes[offset]! & 0x7f) << 24) |
    ((hmacBytes[offset + 1]! & 0xff) << 16) |
    ((hmacBytes[offset + 2]! & 0xff) << 8) |
    (hmacBytes[offset + 3]! & 0xff);

  const otp = binary % 1_000_000;
  return otp.toString().padStart(6, '0');
}

export function getTotpUri(secret: string, email: string): string {
  return `otpauth://totp/Barbier%20Berlin:${encodeURIComponent(email)}?secret=${secret}&issuer=Barbier%20Berlin&algorithm=SHA1&digits=6&period=30`;
}

// --- Base32 encoding/decoding ---

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Encode(bytes: Uint8Array): string {
  let result = '';
  let bits = 0;
  let value = 0;
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      result += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    result += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }
  return result;
}

function base32Decode(str: string): Uint8Array {
  const cleaned = str.toUpperCase().replace(/[^A-Z2-7]/g, '');
  const bytes: number[] = [];
  let bits = 0;
  let value = 0;
  for (const char of cleaned) {
    const idx = BASE32_ALPHABET.indexOf(char);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return new Uint8Array(bytes);
}
