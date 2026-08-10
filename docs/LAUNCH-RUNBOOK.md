# Launch Runbook · Alliance Mutual Escrow

Phase 5 playbook for cutting the production domain over to the new site on
Cloudflare Pages, verifying it, and rolling back if needed. Nothing here is
automated on purpose: launch is a checklist, not a script.

## 0. Preconditions (all must be true)

- [ ] Cloudflare Pages project connected to the GitHub repo, production branch `main`
- [ ] Owner review complete (Review Tour digest processed, fixes merged)
- [ ] Real "years combined experience" and Google rating confirmed; daggers removed
- [ ] `team-b` deleted after the owner confirms the photo wall
- [ ] Env set in Pages project: `COMPENDIUM_API_TOKEN` (roster sync)
- [ ] Optional but recommended before launch: `GOOGLE_PLACES_KEY`, `GOOGLE_PLACE_ID`, KV binding `REVIEWS` (reviews section), `EMAIL_PROVIDER` + key (calculator email)
- [ ] Old-site URL inventory collected; `public/_redirects` filled in
- [ ] `npm run test:build` green, `CROSS_ENGINE=1` pass green
- [ ] Lighthouse run on the staging URL: 90+ everywhere (95+ target on mobile)

## 1. DNS cutover (keep the domain, new hosting)

1. In the Cloudflare Pages project, add the custom domain (apex + `www`).
2. The domain's DNS lives on Cloudflare: add/adjust the `CNAME` records Pages
   asks for (apex uses CNAME flattening automatically).
3. Wait for the certificate to issue (usually minutes). Verify `https://` on
   both apex and `www`, and that `www` redirects to apex (or the reverse,
   pick one canonical and set it in Pages -> Custom domains).
4. TTL note: Cloudflare-proxied records update fast; no long propagation wait.

## 2. Post-cutover verification (same hour)

- [ ] Home, team, calculator, one guide, one legal page load over the domain
- [ ] `curl -I` the top 10 old URLs from the inventory: each 301s to the right page
- [ ] `/sitemap-index.xml`, `/robots.txt`, `/llms.txt` load
- [ ] A guide PDF downloads
- [ ] Calculator computes and "email me" returns its honest not-connected note
      (or sends, if a provider was configured)
- [ ] Roster matches Compendium (spot-check one officer's phone/email)
- [ ] The animation plays and holds on the finale; reduced-motion shows the final frame

## 3. Search engines

- [ ] Google Search Console: add the domain property, submit `sitemap-index.xml`
- [ ] Bing Webmaster Tools: same
- [ ] Keep the old property (if any) claimed so redirect coverage is visible

## 4. Monitoring

- [ ] Cloudflare Web Analytics: enable on the Pages project (privacy-friendly,
      cookie-free, no banner needed). Add the beacon only via the dashboard
      toggle; no code change required.
- [ ] Uptime: a free checker (e.g. UptimeRobot) on `/` and `/calculator`, 5 min
      interval, alert to bretth@sevengables.com
- [ ] Cloudflare notifications: enable "Pages deployment failed" alerts

## 5. Rollback

The old site remains wherever it is hosted until DNS moves; rollback is DNS.

1. Pages -> Custom domains: remove the domain from the new project (optional).
2. Restore the previous DNS records (screenshot them before the cutover; keep
   the screenshot in this repo's `docs/` or the project drive).
3. Because records are Cloudflare-proxied, rollback is near-instant.

For a bad deploy (site fine, code bad): Pages -> Deployments -> promote the
previous good deployment. No DNS involved.

## Open items blocking launch (owed by Brett / owner)

1. Real experience-years and rating figures (daggers come off).
2. Owner confirmation of team layout (then delete `team-b.astro`).
3. Google Places API key + Place ID; KV namespace for reviews.
4. Email provider choice for the calculator (Resend/Postmark/etc.).
5. Old-site URL inventory for the redirect map.
6. Cloudflare Pages: connect repo, set env vars, add custom domain.
