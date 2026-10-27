# Production-Readiness Report

Final audit of the wedding invitation template (`invitation/`). Nothing was committed, pushed or deployed. No GSAP, Lenis, WebGL, music or unrelated dependency was added; no dependency changed at all in this pass.

Every number below was produced in this repository during this audit unless marked **[E]** (estimate) or **[not measured]**. Earlier results were not trusted: lint, typecheck, build, unit and e2e were re-run from a clean state (`rm -rf dist dist-test test-results`).

## 1. Summary

| Check | Result |
|---|---|
| `npm run lint` | clean |
| `npm run typecheck` | clean |
| `npm run build` | passes |
| `npm run test:unit` | **64 passed** (was 27) |
| `npm run test:e2e`, Chromium + Firefox + WebKit | **263 passed, 4 skipped, 0 failed** (267 tests; was 105) |
| Skipped (by design, with reasons in the test code) | clipboard-permission test (Firefox, WebKit); Tab-onto-links test (WebKit: Safari doesn't Tab to links by default); 3xx-redirect RSVP test (WebKit's route API can't fulfil a 3xx) |
| Lighthouse 12, mobile (simulated slow 4G, 4× CPU), 3 runs | performance **90 / 92 / 92**, accessibility 100, best practices 100, SEO 100; FCP 2.6–2.7 s, LCP 2.7–2.8 s, TBT 30–150 ms, CLS 0.003 |
| Lighthouse 12, desktop, 1 run | 100 / 100 / 100 / 100; FCP 0.5 s, LCP 0.6 s, TBT 0 ms, CLS 0.003 |
| Production bundle (gzip) | JS 18.4 kB app + 35.3 kB Motion + 65.7 kB React + 0.4 kB runtime = 119.8 kB; CSS 7.1 kB. `dist` = 824 KB, 12 `.woff2` files (6 Latin, 6 Latin-Extended) |

Mobile Lighthouse is a few tenths of a second slower than the previous pass (FCP 2.2 s → 2.6–2.7 s) and CSS/JS grew ~2 kB gzip (validation, capture mode, RSVP hardening). I did not investigate whether the delta is code size or machine load; both are in the same range. These are lab numbers on a laptop, **not real-device measurements**.

CLS 0.003 comes from one shift: the hero `<h1>`, hidden under the closed envelope, re-flows when Cormorant replaces the fallback font (traced with a `layout-shift` observer). Not visible to a visitor and 30× below the 0.1 "good" threshold; no metric-matched fallback font was added.

## 2. Findings, severity and fixes

Severity: **High** = visitors could be blocked or see broken content; **Medium** = wrong/degraded output in plausible configurations; **Low** = polish/robustness.

| # | Sev. | Finding (how it was confirmed) | Fix |
|---|---|---|---|
| 1 | **High** | Hero entrance elements stayed at `opacity: 0` forever if the animation engine failed. In "static" mode the hero still used `animate="hidden"` until `play` flipped, and `play` is only set after the gate opens. Found by the new test that stubs `Element.prototype.animate` to throw (9 hero elements stayed hidden). | Shared `useStaticMotion()` hook: static mode is always the final state. It is true for reduced motion, capture mode, **or** a failed capability probe (no `IntersectionObserver` / no `Element.animate` / probe animation throws). All animated components use it. |
| 2 | **High** | A partial or malformed config could crash rendering to a **blank page**: `footer`, `hero`, `envelope`, `venue.travel/description`, list items and several section fields were not validated, and a non-array `sections` threw a raw `TypeError`. Found by the new "garbage input" and "missing blocks" tests. | Validator now covers every field the renderer reads, rejects non-objects, checks list item shapes, and has a catch-all that converts any unexpected `TypeError` into a readable `ConfigError`. Error page escapes `< > & "` (tested with an HTML-injection value). Each section and the whole app are wrapped in error boundaries: a section that throws is skipped and logged, the rest of the page works (tested with a throwing getter). |
| 3 | Medium | RSVP endpoint mode: no request timeout/abort, `http://` endpoints accepted, a forgotten `rsvp.endpoint` in another mode was silently ignored (and would become live if the mode were later switched), a name of spaces was accepted, no length caps, guest not told where data goes. | `https` required (http only for `localhost`) for `endpoint` and `link`; endpoint set while mode ≠ `endpoint` is a validation error; 15 s timeout + abort on unmount; `credentials: 'omit'`, `referrerPolicy: 'no-referrer'`, `redirect: 'error'`; trimmed/capped name (120) and notes (1000); guests clamped to `maxGuests`; whitespace-only name rejected with `aria-invalid` + alert; the form states `Your reply is sent to {host}`; double submits ignored. |
| 4 | Medium | Latin-Extended names (Ł, Ş, Ř, ő …) fell back to a system font because only the Latin-1 subset was bundled. | Added Latin-Extended `@font-face` files (6) with `unicode-range`; they are downloaded **only** when such characters are on the page (e2e verifies both directions). |
| 5 | Medium | A section whose list was empty (e.g. `gallery.images: []`) rendered a heading over nothing and a nav entry. | `resolveWedding()` drops sections with empty lists (and their nav entry). |
| 6 | Medium | The Skip button was hidden and `pointer-events: none` while the envelope played, so touch users (no Escape key) could not skip mid-sequence. Found by the Skip-mid-sequence test. | Skip stays visible and clickable throughout. |
| 7 | Medium | Very long first names would overflow the hero arch at narrow widths. **Not reproduced before the fix** (preventive): scaling was added together with tests at 360/768/1920 px. | `--name-scale` shrinks the display size when the longest first name exceeds 8 characters (floor 0.4) and the heading wraps with `overflow-wrap: anywhere`. |
| 8 | Low | The reduced-motion envelope path called `animate()` outside the `try/catch`; an exception would trap the visitor. | Guarded; falls back to finishing immediately. |
| 9 | Low | Countdown labels were 9 px at 360 px viewport. | Minimum 0.64 rem (≈10 px). An e2e test now fails if any visible text is < 10 px at any documented viewport. |
| 10 | Low | ICS `UID` was built from the lower-cased monogram, so a non-ASCII monogram produced a non-ASCII UID. | Sanitised to `[a-z0-9]` with a fallback. |
| 11 | Low | `theme.overrides` accepted any key/value. | Only documented tokens; values may not contain `; { }`. |
| 12 | Low (test quality) | Several earlier "reveal" assertions checked the `<h2>`'s own opacity, which is always 1; the faded element is its wrapping `<header>`. They could not fail. | Assertions now target the wrapper; one test additionally proves content *is* hidden before scrolling and visible after. |
| 13 | Low | Vite warned that the config used extension-less imports (future loader default). | Explicit `.ts` imports. |
| 14 | Info | Tests that need a different config previously could not exist. | A **test-mode** build (`vite build --mode test`) accepts `window.__WEDDING_CONFIG__`. The hook is compiled out of the production bundle (`grep` finds no occurrence in `dist/`) and an e2e test proves the production build ignores an injected config. |

### 2.1 Deterministic screenshot mechanism
**Why sections were hidden:** each section header, card, row and image is wrapped in `Reveal` (Motion `whileInView`, `opacity: 0 → 1` once ≥ 20 % is visible). Screenshot tools that don't scroll never trigger the observer, so below-the-fold content is genuinely `opacity: 0`.

**Fix:** capture mode — URL `?capture` (optional `&now=<ISO>` freezes the countdown clock). It skips the envelope, renders every animation in its final state through `useStaticMotion()`, loads images eagerly, disables CSS animation/transition, and sets `<html data-capture-ready="true">` after fonts are ready, images are decoded and two frames have painted — so tests wait for a signal, not a timeout. Visitors never get it, and an e2e test asserts the normal page is unchanged without the query (envelope shown, sections hidden until scrolled, images lazy, clock live, `&now` ignored).

**Evidence:** at 390×844 and 1440×1000, with and without `prefers-reduced-motion`, two consecutive full-page captures (with a page reload between) are **byte-identical**; baselines are stored per browser in `__screenshots__/`. Another test asserts no element in the captured page has `opacity: 0` (radio inputs excepted: they are visually hidden by design). How-to: `docs/animation-guide.md`, "Deterministic screenshots".

## 3. Checks performed (and where)

**Configuration resilience** (`tests/resilience.spec.ts`, `e2e/resilience.spec.ts`): long names (360/768/1920 px, no overflow, names inside the arch); accented and extended-Latin names (including font subset loading); missing optional sections (hero+venue only, venue only, no hero); custom section orders (DOM order, nav order, scroll cue target); empty and incomplete galleries (empty list, no `src`, missing alt/size); invalid config (impossible date, offset timezone, insecure endpoint, `{}`, arrays, null, strings, numbers, HTML injection) always yields a listed, readable error page — never blank, never a raw exception; events in the past (thank-you message, no calendar buttons, no timer) and during the event.

**Calendar correctness** (`tests/lib.spec.ts`, `tests/resilience.spec.ts`, `e2e/*`): 17 known local→UTC instants across London (summer, winter, spring-forward gap, fall-back ambiguity, both sides of each change), New York (gap and ambiguity), Sydney (both hemispheres' DST, gap on 3 Oct 2027), Lord Howe (30-minute DST), Kathmandu (+5:45), Auckland, UTC, leap day; an event crossing midnight *and* a DST change (exact 6 h duration in UTC); Google URL has exactly `action, text, dates, details, location, ctz`, UTC `dates`, `ctz` = venue zone, and special characters (`& # + % — Ł "`) round-trip; ICS **golden file** with fixed `DTSTAMP`; CRLF-only line endings; every line ≤ 75 octets with multibyte characters never split and lossless unfolding; escaping of `\ ; , newline`; `GEO`/`URL` lines; stable ASCII `UID`; downloaded `.ics` content verified in a browser; invalid event config (month 13, `25:00`, `9pm`, `Mars/Olympus`, `+01:00`, end before start) fails with named paths.

**Animation and accessibility** (`e2e/invitation.spec.ts`, `e2e/quality.spec.ts`): keyboard open (Tab+Enter, Space), touch open, Escape and Skip before and **during** the sequence (gate removed, focus on the names, scroll unlocked, `inert` removed, no gate animation left running); a stray timer cannot re-fire after unmount; scroll lock released after the gate **and** after the mobile menu closes (Escape, link click); Tab is confined to the dialog while the envelope is closed; skip-to-main link; mobile menu focus return; WAAPI unavailable → gate still opens and nothing stays hidden; `IntersectionObserver` unavailable → content visible; reduced motion → gate collapses to a fade, nothing runs afterwards, content immediately visible, back-to-top instant, `scroll-behavior: auto`; **no infinite animation exists** (checked with `document.getAnimations()`), and after scrolling the entire page no animation remains running and scrolling back up replays nothing; countdown ticker pauses while the tab is hidden and resyncs on return.
*Duplicate engines (code audit):* CSS owns hover/press transforms (`.env`, `.env__seal`, `.btn`, nav underline); Motion React owns hero, `Reveal`, `DrawPath`, nav/menu; `motion/mini` (WAAPI) owns the envelope's own layers. No element has two owners; where CSS needs to position an element that Motion animates it uses the independent `translate` property (`.hero__cue`, `.env__seal`). The table is in `docs/animation-guide.md`. This is a read-through plus the runtime checks above, not an automated proof.

**RSVP** (`e2e/resilience.spec.ts`, mocked with `page.route`): email mode says "Nothing is stored by this website" and never mentions an endpoint; link mode is an `https` link with `rel="noopener"`, no form; endpoint mode shows the destination host, sends exactly one `POST` with `Content-Type: application/json` and the documented body, no cookies, trims/caps input, shows a disabled "Sending…" state, ignores double submit, shows "thank you" **only** after a 2xx, shows an alert and keeps the typed data after 500, 422, network failure and a redirect response (never followed), and rejects a blank name without sending. Validator rules for https-only / stray endpoint / `javascript:` URLs are unit-tested. The `mailto:` URL builder is unit-tested; the OS mail client opening cannot be observed by Playwright.

**Responsive and performance** (six documented viewports, `e2e/quality.spec.ts` + `e2e/invitation.spec.ts`): no horizontal overflow of the document or of any element; no text < 10 px; headings, paragraphs, buttons and addresses are not clipped by `overflow: hidden` ancestors; the fixed nav is at `y ≈ 0`, full width, < 80 px tall; touch targets ≥ 40 px; CLS < 0.02 in Chromium; no console warnings/errors or failed/4xx requests; gate and hero screenshot baselines per browser. Fonts: 6 Latin faces + 6 Latin-Extended on demand, `font-display: swap`, WOFF2 only; the (unused) preload experiment from the previous pass remains removed. Images: width/height set, `loading="lazy"` (eager only in capture mode), generated placeholder on missing `src` or a 404 (tested).

## 4. Remaining limitations

- **Real devices were not tested.** Performance, scrolling smoothness, the envelope's 3D transform on older phones, and battery use are unmeasured. Lighthouse figures are laptop lab runs with simulated throttling.
- **The RSVP `endpoint` mode has never been run against a real provider.** Verified only against a mocked route. Unknown until tested: the provider's CORS policy (JSON `Content-Type` triggers a preflight), its required field names, spam protection/CAPTCHA, rate limits, and whether it needs a different body format (`application/x-www-form-urlencoded` or its own JSON shape). Some providers redirect after a post, which this code treats as a failure by design (`redirect: 'error'`).
- `mailto:` mode depends on the guest having a configured mail app/webmail handler; there is no fallback besides showing the contact addresses in the section. Nothing confirms that the email was actually sent.
- **Safari/WebKit behaviour was tested with Playwright's WebKit build**, not Safari on macOS/iOS. Firefox was tested on desktop only.
- Browser support needs `inert`, CSS container units and `color-mix()`: Chrome ≥ 111, Safari ≥ 16.4, Firefox ≥ 113 **[E, from compatibility tables, not tested on old versions]**. On a browser without `inert` the page behind the closed envelope is still visually covered but could be reached by keyboard.
- Hero removed from `sections` ⇒ the page has no `<h1>` (still valid and tested, but not ideal for assistive-tech/SEO).
- The page does not hide the RSVP section or "kindly reply by" line once the deadline or the event has passed.
- No cyrillic, Greek or Vietnamese font subsets; those scripts fall back to system fonts.
- No `srcset`/responsive image variants; supply right-sized photos.
- Screenshot baselines were created on macOS and include fonts rendered by this machine's Playwright browsers; expect to regenerate them on another OS (`--update-snapshots`).
- Layout-shift measurement is Chromium-only (Firefox/WebKit lack the API; those engines are covered by the overflow/clipping checks instead).
- No automated accessibility engine (axe) was run; accessibility evidence is Lighthouse (100), the keyboard/focus/reduced-motion tests, the computed contrast table in `docs/design-system.md`, and code review. A screen-reader pass was **not** done.
- Countdown "after" state hides calendar buttons but the page otherwise still reads as an invitation.

## 5. Manual verification required before a real wedding

1. **Every fact:** names, date, start/end time, **timezone**, venue name and address, travel notes, schedule, dress code, accommodation deadline and code, RSVP deadline. Proofread for typos.
2. **Calendar:** on an iPhone and an Android phone, open "Add to Google Calendar" and download the `.ics`; confirm title, time (in *your* local time it should differ from the venue's by the right amount if you are abroad), location and that the event opens correctly in Apple Calendar and Outlook.
3. **RSVP, end to end:** submit a real reply through the chosen mode from a phone *and* a desktop; confirm the couple actually receives it. For `endpoint` mode: test success, a blocked network, and the provider's spam filter; confirm no reply is silently dropped. Check where responses are stored and who has access (they contain guests' names and dietary notes).
4. **Real devices:** open the link on at least one mid-range Android phone and one iPhone (Safari, plus in-app browsers from WhatsApp/Messenger/Instagram, which are where most guests will open it). Check the envelope sequence, scrolling, the mobile menu, keyboard appearance in the RSVP form, and the safe-area insets on a notched phone.
5. **Accessibility:** run a screen reader (VoiceOver on iOS/macOS, TalkBack) through the envelope, hero, countdown and RSVP form; test with OS "Reduce motion" on; test with browser zoom 200 % and large system text.
6. **Share preview:** paste the final URL into WhatsApp, iMessage and a social network; check the title, description and image (needs `site.url` set so `og:image` is absolute). Messaging apps cache previews, so test before sending widely.
7. **Images and copy rights:** replace placeholder illustrations/photos with images you have the right to publish; compress them; check `alt` text.
8. **Privacy:** confirm the page makes no third-party requests you didn't intend (DevTools → Network; the sample makes none other than the optional endpoint) and that guests' phone numbers/emails shown in the contact list are okay to publish.
9. **After the date:** decide whether to take the site down, switch it to a thank-you page, or leave the "after" state.

## 6. Deployment checklist

- [ ] `site.url` set to the final public URL (canonical, absolute `og:image`)
- [ ] `public/og.png` replaced with the couple's share image (1200 × 630)
- [ ] `rsvp` mode chosen and configured; endpoint/link is **https**; no stray `rsvp.endpoint` in other modes
- [ ] `npm run build` then `npm test` (or at least `npm run test:unit`) pass with the final config; regenerate screenshot baselines if content changed
- [ ] Open `dist/index.html` metadata: title, description, `og:*`, `twitter:*`, `theme-color`, `lang`
- [ ] Deploy **only `dist/`** (not `dist-test/`; that build accepts injected configuration for tests). Confirm `grep -r __WEDDING_CONFIG__ dist` finds nothing
- [ ] Host serves over **HTTPS** (clipboard copy and some APIs require a secure context); HTTP → HTTPS redirect enabled
- [ ] `base: './'` means any folder works; if using client-side hash links (`#venue`) no server rewrites are needed
- [ ] Cache headers: long-lived caching for `assets/*` (hashed names); short or revalidated caching for `index.html` and `public/` files that keep their names (`og.png`, `gallery/*`, `favicon.svg`)
- [ ] `robots.txt`: currently allows all; if the invitation should not be indexed, change it **and** add `<meta name="robots" content="noindex">` (not present by default)
- [ ] If using an RSVP provider, add the site's origin to its allowed-origins list; set up notifications and spam protection
- [ ] Re-run the manual list in §5 against the deployed URL, not localhost
- [ ] Note the rollback plan: keep the previous `dist/` folder or deployment version

## 7. Final verification commands

```bash
cd invitation
npm install
npm run lint
npm run typecheck
npm run build
npm run test:unit
npx playwright install firefox webkit        # once, for cross-browser
PW_BROWSERS=chromium,firefox,webkit npm run test:e2e
```
`npm run test:e2e` builds and serves both the production build (`:4173`) and the test-mode build (`:4174`) itself; stop any other process using those ports first. Chromium only (default): `npm run test:e2e`. After intentional visual changes: `npx playwright test --update-snapshots`.

Optional, to reproduce the Lighthouse numbers (needs a Chrome binary; the Playwright one works):
```bash
npm run build && npx vite preview --port 4173 --strictPort &
CHROME_PATH="<path to Chrome>" npx lighthouse@12 http://localhost:4173/ --chrome-flags="--headless=new --no-sandbox" --only-categories=performance,accessibility,best-practices,seo
```

## 8. Files changed in this audit
**New:** `src/lib/capture.ts`, `src/components/animations/useStaticMotion.ts`, `src/app/SectionBoundary.tsx`, `tests/resilience.spec.ts`, `e2e/helpers.ts`, `e2e/resilience.spec.ts`, `e2e/quality.spec.ts`, this report.
**Modified:** `src/config/{validate,resolve,index,wedding}.ts`, `src/lib/calendar.ts`, `src/hooks/useNow.ts`, `src/main.tsx`, `src/app/App.tsx`, `src/components/animations/{Reveal,DrawPath}.tsx`, `src/components/envelope/EnvelopeGate.tsx`, `src/components/nav/SiteNav.tsx`, `src/components/sections/{Hero,Schedule,Gallery,Rsvp}.tsx`, `src/content/strings.ts`, `src/styles/{fonts,gate,motion,sections}.css`, `vite.config.ts`, `playwright.config.ts`, `package.json`, `.gitignore`, `README.md`, `docs/{animation-guide,design-system,template-customization,implementation-plan}.md`, and the regenerated `__screenshots__/` baselines.
