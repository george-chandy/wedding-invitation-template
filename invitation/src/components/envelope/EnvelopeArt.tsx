import { useId } from 'react'

const stop = (v: string) => ({ stopColor: `var(${v})` })

/** Front panels of the envelope (the V-shaped pocket). Stacked above the letter, below the flap. */
export function Pocket() {
  const id = useId()
  return (
    <svg className="env__pocket" viewBox="0 0 700 500" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`${id}-s`} x1="0" y1="0" x2="1" y2="0.6">
          <stop offset="0" style={stop('--color-paper-mid')} />
          <stop offset="1" style={stop('--color-paper-dark')} />
        </linearGradient>
        <linearGradient id={`${id}-b`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" style={stop('--color-paper-mid')} />
          <stop offset="1" style={stop('--color-paper-dark')} />
        </linearGradient>
      </defs>
      <path d="M0 0 352 272 0 500Z" fill={`url(#${id}-s)`} stroke="var(--color-line-strong)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      <path d="M700 0 348 272 700 500Z" fill={`url(#${id}-s)`} stroke="var(--color-line-strong)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      <path d="M0 500 350 258 700 500Z" fill={`url(#${id}-b)`} stroke="var(--color-line-strong)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

/** The flap has two faces so it reads correctly through the whole 180° swing. */
export function Flap() {
  const id = useId()
  return (
    <span className="env__flap" aria-hidden="true">
      <svg className="env__flap-front" viewBox="0 0 700 290" preserveAspectRatio="none" focusable="false">
        <defs>
          <linearGradient id={`${id}-f`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" style={stop('--color-paper-mid')} />
            <stop offset="1" style={stop('--color-paper-dark')} />
          </linearGradient>
        </defs>
        <path d="M0 0H700L350 290Z" fill={`url(#${id}-f)`} stroke="var(--color-line-strong)" strokeWidth="1" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
      </svg>
      <svg className="env__flap-lining" viewBox="0 0 700 290" preserveAspectRatio="none" focusable="false">
        <defs>
          <pattern id={`${id}-p`} width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <path d="M0 0H14" stroke="var(--color-accent)" strokeOpacity="0.35" strokeWidth="0.8" />
          </pattern>
        </defs>
        <path d="M0 0H700L350 290Z" style={{ fill: 'var(--color-paper-dark)' }} stroke="var(--color-line-strong)" strokeWidth="1" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
        <path d="M0 0H700L350 290Z" fill={`url(#${id}-p)`} />
      </svg>
    </span>
  )
}
