/** JS mirror of the motion tokens in styles/tokens.css. Keep the two in sync. Durations in seconds. */
export const dur = { fast: 0.18, base: 0.45, slow: 0.9 } as const

type Bezier = readonly [number, number, number, number]
export const ease: { out: Bezier; inOut: Bezier } = {
  out: [0.22, 1, 0.36, 1],
  inOut: [0.65, 0, 0.35, 1],
}

/** Distance (px) for vertical reveals. Smaller on phones is handled by the Reveal `y` prop default. */
export const distance = { sm: 12, md: 24, lg: 40 } as const

/** Delay between siblings in a staggered group (seconds). */
export const stagger = 0.09
