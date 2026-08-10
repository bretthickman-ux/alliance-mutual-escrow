/* Staging-vs-mockup screenshot capture for review. Playwright renders pages as
   visible, so requestAnimationFrame runs and the ported animation actually
   plays (unlike a backgrounded preview pane). Writes PNGs to OUT. */

import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = process.env.SHOT_OUT || '/private/tmp/claude-501/shots';
const STAGING = process.env.STAGING || 'http://localhost:4321';
const MOCKUP = 'file://' + path.resolve(__dirname, '../../deploy_m');

fs.mkdirSync(OUT, { recursive: true });
const DESKTOP = { width: 1440, height: 900 };

async function shot(page, name, clip) {
  await page.screenshot({ path: path.join(OUT, name + '.png'), clip });
  console.log('  wrote', name + '.png');
}

async function animClip(page) {
  const box = await page.locator('.anim-frame').boundingBox();
  return box ? { x: box.x, y: box.y, width: box.width, height: box.height } : undefined;
}

const browser = await chromium.launch({ args: ['--allow-file-access-from-files', '--autoplay-policy=no-user-gesture-required'] });

// ── staging: normal motion ──────────────────────────────────────────────────
{
  const ctx = await browser.newContext({ viewport: DESKTOP });
  const page = await ctx.newPage();
  await page.goto(STAGING + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  await shot(page, 'staging-home-hero');

  // scroll the animation into view and let it self-play into the Fund/Record phase
  await page.evaluate(() => document.querySelector('.anim-frame').scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(13000);
  await shot(page, 'staging-anim-midplay', await animClip(page));
  await page.waitForTimeout(9000);
  await shot(page, 'staging-anim-late', await animClip(page));

  await ctx.close();
}

// ── staging: reduced motion (should be the true final frame) ─────────────────
{
  const ctx = await browser.newContext({ viewport: DESKTOP, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto(STAGING + '/', { waitUntil: 'networkidle' });
  await page.evaluate(() => document.querySelector('.anim-frame').scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(1500);
  await shot(page, 'staging-anim-reducedmotion', await animClip(page));
  await ctx.close();
}

// ── staging: interior + team ─────────────────────────────────────────────────
{
  const ctx = await browser.newContext({ viewport: DESKTOP });
  const page = await ctx.newPage();
  for (const [route, name] of [['/buyers-sellers', 'staging-buyers'], ['/team', 'staging-team']]) {
    await page.goto(STAGING + route, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await shot(page, name);
  }
  await ctx.close();
}

// ── mockup references for side-by-side ───────────────────────────────────────
{
  const ctx = await browser.newContext({ viewport: DESKTOP });
  const page = await ctx.newPage();
  await page.goto(MOCKUP + '/index.html', { waitUntil: 'load' });
  await page.waitForTimeout(1500);
  await shot(page, 'mockup-home-hero');
  await page.goto(MOCKUP + '/buyers-sellers.html', { waitUntil: 'load' });
  await page.waitForTimeout(800);
  await shot(page, 'mockup-buyers');
  await page.goto(MOCKUP + '/team-a.html', { waitUntil: 'load' });
  await page.waitForTimeout(800);
  await shot(page, 'mockup-team');
  await ctx.close();
}

await browser.close();
console.log('done ->', OUT);
