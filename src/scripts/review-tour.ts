/* The Owner Review Tour.

   An interactive walkthrough for the owner: it steps through the site's key
   copy blocks, highlights each one, and asks for a verdict. Keep it, veto it,
   pick a suggested alternate (pills), or type new wording. Results persist in
   localStorage and "Copy results" produces a plain-text digest the owner can
   paste into a message. Nothing is sent anywhere by itself.

   Activation: open any page with ?review=1 (persists across pages via
   localStorage). ?review=0 turns it off. Inert for normal visitors: without the
   flag this module does nothing and injects nothing.

   Suggestion pills only offer wording that follows the house rules (plain
   English, neutrality, no em dashes). Owner-approved lines are marked. */

type Verdict = 'keep' | 'veto' | 'edit' | 'pill';
interface StopResult { verdict?: Verdict; note?: string; pill?: string; }
interface Stop {
  id: string;
  page: string;
  label: string;
  selector: string;
  pills?: string[];
}

const KEY_STATE = 'ame_review_r5';
const KEY_ACTIVE = 'ame_review_tour';

const qs = new URLSearchParams(location.search);
if (qs.get('review') === '1') localStorage.setItem(KEY_ACTIVE, 'on');
if (qs.get('review') === '0') localStorage.removeItem(KEY_ACTIVE);

if (localStorage.getItem(KEY_ACTIVE) === 'on') {
  initTour();
}

function initTour() {
  /* ── the stops, in reading order across the site ───────────────────────── */
  const STOPS: Stop[] = [
    /* ── home, top to bottom ─────────────────────────────────────────────── */
    { id: 'home-hero', page: '/', label: 'Hero headline', selector: '.hero-center h1',
      pills: ['Every promise, kept. (owner approved)', 'Independent, by design. (owner approved)'] },
    { id: 'home-hero-sub', page: '/', label: 'Hero subline', selector: '.hero-center .hsub',
      pills: ['Funds verified, instructions honored, one dedicated team from open to close. (owner approved)'] },
    { id: 'home-statline', page: '/', label: 'Stats bar', selector: '.statline',
      pills: ['Serving California since 2001 (owner approved)', 'A quarter century of escrow'] },
    { id: 'home-intro', page: '/', label: 'Intro statement (bigger gold kicker)', selector: '.intro h2' },
    { id: 'home-row1', page: '/', label: 'One officer story + family photo', selector: '.rows .rowx:first-child .body' },
    { id: 'home-fees', page: '/', label: 'Fees headline', selector: '.rowx.flip h3',
      pills: ['Published fees. No mystery line items. (owner approved)', 'The price is on the page, not on request.'] },
    { id: 'home-feetable', page: '/', label: 'Fee table (calculator moved to its own page per your pass)', selector: '#feetable',
      pills: ['Keep: published table here, calculator one click away', 'Also remove this table from the homepage'] },
    { id: 'home-shape', page: '/', label: 'Animation heading', selector: '.ds-head h2' },
    { id: 'home-anim', page: '/', label: 'The animation itself (watch it through)', selector: '.anim-frame',
      pills: ['Keep the new finale: the key fades and the words take the stage', 'Keep the key on screen at the end instead', 'Hold the final frame longer before it loops'] },
    { id: 'home-doors', page: '/', label: 'Audiences heading', selector: '.doors-wrap .center-head h2' },
    { id: 'home-door-cards', page: '/', label: 'The four door photos', selector: '.doors',
      pills: ['Keep all four photos', 'Swap one or more (say which in the note)'] },
    { id: 'home-statement', page: '/', label: 'Statement quote', selector: '.statement .serif',
      pills: [
        'A home changes hands on paper. A life changes with it. (owner approved)',
        'We close files. Families open doors.',
        'Every escrow closes twice: once on paper, once in someone’s life.',
        'Every file we close is the start of someone’s next chapter.',
        'Precision on paper. Care in everything else.',
      ] },
    { id: 'home-statement-video', page: '/', label: 'Statement background video (lake community)', selector: '.statement video',
      pills: ['Keep this footage', 'Swap it (three licensed aerials are queued as candidates)'] },
    { id: 'home-proofline', page: '/', label: 'Proof numbers under the quote', selector: '.proofline' },
    { id: 'home-tracker', page: '/', label: 'File tracker (title search now Day 1 per your pass)', selector: '.steps-wrap h2' },
    { id: 'home-reviews', page: '/', label: 'Reviews section (live Google reviews)', selector: '.gr-wrap' },
    { id: 'home-close', page: '/', label: 'Closing line', selector: '.close h2',
      pills: ['Independent, by design. (owner approved)'] },
    { id: 'home-footer', page: '/', label: 'Footer license line (shortened per your pass; confirming number with Laura)', selector: 'footer .df-bot',
      pills: ['Keep the short DFPI line (as applied)', 'Number is confirmed correct', 'Number is different (put it in the note)'] },

    /* ── services hub ────────────────────────────────────────────────────── */
    { id: 'services-hub', page: '/services', label: 'Services hub (new page behind nav "Services")', selector: '.glib',
      pills: ['Keep: Services in the nav opens this page', 'Prefer the old way: scroll to the four doors on home', 'Keep the page and change wording (note below)'] },

    /* ── buyers & sellers ────────────────────────────────────────────────── */
    { id: 'buyers-h1', page: '/buyers-sellers', label: 'Buyers page headline', selector: '.hero h1',
      pills: ['Your money, held steady until everything is right. (owner approved)', 'The biggest purchase of your life, held steady.'] },
    { id: 'buyers-band', page: '/buyers-sellers', label: 'Moving day photo band', selector: '.hband' },
    { id: 'buyers-days', page: '/buyers-sellers', label: '30 day timeline (title search now ordered Day 1)', selector: '.miles' },
    { id: 'buyers-faq', page: '/buyers-sellers', label: 'Buyer FAQ', selector: '.faq' },
    { id: 'buyers-cta', page: '/buyers-sellers', label: 'Call-to-action band', selector: '.cta' },

    /* ── agents ──────────────────────────────────────────────────────────── */
    { id: 'agents-h1', page: '/agents', label: 'Agents page headline', selector: '.hero h1',
      pills: ['Your client. Your relationship. Our guidance. (owner approved)', 'You keep the relationship. We keep the dates.'] },
    { id: 'agents-band', page: '/agents', label: 'Lake community photo band', selector: '.hband' },
    { id: 'agents-quiet', page: '/agents', label: 'The quiet work block', selector: '.quiet' },

    /* ── lenders ─────────────────────────────────────────────────────────── */
    { id: 'lenders-h1', page: '/lenders', label: 'Lenders page headline', selector: '.hero h1',
      pills: ['Funding that hits the date.', 'Rate locks do not wait. Neither do we.'] },
    { id: 'lenders-flow', page: '/lenders', label: 'Funding flow strip', selector: '.flow' },
    { id: 'lenders-band', page: '/lenders', label: 'Dusk photo band', selector: '.hband' },

    /* ── investors ───────────────────────────────────────────────────────── */
    { id: 'investors-h1', page: '/investors', label: 'Investors page headline', selector: '.hero h1',
      pills: ['Bring the challenging ones. (owner approved)', 'Complex files, run as regular work.'] },
    { id: 'investors-nums', page: '/investors', label: '45 / 180 day numerals', selector: '.nums' },

    /* ── team ────────────────────────────────────────────────────────────── */
    { id: 'team-h1', page: '/team', label: 'Team page headline', selector: '.team-header h1',
      pills: ['You don’t hire an escrow officer. You hire a team.', 'Named people. One standard.'] },
    { id: 'team-grid', page: '/team', label: 'The roster (Sue Knox and Wendy Roman removed per your pass)', selector: '.grid' },
    { id: 'team-note', page: '/team', label: 'Team closing note', selector: '.team-note' },

    /* ── calculator ──────────────────────────────────────────────────────── */
    { id: 'calc-h1', page: '/calculator', label: 'Calculator headline', selector: '.calc-hero h1',
      pills: ['What will escrow actually cost?', 'See every fee before you commit.'] },
    { id: 'calc-schedule', page: '/calculator', label: 'Published schedule (example follows the slider; your side\u2019s card lights up)', selector: '.sched',
      pills: ['Keep: schedule stays put, example row tracks the price', 'Make the schedule fully static again', 'Something else (say what in the note)'] },
    { id: 'calc-tool', page: '/calculator', label: 'The calculator (try buyer, seller, refi)', selector: '.ec',
      pills: ['Confirmed: past $2,000,000 the rate drops to $1.75 per thousand (it always computed this; now it says so under the total)', 'Numbers and add-ons match the fee sheet, confirmed', 'Something is still off (say what in the note)'] },

    /* ── open an escrow ──────────────────────────────────────────────────── */
    { id: 'inquiry-flow', page: '/open-an-escrow', label: 'Open an Escrow card flow (click through it)', selector: '.oe',
      pills: ['A few questions. Then a person. (page headline)', 'Keep it: phone stays the fast lane, this catches the rest.'] },

    /* ── guides ──────────────────────────────────────────────────────────── */
    { id: 'guides-h1', page: '/guides', label: 'Guides headline', selector: '.hero h1',
      pills: ['Escrow, explained in plain English.', 'Answers first. Jargon never.'] },
    { id: 'guides-library', page: '/guides', label: 'The library: photo cards in three groups', selector: '.glib',
      pills: ['Keep the card library with photos and read times', 'Prefer a simpler text list', 'Group them differently (say how in the note)'] },
    { id: 'guide-glance', page: '/guides/what-escrow-does', label: 'Guide layout: "In this guide" card', selector: '.g-glance' },
    { id: 'guide-break', page: '/guides/what-escrow-does', label: 'Guide layout: photo break + numbered sections', selector: '.g-break' },
    { id: 'guide-pdf', page: '/guides/what-escrow-does', label: 'Download as PDF button', selector: '.pdfbtn' },
  ];

  const PAGE_ORDER = ['/', '/services', '/buyers-sellers', '/agents', '/lenders', '/investors', '/team', '/calculator', '/open-an-escrow', '/guides', '/guides/what-escrow-does'];
  const here = location.pathname.replace(/\/$/, '') || '/';
  const pageStops = STOPS.filter((s) => s.page === here && document.querySelector(s.selector));
  const state: Record<string, StopResult> = JSON.parse(localStorage.getItem(KEY_STATE) || '{}');
  const save = () => localStorage.setItem(KEY_STATE, JSON.stringify(state));

  /* ── styles ────────────────────────────────────────────────────────────── */
  const css = `
  .rt-bar{position:fixed;left:50%;transform:translateX(-50%);bottom:18px;z-index:9000;display:flex;align-items:center;gap:10px;background:#0f1215;color:#fdfdfc;border-radius:100px;padding:10px 14px;box-shadow:0 18px 50px rgba(0,0,0,.35);font-family:'Inter',system-ui,sans-serif;font-size:12.5px;max-width:calc(100vw - 24px)}
  .rt-bar b{font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:#d9a56f;white-space:nowrap}
  .rt-btn{background:none;border:1px solid rgba(253,253,252,.3);color:#fdfdfc;border-radius:100px;padding:7px 13px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;white-space:nowrap}
  .rt-btn:hover{border-color:#d9a56f;color:#d9a56f}
  .rt-btn.solid{background:#fdfdfc;color:#0f1215;border-color:#fdfdfc}
  .rt-btn.solid:hover{background:#d9a56f;border-color:#d9a56f;color:#0f1215}
  .rt-hl{position:relative;outline:2px solid #b97a3a;outline-offset:6px;border-radius:4px;scroll-margin-top:120px;scroll-margin-bottom:130px}
  .rt-card{position:fixed;z-index:9001;width:min(400px,calc(100vw - 24px));background:#fdfdfc;color:#0f1215;border:1px solid rgba(15,18,21,.12);border-radius:16px;box-shadow:0 30px 80px -20px rgba(0,0,0,.4);font-family:'Inter',system-ui,sans-serif;overflow:hidden}
  .rt-card .hd{padding:12px 16px;border-bottom:1px solid rgba(15,18,21,.08);display:flex;align-items:center;gap:8px}
  .rt-card .hd .k{font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:.18em;text-transform:uppercase;color:#b97a3a}
  .rt-card .hd .t{font-weight:600;font-size:13px}
  .rt-card .bd{padding:12px 16px;max-height:46vh;overflow:auto}
  .rt-verdicts{display:flex;gap:8px;flex-wrap:wrap}
  .rt-v{border:1px solid rgba(15,18,21,.15);background:none;border-radius:100px;padding:8px 14px;font-size:12.5px;font-weight:600;cursor:pointer;font-family:inherit}
  .rt-v.on-keep{background:#e8f0ec;border-color:#4a6e5e;color:#2e4a3e}
  .rt-v.on-veto{background:#f7e8e2;border-color:#b4552e;color:#8a3c1e}
  .rt-pills{display:flex;flex-direction:column;gap:6px;margin-top:12px}
  .rt-pill{text-align:left;border:1px solid rgba(15,18,21,.12);background:#f6f5f2;border-radius:12px;padding:9px 13px;font-size:12.5px;line-height:1.45;cursor:pointer;font-family:inherit}
  .rt-pill.on{border-color:#b97a3a;background:rgba(185,122,58,.12)}
  .rt-pill .tag{display:block;font-family:'IBM Plex Mono',monospace;font-size:8.5px;letter-spacing:.14em;text-transform:uppercase;color:#b97a3a;margin-bottom:3px}
  .rt-note{width:100%;margin-top:12px;border:1px solid rgba(15,18,21,.15);border-radius:10px;padding:9px 12px;font-size:12.5px;font-family:inherit;min-height:64px;resize:vertical;background:#fff}
  .rt-note:focus{outline:2px solid #b97a3a}
  .rt-meta{font-size:11px;color:#9aa0a6;margin-top:10px}
  .rt-done{font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:.1em;color:#4a6e5e;text-transform:uppercase}
  @media (max-width:640px){
    .rt-bar{flex-wrap:wrap;justify-content:center;row-gap:8px;border-radius:18px;padding:10px 12px;bottom:10px;width:calc(100vw - 20px);max-width:none}
    .rt-bar b{width:100%;text-align:center}
    .rt-btn{padding:9px 14px;font-size:13px}
    .rt-card{position:fixed;left:10px!important;right:10px;width:auto;top:auto!important;bottom:98px;max-height:50vh;display:flex;flex-direction:column}
    .rt-card .bd{max-height:none;overflow:auto}
    .rt-note{min-height:52px;font-size:16px}
    .rt-pill{padding:11px 14px}
    .rt-v{padding:10px 16px}
  }
  `;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  /* ── bar ───────────────────────────────────────────────────────────────── */
  const bar = document.createElement('div');
  bar.className = 'rt-bar';
  document.body.appendChild(bar);

  let idx = 0;
  let card: HTMLElement | null = null;
  let hlEl: Element | null = null;

  const totalDone = () => STOPS.filter((s) => state[s.id]?.verdict).length;

  function digest(): string {
    const lines: string[] = ['AME site review, owner pass 5', ''];
    for (const s of STOPS) {
      const r = state[s.id];
      if (!r?.verdict) continue;
      const v = r.verdict === 'keep' ? 'KEEP' : r.verdict === 'veto' ? 'VETO' : r.verdict === 'pill' ? 'USE SUGGESTION' : 'REWRITE';
      let line = `[${v}] ${s.page} - ${s.label}`;
      if (r.pill) line += `\n    use: "${r.pill}"`;
      if (r.note) line += `\n    note: "${r.note}"`;
      lines.push(line);
    }
    if (lines.length === 2) lines.push('(no verdicts recorded yet)');
    lines.push('', `${totalDone()} of ${STOPS.length} items reviewed`);
    return lines.join('\n');
  }

  async function sendResults() {
    const text = digest();
    if (totalDone() === 0) {
      flashBar('Nothing to send yet. Review a stop first.');
      return;
    }
    flashBar('Sending...');
    try {
      const res = await fetch('/api/review-digest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ digest: text }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok && body.ok) flashBar('Sent. Brett has it.');
      else flashBar(body.error || 'Sending failed. Try Copy instead.');
    } catch {
      flashBar('Sending failed. Try Copy instead.');
    }
  }

  async function copyResults() {
    const text = digest();
    try {
      if (navigator.share) {
        await navigator.share({ title: 'AME site review', text });
        return;
      }
    } catch { /* fall through to clipboard */ }
    try {
      await navigator.clipboard.writeText(text);
      flashBar('Copied. Paste it to Brett.');
      return;
    } catch { /* fall through to the manual panel */ }
    // Last resort (older browsers, blocked clipboard): a selectable panel.
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9002;background:rgba(15,18,21,.55);display:flex;align-items:center;justify-content:center;padding:16px';
    const panel = document.createElement('div');
    panel.style.cssText = 'background:#fdfdfc;border-radius:16px;max-width:520px;width:100%;padding:18px;font-family:Inter,system-ui,sans-serif';
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.readOnly = true;
    ta.style.cssText = 'width:100%;height:40vh;font-size:12px;border:1px solid rgba(15,18,21,.15);border-radius:10px;padding:10px';
    const hint = document.createElement('div');
    hint.textContent = 'Press and hold (or Ctrl+C) to copy, then close.';
    hint.style.cssText = 'font-size:12px;color:#666;margin:10px 0';
    const close = document.createElement('button');
    close.textContent = 'Close';
    close.className = 'rt-btn';
    close.style.cssText = 'border:1px solid rgba(15,18,21,.25);color:#0f1215;border-radius:100px;padding:8px 16px;background:none;cursor:pointer';
    close.onclick = () => overlay.remove();
    panel.append(ta, hint, close);
    overlay.appendChild(panel);
    document.body.appendChild(overlay);
    ta.focus();
    ta.select();
  }

  let flashTimer: ReturnType<typeof setTimeout> | undefined;
  function flashBar(msg: string) {
    const el = bar.querySelector('.rt-flash') as HTMLElement | null;
    if (el) {
      el.textContent = msg;
      clearTimeout(flashTimer);
      flashTimer = setTimeout(() => { el.textContent = ''; }, 2600);
    }
  }

  function renderBar() {
    const donePage = pageStops.filter((s) => state[s.id]?.verdict).length;
    const pi = PAGE_ORDER.indexOf(here);
    const nextPage = pi >= 0 && pi < PAGE_ORDER.length - 1 ? PAGE_ORDER[pi + 1] : null;
    bar.innerHTML = '';
    const label = document.createElement('b');
    label.textContent = pageStops.length
      ? `Review · ${Math.min(idx + 1, pageStops.length)}/${pageStops.length} here · ${totalDone()}/${STOPS.length} total`
      : `Review · ${totalDone()}/${STOPS.length} total`;
    bar.appendChild(label);

    if (pageStops.length > 0) {
      const prev = document.createElement('button');
      prev.className = 'rt-btn';
      prev.textContent = 'Prev';
      prev.onclick = () => go(idx - 1);
      const next = document.createElement('button');
      next.className = 'rt-btn';
      next.textContent = donePage === pageStops.length && nextPage ? 'Next page' : 'Next';
      next.onclick = () => {
        if (idx >= pageStops.length - 1 && nextPage) location.href = nextPage + '?review=1';
        else go(idx + 1);
      };
      bar.append(prev, next);
    } else if (nextPage) {
      const next = document.createElement('button');
      next.className = 'rt-btn';
      next.textContent = 'Next page';
      next.onclick = () => { location.href = nextPage + '?review=1'; };
      bar.appendChild(next);
    }

    const send = document.createElement('button');
    send.className = 'rt-btn solid';
    send.textContent = 'Send results';
    send.onclick = sendResults;
    bar.appendChild(send);

    const copy = document.createElement('button');
    copy.className = 'rt-btn';
    copy.textContent = 'Copy';
    copy.onclick = copyResults;
    bar.appendChild(copy);

    const exit = document.createElement('button');
    exit.className = 'rt-btn';
    exit.textContent = 'Exit';
    exit.onclick = () => {
      localStorage.removeItem(KEY_ACTIVE);
      location.href = location.pathname;
    };
    bar.appendChild(exit);

    const flash = document.createElement('span');
    flash.className = 'rt-flash';
    flash.style.cssText = 'color:#d9a56f;font-size:11px';
    bar.appendChild(flash);
  }

  function clearCard() {
    card?.remove();
    card = null;
    hlEl?.classList.remove('rt-hl');
    hlEl = null;
  }

  function go(n: number) {
    if (pageStops.length === 0) return;
    idx = Math.max(0, Math.min(pageStops.length - 1, n));
    showStop(pageStops[idx]);
    renderBar();
  }

  function showStop(stop: Stop) {
    clearCard();
    const target = document.querySelector(stop.selector);
    if (!target) return;
    hlEl = target;
    target.classList.add('rt-hl');
    target.scrollIntoView({ block: 'center', behavior: 'smooth' });
    // Never let a stop settle under the fixed nav (or the tour bar below).
    setTimeout(() => {
      const rt = target.getBoundingClientRect();
      if (rt.top < 110) scrollBy({ top: rt.top - 120, behavior: 'smooth' });
      else if (rt.bottom > innerHeight - 90 && rt.height < innerHeight - 220) {
        scrollBy({ top: rt.bottom - (innerHeight - 100), behavior: 'smooth' });
      }
    }, 650);

    const r = state[stop.id] || {};
    card = document.createElement('div');
    card.className = 'rt-card';

    const hd = document.createElement('div');
    hd.className = 'hd';
    hd.innerHTML = `<span class="k">Stop ${idx + 1}</span><span class="t">${stop.label}</span>` +
      (r.verdict ? '<span class="rt-done" style="margin-left:auto">saved</span>' : '');
    card.appendChild(hd);

    const bd = document.createElement('div');
    bd.className = 'bd';

    const verdicts = document.createElement('div');
    verdicts.className = 'rt-verdicts';
    const keep = document.createElement('button');
    keep.className = 'rt-v' + (r.verdict === 'keep' ? ' on-keep' : '');
    keep.textContent = 'Keep it';
    const veto = document.createElement('button');
    veto.className = 'rt-v' + (r.verdict === 'veto' ? ' on-veto' : '');
    veto.textContent = 'Veto';
    keep.onclick = () => { state[stop.id] = { verdict: 'keep' }; save(); showStop(stop); renderBar(); };
    veto.onclick = () => { state[stop.id] = { ...state[stop.id], verdict: 'veto' }; save(); showStop(stop); renderBar(); };
    verdicts.append(keep, veto);
    bd.appendChild(verdicts);

    if (stop.pills?.length) {
      const pills = document.createElement('div');
      pills.className = 'rt-pills';
      for (const p of stop.pills) {
        const isApproved = p.includes('(owner approved)');
        const textOnly = p.replace(' (owner approved)', '');
        const b = document.createElement('button');
        b.className = 'rt-pill' + (r.verdict === 'pill' && r.pill === textOnly ? ' on' : '');
        b.innerHTML = (isApproved ? '<span class="tag">Owner approved</span>' : '<span class="tag">Suggestion</span>') + textOnly;
        b.onclick = () => { state[stop.id] = { verdict: 'pill', pill: textOnly }; save(); showStop(stop); renderBar(); };
        pills.appendChild(b);
      }
      bd.appendChild(pills);
    }

    const note = document.createElement('textarea');
    note.className = 'rt-note';
    note.placeholder = 'Or write it the way you would say it...';
    note.value = r.note || '';
    note.addEventListener('input', () => {
      state[stop.id] = { ...state[stop.id], verdict: note.value.trim() ? 'edit' : state[stop.id]?.verdict, note: note.value.trim() || undefined };
      save();
      renderBar();
    });
    bd.appendChild(note);

    const meta = document.createElement('div');
    meta.className = 'rt-meta';
    meta.textContent = 'Your choices save on this device. "Copy results" builds a message you can paste.';
    bd.appendChild(meta);

    card.appendChild(bd);
    document.body.appendChild(card);
    positionCard(target);
  }

  function positionCard(target: Element) {
    if (!card) return;
    if (innerWidth <= 640) return; // CSS pins the card as a bottom sheet
    const r = target.getBoundingClientRect();
    const cw = card.offsetWidth, ch = card.offsetHeight;
    let top = r.bottom + 14;
    if (top + ch > innerHeight - 90) top = Math.max(12, r.top - ch - 14);
    if (top + ch > innerHeight - 90) top = Math.max(12, innerHeight - ch - 96);
    let left = Math.min(Math.max(12, r.left), innerWidth - cw - 12);
    card.style.top = top + 'px';
    card.style.left = left + 'px';
  }

  addEventListener('resize', () => { if (hlEl) positionCard(hlEl); }, { passive: true });
  addEventListener('scroll', () => { if (hlEl) positionCard(hlEl); }, { passive: true });

  renderBar();
  if (pageStops.length > 0) {
    // Give reveals a beat to settle, then open the first unreviewed stop.
    const firstOpen = pageStops.findIndex((s) => !state[s.id]?.verdict);
    idx = firstOpen === -1 ? 0 : firstOpen;
    setTimeout(() => go(idx), 900);
  }
}

export {};
