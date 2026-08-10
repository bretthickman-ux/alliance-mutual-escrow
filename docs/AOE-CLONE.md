# AOE Clone Scaffold · Advantage One Escrow

Phase 5. The architecture was built for this from day one: the clone is a data
and theme swap on the same component library. This doc is the map of what
already exists, what the build steps are, and what facts are still missing.
Nothing gets invented; missing facts are questions for Brett at the bottom.

## What already exists in this repo

- **Theme slot**: `src/styles/tokens-aoe.css`. Every component reads tokens, so
  the clone restyles by swapping this one file (accent pending the real AOE green).
- **Roster, live**: the Compendium sync is org-parameterized. Setting
  `COMPENDIUM_ORG="Advantage One Escrow"` pulls AOE's active staff, titles,
  teams, emails, phones, and headshots exactly like AME's (verified against the
  live base: Tina Sung's team, Team Lisa, Team Margo, bulk sales desk, etc.).
- **Roster, static fallback**: `src/data/roster-aoe.ts` (from the design phase).
- **Imagery reserve**: the coastal/pier footage for AOE lives in the project
  `Video/` folder on Brett's disk (not in this repo; large files). The AME
  inland imagery rule keeps those assets unused until the clone.
- **Everything else**: pages, calculator, guides, PDFs, tour, tests are shared.

## Build steps (when the clone is a go)

1. Create `src/data/site-aoe.ts` from the confirmed AOE facts (below).
2. Sample the AOE green from their logo, fill `tokens-aoe.css`.
3. Swap hero/door/band imagery for the coastal set (same ffmpeg recipe:
   `-an -vf "scale=1600:-2,fps=30" -c:v libx264 -preset slow -crf 23 -pix_fmt yuv420p -movflags +faststart`).
4. Second Cloudflare Pages project on the same repo with env:
   `BRAND=aoe`, `COMPENDIUM_ORG=Advantage One Escrow`, its own domain.
   (A small config switch in `astro.config.mjs` + `site.ts` selects brand data
   by `BRAND`; wire this when facts arrive, it is a one-evening change.)
5. Fee schedule: DO NOT reuse AME's numbers until confirmed identical.

## Questions for Brett (blocking, do not guess)

1. AOE office address in Huntington Beach, main phone, and general email.
2. Does AOE publish the same fee schedule as AME, or its own? (Calculator + fee
   pages depend on it.)
3. The AOE logo file (or the green hex) for the accent token.
4. Which of the AOE staff in Compendium should show on the site? The org filter
   currently returns some people with placeholder titles and shared org
   membership (e.g. Rose Moreno appears under both companies; Laura Woodbury
   leads both). Confirm the rule: everyone Active under "Advantage One Escrow",
   or a curated subset?
5. AOE domain name and where its DNS lives.
6. The owner-approved copy lines for AOE ("Every promise, kept." is AME's; does
   AOE share it or get its own line?).
7. Old AOE site URL inventory for its redirect map.

## Roster notes from marketing (Yolanda, 2026-08-10)

- **Rose Moreno belongs on the AOE roster** (she is excluded from the AME
  site; when the clone syncs with COMPENDIUM_ORG="Advantage One Escrow" she
  should appear there).
- **Remove the Arcadia team picture** from AOE materials.
- **Remove Sharon Cowell** from the AOE roster (add to the clone's
  EXCLUDE_NAMES if she is Active in Compendium).
