# Animation Guide

The motion language of "The Pressed Suite" (see [creative-direction.md](creative-direction.md) for why): **motion is physical (paper slides, settles and is unveiled), happens once, and never loops.**

## Library decisions
| Library | Decision | Reason |
|---|---|---|
| **Motion** (`motion` 14.6) | Used | `whileInView` reveals, variants/stagger for the hero, `AnimatePresence` for the nav/menu, `pathLength` line-drawing, `clip-path` unveils, `useReducedMotion`. Loaded through `LazyMotion` + `domAnimation` with `strict`, so only the small `m` component is bundled. |
| Motion **mini** `animate` | Used for the envelope | Plain WAAPI: transforms run on the compositor thread and no sequence engine is shipped. |
| **GSAP** | Not used | The envelope is ~9 tracks with delays; WAAPI delays + one multi-keyframe animation express it exactly. Nothing needs scroll-scrubbed or pinned timelines. Revisit for those, or for SVG morphing. |
| **Lenis** | Not used | Smooth scroll here means anchors and back-to-top only. Native `scroll-behavior: smooth` (only under `prefers-reduced-motion: no-preference`) + `scroll-padding-top` keeps native history, focus and keyboard behaviour and avoids hijacking scroll. |

Measured cost (production build, gzip): Motion chunk **35.3 kB**, React **65.7 kB**, app code **20.0 kB**, CSS **9.5 kB**. No dependency was added by the redesign.

## Principles
- **Easing.** `ease.out = (0.22, 1, 0.36, 1)` for arrivals, `ease.inOut = (0.65, 0, 0.35, 1)` for moves. No springs, no overshoot.
- **Durations.** 0.18 s (hover/press), 0.45 s (small moves), 0.9 s (reveals), 1.1–1.4 s (image unveils), 1.9–2.7 s (the envelope; the only long sequence).
- **Stagger.** 0.08–0.13 s between siblings, at most four in a row.
- **Properties.** Only `transform`, `opacity` and `clip-path` animate (plus a discrete `z-index` flip on the envelope flap). No animated blur/filter, no layout properties.
- **Once.** Everything plays once; scrolling away and back never re-hides content.

## Named patterns
| Pattern | What it does | Where | Implementation |
|---|---|---|---|
| **settle** | Text fades in and rises 16 px | Section headings and body copy, countdown, schedule rows, chapters, quotes | `animations/Reveal.tsx` |
| **unveil** | A picture is wiped open like a sheet drawn back (`clip-path`, 1.1 s) while it settles from 1.08× to 1× (1.4 s) | Gallery frames, venue plate, story plate | `animations/Unveil.tsx` |
| **draw** | Rules and line art draw themselves with `pathLength` / `scaleX` / `scaleY` | Hero sprigs, orangery line drawing, timeline rule, hero rule | `animations/DrawPath.tsx`, Motion `scale` variants |
| **mask rise** | A name slides up inside an `overflow: hidden` mask | The two hero names | Hero variants |
| **fade-in on load** | A photograph fades in (0.8 s) once its bytes have arrived | Every photograph | CSS opacity on `.photo[data-state='loaded']` |

### The unveil, and a trap it avoids
`Unveil` renders three layers: an outer element that **Motion observes** (`whileInView`), a `.unveil__clip` child that animates `clip-path`, and a `.unveil__inner` child that animates `scale`. The observed element must never be the clipped one: a fully clipped element reports no intersection, so the observer never fires and the picture would stay blank forever (the first version of the redesign did this; the gallery tests caught it). Layout is unaffected by the transforms: measure with `offsetHeight`, not `getBoundingClientRect`, if you need the layout box mid-animation.

## One owner per property
| Element | Owner | Properties |
|---|---|---|
| `.gate__intro` | CSS keyframe | opacity, transform (entrance) |
| `.env` | CSS transition | transform (hover lift / press) |
| `.env__seal` | CSS transition + `translate` | transform (hover/press) |
| `.env__seal-art`, `.env__flap`, `.env__flap-shadow`, `.env__letter`, `.env__stage`, `.gate` | WAAPI via `motion/mini` | transform, opacity, z-index |
| `.hero__arch` children, `Reveal`, nav, `DrawPath` | Motion React | opacity, transform, pathLength |
| `.hero__window` | Motion React (variant) | clip-path (the window unveils from the bottom when the envelope dissolves) |
| `Unveil` (`.unveil__clip`, `.unveil__inner`) | Motion React | clip-path, transform |
| `img.photo` | CSS transition | opacity (driven by `data-state`) |
| `.plate__frame` | CSS transition | translate, box-shadow (hover, pointer devices only) |
| `.nav__link::after`, buttons | CSS transition | transform, colour |

## The envelope (`components/envelope/`)
Layers (back → front): contact shadow, back panel (tissue liner: diagonal print over darker paper + grain), **letter** (a card with an arched window and pressed names), pocket (V-shaped front, SVG: lit left panel, shaded right panel, stitched bottom edge), **flap shadow**, **flap** (two faces: outside with a stitched edge + lining, `backface-visibility: hidden`), **wax seal**. The stage has `perspective: 1400px`; the flap hinges at its top edge. The whole gate is a lit paper room (radial light from the top-left, vignette, grain).

Timeline (seconds from press):

| t | Action |
|---|---|
| 0 → 0.55 | Seal presses (scale .9) then lifts away (scale 1.12, fades) |
| 0.3 → 1.25 | Flap swings `rotateX(0→180°)`; at its edge-on point (0.77) z-index drops under the letter |
| 0.35 → 0.95 | The flap's cast shadow fades out as the flap lifts |
| 1.0 → 2.85 | Letter rises (`translateY -62%`, ease-out) then swells (`scale 1.22`, ease-in-out): one animation, two eased segments |
| 1.9 → 2.4 | Letter fades; stage settles back 1.8 → 2.65 (`y 18px, scale .97`) |
| 1.9 | `onReveal`: the hero entrance starts underneath |
| 1.9 → 2.7 | Overlay fades out; `onOpened` fires on completion: `inert` removed, focus moves to the hero heading |

Press feedback: hover lifts the envelope 4 px and the seal 7 % (pointer devices only); pressed scales the seal to 93 %.

Constants live in `T` at the top of `EnvelopeGate.tsx`; change timings there.

### Accessibility behaviour
- The gate is `role="dialog" aria-modal`; the dialog itself takes focus on load (announced, no focus ring), first `Tab` lands on the envelope button.
- `Enter`/`Space`/click/tap all open it; a second press while opening is ignored (`aria-disabled`, not `disabled`, so focus isn't dropped).
- **Skip**: the visible "Skip to invitation" button and `Escape` complete the sequence immediately. The invitation is in the DOM underneath from the start (inert while closed), so nothing is generated by the gate.
- Reduced motion: still one press, but the sequence collapses to a 0.2 s fade.
- The Skip button stays visible and clickable while the sequence plays (touch users have no Escape key).
- Failure: a render error is caught by `GateBoundary`; an error starting the animations (including the reduced-motion fade) is caught in `open()`. Both drop the gate and show the page (tested by stubbing `Element.prototype.animate` to throw).

## Hero entrance (`Hero.tsx`)
Variants with `staggerChildren .13`, in this order: the **arched window unveils** from the bottom (1.4 s; a photograph fades in inside it once loaded, or the drawn plate's sprigs draw) → greeting rises → first name slides up in its mask (1.15 s) → ampersand → second name → rule scales in → date → long date → place → vertical date (≥ 64 rem) → scroll cue (1.6 s delay). No per-character animation, no overshoot. `play` flips when the envelope dissolves (or immediately if the envelope is disabled). The hero photograph is loaded **eagerly** while the gate is up, so it is ready when the envelope opens.

## Scroll reveals (`Reveal.tsx`, `Unveil.tsx`)
`Reveal`: `whileInView`, `once: true`, `amount: .2`, bottom margin −8 %, 16 px rise, 0.9 s ease-out. Siblings pass `delay={i * 0.06–0.1}` (capped at 3 steps so nothing waits). `Unveil`: `once: true`, `amount: .15`; neighbouring plates are offset by 0.12 s. `opacity`/`transform`/`clip-path` only, so there is no layout shift.
The timeline's vertical rule draws with `scaleY` when it enters view.
Caveat: elements below the fold stay hidden until scrolled to. Full-page screenshot tools that don't scroll will show blank sections: use capture mode (below).

## Photographs (`ui/Photo.tsx`)
- A frame's tonal ground and size are fixed by CSS before any bytes arrive, so slow images never move the layout (CLS 0.005 measured with 5 s delays; an e2e test asserts frames keep their `offsetHeight` and total CLS < 0.02).
- The `<img>` is invisible (`opacity: 0`) until it has loaded, then fades in over 0.8 s. A cached image can finish before React attaches `onLoad`, so the component also checks `img.complete` on mount.
- A failed request calls `onFail`, and the caller shows its drawn fallback; no broken-image icon is ever painted.
- Under capture mode the image is forced to `opacity: 1` and loads eagerly; under reduced motion the fade is removed.

## Countdown
One `useNow` ticker aligned to second boundaries, paused while the tab is hidden, cleaned up on unmount. Only the numeral whose text changed re-renders (`memo`). Digits are not animated. Screen readers get a minute-resolution `aria-label` on the `role="timer"` element (not announced per second). Phases: `before` → grid; `during` → "Today is the day"; `after` → thank-you (calendar buttons hidden).

## Navigation
Plain hash links. The nav appears once the hero **has fully left** the viewport (IntersectionObserver, `rootMargin: -1px`), slides in (0.45 s), highlights the current section via a second observer (`aria-current="location"`). Mobile: menu sheet with `AnimatePresence`, closes on link/`Escape`/resize, focus returns to the toggle, page scroll locked while open. Back-to-top is `href="#top"`. `html { scroll-padding-top }` offsets the sticky bar. Because the nav waits for the *whole* hero to leave, tests that scroll to a tall section must centre it explicitly rather than use `scrollIntoViewIfNeeded` (engines differ).

## Static mode and capture mode
`useStaticMotion()` (`components/animations/useStaticMotion.ts`) is the single switch every animated component uses. It is true when any of these holds, and then everything renders in its final state with no movement:
1. the visitor prefers reduced motion;
2. capture mode is on (`?capture`, below);
3. the browser can't run the animations (no `IntersectionObserver`, no `Element.animate`, or a probe animation throws).
Case 3 is the guarantee that a failing animation engine never leaves content hidden. In static mode `Reveal` and `Unveil` render a plain element with no wrappers.

### Deterministic screenshots: capturing the complete page
Sections normally fade in as they enter the viewport, so a plain full-page screenshot of the live page shows blanks. Use capture mode:

```
http://localhost:4173/?capture&now=2027-01-01T00:00:00Z
```
- `?capture`: no envelope; every reveal, unveil, hero entrance, line-drawing and timeline renders in its final state; images load eagerly and are fully opaque; CSS animation/transition is disabled (`html[data-capture]`).
- `&now=<ISO instant>`: optional; freezes the countdown clock so the numbers are identical on every run. Ignored without `?capture`.
- Wait for the readiness signal instead of sleeping: `await page.waitForSelector('html[data-capture-ready="true"]')`. It is set after `document.fonts.ready`, all images decoded, and two animation frames.
- Then `await page.screenshot({ fullPage: true })`. `e2e/quality.spec.ts` does this at 390×844 and 1440×1000, with and without `prefers-reduced-motion`, and asserts two consecutive captures are byte-identical.
- `invitation/scripts/capture-screens.mjs` does the whole set (every viewport, both themes, and the opening sequence as timed frames).
Normal visitors never get this mode; an e2e test asserts normal behaviour is unchanged without it.

## Reduced motion
`<MotionConfig reducedMotion="user">` + explicit checks: `Reveal`/`Unveil`/`DrawPath`/timeline render static elements; hero uses `initial={false}`; nav appears without sliding; the envelope fades (0.2 s); photographs appear without the fade; CSS transitions shrink to 10 ms and `scroll-behavior` is `auto`. Content is visible immediately.

## Adding an animation
1. Pick the property owner from the table above; do not give one element two owners.
2. Use a named pattern (`Reveal`, `Unveil`, `DrawPath`) and the tokens in `animations/tokens.ts`.
3. Never put the observed element and the clipped element on the same node.
4. Guard anything that moves with `useStaticMotion()` (or put it in a `@media (prefers-reduced-motion: no-preference)` block).
5. Never make information depend on the animation having run.
