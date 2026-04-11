/// <reference path="../.astro/types.d.ts" />

declare module 'cloudflare:workers' {
  interface Env {
    DB: D1Database;
    RELAY_SECRET: string;
    CRON_SECRET: string;
  }
}
