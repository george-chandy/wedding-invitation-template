import { expect, test } from '@playwright/test'
import { baseConfig, captureReady, gotoWith } from './helpers'

/**
 * The photographic layer: hero, venue and gallery photographs load responsively, reserve their space, fade in
 * without shifting layout, and every failure path falls back to the drawn art instead of a broken image.
 * (Runs against the test build, which accepts an injected configuration.)
 */
test.describe('photographs', () => {
  test('hero, venue and gallery photographs load, sized and responsive', async ({ page }) => {
    await gotoWith(page, () => undefined)
    await captureReady(page)
    const photos = page.locator('img.photo')
    await expect(photos).toHaveCount(2 + baseConfig().gallery!.images.length)
    for (const img of await photos.all()) {
      await expect(img).toHaveAttribute('width', /\d+/)
      await expect(img).toHaveAttribute('height', /\d+/)
      await expect(img).toHaveAttribute('srcset', /\.webp \d+w/)
      await expect(img).toHaveAttribute('data-state', 'loaded')
      expect(await img.evaluate((i: HTMLImageElement) => i.naturalWidth)).toBeGreaterThan(0)
    }
    // the drawn stand-ins are not rendered when photographs are present
    await expect(page.locator('.hero__sun, .venue__art, .plate [role="img"]')).toHaveCount(0)
  })

  test('the hero photograph is eager (it waits behind the envelope); venue and gallery are lazy outside capture mode', async ({ page }) => {
    await gotoWith(page, () => undefined, '')
    await expect(page.locator('.hero__window img.photo')).toHaveAttribute('loading', 'eager')
    await expect(page.locator('.venue__plate img.photo')).toHaveAttribute('loading', 'lazy')
  })

  test('failed photograph requests fall back to the drawn plates: no broken images, no page errors', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    await page.route('**/photos/**', (r) => r.abort())
    await gotoWith(page, () => undefined)
    await captureReady(page)
    await expect(page.locator('.hero__sun')).toHaveCount(1)
    await expect(page.locator('.venue__art')).toHaveCount(1)
    await expect(page.locator('.plate [role="img"]')).toHaveCount(baseConfig().gallery!.images.length)
    await expect(page.locator('img.photo')).toHaveCount(0)
    expect(errors).toEqual([])
  })

  test('with no photographs configured the drawn plates are used', async ({ page }) => {
    await gotoWith(page, (c) => {
      delete c.hero.image
      delete c.venue.image
      c.gallery!.images = c.gallery!.images.map(({ alt, width, height, caption }) => ({ alt, width, height, caption }))
    })
    await captureReady(page)
    await expect(page.locator('.hero__sun')).toHaveCount(1)
    await expect(page.locator('.venue__art')).toHaveCount(1)
    await expect(page.locator('.plate [role="img"]')).toHaveCount(baseConfig().gallery!.images.length)
    await expect(page.locator('img.photo')).toHaveCount(0)
  })

  test('slow photographs: frames keep their size while loading, layout shift stays small, images fade in once loaded', async ({ page }) => {
    await page.addInitScript(() => {
      ;(window as unknown as { __cls: number }).__cls = 0
      new PerformanceObserver((list) => {
        for (const e of list.getEntries() as unknown as { value: number; hadRecentInput: boolean }[]) if (!e.hadRecentInput) (window as unknown as { __cls: number }).__cls += e.value
      }).observe({ type: 'layout-shift', buffered: true })
    })
    await page.route('**/photos/**', async (r) => {
      await new Promise((res) => setTimeout(res, 1500))
      await r.continue().catch(() => undefined)
    })
    await gotoWith(page, () => undefined, '')
    await page.getByRole('button', { name: 'Skip to invitation' }).click()
    await page.evaluate(() => document.getElementById('gallery')!.scrollIntoView({ block: 'start', behavior: 'instant' }))
    const heights = () => page.evaluate(() => [...document.querySelectorAll('.plate__print')].map((e) => (e as HTMLElement).offsetHeight))
    const first = page.locator('.plate img.photo').first()
    await expect(first).toHaveAttribute('data-state', 'loading')
    await expect(first).toHaveCSS('opacity', '0') // the tonal frame shows, not a half-painted image
    const before = await heights()
    expect(before.every((h) => h > 100)).toBe(true) // space is reserved from width/height before any bytes arrive
    await expect(first).toHaveAttribute('data-state', 'loaded', { timeout: 10_000 })
    await expect(first).toHaveCSS('opacity', '1')
    expect(await heights()).toEqual(before)
    expect(await page.evaluate(() => (window as unknown as { __cls: number }).__cls)).toBeLessThan(0.02)
  })

  test('crop focus is applied per image and long galleries stay inside the page', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 })
    await gotoWith(page, (c) => {
      c.gallery!.images.push({ ...c.gallery!.images[1], caption: 'Seventh', focus: '10% 20%' })
    })
    await captureReady(page)
    await expect(page.locator('.plate')).toHaveCount(7)
    await expect(page.locator('.plate img.photo').last()).toHaveCSS('object-position', '10% 20%')
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0)
  })
})
