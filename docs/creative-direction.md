# Creative Direction

## Three concepts

### A. "The Pressed Suite" — letterpress stationery, one object unfolding
- **Idea.** The invitation *is* a suite of printed paper: envelope → card → programme → reply card. Every section is a different stationery piece cut from the same stock.
- **Opening.** A lit, grained envelope with an embossed flap and wax seal; the flap opens, the card slides out and grows into the hero card.
- **Hero.** Names set huge in contrasting roman/italic, offset, crossing a tonal arched window plate; vertical date in the margin.
- **Type.** Cormorant Garamond light roman and light italic at extreme scale; Montserrat only for metadata; one script accent.
- **Photography.** Plates are "prints" mounted on paper: inner border, grain, asymmetric crops and overlaps.
- **Materials.** Paper grain, vellum, embossed rules, perforation, deckle-like notch.
- **Schedule / venue.** Printed programme with ruled lines; venue as a large plate with the name overlapping its edge.
- **Gallery.** Twelve-column asymmetrical mount board.
- **Motion.** Paper physics: slide, settle, unveil.
- **Motif.** The envelope flap "V" and the arch window.
- **Mobile.** Stacked cards with the same overlaps at smaller scale; single staggered gallery column.
- **Feasibility.** CSS/SVG plus existing Motion. No new dependencies. Cheap to render.

### B. "Contact Sheet" — a film-strip / photographic proof sheet
- **Idea.** The site is a photographer's proof sheet: frames, crop marks, frame numbers.
- **Opening.** A negative sleeve slides open.
- **Hero.** Full-bleed photo with crop marks, names in a caption bar.
- **Type.** Mono labels and a grotesque headline face.
- **Weakness.** Depends entirely on real photography that does not exist in the repo; with placeholder SVGs it would look empty. Moves away from "stationery" the reference and brief point to. Needs a second type family.
- **Feasibility.** Good for a studio with photos; poor as a template with sample illustrations.

### C. "Midnight Orangery" — dark glass-house, light from above
- **Idea.** A nocturnal, candle-lit scene: deep green, glowing gold, glass reflections.
- **Opening.** Light sweeps across a dark envelope.
- **Hero.** Centred names with a glow.
- **Weakness.** The brief warns against assuming luxury needs dark backgrounds and gold; glow/gradient effects are the expensive, generic kind. Light theme would need a separate design. Gradients and blurs are costly on mobile.
- **Feasibility.** Medium; performance risk.

## Comparison

| Criterion | A. Pressed Suite | B. Contact Sheet | C. Midnight Orangery |
|---|---|---|---|
| Originality | high | high | medium (common "dark luxe") |
| Emotional impact | warm, tactile, personal | cool, editorial | dramatic, generic |
| Visual richness without photos | **high** (paper, type, plates) | low | medium |
| Cohesion with opening/footer | **high** (one object) | medium | medium |
| Mobile suitability | high | medium | medium (blur cost) |
| Feasibility / deps | none added | extra font + photos | filters, perf risk |
| Maintainability | high | medium | medium |

## Decision: A, "The Pressed Suite"

It is the only concept that is rich *with the assets the template really has* (type, paper, line art), it extends the existing ivory / ink-green / champagne palette and both themes, it needs no new libraries, and it gives the opening and closing a shared visual idea. Concepts B and C were not implemented.

## Design system for the chosen direction

### Palette and themes
Unchanged tokens (`ivory`, `midnight`). Added semantic helpers derived from existing tokens via `color-mix`: `--paper-grain` opacity, `--color-plate` (tonal arch/plate fill), `--color-emboss-hi` and `--color-emboss-lo` (letterpress highlight/shadow). Both themes define them, so Midnight remains valid.

### Typography
| Role | Face | Treatment |
|---|---|---|
| Names (hero) | Cormorant Garamond 300 roman + 300 *italic* | `clamp(4.2rem, 2rem + 13vw, 13.5rem)`, first name roman left, second italic right, offset, tight leading |
| Ampersand | Cormorant 300 italic | ~0.55× size, accent colour, overlaps both names |
| Editorial headings (h2) | Cormorant 300, italic for emphasised word via `em` | large, tight, `text-wrap: balance` |
| Supporting serif | Cormorant 400 | lead paragraphs, quotes italic 300 |
| Handwritten accent | Great Vibes | one place only: hero greeting |
| Navigation, labels, dates, captions | Montserrat 500 | small caps-style uppercase with tracking |
| Numerals | Cormorant 300, lining tabular | folios, countdown, times |

Font decision: **keep** Cormorant Garamond (it already supports the italics and latin-ext subsets) and Montserrat; **add** only Cormorant 300 italic (latin + latin-ext, two woff2 files, ~30 kB). No new families. Cyrillic/Greek remain system fallback (documented limitation).

### Editorial grid
A 12-column grid in `--w-wide`, hairline folio rule at the top of each scene (`01 — The story`), numerals set in the margin on desktop and inline on mobile. Negative space is intentional: each scene has one dominant element.

### Scenes
| Section | Composition (desktop) | Composition (mobile) |
|---|---|---|
| Opening | Lit envelope, embossed flap, wax seal, card slides out and becomes the hero | same, scaled; hint below |
| Hero | Names across an arched plate; vertical date in margin; script greeting above | Plate on top, names overlapping its lower edge, date inline |
| Story | Large pull-quote left over a pressed botanical on vellum; message and chapters on a ruled right column; chapter years as oversized italic numerals | single column, quote first, chapters as ruled rows |
| Countdown | Full-measure numerals with ruler ticks, faint monogram | 2×2 grid, numerals scaled |
| Schedule | Printed programme: ruled rows, big italic times left, title/place right, date set vertically | time above title, rules kept |
| Venue | Tall plate with the venue name overlapping its right edge, vellum info card overlapping bottom-left | plate then card, name overlapping |
| Details | Two columns, oversized folio numerals | single column |
| Gallery | Asymmetric 12-col mount board; mixed ratios, offsets, one overlap; captions with plate numbers | single column, alternating offsets |
| RSVP | Reply card with perforation and notch, underlined fields | full-bleed card |
| Closing | Envelope-flap V, seal on its point, large names | same, scaled |

### Materials
- **Grain**: one tiled 160 px inline-SVG noise (`feTurbulence`) used as a CSS background image, so it is rasterised once. Applied via `.paper` (envelope, hero plate, reply card, footer). Never as a live filter.
- **Emboss**: dual `text-shadow`/`drop-shadow` on the monogram and rules (highlight up-left, shade down-right).
- **Vellum**: translucent surface + 1 px border; used only for the venue card and story botanical.
- **Perforation/notch**: CSS radial-gradient mask on the reply card edge.

### Motion language
- **Principles.** Motion is physical (paper slides, settles, is unveiled) and happens once. Only `transform`, `opacity` and `clip-path` animate. Each element has one owner (CSS *or* Motion).
- **Easing.** `ease.out = (0.22, 1, 0.36, 1)` for arrivals, `ease.inOut = (0.65, 0, 0.35, 1)` for moves. No springs, no bounce.
- **Durations.** Fast 0.18 s (hover/press), base 0.45 s, slow 0.9 s (reveals), signature 1.0–1.9 s (opening only).
- **Stagger.** 0.08–0.13 s between siblings; never more than four staggered siblings in one group.
- **Patterns.** *settle* (text: fade + 16 px), *unveil* (images: `clip-path` inset wipe + inner 1.08→1 scale, 1.1 s), *draw* (rules and line art, existing `DrawPath`).
- **Scroll triggers.** `whileInView`, `once: true`, `amount 0.2`.
- **Hover/touch.** Plates lift 3 px with a shadow change on hover-capable devices; buttons keep existing behaviour; `:active` presses scale 0.985.
- **Cleanup.** All gate animations are tracked and stopped on unmount; failure paths reveal the page immediately. GSAP/Lenis are not used: nothing here needs scrubbing or timeline pinning that Motion cannot do.

### What would justify GSAP later
Scroll-scrubbed storytelling (pinned timelines), SVG morphing between flap shapes. Neither is needed.
