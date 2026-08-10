/* Engine primitives extracted verbatim from the Claude Design bundle
   (animations-v3.jsx). These are the only helpers "The Shape of a Closing"
   depends on. Keeping them byte-for-byte preserves the motion exactly, which
   is the whole point of a native port: no seam, no drift from the mockup. */

export const Easing = {
  linear: (t: number) => t,

  easeInQuad: (t: number) => t * t,
  easeOutQuad: (t: number) => t * (2 - t),
  easeInOutQuad: (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),

  easeInCubic: (t: number) => t * t * t,
  easeOutCubic: (t: number) => (--t) * t * t + 1,
  easeInOutCubic: (t: number) => (t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1),

  easeInQuart: (t: number) => t * t * t * t,
  easeOutQuart: (t: number) => 1 - (--t) * t * t * t,
  easeInOutQuart: (t: number) => (t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t),

  easeInSine: (t: number) => 1 - Math.cos((t * Math.PI) / 2),
  easeOutSine: (t: number) => Math.sin((t * Math.PI) / 2),
  easeInOutSine: (t: number) => -(Math.cos(Math.PI * t) - 1) / 2,

  easeOutBack: (t: number) => {
    const c1 = 1.70158, c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
};

export type EaseFn = (t: number) => number;

export const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

/** Popmotion-style keyframe interpolation. */
export function interpolate(input: number[], output: number[], ease: EaseFn | EaseFn[] = Easing.linear) {
  return (t: number) => {
    if (t <= input[0]) return output[0];
    if (t >= input[input.length - 1]) return output[output.length - 1];
    for (let i = 0; i < input.length - 1; i++) {
      if (t >= input[i] && t <= input[i + 1]) {
        const span = input[i + 1] - input[i];
        const local = span === 0 ? 0 : (t - input[i]) / span;
        const easeFn = Array.isArray(ease) ? ease[i] || Easing.linear : ease;
        const eased = easeFn(local);
        return output[i] + (output[i + 1] - output[i]) * eased;
      }
    }
    return output[output.length - 1];
  };
}

/** Single-segment tween: `from` before `start`, `to` after `end`. */
export function animate({
  from = 0,
  to = 1,
  start = 0,
  end = 1,
  ease = Easing.easeInOutCubic,
}: { from?: number; to?: number; start?: number; end?: number; ease?: EaseFn }) {
  return (t: number) => {
    if (t <= start) return from;
    if (t >= end) return to;
    const local = (t - start) / (end - start);
    return from + (to - from) * ease(local);
  };
}

/* Scene list (OM_SCENES from the bundle). Durations, in seconds. */
export const SCENES = [
  { name: 'Opening', dur: 3.5 },
  { name: 'Open', dur: 4.5 },
  { name: 'Clear', dur: 5 },
  { name: 'Fund', dur: 6 },
  { name: 'Record', dur: 4.5 },
  { name: 'Keys', dur: 4 },
] as const;

/** Cue table + authored total, derived exactly as the bundle's ccDerive does
    (nat === dur here, so authored time equals play time). */
export function derive() {
  let authStart = 0;
  const table: Record<string, number> = {};
  for (const s of SCENES) {
    if (!(s.name in table)) table[s.name] = Math.round(authStart * 1000) / 1000;
    authStart += s.dur;
  }
  return { CUES: table, authoredTotal: Math.round(authStart * 1000) / 1000 };
}
