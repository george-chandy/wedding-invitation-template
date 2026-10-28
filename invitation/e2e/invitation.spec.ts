import { expect, test, type Page } from '@playwright/test'
import { weddingConfig } from '../src/config/wedding'

/** Collects console errors/warnings, page errors and failed/4xx-5xx requests. */
function watch(page: Page) {
  const problems: string[] = []
  page.on('console', (m) => ['error', 'warning'].includes(m.type()) && problems.push(`console.${m.type()}: ${m.text()}`))
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`))
  page.on('requestfailed', (r) => problems.push(`requestfailed: ${r.url()}`))
  page.on('response', (r) => r.status() >= 400 && problems.push(`http ${r.status()}: ${r.url()}`))
  return problems
}

async function openEnvelope(page: Page) {
  await page.locator('.env').click()
  await expect(page.locator('.gate')).toHaveCount(0, { timeout: 8000 })
}

test.describe('loading', () => {
  test('renders the sealed envelope with no console errors or failed requests', async ({ page }) => {
    const problems = watch(page)
    await page.goto('/')
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.locator('.env')).toBeVisible()
    await page.waitForLoadState('load')
    await page.waitForTimeout(1000) // let late font/image requests surface (networkidle is unreliable in Firefox)
    expect(problems).toEqual([])
    await expect(page).toHaveTitle(/Elena & Theo/)
  })

  test('page content is inert (unreachable) while the envelope is closed', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('#top')).toHaveAttribute('inert', '')
    await expect(page.locator('html')).toHaveClass(/is-locked/)
  })

  test('head metadata is injected from config', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', /Elena & Theo/)
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /12 June 2027/)
    await expect(page.locator('html')).toHaveAttribute('lang', 'en-GB')
  })
})

test.describe('envelope', () => {
  test('opens with a mouse click, unlocks the page and focuses the names', async ({ page }) => {
    const problems = watch(page)
    await page.goto('/')
    await openEnvelope(page)
    await expect(page.locator('#top')).not.toHaveAttribute('inert', '')
    await expect(page.locator('html')).not.toHaveClass(/is-locked/)
    await expect(page.locator('#invitation-title')).toBeFocused()
    await expect(page.locator('#invitation-title')).toContainText('Elena')
    await expect(page.locator('#invitation-title')).toContainText('Theo')
    expect(problems).toEqual([])
  })

  test('opens from the keyboard (Tab to the envelope, Enter)', async ({ page }) => {
    await page.goto('/')
    await page.keyboard.press('Tab')
    await expect(page.locator('.env')).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page.locator('.gate')).toHaveCount(0, { timeout: 8000 })
  })

  test('opens with Space', async ({ page }) => {
    await page.goto('/')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Space')
    await expect(page.locator('.gate')).toHaveCount(0, { timeout: 8000 })
  })

  test('Escape and the skip button bypass the animation', async ({ page }) => {
    await page.goto('/')
    await page.keyboard.press('Escape')
    await expect(page.locator('.gate')).toHaveCount(0, { timeout: 2000 })
    await page.reload()
    await page.getByRole('button', { name: 'Skip to invitation' }).click()
    await expect(page.locator('.gate')).toHaveCount(0, { timeout: 2000 })
    await expect(page.locator('#invitation-title')).toBeVisible()
  })

  test('works with touch', async ({ browser }) => {
    const ctx = await browser.newContext({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } })
    const page = await ctx.newPage()
    await page.goto('http://localhost:4173/')
    await page.locator('.env').tap()
    await expect(page.locator('.gate')).toHaveCount(0, { timeout: 8000 })
    await ctx.close()
  })

  test('a second press while opening is ignored; skipping mid-sequence completes it', async ({ page }) => {
    await page.goto('/')
    await page.locator('.env').click()
    await page.locator('.env').click({ force: true })
    await page.keyboard.press('Escape')
    await expect(page.locator('.gate')).toHaveCount(0, { timeout: 2000 })
  })

  test('never traps the visitor if the animation API fails', async ({ page }) => {
    await page.addInitScript(() => {
      Element.prototype.animate = () => {
        throw new Error('WAAPI unavailable')
      }
    })
    await page.goto('/')
    await page.locator('.env').click()
    await expect(page.locator('.gate')).toHaveCount(0, { timeout: 3000 })
    await expect(page.locator('#venue')).toBeAttached()
  })
})

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' })
  test('envelope still works but collapses to a quick fade; content is immediately visible', async ({ page }) => {
    await page.goto('/')
    await page.locator('.env').click()
    await expect(page.locator('.gate')).toHaveCount(0, { timeout: 1500 })
    // Reveals render as plain elements: visible without scrolling into view.
    await expect(page.locator('#venue-h').locator('xpath=..')).toHaveCSS('opacity', '1')
    await expect(page.locator('.hero__name').first()).toBeVisible()
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe('auto')
  })
})

test.describe('no reduced motion', () => {
  test('smooth scrolling is enabled', async ({ page }) => {
    await page.goto('/')
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe('smooth')
  })
})

test.describe('invitation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Skip to invitation' }).click()
    await expect(page.locator('.gate')).toHaveCount(0)
  })

  test('has one h1 and a logical heading order', async ({ page }) => {
    await expect(page.locator('h1')).toHaveCount(1)
    const levels = await page.$$eval('h1,h2,h3', (els) => els.map((e) => Number(e.tagName[1])))
    for (let i = 1; i < levels.length; i++) expect(levels[i] - levels[i - 1]).toBeLessThanOrEqual(1)
  })

  test('sections reveal on scroll and navigation links jump with history', async ({ page }) => {
    await expect(page.locator('.nav')).toHaveCount(0) // hidden over the hero
    // Centre the (viewport-tall) venue scene: WebKit's scrollIntoViewIfNeeded only scrolls it into view, leaving the hero partly visible.
    await page.evaluate(() => document.getElementById('venue')!.scrollIntoView({ block: 'center', behavior: 'instant' }))
    await expect(page.locator('.nav')).toBeVisible()
    await expect(page.locator('#venue-h').locator('xpath=..')).toHaveCSS('opacity', '1')
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.evaluate(() => document.getElementById('story')!.scrollIntoView({ block: 'center', behavior: 'instant' }))
    await page.getByRole('navigation', { name: 'Sections' }).getByRole('link', { name: 'Schedule' }).click()
    await expect(page).toHaveURL(/#schedule$/)
    await expect(page.locator('#schedule')).toBeInViewport()
    await page.goBack()
    await expect(page).not.toHaveURL(/#schedule$/)
  })

  test('reveal runs once: scrolling away and back does not re-hide content', async ({ page }) => {
    await page.locator('#details').scrollIntoViewIfNeeded()
    await expect(page.locator('#details-h').locator('xpath=..')).toHaveCSS('opacity', '1')
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.waitForTimeout(300)
    await expect(page.locator('#details-h').locator('xpath=..')).toHaveCSS('opacity', '1')
  })

  test('back to top returns to the start', async ({ page }) => {
    await page.locator('footer').scrollIntoViewIfNeeded()
    await page.getByRole('link', { name: 'Back to top' }).click()
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(5)
  })

  test('mobile menu opens, lists sections, closes with Escape and restores focus', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.locator('#venue').scrollIntoViewIfNeeded()
    const toggle = page.getByRole('button', { name: 'Menu' })
    await toggle.click()
    await expect(toggle).toHaveAttribute('aria-expanded', 'true')
    await expect(page.locator('#nav-menu a')).toHaveCount(6)
    await page.keyboard.press('Escape')
    await expect(page.locator('#nav-menu')).toHaveCount(0)
    await expect(toggle).toBeFocused()
    await toggle.click()
    await page.locator('#nav-menu').getByRole('link', { name: /RSVP/ }).click()
    await expect(page).toHaveURL(/#rsvp$/)
    await expect(page.locator('#nav-menu')).toHaveCount(0)
  })

  test('countdown shows four units and an accessible label', async ({ page }) => {
    await page.locator('#countdown').scrollIntoViewIfNeeded()
    const grid = page.getByRole('timer')
    await expect(grid.locator('.countdown__unit')).toHaveCount(4)
    await expect(grid).toHaveAttribute('aria-label', /days, \d+ hours, \d+ minutes until we celebrate/)
  })

  test('gallery images load with intrinsic sizes and lazy loading', async ({ page }) => {
    const imgs = page.locator('.plate img')
    await expect(imgs).toHaveCount(weddingConfig.gallery!.images.length)
    for (const img of await imgs.all()) {
      await expect(img).toHaveAttribute('loading', 'lazy')
      await expect(img).toHaveAttribute('width', /\d+/)
      await expect(img).toHaveAttribute('height', /\d+/)
      await expect(img).toHaveAttribute('srcset', /\.webp \d+w, .*\.webp \d+w/)
      await expect(img).toHaveAttribute('sizes', /vw/)
      await img.scrollIntoViewIfNeeded()
      await expect.poll(() => img.evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth)).toBeGreaterThan(0)
    }
  })

  test('a broken gallery image falls back to a generated plate', async ({ page }) => {
    await page.route('**/photos/gallery-rings-*.webp', (r) => r.fulfill({ status: 404, body: '' }))
    await page.reload()
    await page.getByRole('button', { name: 'Skip to invitation' }).click()
    await page.locator('#gallery').scrollIntoViewIfNeeded()
    await page.locator('.plate').nth(1).scrollIntoViewIfNeeded() // lazy: the request starts when the plate nears the viewport
    await expect(page.locator('.plate [role="img"]')).toHaveCount(1)
  })
})

test.describe('calendar', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Skip to invitation' }).click()
    await page.locator('#countdown').scrollIntoViewIfNeeded()
  })

  test('Google Calendar link carries the real event details', async ({ page }) => {
    const href = await page.getByTestId('google-calendar').getAttribute('href')
    const u = new URL(href!)
    expect(u.searchParams.get('dates')).toBe('20270612T150000Z/20270612T220000Z')
    expect(u.searchParams.get('ctz')).toBe('Europe/London')
    expect(u.searchParams.get('text')).toBe('The wedding of Elena & Theo')
    expect(u.searchParams.get('location')).toContain('1 Willowmere Lane')
    await expect(page.getByTestId('google-calendar')).toHaveAttribute('rel', /noopener/)
  })

  test('.ics download has the right content', async ({ page }) => {
    const [download] = await Promise.all([page.waitForEvent('download'), page.getByTestId('download-ics').click()])
    expect(download.suggestedFilename()).toBe('wedding-invitation.ics')
    const path = await download.path()
    const text = (await import('node:fs')).readFileSync(path, 'utf8').replace(/\r\n /g, '') // unfold long lines
    expect(text.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true)
    expect(text).toContain('DTSTART:20270612T150000Z')
    expect(text).toContain('DTEND:20270612T220000Z')
    expect(text).toContain('SUMMARY:The wedding of Elena & Theo')
    expect(text).toContain('LOCATION:The Orangery at Willowmere\\, 1 Willowmere Lane\\, Meadowbrook\\, MB1 2WL')
    expect(text.endsWith('END:VCALENDAR\r\n')).toBe(true)
  })
})

test.describe('countdown phases (fake clock)', () => {
  for (const [name, time, expected] of [
    ['during the event', '2027-06-12T16:00:00Z', /Today is the day/],
    ['after the event', '2027-06-14T09:00:00Z', /Thank you for celebrating/],
  ] as const) {
    test(name, async ({ page }) => {
      await page.clock.install({ time: new Date(time) })
      await page.goto('/')
      await page.getByRole('button', { name: 'Skip to invitation' }).click()
      await page.locator('#countdown').scrollIntoViewIfNeeded()
      await expect(page.locator('.countdown__message')).toHaveText(expected)
      await expect(page.getByRole('timer')).toHaveCount(0)
    })
  }

  test('ticks once per second', async ({ page }) => {
    await page.clock.install({ time: new Date('2027-06-12T14:00:00Z') })
    await page.goto('/')
    await page.getByRole('button', { name: 'Skip to invitation' }).click()
    await page.locator('#countdown').scrollIntoViewIfNeeded()
    await page.clock.pauseAt(new Date('2027-06-12T14:59:30Z'))
    await page.clock.runFor(1000) // flush the pending tick
    const seconds = page.locator('.countdown__unit').nth(3).locator('.numeral')
    await expect(seconds).toHaveText('30')
    await page.clock.runFor(3000)
    await expect(seconds).toHaveText('27')
    await expect(page.locator('.countdown__unit').nth(2).locator('.numeral')).toHaveText('00')
  })
})

test.describe('copy address', () => {
  test('copies the full address and confirms', async ({ page, context, browserName }) => {
    test.skip(browserName !== 'chromium', 'clipboard permissions can only be granted in Chromium')
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.goto('/')
    await page.getByRole('button', { name: 'Skip to invitation' }).click()
    await page.locator('#venue').scrollIntoViewIfNeeded()
    await page.getByTestId('copy-address').click()
    await expect(page.getByRole('status').filter({ hasText: 'Address copied' })).toBeVisible()
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('The Orangery at Willowmere, 1 Willowmere Lane, Meadowbrook, MB1 2WL')
    await expect(page.getByTestId('copy-address')).toContainText('Address copied')
    await expect(page.getByTestId('copy-address')).toContainText('Copy address', { timeout: 4000 }) // resets
  })

  test('reports failure when clipboard is unavailable', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'clipboard', { value: { writeText: () => Promise.reject(new Error('denied')) } })
      document.execCommand = () => false
    })
    await page.goto('/')
    await page.getByRole('button', { name: 'Skip to invitation' }).click()
    await page.locator('#venue').scrollIntoViewIfNeeded()
    await page.getByTestId('copy-address').click()
    await expect(page.getByText('Copy not available')).toBeVisible()
  })

  test('map links are well-formed', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Skip to invitation' }).click()
    const g = await page.getByRole('link', { name: /Open in Google Maps/ }).getAttribute('href')
    expect(new URL(g!).searchParams.get('query')).toContain('Willowmere')
    const a = await page.getByRole('link', { name: 'Apple Maps' }).getAttribute('href')
    expect(a).toContain('maps.apple.com')
  })
})

test.describe('rsvp', () => {
  test('email mode composes a mailto link and says so honestly', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Skip to invitation' }).click()
    await page.locator('#rsvp').scrollIntoViewIfNeeded()
    await expect(page.getByText('Nothing is stored by this website')).toBeVisible()
    await expect(page.getByLabel('Your name')).toBeVisible()
    await expect(page.getByRole('group', { name: 'Will you be joining us?' })).toBeVisible()
    await expect(page.locator('form.rsvp__form').getByRole('button', { name: 'Write my reply' })).toBeEnabled()
  })
})

const viewports = [
  { name: '360x800', width: 360, height: 800 },
  { name: '390x844', width: 390, height: 844 },
  { name: '768x1024', width: 768, height: 1024 },
  { name: '1024x768', width: 1024, height: 768 },
  { name: '1440x1000', width: 1440, height: 1000 },
  { name: '1920x1080', width: 1920, height: 1080 },
]
test.describe('responsive', () => {
  for (const vp of viewports) {
    test(`${vp.name}: no horizontal overflow, readable text, envelope and hero fit`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await page.goto('/')
      const env = await page.locator('.env').boundingBox()
      expect(env!.x).toBeGreaterThanOrEqual(0)
      expect(env!.x + env!.width).toBeLessThanOrEqual(vp.width)
      expect(env!.y + env!.height).toBeLessThanOrEqual(vp.height)
      await expect(page).toHaveScreenshot(`gate-${vp.name}.png`, { maxDiffPixelRatio: 0.02 })
      await page.getByRole('button', { name: 'Skip to invitation' }).click()
      await page.waitForTimeout(3200) // hero entrance settles
      await expect(page).toHaveScreenshot(`hero-${vp.name}.png`, { maxDiffPixelRatio: 0.02 })
      const total = await page.evaluate(() => document.documentElement.scrollHeight)
      for (let y = 0; y < total; y += Math.floor(vp.height * 0.7)) {
        await page.evaluate((y) => window.scrollTo(0, y), y)
        await page.waitForTimeout(60)
      }
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
      expect(overflow).toBeLessThanOrEqual(0)
      // No element pokes outside the viewport horizontally (ignoring the decorative, clipped hero sprigs).
      const offenders = await page.evaluate(() =>
        [...document.querySelectorAll<HTMLElement>('main *, footer *')]
          .filter((el) => !el.closest('.hero__sprig') && !el.closest('svg') && el.getBoundingClientRect().width > 0)
          .filter((el) => { const r = el.getBoundingClientRect(); return r.right > window.innerWidth + 1 || r.left < -1 })
          .map((el) => el.className || el.tagName)
          .slice(0, 5))
      expect(offenders).toEqual([])
      // Touch targets: all buttons/links in the body are at least 40px tall.
      const small = await page.evaluate(() =>
        [...document.querySelectorAll<HTMLElement>('main .btn, .nav__link, .nav__toggle, .choice span')]
          .filter((el) => el.offsetParent !== null && el.getBoundingClientRect().height < 40)
          .map((el) => el.textContent?.trim()))
      expect(small).toEqual([])
    })
  }
})
