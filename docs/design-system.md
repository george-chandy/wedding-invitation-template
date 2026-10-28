# Design System: "The Pressed Suite"

Concept: the invitation is one set of **letterpress stationery** unfolding: a lit envelope, a card, a printed programme, a perforated reply card and a closing flap. Warm ivory paper, ink-green type, one champagne accent for hairlines and numerals, a dark inverse band for the countdown and footer. Photographs are mounted prints; the arch is the recurring window. Why this direction and what it replaced: [creative-direction.md](creative-direction.md), [creative-audit.md](creative-audit.md).

All styles live in `invitation/src/styles/` and are loaded by `index.css`.

| File | Contents |
|---|---|
| `tokens.css` | Fonts, type scale, spacing, layout widths, radii, shadows, motion, material size, z-index |
| `themes.css` | Semantic colour tokens per theme (`ivory`, `midnight`) **and** the material tokens (grain, plate, sun, emboss, hero wash) |
| `fonts.css` | 14 `@font-face` blocks: 7 faces × (Latin + Latin-Extended, the latter loaded on demand) |
| `base.css` | Reset, focus, `.container`, `.section`, `.sr-only`, skip link, scroll behaviour |
| `type.css` | `.eyebrow` (with CSS-counter folio), `.label`, `.h2`, `.h3`, `.lead`, `.script`, `.numeral`, `.paper` |
| `ui.css` | Buttons, ornament, form controls, printed-form fields for the reply card |
| `gate.css` | The envelope and its lit room |
| `nav.css` | Navigation |
| `sections.css` | One composition per scene, plus the photography layer (end of file) |
| `motion.css` | Reduced-motion rules for CSS-driven movement, capture-mode overrides |

## Colour (semantic tokens)
Components only use `--color-*` names; themes redefine them. Contrast ratios were **computed** (WCAG relative luminance) and are unchanged by the redesign.

| Token | ivory | midnight | Use |
|---|---|---|---|
| `--color-bg` | `#f7f2e9` | `#111a1f` | Page |
| `--color-bg-alt` | `#efe7d8` | `#172228` | Alternate sections |
| `--color-surface` | `#fcf9f3` | `#1d2b32` | Cards, inputs, the letter |
| `--color-ink` | `#1f2a24` (13.3:1) | `#efe8da` (14.5:1) | Primary text |
| `--color-ink-muted` | `#565e55` (6.0:1) | `#b0b8b0` (8.7:1) | Secondary text |
| `--color-accent` | `#a8844a` (3.1:1) | `#c8a96b` (7.8:1) | **Decoration and large numerals only** |
| `--color-accent-strong` | `#7a5a26` (5.7:1) | `#d9bd84` (9.7:1) | Accent text, eyebrows, links |
| `--color-line` / `-strong` | `#d8ccb4` / `#bfae8b` | `#30424a` / `#4a6069` | Borders, rules |
| `--color-focus` | `#7a5a26` | `#d9bd84` | Focus ring |
| `--color-inverse-*` | bg `#1c2620`, ink 12.9:1, muted 8.1:1, accent 8.0:1 | bg `#e9e0cf`, ink 11.9:1, muted 5.9:1, accent 4.8:1 | Countdown + footer (`.section--inverse` remaps the base tokens) |
| `--color-seal*`, `--color-paper-*` | burgundy wax, paper tints | | Envelope artwork |
| `--color-btn-*`, `--color-ok`, `--color-error` | | | Interactive/state colours |

### Material tokens (defined per theme in `themes.css`)
| Token | ivory | midnight | Use |
|---|---|---|---|
| `--grain` | warm-brown noise, alpha ≈ 0.34 | pale noise, alpha ≈ 0.2 | The paper grain tile (see Materials) |
| `--color-plate` / `--color-plate-deep` | `#e6dcc6` / `#d6c8a8` | `#243842` / `#1a2a32` | Tonal ground of arch plates, venue plate and image frames (also what shows while a photograph loads) |
| `--color-sun` | surface tinted toward white | `rgb(217 189 132 / .55)` | The low sun on the drawn hero/venue plates |
| `--color-emboss-hi` | `rgb(255 255 255 / .7)` | `rgb(255 240 210 / .16)` | Letterpress highlight (envelope, pressed type) |
| `--wash-low`, `--wash-high` | 58 % / 20 % | 82 % / 48 % | How much of the page colour veils the foot of the hero photograph (see Photography) |

Interactive states: hover = background/border shift (only under `@media (hover: hover)`), pressed = `scale(.985)`, focus = 2 px `--color-focus` outline with 3 px offset, selected choice = inverted fill. Photograph frames lift 3 px on hover-capable devices.

## Typography
| Family | Role | Faces loaded |
|---|---|---|
| Cormorant Garamond | Display names, editorial headings, lead copy, quotes, numerals | 300, **300 italic**, 400, 400 italic |
| Montserrat | Labels, navigation, buttons, body copy in dense sections | 400, 500 |
| Great Vibes | One script accent: the hero greeting | 400 |

The system relies on **roman/italic contrast at very different scales** rather than more families or weights: the hero sets the first name in light roman and the second in light italic; years, times, folios and the countdown are italic numerals. `font-synthesis: none` is set so a missing face is visible instead of faked.

Each face has a Latin and a Latin-Extended file; the browser downloads the extended one only when the page contains characters from it (`unicode-range`). Cyrillic, Greek and Vietnamese are not included (system fallback).

Fluid scale (`clamp()`, 360 → ~1440 px viewport unless noted):

| Token | Range | Role |
|---|---|---|
| `--fs-display` | 4.25 → 13 rem, **also capped at 20 svh** | Hero names (the height cap keeps the composition inside short desktop windows) |
| `--fs-closing` | 3.25 → 8.5 rem | Names in the closing footer |
| `--fs-count` | 3.25 → 10 rem | Countdown numerals |
| `--fs-folio` | 3 → 6.5 rem | Oversized chapter years |
| `--fs-h2` | 2.6 → 6.25 rem | Section headings |
| `--fs-h3` | 1.6 → 2.25 rem | Card/step titles |
| `--fs-lead` | 1.3 → 1.75 rem | Introductory text, dates, addresses |
| `--fs-script` | 2 → 3.25 rem | Greeting |
| `--fs-body` | 0.94 → 1.06 rem | Body copy |
| `--fs-caption` / `--fs-label` / `--fs-nav` / `--fs-button` | 0.81 / 0.72 / 0.75 / 0.75 rem | Captions, small-caps labels, nav, buttons |
| countdown labels | 0.64 → 0.72 rem | Smallest text on the page; an e2e test fails if any visible text is < 10 px |

Long names: `components/ui/nameScale.ts` shrinks the display size (floor 0.4×) when a first name exceeds eight characters; the hero and the footer both use it, and a minimum ampersand size keeps it legible. Verified with 20-character names at 360, 768 and 1920 px.

Folio numbers (`01 — Our story`) are generated by a CSS counter (`main { counter-reset: scene }`, `.heading { counter-increment: scene }`), so they renumber when the config drops a section. They are decorative and not in the accessibility tree.

Form inputs are always 16 px (prevents iOS focus-zoom).

## Spacing, layout, shape
- Scale `--space-1…10` (0.25 → 8 rem); `--section-y` and `--gutter` are fluid. Gutters respect `env(safe-area-inset-*)`.
- Widths: `--w-prose` 38 rem, `--w-content` 68 rem, `--w-wide` 88 rem. `.container`, `.container--wide`, `.container--prose`.
- Breakpoints (CSS variables can't be used in media queries): **30 rem** (phone → large phone), **48 rem** (tablet: inline nav, hero goes asymmetric, gallery goes 12-column), **64 rem** (desktop: story/venue/schedule/RSVP spreads, vertical hero date), **90 rem** reserved.
- The editorial grid is 12 columns inside `.container--wide`; scenes place themselves on it (story plate 9–13, venue plate 1–7 with the info column starting at 6 so the heading crosses the plate edge, gallery spans 5/6/4/4 columns).
- Radii: `--radius-sm` 2 px, `--radius-md` 4 px, `--radius-pill`. The arch is `border-radius: 999px 999px 0 0`. Shadows `--shadow-sm/md/lg`.
- Touch targets ≥ 44 px (buttons are 48 px; nav links 44 px) — enforced by an e2e test at all six viewports.

## Scenes (what each section is)
| Section | Composition | Key classes |
|---|---|---|
| Opening | Lit paper room, envelope with stitched flap, cast shadow and tissue liner; the card inside previews the hero's arch | `.gate`, `.env*` |
| Hero | Names at display scale, first roman-left and second italic-right, crossing an arched plate (drawn, or a photograph); vertical date ≥ 64 rem | `.hero__arch`, `.hero__window`, `.hero__name--a/b` |
| Story | Vellum arch with a pressed sprig; pull-quote at display scale; chapter years step down the page | `.story__*`, `.chapters` |
| Countdown | Italic numerals on a ruled line with ruler ticks; faint outlined monogram behind | `.countdown__grid`, `.countdown__mark` |
| Schedule | Printed programme: ruled rows, large italic times, vertical rule, place right-aligned | `.timeline*` |
| Venue | Tall plate (drawn or photograph) with the name crossing its edge; vellum info card overlapping its foot | `.venue__plate`, `.venue__details` |
| Details | Two columns, oversized italic numerals | `.detail*` |
| Gallery | Mount board; four crops rotating by position | `.gallery__grid`, `.plate*` |
| RSVP | Reply card with perforated edge and underlined fields | `.rsvp__form` |
| Closing | Envelope-flap "V" cut into the page, seal on its point | `.footer::before`, `.footer__seal` |

## Materials
- **Paper grain** (`.paper`, and the same `--grain` layered into envelope, letter, hero/venue plates, frames, reply card): one 160 px tile, an inline SVG using `feTurbulence`. Because it is used as a CSS `background-image`, the browser rasterises it **once**; there is no live filter and no per-frame cost. Opacity differs by theme.
- **Emboss**: a 1 px highlight (`--color-emboss-hi`) on the envelope edge and the letter's pressed type.
- **Vellum**: translucent `--color-surface` over the page with a hairline border (venue card, story plate).
- **Perforation**: a repeating radial-gradient on the reply card's top edge that bites semicircles out of it.
- **Hairlines**: 1 px `--color-line`; stitched edges on the envelope are dashed accent strokes.
- No blend modes, no background-clip text, no animated filters. `-webkit-text-stroke` is used once, for the outlined countdown monogram.

## Photography
Hero, venue and gallery photographs are supplied through config (`hero.image`, `venue.image`, `gallery.images[]`); each is an `ImageAsset` with `src`, `alt`, `width`, `height` and optional `srcSet`, `focus` and `caption`. One component, `components/ui/Photo.tsx`, renders all of them:

- **Responsive**: `srcSet` ("path 560w, path 1120w", paths resolved like `src`) plus a `sizes` value chosen by the caller for its slot (hero `(min-width: 768px) 30vw, 72vw`; venue `(min-width: 1024px) 46vw, 92vw`; gallery `(min-width: 768px) 46vw, 90vw`). The sample uses WebP at two widths per photograph.
- **Art-directed crops**: every photograph is cropped by CSS (`object-fit: cover`) to the frame the layout gives it; `focus` ("x% y%") steers the crop. Gallery frames rotate by position: **4:5, 5:4, 1:1, 3:4**, then repeat, so supply landscape and portrait images in that rhythm for best results. The hero arch is about 3:5 on desktop and nearly square on phones (use a portrait photograph with the subject near the centre); the venue plate is 4:5.
- **No layout shift**: frames reserve space from CSS aspect ratios and the `width`/`height` attributes; measured CLS with 5 s-delayed images: 0.005.
- **Loading**: hero images are `eager` (they sit behind the envelope and must be ready when it opens); venue and gallery are `lazy`; capture mode forces `eager`. While a photograph loads, its frame shows the tonal `--color-plate` ground; once loaded it fades in over 0.8 s (opacity only; no transition under reduced motion or capture).
- **Failure**: a missing or failed image never shows a broken-image icon. Hero → the drawn plate (low sun and sprigs); venue → the orangery line drawing; gallery → the generated botanical plate. Omitting the image from config gives the same fallbacks.
- **Hero legibility**: the names overlap the photograph, so a wash of the page colour (`--wash-low/high`, theme-aware) rises from its foot. In Midnight it is darker and stronger so the ivory names stay readable over bright areas.
- **Warm cast**: a 12 % accent-colour layer over gallery and venue photographs ties differently graded images to the paper (one gradient layer, no filter).
- **Mounting**: the venue and hero plates inset the photograph 8 px inside an arch/rectangle mat; gallery frames have a 0.5–1 rem paper mat and a hairline print finish.

The sample photographs are **development placeholders** from openly licensed originals (credits in `invitation/public/photos/CREDITS.md`, regenerated by `invitation/scripts/prepare-photos.mjs`). They are not photographs of the fictional couple.

## Motion tokens
`--dur-fast .18s`, `--dur-base .45s`, `--dur-slow .9s`; `--ease-out cubic-bezier(.22,1,.36,1)`, `--ease-in-out cubic-bezier(.65,0,.35,1)`. Mirrored in `components/animations/tokens.ts` — change both. Patterns and ownership: [animation-guide.md](animation-guide.md).

## Layers
`--z-base 0 · --z-raised 2 · --z-nav 40 · --z-menu 45 · --z-gate 100` (+1 for the skip link).

## Themes
`ivory` (default) and `midnight` (dark teal with champagne). Switching is `theme.name` in config; no component changes. Both themes define every colour and material token above, and both have been captured (`docs/screenshots/after/*midnight*`). To add a theme: copy a `[data-theme='…']` block in `themes.css` (colour **and** material tokens), add the name to `ThemeName` (`config/types.ts`) and to the validator and `THEME_BG` (`vite.config.ts`, used for `<meta name="theme-color">`).

Per-couple tweaks without touching CSS: `theme.overrides` in config, e.g. `{ accent: '#8a9a7b', 'accent-strong': '#4f5f43' }`. Keys are `bg, bg-alt, surface, ink, ink-muted, accent, accent-strong, line, inverse-bg, inverse-ink`. Material tokens are not overridable through config. **Re-check contrast** after overriding (see ratios above for the targets).

## Artwork
Original inline SVG: wax seal, botanical sprig (procedurally generated stem and leaves), orangery line drawing, envelope. They are the fallbacks described under Photography. The earlier `public/gallery/*.svg` illustrations were removed; the generated botanical plate replaces them.
