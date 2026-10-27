import { expect, test } from '@playwright/test'
import { buildIcs, googleCalendarUrl, toCalendarEvent, type CalendarEvent } from '../src/lib/calendar'
import { loadWedding } from '../src/config'
import { resolveWedding } from '../src/config/resolve'
import { ConfigError, validateConfig } from '../src/config/validate'
import { weddingConfig } from '../src/config/wedding'
import type { WeddingConfig } from '../src/config/types'
import { phaseAt, zonedToInstant } from '../src/lib/time'

const clone = (): WeddingConfig => structuredClone(weddingConfig)
const issuesFor = (c: unknown): string => {
  try {
    validateConfig(c as WeddingConfig)
  } catch (e) {
    expect(e).toBeInstanceOf(ConfigError) // never a raw TypeError
    return (e as ConfigError).issues.join('\n')
  }
  throw new Error('expected validation to fail')
}

test.describe('timezones and daylight saving: known instants', () => {
  // [local date, local time, IANA zone, expected UTC instant]
  const cases: [string, string, string, string, string][] = [
    ['London summer (BST, +1)', '2027-06-12', '16:00', 'Europe/London', '2027-06-12T15:00:00.000Z'],
    ['London spring-forward day, before the change', '2027-03-28', '00:30', 'Europe/London', '2027-03-28T00:30:00.000Z'],
    ['London spring-forward day, after the change', '2027-03-28', '03:00', 'Europe/London', '2027-03-28T02:00:00.000Z'],
    ['London gap 01:30 does not exist → shifted forward', '2027-03-28', '01:30', 'Europe/London', '2027-03-28T01:30:00.000Z'],
    ['London fall-back day, ambiguous 01:30 → first (BST)', '2027-10-31', '01:30', 'Europe/London', '2027-10-31T00:30:00.000Z'],
    ['London fall-back day, after the change', '2027-10-31', '03:00', 'Europe/London', '2027-10-31T03:00:00.000Z'],
    ['New York gap 02:30 → shifted forward', '2027-03-14', '02:30', 'America/New_York', '2027-03-14T07:30:00.000Z'],
    ['New York fall-back ambiguous 01:30 → first (EDT)', '2027-11-07', '01:30', 'America/New_York', '2027-11-07T05:30:00.000Z'],
    ['Sydney (southern hemisphere) AEDT in January', '2027-01-15', '16:00', 'Australia/Sydney', '2027-01-15T05:00:00.000Z'],
    ['Sydney AEST in June', '2027-06-12', '16:00', 'Australia/Sydney', '2027-06-12T06:00:00.000Z'],
    ['Sydney spring-forward gap 02:30 (3 Oct 2027) → shifted forward', '2027-10-03', '02:30', 'Australia/Sydney', '2027-10-02T16:30:00.000Z'],
    ['Lord Howe (30-minute DST) summer', '2027-01-15', '16:00', 'Australia/Lord_Howe', '2027-01-15T05:00:00.000Z'],
    ['Lord Howe winter (+10:30)', '2027-06-12', '16:00', 'Australia/Lord_Howe', '2027-06-12T05:30:00.000Z'],
    ['Kathmandu (+5:45)', '2027-06-12', '16:00', 'Asia/Kathmandu', '2027-06-12T10:15:00.000Z'],
    ['Auckland NZST (+12) in June', '2027-06-12', '16:00', 'Pacific/Auckland', '2027-06-12T04:00:00.000Z'],
    ['UTC', '2027-06-12', '16:00', 'UTC', '2027-06-12T16:00:00.000Z'],
    ['leap day', '2028-02-29', '12:00', 'Europe/Paris', '2028-02-29T11:00:00.000Z'],
  ]
  for (const [name, date, time, tz, expected] of cases) {
    test(name, () => expect(zonedToInstant(date, time, tz).toISOString()).toBe(expected))
  }

  test('an event running past midnight across a DST change keeps the right duration in UTC', () => {
    const c = clone()
    c.event = { ...c.event, timezone: 'Europe/London', date: '2027-03-27', startTime: '20:00', endDate: '2027-03-28', endTime: '03:00' }
    const w = resolveWedding(validateConfig(c))
    // 20:00 GMT (20:00Z) → 03:00 BST (02:00Z) the next day = 6 hours of real time
    expect(w.start.toISOString()).toBe('2027-03-27T20:00:00.000Z')
    expect(w.end.toISOString()).toBe('2027-03-28T02:00:00.000Z')
  })
})

test.describe('calendar output for edge-case events', () => {
  const sample = loadWedding()

  test('Google URL: exact range, timezone, and awkward characters round-trip', () => {
    const e: CalendarEvent = { ...toCalendarEvent(sample), title: 'Zoë & Łukasz — 50% #1 + more?', location: 'Café "Ünï", 1 Rue de l’Église; Paris' }
    const u = new URL(googleCalendarUrl(e))
    expect(u.searchParams.get('text')).toBe('Zoë & Łukasz — 50% #1 + more?')
    expect(u.searchParams.get('location')).toBe('Café "Ünï", 1 Rue de l’Église; Paris')
    expect(u.searchParams.get('dates')).toBe('20270612T150000Z/20270612T220000Z')
    expect(u.searchParams.get('ctz')).toBe('Europe/London')
    expect([...u.searchParams.keys()].sort()).toEqual(['action', 'ctz', 'dates', 'details', 'location', 'text'])
  })

  test('ICS: exact output for a known event (golden file)', () => {
    const e: CalendarEvent = {
      title: 'Wedding, Elena & Theo',
      description: 'Line 1\nLine 2; ok',
      location: 'The Orangery, Meadowbrook',
      start: new Date('2027-06-12T15:00:00Z'),
      end: new Date('2027-06-12T22:00:00Z'),
      timezone: 'Europe/London',
      geo: { lat: 51.5, lng: -0.12 },
      url: 'https://example.org/',
      uid: 'abc@example.org',
    }
    expect(buildIcs(e, new Date('2026-01-02T03:04:05Z'))).toBe(
      [
        'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Wedding Invitation Template//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
        'BEGIN:VEVENT', 'UID:abc@example.org', 'DTSTAMP:20260102T030405Z', 'DTSTART:20270612T150000Z', 'DTEND:20270612T220000Z',
        'SUMMARY:Wedding\\, Elena & Theo', 'DESCRIPTION:Line 1\\nLine 2\\; ok', 'LOCATION:The Orangery\\, Meadowbrook',
        'GEO:51.5;-0.12', 'URL:https://example.org/', 'END:VEVENT', 'END:VCALENDAR', '',
      ].join('\r\n'),
    )
  })

  test('ICS: very long accented fields fold to ≤75 octets, unfold losslessly, and use CRLF only', () => {
    const long = 'Ünï©ødé ❤ '.repeat(80)
    const e: CalendarEvent = { ...toCalendarEvent(sample), description: long, location: long, title: long }
    const ics = buildIcs(e, new Date('2026-01-01T00:00:00Z'))
    for (const line of ics.split('\r\n')) expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75)
    expect(ics).not.toMatch(/[^\r]\n|\r[^\n]/)
    const unfolded = ics.replace(/\r\n /g, '')
    expect(unfolded).toContain(`DESCRIPTION:${long.replace(/,/g, '\\,')}`)
    expect(ics.split('\r\n').filter((l) => l.startsWith('BEGIN:VEVENT'))).toHaveLength(1)
  })

  test('ICS UID is stable, ASCII and independent of the monogram script', () => {
    const c = clone()
    c.couple.monogram = ['Ł', 'Ş']
    const e = toCalendarEvent(resolveWedding(validateConfig(c)))
    expect(e.uid).toMatch(/^[0-9TZ]+-[a-z0-9]+@[a-z0-9.-]+$/)
    expect(toCalendarEvent(resolveWedding(validateConfig(c))).uid).toBe(e.uid)
  })

  test('an event with an end date and DST produces matching Google and ICS ranges', () => {
    const c = clone()
    c.event = { ...c.event, date: '2027-10-30', startTime: '22:00', endDate: '2027-10-31', endTime: '02:30' }
    const e = toCalendarEvent(resolveWedding(validateConfig(c)))
    // 22:00 BST = 21:00Z; 02:30 on 31 Oct (after clocks go back, GMT) = 02:30Z → ambiguity-free here: 01:30 BST/GMT repeats, 02:30 is GMT
    expect(new URL(googleCalendarUrl(e)).searchParams.get('dates')).toBe('20271030T210000Z/20271031T023000Z')
    expect(buildIcs(e, new Date(0))).toContain('DTEND:20271031T023000Z')
  })
})

test.describe('configuration resilience', () => {
  test('long names and accented characters are accepted and formatted', () => {
    const c = clone()
    c.couple.people[0] = { ...c.couple.people[0], first: 'Maximilian-Alexander', full: 'Maximilian-Alexander Montgomery-Featherstonehaugh' }
    c.couple.people[1] = { ...c.couple.people[1], first: 'Łukasz', full: 'Łukasz Dvořák-Šebesta' }
    c.couple.monogram = ['M', 'Ł']
    const w = resolveWedding(validateConfig(c))
    expect(w.names.short).toBe('Maximilian-Alexander & Łukasz')
    expect(toCalendarEvent(w).description).toContain('Łukasz Dvořák-Šebesta')
  })

  test('every optional section can be omitted: only hero+venue, or only venue', () => {
    for (const keep of [['hero', 'venue'], ['venue'], ['hero'], ['hero', 'footer']] as const) {
      const c = clone()
      c.sections = [...keep]
      for (const k of ['story', 'countdown', 'schedule', 'details', 'gallery', 'rsvp'] as const) if (!keep.includes(k as never)) delete c[k]
      expect(() => resolveWedding(validateConfig(c))).not.toThrow()
    }
  })

  test('section order is whatever the config says', () => {
    const c = clone()
    c.sections = ['hero', 'rsvp', 'venue', 'story', 'footer']
    expect(resolveWedding(validateConfig(c)).sections).toEqual(['hero', 'rsvp', 'venue', 'story', 'footer'])
  })

  test('empty lists drop their section instead of rendering a heading over nothing', () => {
    const c = clone()
    c.gallery!.images = []
    c.schedule!.items = []
    c.details!.items = []
    c.story!.message = []
    c.story!.chapters = []
    const w = resolveWedding(validateConfig(c))
    expect(w.sections).not.toContain('gallery')
    expect(w.sections).not.toContain('schedule')
    expect(w.sections).not.toContain('details')
    expect(w.sections).not.toContain('story')
    expect(w.sections).toContain('venue')
  })

  test('gallery images may omit src (placeholder) but not alt or dimensions', () => {
    const c = clone()
    c.gallery!.images = [{ alt: 'A plate', width: 800, height: 600 }]
    expect(() => validateConfig(c)).not.toThrow()
    expect(issuesFor({ ...clone(), gallery: { ...clone().gallery!, images: [{ alt: '', width: 0, height: 10 }] } })).toMatch(/alt[\s\S]*width and height|width and height[\s\S]*alt/)
  })

  test('garbage input yields ConfigError with useful messages, never a TypeError', () => {
    for (const bad of [{}, [], null, 'text', 42, { site: 'x', couple: [], event: null, venue: 5, sections: 'hero' }]) {
      const msg = issuesFor(bad)
      expect(msg.length).toBeGreaterThan(10)
    }
    expect(issuesFor({})).toMatch(/site\.title[\s\S]*couple\.people[\s\S]*event\.date[\s\S]*venue\.name[\s\S]*sections/)
  })

  test('missing blocks the renderer relies on are reported by name', () => {
    const c = clone() as unknown as Record<string, unknown>
    delete c.footer
    delete c.hero
    delete c.envelope
    const msg = issuesFor(c)
    expect(msg).toMatch(/footer needs/)
    expect(msg).toMatch(/hero needs/)
    expect(msg).toMatch(/envelope needs/)
  })

  test('items with the wrong shape are rejected before they can crash a section', () => {
    const c = clone()
    ;(c.details!.items as unknown[])[0] = null
    ;(c.story!.chapters as unknown[])[0] = { label: 1 }
    ;(c.schedule!.items as unknown[])[0] = { time: '10:00' }
    const msg = issuesFor(c)
    expect(msg).toMatch(/details\.items\[0\]/)
    expect(msg).toMatch(/story\.chapters\[0\]/)
    expect(msg).toMatch(/schedule\.items\[0\]\.title/)
  })

  test('theme overrides: unknown tokens and injection attempts are rejected', () => {
    const c = clone()
    c.theme.overrides = { accent: '#123456' }
    expect(() => validateConfig(c)).not.toThrow()
    ;(c.theme as { overrides: Record<string, string> }).overrides = { evil: 'red', accent: 'red; background:url(x)' }
    expect(issuesFor(c)).toMatch(/unknown token "evil"[\s\S]*plain CSS colour/)
  })

  test('events in the past are valid and resolve to the "after" phase', () => {
    const c = clone()
    c.event.date = '2020-06-12'
    const w = resolveWedding(validateConfig(c))
    expect(phaseAt(Date.parse('2026-10-27T00:00:00Z'), w.start.getTime(), w.end.getTime())).toBe('after')
    expect(phaseAt(w.start.getTime() - 1, w.start.getTime(), w.end.getTime())).toBe('before')
    expect(phaseAt(w.end.getTime() - 1, w.start.getTime(), w.end.getTime())).toBe('during')
  })

  test('invalid event configuration fails clearly', () => {
    const c = clone()
    c.event = { ...c.event, date: '2027-13-01', startTime: '25:00', endTime: '9pm', timezone: 'Mars/Olympus' }
    const msg = issuesFor(c)
    for (const k of ['event.date', 'event.startTime', 'event.endTime', 'event.timezone']) expect(msg).toContain(k)
  })
})

test.describe('rsvp configuration safety', () => {
  test('endpoint must be https (http only on localhost) and cannot be left set in another mode', () => {
    const c = clone()
    Object.assign(c.rsvp!, { mode: 'endpoint', endpoint: 'http://forms.example.com/x' })
    expect(issuesFor(c)).toContain('https')
    c.rsvp!.endpoint = 'http://localhost:9000/x'
    expect(() => validateConfig(c)).not.toThrow()
    c.rsvp!.endpoint = 'https://forms.example.com/x'
    expect(() => validateConfig(c)).not.toThrow()
    // a forgotten endpoint while in email mode must not silently exist
    const d = clone()
    d.rsvp!.endpoint = 'https://forms.example.com/x'
    expect(issuesFor(d)).toContain('rsvp.endpoint is set but rsvp.mode is not')
  })
  test('link mode requires https', () => {
    const c = clone()
    Object.assign(c.rsvp!, { mode: 'link', url: 'http://example.com/form' })
    expect(issuesFor(c)).toContain('https')
  })
  test('javascript: and data: URLs are never accepted', () => {
    const c = clone()
    Object.assign(c.rsvp!, { mode: 'link', url: 'javascript:alert(1)' })
    expect(issuesFor(c)).toContain('rsvp.url')
  })
})
