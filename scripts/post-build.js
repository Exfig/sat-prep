/**
 * Post-build script: restructures dist/ so the SPA lives under dist/sat-prep/
 * and the landing page sits at dist/index.html.
 *
 * Before: dist/index.html (SPA), dist/assets/, dist/graphs/, ...
 * After:  dist/index.html (landing), dist/sat-prep/index.html (SPA), dist/sat-prep/assets/, ...
 */
import { cpSync, mkdirSync, renameSync, readdirSync, rmSync, copyFileSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const root = join(__dirname, '..');
const dist = join(root, 'dist');
const temp = join(root, 'dist-temp');

// 1. Move dist → dist-temp
renameSync(dist, temp);

// 2. Create new dist/sat-prep/
mkdirSync(join(dist, 'sat-prep'), { recursive: true });

// 3. Move everything from dist-temp into dist/sat-prep/
for (const entry of readdirSync(temp)) {
  renameSync(join(temp, entry), join(dist, 'sat-prep', entry));
}
rmSync(temp, { recursive: true });

// 4. Copy landing page to dist/index.html
copyFileSync(join(root, 'landing', 'index.html'), join(dist, 'index.html'));

// 5. Move robots.txt and sitemap.xml to dist root (they were moved into dist/sat-prep/ in step 3)
for (const file of ['robots.txt', 'sitemap.xml']) {
  const src = join(dist, 'sat-prep', file);
  if (existsSync(src)) {
    renameSync(src, join(dist, file));
  }
}

console.log('Post-build: restructured dist/ for Vercel deployment');
console.log('  dist/index.html          → landing page');
console.log('  dist/robots.txt          → robots.txt');
console.log('  dist/sitemap.xml         → sitemap.xml');
console.log('  dist/sat-prep/index.html → SPA entry point');
