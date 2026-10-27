# Customising the template for a new couple

Everything a couple needs lives in **`invitation/src/config/wedding.ts`** plus files in **`invitation/public/`**. No component needs editing.

## 1. Edit the config
`weddingConfig` is typed (`src/config/types.ts`) and validated at start-up. A mistake shows a readable list in the browser instead of a blank page (and `npm run test:unit` covers the validator).

| Block | What it controls |
|---|---|
| `site` | `<html lang>`, page title, description, share image, public `url` (enables canonical + absolute `og:image`) |
| `couple.people` | Two people: `first` (hero, nav), `full` (calendar text), `role`, `family` lines. `monogram`: two letters on the wax seal |
| `event` | `date` (YYYY-MM-DD), `startTime`/`endTime` (HH:mm, 24 h), **`timezone` (IANA, e.g. `America/New_York`)**, optional `endDate` if it runs past midnight |
| `venue` | `name`, `address[]`, `description`, `travel[]` (icons: plane, train, car, bus, walk), optional `coordinates`, optional `mapsQuery` |
| `envelope` | `enabled` (false = no gate; the hero plays immediately), `hint`, `letterLine` |
| `hero` | Greeting (script line) and tagline |
| `story`, `countdown`, `schedule`, `details`, `gallery`, `rsvp` | Optional section content |
| `footer` | Eyebrow, message, credit (omit `credit` to remove it) |
| `sections` | **Ordered list of sections to render.** Remove an id to drop a section (also delete its data block, or leave it — unused data is ignored). Listing a section without its data is a validation error |
| `theme` | `name: 'ivory' \| 'midnight'`, optional `overrides` of colour tokens |
| `strings` | Override any UI string (button labels, announcements) — the way to translate the interface |

### Time and timezone
Enter the **local time at the venue** and the venue's IANA timezone. The template converts it to a UTC instant with `Intl` (DST-correct) and uses that for the countdown, Google Calendar (`dates` in UTC plus `ctz`) and the `.ics` (`DTSTART:…Z`). Dates and times shown on the page are formatted in the venue's timezone with `site.lang`, so visitors in other countries see venue time. Fixed offsets like `+01:00` are rejected.

### RSVP modes
| `mode` | Needs | Behaviour |
|---|---|---|
| `email` | `email` | Form builds a message and opens the guest's mail app. The page says nothing is stored. |
| `link` | `url` | A button to a form you already run (Google Forms, Typeform, …). |
| `endpoint` | `endpoint` | POSTs JSON `{name, attending, guests, notes}` to your provider (e.g. Formspree). "Thank you" shows only after a 2xx response. *Not verified against a live provider in this repo.* |
Omit the `rsvp` block (and the id in `sections`) for no RSVP section. There is no built-in backend and none is implied.

### Validation, safety rules and graceful degradation
- Everything the renderer relies on is validated; the error page lists every problem by config path. Unexpected shapes become a readable message, never a blank page.
- A section whose list is empty (`gallery.images`, `schedule.items`, `details.items`, or `story` with no message and no chapters) is **skipped automatically**, including its nav entry.
- Gallery images may omit `src` (placeholder plate) but need `alt`, `width`, `height`.
- `rsvp.endpoint` and `rsvp.url` must be **https** (plain http only for `localhost`). Setting `rsvp.endpoint` while `mode` is not `"endpoint"` is an error, so a leftover endpoint can never be submitted to by accident. In endpoint mode the form tells the guest which host receives the reply.
- `theme.overrides` accepts only the documented token names and plain colour values.
- Very long first names automatically shrink the hero type (full size up to 8 characters). Latin-Extended characters (Ł, Ş, Ř …) are supported; their font subset downloads only when such characters appear.
- If an individual section crashes while rendering, it is skipped and logged to the console; the rest of the page stays usable.

### Optional sections
Remove from `sections`: `story`, `countdown`, `schedule`, `venue`, `details`, `gallery`, `rsvp`, `footer`, `hero`. The nav lists whatever remains. `venue` needs no extra block. Without `hero` the nav is always visible.

## 2. Replace assets (`invitation/public/`)
- **Gallery:** put photos in `public/gallery/`, set `src: 'gallery/photo.jpg'`, and give honest `width`/`height` (intrinsic pixels — used for the aspect ratio so nothing shifts) and `alt`. Omit `src` for a generated placeholder; a missing/broken file falls back to the same placeholder. Use JPEG/WebP ≤ 1600 px wide; images are `loading="lazy"`. Responsive `srcset` is not generated — export sensible sizes.
- **Share image:** replace `public/og.png` (1200×630) and keep `site.shareImage` pointing at it. Set `site.url` for absolute URLs.
- **Favicon:** `public/favicon.svg`.
- **Fonts:** see `docs/design-system.md`. Fonts must stay OFL/licensed for web embedding.
- **Venue illustration:** `components/art/OrangeryArch.tsx` is a generic arched glasshouse; replace the SVG paths if desired.

## 3. Colours and fonts
- Switch `theme.name`, or override tokens in `theme.overrides` (see design-system.md; re-check contrast).
- Changing a family means editing `fonts.css` (+ `--font-*` in `tokens.css`) — keep to three families.

## 4. Copy and language
Page copy is in the config. UI strings: `src/content/strings.ts` (defaults) overridden by `config.strings`. Set `site.lang` (also drives date/time formatting).

## 5. Build and deploy
```bash
cd invitation
npm install
npm run dev        # http://localhost:5173
npm run build      # production build → dist/
npm run preview    # serve dist/ at http://localhost:4173
```
`vite.config.ts` uses `base: './'`, so `dist/` works from any folder or sub-path of a static host (Netlify, GitHub Pages, S3, …). Title/description/Open Graph/Twitter tags and `theme-color` are written into `dist/index.html` **at build time** from the config, so rebuild after editing it. Deployment itself is not part of this repo.

## 6. Checklist before sending
- [ ] Config validates (open the site; no red error page)
- [ ] Date, time, timezone and venue verified; open the calendar link and `.ics` and check the event
- [ ] RSVP address/URL works (send yourself a test)
- [ ] Gallery alt text written; images compressed
- [ ] Share image and `site.url` set; test the link in a chat app
- [ ] `npm test` passes (screenshot baselines will differ if you changed content — run `npx playwright test --update-snapshots`)
- [ ] Skim in reduced-motion mode (OS setting) and on a real phone

## Mapping from the original `content.ts`
`partnerA/partnerB` → `couple.people[].first/full` · `startsAt/endsAt` → `event.date/startTime/endTime/timezone` · `venue.heading/address/mapsQuery` → `venue.name/address[]/mapsQuery` · `gateHint` → `envelope.hint` · `intro`, `couple.*` → `story` · `schedule.event` → `schedule.items[]` · `countdown.done` → `countdown.during/after` · `footer.*` → `footer`.
