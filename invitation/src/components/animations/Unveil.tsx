import { m, type Variants } from 'motion/react'
import type { ReactNode } from 'react'
import { ease } from './tokens'
import { useStaticMotion } from './useStaticMotion'

interface UnveilProps {
  /** Seconds. Stagger neighbouring plates with a small offset. */
  delay?: number
  className?: string
  children: ReactNode
}

const wipe = (delay: number): Variants => ({
  hidden: { clipPath: 'inset(0 0 100% 0)' },
  show: { clipPath: 'inset(0 0 0% 0)', transition: { duration: 1.1, ease: ease.out, delay } },
})
const settle = (delay: number): Variants => ({
  hidden: { scale: 1.08 },
  show: { scale: 1, transition: { duration: 1.4, ease: ease.out, delay } },
})

/**
 * The image-reveal pattern: the picture is wiped open like a sheet being drawn back, while it settles from
 * 1.08× to 1×. Plays once, on `clip-path` and `transform` only.
 *
 * The element that is *observed* (outer, `className`) is never clipped: a fully clipped element reports no
 * intersection, so observing it would mean the reveal never starts. The clip lives on a child driven by variants.
 * Static mode (reduced motion / capture / no animation support) renders the final state with no wrapper motion.
 */
export function Unveil({ delay = 0, className, children }: UnveilProps) {
  const reduce = useStaticMotion()
  if (reduce) return <div className={className}>{children}</div>
  return (
    <m.div className={className} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.15 }}>
      <m.div className="unveil__clip" variants={wipe(delay)}>
        <m.div className="unveil__inner" variants={settle(delay)}>{children}</m.div>
      </m.div>
    </m.div>
  )
}
