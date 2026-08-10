/* Build-time PDF generator for the guide library (Phase 2).

   Renders every guide in src/data/guides.mjs to an AME-branded PDF at
   public/pdfs/<slug>.pdf using pdf-lib (pure JS: works in any CI, no browser).
   Letter pages, the site's ink/amber palette, serif headings, and a contact
   footer. Copy comes from the same data module as the HTML pages, so the PDF
   can never drift from the page. */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { guides } from '../src/data/guides.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, '..', 'public', 'pdfs');

const INK = rgb(0.059, 0.071, 0.082);
const SOFT = rgb(0.337, 0.365, 0.388);
const FAINT = rgb(0.604, 0.627, 0.651);
const AMBER = rgb(0.725, 0.478, 0.227);
const PAPER = rgb(0.965, 0.961, 0.949);

const PAGE_W = 612, PAGE_H = 792;
const MARGIN = 64;
const WIDTH = PAGE_W - MARGIN * 2;

/** pdf-lib standard fonts use WinAnsi; swap anything outside it. */
const clean = (s) =>
  String(s)
    .replace(/’/g, "'").replace(/‘/g, "'")
    .replace(/“/g, '"').replace(/”/g, '"')
    .replace(/·/g, '-').replace(/→/g, '->')
    .replace(/[–—―‒]/g, ', ');

function wrap(font, size, text, width) {
  const words = clean(text).split(/\s+/);
  const lines = [];
  let line = '';
  for (const w of words) {
    const probe = line ? line + ' ' + w : w;
    if (font.widthOfTextAtSize(probe, size) > width && line) {
      lines.push(line);
      line = w;
    } else {
      line = probe;
    }
  }
  if (line) lines.push(line);
  return lines;
}

async function renderGuide(guide) {
  const doc = await PDFDocument.create();
  const serif = await doc.embedFont(StandardFonts.TimesRoman);
  const serifBold = await doc.embedFont(StandardFonts.TimesRomanBold);
  const sans = await doc.embedFont(StandardFonts.Helvetica);
  const sansBold = await doc.embedFont(StandardFonts.HelveticaBold);

  doc.setTitle(clean(guide.title));
  doc.setAuthor('Alliance Mutual Escrow');
  doc.setSubject(clean(guide.description));

  let page = doc.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - MARGIN;
  let pageNo = 1;

  const footer = () => {
    page.drawLine({ start: { x: MARGIN, y: 52 }, end: { x: PAGE_W - MARGIN, y: 52 }, thickness: 0.6, color: rgb(0.85, 0.84, 0.82) });
    page.drawText('Alliance Mutual Escrow  |  12681 Newport Ave, Tustin, CA 92780  |  (714) 544-6525  |  info@ameescrow.com', {
      x: MARGIN, y: 40, size: 7.5, font: sans, color: FAINT,
    });
    page.drawText(String(pageNo), { x: PAGE_W - MARGIN - 6, y: 40, size: 7.5, font: sans, color: FAINT });
  };

  const newPage = () => {
    footer();
    page = doc.addPage([PAGE_W, PAGE_H]);
    pageNo += 1;
    y = PAGE_H - MARGIN;
  };

  const need = (h) => { if (y - h < 76) newPage(); };

  const para = (text, { font = serif, size = 11, lead = 16.5, color = SOFT, gap = 10, width = WIDTH } = {}) => {
    const lines = wrap(font, size, text, width);
    need(lines.length * lead + gap);
    for (const line of lines) {
      page.drawText(line, { x: MARGIN, y, size, font, color });
      y -= lead;
    }
    y -= gap;
  };

  // ── masthead ──────────────────────────────────────────────────────────────
  page.drawRectangle({ x: 0, y: PAGE_H - 26, width: PAGE_W, height: 26, color: PAPER });
  page.drawText('ALLIANCE MUTUAL ESCROW', { x: MARGIN, y: PAGE_H - 18, size: 8, font: sansBold, color: INK });
  page.drawText('INDEPENDENT - DFPI LICENSED - CALIFORNIA', { x: PAGE_W - MARGIN - 170, y: PAGE_H - 18, size: 7, font: sans, color: FAINT });
  y = PAGE_H - 78;

  page.drawText(clean(guide.kicker).toUpperCase(), { x: MARGIN, y, size: 9, font: sansBold, color: AMBER });
  y -= 26;
  for (const line of wrap(serif, 27, guide.title, WIDTH)) {
    page.drawText(line, { x: MARGIN, y, size: 27, font: serif, color: INK });
    y -= 33;
  }
  y -= 2;
  page.drawRectangle({ x: MARGIN, y, width: 56, height: 2.4, color: AMBER });
  y -= 22;

  para(guide.lead, { font: serif, size: 12.5, lead: 19, color: INK, gap: 16 });

  // ── sections ──────────────────────────────────────────────────────────────
  for (const s of guide.sections) {
    need(46);
    y -= 6;
    page.drawText(clean(s.h), { x: MARGIN, y, size: 15.5, font: serif, color: INK });
    y -= 22;
    for (const p of s.ps) para(p);
  }

  // ── FAQ ───────────────────────────────────────────────────────────────────
  need(50);
  y -= 6;
  page.drawText('Frequently asked', { x: MARGIN, y, size: 15.5, font: serif, color: INK });
  y -= 22;
  for (const f of guide.faq) {
    const qLines = wrap(sansBold, 10.5, f.q, WIDTH);
    need(qLines.length * 15 + 8);
    for (const line of qLines) {
      page.drawText(line, { x: MARGIN, y, size: 10.5, font: sansBold, color: INK });
      y -= 15;
    }
    para(f.a, { size: 10.5, lead: 15, gap: 12 });
  }

  // ── closing note ──────────────────────────────────────────────────────────
  need(40);
  y -= 4;
  para('General information for California consumers, not legal or tax advice. Fees quoted are from the published Alliance Mutual Escrow schedule.', { size: 8.5, lead: 12, color: FAINT, gap: 0 });

  footer();
  return doc.save();
}

fs.mkdirSync(OUT_DIR, { recursive: true });
let count = 0;
for (const guide of guides) {
  const bytes = await renderGuide(guide);
  fs.writeFileSync(path.join(OUT_DIR, `${guide.slug}.pdf`), bytes);
  count += 1;
}
console.log(`[guide-pdfs] Wrote ${count} branded PDFs to public/pdfs/.`);
