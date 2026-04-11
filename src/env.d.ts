/// <reference path="../.astro/types.d.ts" />

type Runtime = import('@astrojs/cloudflare').Runtime<{
  DB: D1Database;
  SMTP_USER: string;
  SMTP_PASS: string;
}>;

declare namespace App {
  interface Locals extends Runtime {}
}
