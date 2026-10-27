import { useId } from 'react'

// Slightly irregular circle, like poured wax. Deterministic, computed once.
const WAX = (() => {
  const n = 64
  const pts = Array.from({ length: n }, (_, k) => {
    const a = (k / n) * Math.PI * 2
    const r = 53 + Math.sin(a * 5 + 1) * 1.9 + Math.cos(a * 11) * 1.3 + Math.sin(a * 3) * 1.1
    return `${(60 + r * Math.cos(a)).toFixed(1)} ${(60 + r * Math.sin(a)).toFixed(1)}`
  })
  return `M${pts.join('L')}Z`
})()

/** Wax seal with an embossed two-letter monogram. Original artwork; colours come from theme tokens. */
export function Seal({ monogram, className }: { monogram: readonly [string, string]; className?: string }) {
  const id = useId()
  return (
    <svg className={className} viewBox="0 0 120 120" role="img" aria-label={`Wax seal with the monogram ${monogram[0]} and ${monogram[1]}`}>
      <defs>
        <radialGradient id={`${id}-w`} cx="36%" cy="30%" r="85%">
          <stop offset="0" style={{ stopColor: 'var(--color-seal-hi)' }} />
          <stop offset="0.6" style={{ stopColor: 'var(--color-seal)' }} />
          <stop offset="1" style={{ stopColor: 'var(--color-seal)' }} stopOpacity="0.92" />
        </radialGradient>
      </defs>
      <path d={WAX} fill="rgb(0 0 0 / 0.22)" transform="translate(1.5 3)" />
      <path d={WAX} fill={`url(#${id}-w)`} />
      <circle cx="60" cy="60" r="38" fill="none" stroke="var(--color-seal-ink)" strokeOpacity="0.55" strokeWidth="1" />
      <circle cx="60" cy="60" r="35" fill="none" stroke="var(--color-seal-hi)" strokeOpacity="0.8" strokeWidth="0.7" />
      <g fontFamily="var(--font-display)" fontStyle="italic" textAnchor="middle" fontSize="40">
        <text x="45.4" y="73.4" fill="rgb(0 0 0 / 0.35)">{monogram[0]}</text>
        <text x="45" y="73" fill="var(--color-seal-ink)">{monogram[0]}</text>
        <text x="77.4" y="76.4" fill="rgb(0 0 0 / 0.35)" fontSize="32">{monogram[1]}</text>
        <text x="77" y="76" fill="var(--color-seal-ink)" fontSize="32">{monogram[1]}</text>
      </g>
    </svg>
  )
}
