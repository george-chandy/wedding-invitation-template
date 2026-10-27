import { DrawPath } from '../animations/DrawPath'

/** An olive-like sprig built from a cubic stem with alternating leaves. Computed once at module load. */
const STEM = { p0: [8, 192], p1: [60, 150], p2: [110, 96], p3: [186, 14] } as const

function bezier(t: number) {
  const u = 1 - t
  const [a, b, c, d] = [STEM.p0, STEM.p1, STEM.p2, STEM.p3]
  const x = u ** 3 * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t ** 3 * d[0]
  const y = u ** 3 * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t ** 3 * d[1]
  const dx = 3 * u * u * (b[0] - a[0]) + 6 * u * t * (c[0] - b[0]) + 3 * t * t * (d[0] - c[0])
  const dy = 3 * u * u * (b[1] - a[1]) + 6 * u * t * (c[1] - b[1]) + 3 * t * t * (d[1] - c[1])
  return { x, y, angle: Math.atan2(dy, dx) }
}

function leaf(t: number, side: 1 | -1, len: number) {
  const { x, y, angle } = bezier(t)
  const a = angle + side * 0.95
  const w = len * 0.34
  const tx = x + Math.cos(a) * len
  const ty = y + Math.sin(a) * len
  const nx = -Math.sin(a) * w
  const ny = Math.cos(a) * w
  const mx = x + Math.cos(a) * len * 0.5
  const my = y + Math.sin(a) * len * 0.5
  const f = (n: number) => n.toFixed(1)
  return `M${f(x)} ${f(y)}Q${f(mx + nx)} ${f(my + ny)} ${f(tx)} ${f(ty)}Q${f(mx - nx)} ${f(my - ny)} ${f(x)} ${f(y)}Z`
}

const STEM_D = `M${STEM.p0.join(' ')}C${STEM.p1.join(' ')} ${STEM.p2.join(' ')} ${STEM.p3.join(' ')}`
const LEAVES = Array.from({ length: 9 }, (_, i) => {
  const t = 0.16 + i * 0.095
  const len = 30 - i * 1.6
  return [leaf(t, 1, len), leaf(t + 0.045, -1, len * 0.92)]
}).flat()
const TIP = leaf(0.995, 1, 14)

export function Botanical({ className, play, delay = 0 }: { className?: string; play?: boolean; delay?: number }) {
  return (
    <svg className={className} viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <DrawPath d={STEM_D} play={play} delay={delay} duration={1.8} />
      {[...LEAVES, TIP].map((d, i) => (
        <DrawPath key={i} d={d} play={play} delay={delay + 0.5 + i * 0.07} duration={1.1} />
      ))}
    </svg>
  )
}
