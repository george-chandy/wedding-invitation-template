# Redesign Results: "The Pressed Suite"

Written for: the owner reviewing the `feature/luxury-wedding-creative-redesign` branch before deciding whether to commit it.

Nothing was committed, pushed, merged or deployed. All work is uncommitted on the feature branch, and nothing is staged.

The work happened in two passes. **Pass 1** built the art direction (envelope, typography, materials, scenes, motion). **Pass 2** (this update) added photography, refreshed the screenshots and brought `design-system.md`, `animation-guide.md` and `template-customization.md` in line with the code.

## 1. Branch and starting point

- Starting branch `main`, HEAD `b1b543e4b90c085bffc6859ca89ad21968bf757e`, working tree clean.
- Branch created with `git switch -c feature/luxury-wedding-creative-redesign` from that commit.
- At the end of pass 2: the branch is `feature/luxury-wedding-creative-redesign`; `main` still resolves to `b1b543e…`; there are no commits on the feature branch and nothing staged; `git diff --check` is clean; only `docs/` and `invitation/` changed (the parent-project files `inspect-site.mjs`, `inspection-output/` and the root `package.json` are untouched); a scan for tokens and private keys found none; `dist/`, `dist-test/` and `test-results/` are git-ignored.

## 2. Creative direction

**The Pressed Suite**: the invitation as one object made of letterpress stationery (envelope → card → programme → reply card → closing flap). Chosen over "Contact Sheet" (depends on real photography; now partly moot, see §10) and "Midnight Orangery" (generic dark glow, costly on phones). Details: [creative-direction.md](creative-direction.md), problems answered: [creative-audit.md](creative-audit.md), the tokens and patterns as built: [design-system.md](design-system.md) and [animation-guide.md](animation-guide.md).

## 3. Major visual changes

| Scene | Before the redesign | Now |
|---|---|---|
| Opening | Flat two-gradient envelope with an X | Lit paper room with grain; stitched flap with a cast shadow that lifts away; shaded right panel; tissue-printed liner; a card with an arch window and pressed type that rises out |
| Hero | Centred stack in an empty arch outline | Names up to 13 rem, first light roman left, second light italic right, ampersand between, crossing an arched plate that now holds a **photograph** (with a theme-aware wash so the names stay legible); vertical date ≥ 1024 px; mobile: plate above, names overlapping its foot |
| Story | Two columns, three equal chapters | Editorial spread: vellum arch with a pressed sprig, display-scale pull-quote, chapter years as oversized italic numerals stepping down the page |
| Countdown | Four numerals in a row | Display-scale italic numerals on a ruled line with ticks, faint outlined monogram; 2 × 2 on phones |
| Schedule | Timeline with dots | Printed programme: ruled rows, large italic times, vertical rule |
| Venue | Small line drawing | Tall plate holding a **photograph of an architectural glasshouse**, the name crossing its edge, vellum info card overlapping its foot |
| Gallery | Even columns of small illustrations | Mount board of **six photographs** in rotating 4:5 / 5:4 / 1:1 / 3:4 crops, asymmetric placement and an overlap; single offset column on phones |
| RSVP | Boxed inputs in a card | Perforated reply card with printed-form underlined fields |
| Closing | Smaller copy of the countdown style | An envelope-flap "V" cut into the page with the seal on its point |

## 4. Pass 2: photographic integration

### What was added
- **Eight openly licensed photographs** (CC0 per Wikimedia Commons metadata, queried at build time by the script, which refuses any other licence): a couple's embrace for the hero, a domed glasshouse with its reflection for the venue, and six for the gallery (a dress under an arched ceiling, rings in open hands, flowers on a pew, a bouquet, black-and-white hands, a couple on a footbridge). Each is cropped to the frame the layout uses and encoded as WebP at two widths: 16 files, 852 kB in `public/photos/`. Provenance: `invitation/public/photos/CREDITS.md`.
- **Reproducible pipeline**: `invitation/scripts/prepare-photos.mjs` (needs `curl`, `sips`, `cwebp`).
- **Config** (the only place image paths live): `ImageAsset` gained optional `srcSet` and `focus`; `hero.image` and `venue.image` are new optional fields. All are validated (`focus` must be `"x% y%"`, `srcSet` must be `"path 560w, path 1120w"`, no `javascript:`/`data:`), covered by a new unit test.
- **One shared component**, `components/ui/Photo.tsx`: responsive `srcset`/`sizes`, art-directed crop via `focus`, space reserved from `width`/`height`, invisible until loaded and then a 0.8 s fade, and failure reported upward so each caller shows its drawn fallback.
- Hero and venue frames mount the photograph inside the existing arch and plate, with a 12 % warm cast on gallery and venue images to tie different grades to the paper.

### What I inspected (screenshots, not just assertions)
- **Hero**: the photograph and the type read as one layered object; "Theo" crosses the plate edge and stays legible over the veil in Ivory. In Midnight the first version was only moderately legible over bright veil, so the wash is now theme-aware (`--wash-low/high`; Midnight veils more strongly). Desktop, 768, 1920, 360 and 390 all hold. The plate is the right size for the type: the photograph supports the names rather than competing with them.
- **Venue**: the domed glasshouse and its reflection make the plate feel like a place, not a decoration; the heading crossing its edge and the info card overlapping its foot keep the event details and directions fully clear.
- **Gallery**: real rhythm and variety (portrait / landscape / square / monochrome). The paper mats and hairline finish make the photographs feel mounted. The weakest frame tonally is the saturated footbridge image; the warm cast helps but cannot fully unify photographs from different photographers.
- **Paper vs photography**: the grain and mats support the photographs without competing; the story plate stays a drawn pressed sprig on purpose (a different material, not a missing photo).
- **Mobile** keeps the same character: arch plate above names that overlap its foot, single offset gallery column, mounted venue plate.

### Edge cases (verified with scripts and now with tests)
| Case | Result |
|---|---|
| All photograph requests fail | Hero → drawn sun + sprigs, venue → line drawing, gallery → generated plates; zero broken-image icons, zero page errors |
| Slow images (5 s delay) | Frames keep their size (heights identical before/after); CLS 0.005; images fade in on load |
| No photographs configured | Drawn plates everywhere, no errors |
| Seven images, portrait/landscape mix, 360 px | 7 plates, no horizontal scroll; per-image `focus` applied |
| Hero eager / venue and gallery lazy | The hero is the only photograph downloaded before the envelope opens |

### Measured weight (Chromium, production build)
- Before the envelope opens: **1 photograph**, 27 kB (1× desktop) / 119 kB (3× phone).
- After scrolling the entire page: 8 photographs, **540 kB** (1440 px @1×) and **632 kB** (390 px @3×). The 560/640-wide candidates are chosen only where the frame is small enough; on a 3× phone the 1120-wide files are selected.
- App JS 20.0 kB gzip, CSS 9.5 kB gzip (was 18.4 / 7.1 before the redesign); `dist` is 1.9 MB including 1.0 MB of photographs.

## 5. Components

**Pass 1 (rewritten/modified):** `Hero`, `Story`, `Gallery`, `EnvelopeGate`, `EnvelopeArt`, `Countdown`, `Schedule`, `Venue`, `Footer`, `ArtPlate`, `Reveal`, the stylesheets.
**Pass 2:** `Hero`, `Venue`, `Gallery` (now use `Photo`), `config/types.ts`, `config/validate.ts`, `config/wedding.ts`, `sections.css` (photography layer), `themes.css` (wash tokens), `tokens.css` (removed four tokens made dead by the redesign).
**Added:** `animations/Unveil.tsx`, `ui/nameScale.ts`, `ui/Photo.tsx`, `scripts/capture-screens.mjs`, `scripts/prepare-photos.mjs`.
**Untouched:** calendar/ICS, countdown logic, RSVP logic, theme names, `useStaticMotion`, capture mode, error boundaries.

## 6. Dependencies and fonts

No dependency was added, removed or changed in either pass (`package.json` and `package-lock.json` unmodified). The only font addition (pass 1) is Cormorant Garamond 300 italic, Latin + Latin-Extended, ~42 kB. Motion remains the only animation engine; GSAP and Lenis were not needed. The photographs are WebP only (every current browser supports it; a browser that doesn't would hit the image-error path and show the drawn fallback).

## 7. Screenshots

- `docs/screenshots/before/` (15): the baselines committed on `main`.
- `docs/screenshots/pass1-illustrated/` (31): the redesign before photography, kept for comparison.
- `docs/screenshots/after/` (31): the current state. Gate and hero at 360, 390, 768, 1024, 1440, 1920; full page at 360, 390, 1440; Midnight hero and full page at 390 and 1440; opening frames `open-0-hover` … `open-5-hero` at 1440 and 390.
- Regenerate with `invitation/scripts/capture-screens.mjs` (usage in its header). It waits for `data-capture-ready`; the opening frames are timed samples of a live animation.
- Playwright visual baselines in `invitation/__screenshots__/{chromium,firefox,webkit}/` were regenerated deliberately after reviewing the renders.
- **Repository weight:** the three screenshot folders total about 61 MB (`pass1-illustrated` is 26 MB). Delete `pass1-illustrated` and, if you don't want them in git, `after` before committing.

## 8. Verification (final run, from clean `dist`, `dist-test`, `test-results`)

| Command | Result |
|---|---|
| `npm run lint` | clean |
| `npm run typecheck` | clean |
| `npm run build` | passes |
| `npm run test:unit` | **65 passed** (was 64; +1 for photograph option validation) |
| `PW_BROWSERS=chromium,firefox,webkit npx playwright test` (no snapshot updating) | **281 passed, 4 skipped, 0 failed** (pass 1: 263 + 4; +18 passes = 6 new photography tests × 3 browsers). The skips are the same four as the baseline: clipboard permission in Firefox/WebKit, Tab-to-links in WebKit, 3xx redirect in WebKit |
| Original baseline before any change (Chromium only) | unit 64 passed, e2e 89 passed |

### What the tests caught or required in pass 2
1. **Failure-recovery test (all three browsers)**: "if WAAPI is unavailable all content renders immediately" reported seven `.photo` elements at `opacity: 0`. I checked before touching it. With WAAPI forced to throw, the hero photograph is loaded and visible, and every other photograph is just a lazy image whose bytes haven't been requested yet (its frame shows the tonal ground); each loads and shows at `opacity: 1` once scrolled to. The fade is plain CSS keyed to the browser's load event, so it does not depend on WAAPI. I therefore **refined** the test instead of removing it: not-yet-loaded photographs are excluded from "hidden", and the test now also asserts that the hero photograph is visible and that a gallery photograph becomes loaded and visible after scrolling, with WAAPI broken. The original intent (no content stuck invisible by the animation engine) is preserved and extended.
2. **Gallery tests** targeted the removed SVG samples: the load test now reads the image count and checks `srcset`/`sizes`; the failure test targets a photograph (`gallery-rings-*`) and scrolls that plate into view. Same assertions, new sample content.
3. **Slow-image test measuring bug (mine)**: `getBoundingClientRect` includes the reveal's transient scale; layout stability is now measured with `offsetHeight`.

(Pass 1 problems the suite caught, all fixed: gallery images that never loaded because the observed element was clipped; countdown monogram overflow; hero taller than a 1280 × 720 window; the italic Latin-Extended font check; two WebKit nav tests that needed a deterministic scroll. The patterns they led to are written up in [animation-guide.md](animation-guide.md).)

### Motion and responsiveness: what was actually inspected
- The envelope opening was inspected as timed frames at 1440 and 390 px (closed, hover, flap lifting with its shadow fading, card rising, dissolve into the photographic hero). The reveal into the hero landed correctly with the photograph in place.
- Image reveals were checked on the live page (frames and DOM state); the unveil's observer fix is covered by tests.
- Viewports captured and reviewed: 360, 390, 768, 1024, 1440, 1920 (gate and hero), full pages at 360, 390, 1440, both themes at 390 and 1440. Overflow, clipping, touch-target and layout-shift assertions run at all six widths in the suite.
- Reduced motion, Skip, Escape and animation-failure recovery are exercised by the existing suite (all passing in three engines) plus the refined WAAPI test above.
- **Not done:** I did not watch the live animation at full speed by eye, and no real phone or tablet was used. Physical-device behaviour is unverified.

## 9. Changes to existing tests (all deliberate)
| Test | Change | Why |
|---|---|---|
| `quality.spec.ts` WAAPI unavailable | Excludes not-yet-loaded photographs from "hidden"; adds assertions that loaded ones are visible | See §8.1 |
| `resilience.spec.ts` long-name font check | Also checks the italic face | Second name is italic by design (pass 1) |
| `invitation.spec.ts` / `resilience.spec.ts` nav tests | Centre the target section explicitly | Sections are taller than the viewport; engines differ (pass 1) |
| `invitation.spec.ts` gallery tests | New sample content, `srcset`/`sizes` assertions | Photographs replaced the SVG samples |

No assertion was deleted.

## 10. Remaining limitations

- **The photographs are stand-ins, not the couple.** They are stock-style images of unrelated people (and a public building). The sample copy says "a Georgian glasshouse at the end of a lime-tree avenue"; the placeholder venue photograph is a domed Victorian-style glasshouse with a different character. `alt` text describes what the pictures show and never names Elena or Theo. **Replace them before using the template for a real wedding** (see `template-customization.md`, "Supplying your own photographs").
- **Licensing scope.** The script verified the CC0 / public-domain dedication reported by Wikimedia Commons for each file at run time. A CC0 dedication covers copyright; I did not independently verify releases from the people shown. That matters little for development placeholders and a great deal if you ever publish them; the safe path is your own photographs.
- **Tonal consistency.** Eight photographs from different photographers don't share a grade (a dark church interior, a saturated footbridge, a black-and-white detail). The 12 % warm cast softens this; photographs from one shoot would unify it fully.
- **Hero crop.** The embrace is cropped at the groom's brow, and at tablet width the arch is narrow enough to cut further into the image. A portrait composed for the arch would be better.
- **Image formats.** WebP only, two widths per photograph, no AVIF or JPEG fallback. I did not verify which `srcset` candidate each real device selects beyond the two cases measured above.
- **Reference not re-inspected live** (pass 1 limitation): the reference's photographed, filmed opening is a different medium from this vector/CSS envelope.
- **Not re-measured:** Lighthouse and real-device performance after adding photographs (page-weight and layout shift were measured as above). No screen-reader pass.
- **Decorative elements are `aria-hidden`/CSS-generated** (folio numerals, vertical date, countdown monogram, story plate); the hero photograph is exposed with its `alt` text.
- Cyrillic / Greek / Vietnamese fall back to system fonts. Screenshot baselines are macOS-rendered; regenerate on another OS.

## 11. Remaining manual checks (before a real wedding)

1. Swap in your own photographs (hero, venue, six gallery) and re-run `npm run test:unit` and the e2e suite; regenerate the visual baselines (`--update-snapshots`) after reviewing them.
2. Look at the hero with your portrait at 360, 768 and 1440 px: confirm the faces sit inside the arch and the names remain legible (try both themes if you use Midnight).
3. Open the page on at least one real iPhone and one mid-range Android phone, including from a WhatsApp/Instagram in-app browser: envelope sequence, photograph fade-ins, scrolling, RSVP keyboard, safe-area insets.
4. Test on a throttled/slow connection that the hero photograph is ready when the envelope opens, and that nothing jumps while the gallery loads.
5. Run a screen reader through the envelope, hero (including the photograph's alt text), countdown and RSVP; test with OS "Reduce motion" on and 200 % zoom.
6. Confirm you have the right to publish every photograph and permission from anyone identifiable; delete `public/photos/CREDITS.md` entries for files you remove.
7. Proofread every fact (names, date, time, timezone, venue, travel) and test the calendar links and RSVP end to end (unchanged from the production-readiness report, §5).

## 12. Files

**Created:** `docs/creative-audit.md`, `docs/creative-direction.md`, `docs/redesign-results.md`, `docs/screenshots/{before,pass1-illustrated,after}/`, `invitation/scripts/{capture-screens,prepare-photos}.mjs`, `invitation/public/photos/` (16 WebP + `CREDITS.md`), `invitation/e2e/photography.spec.ts`, `invitation/src/components/animations/Unveil.tsx`, `invitation/src/components/ui/{Photo.tsx,nameScale.ts}`.
**Modified:** `docs/{design-system,animation-guide,template-customization}.md`, `invitation/README.md`, `invitation/e2e/{invitation,quality,resilience}.spec.ts`, `invitation/tests/lib.spec.ts`, `invitation/src/components/{animations/Reveal,art/ArtPlate,envelope/EnvelopeArt,envelope/EnvelopeGate,sections/Countdown,sections/Footer,sections/Gallery,sections/Hero,sections/Schedule,sections/Story,sections/Venue}.tsx`, `invitation/src/config/{types,validate,wedding}.ts`, `invitation/src/styles/{fonts,gate,nav,sections,themes,tokens,type,ui}.css`, regenerated visual baselines in `invitation/__screenshots__/`.
**Removed:** `invitation/public/gallery/{bouquet,garden,orangery,table}.svg` (replaced by photographs; the generated botanical plate remains the no-photo fallback).

## 13. Run it

```bash
cd invitation
npm install                 # nothing new to install
npm run dev                 # development (the envelope appears first; add ?capture to bypass it)
npm run build && npm run preview

# checks
npm run lint && npm run typecheck && npm run test:unit
PW_BROWSERS=chromium,firefox,webkit npx playwright test

# screenshots
npm run build && npm run build:test
npx vite preview --port 4173 &  npx vite preview --outDir dist-test --port 4174 &
node scripts/capture-screens.mjs ../docs/screenshots/after

# rebuild the sample photographs (needs curl, sips, cwebp; placeholders only)
node scripts/prepare-photos.mjs
```
