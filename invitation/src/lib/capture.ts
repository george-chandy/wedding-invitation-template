/**
 * Capture mode, for deterministic screenshots and visual tests. Enabled only by the URL query `?capture`
 * (optionally `&now=2027-01-01T00:00:00Z` to freeze the countdown clock). Visitors never see it.
 *
 * In capture mode: no envelope, every reveal/animation renders in its final state, images load eagerly,
 * the clock is frozen if `now` is given, CSS motion is disabled, and `<html data-capture-ready>` is set once
 * fonts and images have loaded and two frames have painted — so tests wait on a signal, not a timeout.
 */
const params = typeof location === 'undefined' ? new URLSearchParams() : new URLSearchParams(location.search)
const parsedNow = Date.parse(params.get('now') ?? '')

export const capture = {
  enabled: params.has('capture'),
  now: params.has('capture') && !Number.isNaN(parsedNow) ? parsedNow : undefined,
}

export function initCapture() {
  if (!capture.enabled) return
  document.documentElement.dataset.capture = 'true'
}

export async function markCaptureReady() {
  if (!capture.enabled) return
  await document.fonts.ready
  await Promise.all([...document.images].map((img) => img.decode().catch(() => undefined)))
  await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())))
  document.documentElement.dataset.captureReady = 'true'
}
