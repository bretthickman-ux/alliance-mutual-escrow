# QA Report · Alliance Mutual Escrow

Automated QA status as of 2026-08-10, produced with the Phase 4 pass. This is
the report to hand the owner alongside the Review Tour.

## Regression suite (all green)

`npm run test:build` builds and runs `tests/regression.mjs` over all **27
pages** of the built site:

| Gate | Result |
| --- | --- |
| Console errors / page errors (Chromium, 1440x900 + 390x844) | 0 |
| Horizontal overflow, both viewports | 0 |
| Firefox + WebKit desktop pass (`CROSS_ENGINE=1`) | 0 errors |
| Em dashes (and en/figure/horizontal-bar dashes) in HTML | 0 |
| "hands you the keys" (neutrality rule) | 0 |
| Exactly one `h1` per page | 27/27 |
| `ld+json` schema blocks parse | all |
| Internal links + local assets resolve | all |
| Guide PDFs generated (12) | all |

## Lighthouse (mobile, simulated throttling, local static serve)

Target: 90+ at Phase 1 exit, 95+ at Phase 4. Numbers will shift slightly on
the live edge (usually up, thanks to CDN + HTTP/3).

| Page | Perf | LCP | CLS |
| --- | --- | --- | --- |
| Home | 97 | 2.4 s | 0 |
| Calculator | 93 | 2.9 s | 0.02 |
| Team | 97 | 2.1 s | 0.061 |
| Guide (buyer) | 98 | 1.8 s | 0 |
| Buyers & sellers | 97 | 2.4 s | 0 |

Notes: the calculator page's LCP is the hydrated island; `client:load` is the
correct tradeoff there (it is the page's product). Team CLS comes from the
grayscale portrait grid reveal; under the 0.1 "good" threshold.

## Accessibility

- Keyboard: skip link on every page; amber `:focus-visible` on all interactive
  elements including mobile menu, calculator tabs/pills, and the review tour.
- Reduced motion: reveals render instantly; the animation island shows the true
  final frame; the file tracker completes statically; hero/ambient videos and
  Ken Burns stills freeze (CSS + JS gated on `prefers-reduced-motion`).
- ARIA: the animation carries a descriptive `role="img"` label; the file tracker
  is a labeled group; calculator tabs are a `tablist` with `aria-selected`;
  option pills use `aria-pressed`; validation errors use `role="alert"`; count
  controls have explicit labels; results regions are `aria-live`.
- Alt text: portraits carry names; decorative door/band images are empty-alt.

## Cross-browser

Chromium (desktop + mobile viewports), Firefox (desktop), WebKit/Safari-engine
(desktop) all pass the render guard with zero errors. Real-device iOS Safari and
Android Chrome spot-checks remain a manual step on the staging URL.

## Outstanding before launch (not code)

See `docs/LAUNCH-RUNBOOK.md`: figures behind the daggers, owner tour verdicts,
Places key + Place ID, email provider, old-URL redirect inventory, Cloudflare
connect + env vars.
