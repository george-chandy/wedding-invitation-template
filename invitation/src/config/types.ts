/**
 * Template configuration model.
 *
 * This file is pure types (plus string unions). The data lives in `wedding.ts`,
 * which is the only file a couple needs to edit. Keep everything here free of
 * `import.meta`, DOM access and asset imports: `vite.config.ts` imports the
 * config at build time to inject social/SEO metadata.
 */

export type ThemeName = 'ivory' | 'midnight'

/** Semantic colour tokens a couple may override without touching CSS. */
export type ThemeToken =
  | 'bg'
  | 'bg-alt'
  | 'surface'
  | 'ink'
  | 'ink-muted'
  | 'accent'
  | 'accent-strong'
  | 'line'
  | 'inverse-bg'
  | 'inverse-ink'


  export type SectionId =
  | 'hero'
  | 'story'
  | 'venue'
  | 'rsvp'
  | 'footer'

// export type SectionId =
//   | 'hero'
//   | 'story'
//   | 'countdown'
//   | 'schedule'
//   | 'venue'
//   | 'details'
//   | 'gallery'
//   | 'rsvp'
//   | 'footer'

export interface Person {
  /** Used in the hero and nav, e.g. "Elena". */
  first: string
  /** Used in the story section and calendar text, e.g. "Elena Vale". */
  full: string
  role: string
  /** Free-form family lines, e.g. "Daughter of Marguerite & Anton Vale". */
  family: string[]
}

export interface ImageAsset {
  /**
   * Path relative to `public/` (e.g. "gallery/one.jpg") or an absolute URL.
   * Omit to render a generated decorative plate instead.
   */
  src?: string
  alt: string
  /** Intrinsic size; used for aspect-ratio so images never shift layout. */
  width: number
  height: number
  caption?: string
}

export interface SectionCopy {
  eyebrow: string
  heading: string
}

export interface TravelOption {
  icon: 'plane' | 'train' | 'car' | 'bus' | 'walk'
  label: string
  detail: string
}

export type RsvpMode = 'link' | 'email' | 'endpoint'

export interface WeddingConfig {
  site: {
    /** BCP-47 language for <html lang> and date formatting. */
    lang: string
    /** Public URL of the deployed site (enables absolute og:image / canonical). */
    url?: string
    title: string
    description: string
    shareImage?: { src: string; alt: string; width: number; height: number }
  }

  couple: {
    people: [Person, Person]
    /** Two letters shown on the wax seal. */
    monogram: [string, string]
  }

  event: {
    title: string
    /** Local calendar date at the venue, YYYY-MM-DD. */
    date: string
    /** Local wall-clock start/end at the venue, HH:mm (24h). */
    startTime: string
    endTime: string
    /** If the event ends after midnight, the local end date (defaults to `date`). */
    endDate?: string
    /** IANA timezone of the venue, e.g. "Europe/London". Never a fixed offset. */
    timezone: string
  }

  venue: {
    name: string
    /** Address lines, shown line by line and joined with ", " for maps/calendar. */
    address: string[]
    /** Used for "open in maps" links; defaults to name + address. */
    mapsQuery?: string
    coordinates?: { lat: number; lng: number }
    description: string
    travel: TravelOption[]
  }

  envelope: {
    enabled: boolean
    hint: string
    /** Text on the letter peeking from the envelope. */
    letterLine: string
  }

  hero: {
    greeting: string
    /** One line under the date, e.g. a city. */
    tagline: string
  }

  story?: SectionCopy & {
    message: string[]
    quote?: { text: string; cite: string }
    // chapters: { label: string; title: string; body: string }[]
  }

  // countdown?: SectionCopy & {
  //   /** Shown while the event is in progress. */
  //   during: string
  //   /** Shown after the event has ended. */
  //   after: string
  // }

  // schedule?: SectionCopy & {
  //   items: { time: string; title: string; description?: string; place?: string }[]
  // }

  // details?: SectionCopy & {
  //   items: { title: string; body: string }[]
  // }

  // gallery?: SectionCopy & {
  //   images: ImageAsset[]
  // }

  rsvp?: SectionCopy & {
    intro: string
    /** YYYY-MM-DD, shown as "kindly reply by …". */
    deadline?: string
    mode: RsvpMode
    /** mode "link": external form/booking page. */
    url?: string
    /** mode "email": the address the guest's mail app will write to. */
    email?: string
    /** mode "endpoint": POST target (e.g. a form provider). Receives JSON. */
    endpoint?: string
    maxGuests: number
    contacts?: { name: string; role: string; email?: string; phone?: string }[]
  }

  footer: {
    eyebrow: string
    message: string
    credit?: string
  }

  /** Ordered list of sections to render. Omit an id to remove the section. */
  sections: SectionId[]

  theme: {
    name: ThemeName
    overrides?: Partial<Record<ThemeToken, string>>
  }

  /** Optional UI string overrides, e.g. for translation. */
  strings?: Partial<import('../content/strings').Strings>
}
