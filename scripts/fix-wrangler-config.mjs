/**
 * Fix the generated wrangler.json after Astro build.
 * Strips incompatible fields for Cloudflare Pages deployment.
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const configPath = join(process.cwd(), 'dist', 'server', 'wrangler.json');

if (existsSync(configPath)) {
  const config = JSON.parse(readFileSync(configPath, 'utf-8'));

  // Only keep Pages-compatible fields
  const pagesConfig = {
    name: config.name,
    pages_build_output_dir: '..',
    compatibility_date: config.compatibility_date,
    compatibility_flags: config.compatibility_flags,
    d1_databases: config.d1_databases,
    vars: config.vars || {},
  };

  writeFileSync(configPath, JSON.stringify(pagesConfig, null, 2), 'utf-8');
  console.log('✓ Fixed wrangler.json for Pages compatibility');
} else {
  console.log('⚠ No wrangler.json found in dist/server/');
}
