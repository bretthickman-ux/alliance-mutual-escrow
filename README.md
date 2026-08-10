# Alliance Mutual Escrow

Production website for Alliance Mutual Escrow (AME), an independent, DFPI licensed
escrow company serving California. Built with Astro (static-first, React islands
for the animation now and the calculator in Phase 2), self-hosted fonts, and
responsive AVIF/WebP imagery. Deployed on Cloudflare Pages.

This is Phase 1 (Foundation) of the plan in `HANDOFF.md`. It reproduces the
locked `deploy_m/` mockup, componentized and data-driven, and ports "The Shape
of a Closing" natively (no iframe).

## Stack

- **Astro 5**, static output (`dist/`).
- **React island** for The Shape of a Closing (`src/components/shape/`),
  hydrated with `client:visible`.
- **Fonts**: self-hosted, latin-subset Instrument Serif / Inter / IBM Plex Mono
  via Fontsource (`src/styles/fonts.css`), `font-display: swap`.
- **Images**: `astro:assets` `<Picture>` emits AVIF + WebP with `srcset`.
- **Video**: `public/media/hero.mp4`, `public/media/statement.mp4`, copied as-is
  (already `+faststart`).

## Architecture: built for the clone from day one

The Advantage One Escrow (AOE) clone in Phase 5 is a data + theme swap, not a
rebuild:

- **Theme tokens**: `src/styles/tokens.css` (palette, fonts, motion). Override
  these for AOE.
- **Roster data**: `src/data/roster.ts` (AME). The AOE roster is preserved in
  `src/data/roster-aoe.ts`. Both team layouts read the roster array.
- **Fees data**: `src/data/fees.ts`, a tiered engine that also feeds the Phase 2
  calculator. No fee is typed twice.
- **Site facts**: `src/data/site.ts` (name, address, phone, nav).
- **One component library**: `src/components/`, `src/layouts/BaseLayout.astro`.

## Commands

```bash
npm install
npm run dev          # local dev server
npm run build        # static build to dist/
npm run test         # regression harness over the built dist/
npm run test:build   # build then test
npm run preview      # serve the built dist/ locally
```

### Regression (HANDOFF section 9)

`tests/regression.mjs` loads every page at **1440x900** and **390x844** in
headless Chromium and fails on any **console error**, **page error**, or
**horizontal overflow**. It also greps the built HTML for **em dashes** and the
phrase **"hands you the keys"** and fails if either appears (the em-dash rule and
the neutrality rule). Run it in CI before every deploy.

## Deploying (Cloudflare Pages)

Two supported paths. **Git-connected is the HANDOFF-decided default.**

### A. Git-connected (recommended, no token in the loop)

1. Push this repo to GitHub.
2. Cloudflare dashboard -> Pages -> Create -> Connect to Git -> pick the repo.
3. Build settings:
   - **Build command**: `npm run build`
   - **Output directory**: `dist`
   - **Node version**: 20 (pinned in `.node-version`)
4. Every push to the production branch deploys; every branch/PR gets a preview
   URL. No API token is handled by the build.

### B. Direct upload with an API token (for automated deploys)

Uses Wrangler and a scoped Cloudflare API token. The token is read from the
environment and is **never** written to a file or committed.

```bash
export CLOUDFLARE_ACCOUNT_ID=57c0ba39df3ac549e86fc62434509438
export CLOUDFLARE_API_TOKEN=***   # scoped token, see below
npm run deploy                    # build + regression + wrangler pages deploy
```

Create the token in the Cloudflare dashboard (My Profile -> API Tokens ->
Create Token) with the **"Cloudflare Pages: Edit"** permission scoped to this
account only. Store it in your shell/CI secret store, not in the repo. Rotate it
if it is ever exposed.

`wrangler.toml` pins the project name (`alliance-mutual-escrow`) and output dir.

## Status and open items

Carried from `HANDOFF.md` section 8, still owed by Brett:

- `†` The **75+ years** and **4.9 star** figures are placeholders (daggers on)
  until real numbers are confirmed.
- Roster items flagged `pending: true` in `src/data/roster.ts` (Wendy/Sue,
  Michelle's email, Jhana's team, Julie's company) need confirmation.
- `team-b.astro` is the runner-up typographic index, kept for the owner's
  confirmation of the team layout, then deleted (the winner is `team.astro`).
- Google Places reviews, schema, sitemap, redirect map: Phase 2 and 3.
