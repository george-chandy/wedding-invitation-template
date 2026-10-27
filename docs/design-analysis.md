# Design Analysis — Wedding Invitation Reference

Reference: https://ayisha-shahidrizwan.vercel.app/ (a single-page digital wedding invitation).
Legend: **[O]** observed (screenshot, live DOM, CSS, or report), **[E]** estimated.

## 1. Reference overview

- **[O]** One-page, React + Tailwind (Vite build) invitation. Title/meta confirm it is a wedding invitation.
- **[O]** Visual identity: "vintage romance / luxury stationery". Warm ivory paper, metallic-gold text gradient, silk-and-petal textures, thin gold rules with a four-point star ornament, rounded "card" panels with soft shadows.
- **[O]** Flow: full-screen video gate (sealed envelope, "TAP TO OPEN") → video plays → invitation card with a "Scroll down" pill → page unlocks.
- **[O]** The shipped inspection screenshots are **misleading**: `desktop-full.png` shows almost blank sections because content is revealed on scroll and `body` is `overflow:hidden` until the gate is opened. Findings below come from the live page after clicking through and scrolling (1440×1000 and 390×844).
- **[O]** The reference contains a real couple's names, family details, venue and religious text, plus a video and photographs. **None of that is reused**; the recreation uses fictional content and original, code-drawn art.

## 2. Section-by-section breakdown (desktop, document height 6547px)

| # | Section | Observed |
|---|---|---|
| 0 | **Gate** (100svh) | [O] Video centered in a max-width 620px column, `object-cover` on mobile / `object-contain` ≥sm. Soft radial ivory background. Bottom fade (ivory gradient). "TAP TO OPEN" (Marcellus, wide tracking) + italic Cormorant subline with names/date. After click the video plays, then shows script "Together with their families", big names, flourish divider, date/time, "SCROLL DOWN" pill with chevron, and small tracked subline. |
| 1 | **Couple** `#couple` (py-20, bg `#faf6f0`) | [O] Silk texture at 30% opacity + vertical ivory gradient. Ornament (rule · star · rule), Arabic calligraphy gold-gradient heading, tracked English translation, quote card (max ≈670px, radius ≈24px, hairline border, italic Cormorant quote, tracked citation). Then 2-col: **hero card** (gold-gradient frame, inner hairline frame with corner brackets, monogram seal in dotted ring, tagline, huge italic names, "&" divider, italic line, two residence labels) beside an **image card** (framed illumination art, dark overlay, caption "Blessings…"). Below: two **person cards** (THE BRIDE / THE GROOM): italic gold name, wax-seal badge top-right, label/value rows split by hairlines (parents, residence, siblings). |
| 2 | **Countdown** (py-24, bg `#f4ecde`, borders top/bottom `#e3d3b6`) | [O] Silk/petal background. Eyebrow, H2 "The Big Day Awaits", date line, four white tiles (DAYS/HOURS/MINUTES/SECONDS) separated by ":" , two pill buttons (gold gradient "Add to Google Calendar" opens a Google Calendar template URL; white outline ".ics" download), small italic note with clock icon. |
| 3 | **Schedule** (bg `#faf6f0`) | [O] Eyebrow with side rules, H2, star divider, italic subtitle; one centered card (max ≈670px, top gold hairline) with seal, date pill + time pill, H3, italic quote, location pill. |
| 4 | **Venue** (bg `#f7f2ea`) | [O] Header block as above; 2-col grid (~40/60): left info card (icon tile, name, address, gold "Open location link", outline "Google Maps", outline "Apple Maps", tinted "Copy address") + "Getting to the venue" list card (icon, place, right-aligned distance); right: embedded live Google Map in a gold-bordered rounded frame with "LIVE MAP VIEW" chip. |
| 5 | **Footer** (gradient `#f5ebd9`→`#ecdcbd`) | [O] Silk texture, seal, eyebrow, big gold italic names, star divider, tracked date·venue, italic thank-you quote, residences, "BACK TO TOP" pill, hairline, credit line. |

## 3. Design tokens

### Colors
| Token | Value | Basis |
|---|---|---|
| page bg | `#faf7f2` / section `#faf6f0` | [O] body + `#couple`, schedule |
| band bg (countdown) | `#f4ecde` | [O] |
| venue bg | `#f7f2ea` | [O] |
| gate bg | `#f6eee3` | [O] |
| footer gradient | `#f5ebd9 → #ecdcbd` | [O] |
| text | `#342d24` / `#342c22` | [O] |
| text strong | `#2b2218` | [O] |
| text muted | `#8c7450`, `#7a6549`, `#736049` | [O] |
| gold accent | `#ba924b` (rules, icons, eyebrows) | [O] most used |
| gold light | `#e6cd96`, `#c5a880` | [O] |
| gold text gradient | `linear-gradient(135deg,#7a5215 0%,#b8862d 40%,#8f601b 100%)` clipped to text | [O] CSS `.gold-text` |
| borders | `#d6c19e`, `#e0cfba`, `#e3d3b6`, `#ede3d2`, `#e5dac9` | [O] |
| selection | bg `#e2cfa7`, text `#2b2115` | [O] |

### Radii / shadows / borders
- [O] Cards ≈ 24–28px radius (`rounded-3xl`), small panels 12px (`rounded-xl`), buttons/pills fully rounded.
- [O] Hairline 1px borders in warm beige; gold hairline across card tops.
- [E] Shadow: large, very soft, warm-tinted (≈ `0 20px 50px -20px rgba(120,85,30,.25)`); button `shadow-sm`.

## 4. Typography

| Role | Family | Size / weight / tracking | Basis |
|---|---|---|---|
| Section H2 | Playfair Display | 60px (desktop) / 400 / +1.5px, gold gradient | [O] |
| Names (hero) | Playfair Display **italic** | 96px & 72px / 600 / −0.01em | [O] |
| Card H3 | Playfair Display | 48px / 600 | [O] |
| Caption H4 | Cormorant Garamond | 36px / 600 | [O] |
| Body & quotes | Cormorant Garamond, often italic | 16–20px [E] | [O] family |
| Labels / buttons | Marcellus (fallback Cinzel) | 10–12px / 600–700 / 0.1–0.3em tracking, uppercase | [O] |
| Utility body | Montserrat | 14–16px | [O] (address list) |
| Script ("Together with…") | script face (Alex Brush / Great Vibes loaded) | [E] ~28–32px | [O] loaded, [E] which one |
| Arabic | Aref Ruqaa | 60px / 400 | [O] — **not used** in recreation |

Line-heights: headings ≈ 1.08–1.35 [O]; quotes ≈ 1.8 [E].

## 5. Layout & spacing
- [O] Section padding `py-20`/`py-24` (80/96px), `px-4 sm:px-6`.
- [O] Narrow centered cards ≈ 670px; wide grids ≈ 1150px (venue) / ≈ 1020px (couple).
- [O] Everything centered; eyebrow labels flanked by gradient hairlines.
- [O] Cards use stacked rows separated by 1px rules.

## 6. Component inventory
Gate/envelope, Ornament divider (rule·star·rule), SectionHeader (eyebrow/H2/divider/subtitle), Seal/monogram badge, QuoteCard, HeroCard (double frame + corner brackets), ImageCard, PersonCard, CountdownTile, PillButton (gold / outline / tint), Pill tag (date/time/place), InfoRow list, MapFrame, Footer, BackToTop, floating petals (keyframe `floatPetal` exists in CSS [O]).

## 7. Interaction inventory
- [O] Tap-to-open gate; body scroll locked until opened.
- [O] Live countdown (1s tick).
- [O] Google Calendar link; `.ics` download; Copy Address; Maps links; Back to top (smooth scroll, `scroll-smooth` on `<html>`).
- [O] Scroll-reveal on sections (fade/slide, ~250ms ease-out observed on web animations).
- [O] CSS keyframes: `floatPetal`, `scrollLine`, `goldShimmer`, 60s linear infinite ambient loops, `bounce` chevron.
- [O] Hover: buttons lighten background (`hover:bg-[#faf6ee]`), 150ms transitions.
- [E] No form; `forms: []` in the report.

## 8. Responsive behavior
- [O] ≥sm: gate video letterboxed in 620px column; names scale up (`text-6xl → 8xl`); 2-col grids.
- [O] <md: couple/venue grids collapse to one column; hero card full width; caption/eyebrow wrap; residences stack.
- [E] Breakpoints are Tailwind defaults (640/768/1024).

## 9. Asset inventory
| Asset | Status |
|---|---|
| Gate video, silk/petal textures, illuminated-frame art, monogram PNG | Belong to the reference author. **Not reused.** |
| Google Fonts (Playfair, Cormorant Garamond, Marcellus, Montserrat) | OFL; **reused**, self-hosted via `@fontsource`. |
| Google Maps embed | Not reused (needs third-party embed/API; see assumptions). |
| Replacements | Original inline SVG/CSS: envelope + wax seal, monogram, silk texture (SVG turbulence + gradients), framed botanical ornament, icons. |

## 10. Uncertainties and assumptions
- [E] Exact shadows, easing, and reveal distances are estimated.
- [E] Script font used for "Together with their families" not confirmed (several loaded).
- [O/limitation] Video content (envelope opening) was seen only as frames; the recreation substitutes a CSS/SVG envelope animation.
- [O] `failed-requests.json` shows `ERR_ABORTED` on the mp4 — normal for range-request streaming, not a site bug.
- The report's `animations` list is a snapshot at one instant and does not include scroll reveals; reveal behavior was verified live.
- The reference runs on Tailwind; the recreation uses plain CSS with tokens (no Tailwind).
