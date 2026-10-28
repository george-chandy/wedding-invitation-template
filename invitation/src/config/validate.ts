import { isValidTimeZone, zonedToInstant } from '../lib/time'
import type { SectionId, WeddingConfig } from './types'

export class ConfigError extends Error {
  readonly issues: string[]
  constructor(issues: string[]) {
    super(`Invalid wedding config:\n - ${issues.join('\n - ')}`)
    this.name = 'ConfigError'
    this.issues = issues
  }
}

const DATE = /^\d{4}-\d{2}-\d{2}$/
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/
const SECTION_IDS: readonly SectionId[] = ['hero', 'story', 'countdown', 'schedule', 'venue', 'details', 'gallery', 'rsvp', 'footer']
/** Sections that need a matching block of data in the config. */
const NEEDS_DATA: Partial<Record<SectionId, keyof WeddingConfig>> = {
  story: 'story',
  countdown: 'countdown',
  schedule: 'schedule',
  details: 'details',
  gallery: 'gallery',
  rsvp: 'rsvp',
}

const realDate = (s: string) => {
  if (!DATE.test(s)) return false
  const [y, m, d] = s.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d
}

const isHttpUrl = (s: string) => {
  try {
    const u = new URL(s)
    return u.protocol === 'https:' || u.protocol === 'http:'
  } catch {
    return false
  }
}

/** Anything that receives guest data must be https (http only for local development). */
const isSecureUrl = (s: string) => {
  try {
    const u = new URL(s)
    return u.protocol === 'https:' || (u.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(u.hostname))
  } catch {
    return false
  }
}

const THEME_TOKENS = ['bg', 'bg-alt', 'surface', 'ink', 'ink-muted', 'accent', 'accent-strong', 'line', 'inverse-bg', 'inverse-ink']
const TRAVEL_ICONS = ['plane', 'train', 'car', 'bus', 'walk']

/** Throws a ConfigError listing every problem with its path. Returns the config when valid. */
export function validateConfig(c: WeddingConfig): WeddingConfig {
  try {
    return check(c)
  } catch (e) {
    if (e instanceof ConfigError) throw e
    // Safety net: a shape problem the checks did not anticipate still produces a readable message, never a raw TypeError.
    throw new ConfigError([`the configuration has an unexpected shape (${e instanceof Error ? e.message : String(e)}) — compare it with src/config/wedding.ts`])
  }
}

function check(c: WeddingConfig): WeddingConfig {
  if (!c || typeof c !== 'object' || Array.isArray(c)) throw new ConfigError(['the configuration must be an object (see src/config/wedding.ts)'])
  const issues: string[] = []
  const need = (ok: unknown, msg: string) => {
    if (!ok) issues.push(msg)
  }
  const text = (v: unknown) => typeof v === 'string' && v.trim().length > 0
  const str = (v: unknown) => typeof v === 'string'
  const list = (v: unknown): v is unknown[] => Array.isArray(v)
  /** Optional art-direction fields shared by every image: `focus` ("x% y%") and `srcSet` ("path 560w, path 1120w"). */
  const imageOptions = (img: { focus?: unknown; srcSet?: unknown }, where: string) => {
    if (img.focus !== undefined) need(typeof img.focus === 'string' && /^\d{1,3}(\.\d+)?% \d{1,3}(\.\d+)?%$/.test(img.focus), `${where}.focus must look like "50% 30%"`)
    if (img.srcSet !== undefined) {
      const entries = typeof img.srcSet === 'string' ? img.srcSet.split(',').map((e) => e.trim()) : []
      need(entries.length > 0 && entries.every((e) => /^[^\s,]+ \d+w$/.test(e) && !/^(javascript|data):/i.test(e)), `${where}.srcSet must look like "photos/a-560.webp 560w, photos/a-1120.webp 1120w"`)
    }
  }

  need(text(c.site?.title), 'site.title is required')
  need(text(c.site?.description), 'site.description is required')
  need(text(c.site?.lang), 'site.lang is required (e.g. "en-GB")')
  if (c.site?.url) need(isHttpUrl(c.site.url), 'site.url must be an http(s) URL')

  const people = c.couple?.people
  need(Array.isArray(people) && people.length === 2, 'couple.people must contain exactly two people')
  if (Array.isArray(people)) {
    people.forEach((p, i) => {
      need(text(p?.first), `couple.people[${i}].first is required`)
      need(text(p?.full), `couple.people[${i}].full is required`)
      need(str(p?.role), `couple.people[${i}].role must be a string`)
      need(list(p?.family) && p.family.every(str), `couple.people[${i}].family must be a list of strings`)
    })
  }
  need(c.couple?.monogram?.length === 2 && c.couple.monogram.every(text), 'couple.monogram must be two non-empty strings')

  const e = c.event
  need(e && realDate(e.date), 'event.date must be a real date as YYYY-MM-DD')
  need(e && TIME.test(e.startTime), 'event.startTime must be HH:mm (24h)')
  need(e && TIME.test(e.endTime), 'event.endTime must be HH:mm (24h)')
  if (e?.endDate) need(realDate(e.endDate), 'event.endDate must be a real date as YYYY-MM-DD')
  need(e && text(e.timezone) && isValidTimeZone(e.timezone), 'event.timezone must be a valid IANA timezone, e.g. "Europe/London" (not a UTC offset)')
  if (e && realDate(e.date) && TIME.test(e.startTime) && TIME.test(e.endTime) && isValidTimeZone(e.timezone)) {
    const start = zonedToInstant(e.date, e.startTime, e.timezone)
    const end = zonedToInstant(e.endDate ?? e.date, e.endTime, e.timezone)
    need(end > start, 'event end must be after start (set event.endDate if the event runs past midnight)')
  }

  const v = c.venue
  need(v && text(v.name), 'venue.name is required')
  need(v && Array.isArray(v.address) && v.address.length > 0 && v.address.every(text), 'venue.address must be a non-empty list of lines')
  need(v && str(v.description), 'venue.description must be a string')
  need(v && list(v.travel), 'venue.travel must be a list (use [] for none)')
  if (v && list(v.travel)) v.travel.forEach((t, i) => {
    need(text(t?.label) && str(t?.detail), `venue.travel[${i}] needs label and detail`)
    need(TRAVEL_ICONS.includes(t?.icon), `venue.travel[${i}].icon must be one of ${TRAVEL_ICONS.join(', ')}`)
  })

  need(c.envelope && typeof c.envelope.enabled === 'boolean' && str(c.envelope.hint) && str(c.envelope.letterLine), 'envelope needs enabled (true/false), hint and letterLine')
  need(c.hero && str(c.hero.greeting) && str(c.hero.tagline), 'hero needs greeting and tagline (strings)')
  need(c.footer && str(c.footer.eyebrow) && str(c.footer.message), 'footer needs eyebrow and message')
  if (c.site?.shareImage) {
    const im = c.site.shareImage
    need(text(im.src) && text(im.alt) && im.width > 0 && im.height > 0, 'site.shareImage needs src, alt, width and height')
  }
  if (c.strings) need(Object.values(c.strings).every(str), 'strings: every override must be a string')

  const copy = (name: 'story' | 'countdown' | 'schedule' | 'details' | 'gallery' | 'rsvp') => {
    const b = c[name]
    if (b) need(str(b.eyebrow) && text(b.heading), `${name}.eyebrow and ${name}.heading are required`)
  }
  ;(['story', 'countdown', 'schedule', 'details', 'gallery', 'rsvp'] as const).forEach(copy)
  if (c.story) {
    need(list(c.story.message) && c.story.message.every(str), 'story.message must be a list of paragraphs')
    need(list(c.story.chapters), 'story.chapters must be a list (use [] for none)')
  }
  if (c.countdown) need(str(c.countdown.during) && str(c.countdown.after), 'countdown.during and countdown.after must be strings')
  if (c.schedule) need(list(c.schedule.items), 'schedule.items must be a list')
  if (c.details) need(list(c.details.items), 'details.items must be a list')
  if (list(c.story?.chapters)) c.story!.chapters.forEach((ch, i) => need(text(ch?.label) && text(ch?.title) && str(ch?.body), `story.chapters[${i}] needs label, title and body`))
  if (list(c.schedule?.items)) c.schedule!.items.forEach((it, i) => need(text(it?.title), `schedule.items[${i}].title is required`))
  if (list(c.details?.items)) c.details!.items.forEach((it, i) => need(text(it?.title) && str(it?.body), `details.items[${i}] needs title and body`))
  if (c.gallery) need(list(c.gallery.images), 'gallery.images must be a list')
  if (v?.coordinates) {
    const { lat, lng } = v.coordinates
    need(lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180, 'venue.coordinates out of range')
  }

  need(Array.isArray(c.sections) && c.sections.length > 0, 'sections must list at least one section id')
  const seen = new Set<string>()
  if (Array.isArray(c.sections)) c.sections.forEach((id) => {
    need(SECTION_IDS.includes(id), `sections: unknown id "${id}" (valid: ${SECTION_IDS.join(', ')})`)
    need(!seen.has(id), `sections: "${id}" is listed twice`)
    seen.add(id)
    const key = NEEDS_DATA[id]
    if (key) need(c[key], `sections lists "${id}" but config.${key} is missing — add the data or remove it from sections`)
  })

  if (list(c.schedule?.items)) c.schedule!.items.forEach((it, i) => need(TIME.test(it?.time), `schedule.items[${i}].time must be HH:mm`))
  if (list(c.gallery?.images)) c.gallery!.images.forEach((img, i) => {
    need(text(img.alt), `gallery.images[${i}].alt is required (describe the image)`)
    need(img.width > 0 && img.height > 0, `gallery.images[${i}] needs width and height (prevents layout shift)`)
    imageOptions(img, `gallery.images[${i}]`)
  })
  for (const [name, img] of [['hero.image', c.hero?.image], ['venue.image', c.venue?.image]] as const) {
    if (img === undefined) continue
    need(img && typeof img === 'object' && text(img.alt), `${name}.alt is required (describe the image)`)
    need(img && img.width > 0 && img.height > 0, `${name} needs width and height (prevents layout shift)`)
    if (img && typeof img === 'object') imageOptions(img, name)
  }

  const r = c.rsvp
  if (r) {
    need(['link', 'email', 'endpoint'].includes(r.mode), 'rsvp.mode must be "link", "email" or "endpoint"')
    if (r.mode === 'link') need(r.url && isSecureUrl(r.url), 'rsvp.mode "link" needs rsvp.url (https)')
    if (r.mode === 'email') need(r.email && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(r.email), 'rsvp.mode "email" needs a valid rsvp.email')
    if (r.mode === 'endpoint') need(r.endpoint && isSecureUrl(r.endpoint), 'rsvp.mode "endpoint" needs rsvp.endpoint (https; http is allowed only for localhost). Guest data is sent there.')
    if (r.mode !== 'endpoint' && r.endpoint) issues.push('rsvp.endpoint is set but rsvp.mode is not "endpoint" — remove it so nothing is submitted by accident')
    if (r.deadline) need(realDate(r.deadline), 'rsvp.deadline must be YYYY-MM-DD')
    need(Number.isInteger(r.maxGuests) && r.maxGuests >= 1, 'rsvp.maxGuests must be a whole number ≥ 1')
  }

  need(c.theme && ['ivory', 'midnight'].includes(c.theme.name), 'theme.name must be "ivory" or "midnight"')
  for (const [k, val] of Object.entries(c.theme?.overrides ?? {})) {
    need(THEME_TOKENS.includes(k), `theme.overrides: unknown token "${k}" (valid: ${THEME_TOKENS.join(', ')})`)
    need(text(val) && !/[;{}]/.test(String(val)), `theme.overrides.${k} must be a plain CSS colour`)
  }

  if (issues.length) throw new ConfigError(issues)
  return c
}
