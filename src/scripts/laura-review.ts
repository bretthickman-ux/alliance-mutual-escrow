/* Laura's compliance walkthrough.

   A deliberately simple review flow for the escrow manager: one card per
   page with three verdicts (Looks right / Omit / Needs change) and a notes
   box, a floating "Page note" on every other page, and one Send to Brett
   button that emails everything at once, with optional file attachments
   (rate sheets, marked-up PDFs).

   Activation: any page with ?laura=1 (persists via localStorage; ?laura=0
   exits). Fully inert for normal visitors. Separate from the owner tour. */

const KEY_STATE = 'ame_laura_r1';
const KEY_ACTIVE = 'ame_laura_tour';

interface ItemResult { v: 'ok' | 'change'; note?: string; label: string; }
interface PageResult { verdict?: 'keep' | 'omit' | 'change'; note?: string; items?: Record<string, ItemResult>; }

const qs = new URLSearchParams(location.search);
if (qs.get('laura') === '1') localStorage.setItem(KEY_ACTIVE, 'on');
if (qs.get('laura') === '0') localStorage.removeItem(KEY_ACTIVE);

if (localStorage.getItem(KEY_ACTIVE) === 'on') init();

function init() {
  /* The review circuit, in walking order. Everything Laura owns the facts
     on: fees, the calculator, and every guide. */
  const CIRCUIT: Array<{ path: string; label: string }> = [
    { path: '/calculator', label: 'Fees & calculator (rates, add-ons, the published schedule below)' },
    { path: '/guides', label: 'The guide library' },
    { path: '/guides/what-escrow-does', label: 'Guide: What escrow is, and what it does' },
    { path: '/guides/escrow-timeline', label: 'Guide: The 30 day escrow timeline' },
    { path: '/guides/wire-fraud-safety', label: 'Guide: Wire fraud safety' },
    { path: '/guides/buyer-guide', label: 'Guide: For buyers' },
    { path: '/guides/seller-guide', label: 'Guide: For sellers' },
    { path: '/guides/refinance-guide', label: 'Guide: For refinances' },
    { path: '/guides/1031-exchange', label: 'Guide: 1031 exchanges' },
    { path: '/guides/bulk-sale', label: 'Guide: Bulk sales' },
    { path: '/guides/probate', label: 'Guide: Probate sales' },
    { path: '/guides/mobile-home', label: 'Guide: Mobile & manufactured homes' },
    { path: '/guides/fsbo', label: 'Guide: For sale by owner' },
    { path: '/guides/holding-escrow', label: 'Guide: Holding escrows' },
  ];

  const here = location.pathname.replace(/\/$/, '') || '/';
  const idx = CIRCUIT.findIndex((p) => p.path === here);
  const onCircuit = idx !== -1;
  const state: Record<string, PageResult> = JSON.parse(localStorage.getItem(KEY_STATE) || '{}');
  const save = () => localStorage.setItem(KEY_STATE, JSON.stringify(state));
  const doneCount = () => CIRCUIT.filter((p) => state[p.path]?.verdict).length;

  const css = `
  .lr-card{position:fixed;right:18px;bottom:84px;z-index:9001;width:min(380px,calc(100vw - 24px));background:#fdfdfc;color:#0f1215;border:1px solid rgba(15,18,21,.12);border-radius:16px;box-shadow:0 30px 80px -20px rgba(0,0,0,.4);font-family:Inter,system-ui,sans-serif;overflow:hidden}
  .lr-hd{padding:13px 16px;border-bottom:1px solid rgba(15,18,21,.08)}
  .lr-hd .k{font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:.18em;text-transform:uppercase;color:#b97a3a}
  .lr-hd .t{font-weight:600;font-size:13.5px;margin-top:3px;line-height:1.35}
  .lr-bd{padding:13px 16px}
  .lr-verdicts{display:flex;gap:8px;flex-wrap:wrap}
  .lr-v{border:1px solid rgba(15,18,21,.15);background:none;border-radius:100px;padding:9px 15px;font-size:12.5px;font-weight:600;cursor:pointer;font-family:inherit}
  .lr-v.on-keep{background:#e8f0ec;border-color:#4a6e5e;color:#2e4a3e}
  .lr-v.on-omit{background:#f7e8e2;border-color:#b4552e;color:#8a3c1e}
  .lr-v.on-change{background:#fdf3dc;border-color:#b08d3f;color:#7a5f1f}
  .lr-note{width:100%;margin-top:11px;border:1px solid rgba(15,18,21,.15);border-radius:10px;padding:9px 12px;font-size:16px;font-family:inherit;min-height:56px;resize:vertical;background:#fff}
  .lr-note:focus{outline:2px solid #b97a3a}
  .lr-meta{font-size:11px;color:#9aa0a6;margin-top:9px}
  .lr-bar{position:fixed;left:50%;transform:translateX(-50%);bottom:14px;z-index:9000;display:flex;align-items:center;gap:9px;background:#0f1215;color:#fdfdfc;border-radius:100px;padding:9px 13px;box-shadow:0 18px 50px rgba(0,0,0,.35);font-family:Inter,system-ui,sans-serif;font-size:12.5px;max-width:calc(100vw - 20px)}
  .lr-bar b{font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:#d9a56f;white-space:nowrap}
  .lr-btn{background:none;border:1px solid rgba(253,253,252,.3);color:#fdfdfc;border-radius:100px;padding:8px 14px;font-size:12.5px;font-weight:600;cursor:pointer;font-family:inherit;white-space:nowrap}
  .lr-btn:hover{border-color:#d9a56f;color:#d9a56f}
  .lr-btn.solid{background:#fdfdfc;color:#0f1215;border-color:#fdfdfc}
  .lr-btn.solid:hover{background:#d9a56f;border-color:#d9a56f;color:#0f1215}
  .lr-overlay{position:fixed;inset:0;z-index:9002;background:rgba(15,18,21,.55);display:flex;align-items:center;justify-content:center;padding:16px}
  .lr-panel{background:#fdfdfc;border-radius:16px;max-width:460px;width:100%;padding:20px;font-family:Inter,system-ui,sans-serif;color:#0f1215}
  .lr-panel h3{font-size:16px;margin:0 0 8px}
  .lr-panel p{font-size:13px;color:#4a4f55;margin:0 0 12px;line-height:1.5}
  .lr-file{font-size:13px;margin-bottom:12px}
  .lr-flash{color:#d9a56f;font-size:11px}
  .lr-item{position:relative}
  .lr-item.lr-ok{box-shadow:inset 3px 0 0 #4a6e5e;background:rgba(74,110,94,.06)}
  .lr-item.lr-chg{box-shadow:inset 3px 0 0 #b08d3f;background:rgba(176,141,63,.08)}
  .lr-tag{display:inline-flex;gap:5px;margin-left:10px;vertical-align:middle}
  .lr-tag button{width:26px;height:26px;border-radius:50%;border:1px solid rgba(15,18,21,.2);background:#fdfdfc;color:#9aa0a6;font-size:13px;line-height:1;cursor:pointer;font-family:inherit;padding:0}
  .lr-tag button:hover{border-color:#b97a3a;color:#b97a3a}
  .lr-tag .on-ok{background:#e8f0ec;border-color:#4a6e5e;color:#2e4a3e}
  .lr-tag .on-chg{background:#fdf3dc;border-color:#b08d3f;color:#7a5f1f}
  .lr-ipop{position:absolute;z-index:9003;background:#fdfdfc;border:1px solid rgba(15,18,21,.15);border-radius:12px;box-shadow:0 20px 60px -18px rgba(0,0,0,.4);padding:12px;width:min(300px,80vw);font-family:Inter,system-ui,sans-serif}
  .lr-ipop textarea{width:100%;border:1px solid rgba(15,18,21,.15);border-radius:8px;padding:8px 10px;font-size:15px;min-height:56px;font-family:inherit}
  .lr-ipop .row{display:flex;gap:8px;justify-content:flex-end;margin-top:8px}
  @media (max-width:640px){
    .lr-card{left:10px;right:10px;width:auto;bottom:92px;max-height:46vh;overflow:auto}
    .lr-bar{flex-wrap:wrap;justify-content:center;row-gap:7px;border-radius:18px;width:calc(100vw - 20px);bottom:8px}
    .lr-bar b{width:100%;text-align:center}
  }`;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  /* ── item-level review: every fee row, tier, section, and FAQ gets its own
     pair of buttons (check = looks right, pencil = needs change + note). ─── */
  const ITEM_SELECTORS: Array<{ match: (p: string) => boolean; selector: string; labelFrom?: string }> = [
    { match: (p) => p === '/calculator', selector: '.sched .fr, .sched .cn' },
    { match: (p) => p === '/guides', selector: '.gcard', labelFrom: 'h3' },
    { match: (p) => p.startsWith('/guides/'), selector: '.g-sec, .faq .fq, .hero .sub, .g-glance', labelFrom: 'h2,h3' },
  ];

  const itemLabel = (el: Element, labelFrom?: string): string => {
    const src = labelFrom ? el.querySelector(labelFrom) || el : el;
    return (src.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 80);
  };

  function pageItems(): Record<string, ItemResult> {
    state[here] = state[here] || {};
    state[here].items = state[here].items || {};
    return state[here].items!;
  }

  function instrumentItems() {
    const rule = ITEM_SELECTORS.find((r) => r.match(here));
    if (!rule) return;
    document.querySelectorAll(rule.selector).forEach((el, i) => {
      if (el.querySelector(':scope > .lr-tag')) return;
      const label = itemLabel(el, rule.labelFrom);
      if (!label) return;
      const key = `${i}:${label.slice(0, 40)}`;
      el.classList.add('lr-item');
      const saved = pageItems()[key];
      if (saved) el.classList.add(saved.v === 'ok' ? 'lr-ok' : 'lr-chg');

      const tag = document.createElement('span');
      tag.className = 'lr-tag';
      const ok = document.createElement('button');
      ok.type = 'button';
      ok.textContent = '✓';
      ok.title = 'Looks right';
      ok.className = saved?.v === 'ok' ? 'on-ok' : '';
      const chg = document.createElement('button');
      chg.type = 'button';
      chg.textContent = '✎';
      chg.title = 'Needs change';
      chg.className = saved?.v === 'change' ? 'on-chg' : '';

      const setState = (v: 'ok' | 'change' | null, note?: string) => {
        const items = pageItems();
        if (v === null) delete items[key];
        else items[key] = { v, note: note ?? items[key]?.note, label };
        save();
        el.classList.toggle('lr-ok', v === 'ok');
        el.classList.toggle('lr-chg', v === 'change');
        ok.className = v === 'ok' ? 'on-ok' : '';
        chg.className = v === 'change' ? 'on-chg' : '';
      };

      ok.onclick = (e) => {
        e.preventDefault(); e.stopPropagation();
        setState(pageItems()[key]?.v === 'ok' ? null : 'ok');
      };
      chg.onclick = (e) => {
        e.preventDefault(); e.stopPropagation();
        openItemNote(el, label, pageItems()[key]?.note || '', (note, remove) => {
          if (remove) setState(null);
          else setState('change', note);
        });
      };
      tag.append(ok, chg);
      el.appendChild(tag);
    });
  }

  function openItemNote(anchor: Element, label: string, existing: string, done: (note: string, remove?: boolean) => void) {
    document.querySelectorAll('.lr-ipop').forEach((p) => p.remove());
    const pop = document.createElement('div');
    pop.className = 'lr-ipop';
    const h = document.createElement('div');
    h.style.cssText = 'font-size:12px;font-weight:600;margin-bottom:7px';
    h.textContent = `Needs change: ${label.slice(0, 48)}`;
    const ta = document.createElement('textarea');
    ta.placeholder = 'What should it say or be?';
    ta.value = existing;
    const row = document.createElement('div');
    row.className = 'row';
    const clear = document.createElement('button');
    clear.className = 'lr-v';
    clear.textContent = 'Clear';
    clear.onclick = () => { done('', true); pop.remove(); };
    const saveB = document.createElement('button');
    saveB.className = 'lr-v on-change';
    saveB.textContent = 'Save';
    saveB.onclick = () => { done(ta.value.trim()); pop.remove(); };
    row.append(clear, saveB);
    pop.append(h, ta, row);
    document.body.appendChild(pop);
    const r = anchor.getBoundingClientRect();
    pop.style.left = Math.min(Math.max(10, r.left + scrollX), innerWidth - pop.offsetWidth - 10) + 'px';
    pop.style.top = r.bottom + scrollY + 8 + 'px';
    pop.style.position = 'absolute';
    ta.focus();
  }

  /* ── the per-page card ─────────────────────────────────────────────────── */
  const card = document.createElement('div');
  card.className = 'lr-card';
  document.body.appendChild(card);

  function renderCard() {
    const label = onCircuit ? CIRCUIT[idx].label : 'This page';
    const r = state[here] || {};
    card.innerHTML = '';
    const hd = document.createElement('div');
    hd.className = 'lr-hd';
    hd.innerHTML = `<div class="k">${onCircuit ? `Stop ${idx + 1} of ${CIRCUIT.length}` : 'Page note'}</div><div class="t">${label}</div>`;
    card.appendChild(hd);

    const bd = document.createElement('div');
    bd.className = 'lr-bd';
    const verdicts = document.createElement('div');
    verdicts.className = 'lr-verdicts';
    ([['keep', 'Looks right'], ['omit', 'Omit'], ['change', 'Needs change']] as const).forEach(([v, txt]) => {
      const b = document.createElement('button');
      b.className = 'lr-v' + (r.verdict === v ? ` on-${v}` : '');
      b.textContent = txt;
      b.onclick = () => { state[here] = { ...state[here], verdict: v }; save(); renderCard(); renderBar(); };
      verdicts.appendChild(b);
    });
    bd.appendChild(verdicts);

    const note = document.createElement('textarea');
    note.className = 'lr-note';
    note.placeholder = 'Anything to add or fix on this page...';
    note.value = r.note || '';
    note.addEventListener('input', () => {
      state[here] = { ...state[here], note: note.value.trim() || undefined };
      save();
    });
    bd.appendChild(note);

    const meta = document.createElement('div');
    meta.className = 'lr-meta';
    meta.textContent = onCircuit
      ? 'Tip: every fee line and section has its own ✓ and ✎ buttons, right on the page. Saves as you go; Send to Brett when done.'
      : 'Saves as you go. Send to Brett below when you are done, from any page.';
    bd.appendChild(meta);
    card.appendChild(bd);
  }

  /* ── the bar ───────────────────────────────────────────────────────────── */
  const bar = document.createElement('div');
  bar.className = 'lr-bar';
  document.body.appendChild(bar);

  function renderBar() {
    bar.innerHTML = '';
    const label = document.createElement('b');
    label.textContent = `Laura's review · ${doneCount()}/${CIRCUIT.length}`;
    bar.appendChild(label);

    if (onCircuit && idx > 0) {
      const prev = document.createElement('button');
      prev.className = 'lr-btn';
      prev.textContent = 'Back';
      prev.onclick = () => { location.href = CIRCUIT[idx - 1].path + '?laura=1'; };
      bar.appendChild(prev);
    }
    const nextTarget = onCircuit
      ? CIRCUIT[idx + 1]
      : CIRCUIT.find((p) => !state[p.path]?.verdict) || CIRCUIT[0];
    if (nextTarget) {
      const next = document.createElement('button');
      next.className = 'lr-btn';
      next.textContent = onCircuit && idx < CIRCUIT.length - 1 ? 'Next' : 'Continue review';
      next.onclick = () => { location.href = nextTarget.path + '?laura=1'; };
      if (!(onCircuit && idx === CIRCUIT.length - 1)) bar.appendChild(next);
    }

    const send = document.createElement('button');
    send.className = 'lr-btn solid';
    send.textContent = 'Send to Brett';
    send.onclick = openSend;
    bar.appendChild(send);

    const exit = document.createElement('button');
    exit.className = 'lr-btn';
    exit.textContent = 'Exit';
    exit.onclick = () => { localStorage.removeItem(KEY_ACTIVE); location.href = location.pathname; };
    bar.appendChild(exit);

    const flash = document.createElement('span');
    flash.className = 'lr-flash';
    bar.appendChild(flash);
  }

  const flashBar = (msg: string) => {
    const el = bar.querySelector('.lr-flash') as HTMLElement | null;
    if (el) el.textContent = msg;
  };

  /* ── digest + send ─────────────────────────────────────────────────────── */
  function digest(): string {
    const lines: string[] = ["Laura's site review", ''];
    for (const p of CIRCUIT) {
      const r = state[p.path];
      const items = Object.values(r?.items || {});
      if (!r?.verdict && !r?.note && items.length === 0) continue;
      const v = r?.verdict === 'keep' ? 'LOOKS RIGHT' : r?.verdict === 'omit' ? 'OMIT' : r?.verdict === 'change' ? 'NEEDS CHANGE' : 'REVIEWED';
      let line = `[${v}] ${p.label} (${p.path})`;
      if (r?.note) line += `\n    note: "${r.note}"`;
      for (const it of items) {
        line += `\n    - ${it.v === 'ok' ? 'ok' : 'CHANGE'}: ${it.label}`;
        if (it.note) line += ` -> "${it.note}"`;
      }
      lines.push(line);
    }
    // Notes left on pages outside the circuit.
    for (const [path, r] of Object.entries(state)) {
      if (CIRCUIT.some((p) => p.path === path)) continue;
      if (!r?.note && !r?.verdict) continue;
      lines.push(`[PAGE NOTE] ${path}${r.note ? `\n    note: "${r.note}"` : ''}`);
    }
    if (lines.length === 2) lines.push('(nothing recorded yet)');
    lines.push('', `${doneCount()} of ${CIRCUIT.length} pages reviewed`);
    return lines.join('\n');
  }

  function openSend() {
    const overlay = document.createElement('div');
    overlay.className = 'lr-overlay';
    const panel = document.createElement('div');
    panel.className = 'lr-panel';
    panel.innerHTML = `<h3>Send your review to Brett</h3>
      <p>${doneCount()} of ${CIRCUIT.length} pages reviewed. You can attach files too, like a current rate sheet or a marked-up PDF.</p>`;
    const file = document.createElement('input');
    file.type = 'file';
    file.multiple = true;
    file.className = 'lr-file';
    panel.appendChild(file);
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:10px;justify-content:flex-end;margin-top:6px';
    const cancel = document.createElement('button');
    cancel.className = 'lr-v';
    cancel.textContent = 'Not yet';
    cancel.onclick = () => overlay.remove();
    const go = document.createElement('button');
    go.className = 'lr-v on-keep';
    go.textContent = 'Send it';
    go.onclick = async () => {
      go.textContent = 'Sending...';
      go.setAttribute('disabled', 'true');
      try {
        const attachments = await Promise.all(
          Array.from(file.files || []).slice(0, 6).map(
            (f) => new Promise<{ filename: string; content: string }>((resolve, reject) => {
              const fr = new FileReader();
              fr.onload = () => resolve({ filename: f.name, content: String(fr.result).split(',')[1] || '' });
              fr.onerror = reject;
              fr.readAsDataURL(f);
            }),
          ),
        );
        const res = await fetch('/api/review-digest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ digest: digest(), reviewer: 'laura', attachments }),
        });
        const body = await res.json().catch(() => ({}));
        if (res.ok && body.ok) {
          panel.innerHTML = '<h3>Sent.</h3><p>Brett has your full review' + (attachments.length ? ' and the attachments' : '') + '. Thank you!</p>';
          setTimeout(() => overlay.remove(), 2600);
        } else {
          go.textContent = 'Send it';
          go.removeAttribute('disabled');
          flashBar(body.error || 'Sending failed, try again.');
          overlay.remove();
        }
      } catch {
        go.textContent = 'Send it';
        go.removeAttribute('disabled');
        flashBar('Sending failed, try again.');
      }
    };
    row.append(cancel, go);
    panel.appendChild(row);
    overlay.appendChild(panel);
    document.body.appendChild(overlay);
  }

  renderCard();
  renderBar();
  instrumentItems();
  // Late-revealed content (scroll reveals) may add items after load.
  setTimeout(instrumentItems, 1200);
}

export {};
