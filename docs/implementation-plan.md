# Implementation Plan — Premium Wedding Invitation Template

Scope: everything under `invitation/` plus `docs/`. Nothing in the parent project (`inspect-site.mjs`, `inspection-output/`, root `package.json`) is modified. No commits, pushes or deploys.

Legend: **[M]** measured in this repo, **[E]** estimated / reasoned, not measured.

## 1. Current-state assessment (Phase 1 audit)

### Stack
React 19.3, Vite 8, TypeScript 6, oxlint, plain CSS with custom properties. No animation library, no test runner. Fonts via `@fontsource` (Playfair Display variable, Cormorant Garamond ×3, Marcellus, Montserrat ×2, Great Vibes) → **five families** loaded.

### Structure
```
src/main.tsx            font imports (all subsets) + styles
src/App.tsx             opened-state, mounts sections only after the gate opens
src/content.ts          one hardcoded "invitation" object (names, copy, venue)
src/components/         Gate, Couple, Countdown, Schedule, Venue, Footer, Art, Icons, …
src/lib/                calendar.ts, useCountdown.ts, useReveal.ts
src/styles/             tokens.css, global.css, components.css (298 lines)
```

### Baseline measurements **[M]** (production build, preview server, Chromium 390×844)
| Metric | Value |
|---|---|
| `npm run build` | succeeds, 195 ms |
| JS | 242.9 kB (75.5 kB gzip) |
| CSS | 43.7 kB (14.5 kB gzip) |
| `dist/assets` files | 73 (40 `.woff2` + legacy `.woff` + all subsets: cyrillic, vietnamese, latin-ext…) |
| `dist` total | 1.8 MB |
| Requests at first paint | 7; 9 woff2 fonts fetched in total |
| Console output on load + open | none (no errors, no warnings) |
| Horizontal overflow at 390 px | 0 |
| `npm run lint` | 1 warning: `react(set-state-in-effect)` at `useReveal.ts:10` |
| Tests | none |

### The "React warning in `useReveal.ts`"
Investigated. It is **not** a runtime React warning — the browser console is empty. It is oxlint's `react(set-state-in-effect)` rule: when `IntersectionObserver` is undefined the effect calls `setShown(true)` synchronously, which forces a second render. Fix: derive the no-observer fallback in the `useState` initialiser (no effect-time setState). The hook is subsequently replaced by Motion's `whileInView`, which owns observer lifecycle, so the warning disappears with the file. Verified by re-running lint (see §10).

### Existing functionality to preserve
- Envelope gate (tap to open, page scroll-locked until opened)
- Countdown to `startsAt` (ISO with offset)
- Google Calendar template URL, `.ics` download
- Copy-address with success/failure feedback + `aria-live`
- Google/Apple Maps links
- Scroll reveals, back-to-top, `prefers-reduced-motion` support
- Fictional content: Elena & Theo Marlowe, 12 June 2027, The Orangery at Willowmere

### Defects and risks found in the audit
| # | Finding | Severity |
|---|---|---|
| 1 | `calendar.ts` ICS: only `,` and `;` escaped (backslash and newlines are not), no line folding, `DTSTAMP` built from a string-munged ISO, UID is a fixed-looking string | medium |
| 2 | Event time is a hand-written `+01:00` offset. Correct for June in London but there is no timezone field, so changing the date to winter would silently be wrong | medium |
| 3 | Gate is the **only** path to content: sections are not even mounted until opened, so `Tab`/screen readers/crawlers see an empty page; no skip path | high (a11y) |
| 4 | Envelope `<button>` has `disabled` while opening → focus is dropped to `<body>`; focus is never moved after open | medium |
| 5 | Body scroll lock is a class toggled in an effect; content flashes in/out of layout on open | low |
| 6 | Continuous animations: 9 floating petals (`infinite`), bobbing chevron; `feTurbulence + feDiffuseLighting` SVG filter used as a full-section background on 3 sections with `mix-blend-mode: multiply` (expensive raster/blend) | medium (perf) |
| 7 | Countdown re-renders whole section each second; `setInterval` drifts; timer not paused when tab hidden; `role="timer"` with live updates | low |
| 8 | Five font families, all subsets and legacy `.woff` emitted (1.8 MB dist) | medium |
| 9 | Gold text uses `background-clip: text` gradients on every heading (low-contrast risk, forced-colors failure) | low |
| 10 | All content hardcoded in one object coupled to presentation (`partnerB: 'Theo Marlowe'` holds a surname while `partnerA` does not) | medium |
| 11 | `react/only-export-components` and exhaustive-deps comment suppressions in `useCountdown` | low |
| 12 | No `<noscript>`, no OG/Twitter metadata, `theme-color` hardcoded | low |
| 13 | Copy-address silently fails with "Copy not available" on insecure origins instead of offering a fallback | low |

## 2. Design deficiencies
- Reads as "template card stack": every section is a centred rounded card on a flat colour with identical rhythm; no editorial hierarchy, no asymmetry, no negative space.
- Gold gradient text + gold gradient buttons + gold gradient frames everywhere → ornamental noise; "premium" should be restraint.
- Five typefaces compete (Playfair + Cormorant + Marcellus + Montserrat + Great Vibes).
- Textures are procedural SVG noise at 35% multiply — looks like dirty paper, not stationery.
- Hero (the names) appears only inside the gate column, 620 px wide on all screens; desktop is a phone-width strip in an empty page.
- No navigation, no way to re-find sections; no RSVP, story, details or gallery slots for a reusable template.
- Envelope: flat gradient shapes; letter pops from behind with a 1.1 s linear-ish transform; no pressed state; hover just tilts the flap 8°.

## 3. Animation deficiencies
- Reveals are CSS transitions with a fixed 22 px/0.8 s curve for everything, `transition-delay` set inline via React.
- Envelope timing is a `setTimeout(2200)` coupled to CSS transition durations (two sources of truth that can drift).
- No exit choreography; hero face simply mounts with a CSS keyframe.
- Infinite petals/bobbing violate the "no continuous ambient CPU use" principle.
- Reduced-motion handled by `0.001ms !important` blanket override — works, but hides state changes and leaves the gate's 0 ms timer path as the only logic.

## 4. Dependency changes

| Package | Change | Why |
|---|---|---|
| `motion` 14.6.0 | **add** | Scroll-triggered reveals (`whileInView`), stagger/variants, `AnimatePresence` for the mobile menu, and `animate()` sequences for the envelope. One library covers every animation responsibility; React-first; respects `useReducedMotion` / `MotionConfig reducedMotion="user"`. |
| `@playwright/test` 1.64.1 (dev) | **add** | Interaction, a11y-structure, responsive and screenshot tests. Matches the `playwright` 1.64.1 and Chromium build already installed on the machine. Also runs the pure-function unit tests (calendar/ICS/timezone/config validation) so no second test runner is needed. |
| `@fontsource-variable/playfair-display` | **remove** | Replaced by Cormorant Garamond display. |
| `@fontsource/marcellus` | **remove** | Replaced by Montserrat labels. |
| `@fontsource/cormorant-garamond`, `great-vibes`, `montserrat` | keep, import only `latin-*` CSS and 7 weights/styles | Self-hosted WOFF2 (OFL). Skips cyrillic/vietnamese/latin-ext subsets and `.woff` fallbacks. |
| **GSAP** | **not added** | The envelope is a 5-step timeline with ~8 tracks; Motion's `animate([...])` sequence API (`at`, relative offsets, per-track easing) expresses it fully. Adding GSAP would duplicate responsibilities and ~25–30 kB. |
| **Lenis** | **not added** | Smooth scrolling here is anchors + back-to-top only. Native `scroll-behavior: smooth` (gated by `prefers-reduced-motion: no-preference`) + `scroll-padding-top` + browser history is lighter, keeps native keyboard/focus/anchor behaviour and avoids a JS scroll hijack. |
| `zod` etc. | **not added** | Config validation is ~100 lines of hand-written checks with readable error paths — no schema library needed for one config object. |

## 5. Proposed design system (summary — full spec in `docs/design-system.md`)
- **Concept:** "Paper & ink". Warm ivory paper, deep ink-green text, one champagne accent used for hairlines, numerals and focus; a dark inverse band for the countdown. Thin rules, generous negative space, asymmetric editorial layouts, small-caps labels with wide tracking.
- **Typography (3 families):** Cormorant Garamond (display, body, italics), Montserrat (labels/UI/nav/buttons), Great Vibes (single script accent: the greeting line and the hero ampersand).
- **Tokens:** primitives → semantic tokens (`--color-bg`, `--color-surface-paper`, `--color-ink`, `--color-ink-muted`, `--color-accent`, `--color-line`, `--color-inverse-*`, `--color-focus`, state tokens), fluid type scale, 4/8 spacing scale, width constraints, radius, shadow, durations, easings, z-index layers.
- **Themes:** `ivory` (default) and `midnight` as `[data-theme]` blocks overriding semantic tokens only; per-couple overrides from config.
- **Art:** original inline SVG (botanical sprig with `pathLength` draw-in, orangery arch, wax seal, 4 gallery plates). Paper feel from a flat tint + a tiny repeating 2-colour dot pattern (no SVG filters).

## 6. Component architecture
```
src/
  app/            App.tsx, SectionRenderer, providers (MotionConfig, theme)
  config/         types.ts, wedding.ts (the only file a couple edits), validate.ts, resolve.ts
  lib/            time.ts (tz → instant), calendar.ts, format.ts, assets.ts, useCountdown.ts, useCopy.ts
  hooks/          useSectionNav, useScrollLock
  components/
    animations/   Reveal, Stagger, DrawPath, motion presets (tokens.ts)
    envelope/     EnvelopeGate, Envelope (art), Seal
    sections/     Hero, Story, Countdown, Schedule, Venue, Details, Gallery, Rsvp, Footer
    nav/          SiteNav
    ui/           Button, Ornament, SectionHeading, Icon
    art/          Botanical, OrangeryArch, GalleryPlate
  styles/         tokens.css, themes.css, base.css, type.css, ui.css, sections.css, index.css
  tests/ (e2e/)   playwright specs
```
Sections are described by `config.sections` (enabled flags + order) and rendered by a registry; a section with no data renders nothing and drops out of the nav.

## 7. Key design decisions
1. **Content is never gated.** The invitation is rendered in the DOM from first paint, beneath a fixed envelope overlay. While the overlay is closed the main region is `inert` (so keyboard/AT go to the dialog). The overlay offers a visible "Skip to invitation" control, closes on `Escape`, and a render-error boundary around the gate falls back to the ungated page. With reduced motion the envelope still requires one press (the interaction is the point) but the sequence collapses to a short fade.
2. **One animation owner per property.** CSS owns hover/active transforms on dedicated wrappers; Motion owns the opening sequence on separate child elements; the overlay's own entrance is CSS-only on a different element than the one Motion exits.
3. **Timezone-correct time.** Config stores local wall-clock date/time + IANA timezone; `lib/time.ts` converts to a UTC instant with `Intl` (no library), used for countdown, Google Calendar (`dates` in UTC + `ctz`) and ICS (`DTSTART` in UTC).
4. **Honest RSVP.** Modes: `link` (external form), `email` (opens the guest's mail app with a prefilled message — copy says so), `endpoint` (POST to a configured provider; success message shown only on a 2xx). No mode implies storage that does not exist.
5. **Head metadata from config at build time.** A small Vite plugin in `vite.config.ts` imports `src/config/wedding.ts` (pure data, no asset imports) and injects title/OG/Twitter/theme-color tags so link previews work without JS.
6. **Assets** referenced by relative path in config and served from `public/`, resolved with `BASE_URL`; `<img>` always has width/height, `loading="lazy"` below the fold, and an `onError` fallback to a generated SVG plate.

## 8. Testing plan
Playwright (`@playwright/test`), Chromium locally; Firefox/WebKit projects defined and run only if the browsers are installable in this environment (reported as unverified otherwise).

- **Unit-style (Node):** `zonedToInstant` incl. DST transitions, ICS output (UTC times, escaping, folding ≤75 octets, CRLF, required properties, GEO), Google Calendar URL parameters, countdown breakdown, config validation errors.
- **E2E:** initial load (no console errors / failed requests); envelope open via mouse, keyboard (`Enter`/`Space`), touch (tap); focus moves to the invitation; skip link; `Escape`; content `inert` while closed; scroll sections + nav anchors + history; back-to-top; countdown render + past-date states (via `page.clock`); ICS download content; copy-address (granted + denied clipboard); calendar link href; `prefers-reduced-motion`; no horizontal overflow at the six required viewports; animation-failure fallback (gate error boundary); screenshots for the six viewports.
- **Manual:** frame-by-frame screenshots of the envelope sequence at 390×844 and 1440×1000.
- **Perf:** `lighthouse` CLI against `vite preview` if installable; results reported separately from estimates.

## 9. Implementation phases
| Phase | Work | Exit check |
|---|---|---|
| 1 | Audit | this document |
| 2 | Plan | this document |
| 3 | Tokens, themes, typography, base CSS | `npm run build`, visual smoke |
| 4 | Dependencies (done above), font strategy | build, dist size |
| 5 | Config model + validation + lib (time, calendar) + unit tests; section components | unit tests pass, build |
| 6 | Animation system, envelope, hero, reveals, nav | manual frame capture, no console errors |
| 7 | Typography/imagery/composition pass | screenshots reviewed |
| 8 | Mobile/tablet/desktop pass | six-viewport screenshots + overflow test |
| 9 | E2E, a11y, perf | test suite green, Lighthouse numbers |
| 10 | Final build, docs (`design-system`, `animation-guide`, `template-customization`), README | `build` + `lint` + `test` clean |

## 10. Risks and migration considerations
- **Motion 14 API surface** — confirmed from installed typings before use; if `whileInView` is missing from `domAnimation` the full `motion` component is used instead (size impact will be measured).
- **Vite config importing app config** — config must stay free of `import.meta.*` and asset imports; documented and enforced by keeping assets as strings.
- **Config shape change** is breaking for anyone who edited `content.ts`; `content.ts` is removed, and the doc maps old fields to new ones.
- **Inert + focus** — `inert` is supported in all current evergreen browsers; fallback is `aria-hidden` + `tabindex=-1` handled by the same hook.
- **Fonts** — fewer weights means italic/bold are not synthesised: the design only uses loaded styles. A CSS guard (`font-synthesis: none`) makes accidental use obvious.
- **Print/screenshots** — scroll-triggered reveals don't fire for off-screen content in full-page captures; tests scroll first. Documented in the animation guide.
- **Firefox/WebKit** may not be installed; reported honestly if not run.

---

# Results (end of implementation)

> Superseded in part by the final audit in [production-readiness-report.md](production-readiness-report.md) (new test counts, fixes, and the Latin-Extended font support that removes the glyph limitation below).

All numbers below were measured in this repo on the final build unless marked **[E]**.

## Verification summary
| Check | Result |
|---|---|
| `npm run build` (tsc -b + vite build) | passes |
| `npm run lint` (oxlint) | **0 warnings, 0 errors** (baseline: 1 warning) |
| `npm run test:unit` | 27 passed |
| `npm run test:e2e` with Chromium + Firefox + WebKit | 103 passed, 2 skipped (clipboard-permission test is Chromium-only), 0 failed |
| Console errors/warnings and failed/4xx requests on load and on opening the envelope | none (asserted in tests, all three engines) |
| Horizontal overflow at 360×800, 390×844, 768×1024, 1024×768, 1440×1000, 1920×1080 | none (asserted); touch targets ≥ 40 px asserted; gate + hero screenshot baselines per browser |
| Lighthouse 12, mobile (simulated slow-4G, 4× CPU), 3 runs on `vite preview` | Performance 91–92 · Accessibility 100 · Best practices 100 · SEO 100 · FCP 2.2 s · LCP 2.7 s · TBT 150–190 ms · CLS 0 |
| Lighthouse 12, desktop (1 run, before the last label/robots fixes) | Performance 100 · A11y 100 · BP 100 · SEO 91 (robots.txt then added) |
| Unthrottled paint in Chromium | first-contentful-paint ≈ 250 ms |
| Contrast (computed, WCAG) | all text pairs ≥ 4.5:1 in both themes; champagne `--color-accent` (3.1:1) is decorative/large-numeral only |

An earlier Lighthouse run reported a 4.6 s "observed" first paint and Speed Index 7.5 s; direct measurement showed 252 ms and the three reruns above gave SI 2.2 s, so that run is treated as noise (machine busy during the first `npx` download), not as a result.

## Before → after
| | Before | After |
|---|---|---|
| JS (gzip) | 75.5 kB (one file) | 117.7 kB: React 65.7 + Motion 35.3 + app 16.4 + runtime 0.4 |
| CSS (gzip) | 14.5 kB | 6.8 kB |
| Font families / faces | 5 / 9 woff2 fetched, 40 woff2 + legacy woff in `dist` | 3 / 6 woff2, nothing else |
| `dist` | 1.8 MB, 73 files | 624 KB, 11 files |
| Continuous animations | petals ×9, bobbing chevron | none |
| Heavy paint effects | SVG feTurbulence + diffuse lighting + multiply on 3 sections | none |
| Tests | none | 27 unit + 105 e2e test cases (35 × 3 browsers; 2 skipped) |

The JS increase (+42 kB gzip) is the cost of Motion; it replaces hand-rolled reveal/countdown/gate code and adds hero choreography, nav transitions and line drawing. Estimate **[E]**: the envelope's switch to Motion's mini WAAPI animator saved ≈3 kB and moves its transforms to the compositor thread; this was not profiled.

## Deviations from the plan
- **Preloaded fonts**: implemented, then removed — WebKit reported the preloads as unused and Lighthouse FCP didn't depend on them.
- **GSAP/Lenis/zod**: not added (see §4).
- **Screenshot baselines** are generated on macOS and compared with a 2 % pixel tolerance; they are regression aids for this machine's rendering, not cross-OS goldens.
- The sample venue has no `coordinates` (a fictional place must not point at a real location); the `.ics` `GEO` field and coordinate-based map links are covered by unit tests with a synthetic event.

## Dependency changes
| Added | `motion@14.6.0` (runtime), `@playwright/test@1.64.1` (dev) |
|---|---|
| Removed | `@fontsource-variable/playfair-display`, `@fontsource/marcellus` |
| Kept (narrower imports) | `@fontsource/cormorant-garamond`, `@fontsource/montserrat`, `@fontsource/great-vibes` |
| Renamed | package `invitation` → `wedding-invitation-template` |
`package-lock.json` updated by npm. npm prints an "install-scripts" notice for `fsevents`; nothing was approved or changed.

## Files
**Created** (all under `invitation/` unless noted): `src/app/{App,GateBoundary}.tsx`, `src/app/theme.ts`; `src/config/{types,wedding,validate,resolve,index}.ts`; `src/content/strings.ts`; `src/hooks/{useNow,useCopy,useScrollLock,useInViewState}.ts`; `src/lib/{time,rsvp,assets}.ts`; `src/components/animations/{Reveal,DrawPath}.tsx` + `tokens.ts`; `src/components/art/{Seal,Botanical,OrangeryArch,ArtPlate}.tsx`; `src/components/envelope/{EnvelopeGate,EnvelopeArt}.tsx`; `src/components/nav/SiteNav.tsx`; `src/components/sections/{Hero,Story,Countdown,Schedule,Venue,Details,Gallery,Rsvp,Footer}.tsx`; `src/components/ui/{Icon,Ornament,Heading}.tsx`; `src/styles/{themes,fonts,base,type,ui,gate,nav,sections,motion,index}.css`; `public/{og.png,robots.txt}`, `public/gallery/{orangery,table,garden,bouquet}.svg`; `tests/lib.spec.ts`; `e2e/invitation.spec.ts` + `__screenshots__/` (per-browser baselines); `playwright.config.ts`, `playwright.unit.config.ts`, `tsconfig.test.json`; `docs/{implementation-plan(this),design-system,animation-guide,template-customization}.md`.

**Modified:** `package.json`, `package-lock.json`, `index.html` (meta now injected), `vite.config.ts` (base `./`, meta plugin, vendor chunks), `tsconfig.json`, `tsconfig.node.json`, `src/main.tsx`, `src/lib/calendar.ts` (rewritten), `public/favicon.svg`, `.gitignore`, `README.md`.

**Removed:** `src/App.tsx`, `src/content.ts`, `src/components/{Gate,Couple,Countdown,Schedule,Venue,Footer,Reveal,SectionHeader,Ornament,Art,Icons}.tsx`, `src/lib/{useReveal,useCountdown}.ts`, `src/styles/{tokens,global,components}.css` (tokens.css was rewritten). The original `src` was not under version control; a copy was kept only in the session scratchpad.

Not touched: `inspect-site.mjs`, `inspection-output/`, the root `package.json`/`node_modules`, `docs/design-analysis.md`.

## Known limitations and unverified behaviour
- **Not done:** music (listed as optional in the brief); RSVP `endpoint` mode has never been run against a real provider; `mailto:` opening a mail client can't be observed in automated tests (the URL builder is unit-tested).
- **Not measured:** real-device performance (Lighthouse's 4× CPU throttle is an approximation); battery/GPU use; INP. The envelope was inspected frame-by-frame at 390×844 and 1440×1000 in Chromium only — Firefox/WebKit are covered by behavioural tests and size/overflow screenshots, not by a visual review of the animation.
- No cyrillic/vietnamese/latin-ext glyphs: names with those characters will fall back to system fonts until the matching `@fontsource` subsets are added to `fonts.css`.
- Fonts have no metric-matched fallback face, so a brief `swap` reflow is possible on cold loads (CLS measured 0 in Lighthouse, but on a warm local server).
- Images: no `srcset`/responsive variants are generated; provide appropriately sized files.
- Below-fold content is revealed on scroll; tools that capture the page without scrolling will show gaps (documented in the animation guide).
- `inert` and `:has`-free CSS only; `container` units (`cqw`) in the envelope need browsers from ~2023 (Chrome 105+, Safari 16+, Firefox 110+).
- If the visitor's OS "reduce motion" is on, the envelope is still one press by design.
- A winter or non-UK date works (timezone-driven) but only the London summer date and several other zones are covered by tests.
