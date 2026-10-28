import { expect, test, type Page } from '@playwright/test'
import { captureReady, overflowing, watch } from './helpers'

const FROZEN = '?capture&now=2027-01-01T00:00:00Z'
const VIEWPORTS = [
  { name: '360x800', width: 360, height: 800 },
  { name: '390x844', width: 390, height: 844 },
  { name: '768x1024', width: 768, height: 1024 },
  { name: '1024x768', width: 1024, height: 768 },
  { name: '1440x1000', width: 1440, height: 1000 },
  { name: '1920x1080', width: 1920, height: 1080 },
]

async function openFast(page: Page) {
  await page.goto('/')
  await page.getByRole('button', { name: 'Skip to invitation' }).click()
  await expect(page.locator('.gate')).toHaveCount(0)
}

test.describe('capture mode (deterministic full-page screenshots)', () => {
  test('without ?capture visitors get the normal behaviour: envelope, hidden-until-scrolled sections, lazy images', async ({ page }) => {
    await page.goto('/?now=2027-01-01T00:00:00Z')
    await expect(page.locator('.gate')).toBeVisible()
    await expect(page.locator('html')).not.toHaveAttribute('data-capture', 'true')
    await page.getByRole('button', { name: 'Skip to invitation' }).click()
    await expect(page.locator('#venue-h').locator('xpath=..')).toHaveCSS('opacity', '0') // below the fold, not yet revealed
    await expect(page.locator('.plate img').first()).toHaveAttribute('loading', 'lazy')
    // the frozen-clock parameter is ignored outside capture mode
    const secs = await page.locator('.countdown__num').nth(3).textContent()
    await page.waitForTimeout(1200)
    expect(await page.locator('.countdown__num').nth(3).textContent()).not.toBe(secs)
  })

  test('?capture reveals everything with no scrolling, no envelope, eager images, frozen clock', async ({ page }) => {
    await page.goto(`/${FROZEN}`)
    await captureReady(page)
    await expect(page.locator('.gate')).toHaveCount(0)
    const hidden = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>('main *, footer *')].filter((el) => getComputedStyle(el).opacity === '0' && !el.closest('svg') && el.tagName !== 'INPUT').map((el) => el.className),
    )
    expect(hidden).toEqual([])
    expect(await page.locator('.plate img').evaluateAll((imgs) => imgs.every((i) => (i as HTMLImageElement).loading === 'eager' && (i as HTMLImageElement).complete && (i as HTMLImageElement).naturalWidth > 0))).toBe(true)
    expect(await page.evaluate(() => document.getAnimations().length)).toBe(0)
    const a = await page.locator('.countdown__num').allTextContents()
    await page.waitForTimeout(1300)
    expect(await page.locator('.countdown__num').allTextContents()).toEqual(a)
  })

  for (const vp of [VIEWPORTS[1], VIEWPORTS[4]]) {
    for (const reducedMotion of ['no-preference', 'reduce'] as const) {
      test(`full page at ${vp.name} (${reducedMotion}) is pixel-identical across runs and matches the baseline`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height })
        await page.emulateMedia({ reducedMotion })
        await page.goto(`/${FROZEN}`)
        await captureReady(page)
        const first = await page.screenshot({ fullPage: true })
        await page.reload()
        await captureReady(page)
        const second = await page.screenshot({ fullPage: true })
        expect(second.equals(first)).toBe(true)
        await expect(page).toHaveScreenshot(`full-${vp.name}.png`, { fullPage: true, maxDiffPixelRatio: 0.01 })
      })
    }
  }

  test('midnight theme full page is capturable and has no hidden content', async ({ page }) => {
    await page.goto(`/${FROZEN}`)
    await page.evaluate(() => (document.documentElement.dataset.theme = 'midnight'))
    await captureReady(page)
    await expect(page).toHaveScreenshot('full-midnight-390.png', { fullPage: true, maxDiffPixelRatio: 0.01 })
  })
})

test.describe('animation behaviour', () => {
  test('no continuous (infinite) animation exists, and nothing keeps running once the page settles', async ({ page }) => {
    await openFast(page)
    await page.waitForTimeout(3500) // hero entrance is ~2.5 s
    const state = await page.evaluate(() => {
      const anims = document.getAnimations()
      return {
        infinite: anims.filter((a) => (a.effect as KeyframeEffect).getComputedTiming().iterations === Infinity).length,
        running: anims.filter((a) => a.playState === 'running').length,
      }
    })
    expect(state).toEqual({ infinite: 0, running: 0 })
  })

  test('scrolling the whole page leaves no animation running afterwards (each reveal plays once and ends)', async ({ page }, info) => {
    await openFast(page)
    await page.waitForTimeout(3000)
    let peak = 0
    const total = await page.evaluate(() => document.documentElement.scrollHeight)
    for (let y = 0; y < total; y += 300) {
      await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), y)
      peak = Math.max(peak, await page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').length))
      await page.waitForTimeout(150)
    }
    info.annotations.push({ type: 'peak-running-animations', description: String(peak) }) // informational; depends on scroll speed and engine
    await expect.poll(() => page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').length), { timeout: 3000 }).toBe(0)
    // scrolling back up replays nothing
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
    // (the nav slides away as the hero returns — that settles; no reveal replays)
    await expect.poll(() => page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').length), { timeout: 3000 }).toBe(0)
    await expect(page.locator('#venue-h').locator('xpath=..')).toHaveCSS('opacity', '1')
  })

  test('scroll is unlocked after the envelope opens (and after the mobile menu closes)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    await expect(page.locator('html')).toHaveClass(/is-locked/)
    await page.locator('.env').click()
    await expect(page.locator('.gate')).toHaveCount(0, { timeout: 8000 })
    await expect(page.locator('html')).not.toHaveClass(/is-locked/)
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).overflow)).not.toBe('hidden')
    await page.evaluate(() => window.scrollTo({ top: 2000, behavior: 'instant' }))
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(1000)
    await page.getByRole('button', { name: 'Menu' }).click()
    await expect(page.locator('html')).toHaveClass(/is-locked/)
    await page.keyboard.press('Escape')
    await expect(page.locator('html')).not.toHaveClass(/is-locked/)
    await page.getByRole('button', { name: 'Menu' }).click()
    await page.locator('#nav-menu').getByRole('link', { name: /Venue/ }).click()
    await expect(page.locator('html')).not.toHaveClass(/is-locked/)
    await expect(page).toHaveURL(/#venue$/)
  })

  test('Escape during the sequence, and the Skip button, both finish cleanly and restore focus and scroll', async ({ page }) => {
    for (const how of ['escape', 'skip'] as const) {
      await page.goto('/')
      await page.locator('.env').click()
      await page.waitForTimeout(600) // mid-sequence
      if (how === 'escape') await page.keyboard.press('Escape')
      else await page.getByRole('button', { name: 'Skip to invitation' }).click({ force: true })
      await expect(page.locator('.gate')).toHaveCount(0, { timeout: 2000 })
      await expect(page.locator('#invitation-title')).toBeFocused()
      await expect(page.locator('html')).not.toHaveClass(/is-locked/)
      await expect(page.locator('#top')).not.toHaveAttribute('inert', '')
      expect(await page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running' && (a.effect as KeyframeEffect).target?.closest?.('.gate')).length)).toBe(0)
    }
  })

  test('opening twice is impossible: a stray timer cannot re-trigger onOpened after unmount', async ({ page }) => {
    const problems = watch(page)
    await page.goto('/')
    await page.locator('.env').click()
    await page.keyboard.press('Escape')
    await expect(page.locator('.gate')).toHaveCount(0)
    await page.waitForTimeout(3200) // beyond the original 1.9 s reveal timer and 2.7 s end
    await expect(page.locator('#invitation-title')).toBeFocused()
    expect(problems).toEqual([])
  })

  test('if WAAPI is unavailable all content renders immediately (nothing stays hidden)', async ({ page }) => {
    await page.addInitScript(() => {
      Element.prototype.animate = () => {
        throw new Error('WAAPI unavailable')
      }
    })
    await page.goto('/')
    await page.locator('.env').click()
    await expect(page.locator('.gate')).toHaveCount(0, { timeout: 3000 })
    const hidden = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>('main *, footer *')]
        // A photograph whose bytes have not arrived yet (lazy-loaded, below the fold) is a frame showing its tonal ground, not hidden content.
        // Its fade is plain CSS keyed to the browser's load event, so it does not depend on WAAPI; the next lines prove that.
        .filter((el) => getComputedStyle(el).opacity === '0' && !el.closest('svg') && el.tagName !== 'INPUT' && !el.matches('img.photo[data-state="loading"]'))
        .map((el) => el.className),
    )
    expect(hidden).toEqual([])
    await expect(page.locator('.hero__name').first()).toBeVisible()
    // Photographs that have loaded are visible without WAAPI: the hero's already is, and the others are once scrolled to.
    await expect(page.locator('.hero__window img.photo')).toHaveCSS('opacity', '1')
    const first = page.locator('.plate img.photo').first()
    await first.scrollIntoViewIfNeeded()
    await expect(first).toHaveAttribute('data-state', 'loaded')
    await expect(first).toHaveCSS('opacity', '1')
  })

  test('if IntersectionObserver is unavailable all content renders immediately', async ({ page }) => {
    await page.addInitScript(() => {
      // @ts-expect-error simulate an old browser
      delete window.IntersectionObserver
    })
    await openFast(page)
    await expect(page.locator('#rsvp-h').locator('xpath=..')).toHaveCSS('opacity', '1')
    await expect(page.locator('#details-h').locator('xpath=..')).toHaveCSS('opacity', '1')
  })

  test('reduced motion: nothing animates after opening, content is immediately visible, scroll is instant', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    await page.locator('.env').click()
    await expect(page.locator('.gate')).toHaveCount(0, { timeout: 1500 })
    await expect(page.locator('#invitation-title')).toBeFocused()
    expect(await page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').length)).toBe(0)
    await expect(page.locator('#rsvp-h').locator('xpath=..')).toHaveCSS('opacity', '1')
    await page.locator('footer').scrollIntoViewIfNeeded()
    await page.getByRole('link', { name: 'Back to top' }).click()
    await expect.poll(() => page.evaluate(() => window.scrollY), { timeout: 500 }).toBeLessThan(5) // instant, not smooth
  })
})

test.describe('timers and cleanup', () => {
  test('the countdown ticker pauses while the tab is hidden and resyncs when it returns', async ({ page }) => {
    await page.clock.install({ time: new Date('2027-06-12T14:00:00Z') })
    await page.goto('/')
    await page.getByRole('button', { name: 'Skip to invitation' }).click()
    await page.locator('#countdown').scrollIntoViewIfNeeded()
    await page.clock.pauseAt(new Date('2027-06-12T14:30:00Z'))
    await page.clock.runFor(1000)
    const secs = page.locator('.countdown__num').nth(3)
    const before = await secs.textContent()
    const setHidden = (hidden: boolean) =>
      page.evaluate((h) => {
        Object.defineProperty(document, 'hidden', { configurable: true, get: () => h })
        document.dispatchEvent(new Event('visibilitychange'))
      }, hidden)
    await setHidden(true)
    await page.clock.runFor(7000) // timers would have advanced the display if they were still running
    expect(await secs.textContent()).toBe(before)
    await setHidden(false) // resync immediately with the (fake) current time
    await expect(secs).not.toHaveText(before!)
    await expect(page.locator('.countdown__num').nth(2)).toHaveText('29') // 14:30:08 → 29 min left, not stale
  })
})

test.describe('keyboard and focus', () => {
  test('tab order on a fresh page: the skip link comes first and moves focus to <main>', async ({ page, browserName }) => {
    test.skip(browserName === 'webkit', 'Safari does not Tab onto links unless the OS "full keyboard access" setting is on')
    await page.goto('/?capture') // no envelope: the first Tab on a fresh page
    await captureReady(page)
    await page.keyboard.press('Tab')
    await expect(page.getByRole('link', { name: 'Skip to main content' })).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page.locator('#main')).toBeFocused()
  })

  test('while the envelope is closed, Tab cycles only inside the dialog', async ({ page }) => {
    await page.goto('/')
    const seen = new Set<string>()
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press('Tab')
      seen.add(await page.evaluate(() => document.activeElement?.className ?? 'body'))
    }
    for (const c of seen) expect(['env', 'gate__skip', 'body', '']).toContain(c)
    expect(await page.evaluate(() => !!document.activeElement?.closest('#top'))).toBe(false)
  })
})

test.describe('responsive quality at every documented viewport', () => {
  for (const vp of VIEWPORTS) {
    test(`${vp.name}: no overflow, no clipped content, readable text, correct fixed elements, low layout shift`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await page.addInitScript(() => {
        ;(window as unknown as { __cls: number }).__cls = 0
        if (!PerformanceObserver.supportedEntryTypes?.includes('layout-shift')) return // Firefox/WebKit: no Layout Instability API
        new PerformanceObserver((list) => {
          for (const e of list.getEntries() as unknown as { value: number; hadRecentInput: boolean }[]) if (!e.hadRecentInput) (window as unknown as { __cls: number }).__cls += e.value
        }).observe({ type: 'layout-shift', buffered: true })
      })
      const problems = watch(page)
      await page.goto(`/${FROZEN}`)
      await captureReady(page)

      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0)
      expect(await overflowing(page)).toEqual([])

      // text never smaller than 10px (excluding screen-reader-only text)
      const tiny = await page.evaluate(() => {
        const out: string[] = []
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
        for (let n = walker.nextNode(); n; n = walker.nextNode()) {
          const el = n.parentElement!
          if (!n.textContent!.trim() || el.closest('.sr-only, script, style, noscript')) continue
          const fs = parseFloat(getComputedStyle(el).fontSize)
          if (fs < 10) out.push(`${fs}px "${n.textContent!.trim().slice(0, 20)}"`)
        }
        return out.slice(0, 5)
      })
      expect(tiny).toEqual([])

      // content is not clipped by overflow:hidden containers (text boxes fully inside their nearest clipping ancestor)
      const clipped = await page.evaluate(() => {
        const out: string[] = []
        for (const el of document.querySelectorAll<HTMLElement>('main h1, main h2, main h3, main p, main .btn, main address')) {
          if (el.closest('.sr-only, svg')) continue
          const r = el.getBoundingClientRect()
          if (!r.width) continue
          for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
            const o = getComputedStyle(p).overflow
            if (o === 'visible' || o === 'clip' && false) continue
            const pr = p.getBoundingClientRect()
            if (el.classList.contains('hero__name')) break
            if (r.left < pr.left - 1 || r.right > pr.right + 1 || r.top < pr.top - 1 || r.bottom > pr.bottom + 1) {
              out.push(`${el.tagName}.${el.className} in ${p.className}`)
              break
            }
          }
        }
        return out.slice(0, 5)
      })
      expect(clipped).toEqual([])

      // scroll through; fixed nav sits at the very top, full width, below nothing
      await page.evaluate(() => window.scrollTo(0, 1500))
      await page.waitForTimeout(100)
      const nav = await page.locator('.nav').boundingBox()
      expect(nav).not.toBeNull()
      expect(nav!.y).toBeLessThanOrEqual(0.5)
      expect(Math.round(nav!.width)).toBe(vp.width)
      expect(nav!.height).toBeLessThan(80)

      await page.evaluate(() => window.scrollTo(0, 0))
      const cls = await page.evaluate(() => (window as unknown as { __cls: number }).__cls)
      expect(cls).toBeLessThan(0.02)
      expect(problems).toEqual([])
    })
  }
})
