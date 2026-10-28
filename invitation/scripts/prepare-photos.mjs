// Builds the sample photographs in public/photos/ from openly licensed originals on Wikimedia Commons.
//
//   node scripts/prepare-photos.mjs
//
// Needs: curl, sips (macOS) and cwebp (brew install webp). For each entry it downloads a 2400 px rendition,
// crops it to the art-directed ratio the layout uses, encodes WebP at two widths, and (re)writes
// public/photos/CREDITS.md from the licence metadata Commons reports at run time.
//
// These are DEVELOPMENT PLACEHOLDERS. They are not photographs of the fictional couple (or of any real couple
// who agreed to appear on this site). Replace them with your own photographs and delete CREDITS.md entries you no longer use.
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const OUT = new URL('../public/photos/', import.meta.url).pathname
const UA = 'wedding-template-dev/1.0 (https://github.com/george-chandy/wedding-invitation-template)'
const WIDTHS = { portrait: [560, 1120], square: [560, 1100], landscape: [640, 1280] }

/**
 * crop = [x, y, w, h] as fractions of the downloaded image. `ratio` is the layout slot the crop is made for.
 * (Slots: hero arch ≈ 3:4, venue plate 4:5, gallery 4:5 / 5:4 / 1:1 / 3:4.)
 */
const PHOTOS = [
  { id: 'hero-embrace', title: 'Wedding couple at old building (Unsplash BLx6ystEhk).jpg', crop: [0.1, 0, 0.52, 1], kind: 'portrait' },
  { id: 'venue-palm-house', title: 'Wedding In Copenhagen at the Botanical Gardens (Unsplash).jpg', crop: [0.23, 0, 0.533, 1], kind: 'portrait' },
  { id: 'gallery-dress', title: 'Wedding dress hangs from chandelier (Unsplash).jpg', crop: [0, 0.04, 1, 0.83], kind: 'portrait' },
  { id: 'gallery-rings', title: 'Bride holds wedding bands (Unsplash).jpg', crop: [0.12, 0, 0.833, 1], kind: 'landscape' },
  { id: 'gallery-church', title: 'Church on the morning of the wedding (Unsplash).jpg', crop: [0.05, 0, 0.667, 1], kind: 'square' },
  { id: 'gallery-bouquet', title: 'Bride with a regal bouquet (Unsplash).jpg', crop: [0, 0.05, 1, 0.87], kind: 'portrait' },
  { id: 'gallery-hands', title: 'Groom touching wedding band (Unsplash).jpg', crop: [0.25, 0, 0.533, 1], kind: 'portrait' },
  { id: 'gallery-footbridge', title: 'Wedding couple on a footbridge (Unsplash).jpg', crop: [0, 0, 0.833, 1], kind: 'landscape' },
]

const sh = (cmd, args) => execFileSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
const tmp = mkdtempSync(join(tmpdir(), 'photos-'))
mkdirSync(OUT, { recursive: true })
const strip = (html = '') => html.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim()

async function meta(title) {
  const url = 'https://commons.wikimedia.org/w/api.php?' + new URLSearchParams({
    action: 'query', format: 'json', titles: `File:${title}`, prop: 'imageinfo', iiprop: 'extmetadata|url',
  })
  const res = await fetch(url, { headers: { 'User-Agent': UA } })
  const page = Object.values((await res.json()).query.pages)[0]
  const ii = page.imageinfo[0]
  const m = ii.extmetadata
  return { author: strip(m.Artist?.value), license: strip(m.LicenseShortName?.value), licenseUrl: m.LicenseUrl?.value ?? '', page: ii.descriptionurl }
}

const credits = []
for (const p of PHOTOS) {
  const info = await meta(p.title)
  if (!/^(CC0|Public domain)/i.test(info.license)) throw new Error(`${p.title}: unexpected licence "${info.license}" — refusing to ship it`)
  const orig = join(tmp, `${p.id}.jpg`)
  sh('curl', ['-sSL', '-m', '120', '-A', UA, '-o', orig, `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(p.title)}?width=2400`])
  const dim = sh('sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', orig])
  const W = Number(/pixelWidth: (\d+)/.exec(dim)[1])
  const H = Number(/pixelHeight: (\d+)/.exec(dim)[1])
  const [fx, fy, fw, fh] = p.crop
  const cw = Math.round(W * fw), ch = Math.round(H * fh)
  const cropped = join(tmp, `${p.id}-crop.jpg`)
  sh('sips', ['-c', String(ch), String(cw), '--cropOffset', String(Math.round(H * fy)), String(Math.round(W * fx)), orig, '--out', cropped])
  const sizes = []
  for (const w of WIDTHS[p.kind]) {
    const resized = join(tmp, `${p.id}-${w}.jpg`)
    sh('sips', ['--resampleWidth', String(w), cropped, '--out', resized])
    const out = `${OUT}${p.id}-${w}.webp`
    sh('cwebp', ['-quiet', '-q', '74', '-m', '6', '-sharp_yuv', resized, '-o', out])
    sizes.push({ w, h: Math.round((ch / cw) * w), bytes: statSync(out).size })
  }
  credits.push({ ...p, ...info, sizes })
  console.log(p.id, sizes.map((s) => `${s.w}×${s.h} ${(s.bytes / 1024).toFixed(0)}kB`).join('  '))
}

const md = `# Photo credits (development placeholders)

These images are **stand-ins** so the template can be reviewed with photography. They are **not** photographs of the
fictional couple, and the people in them have no connection to this invitation. Replace them with your own photographs
(see \`docs/template-customization.md\`, "Supplying your own photographs"), then delete the entries you no longer use.

All originals are dedicated to the public domain (CC0) or are public domain, as reported by Wikimedia Commons at the
time \`scripts/prepare-photos.mjs\` was run. No attribution is legally required; it is given anyway. Crops and WebP
re-encodes were made by the script.

| File (widths) | Original on Commons | Author (as listed) | Licence |
|---|---|---|---|
${credits.map((c) => `| \`${c.id}-*.webp\` (${c.sizes.map((s) => s.w).join(', ')}) | [${c.title}](${c.page}) | ${c.author.replace(/\|/g, '/')} | ${c.license}${c.licenseUrl ? ` ([text](${c.licenseUrl}))` : ''} |`).join('\n')}
`
writeFileSync(`${OUT}CREDITS.md`, md)
writeFileSync(join(tmp, 'sizes.json'), JSON.stringify(credits.map((c) => ({ id: c.id, sizes: c.sizes })), null, 1))
console.log('\nsizes (for config):\n' + readFileSync(join(tmp, 'sizes.json'), 'utf8'))
