/**
 * Post-build: Restructure dist/ for Cloudflare Pages deployment.
 * - Moves static assets from dist/client/ to dist/
 * - Creates _worker.js from server entry for Pages Worker
 * - Removes the conflicting .wrangler deploy redirect
 */
import { cpSync, existsSync, rmSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const root = process.cwd();
const dist = join(root, 'dist');
const client = join(dist, 'client');
const server = join(dist, 'server');

// Step 1: Remove the deploy redirect that causes conflicts
const deployConfig = join(root, '.wrangler', 'deploy', 'config.json');
if (existsSync(deployConfig)) {
  rmSync(deployConfig);
  console.log('✓ Removed .wrangler/deploy/config.json redirect');
}

// Step 2: Copy client assets to dist root (so Pages can serve them)
if (existsSync(client)) {
  cpSync(client, dist, { recursive: true, force: true });
  console.log('✓ Copied client assets to dist/');
}

// Step 3: Create _worker.js directory in dist for the Pages Worker
const workerDir = join(dist, '_worker.js');
if (!existsSync(workerDir)) {
  mkdirSync(workerDir, { recursive: true });
}

// Copy server files into _worker.js/
if (existsSync(server)) {
  cpSync(server, workerDir, { recursive: true, force: true });
  // Rename entry.mjs to index.js (Pages convention)
  const entryMjs = join(workerDir, 'entry.mjs');
  const indexJs = join(workerDir, 'index.js');
  if (existsSync(entryMjs)) {
    cpSync(entryMjs, indexJs);
    rmSync(entryMjs);
  }
  // Remove the generated wrangler.json from _worker.js
  const workerWranglerJson = join(workerDir, 'wrangler.json');
  if (existsSync(workerWranglerJson)) {
    rmSync(workerWranglerJson);
  }
  // Remove prerender dir if present
  const prerender = join(workerDir, '.prerender');
  if (existsSync(prerender)) {
    rmSync(prerender, { recursive: true });
  }
  console.log('✓ Created _worker.js/ from server bundle');
}

console.log('✓ Build ready for Cloudflare Pages deployment');
