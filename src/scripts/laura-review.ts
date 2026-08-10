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

interface PageResult { verdict?: 'keep' | 'omit' | 'change'; note?: string; }

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
  @media (max-width:640px){
    .lr-card{left:10px;right:10px;width:auto;bottom:92px;max-height:46vh;overflow:auto}
    .lr-bar{flex-wrap:wrap;justify-content:center;row-gap:7px;border-radius:18px;width:calc(100vw - 20px);bottom:8px}
    .lr-bar b{width:100%;text-align:center}
  }`;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

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
    meta.textContent = 'Saves as you go. Send to Brett below when you are done, from any page.';
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
      if (!r?.verdict && !r?.note) continue;
      const v = r.verdict === 'keep' ? 'LOOKS RIGHT' : r.verdict === 'omit' ? 'OMIT' : r.verdict === 'change' ? 'NEEDS CHANGE' : 'NOTE';
      let line = `[${v}] ${p.label} (${p.path})`;
      if (r.note) line += `\n    note: "${r.note}"`;
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
}

export {};
