/// <reference path="../.astro/types.d.ts" />

declare module 'cloudflare:workers' {
  interface Env {
    DB: D1Database;
    BREVO_API_KEY: string;
    CRON_SECRET: string;
  }
}
