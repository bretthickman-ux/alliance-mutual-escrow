/* "The Shape of a Closing" — native React port of the Claude Design bundle
   (escrow-scene.jsx). No iframe, no de-chrome injection, no seek contract.

   Differences from the bundle source, all deliberate:
   - The composition engine is replaced by a tiny local clock (Stage below)
     that self-plays, holds 3.2s on the finale, loops, and pauses off screen.
   - `background` is a prop wired to the page's --shape-bg token, so the piece
     is seamless against its section by construction.
   - Reduced motion renders the true final frame (key turned, "Every promise,
     kept.") and never animates.
   - The tweaks/editor panel and the export-only screen-label effect are gone.
   The scene drawing itself is preserved verbatim, so the motion matches the
   locked mockup exactly. */

import React from 'react';
import { Easing, clamp, interpolate, animate, derive } from './engine';

const INK = '#0f1215';
const SERIF = "'Instrument Serif', Georgia, serif";
const UIF = "Inter, 'Helvetica Neue', sans-serif";
const MONO = "'IBM Plex Mono', ui-monospace, monospace";

const HOLD = 3.2; // seconds held on the finished key before the loop restarts

const X0 = 430, PXD = 30, TIP = 1330, BT = 448, BB = 496, CY = 470;
const dayX = (d) => X0 + d * PXD;
const CUTS = [{ day: 5, depth: 16 }, { day: 12, depth: 26 }, { day: 21, depth: 32 }, { day: 27, depth: 20 }];
const cutSeg = (c) => { const x = dayX(c.day); return `L${x - 14},${BT} L${x - 8},${BT + c.depth} L${x + 8},${BT + c.depth} L${x + 14},${BT}`; };
const BLADE_D = `M${X0},${BT} ` + CUTS.map(cutSeg).join(' ') + ` L1302,${BT} L${TIP},464 L${TIP},480 L1306,${BB} L${X0},${BB} Z`;
const donut = (cx, cy, r) => `M${cx - r},${cy} a${r},${r} 0 1,0 ${2 * r},0 a${r},${r} 0 1,0 ${-2 * r},0`;
const COLLAR_D = `M395,438 L430,438 L430,502 L395,502 Z`;

const MOTION = {
  enter: (T, start, dur = 1.0, dist = 26) => {
    const p = animate({ from: 0, to: 1, start, end: start + dur, ease: Easing.easeOutCubic })(T);
    return { p, opacity: p, transform: `translateY(${(1 - p) * dist}px)` };
  },
  draw: (T, start, dur = 1.0) => animate({ from: 0, to: 1, start, end: start + dur, ease: Easing.easeInOutCubic })(T),
  pop: (T, start, dur = 0.6) => {
    const p = animate({ from: 0, to: 1, start, end: start + dur, ease: Easing.easeOutQuart })(T);
    return { p, opacity: Math.min(1, p * 1.8), scale: 0.86 + 0.14 * Easing.easeOutBack(p) };
  },
};
const pulse = (T, t0, dur = 0.8) => { const p = MOTION.draw(T, t0, dur); return p <= 0 || p >= 1 ? 0 : Math.sin(p * Math.PI); };

function model(CUES, total, county) {
  const CU = String(county || 'Orange').toUpperCase();
  const m = {
    open: CUES.Open,
    m1: CUES.Open + 1.2, m2: CUES.Open + 3.5,
    m3: CUES.Clear + 1.1, m4: CUES.Clear + 4.0,
    m5: CUES.Fund + 2.9, m6: CUES.Fund + 5.1,
    m7: CUES.Record + 2.6, keys: CUES.Keys, total,
  };
  m.dayAt = interpolate([m.open, m.m1, m.m2, m.m3, m.m4, m.m5, m.m6, m.m7], [0, 1, 3, 5, 12, 21, 27, 30], Easing.easeInOutCubic);
  m.MS = [
    { day: 1, t: m.m1, label: 'OPENED & RECEIPTED', lv: 1, sx: 385, sy: 470 },
    { day: 3, t: m.m2, label: 'EARNEST VERIFIED', lv: 0, sx: 300, sy: 470 },
    { day: 5, t: m.m3, label: 'TITLE SEARCH', lv: 2, depth: 16 },
    { day: 12, t: m.m4, label: 'HOA DEMANDS', lv: 1, depth: 26 },
    { day: 21, t: m.m5, label: 'LOAN DOCS SIGNED', lv: 0, depth: 32 },
    { day: 27, t: m.m6, label: 'FUNDS CONFIRMED', lv: 1, depth: 20 },
    { day: 30, t: m.m7, label: 'RECORDED', lv: 0, depth: 12 },
  ];
  m.NOW = [
    { t: m.open - 0.8, s: 'Your escrow officer is opening your file' },
    { t: m.m1, s: 'Your escrow officer is verifying your earnest money' },
    { t: m.m2, s: 'Your title officer is running the title search' },
    { t: m.m3, s: 'Your title officer is clearing HOA demands' },
    { t: m.m4, s: 'Your funding officer is preparing your loan documents' },
    { t: m.m5, s: 'Your funding officer is confirming lender funds' },
    { t: m.m6, s: 'Your recording officer is filing with the County of ' + (county || 'Orange') },
    { t: m.m7 + 0.9, s: 'Your deed is recorded' },
  ];
  m.PH = [
    { n: '01', name: 'OPEN', a: 0, b: 3 },
    { n: '02', name: 'CLEAR', a: 3, b: 12 },
    { n: '03', name: 'FUND', a: 12, b: 27 },
    { n: '04', name: 'RECORD', a: 27, b: 30 },
  ];
  m.county = county || 'Orange';
  m.CU = CU;
  return m;
}

function cameraAt(T, M, CUES) {
  const tt = [0, 2.9, M.m1 - 0.6, M.m2, M.m3, M.m4, CUES.Fund + 1.4, M.m5, M.m6, CUES.Record + 1.4, M.m7, M.m7 + 2.0, M.keys + 0.7, M.keys + 1.4, M.total];
  const fx = interpolate(tt, [800, 800, 330, 335, 585, 795, 900, 1065, 1240, 1268, 1295, 1290, 800, 800, 800], Easing.easeInOutSine)(T);
  const fy = interpolate(tt, [446, 446, 496, 496, 498, 500, 496, 500, 498, 494, 470, 471, 478, 476, 476], Easing.easeInOutSine)(T);
  const s = interpolate(tt, [1.0, 1.02, 1.36, 1.42, 1.34, 1.34, 1.2, 1.34, 1.38, 1.22, 1.42, 1.38, 1.02, 1.06, 1.08], Easing.easeInOutSine)(T);
  return { fx, fy, s };
}
const camCSS = (fx, fy, s) => `translate3d(${800 - fx * s}px, ${340 - fy * s}px, 0) scale(${s})`;

function NowCard({ T, M, accent }) {
  const head = MOTION.enter(T, M.open - 1.2, 0.9, 14);
  const gone = MOTION.draw(T, M.keys + 1.2, 0.5);
  const dotP = 1 + 0.22 * Math.sin(T * 3.4);
  return (
    <div style={{ position: 'absolute', left: 96, top: 540, width: 740, opacity: head.opacity * (1 - gone), transform: head.transform }}>
      <div style={{ position: 'absolute', left: -140, top: -10, right: -46, bottom: -24, background: '#f7f6f2', boxShadow: '0 0 20px 14px rgba(247,246,242,0.97)', borderRadius: 10 }}></div>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 11 }}>
        <div style={{ position: 'relative', width: 11, height: 11 }}>
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: accent, transform: `scale(${dotP})` }}></div>
          <div style={{ position: 'absolute', inset: -6, borderRadius: '50%', border: `1px solid ${accent}`, opacity: 0.35 + 0.3 * Math.sin(T * 3.4) }}></div>
        </div>
        <div style={{ fontFamily: MONO, fontSize: 14, letterSpacing: '0.36em', color: 'rgba(15,18,21,0.7)' }}>HAPPENING NOW</div>
      </div>
      <div style={{ position: 'relative', height: 84, marginTop: 12 }}>
        {M.NOW.map((it, i) => {
          const end = i < M.NOW.length - 1 ? M.NOW[i + 1].t : M.keys + 1.2;
          const inP = MOTION.enter(T, it.t + 0.35, 0.55, 16);
          const outP = MOTION.draw(T, end, 0.28);
          return (
            <div key={i} style={{ position: 'absolute', inset: 0, opacity: inP.opacity * (1 - outP), transform: `translateY(${(1 - inP.p) * 16 - outP * 12}px)` }}>
              <div style={{ fontFamily: SERIF, fontSize: 30, lineHeight: 1.12, color: INK }}>{it.s}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Annotations({ T, M, df, accent }) {
  const fadeAll = 1 - MOTION.draw(T, M.keys, 0.8);
  M.MS.forEach((ms) => { void ms; });
  let plunge = 0, pDepth = 10;
  M.MS.forEach((ms) => {
    if (ms.day < 5) return;
    const down = MOTION.draw(T, ms.t - 0.5, 0.35), up = MOTION.draw(T, ms.t + 0.2, 0.4);
    const p = down - up;
    if (p > plunge) { plunge = p; pDepth = ms.depth || 10; }
  });
  const cx = dayX(clamp(df, 0, 30));
  const tipY = 436 + plunge * (pDepth + 4);
  const cutterO = MOTION.draw(T, M.m2 + 0.4, 0.6) * (1 - MOTION.draw(T, M.m7 + 0.9, 0.8));
  return (
    <svg viewBox="0 0 1600 900" style={{ position: 'absolute', left: 0, top: 0, width: 1600, height: 900, opacity: fadeAll }}>
      <g transform={`scale(${MOTION.draw(T, 1.8, 1.0)},1)`} style={{ transformOrigin: '205px 470px', transformBox: 'view-box' }}>
        <line x1="205" y1={CY} x2="1360" y2={CY} stroke={INK} strokeWidth="1" strokeDasharray="10 7" opacity="0.16" />
      </g>
      <g fill="none" stroke={INK} strokeWidth="1.6" opacity="0.09">
        <path d={donut(300, 470, 95)} pathLength="1" strokeDasharray="1" strokeDashoffset={1 - MOTION.draw(T, 1.9, 0.5)} />
        <path d={donut(300, 470, 36)} pathLength="1" strokeDasharray="1" strokeDashoffset={1 - MOTION.draw(T, 2.3, 0.3)} />
        <path d={COLLAR_D} pathLength="1" strokeDasharray="1" strokeDashoffset={1 - MOTION.draw(T, 2.55, 0.25)} />
        <path d={BLADE_D} pathLength="1" strokeDasharray="1" strokeDashoffset={1 - MOTION.draw(T, 2.7, 1.2)} />
      </g>
      <g>
        {Array.from({ length: 30 }, (_, i) => {
          const d = i + 1, x = dayX(d), five = d % 5 === 0;
          const yield5 = d === 5 ? 1 - MOTION.draw(T, M.m3 + 0.3, 0.5) : d === 20 ? 1 - MOTION.draw(T, M.m5 + 0.3, 0.5) : d === 30 ? 1 - MOTION.draw(T, M.m7 + 0.3, 0.5) : 1;
          const o = MOTION.draw(T, 2.3 + i * 0.022, 0.3) * (d <= df ? 0.75 : 0.26) * yield5;
          return (
            <g key={d} opacity={o}>
              <line x1={x} y1={512} x2={x} y2={five ? 526 : 519} stroke={INK} strokeWidth={five ? 1.4 : 1} />
              {five ? <text x={x} y={545} textAnchor="middle" fontFamily={MONO} fontSize="12" fill={INK} opacity="0.85">{d}</text> : null}
            </g>
          );
        })}
      </g>
      {M.PH.map((ph, i) => {
        const x1 = dayX(ph.a) + 5, x2 = dayX(ph.b) - 5, mid = (x1 + x2) / 2;
        const en = MOTION.draw(T, 2.6 + i * 0.15, 0.7);
        const active = df > ph.a + 0.01 && df < ph.b, done = df >= ph.b;
        const o = en * (active ? 1 : done ? 0.55 : 0.3);
        return (
          <g key={ph.n} opacity={o}>
            <path d={`M${x1},408 L${x1},402 L${x2},402 L${x2},408`} fill="none" stroke={INK} strokeWidth="1" />
            <text x={mid} y={384} textAnchor="middle" fontFamily={MONO} fontSize="13" letterSpacing="2.5" fill={INK}>{ph.n + ' · ' + ph.name}</text>
            <circle cx={mid} cy={365} r={active ? 3.2 + 0.8 * Math.sin(T * 3.4) : 2.6} fill={active || done ? accent : 'none'} stroke={active || done ? 'none' : 'rgba(15,18,21,0.35)'} strokeWidth="1" opacity={active ? 1 : done ? 0.9 : 0.6} />
          </g>
        );
      })}
      {M.MS.map((ms, i) => {
        const x = clamp(dayX(ms.day), 460, 1520);
        const yl = [534, 562, 590][ms.lv] || 534;
        const line = MOTION.draw(T, ms.t + 0.1, 0.45);
        const tx = MOTION.pop(T, ms.t + 0.3, 0.6);
        const flash = pulse(T, ms.t + 0.25, 1.4);
        const nxt = M.MS[i + 1];
        const out = nxt ? 0.82 * MOTION.draw(T, nxt.t + 0.3, 0.5) : 0;
        return (
          <g key={ms.day} opacity={1 - out}>
            <line x1={x} y1={502} x2={x} y2={502 + (yl - 516) * line} stroke={INK} strokeWidth="1" opacity="0.4" />
            <g opacity={tx.opacity} transform={`translate(${x},${yl}) scale(${tx.scale})`}>
              <text x={ms.dx || 0} y="0" textAnchor={ms.anchor || 'middle'} fontFamily={MONO} fontSize="11" letterSpacing="2" fill="rgba(15,18,21,0.55)">{'DAY ' + String(ms.day).padStart(2, '0')}</text>
              <text x={ms.dx || 0} y="19" textAnchor={ms.anchor || 'middle'} fontFamily={UIF} fontWeight="600" fontSize="12.5" letterSpacing="1.2" fill={INK}>{ms.label}</text>
              <text x={ms.dx || 0} y="19" textAnchor={ms.anchor || 'middle'} fontFamily={UIF} fontWeight="600" fontSize="12.5" letterSpacing="1.2" fill={accent} opacity={flash}>{ms.label}</text>
            </g>
          </g>
        );
      })}
      {CUTS.map((c) => {
        const ms = M.MS.find((m2) => m2.day === c.day);
        const o = ms ? MOTION.draw(T, ms.t - 0.05, 0.2) * Math.max(0, 1 - MOTION.draw(T, ms.t + 0.4, 1.3)) : 0;
        return <path key={c.day} d={`M${dayX(c.day) - 14},${BT} ${cutSeg(c).slice(1)}`} fill="none" stroke={accent} strokeWidth="2.5" opacity={o * 0.95} />;
      })}
      {M.MS.map((ms) => {
        const p = MOTION.draw(T, ms.t - 0.05, 0.75);
        const o = p <= 0 || p >= 1 ? 0 : Math.sin(p * Math.PI);
        const x = ms.sx != null ? ms.sx : dayX(ms.day), y = ms.sy != null ? ms.sy : BT + (ms.depth || 10) - 4;
        return (
          <g key={'sp' + ms.day} opacity={o}>
            <circle cx={x} cy={y} r={6 + p * 30} fill="none" stroke={accent} strokeWidth="1.6" />
            {[-40, 15, 70].map((ang) => {
              const a = (ang * Math.PI) / 180, r1 = 10 + p * 22, r2 = r1 + 12;
              return <line key={ang} x1={x + r1 * Math.cos(a)} y1={y - r1 * Math.sin(a)} x2={x + r2 * Math.cos(a)} y2={y - r2 * Math.sin(a)} stroke={accent} strokeWidth="1.6" />;
            })}
          </g>
        );
      })}
      <g opacity={cutterO}>
        <rect x={cx - 11} y={340} width="22" height="7" fill={INK} opacity="0.85" />
        <line x1={cx} y1={347} x2={cx} y2={tipY} stroke={INK} strokeWidth="2" />
        <path d={`M${cx - 6},${tipY} L${cx + 6},${tipY} L${cx},${tipY + 10} Z`} fill={INK} />
        <circle cx={cx} cy={tipY + 10} r="3" fill={accent} opacity={0.25 + plunge * 0.75} />
      </g>
    </svg>
  );
}

function KeyBody({ T, M, df, accent }) {
  const outer = MOTION.draw(T, M.open + 0.4, 1.1);
  const hole = MOTION.draw(T, M.m2 - 0.5, 0.6);
  const collar = MOTION.draw(T, M.m2 + 0.2, 0.7);
  const bladeO = MOTION.draw(T, M.m2, 0.6);
  const revealW = Math.max(0, dayX(clamp(df, 0, 30)) - X0 + 2);
  const fillP = MOTION.draw(T, M.keys + 0.15, 0.6);
  const turn = animate({ from: 0, to: -180, start: M.keys + 0.5, end: M.keys + 1.6, ease: Easing.easeInOutQuart })(T);
  const settle = Math.sin(MOTION.draw(T, M.keys + 1.55, 0.3) * Math.PI) * 4;
  const glint = Math.max(0, 1 - Math.abs(turn + 90) / 24);
  const sweep = interpolate([M.keys + 0.6, M.keys + 1.4, M.keys + 2.4], [0, 1, 0.12], Easing.easeInOutSine)(T);
  const shimO = animate({ from: 0, to: 1, start: M.keys + 0.5, end: M.keys + 0.8, ease: Easing.easeInOutSine })(T) * (1 - MOTION.draw(T, M.keys + 2.6, 0.8));
  const shadowA = 0.05 + (df / 30) * 0.07 + fillP * 0.16;
  const shadowY = 8 + fillP * 18;
  return (
    <div style={{ position: 'absolute', inset: 0, perspective: 1500 }}>
      <svg viewBox="0 0 1600 900" style={{ position: 'absolute', left: 0, top: 0, width: 1600, height: 900, transform: `translateY(${settle}px) rotateX(${turn}deg)`, transformOrigin: '50% 52.2%', transformStyle: 'preserve-3d', filter: `drop-shadow(0 ${shadowY}px ${20 + fillP * 26}px rgba(15,18,21,${shadowA}))` }}>
        <defs>
          <clipPath id="bladeReveal"><rect x={X0} y="425" width={revealW} height="90" /></clipPath>
          <clipPath id="keySilhouette">
            <path d={donut(300, 470, 95) + ' ' + donut(300, 470, 36)} fillRule="evenodd" />
            <path d={COLLAR_D} />
            <path d={BLADE_D} />
          </clipPath>
          <linearGradient id="keySheen" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="0.5" stopColor="#fff2df" stopOpacity="0.45" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={donut(300, 470, 95) + ' ' + donut(300, 470, 36)} fillRule="evenodd" fill={INK} opacity={fillP} />
        <path d={COLLAR_D} fill={INK} opacity={fillP} />
        <path d={BLADE_D} fill={INK} opacity={fillP} />
        <g clipPath="url(#keySilhouette)" opacity={fillP * shimO}>
          <rect x="-150" y="330" width="300" height="280" fill="url(#keySheen)" transform={`translate(${260 + sweep * 1200},0) skewX(-14)`} />
        </g>
        <g fill="none" stroke={INK} strokeWidth="2.6">
          <path d={donut(300, 470, 95)} pathLength="1" strokeDasharray="1" strokeDashoffset={1 - outer} />
          <path d={donut(300, 470, 36)} pathLength="1" strokeDasharray="1" strokeDashoffset={1 - hole} />
          <path d={COLLAR_D} pathLength="1" strokeDasharray="1" strokeDashoffset={1 - collar} />
          <g clipPath="url(#bladeReveal)" opacity={bladeO}>
            <path d={BLADE_D} />
          </g>
        </g>
      </svg>
      <div style={{ position: 'absolute', left: 200, top: 466, width: 1160, height: 6, background: `linear-gradient(90deg, transparent, ${accent} 30%, #fff8ee 50%, ${accent} 70%, transparent)`, opacity: glint * 0.9, filter: 'blur(1px)', pointerEvents: 'none' }}></div>
    </div>
  );
}

function FinaleText({ T, M, force }) {
  const h = MOTION.enter(T, M.keys + 1.3, 0.9, 24);
  const s = MOTION.enter(T, M.keys + 1.7, 0.8, 16);
  const ho = force ? 1 : h.opacity, so = force ? 1 : s.opacity;
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: 470, textAlign: 'center', pointerEvents: 'none' }}>
      <div style={{ fontFamily: SERIF, fontSize: 52, color: INK, opacity: ho, transform: force ? 'none' : h.transform }}>Every promise, kept.</div>
      <div style={{ fontFamily: MONO, fontSize: 13, letterSpacing: '0.32em', color: 'rgba(15,18,21,0.6)', marginTop: 14, opacity: so, transform: force ? 'none' : s.transform }}>
        {'RECORDED · COUNTY OF ' + M.CU + ' · DAY 30 OF 30'}
      </div>
    </div>
  );
}

function Piece({ T: rawT, CUES, authoredTotal, reduced, accent = "#b97a3a", county = "Orange", paper }) {
  const M = model(CUES, authoredTotal, county);
  const T = reduced ? M.total : rawT;
  const df = clamp(M.dayAt(T), 0, 30);
  const shown = Math.max(1, Math.floor(df + 1e-4));
  let { fx, fy, s } = reduced ? { fx: 800, fy: 488, s: 1 } : cameraAt(T, M, CUES);
  if (!reduced) { fx += Math.sin(T * 0.35) * 6; fy += Math.cos(T * 0.28) * 4; s *= 1 + 0.004 * Math.sin(T * 0.22); }
  const s2 = 1 + (s - 1) * 0.15, fx2 = 800 + (fx - 800) * 0.15, fy2 = 450 + (fy - 450) * 0.15;
  const numFrac = df - Math.floor(df);
  const numRoll = df >= 1 && shown < 30 ? Easing.easeInOutSine(clamp((numFrac - 0.45) / 0.55, 0, 1)) : 0;
  const numO = MOTION.draw(T, M.open, 0.8) * 0.09;
  const numMask = 'linear-gradient(to bottom, #000 0%, #000 55%, transparent 80%)';
  const bloom = interpolate([M.keys + 0.5, M.keys + 1.3, M.keys + 1.9, M.keys + 3.0], [0, 0.4, 0.4, 0.2], Easing.easeInOutSine)(T);
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: paper, color: INK, fontFamily: UIF }}>
      <div style={{ position: 'absolute', inset: 0, transform: camCSS(fx2, fy2, s2), transformOrigin: '0 0' }}>
        <div style={{ position: 'absolute', left: 320, top: 170, width: 700, height: 660, WebkitMaskImage: numMask, maskImage: numMask }}>
          <div style={{ position: 'absolute', inset: 0, fontFamily: SERIF, fontSize: 520, lineHeight: '660px', textAlign: 'center', color: '#b08d3f', opacity: numO * (1 - numRoll) }}>{shown}</div>
          <div style={{ position: 'absolute', inset: 0, fontFamily: SERIF, fontSize: 520, lineHeight: '660px', textAlign: 'center', color: '#b08d3f', opacity: numO * numRoll }}>{Math.min(shown + 1, 30)}</div>
        </div>
      </div>
      <div style={{ position: 'absolute', inset: 0, transform: camCSS(fx, fy, s), transformOrigin: '0 0' }}>
        <div style={{ position: 'absolute', left: 350, top: 210, width: 900, height: 520, background: `radial-gradient(closest-side, ${accent}55, transparent 70%)`, opacity: bloom, filter: 'blur(10px)' }}></div>
        <Annotations T={T} M={M} df={df} accent={accent} />
        <KeyBody T={T} M={M} df={df} accent={accent} />
      </div>
      {/* The standalone bundle carried its own title header, vignette, and
          paper grain. On the site, the page frames the piece (heading above,
          seamless paper around), so all three are gone: the vignette and grain
          were the visible edge seam against the page background. The
          timeline-synced text (Happening Now, the finale) stays: it IS the
          piece. */}
      <NowCard T={T} M={M} accent={accent} />
      <FinaleText T={T} M={M} force={reduced} />
    </div>
  );
}

/* ── Stage: the self-playing clock ──────────────────────────────────────────
   Runs a rAF loop only while the piece is on screen. Plays 0 -> total, holds
   `HOLD` seconds on the finished key, then loops. Reduced motion shows the
   final frame and never starts the loop. Background comes from the token. */
const STAGE_W = 1600, STAGE_H = 680;

export default function ShapeOfClosing({ background = "#f7f6f2", accent = "#b97a3a", county = "Orange" }) {
  const { CUES, authoredTotal } = React.useMemo(() => derive(), []);
  const total = authoredTotal;

  const reduced = React.useMemo(
    () => typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  );

  const wrapRef = React.useRef(null);
  const [scale, setScale] = React.useState(STAGE_W ? 860 / STAGE_W : 1);
  const [T, setT] = React.useState(reduced ? total : 0.01);

  // Scale the fixed 1600x680 stage to the container width.
  React.useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => setScale(el.clientWidth / STAGE_W);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // The clock. Only advances while on screen; preserves elapsed across pauses.
  React.useEffect(() => {
    if (reduced) { setT(total); return; }
    const el = wrapRef.current;
    if (!el) return;
    const cycle = total + HOLD;
    let elapsed = 0;
    let last = null;
    let raf = null;
    let visible = false;

    const frame = (now) => {
      if (last === null) last = now;
      elapsed += (now - last) / 1000;
      last = now;
      const e = elapsed % cycle;
      setT(Math.max(0.01, Math.min(e, total)));
      raf = requestAnimationFrame(frame);
    };
    const start = () => {
      if (raf != null) return;
      last = null;
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      if (raf != null) cancelAnimationFrame(raf);
      raf = null;
      last = null;
    };

    const io = new IntersectionObserver(
      (entries) => entries.forEach((en) => {
        visible = en.isIntersecting;
        if (visible) start();
        else stop();
      }),
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => { stop(); io.disconnect(); };
  }, [reduced, total]);

  return (
    <div
      ref={wrapRef}
      style={{ position: 'relative', width: '100%', aspectRatio: `${STAGE_W} / ${STAGE_H}`, background, overflow: 'hidden' }}
    >
      <div
        style={{
          position: 'absolute', top: '50%', left: '50%',
          width: STAGE_W, height: STAGE_H,
          transform: `translate(-50%, -50%) scale(${scale})`, transformOrigin: 'center',
        }}
      >
        <Piece
          T={T}
          CUES={CUES}
          authoredTotal={authoredTotal}
          reduced={reduced}
          accent={accent}
          county={county}
         
          paper={background}
        />
      </div>
    </div>
  );
}
