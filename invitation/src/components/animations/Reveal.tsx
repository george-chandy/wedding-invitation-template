import { m } from 'motion/react'
import type { ReactNode } from 'react'
import { dur, ease } from './tokens'
import { useStaticMotion } from './useStaticMotion'

const tags = { div: m.div, li: m.li, header: m.header, figure: m.figure, p: m.p, section: m.section } as const
type Tag = keyof typeof tags

interface RevealProps {
  as?: Tag
  /** Seconds. Use for staggering siblings: delay={i * 0.09}. */
  delay?: number
  y?: number
  className?: string
  children: ReactNode
}

/**
 * Fades + lifts its children into place the first time they enter the viewport.
 *  - plays once (never replays on small scrolls)
 *  - opacity/transform only → no layout shift
 *  - reduced motion: renders a plain element, content visible immediately
 */
export function Reveal({ as = 'div', delay = 0, y = 16, className, children }: RevealProps) {
  const reduce = useStaticMotion()
  if (reduce) {
    const Plain = as
    return <Plain className={className}>{children}</Plain>
  }
  const Tag = tags[as]
  return (
    <Tag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2, margin: '0px 0px -8% 0px' }}
      transition={{ duration: dur.slow, ease: ease.out, delay }}
    >
      {children}
    </Tag>
  )
}
