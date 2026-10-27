/**
 * Timezone-correct conversion of a venue-local wall-clock time to an instant,
 * using only Intl (no date library). Handles DST: the offset is derived for the
 * target date, never hardcoded.
 */

const partsFormatters = new Map<string, Intl.DateTimeFormat>()

function formatter(timeZone: string) {
  let f = partsFormatters.get(timeZone)
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
    partsFormatters.set(timeZone, f)
  }
  return f
}

/** Offset (ms) of `timeZone` from UTC at the given instant. East of UTC is positive. */
export function tzOffsetMs(utcMs: number, timeZone: string): number {
  const parts = formatter(timeZone).formatToParts(new Date(utcMs))
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value)
  const asIfUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'))
  return asIfUtc - Math.floor(utcMs / 1000) * 1000
}

/**
 * Convert "2027-06-12" + "16:00" in "Europe/London" to the matching instant.
 * For a wall-clock time that does not exist (spring-forward gap) the result is
 * shifted forward by the gap, like most calendar apps.
 */
export function zonedToInstant(date: string, time: string, timeZone: string): Date {
  const [y, m, d] = date.split('-').map(Number)
  const [hh, mm] = time.split(':').map(Number)
  const wall = Date.UTC(y, m - 1, d, hh, mm)
  // Offsets a day either side bracket any single DST transition.
  const day = 86_400_000
  const candidates = [...new Set([wall - tzOffsetMs(wall - day, timeZone), wall - tzOffsetMs(wall + day, timeZone)])].sort((a, b) => a - b)
  // A candidate is valid if converting it back gives the requested wall time.
  const valid = candidates.filter((c) => c + tzOffsetMs(c, timeZone) === wall)
  // ambiguous (clocks go back) → earliest; gap (clocks go forward) → pre-transition offset, i.e. shifted forward
  return new Date(valid[0] ?? wall - tzOffsetMs(wall - day, timeZone))
}

export function isValidTimeZone(tz: string): boolean {
  // Modern Intl accepts fixed offsets like "+01:00"; those cannot follow DST, so reject them.
  if (/^[+-]\d/.test(tz)) return false
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz })
    return true
  } catch {
    return false
  }
}

export interface Breakdown {
  days: number
  hours: number
  minutes: number
  seconds: number
}

export function breakdown(ms: number): Breakdown {
  const s = Math.max(0, Math.floor(ms / 1000))
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
  }
}

export type EventPhase = 'before' | 'during' | 'after'

export function phaseAt(now: number, start: number, end: number): EventPhase {
  if (now < start) return 'before'
  if (now < end) return 'during'
  return 'after'
}
