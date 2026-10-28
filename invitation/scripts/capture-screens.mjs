// Captures the redesign's screenshots with the real app and the deterministic capture mode.
//
//   npm run build && npm run build:test
//   npx vite preview --port 4173 &  npx vite preview --outDir dist-test --port 4174 &
//   node scripts/capture-screens.mjs <outDir> [prodBase=http://localhost:4173] [testBase=http://localhost:4174]
//
// Per viewport: gate (closed envelope), hero, full page (ivory, and midnight via the test build), plus the
// envelope-opening frames at 1440 and 390 wide. Readiness is the app's own marker, never a fixed delay.
import { chromium } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { weddingConfig } from '../src/config/wedding.ts'

const [out = 'screens', prod = 'http://localhost:4173', test = 'http://localhost:4174'] = process.argv.slice(2)
const FROZEN = '?capture&now=2027-01-01T00:00:00Z'
const VIEWPORTS = [
  [360, 800], [390, 844], [768, 1024], [1024, 768], [1440, 1000], [1920, 1080],
]
await mkdir(out, { recursive: true })
const browser = await chromium.launch()
/** Wait until the gate's finite entrance animation has finished. */
const settle = (page) => page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished.catch(() => undefined))))
const ready = (page) => page.waitForSelector('html[data-capture-ready="true"]', { timeout: 15000 })

for (const [width, height] of VIEWPORTS) {
  const name = `${width}x${height}`
  const ctx = await browser.newContext({ viewport: { width, height } })
  const page = await ctx.newPage()

  await page.goto(`${prod}/`)
  await page.locator('.env').waitFor()
  await page.evaluate(() => document.fonts.ready)
  await settle(page)
  await page.screenshot({ path: `${out}/gate-${name}.png` })

  await page.goto(`${prod}/${FROZEN}`)
  await ready(page)
  await page.screenshot({ path: `${out}/hero-${name}.png` })
  if (width === 1440 || width === 390 || width === 360) await page.screenshot({ path: `${out}/full-${name}.png`, fullPage: true })

  if (test && (width === 390 || width === 1440)) {
    const mid = structuredClone(weddingConfig)
    mid.theme = { name: 'midnight' }
    const p2 = await ctx.newPage()
    await p2.addInitScript((c) => { window.__WEDDING_CONFIG__ = c }, mid)
    await p2.goto(`${test}/${FROZEN}`)
    await ready(p2)
    await p2.screenshot({ path: `${out}/hero-midnight-${name}.png` })
    await p2.screenshot({ path: `${out}/full-midnight-${name}.png`, fullPage: true })
    await p2.close()
  }
  await ctx.close()
}

// The opening sequence, as frames (live animation, so these are samples, not a feel-test).
for (const [width, height] of [[1440, 1000], [390, 844]]) {
  const ctx = await browser.newContext({ viewport: { width, height } })
  const page = await ctx.newPage()
  await page.goto(`${prod}/`)
  await page.locator('.env').waitFor()
  await page.evaluate(() => document.fonts.ready)
  await settle(page)
  await settle(page)
  await page.locator(".env").hover().catch(() => undefined)
  await page.screenshot({ path: `${out}/open-0-hover-${width}.png` })
  await page.locator('.env').click()
  for (const [i, ms] of [350, 700, 700, 600].entries()) {
    await page.waitForTimeout(ms)
    await page.screenshot({ path: `${out}/open-${i + 1}-${width}.png` })
  }
  await page.locator('.gate').waitFor({ state: 'detached', timeout: 8000 })
  await page.waitForTimeout(1800)
  await page.screenshot({ path: `${out}/open-5-hero-${width}.png` })
  await ctx.close()
}
await browser.close()
console.log(`screenshots written to ${out}`)
