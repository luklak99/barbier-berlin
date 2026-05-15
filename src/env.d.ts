/// <reference path="../.astro/types.d.ts" />

declare module 'cloudflare:workers' {
  interface Env {
    DB: D1Database;
    CRON_SECRET: string;
    // Microsoft Graph API (Exchange Online) — see docs/exchange-online-setup.md
    MS_TENANT_ID: string;
    MS_CLIENT_ID: string;
    MS_CLIENT_SECRET: string;
    MAIL_SENDER: string;
    // Master Key (64 Hex-Zeichen = 32 Byte) für AES-GCM-Verschlüsselung
    // sensibler Daten (aktuell: TOTP-Secrets). Generierung:
    //   openssl rand -hex 32
    // In CF Pages als verschlüsseltes Secret hinterlegen.
    TOTP_ENCRYPTION_KEY: string;
  }
}
