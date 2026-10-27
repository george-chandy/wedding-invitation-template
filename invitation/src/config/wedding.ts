import type { WeddingConfig } from './types.ts'

/**
 * THE file to edit for a new couple. All names, dates, venue details and copy
 * are fictional sample content. See docs/template-customization.md.
 */
export const weddingConfig: WeddingConfig = {
  site: {
    lang: 'en-GB',
    title: 'Elena & Theo — Wedding Invitation',
    description:
      'Elena Vale and Theo Marlowe are getting married on Saturday 12 June 2027 at The Orangery at Willowmere. Open your invitation.',
    shareImage: { src: 'og.png', alt: 'Elena & Theo — 12 June 2027', width: 1200, height: 630 },
  },

  couple: {
    people: [
      {
        first: 'Elena',
        full: 'Elena Vale',
        role: 'The bride',
        family: ['Daughter of Marguerite & Anton Vale', 'Sister to Iris and Jonah'],
      },
      {
        first: 'Theo',
        full: 'Theo Marlowe',
        role: 'The groom',
        family: ['Son of Helena & Rowan Marlowe', 'Brother to Cass'],
      },
    ],
    monogram: ['E', 'T'],
  },

  event: {
    title: 'The wedding of Elena & Theo',
    date: '2027-06-12',
    startTime: '16:00',
    endTime: '23:00',
    timezone: 'Europe/London',
  },

  venue: {
    name: 'The Orangery at Willowmere',
    address: ['1 Willowmere Lane', 'Meadowbrook', 'MB1 2WL'],
    // coordinates: { lat: 0, lng: 0 }, // optional: precise pin for maps links and the .ics GEO field
    description:
      'A Georgian glasshouse at the end of a lime-tree avenue. The ceremony takes place beneath the glass roof; supper follows in the walled garden.',
    travel: [
      { icon: 'train', label: 'Willowmere Station', detail: '4 km · 8 minutes by taxi' },
      { icon: 'plane', label: 'Meadowbrook Airport', detail: '18 km · 25 minutes by car' },
      { icon: 'car', label: 'Village green parking', detail: '300 m · a four-minute walk' },
    ],
  },

  envelope: {
    enabled: true,
    hint: 'Open your invitation',
    letterLine: 'Elena & Theo',
  },

  hero: {
    greeting: 'Together with their families',
    tagline: 'Meadowbrook, England',
  },

  story: {
    eyebrow: 'Our story',
    heading: 'With joyful hearts',
    message: [
      'Two people, one long walk that never quite ended, and a great many cups of tea in between.',
      'We would be honoured to have you beside us as we make it official — in the company of the people who made us who we are.',
    ],
    quote: {
      text: 'Every year with you has felt like coming home.',
      cite: 'From our letters',
    },
    chapters: [
      { label: '2019', title: 'A rainy platform', body: 'A delayed train, a shared umbrella and a conversation neither of us wanted to finish.' },
      { label: '2023', title: 'The long way round', body: 'A hilltop, a flask of coffee and a question asked far too nervously.' },
      { label: '2027', title: 'Forever, officially', body: 'Under the glass roof at Willowmere, with every one of you there.' },
    ],
  },

  countdown: {
    eyebrow: 'Counting down',
    heading: 'Until we say “I do”',
    during: 'Today is the day — the celebration is under way.',
    after: 'Thank you for celebrating with us.',
  },

  schedule: {
    eyebrow: 'The day',
    heading: 'Order of the day',
    items: [
      { time: '15:30', title: 'Arrival', description: 'Welcome drinks on the lawn.', place: 'The lime avenue' },
      { time: '16:00', title: 'Ceremony', description: 'Vows beneath the glass roof.', place: 'The Orangery' },
      { time: '17:30', title: 'Reception', description: 'Canapés, toasts and photographs in the garden.', place: 'The walled garden' },
      { time: '19:00', title: 'Wedding supper', description: 'Long tables, lanterns and a menu from the estate.', place: 'The marquee' },
      { time: '21:00', title: 'Dancing', description: 'First dance, then music until the candles burn low.', place: 'The marquee' },
    ],
  },

  details: {
    eyebrow: 'Good to know',
    heading: 'A few details',
    items: [
      { title: 'Dress code', body: 'Garden formal. Soft colours are welcome; the lawn is grass, so block heels may be kinder.' },
      { title: 'Staying nearby', body: 'A block of rooms is held at The Lime Tree Inn until 1 May 2027 — quote “Marlowe Vale”.' },
      { title: 'Little ones', body: 'Children are warmly welcome at the ceremony and supper; a sitter will be on hand from 20:00.' },
      { title: 'Gifts', body: 'Your presence is the only gift we need. If you would like to give something, we have a small honeymoon fund.' },
    ],
  },

  gallery: {
    eyebrow: 'Glimpses',
    heading: 'The setting',
    images: [
      { src: 'gallery/orangery.svg', alt: 'Illustration of the arched glasshouse windows', width: 800, height: 1000, caption: 'The Orangery' },
      { src: 'gallery/table.svg', alt: 'Illustration of a long table with candles', width: 1000, height: 750, caption: 'Supper under the lanterns' },
      { src: 'gallery/garden.svg', alt: 'Illustration of a garden path lined with trees', width: 1000, height: 750, caption: 'The lime avenue' },
      { src: 'gallery/bouquet.svg', alt: 'Illustration of a loose seasonal bouquet', width: 800, height: 1000, caption: 'Seasonal flowers' },
    ],
  },

  rsvp: {
    eyebrow: 'Reply',
    heading: 'Will you join us?',
    intro: 'We would love to know whether you can celebrate with us.',
    deadline: '2027-05-01',
    mode: 'email',
    email: 'rsvp@example.com',
    maxGuests: 4,
    contacts: [
      { name: 'Iris Vale', role: 'Sister of the bride', email: 'iris@example.com' },
    ],
  },

  footer: {
    eyebrow: 'With love & gratitude',
    message: 'We cannot wait to celebrate the beginning of our forever with you.',
    credit: 'A sample invitation template',
  },

  sections: ['hero', 'story', 'countdown', 'schedule', 'venue', 'details', 'gallery', 'rsvp', 'footer'],

  theme: { name: 'ivory' },
}
