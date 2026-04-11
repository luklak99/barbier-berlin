/// <reference path="../.astro/types.d.ts" />

// Cloudflare Workers env bindings (Astro v6+: use import { env } from 'cloudflare:workers')
declare module 'cloudflare:workers' {
  interface Env {
    DB: D1Database;
    SMTP_USER: string;
    SMTP_PASS: string;
  }
}
