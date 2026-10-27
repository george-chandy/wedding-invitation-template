import type { Wedding } from '../config/resolve'

export interface CalendarEvent {
  title: string
  description: string
  location: string
  start: Date
  end: Date
  /** IANA timezone, passed to Google Calendar as `ctz` so it displays in venue time. */
  timezone: string
  geo?: { lat: number; lng: number }
  url?: string
  /** Stable identifier so re-importing updates rather than duplicates. */
  uid: string
}

/** 20270612T150000Z */
export const utcStamp = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')

export function toCalendarEvent(w: Wedding): CalendarEvent {
  const host = w.site.url ? new URL(w.site.url).hostname : 'invitation.template'
  return {
    title: w.event.title,
    description: `You are warmly invited to celebrate the wedding of ${w.names.full} at ${w.venue.name}.`,
    location: w.venueLine,
    start: w.start,
    end: w.end,
    timezone: w.event.timezone,
    geo: w.venue.coordinates,
    url: w.site.url,
    uid: `${utcStamp(w.start)}-${w.couple.monogram.join('').toLowerCase().replace(/[^a-z0-9]/g, '') || 'event'}@${host}`,
  }
}

export function googleCalendarUrl(e: CalendarEvent): string {
  const p = new URLSearchParams({
    action: 'TEMPLATE',
    text: e.title,
    dates: `${utcStamp(e.start)}/${utcStamp(e.end)}`,
    details: e.description,
    location: e.location,
    ctz: e.timezone,
  })
  return `https://calendar.google.com/calendar/render?${p}`
}

/** RFC 5545 §3.3.11 TEXT escaping. */
export function escapeIcsText(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r\n|\r|\n/g, '\\n')
}

/** RFC 5545 §3.1: lines ≤ 75 octets, continuation lines start with one space. Never splits a UTF-8 character. */
export function foldIcsLine(line: string): string {
  const enc = new TextEncoder()
  if (enc.encode(line).length <= 75) return line
  const out: string[] = []
  let cur = ''
  let bytes = 0
  let limit = 75
  for (const ch of line) {
    const n = enc.encode(ch).length
    if (bytes + n > limit) {
      out.push(cur)
      cur = ''
      bytes = 0
      limit = 74 // leading space counts toward the 75
    }
    cur += ch
    bytes += n
  }
  out.push(cur)
  return out.join('\r\n ')
}

export function buildIcs(e: CalendarEvent, now: Date = new Date()): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Wedding Invitation Template//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${e.uid}`,
    `DTSTAMP:${utcStamp(now)}`,
    `DTSTART:${utcStamp(e.start)}`,
    `DTEND:${utcStamp(e.end)}`,
    `SUMMARY:${escapeIcsText(e.title)}`,
    `DESCRIPTION:${escapeIcsText(e.description)}`,
    `LOCATION:${escapeIcsText(e.location)}`,
    ...(e.geo ? [`GEO:${e.geo.lat};${e.geo.lng}`] : []),
    ...(e.url ? [`URL:${e.url}`] : []),
    'END:VEVENT',
    'END:VCALENDAR',
  ]
  return lines.map(foldIcsLine).join('\r\n') + '\r\n'
}

export function downloadIcs(e: CalendarEvent, filename = 'wedding-invitation.ics') {
  const url = URL.createObjectURL(new Blob([buildIcs(e)], { type: 'text/calendar;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  // Revoke after the browser has had a chance to start the download.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
