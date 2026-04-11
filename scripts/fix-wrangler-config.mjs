/**
 * Fix the generated wrangler.json after Astro build.
 * Strips Worker-only fields and fixes paths for Cloudflare Pages.
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const configPath = join(process.cwd(), 'dist', 'server', 'wrangler.json');

if (existsSync(configPath)) {
  const config = JSON.parse(readFileSync(configPath, 'utf-8'));

  // Remove Worker-only fields that conflict with Pages
  const workerOnlyFields = [
    'main', 'rules', 'assets', 'images', 'configPath', 'userConfigPath',
    'legacy_env', 'jsx_factory', 'jsx_fragment', 'triggers',
    'topLevelName', 'definedEnvironments', 'no_bundle',
  ];

  for (const field of workerOnlyFields) {
    delete config[field];
  }

  // pages_build_output_dir relative to where wrangler.json lives (dist/server/)
  config.pages_build_output_dir = '..';

  writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
  console.log('✓ Fixed wrangler.json for Pages compatibility');
} else {
  console.log('⚠ No wrangler.json found in dist/server/');
}
