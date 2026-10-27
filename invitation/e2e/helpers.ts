import type { Page } from '@playwright/test'
import { weddingConfig } from '../src/config/wedding'
import type { WeddingConfig } from '../src/config/types'

/** Base URL of the test-mode build (accepts an injected config). Production never honours window.__WEDDING_CONFIG__. */
export const TEST_URL = 'http://localhost:4174'

export const baseConfig = (): WeddingConfig => structuredClone(weddingConfig)

/** Open the test build with a mutated copy of the sample config. Returns once the page has rendered something. */
export async function gotoWith(page: Page, mutate: (c: WeddingConfig) => void, query = '?capture&now=2027-01-01T00:00:00Z') {
  const config = baseConfig()
  mutate(config)
  await page.addInitScript((c) => {
    ;(window as unknown as { __WEDDING_CONFIG__: unknown }).__WEDDING_CONFIG__ = c
  }, config)
  await page.goto(`${TEST_URL}/${query}`)
}

/** Wait for capture mode's readiness signal (fonts + images loaded, two frames painted). No timeouts involved. */
export async function captureReady(page: Page) {
  await page.waitForSelector('html[data-capture-ready="true"]')
}

/** Collects console errors/warnings, page errors and failed/4xx-5xx requests. */
export function watch(page: Page) {
  const problems: string[] = []
  page.on('console', (m) => ['error', 'warning'].includes(m.type()) && problems.push(`console.${m.type()}: ${m.text()}`))
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`))
  page.on('requestfailed', (r) => problems.push(`requestfailed: ${r.url()}`))
  page.on('response', (r) => r.status() >= 400 && problems.push(`http ${r.status()}: ${r.url()}`))
  return problems
}

/** Elements whose box leaves the viewport horizontally (decorative clipped sprigs and SVG internals excluded). */
export const overflowing = (page: Page) =>
  page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('main *, footer *, .nav *')]
      .filter((el) => !el.closest('.hero__sprig') && !el.closest('svg') && el.getBoundingClientRect().width > 0)
      .filter((el) => {
        const r = el.getBoundingClientRect()
        return r.right > window.innerWidth + 1 || r.left < -1
      })
      .map((el) => `${el.tagName}.${el.className}`)
      .slice(0, 8),
  )
