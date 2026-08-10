/* Home-page motion, ported from the mockup index.html (minus the animation,
   which is now a native island). Reveals, fee count-ups, the tab toggle, the
   ambient statement video, and the self-playing 30-day file tracker. */

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Hero video: fade in when it can play; never leave the hero blank.
const hv = document.getElementById('hv') as HTMLVideoElement | null;
if (hv) {
  const show = () => hv.classList.add('in');
  hv.addEventListener('canplay', show, { once: true });
  if (hv.readyState >= 3) show();
  hv.play().catch(() => {});
  setTimeout(show, 4000);
}

// Staged reveals.
const io = new IntersectionObserver(
  (entries) =>
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    }),
  { threshold: 0.22 },
);
document.querySelectorAll<HTMLElement>('.reveal, .rowx').forEach((el, i) => {
  el.style.transitionDelay = (i % 4) * 70 + 'ms';
  io.observe(el);
});

// Fee count-up.
const feetable = document.getElementById('feetable');
if (feetable) {
  const cio = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        cio.unobserve(e.target);
        ([['cnt1', 2450], ['cnt2', 3200]] as const).forEach(([id, target], k) => {
          const el = document.getElementById(id);
          if (!el) return;
          const t0 = performance.now(), dur = 900;
          const step = (now: number) => {
            const p = Math.min((now - t0) / dur, 1), ease = 1 - Math.pow(1 - p, 3);
            el.textContent = '$' + Math.round(target * ease).toLocaleString();
            if (p < 1) requestAnimationFrame(step);
          };
          setTimeout(() => requestAnimationFrame(step), k * 140);
        });
      }),
    { threshold: 0.4 },
  );
  cio.observe(feetable);
}

// Fee table tab toggle (the full calculator arrives in Phase 2).
document.querySelectorAll<HTMLElement>('.ft-tab').forEach((t) =>
  t.addEventListener('click', () => {
    document.querySelectorAll('.ft-tab').forEach((x) => x.classList.toggle('on', x === t));
  }),
);

// Ambient statement video: plays only while on screen.
const sv = document.getElementById('stvid') as HTMLVideoElement | null;
if (sv && !reduce) {
  new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (e.isIntersecting) {
          if (!sv.dataset.l) { sv.dataset.l = '1'; sv.load(); }
          sv.play().then(() => sv.classList.add('playing')).catch(() => {});
        } else {
          sv.pause();
        }
      }),
    { threshold: 0.25 },
  ).observe(sv);
}

// Self-playing 30-day file tracker.
(function () {
  const body = document.getElementById('i2body');
  if (!body) return;
  const rows = [...body.querySelectorAll<HTMLElement>('.i2m')];
  const day = document.getElementById('i2day')!;
  const bar = document.getElementById('i2prog')!;
  if (reduce) {
    rows.forEach((r) => r.classList.add('done'));
    day.textContent = '30';
    bar.style.width = '100%';
    return;
  }
  let playing = false, t0: number | null = null, raf = 0;
  const DUR = 12000;
  function frame(now: number) {
    if (t0 === null) t0 = now;
    let p = ((now - t0) % (DUR + 2500)) / DUR;
    if (p > 1) p = 1;
    const d = Math.max(1, Math.min(30, Math.round(p * 30)));
    day.textContent = String(d);
    bar.style.width = p * 100 + '%';
    rows.forEach((r) => {
      const at = +r.dataset.d!;
      r.classList.toggle('done', d >= at && !(d === at && p < 1 && at !== 1));
      r.classList.toggle('now', d >= at - 1 && d < at);
    });
    if (playing) raf = requestAnimationFrame(frame);
  }
  new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (e.isIntersecting && !playing) {
          playing = true;
          t0 = null;
          raf = requestAnimationFrame(frame);
        } else if (!e.isIntersecting && playing) {
          playing = false;
          cancelAnimationFrame(raf);
        }
      }),
    { threshold: 0.35 },
  ).observe(body);
})();
