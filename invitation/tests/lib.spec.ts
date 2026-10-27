import { expect, test } from '@playwright/test'
import { buildIcs, escapeIcsText, foldIcsLine, googleCalendarUrl, toCalendarEvent, utcStamp, type CalendarEvent } from '../src/lib/calendar'
import { breakdown, phaseAt, zonedToInstant } from '../src/lib/time'
import { ConfigError, loadWedding } from '../src/config'
import { resolveWedding } from '../src/config/resolve'
import { validateConfig } from '../src/config/validate'
import { weddingConfig } from '../src/config/wedding'
import { buildRsvpMailto } from '../src/lib/rsvp'
import type { WeddingConfig } from '../src/config/types'

const clone = (): WeddingConfig => structuredClone(weddingConfig)

test.describe('zonedToInstant', () => {
  const cases: [string, string, string, string][] = [
    ['summer London (BST +1)', '2027-06-12 16:00 Europe/London', '', '2027-06-12T15:00:00.000Z'],
    ['winter London (GMT)', '2027-01-12 16:00 Europe/London', '', '2027-01-12T16:00:00.000Z'],
    ['Tokyo (+9, no DST)', '2027-06-12 16:00 Asia/Tokyo', '', '2027-06-12T07:00:00.000Z'],
    ['Kolkata (+5:30)', '2027-06-12 16:00 Asia/Kolkata', '', '2027-06-12T10:30:00.000Z'],
    ['New York summer (-4)', '2027-06-12 16:00 America/New_York', '', '2027-06-12T20:00:00.000Z'],
    ['spring-forward gap shifts forward', '2027-03-14 02:30 America/New_York', '', '2027-03-14T07:30:00.000Z'],
    ['fall-back ambiguity picks first', '2027-11-07 01:30 America/New_York', '', '2027-11-07T05:30:00.000Z'],
    ['day before London change', '2027-03-27 16:00 Europe/London', '', '2027-03-27T16:00:00.000Z'],
    ['day after London change', '2027-03-28 16:00 Europe/London', '', '2027-03-28T15:00:00.000Z'],
  ]
  for (const [name, input, , expected] of cases) {
    test(name, () => {
      const [date, time, tz] = input.split(' ')
      expect(zonedToInstant(date, time, tz).toISOString()).toBe(expected)
    })
  }
})

test.describe('countdown maths', () => {
  test('breakdown', () => {
    expect(breakdown(((2 * 24 + 3) * 60 * 60 + 4 * 60 + 5) * 1000 + 999)).toEqual({ days: 2, hours: 3, minutes: 4, seconds: 5 })
    expect(breakdown(-5000)).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  })
  test('phases', () => {
    expect(phaseAt(0, 10, 20)).toBe('before')
    expect(phaseAt(10, 10, 20)).toBe('during')
    expect(phaseAt(20, 10, 20)).toBe('after')
  })
})

test.describe('sample config', () => {
  const w = loadWedding()
  test('is valid and resolves to the expected instants', () => {
    expect(w.start.toISOString()).toBe('2027-06-12T15:00:00.000Z')
    expect(w.end.toISOString()).toBe('2027-06-12T22:00:00.000Z')
    expect(w.labels.dateLong).toMatch(/^Saturday,? 12 June 2027$/)
    expect(w.labels.time).toBe('16:00') // en-GB uses the 24-hour clock
    expect(w.names.short).toBe('Elena & Theo')
  })
})

test.describe('google calendar url', () => {
  const w = loadWedding()
  const url = new URL(googleCalendarUrl(toCalendarEvent(w)))
  test('endpoint and action', () => {
    expect(url.origin + url.pathname).toBe('https://calendar.google.com/calendar/render')
    expect(url.searchParams.get('action')).toBe('TEMPLATE')
  })
  test('title, dates (UTC), location, timezone', () => {
    expect(url.searchParams.get('text')).toBe('The wedding of Elena & Theo')
    expect(url.searchParams.get('dates')).toBe('20270612T150000Z/20270612T220000Z')
    expect(url.searchParams.get('location')).toBe('The Orangery at Willowmere, 1 Willowmere Lane, Meadowbrook, MB1 2WL')
    expect(url.searchParams.get('ctz')).toBe('Europe/London')
    expect(url.searchParams.get('details')).toContain('Elena Vale & Theo Marlowe')
  })
})

test.describe('ics', () => {
  const base: CalendarEvent = {
    title: 'Weddings, "quotes"; and\\slashes',
    description: 'Line one\nLine two, with comma; and semicolon — ünïcode ❤',
    location: 'Hall, 1 Road',
    start: new Date('2027-06-12T15:00:00Z'),
    end: new Date('2027-06-12T22:00:00Z'),
    timezone: 'Europe/London',
    geo: { lat: 51.5, lng: -0.12 },
    uid: 'uid-1@example.org',
  }
  const now = new Date('2026-01-01T00:00:00Z')
  const ics = buildIcs(base, now)
  const unfolded = ics.replace(/\r\n /g, '')

  test('structure', () => {
    expect(ics.endsWith('\r\n')).toBe(true)
    expect(ics).not.toMatch(/[^\r]\n/) // only CRLF line breaks
    const lines = unfolded.split('\r\n').filter(Boolean)
    expect(lines[0]).toBe('BEGIN:VCALENDAR')
    expect(lines.at(-1)).toBe('END:VCALENDAR')
    for (const k of ['VERSION:2.0', 'PRODID:', 'BEGIN:VEVENT', 'UID:uid-1@example.org', 'END:VEVENT']) {
      expect(lines.some((l) => l.startsWith(k))).toBe(true)
    }
    expect(lines.filter((l) => l === 'BEGIN:VEVENT')).toHaveLength(1)
  })
  test('times are UTC and correct', () => {
    expect(unfolded).toContain('DTSTART:20270612T150000Z')
    expect(unfolded).toContain('DTEND:20270612T220000Z')
    expect(unfolded).toContain('DTSTAMP:20260101T000000Z')
    expect(utcStamp(base.start)).toBe('20270612T150000Z')
  })
  test('escaping', () => {
    expect(escapeIcsText('a,b;c\\d\ne')).toBe('a\\,b\\;c\\\\d\\ne')
    expect(unfolded).toContain('SUMMARY:Weddings\\, "quotes"\\; and\\\\slashes')
    expect(unfolded).toContain('DESCRIPTION:Line one\\nLine two\\, with comma\\; and semicolon — ünïcode ❤')
    expect(unfolded).toContain('GEO:51.5;-0.12')
  })
  test('folding keeps lines ≤ 75 octets and never splits a character', () => {
    const long = 'DESCRIPTION:' + 'ü❤x'.repeat(60)
    const folded = foldIcsLine(long)
    for (const l of folded.split('\r\n')) expect(new TextEncoder().encode(l).length).toBeLessThanOrEqual(75)
    expect(folded.replace(/\r\n /g, '')).toBe(long)
    for (const l of ics.split('\r\n')) expect(new TextEncoder().encode(l).length).toBeLessThanOrEqual(75)
  })
})

test.describe('config validation', () => {
  const bad = (mutate: (c: WeddingConfig) => void) => {
    const c = clone()
    mutate(c)
    try {
      validateConfig(c)
    } catch (e) {
      expect(e).toBeInstanceOf(ConfigError)
      return (e as ConfigError).issues.join('\n')
    }
    throw new Error('expected validation to fail')
  }
  test('accepts the sample', () => {
    expect(() => validateConfig(clone())).not.toThrow()
  })
  test('rejects impossible date, fixed-offset timezone, bad times', () => {
    expect(bad((c) => (c.event.date = '2027-02-30'))).toContain('event.date')
    expect(bad((c) => (c.event.timezone = '+01:00'))).toContain('event.timezone')
    expect(bad((c) => (c.event.startTime = '4pm'))).toContain('event.startTime')
  })
  test('rejects end before start unless endDate is set', () => {
    expect(bad((c) => (c.event.endTime = '10:00'))).toContain('end must be after start')
    const c = clone()
    c.event.endTime = '01:00'
    c.event.endDate = '2027-06-13'
    expect(() => validateConfig(c)).not.toThrow()
    expect(resolveWedding(c).end.toISOString()).toBe('2027-06-13T00:00:00.000Z')
  })
  test('sections must have data; duplicates and unknown ids rejected', () => {
    expect(bad((c) => delete c.gallery)).toContain('config.gallery is missing')
    expect(bad((c) => c.sections.push('hero'))).toContain('listed twice')
    expect(bad((c) => (c.sections as string[]).push('nope'))).toContain('unknown id')
  })
  test('removing a section from the list is enough to drop it', () => {
    const c = clone()
    c.sections = c.sections.filter((s) => s !== 'gallery')
    delete c.gallery
    expect(() => validateConfig(c)).not.toThrow()
  })
  test('rsvp modes demand their field', () => {
    expect(bad((c) => (c.rsvp!.mode = 'link'))).toContain('rsvp.url')
    expect(bad((c) => (c.rsvp!.email = 'nope'))).toContain('rsvp.email')
    expect(bad((c) => ((c.rsvp!.mode = 'endpoint'), (c.rsvp!.endpoint = 'ftp://x')))).toContain('rsvp.endpoint')
  })
  test('gallery images need alt text and dimensions', () => {
    expect(bad((c) => (c.gallery!.images[0].alt = ''))).toContain('alt')
    expect(bad((c) => (c.gallery!.images[0].width = 0))).toContain('width and height')
  })
  test('reports every problem at once', () => {
    const msg = bad((c) => {
      c.event.date = 'x'
      c.theme.name = 'neon' as never
    })
    expect(msg).toContain('event.date')
    expect(msg).toContain('theme.name')
  })
})

test.describe('rsvp mailto', () => {
  test('encodes subject and body, omits guests when declining', () => {
    const url = buildRsvpMailto({ email: 'rsvp@example.com', names: 'Elena & Theo', reply: { name: 'Zoë & Co', attending: 'yes', guests: '2', notes: 'Vegan; no nuts' }, yes: 'Yes', no: 'No' })
    expect(url.startsWith('mailto:rsvp@example.com?subject=')).toBe(true)
    const q = new URL(url).searchParams
    expect(q.get('subject')).toBe('RSVP — Zoë & Co — Elena & Theo')
    expect(q.get('body')).toBe('Name: Zoë & Co\r\nAttending: Yes\r\nGuests: 2\r\nNotes: Vegan; no nuts')
    const no = new URL(buildRsvpMailto({ email: 'a@b.co', names: 'x', reply: { name: 'A', attending: 'no', guests: '3', notes: '' }, yes: 'Yes', no: 'No' })).searchParams
    expect(no.get('body')).toBe('Name: A\r\nAttending: No')
  })
})
