# Creative Audit

Audit of the wedding invitation template (`invitation/`) before the creative redesign. Branch: `feature/luxury-wedding-creative-redesign`, started from `main` @ `b1b543e`.

## Method and limits

- Read every component, stylesheet, the config model, the e2e/unit tests and the existing docs (`design-analysis.md`, `design-system.md`, `production-readiness-report.md`).
- Looked at the committed baseline screenshots (`docs/screenshots/before/`, copied from `invitation/__screenshots__/chromium`) and the reference captures in `inspection-output/`.
- **Inspection limit:** I did not re-open the live reference site in a browser during this task (no browser tool was used). The reference observations come from the earlier `docs/design-analysis.md` and the stored captures in `inspection-output/`. Those captures show the envelope gate (a photographed ivory envelope with a lace-trimmed wax seal, shot on silk) well; the rest of the stored full-page capture is blank because content reveals on scroll. I therefore did not invent findings about its scroll behaviour, transitions or mobile composition beyond what the earlier analysis recorded.
- Nothing from the reference is copied: no code, artwork, video, monogram or text.

## Baseline status (before any change)

| Check | Result |
|---|---|
| `npm run lint` | clean |
| `npm run typecheck` | clean |
| `npm run build` | passes |
| `npm run test:unit` | 64 passed |
| `npm run test:e2e` (Chromium) | see "Baseline e2e" at the end |

## What the reference does that the template does not

From the stored capture and earlier analysis: a *photographic* opening (real paper, real lace, real light and shallow depth of field), a single tonal material world (ivory paper, silk, soft gold), and a pacing that treats the opening as a scene. The template has the same palette but none of the material evidence.

## Findings

Each finding: **problem → why it weakens the experience → change → expected effect → implementation.**

### 1. The envelope is a flat vector diagram
- **Problem.** `Pocket`/`Flap` are two linear gradients with 1px strokes. The envelope reads as an icon: a rectangle with an X. No paper thickness, no grain, no cast shadow from the flap, no light direction (see `docs/screenshots/before/gate-1440x1000.png`). The letter is a small white rectangle that scales up and fades.
- **Why it hurts.** The opening is the first and most memorable moment. A diagram communicates "UI widget"; paper communicates "an object someone sent you".
- **Change.** Give the envelope a light source (top-left), paper grain, a flap that casts a shadow which moves with its angle, an embossed monogram on the flap, a tissue lining with a printed pattern, a letter card with a deckled inner border and pressed (letterpress) type. The letter slides out and *becomes* the hero card, so the transition is a continuation of one object.
- **Effect.** The sequence reads as a physical unboxing, not a modal fade.
- **Implementation.** Same DOM ownership map and Motion calls as today (no new engines). New static layers (grain, shadows) are CSS/SVG; only transform/opacity animate. Skip, Escape, reduced motion and failure recovery are untouched.

### 2. The hero is a centred stack inside an arch outline
- **Problem.** One arch outline, everything centred, names at the same size, same weight, same alignment; the arch contains no image.
- **Why it hurts.** Equal weight and centring give no focal point and no tension. An empty outline is decoration without content.
- **Change.** Typographic composition: the two names set at a dramatic scale in different styles (upright light roman and italic), offset left/right, the ampersand overlapping both; a solid tonal arched "window" plate behind them that the type crosses; a vertical date running down the margin.
- **Effect.** Typography interacts with the image plate; a clear reading order and a distinctive silhouette.
- **Implementation.** `.hero__arch` stays the containing element (tests depend on it); long-name scaling (`--name-scale`) is kept and verified at 360 / 768 / 1920 px.

### 3. Every section is the same layout
- **Problem.** Seven of nine sections use eyebrow + h2 left-aligned over a two-column grid separated by hairlines; the same fade-and-lift reveal on all of them.
- **Why it hurts.** Predictable rhythm; the page feels like one template repeated.
- **Change.** Each section is an "editorial scene" with its own composition (see `creative-direction.md`), unified by a folio numbering system, one hairline grid and shared materials.
- **Implementation.** Same configuration and section ids; new markup/CSS per section; `SectionHeading` keeps its signature and its `Reveal` wrapper (tests read the wrapper's opacity).

### 4. Typography has one gear
- **Problem.** Cormorant 300 at similar sizes everywhere, Montserrat labels, and a single script line. No italic display, no scale contrast beyond h2 vs body, no typography that overlaps anything.
- **Change.** Add Cormorant Garamond **Light Italic** (latin and latin-ext subsets, self-hosted from the already-installed `@fontsource` package) for the second name, the ampersand, pull quotes and numerals. Keep Montserrat (500) for metadata only. Keep Great Vibes for exactly one accent (the hero greeting). Introduce a responsive scale with a much larger display step.
- **Effect.** Contrast between roman/italic, giant/tiny, serif/sans carries the hierarchy without more fonts.

### 5. No photographic presence; plates are flat line art
- **Problem.** Gallery items are small flat SVGs at 2–3 equal columns. The venue is a line drawing floating on the page. There is nothing to carry "fine-art photography".
- **Constraint.** The repository contains no photographs, and I will not invent or hot-link stock images.
- **Change.** Art-direct the *containers* for photography so real photos drop in correctly: fixed art-directed aspect ratios with `object-fit: cover`, an asymmetric 12-column gallery with overlaps, a tonal "print" treatment (paper grain, inner border, soft vignette) applied to whatever image is supplied. The sample SVG plates get a richer tonal treatment so the sample page still has depth. `src` swap is documented.
- **Honest limitation.** Until real photography is supplied the sample still shows illustrations, not photographs.

### 6. Surfaces are flat colour
- **Problem.** Backgrounds are solid hex values; the only "texture" is a radial gradient.
- **Change.** One restrained paper-grain tile (a small inline SVG noise rendered once as a background image, no runtime filter), a vellum overlay for inset cards, hairline borders and a debossed/embossed rule treatment for the monogram. Used on the envelope, hero plate, reply card and footer only.

### 7. The countdown is four numerals in a row
- **Change.** A spacious interlude: numerals at display scale across the full measure, hairline dividers with tick marks like a ruler, a large faint monogram behind, controls moved into a quieter row.
- **Implementation.** `.countdown__num` and `.countdown__message` kept.

### 8. The schedule is a standard timeline with dots
- **Change.** A printed programme: each row is a full-width ruled line, large italic time numerals on the left, title and place aligned on a shared baseline grid, the date set vertically beside it.

### 9. The RSVP form looks like an embedded widget
- **Change.** A reply card: paper surface with grain, a perforated edge and notched corner, underlined fields (printed-form style) instead of boxed inputs, an embossed "Répondez" label from existing strings (no new copy hard-coded).
- **Implementation.** CSS-only for inputs; no change to submit logic or the tested text/roles.

### 10. The footer is a smaller version of the section above it
- **Change.** Echo the opening: the footer starts with an envelope-flap "V" cut in the page colour, the wax seal sits on the point, names set large. Closes the loop with the gate.

### 11. Motion is one effect repeated
- **Problem.** `Reveal` = fade + 24px lift on everything; timeline line draw; hero mask. No distinction between text, imagery and structure.
- **Change.** Three named patterns (see `creative-direction.md` §Motion): *settle* (text), *unveil* (images: clip-path wipe with an inner counter-scale) and *draw* (rules/line art). One engine (Motion), one ease family.

### 12. Mobile is the desktop stacked
- **Problem.** On phones the hero arch is a narrow column and the gallery is two equal columns; layouts simply collapse.
- **Change.** Mobile-specific compositions (stacked names overlapping the arch, single staggered gallery column, ruled schedule rows that wrap time over title, reply card full-bleed). Defined in the section-by-section table in `creative-direction.md`.

## Things deliberately **not** changed

Configuration schema and validation, countdown/timezone logic, calendar generation, RSVP modes and security rules, theme names and tokens (both themes keep working), reduced-motion/static-mode logic, capture mode, section boundaries, the test hooks listed in `docs/redesign-results.md`.
