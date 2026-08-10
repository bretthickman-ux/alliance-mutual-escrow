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

const KEY_STATE = 'ame_review_r3';
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
    { id: 'home-hero', page: '/', label: 'Hero headline', selector: '.hero-center h1',
      pills: ['Every promise, kept. (owner approved)', 'Independent, by design. (owner approved)'] },
    { id: 'home-hero-sub', page: '/', label: 'Hero subline', selector: '.hero-center .hsub',
      pills: ['Funds verified, instructions honored, one licensed officer from open to close.', 'One licensed officer holds your file from open to close. Every dollar verified.'] },
    { id: 'home-intro', page: '/', label: 'Intro statement', selector: '.intro h2' },
    { id: 'home-row1', page: '/', label: 'One officer story', selector: '.rows .rowx:first-child .body' },
    { id: 'home-fees', page: '/', label: 'Fees headline', selector: '.rowx.flip h3',
      pills: ['Our fees are on the table. Literally.', 'Published fees. No mystery line items.', 'The price is on the page, not on request.'] },
    { id: 'home-shape', page: '/', label: 'Animation heading', selector: '.ds-head h2' },
    { id: 'home-doors', page: '/', label: 'Audiences heading', selector: '.doors-wrap .center-head h2' },
    { id: 'home-statement', page: '/', label: 'Statement quote', selector: '.statement .serif',
      pills: [
        'Every escrow closes twice: once on paper, once in someone’s life. (owner approved)',
        'We close files. Families open doors.',
        'A home changes hands on paper. A life changes with it.',
        'Every file we close is the start of someone’s next chapter.',
        'Precision on paper. Care in everything else.',
      ] },
    { id: 'home-tracker', page: '/', label: 'File tracker heading', selector: '.steps-wrap h2' },
    { id: 'home-close', page: '/', label: 'Closing line', selector: '.close h2',
      pills: ['Independent, by design. (owner approved)'] },
    { id: 'buyers-h1', page: '/buyers-sellers', label: 'Buyers page headline', selector: '.hero h1',
      pills: ['The biggest purchase of your life, held steady.', 'Your money, held steady until everything is right.'] },
    { id: 'buyers-days', page: '/buyers-sellers', label: '30 day timeline', selector: '.miles' },
    { id: 'buyers-faq', page: '/buyers-sellers', label: 'Buyer FAQ', selector: '.faq' },
    { id: 'agents-h1', page: '/agents', label: 'Agents page headline', selector: '.hero h1',
      pills: ['Your client. Your relationship. Our guidance. (owner approved)', 'You keep the relationship. We keep the dates.'] },
    { id: 'agents-quiet', page: '/agents', label: 'The quiet work block', selector: '.quiet' },
    { id: 'lenders-h1', page: '/lenders', label: 'Lenders page headline', selector: '.hero h1',
      pills: ['Funding that hits the date.', 'Rate locks do not wait. Neither do we.'] },
    { id: 'investors-h1', page: '/investors', label: 'Investors page headline', selector: '.hero h1',
      pills: ['Bring the challenging ones. (owner approved)', 'Complex files, run as regular work.'] },
    { id: 'team-h1', page: '/team', label: 'Team page headline', selector: '.team-header h1',
      pills: ['You don’t hire an officer. You hire a team.', 'Named people. One standard.'] },
    { id: 'team-note', page: '/team', label: 'Team closing note', selector: '.team-note' },
    { id: 'calc-h1', page: '/calculator', label: 'Calculator headline', selector: '.calc-hero h1',
      pills: ['What will escrow actually cost?', 'See every fee before you commit.'] },
    { id: 'guides-h1', page: '/guides', label: 'Guides headline', selector: '.hero h1',
      pills: ['Escrow, explained in plain English.', 'Answers first. Jargon never.'] },
  ];

  const PAGE_ORDER = ['/', '/buyers-sellers', '/agents', '/lenders', '/investors', '/team', '/calculator', '/guides'];
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
  .rt-hl{position:relative;outline:2px solid #b97a3a;outline-offset:6px;border-radius:4px}
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
    const lines: string[] = ['AME site review, owner pass', ''];
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
    } catch {
      prompt('Copy your review results:', text);
    }
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

    const copy = document.createElement('button');
    copy.className = 'rt-btn solid';
    copy.textContent = 'Copy results';
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
