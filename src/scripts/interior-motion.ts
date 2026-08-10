/* Interior-page motion, ported from the mockup's inline scripts.
   Scroll reveals use a large top rootMargin so elements already scrolled past
   still reveal (HANDOFF section 3). Count-ups ease out. Reduced motion skips
   the staged reveals but leaves content fully visible via CSS. */

function countUp(el: HTMLElement, to: number, dur: number, pre = '') {
  const t0 = performance.now();
  function frame(now: number) {
    const p = Math.min(1, (now - t0) / dur);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = pre + Math.round(to * eased);
    if (p < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

const io = new IntersectionObserver(
  (entries) =>
    entries.forEach((e) => {
      if (e.isIntersecting || e.boundingClientRect.bottom < 0) {
        e.target.classList.add('in');
        e.target.classList.add('go');
        io.unobserve(e.target);

        // Staggered day count-ups for the buyers-sellers timeline.
        if (e.target.classList.contains('miles')) {
          e.target.querySelectorAll<HTMLElement>('.mi .d').forEach((d, i) => {
            const n = parseInt(d.textContent!.replace(/\D/g, ''), 10);
            if (!Number.isNaN(n)) setTimeout(() => countUp(d, n, 700, 'DAY '), i * 140);
          });
        }
        // Investors 45 / 180 numerals.
        if (e.target.classList.contains('nums')) {
          e.target.querySelectorAll<HTMLElement>('.nv[data-n]').forEach((el, i) => {
            setTimeout(() => countUp(el, parseInt(el.dataset.n!, 10), 900), i * 180);
          });
        }
      }
    }),
  { threshold: 0.16, rootMargin: '999999px 0px 0px 0px' },
);

document.querySelectorAll('main > h2, main > p, .fq, .card').forEach((el) => {
  el.classList.add('rv');
  io.observe(el);
});
document.querySelectorAll('.hband, .quiet, .flow, .nums, .miles').forEach((el) => io.observe(el));

// Stagger the timeline rows for the transform reveal.
document.querySelectorAll<HTMLElement>('.miles .mi').forEach((r, i) => {
  r.style.transitionDelay = i * 140 + 'ms';
});
