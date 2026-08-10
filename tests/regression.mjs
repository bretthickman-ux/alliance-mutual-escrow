/* Regression harness (Phases 1-4).

   Gates, all fatal:
   1. Content guard: no em dashes (or long-dash cousins), no "hands you the
      keys", and no engineering narrative (HANDOFF section 2: visitors never
      read copy about the site itself) anywhere in built HTML.
   2. Structure guard: every page has exactly one h1; every ld+json block
      parses; every internal link and asset href resolves in dist/; every guide
      has its generated PDF.
   3. Render guard: every page at 1440x900 and 390x844 in Chromium with zero
      console errors, zero page errors, zero horizontal overflow. With
      CROSS_ENGINE=1, Firefox and WebKit run the desktop pass too.

   The static server mirrors production routes that Pages Functions provide
   (/api/reviews returns an empty cache) so the client code runs the same path
   it will run live. Run after `astro build`. */

import { chromium, firefox, webkit } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { guideSlugs } from '../src/data/guides.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(__dirname, '..', 'dist');
const CROSS = process.env.CROSS_ENGINE === '1';

const PAGES = [
  '/',
  '/services',
  '/buyers-sellers',
  '/agents',
  '/lenders',
  '/investors',
  '/team',
  '/calculator',
  '/open-an-escrow',
  '/guides',
  ...guideSlugs.map((s) => `/guides/${s}`),
  '/consumer-feedback',
  '/complaint-policy',
  '/terms',
  '/privacy',
  '/resources',
  '/404.html',
];

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
];

const failures = [];

/* ── helpers ────────────────────────────────────────────────────────────── */
function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(p));
    else if (entry.name.endsWith('.html')) out.push(p);
  }
  return out;
}

function distHas(urlPath) {
  const clean = decodeURIComponent(urlPath.split('#')[0].split('?')[0]);
  if (clean === '' || clean === '/') return fs.existsSync(path.join(DIST, 'index.html'));
  const p = path.join(DIST, clean);
  return (
    fs.existsSync(p) ||
    fs.existsSync(p + '.html') ||
    fs.existsSync(path.join(p, 'index.html'))
  );
}

/* ── 1 + 2: content and structure guards ────────────────────────────────── */
function staticGuards() {
  if (!fs.existsSync(DIST)) {
    failures.push('dist/ not found. Run `astro build` first.');
    return;
  }
  const htmlFiles = walk(DIST);
  const longDash = /[—–―‒]/;
  // Engineering narrative: the site never talks about itself to visitors
  // (HANDOFF section 2). Checked against visible text only, so HTML attributes
  // like input placeholders do not false-positive.
  const narrative = [
    'calculator itemizes',
    'design review',
    'placeholder',
    'illustrative',
    'real published rates',
    'formulas we bill',
    'sample page',
  ];

  for (const file of htmlFiles) {
    const rel = path.relative(DIST, file);
    const text = fs.readFileSync(file, 'utf8');

    text.split('\n').forEach((line, i) => {
      if (longDash.test(line)) failures.push(`EM/EN DASH in ${rel}:${i + 1} -> ${line.trim().slice(0, 100)}`);
      if (/hands you the keys/i.test(line)) failures.push(`NEUTRALITY VIOLATION "hands you the keys" in ${rel}:${i + 1}`);
    });

    const visible = text.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<[^>]*>/g, ' ').toLowerCase();
    for (const phrase of narrative) {
      if (visible.includes(phrase)) failures.push(`ENGINEERING NARRATIVE "${phrase}" visible in ${rel}`);
    }

    // exactly one h1
    const h1s = (text.match(/<h1[\s>]/g) || []).length;
    if (h1s !== 1) failures.push(`H1 COUNT ${rel}: expected 1, found ${h1s}`);

    // ld+json parses
    for (const m of text.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
      try {
        JSON.parse(m[1]);
      } catch (e) {
        failures.push(`SCHEMA JSON invalid in ${rel}: ${e.message}`);
      }
    }

    // internal links + local assets resolve
    for (const m of text.matchAll(/(?:href|src)="(\/[^"]*)"/g)) {
      const url = m[1];
      if (url.startsWith('//')) continue;
      if (url.startsWith('/api/')) continue; // Pages Functions, not in dist
      if (!distHas(url)) failures.push(`BROKEN LINK in ${rel}: ${url}`);
    }
  }

  // every guide has its PDF
  for (const slug of guideSlugs) {
    if (!fs.existsSync(path.join(DIST, 'pdfs', `${slug}.pdf`))) {
      failures.push(`MISSING PDF for guide "${slug}" (dist/pdfs/${slug}.pdf)`);
    }
  }

  console.log(`Static guards: ${htmlFiles.length} HTML files scanned.`);
}

/* ── static server (mirrors the /api/reviews function with an empty cache) ─ */
const MIME = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.png': 'image/png', '.webp': 'image/webp', '.avif': 'image/avif', '.mp4': 'video/mp4',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.ico': 'image/x-icon', '.pdf': 'application/pdf',
  '.xml': 'application/xml', '.txt': 'text/plain',
};

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const urlPath = decodeURIComponent(req.url.split('?')[0]);
      if (urlPath === '/api/reviews') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ fetchedAt: 0, rating: null, count: null, reviews: [] }));
        return;
      }
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

/* ── 3: render guard ────────────────────────────────────────────────────── */
async function renderGuard(browserType, engineName, viewports, base) {
  const browser = await browserType.launch();
  for (const vp of viewports) {
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
      await page.waitForTimeout(700);

      const overflow = await page.evaluate(() => {
        const de = document.documentElement;
        return { scrollWidth: de.scrollWidth, clientWidth: de.clientWidth };
      });
      if (overflow.scrollWidth - overflow.clientWidth > 1) {
        failures.push(`H-OVERFLOW ${route} @ ${engineName}/${vp.name}: ${overflow.scrollWidth} > ${overflow.clientWidth}`);
      }
      for (const e of errors) failures.push(`${route} @ ${engineName}/${vp.name}: ${e}`);
      await page.close();
    }
    await context.close();
  }
  await browser.close();
}

/* ── run ────────────────────────────────────────────────────────────────── */
staticGuards();

const server = await startServer();
const base = `http://localhost:${server.address().port}`;

await renderGuard(chromium, 'chromium', VIEWPORTS, base);
if (CROSS) {
  await renderGuard(firefox, 'firefox', [VIEWPORTS[0]], base);
  await renderGuard(webkit, 'webkit', [VIEWPORTS[0]], base);
}
server.close();

if (failures.length) {
  console.error(`\n✗ Regression failed (${failures.length}):`);
  for (const f of failures) console.error('  - ' + f);
  process.exit(1);
} else {
  const engines = CROSS ? 'chromium + firefox + webkit' : 'chromium';
  console.log(`\n✓ Regression passed: ${PAGES.length} pages, ${engines}, no console errors, no overflow, one h1 each, valid schema, all links resolve, all guide PDFs present, no em dashes, no "hands you the keys".`);
}
