/* The real escrow fee calculator (Phase 2). Buyer, seller, and refinance modes
   computed from the published schedule in src/data/fees.ts: the same numbers we
   bill with, itemized, with plain-English validation messages. Anonymous by
   design; the optional email action posts to a Pages Function stub.

   Where a competitor's calculator computes one side and breaks on bad input,
   this one itemizes both sides plus refinance, and explains itself. */

import React from 'react';
import {
  fees,
  saleFee,
  sfrRefinanceFee,
  commercialRefinanceFee,
  usd,
} from '../../data/fees';

const PHONE_DISPLAY = '(714) 544-6525';
const PHONE_HREF = 'tel:7145446525';

const MIN_PRICE = 10_000;
const MAX_PRICE = 100_000_000;

function parseAmount(raw) {
  const digits = String(raw).replace(/[$,\s]/g, '');
  if (digits === '') return { value: null, error: null };
  if (!/^\d+$/.test(digits)) {
    return { value: null, error: 'Enter a dollar amount using numbers only, like 850,000.' };
  }
  return { value: parseInt(digits, 10), error: null };
}

function validatePrice(value, what) {
  if (value === null) return `Enter a ${what} to see your fees.`;
  if (value < MIN_PRICE) return `That looks too low for a ${what}. Enter the full amount, like 850,000.`;
  if (value > MAX_PRICE) return `That is above what we can estimate online. Call ${PHONE_DISPLAY} and an officer will quote it.`;
  return null;
}

function fmtInput(value) {
  return value === null ? '' : value.toLocaleString('en-US');
}

/* ── line builders: each returns { lines: [{l, r, amount}], total, quote } ── */

function buyerLines(price, withLoan, addons) {
  const lines = [
    { l: `Escrow fee: ${fees.sale.label}`, amount: saleFee(price) },
  ];
  if (withLoan) {
    lines.push({ l: 'Loan processing', amount: fees.sale.loanProcessing });
    lines.push({ l: 'Notary (with loan), estimate', amount: fees.estimates.notaryWithLoan });
  }
  if (addons.solar) lines.push({ l: 'Solar transfer, your side', amount: 100 });
  if (addons.x1031) lines.push({ l: '1031 exchange processing', amount: 250 });
  return { lines, total: lines.reduce((s, x) => s + x.amount, 0) };
}

function sellerLines(price, payoffs, docPrep, addons) {
  const lines = [
    { l: `Escrow fee: ${fees.sale.label}`, amount: saleFee(price) },
  ];
  if (payoffs > 0) lines.push({ l: `Demand processing, ${payoffs} payoff${payoffs > 1 ? 's' : ''} at $30`, amount: payoffs * 30 });
  if (docPrep > 0) lines.push({ l: `Document prep (grant deed${docPrep > 1 ? ' + more' : ''}), ${docPrep} at $50`, amount: docPrep * 50 });
  if (addons.solar) lines.push({ l: 'Solar transfer, your side', amount: 100 });
  if (addons.x1031) lines.push({ l: '1031 exchange processing', amount: 250 });
  return { lines, total: lines.reduce((s, x) => s + x.amount, 0) };
}

function refiLines(loan, kind, addons) {
  if (kind === 'commercial') {
    if (loan < fees.commercialRefinance.minLoan) {
      return { minError: `Multi-family and commercial refinance starts at a ${usd(fees.commercialRefinance.minLoan)} loan. For smaller loans, use the single family tiers or call ${PHONE_DISPLAY}.` };
    }
    const lines = [{ l: `Escrow fee: ${fees.commercialRefinance.label}`, amount: commercialRefinanceFee(loan) }];
    if (addons.subordination) lines.push({ l: 'Subordination agreement', amount: 50 });
    return { lines, total: lines.reduce((s, x) => s + x.amount, 0) };
  }
  const flat = sfrRefinanceFee(loan);
  if (flat === null) {
    return { quote: true };
  }
  const tier = fees.sfrRefinance.tiers.find((t) => t.flat === flat);
  const lines = [
    { l: `Escrow fee, flat tier (${tier.label.toLowerCase()})`, amount: flat },
    { l: 'Processing', amount: fees.sfrRefinance.processing },
  ];
  if (addons.subordination) lines.push({ l: 'Subordination agreement', amount: 50 });
  if (addons.heloc) lines.push({ l: 'Second or HELOC-only escrow', amount: 250 });
  return { lines, total: lines.reduce((s, x) => s + x.amount, 0) };
}

/* ── component ─────────────────────────────────────────────────────────────── */

export default function EscrowCalculator({ compact = false, initialMode = 'buyer' }) {
  const fromUrl = React.useMemo(() => {
    if (typeof window === 'undefined' || compact) return {};
    const p = new URLSearchParams(window.location.search);
    return {
      mode: ['buyer', 'seller', 'refinance'].includes(p.get('mode')) ? p.get('mode') : undefined,
      amount: /^\d+$/.test(p.get('amount') || '') ? parseInt(p.get('amount'), 10) : undefined,
    };
  }, [compact]);

  const [mode, setMode] = React.useState(fromUrl.mode || initialMode);
  const [priceRaw, setPriceRaw] = React.useState(fmtInput(fromUrl.amount ?? 1_000_000));
  const [loanRaw, setLoanRaw] = React.useState(fmtInput(fromUrl.amount ?? 750_000));
  const [withLoan, setWithLoan] = React.useState(true);
  const [payoffs, setPayoffs] = React.useState(1);
  const [docPrep, setDocPrep] = React.useState(1);
  const [refiKind, setRefiKind] = React.useState('sfr');
  const [addons, setAddons] = React.useState({ solar: false, x1031: false, subordination: false, heloc: false });
  const [status, setStatus] = React.useState(null);
  const [email, setEmail] = React.useState('');
  const [emailOpen, setEmailOpen] = React.useState(false);

  const isRefi = mode === 'refinance';
  const raw = isRefi ? loanRaw : priceRaw;
  const setRaw = isRefi ? setLoanRaw : setPriceRaw;
  const what = isRefi ? 'loan amount' : 'sale price';

  const parsed = parseAmount(raw);
  const inputError = parsed.error || validatePrice(parsed.value, what);
  const amount = inputError ? null : parsed.value;

  let result = null;
  if (amount !== null) {
    if (mode === 'buyer') result = buyerLines(amount, withLoan, addons);
    else if (mode === 'seller') result = sellerLines(amount, payoffs, docPrep, addons);
    else result = refiLines(amount, refiKind, addons);
  }

  const toggle = (k) => setAddons((a) => ({ ...a, [k]: !a[k] }));
  const sideLabel = mode === 'buyer' ? 'Escrow side, buyer' : mode === 'seller' ? 'Escrow side, seller' : 'Escrow side, refinance';

  function shareUrl() {
    const u = new URL('/calculator', window.location.origin);
    u.searchParams.set('mode', mode);
    if (amount !== null) u.searchParams.set('amount', String(amount));
    return u.toString();
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl());
      setStatus({ ok: true, msg: 'Link copied. Paste it anywhere.' });
    } catch {
      setStatus({ ok: false, msg: 'Could not copy automatically. The link is: ' + shareUrl() });
    }
  }

  async function sendEmail() {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus({ ok: false, msg: 'Enter an email like name@example.com and try again.' });
      return;
    }
    try {
      const res = await fetch('/api/email-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          mode,
          amount,
          lines: result?.lines?.map((x) => ({ label: x.l, amount: x.amount })),
          total: result?.total,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok && body.ok) {
        setStatus({ ok: true, msg: body.queued ? 'On its way. Check your inbox shortly.' : body.note || 'Received.' });
        setEmailOpen(false);
      } else {
        setStatus({ ok: false, msg: body.error || 'Something went wrong sending that. You can print this page instead.' });
      }
    } catch {
      setStatus({ ok: false, msg: 'Email is not connected yet on this preview. Use Print or save the link instead.' });
    }
  }

  return (
    <div className="ec" data-mode={mode}>
      <div className="ec-tabs" role="tablist" aria-label="Calculator mode">
        {['buyer', 'seller', 'refinance'].map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            className={'ec-tab' + (mode === m ? ' on' : '')}
            onClick={() => { setMode(m); setStatus(null); }}
          >
            {m === 'buyer' ? 'Buyer' : m === 'seller' ? 'Seller' : 'Refinance'}
          </button>
        ))}
      </div>

      <div className="ec-inputs">
        <div className="ec-field">
          <label htmlFor={`ec-amt-${compact ? 'c' : 'f'}`}>{isRefi ? 'Loan amount' : 'Purchase price'}</label>
          <div className="ec-in">
            <span className="cur" aria-hidden="true">$</span>
            <input
              id={`ec-amt-${compact ? 'c' : 'f'}`}
              inputMode="numeric"
              autoComplete="off"
              value={raw}
              aria-invalid={inputError && raw !== '' ? 'true' : undefined}
              onChange={(e) => { setRaw(e.target.value); setStatus(null); }}
              onBlur={() => { if (amount !== null) setRaw(fmtInput(amount)); }}
            />
          </div>
          {inputError && raw !== '' && <div className="ec-err" role="alert">{inputError}</div>}
          {raw === '' && <div className="ec-err">{`Enter a ${what} to see your fees.`}</div>}
        </div>

        {mode === 'buyer' && (
          <div className="ec-opts">
            <button type="button" className="ec-opt" aria-pressed={withLoan} onClick={() => setWithLoan(!withLoan)}>
              <span className="dot"></span> Financing with a loan
            </button>
            <button type="button" className="ec-opt" aria-pressed={addons.solar} onClick={() => toggle('solar')}>
              <span className="dot"></span> Solar transfer ($100)
            </button>
            <button type="button" className="ec-opt" aria-pressed={addons.x1031} onClick={() => toggle('x1031')}>
              <span className="dot"></span> 1031 exchange ($250)
            </button>
          </div>
        )}

        {mode === 'seller' && (
          <div className="ec-opts">
            <span className="ec-count" role="group" aria-label="Loan payoffs">
              <button type="button" aria-label="Fewer payoffs" onClick={() => setPayoffs(Math.max(0, payoffs - 1))}>&minus;</button>
              <span aria-live="polite">{payoffs}</span>
              <button type="button" aria-label="More payoffs" onClick={() => setPayoffs(Math.min(4, payoffs + 1))}>+</button>
              <span className="ec-count-label">loan payoffs</span>
            </span>
            <span className="ec-count" role="group" aria-label="Documents prepared">
              <button type="button" aria-label="Fewer documents" onClick={() => setDocPrep(Math.max(0, docPrep - 1))}>&minus;</button>
              <span aria-live="polite">{docPrep}</span>
              <button type="button" aria-label="More documents" onClick={() => setDocPrep(Math.min(4, docPrep + 1))}>+</button>
              <span className="ec-count-label">docs prepared</span>
            </span>
            <button type="button" className="ec-opt" aria-pressed={addons.solar} onClick={() => toggle('solar')}>
              <span className="dot"></span> Solar transfer ($100)
            </button>
          </div>
        )}

        {isRefi && (
          <div className="ec-opts">
            <button type="button" className="ec-opt" aria-pressed={refiKind === 'sfr'} onClick={() => setRefiKind('sfr')}>
              <span className="dot"></span> Single family home
            </button>
            <button type="button" className="ec-opt" aria-pressed={refiKind === 'commercial'} onClick={() => setRefiKind('commercial')}>
              <span className="dot"></span> Multi-family / commercial
            </button>
            <button type="button" className="ec-opt" aria-pressed={addons.subordination} onClick={() => toggle('subordination')}>
              <span className="dot"></span> Subordination ($50)
            </button>
            {refiKind === 'sfr' && (
              <button type="button" className="ec-opt" aria-pressed={addons.heloc} onClick={() => toggle('heloc')}>
                <span className="dot"></span> HELOC / second only ($250)
              </button>
            )}
          </div>
        )}
      </div>

      <div className="ec-rows" aria-live="polite">
        {result?.minError && <div className="ec-quote">{result.minError}</div>}
        {result?.quote && (
          <div className="ec-quote">
            Loans over $2,000,000 are quoted by an officer, not a formula.{' '}
            <a href={PHONE_HREF}>Call {PHONE_DISPLAY}</a> and we will price it the same day.
          </div>
        )}
        {result?.lines && (
          <>
            {result.lines.map((x, i) => (
              <div className="ec-row" key={i}>
                <span className="l">{x.l}</span>
                <span className="r">{usd(x.amount)}</span>
              </div>
            ))}
            <div className="ec-row total">
              <span className="l">{sideLabel}</span>
              <span className="r">{usd(result.total)}</span>
            </div>
          </>
        )}
      </div>

      {!compact && (
        <>
          <div className="ec-actions">
            <button type="button" className="ec-act primary" onClick={() => window.print()}>Print or save as PDF</button>
            <button type="button" className="ec-act" onClick={copyLink}>Copy a link to this estimate</button>
            <button type="button" className="ec-act" onClick={() => { setEmailOpen(!emailOpen); setStatus(null); }}>
              Email me this estimate
            </button>
          </div>
          {emailOpen && (
            <div className="ec-email">
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                aria-label="Your email address"
                onChange={(e) => setEmail(e.target.value)}
              />
              <button type="button" className="ec-act primary" onClick={sendEmail}>Send</button>
            </div>
          )}
          {status && <div className={'ec-status' + (status.ok ? ' ok' : '')} role="status">{status.msg}</div>}
        </>
      )}

      <div className="ec-note">
        {compact
          ? 'Real published rates. The full calculator itemizes both sides and refinance tiers.'
          : 'Computed from the published fee schedule, the same formulas we bill with. Third-party costs (title, recording, lender fees) are set by providers you choose and are not included. Estimates are marked.'}
      </div>
    </div>
  );
}
