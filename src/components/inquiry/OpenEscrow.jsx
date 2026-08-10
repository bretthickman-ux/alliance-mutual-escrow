/* Open an Escrow: a conversational card flow. One question per card, pill
   answers, typing only when we ask how to reach you. Posts to /api/inquiry
   (Resend to the team); nothing is stored anywhere else. Honeypot for bots. */

import React from 'react';

const PHONE_DISPLAY = '(714) 544-6525';
const PHONE_HREF = 'tel:7145446525';

const ROLES = [
  { key: 'buying', label: 'I am buying a home' },
  { key: 'selling', label: 'I am selling a home' },
  { key: 'agent', label: 'I am the agent', sub: 'Opening escrow for a client' },
  { key: 'lender', label: 'I am the lender', sub: 'Refinance or purchase funding' },
  { key: 'refi', label: 'Refinancing my home' },
  { key: 'specialty', label: 'Something specialty', sub: '1031, bulk sale, probate, commercial' },
];

const TIMINGS = [
  { key: 'now', label: 'Under contract now' },
  { key: '30', label: 'Within 30 days' },
  { key: '90', label: 'One to three months out' },
  { key: 'planning', label: 'Just planning ahead' },
];

const STEPS = ['role', 'where', 'when', 'contact', 'done'];

/* variant="hero": hidden until the hero CTA dispatches `ame:open-escrow`
   (a pre-hydration click is buffered on window.__oeWanted). The flow fades
   in over the hero video while the hero copy fades back; Close restores it.
   variant="page" (default): always visible, as on /open-an-escrow. */
export default function OpenEscrow({ variant = 'page' }) {
  const inHero = variant === 'hero';
  const [open, setOpen] = React.useState(!inHero);

  React.useEffect(() => {
    if (!inHero) return;
    const show = () => setOpen(true);
    if (window.__oeWanted) { window.__oeWanted = false; show(); }
    window.addEventListener('ame:open-escrow', show);
    return () => window.removeEventListener('ame:open-escrow', show);
  }, [inHero]);

  React.useEffect(() => {
    if (!inHero) return;
    document.querySelector('.hero')?.classList.toggle('oe-open', open);
  }, [inHero, open]);

  const [step, setStep] = React.useState(0);
  const [role, setRole] = React.useState(null);
  const [city, setCity] = React.useState('');
  const [timing, setTiming] = React.useState(null);
  const [name, setName] = React.useState('');
  const [contact, setContact] = React.useState('');
  const [company, setCompany] = React.useState(''); // honeypot: humans never see it
  const [error, setError] = React.useState(null);
  const [sending, setSending] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  const cardRef = React.useRef(null);

  const go = (n) => {
    setError(null);
    setStep(Math.max(0, Math.min(STEPS.length - 1, n)));
    // Re-trigger the enter animation and move focus for keyboard users.
    requestAnimationFrame(() => {
      if (cardRef.current) {
        cardRef.current.classList.remove('oe-enter');
        void cardRef.current.offsetWidth;
        cardRef.current.classList.add('oe-enter');
        const h = cardRef.current.querySelector('.oe-q');
        if (h) h.setAttribute('tabindex', '-1'), h.focus({ preventScroll: true });
      }
    });
  };

  const pick = (setter, value, nextStep) => {
    setter(value);
    go(nextStep);
  };

  async function send() {
    const hasName = name.trim().length >= 2;
    const c = contact.trim();
    const looksEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c);
    const looksPhone = c.replace(/\D/g, '').length >= 10;
    if (!hasName) { setError('Add your name so your escrow officer knows who to ask for.'); return; }
    if (!looksEmail && !looksPhone) { setError('Add a phone number or an email so we can reach you.'); return; }

    setSending(true);
    setError(null);
    try {
      const res = await fetch('/api/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: ROLES.find((r) => r.key === role)?.label || role,
          city: city.trim() || 'Not given',
          timing: TIMINGS.find((t) => t.key === timing)?.label || 'Not given',
          name: name.trim(),
          contact: c,
          company, // honeypot
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok && body.ok) {
        setSent(true);
        go(4);
      } else {
        setError(body.error || `Something went wrong sending that. Call us instead: ${PHONE_DISPLAY}.`);
      }
    } catch {
      setError(`Sending is not connected on this preview. Call ${PHONE_DISPLAY} and we will take it from there.`);
    } finally {
      setSending(false);
    }
  }

  const pct = sent ? 100 : (step / (STEPS.length - 1)) * 100;
  const stepLabel = `0${Math.min(step + 1, 4)} · 04`;

  if (inHero && !open) return null;

  return (
    <div className={'oe' + (inHero ? ' oe-in-hero' : '')}>
      {inHero && (
        <button type="button" className="oe-close" aria-label="Close and return to the page" onClick={() => setOpen(false)}>
          &times;
        </button>
      )}
      <div className="oe-progress"><i style={{ width: pct + '%' }} /></div>
      <div className="oe-card oe-enter" ref={cardRef}>
        {step === 0 && (
          <>
            <div className="oe-step">{stepLabel}</div>
            <h2 className="oe-q">What brings you <i>to escrow?</i></h2>
            <div className="oe-pills">
              {ROLES.map((r) => (
                <button key={r.key} type="button" className={'oe-pill' + (role === r.key ? ' on' : '')} onClick={() => pick(setRole, r.key, 1)}>
                  <span>{r.label}{r.sub && <span className="sub">{r.sub}</span>}</span>
                  <span className="arr" aria-hidden="true">&rarr;</span>
                </button>
              ))}
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <div className="oe-step">{stepLabel}</div>
            <h2 className="oe-q">Where is <i>the property?</i></h2>
            <div className="oe-input">
              <label htmlFor="oe-city">City (anywhere in California)</label>
              <input
                id="oe-city"
                value={city}
                autoComplete="off"
                placeholder="Tustin, Pasadena, Anaheim..."
                onChange={(e) => setCity(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') go(2); }}
              />
            </div>
            <div className="oe-nav">
              <button type="button" className="oe-back" onClick={() => go(0)}>&larr; Back</button>
              <button type="button" className="oe-next" onClick={() => go(2)}>Continue</button>
              <button type="button" className="oe-skip" onClick={() => { setCity(''); go(2); }}>Not sure yet</button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="oe-step">{stepLabel}</div>
            <h2 className="oe-q">When do you hope <i>to close?</i></h2>
            <div className="oe-pills">
              {TIMINGS.map((t) => (
                <button key={t.key} type="button" className={'oe-pill' + (timing === t.key ? ' on' : '')} onClick={() => pick(setTiming, t.key, 3)}>
                  <span>{t.label}</span>
                  <span className="arr" aria-hidden="true">&rarr;</span>
                </button>
              ))}
            </div>
            <div className="oe-nav">
              <button type="button" className="oe-back" onClick={() => go(1)}>&larr; Back</button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div className="oe-step">{stepLabel}</div>
            <h2 className="oe-q">Where should your escrow officer <i>reach you?</i></h2>
            <div className="oe-input">
              <label htmlFor="oe-name">Your name</label>
              <input id="oe-name" value={name} autoComplete="name" onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="oe-input">
              <label htmlFor="oe-contact">Phone or email</label>
              <input
                id="oe-contact"
                value={contact}
                autoComplete="tel email"
                inputMode="text"
                placeholder="(714) 555-0100 or name@example.com"
                onChange={(e) => setContact(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
              />
            </div>
            {/* honeypot: hidden from people, tempting to bots */}
            <div style={{ position: 'absolute', left: '-9999px' }} aria-hidden="true">
              <label htmlFor="oe-company">Company</label>
              <input id="oe-company" tabIndex={-1} autoComplete="off" value={company} onChange={(e) => setCompany(e.target.value)} />
            </div>
            {error && <div className="oe-err" role="alert">{error}</div>}
            <div className="oe-review" aria-label="Your answers">
              <div className="oe-rrow"><span className="k">You are</span><span className="v">{ROLES.find((r) => r.key === role)?.label || '...'}</span></div>
              <div className="oe-rrow"><span className="k">Property</span><span className="v">{city.trim() || 'Not sure yet'}</span></div>
              <div className="oe-rrow"><span className="k">Timeline</span><span className="v">{TIMINGS.find((t) => t.key === timing)?.label || '...'}</span></div>
            </div>
            <div className="oe-nav">
              <button type="button" className="oe-back" onClick={() => go(2)}>&larr; Back</button>
              <button type="button" className="oe-next" onClick={send} disabled={sending}>
                {sending ? 'Sending...' : 'Send to an escrow officer'}
              </button>
            </div>
          </>
        )}

        {step === 4 && (
          <div className="oe-done">
            <div className="tick" aria-hidden="true">&#10003;</div>
            <div className="big">On its way.</div>
            <p>
              A licensed escrow officer will reach out, usually the same business day. Nothing moves on your
              file until you say so.
            </p>
            <div className="oe-call">Faster by phone: <a href={PHONE_HREF}>{PHONE_DISPLAY}</a></div>
          </div>
        )}
      </div>
    </div>
  );
}
