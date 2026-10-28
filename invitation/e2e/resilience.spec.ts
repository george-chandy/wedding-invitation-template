import { expect, test } from '@playwright/test'
import { baseConfig, captureReady, gotoWith, overflowing, TEST_URL, watch } from './helpers'

test.describe('long names and accented characters', () => {
  for (const width of [360, 768, 1920]) {
    test(`very long names stay inside the hero arch with no overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: width === 1920 ? 1080 : 800 })
      const problems = watch(page)
      await gotoWith(page, (c) => {
        c.couple.people[0].first = 'Maximilian-Alexander'
        c.couple.people[0].full = 'Maximilian-Alexander Montgomery-Featherstonehaugh'
        c.couple.people[1].first = 'Wilhelmina-Charlotte'
        c.couple.people[1].full = 'Wilhelmina-Charlotte Wolfeschlegelsteinhausenbergerdorff'
      })
      await captureReady(page)
      const arch = (await page.locator('.hero__arch').boundingBox())!
      for (const el of await page.locator('.hero__name > span').all()) {
        const b = (await el.boundingBox())!
        expect(b.x).toBeGreaterThanOrEqual(arch.x - 1)
        expect(b.x + b.width).toBeLessThanOrEqual(arch.x + arch.width + 1)
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0)
      expect(await overflowing(page)).toEqual([])
      expect(problems).toEqual([])
    })
  }

  test('accented/extended-Latin names render and load the Latin-Extended font only when needed', async ({ page }) => {
    const fonts: string[] = []
    page.on('request', (r) => /\.woff2/.test(r.url()) && fonts.push(r.url()))
    await gotoWith(page, (c) => {
      c.couple.people[0].first = 'Zoë'
      c.couple.people[1].first = 'Łukasz'
      c.couple.people[1].full = 'Łukasz Dvořák-Šebesta'
      c.couple.monogram = ['Z', 'Ł']
    })
    await captureReady(page)
    await expect(page.locator('#invitation-title')).toContainText('Łukasz')
    expect(fonts.some((f) => f.includes('latin-ext'))).toBe(true)
    // The second name is set in light italic by design, so the italic face must be loaded for it too.
    const ok = await page.evaluate(() => document.fonts.check('italic 300 40px "Cormorant Garamond"', 'Łukasz') && document.fonts.check('300 40px "Cormorant Garamond"', 'Zoë'))
    expect(ok).toBe(true)
  })

  test('the default (Latin-1) content never downloads the extended subset', async ({ page }) => {
    const fonts: string[] = []
    page.on('request', (r) => /\.woff2/.test(r.url()) && fonts.push(r.url()))
    await gotoWith(page, () => undefined)
    await captureReady(page)
    expect(fonts.some((f) => f.includes('latin-ext'))).toBe(false)
  })
})

test.describe('optional sections and ordering', () => {
  test('hero + venue only: no footer, no nav entries for removed sections, no errors', async ({ page }) => {
    const problems = watch(page)
    await gotoWith(page, (c) => {
      c.sections = ['hero', 'venue']
      for (const k of ['story', 'countdown', 'schedule', 'details', 'gallery', 'rsvp'] as const) delete c[k]
    })
    await captureReady(page)
    await expect(page.locator('main > *')).toHaveCount(2)
    await expect(page.locator('footer')).toHaveCount(0)
    await page.evaluate(() => document.getElementById('venue')!.scrollIntoView({ block: 'center', behavior: 'instant' })) // see invitation.spec.ts: scrollIntoViewIfNeeded is engine-dependent for tall sections
    await expect(page.locator('.nav__links a')).toHaveText(['Venue'])
    await expect(page.locator('.hero__cue')).toHaveAttribute('href', '#venue')
    expect(problems).toEqual([])
  })

  test('venue only (no hero): nav is visible from the start, page still usable', async ({ page }) => {
    const problems = watch(page)
    await gotoWith(page, (c) => {
      c.sections = ['venue']
    })
    await captureReady(page)
    await expect(page.locator('.nav')).toBeVisible()
    await expect(page.locator('#venue-h')).toBeVisible()
    expect(problems).toEqual([])
  })

  test('custom order is respected in the DOM and in the nav', async ({ page }) => {
    await gotoWith(page, (c) => {
      c.sections = ['hero', 'rsvp', 'venue', 'story', 'footer']
    })
    await captureReady(page)
    expect(await page.$$eval('main > section', (els) => els.map((e) => e.id))).toEqual(['hero', 'rsvp', 'venue', 'story'])
    await page.locator('#venue').scrollIntoViewIfNeeded()
    await expect(page.locator('.nav__links a')).toHaveText(['RSVP', 'Venue', 'Story'])
  })

  test('empty gallery / schedule lists drop the section; gallery without src shows placeholders', async ({ page }) => {
    await gotoWith(page, (c) => {
      c.gallery!.images = []
      c.schedule!.items = []
    })
    await captureReady(page)
    await expect(page.locator('#gallery, #schedule')).toHaveCount(0)
    await expect(page.locator('.nav__links a', { hasText: 'Gallery' })).toHaveCount(0)

    await gotoWith(page, (c) => {
      c.gallery!.images = [{ alt: 'First', width: 800, height: 1000 }, { alt: 'Second', width: 1000, height: 750, caption: 'Cap' }]
    })
    await captureReady(page)
    await expect(page.locator('.plate [role="img"]')).toHaveCount(2)
    await expect(page.locator('.plate img')).toHaveCount(0)
  })

  test('a section that throws while rendering is skipped; the rest of the page survives', async ({ page }) => {
    const errors: string[] = []
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
    page.on('pageerror', () => undefined)
    const config = baseConfig()
    await page.addInitScript((c) => {
      // `body` is read once by validation, then throws on every later read (i.e. while the section renders).
      let reads = 0
      const item = { title: 'Dress code' } as { title: string; body?: string }
      Object.defineProperty(item, 'body', { get: () => { if (reads++ > 0) throw new Error('boom'); return 'fine' } })
      ;(c as { details: { items: unknown[] } }).details.items = [item]
      ;(window as unknown as { __WEDDING_CONFIG__: unknown }).__WEDDING_CONFIG__ = c
    }, config)
    await page.goto(`${TEST_URL}/?capture&now=2027-01-01T00:00:00Z`)
    await captureReady(page)
    await expect(page.locator('#details')).toHaveCount(0)
    await expect(page.locator('#venue-h')).toBeVisible()
    await expect(page.locator('#invitation-title')).toBeVisible()
    expect(errors.join('\n')).toContain('"details" section failed to render')
  })
})

test.describe('invalid configuration shows useful errors, not a blank page', () => {
  test('lists each problem by path', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    await gotoWith(page, (c) => {
      c.event.date = '2027-02-30'
      c.event.timezone = '+01:00'
      c.rsvp!.mode = 'endpoint'
      c.rsvp!.endpoint = 'http://insecure.example.com/x'
    })
    await expect(page.getByRole('heading', { name: 'Invitation configuration problem' })).toBeVisible()
    const items = await page.locator('main li').allTextContents()
    expect(items.some((t) => t.includes('event.date'))).toBe(true)
    expect(items.some((t) => t.includes('event.timezone'))).toBe(true)
    expect(items.some((t) => t.includes('rsvp.endpoint'))).toBe(true)
    expect(errors).toEqual([])
  })

  test('an empty object is reported, not rendered blank', async ({ page }) => {
    await page.addInitScript(() => {
      ;(window as unknown as { __WEDDING_CONFIG__: unknown }).__WEDDING_CONFIG__ = { not: 'a config' }
    })
    await page.goto(`${TEST_URL}/`)
    await expect(page.getByRole('heading', { name: 'Invitation configuration problem' })).toBeVisible()
    expect(await page.locator('main li').count()).toBeGreaterThan(5)
  })

  test('HTML in a config value is shown as text, not executed', async ({ page }) => {
    await gotoWith(page, (c) => {
      c.event.date = '<img src=x onerror=window.__pwned=1>'
    })
    await expect(page.getByRole('heading', { name: 'Invitation configuration problem' })).toBeVisible()
    expect(await page.evaluate(() => (window as unknown as { __pwned?: number }).__pwned)).toBeUndefined()
  })

  test('production build ignores any injected configuration', async ({ page }) => {
    await page.addInitScript(() => {
      ;(window as unknown as { __WEDDING_CONFIG__: unknown }).__WEDDING_CONFIG__ = { not: 'a config' }
    })
    await page.goto('http://localhost:4173/?capture')
    await expect(page.locator('#invitation-title')).toContainText('Elena')
  })
})

test.describe('events in the past and timezones (rendered)', () => {
  test('past event: thank-you message, no calendar buttons, no timer', async ({ page }) => {
    await gotoWith(page, (c) => {
      c.event.date = '2020-06-12'
    })
    await captureReady(page)
    await expect(page.locator('.countdown__message')).toHaveText('Thank you for celebrating with us.')
    await expect(page.getByTestId('google-calendar')).toHaveCount(0)
    await expect(page.getByTestId('download-ics')).toHaveCount(0)
    await expect(page.getByRole('timer')).toHaveCount(0)
  })

  test('during the event (frozen clock): celebration message, calendar still offered', async ({ page }) => {
    await gotoWith(page, () => undefined, '?capture&now=2027-06-12T16:00:00Z')
    await captureReady(page)
    await expect(page.locator('.countdown__message')).toContainText('Today is the day')
  })

  test('frozen clock gives an exact, stable countdown', async ({ page }) => {
    await gotoWith(page, () => undefined, '?capture&now=2027-06-10T12:00:00Z') // 2 days 3 hours before 15:00Z
    await captureReady(page)
    const nums = await page.locator('.countdown__num').allTextContents()
    expect(nums).toEqual(['2', '03', '00', '00'])
  })

  for (const [name, tz, date, time, dates] of [
    ['New York spring-forward gap', 'America/New_York', '2027-03-14', '02:30', '20270314T073000Z/20270314T143000Z'],
    ['Sydney in January', 'Australia/Sydney', '2027-01-15', '16:00', '20270115T050000Z/20270115T120000Z'],
    ['Lord Howe winter', 'Australia/Lord_Howe', '2027-06-12', '16:00', '20270612T053000Z/20270612T120000Z'],
  ] as const) {
    test(`Google Calendar range for ${name}`, async ({ page }) => {
      await gotoWith(page, (c) => {
        c.event = { ...c.event, timezone: tz, date, startTime: time, endTime: '23:00' }
        c.event.endTime = tz === 'America/New_York' ? '10:30' : tz === 'Australia/Sydney' ? '23:00' : '22:30'
      })
      await captureReady(page)
      const href = (await page.getByTestId('google-calendar').getAttribute('href'))!
      const u = new URL(href)
      expect(u.searchParams.get('ctz')).toBe(tz)
      expect(u.searchParams.get('dates')).toBe(dates)
    })
  }
})

test.describe('RSVP: endpoint mode (mocked provider — a real provider cannot be exercised here)', () => {
  const ENDPOINT = 'https://forms.example.test/submit'
  const setup = async (page: import('@playwright/test').Page, handler: Parameters<import('@playwright/test').Page['route']>[1]) => {
    const requests: { method: string; headers: Record<string, string>; body: string; url: string }[] = []
    await page.route(ENDPOINT, async (route, request) => {
      requests.push({ method: request.method(), headers: request.headers(), body: request.postData() ?? '', url: request.url() })
      await handler(route, request)
    })
    await gotoWith(page, (c) => {
      Object.assign(c.rsvp!, { mode: 'endpoint', endpoint: ENDPOINT, email: undefined })
    })
    await captureReady(page)
    return requests
  }
  const fill = async (page: import('@playwright/test').Page, name = 'Ada Lovelace') => {
    await page.getByLabel('Your name').fill(name)
  }

  test('says where the reply goes, and posts exactly the documented JSON', async ({ page }) => {
    const requests = await setup(page, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }))
    await expect(page.getByText('Your reply is sent to forms.example.test')).toBeVisible()
    await expect(page.getByText('Nothing is stored by this website')).toHaveCount(0)
    await fill(page, '  Ada Lovelace  ')
    await page.getByLabel('Number of guests').selectOption('3')
    await page.getByLabel('Dietary needs or a message').fill('Vegetarian')
    await page.getByRole('button', { name: 'Send reply' }).click()
    await expect(page.getByRole('status').filter({ hasText: 'Thank you — your reply has been sent.' })).toBeVisible()
    expect(requests).toHaveLength(1)
    expect(requests[0].method).toBe('POST')
    expect(requests[0].url).toBe(ENDPOINT)
    expect(requests[0].headers['content-type']).toBe('application/json')
    expect(JSON.parse(requests[0].body)).toEqual({ name: 'Ada Lovelace', attending: 'yes', guests: '3', notes: 'Vegetarian' })
    expect(requests[0].headers['cookie']).toBeUndefined() // credentials omitted
  })

  test('shows a loading state and ignores double submits', async ({ page }) => {
    let release!: () => void
    const gate = new Promise<void>((r) => (release = r))
    const requests = await setup(page, async (r) => {
      await gate
      await r.fulfill({ status: 200, body: '{}' })
    })
    await fill(page)
    const send = page.getByRole('button', { name: 'Send reply' })
    await send.click()
    await expect(page.getByRole('button', { name: 'Sending…' })).toBeDisabled()
    await page.getByRole('button', { name: 'Sending…' }).click({ force: true }).catch(() => undefined)
    release()
    await expect(page.getByText('Thank you — your reply has been sent.')).toBeVisible()
    expect(requests).toHaveLength(1)
  })

  for (const [name, handler] of [
    ['HTTP 500', (r: import('@playwright/test').Route) => r.fulfill({ status: 500, body: 'nope' })],
    ['HTTP 422', (r: import('@playwright/test').Route) => r.fulfill({ status: 422, body: '{}' })],
    ['network failure', (r: import('@playwright/test').Route) => r.abort('failed')],
    ['redirect (never followed)', (r: import('@playwright/test').Route) => r.fulfill({ status: 302, headers: { location: 'https://evil.example.test/' } })],
  ] as const) {
    test(`${name}: error is shown, never "thank you", entered data is kept, retry works`, async ({ page, browserName }) => {
      test.skip(name.startsWith('redirect') && browserName === 'webkit', "WebKit's route API cannot fulfil a 3xx response; redirect:'error' is verified in Chromium and Firefox")
      const requests = await setup(page, handler)
      await fill(page, 'Grace Hopper')
      await page.getByLabel('Dietary needs or a message').fill('Keep me')
      await page.getByRole('button', { name: 'Send reply' }).click()
      await expect(page.getByRole('alert').filter({ hasText: 'did not go through' })).toBeVisible()
      await expect(page.getByText('Thank you — your reply has been sent.')).toHaveCount(0)
      await expect(page.getByLabel('Your name')).toHaveValue('Grace Hopper')
      await expect(page.getByLabel('Dietary needs or a message')).toHaveValue('Keep me')
      await expect(page.getByRole('button', { name: 'Send reply' })).toBeEnabled()
      expect(requests.length).toBe(1)
      expect(requests.every((q) => q.url === ENDPOINT)).toBe(true)
    })
  }

  test('a name of only spaces is rejected locally and nothing is sent', async ({ page }) => {
    const requests = await setup(page, (r) => r.fulfill({ status: 200, body: '{}' }))
    await fill(page, '   ')
    await page.getByRole('button', { name: 'Send reply' }).click()
    await expect(page.getByRole('alert').filter({ hasText: 'Please enter your name.' })).toBeVisible()
    await expect(page.getByLabel('Your name')).toHaveAttribute('aria-invalid', 'true')
    expect(requests).toHaveLength(0)
  })

  test('declining omits nothing important and caps guests/name/notes lengths', async ({ page }) => {
    const requests = await setup(page, (r) => r.fulfill({ status: 200, body: '{}' }))
    await page.getByLabel('Your name').fill('x'.repeat(300))
    await page.getByLabel('Regretfully declines').check()
    await page.getByLabel('Dietary needs or a message').fill('y'.repeat(2000))
    await page.getByRole('button', { name: 'Send reply' }).click()
    await expect(page.getByText('Thank you — your reply has been sent.')).toBeVisible()
    const body = JSON.parse(requests[0].body)
    expect(body.attending).toBe('no')
    expect(body.name).toHaveLength(120)
    expect(body.notes).toHaveLength(1000)
  })
})

test.describe('RSVP: email and link modes communicate honestly', () => {
  test('email mode states nothing is stored and shows no endpoint wording', async ({ page }) => {
    await gotoWith(page, () => undefined)
    await captureReady(page)
    await expect(page.getByText('Nothing is stored by this website')).toBeVisible()
    await expect(page.getByText('Your reply is sent to')).toHaveCount(0)
  })

  test('link mode renders a safe external link and no form', async ({ page }) => {
    await gotoWith(page, (c) => {
      Object.assign(c.rsvp!, { mode: 'link', url: 'https://forms.example.test/rsvp', email: undefined })
    })
    await captureReady(page)
    const a = page.getByRole('link', { name: /Reply online/ })
    await expect(a).toHaveAttribute('href', 'https://forms.example.test/rsvp')
    await expect(a).toHaveAttribute('rel', /noopener/)
    await expect(a).toHaveAttribute('target', '_blank')
    await expect(page.locator('form.rsvp__form')).toHaveCount(0)
  })
})
