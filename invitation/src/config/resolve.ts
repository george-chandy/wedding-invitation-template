import { defaultStrings, type Strings } from '../content/strings'
import { zonedToInstant } from '../lib/time'
import type { SectionId, WeddingConfig } from './types'

/** The config plus values derived from it. Components read this, never the raw config. */
export interface Wedding extends WeddingConfig {
  strings: Strings
  start: Date
  end: Date
  names: { short: string; full: string }
  /** Locale/timezone-formatted labels, always rendered in the venue's timezone. */
  labels: {
    weekday: string
    dateLong: string
    dateShort: string
    /** e.g. "12 · 06 · 2027" */
    dateNumeric: string
    time: string
    endTime: string
    month: string
    day: string
    year: string
  }
  venueLine: string
  mapsQuery: string
  /** Format a venue-local "HH:mm" for display (e.g. schedule rows). */
  formatClock: (hhmm: string) => string
  formatDate: (yyyymmdd: string) => string
}

export function resolveWedding(c: WeddingConfig): Wedding {
  const { date, startTime, endTime, endDate, timezone } = c.event
  const start = zonedToInstant(date, startTime, timezone)
  const end = zonedToInstant(endDate ?? date, endTime, timezone)
  const lang = c.site.lang

  const fmt = (opts: Intl.DateTimeFormatOptions, d = start) =>
    new Intl.DateTimeFormat(lang, { timeZone: timezone, ...opts }).format(d)

  const formatClock = (hhmm: string) => {
    const [h, m] = hhmm.split(':').map(Number)
    return new Intl.DateTimeFormat(lang, { timeZone: 'UTC', hour: 'numeric', minute: '2-digit' }).format(new Date(Date.UTC(2000, 0, 1, h, m)))
  }
  const formatDate = (ymd: string) => {
    const [y, m, d] = ymd.split('-').map(Number)
    return new Intl.DateTimeFormat(lang, { timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(Date.UTC(y, m - 1, d)))
  }

  const [y, m, d] = date.split('-')
  const [a, b] = c.couple.people

  // A section whose list is empty would render a heading over nothing: skip it (and its nav entry) instead.
  const empty: Partial<Record<SectionId, boolean>> = {
    // story: !c.story?.message.length && !c.story?.chapters.length,
    // schedule: !c.schedule?.items.length,
    // details: !c.details?.items.length,
    // gallery: !c.gallery?.images.length,
  }
  const sections = c.sections.filter((id) => !empty[id])

  return {
    ...c,
    sections,
    strings: { ...defaultStrings, ...c.strings },
    start,
    end,
    names: { short: `${a.first} & ${b.first}`, full: `${a.full} & ${b.full}` },
    labels: {
      weekday: fmt({ weekday: 'long' }),
      dateLong: fmt({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
      dateShort: fmt({ day: 'numeric', month: 'long', year: 'numeric' }),
      dateNumeric: `${d} · ${m} · ${y}`,
      time: fmt({ hour: 'numeric', minute: '2-digit' }),
      endTime: fmt({ hour: 'numeric', minute: '2-digit' }, end),
      month: fmt({ month: 'long' }),
      day: fmt({ day: 'numeric' }),
      year: fmt({ year: 'numeric' }),
    },
    venueLine: `${c.venue.name}, ${c.venue.address.join(', ')}`,
    mapsQuery: c.venue.mapsQuery ?? `${c.venue.name}, ${c.venue.address.join(', ')}`,
    formatClock,
    formatDate,
  }
}
