/// <reference path="../.astro/types.d.ts" />

declare module 'cloudflare:workers' {
  interface Env {
    DB: D1Database;
    SMTP_USER: string;
    SMTP_PASS: string;
    CRON_SECRET: string;
  }
}
