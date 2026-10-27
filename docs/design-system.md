# Design System

Concept: **paper & ink**. Warm ivory stationery, deep ink-green type, one champagne accent for hairlines and numerals, a dark inverse band for the countdown and footer. Thin rules, generous negative space, asymmetric editorial layouts, wide-tracked small caps. Nothing glows; nothing gradient-fills text.

All files live in `invitation/src/styles/` and are loaded by `index.css`.

| File | Contents |
|---|---|
| `tokens.css` | Fonts, type scale, spacing, layout widths, radii, shadows, motion, z-index |
| `themes.css` | Semantic colour tokens per theme (`ivory`, `midnight`) |
| `fonts.css` | `@font-face` for the 6 self-hosted faces (+ 6 Latin-Extended files, loaded on demand) |
| `base.css` | Reset, focus, `.container`, `.section`, `.sr-only`, skip link, scroll behaviour |
| `type.css` | `.eyebrow`, `.label`, `.h2`, `.h3`, `.lead`, `.script`, `.numeral` |
| `ui.css` | Buttons, ornament, form controls |
| `gate.css`, `nav.css`, `sections.css` | Component styles |
| `motion.css` | Reduced-motion rules for CSS-driven movement |

## Colour (semantic tokens)
Components only use `--color-*` names; themes redefine them. Contrast ratios below were **computed** (WCAG relative luminance), not estimated.

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

Interactive states: hover = background/border shift (only under `@media (hover: hover)`), pressed = `scale(.985)`, focus = 2 px `--color-focus` outline with 3 px offset, selected choice = inverted fill.

## Typography — three families
| Family | Role | Faces loaded |
|---|---|---|
| Cormorant Garamond | Display, headings, lead copy, quotes, numerals | 300, 400, 400 italic |
| Montserrat | Labels, navigation, buttons, body copy in dense sections | 400, 500 |
| Great Vibes | One script accent: the hero greeting | 400 |

Playfair Display and Marcellus were evaluated and dropped: Cormorant already supplies the editorial contrast and a third serif adds noise. `font-synthesis: none` is set so a missing weight is visible instead of faked.

Each face has a Latin-1 file and a Latin-Extended file; the browser downloads the extended one only when the page contains characters from it (`unicode-range`). Cyrillic, Greek and Vietnamese are not included.

Fluid scale (360 → 1440 px viewport, `clamp()`):

| Token | Range | Role |
|---|---|---|
| `--fs-display` | 4 → 10 rem | Hero names |
| `--fs-h2` | 2.5 → 4.75 rem | Section headings |
| `--fs-numeral` | 2.5 → 5.5 rem | Countdown, story years |
| `--fs-h3` | 1.6 → 2.25 rem | Card/step titles, quotes |
| `--fs-lead` | 1.3 → 1.75 rem | Introductory text, dates |
| `--fs-script` | 2 → 3.25 rem | Greeting |
| `--fs-body` | 0.94 → 1.06 rem | Body copy |
| `--fs-caption` / `--fs-label` / `--fs-nav` / `--fs-button` | 0.81 / 0.72 / 0.75 / 0.75 rem | Captions, small caps labels, nav, buttons |
| countdown labels | 0.64 → 0.72 rem | Smallest text on the page; an e2e test fails if any visible text is < 10 px |

Form inputs are always 16 px (prevents iOS focus-zoom).

## Spacing, layout, shape
- Scale `--space-1…10` (0.25 → 8 rem); `--section-y` and `--gutter` are fluid. Gutters respect `env(safe-area-inset-*)`.
- Widths: `--w-prose` 38 rem, `--w-content` 68 rem, `--w-wide` 82 rem. `.container`, `.container--wide`, `.container--prose`.
- Breakpoints (CSS variables can't be used in media queries): **30 rem** (phone → large phone), **48 rem** (tablet: inline nav), **64 rem** (desktop: two-column sections, 3-column gallery), **90 rem** reserved.
- Radii: `--radius-sm` 2 px, `--radius-md` 4 px, `--radius-pill`, `--radius-arch` (hero). Shadows `--shadow-sm/md/lg`.
- Touch targets ≥ 44 px (buttons are 48 px; nav links 44 px) — enforced by an e2e test at all six viewports.

## Motion tokens
`--dur-fast .18s`, `--dur-base .45s`, `--dur-slow .9s`; `--ease-out cubic-bezier(.22,1,.36,1)`, `--ease-in-out cubic-bezier(.65,0,.35,1)`. Mirrored in `components/animations/tokens.ts` — change both.

## Layers
`--z-base 0 · --z-raised 2 · --z-nav 40 · --z-menu 45 · --z-gate 100` (+1 for the skip link).

## Themes
`ivory` (default) and `midnight` (dark teal with champagne). Switching is `theme.name` in config; no component changes. To add a theme: copy a `[data-theme='…']` block in `themes.css`, add the name to `ThemeName` (`config/types.ts`) and to the validator and `THEME_BG` (`vite.config.ts`, used for `<meta name="theme-color">`).

Per-couple tweaks without touching CSS: `theme.overrides` in config, e.g. `{ accent: '#8a9a7b', 'accent-strong': '#4f5f43' }`. Keys are `bg, bg-alt, surface, ink, ink-muted, accent, accent-strong, line, inverse-bg, inverse-ink`. **Re-check contrast** after overriding (see ratios above for the targets).

## Texture and artwork
Original inline SVG only: wax seal, botanical sprig (procedurally generated stem + leaves), orangery line drawing, envelope, four gallery illustrations in `public/gallery/`. No SVG filters, no blend modes, no background-clip text. The only background effect is one static radial gradient behind the hero and gate.
