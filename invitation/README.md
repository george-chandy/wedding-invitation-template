# Wedding Invitation Template

A reusable, single-page wedding invitation: envelope-opening gate, editorial hero, story, countdown with calendar links, schedule, venue, details, gallery and RSVP — all driven by one config file. React 19 · Vite 8 · TypeScript · Motion · plain CSS design tokens.

The sample couple (Elena & Theo Marlowe, 12 June 2027, The Orangery at Willowmere) is fictional.

## Commands
```bash
npm install
npm run dev          # dev server, http://localhost:5173
npm run build        # typecheck (tsc -b) + production build → dist/
npm run preview      # serve dist/ at http://localhost:4173
npm run lint         # oxlint
npm run typecheck    # tsc -b
npm run test:unit    # time / calendar / ICS / config validation (no browser)
npm run build:test   # test-mode build (dist-test/) that accepts an injected config; used only by the e2e suite
npm run test:e2e     # Playwright: production build on :4173 + test-mode build on :4174 (both built and served automatically)
npm test             # both
PW_BROWSERS=chromium,firefox,webkit npm run test:e2e   # cross-browser (npx playwright install firefox webkit once)
npx playwright test --update-snapshots                  # refresh screenshot baselines after intentional visual changes
```

## Screenshots of the whole page
Sections reveal on scroll, so use capture mode: open `/?capture&now=2027-01-01T00:00:00Z`, wait for `html[data-capture-ready="true"]`, then take a full-page screenshot. Details in [docs/animation-guide.md](../docs/animation-guide.md#deterministic-screenshots--capturing-the-complete-page).

## Make it yours
Edit `src/config/wedding.ts` and put assets in `public/`. See **[docs/template-customization.md](../docs/template-customization.md)**.

## Docs
- [docs/implementation-plan.md](../docs/implementation-plan.md) — audit, decisions, results
- [docs/design-system.md](../docs/design-system.md) — tokens, themes, type, colour/contrast
- [docs/animation-guide.md](../docs/animation-guide.md) — animation system, envelope timeline, reduced motion
- [docs/template-customization.md](../docs/template-customization.md) — config, assets, deploy
- [docs/production-readiness-report.md](../docs/production-readiness-report.md) — final audit, test results, wedding-day checklist

## Layout
```
src/
  app/          App shell, theme application, gate error boundary
  config/       types, wedding.ts (data), validate, resolve (derived values)
  content/      default UI strings
  components/   animations/ art/ envelope/ nav/ sections/ ui/
  hooks/        useNow, useCopy, useScrollLock, observers
  lib/          time (timezone), calendar (Google URL + ICS), rsvp, assets
  styles/       tokens, themes, fonts, base, type, ui, gate, nav, sections, motion
public/         favicon, og.png, gallery/, robots.txt
tests/          unit specs (Playwright runner, Node only)
e2e/            browser specs
__screenshots__/ screenshot baselines (per browser)
```
