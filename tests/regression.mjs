/* Regression harness for the static build (HANDOFF section 9).

   Two gates, both fail the process (exit 1) on any violation:

   1. Content guard: greps every built HTML file for em dashes (and their long
      dash cousins) and for the phrase "hands you the keys". Either is a bug:
      the em dash rule and the neutrality rule are non-negotiable.

   2. Render guard: loads every page at 1440x900 and 390x844 in headless
      Chromium and fails on any console error, page error, or horizontal
      overflow.

   Run after `astro build`. `npm run test:build` does both. */

import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(__dirname, '..', 'dist');

const PAGES = ['/', '/buyers-sellers', '/agents', '/lenders', '/investors', '/team', '/team-b'];
const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
];

const failures = [];

// ── 1. content guard ────────────────────────────────────────────────────────
function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(p));
    else if (entry.name.endsWith('.html')) out.push(p);
  }
  return out;
}

function contentGuard() {
  if (!fs.existsSync(DIST)) {
    failures.push('dist/ not found. Run `astro build` first.');
    return;
  }
  const htmlFiles = walk(DIST);
  const longDash = /[—–―‒]/; // em, en, horizontal bar, figure dash
  for (const file of htmlFiles) {
    const rel = path.relative(DIST, file);
    const text = fs.readFileSync(file, 'utf8');
    text.split('\n').forEach((line, i) => {
      if (longDash.test(line)) {
        failures.push(`EM/EN DASH in ${rel}:${i + 1} -> ${line.trim().slice(0, 120)}`);
      }
      if (/hands you the keys/i.test(line)) {
        failures.push(`NEUTRALITY VIOLATION "hands you the keys" in ${rel}:${i + 1}`);
      }
    });
  }
  console.log(`Content guard: scanned ${htmlFiles.length} HTML files.`);
}

// ── static server over dist ─────────────────────────────────────────────────
const MIME = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.png': 'image/png', '.webp': 'image/webp', '.avif': 'image/avif', '.mp4': 'video/mp4',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.ico': 'image/x-icon',
};

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let urlPath = decodeURIComponent(req.url.split('?')[0]);
      let filePath = path.join(DIST, urlPath);
      try {
        if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
          filePath = path.join(filePath, 'index.html');
        } else if (!fs.existsSync(filePath) && fs.existsSync(filePath + '.html')) {
          filePath = filePath + '.html';
        } else if (!fs.existsSync(filePath)) {
          filePath = path.join(DIST, urlPath, 'index.html');
        }
        if (!fs.existsSync(filePath)) {
          res.writeHead(404);
          res.end('not found');
          return;
        }
        res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath)] || 'application/octet-stream' });
        fs.createReadStream(filePath).pipe(res);
      } catch {
        res.writeHead(500);
        res.end('error');
      }
    });
    server.listen(0, () => resolve(server));
  });
}

// ── 2. render guard ─────────────────────────────────────────────────────────
async function renderGuard() {
  const server = await startServer();
  const port = server.address().port;
  const base = `http://localhost:${port}`;
  const browser = await chromium.launch();

  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 1,
      reducedMotion: 'no-preference',
    });
    for (const route of PAGES) {
      const page = await context.newPage();
      const errors = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(`console: ${msg.text()}`);
      });
      page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));

      await page.goto(base + route, { waitUntil: 'networkidle' });
      // Let islands hydrate and reveals settle.
      await page.waitForTimeout(800);

      const overflow = await page.evaluate(() => {
        const de = document.documentElement;
        return { scrollWidth: de.scrollWidth, clientWidth: de.clientWidth };
      });
      if (overflow.scrollWidth - overflow.clientWidth > 1) {
        failures.push(`H-OVERFLOW ${route} @ ${vp.name} (${vp.width}px): scrollWidth ${overflow.scrollWidth} > ${overflow.clientWidth}`);
      }
      for (const e of errors) failures.push(`${route} @ ${vp.name}: ${e}`);

      await page.close();
    }
    await context.close();
  }

  await browser.close();
  server.close();
}

// ── run ─────────────────────────────────────────────────────────────────────
contentGuard();
await renderGuard();

if (failures.length) {
  console.error(`\n✗ Regression failed (${failures.length}):`);
  for (const f of failures) console.error('  - ' + f);
  process.exit(1);
} else {
  console.log(`\n✓ Regression passed: ${PAGES.length} pages x ${VIEWPORTS.length} viewports, no console errors, no horizontal overflow, no em dashes, no "hands you the keys".`);
}
