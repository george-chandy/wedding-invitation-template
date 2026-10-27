import { m } from 'motion/react'
import type { SVGProps } from 'react'
import { ease } from './tokens'
import { useStaticMotion } from './useStaticMotion'

/** An SVG <path> whose stroke draws in once when scrolled into view (or when `play` becomes true). */
export function DrawPath({ d, delay = 0, duration = 1.6, play, ...rest }: { d: string; delay?: number; duration?: number; play?: boolean } & Omit<SVGProps<SVGPathElement>, 'ref' | 'onAnimationStart' | 'onDrag' | 'onDragStart' | 'onDragEnd'>) {
  const reduce = useStaticMotion()
  if (reduce) return <path d={d} {...rest} />
  const controlled = play !== undefined
  return (
    <m.path
      d={d}
      initial={{ pathLength: 0, opacity: 0 }}
      {...(controlled
        ? { animate: play ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 } }
        : { whileInView: { pathLength: 1, opacity: 1 }, viewport: { once: true, amount: 0.3 } })}
      transition={{ duration, delay, ease: ease.inOut, opacity: { duration: 0.2, delay } }}
      {...(rest as object)}
    />
  )
}
