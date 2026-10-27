import { m, type Variants } from 'motion/react'
import type { Wedding } from '../../config'
import { dur, ease } from '../animations/tokens'
import { Botanical } from '../art/Botanical'
import { useStaticMotion } from '../animations/useStaticMotion'

const rise: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: dur.slow, ease: ease.out } },
}
const mask: Variants = {
  hidden: { y: '108%' },
  show: { y: 0, transition: { duration: 1.15, ease: ease.out } },
}

/** Long first names shrink the display size so they stay inside the arch (8 characters or fewer: full size). */
function nameScale(...names: string[]) {
  const longest = Math.max(...names.map((n) => [...n].length))
  return Math.max(0.4, Math.min(1, 8 / longest)).toFixed(3)
}

/**
 * Hero entrance, in order: arch → greeting → names (masked rise) → ampersand → rule → date/place → cue.
 * Botanical line-drawing runs alongside. `play` is flipped by the envelope gate as it dissolves.
 */
export function Hero({ w, play, nextId }: { w: Wedding; play: boolean; nextId?: string }) {
  const reduce = useStaticMotion()
  const [a, b] = w.couple.people
  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.13, delayChildren: 0.05 } },
  }
  // Static mode (reduced motion / capture / no animation support) is always in the final state, never 'hidden'.
  const state = reduce || play ? 'show' : 'hidden'
  const initial = reduce ? false : 'hidden'

  return (
    <section id="hero" className="hero" aria-labelledby="invitation-title">
      <Botanical className="hero__sprig hero__sprig--tr" play={reduce ? undefined : play} delay={0.5} />
      <Botanical className="hero__sprig hero__sprig--bl" play={reduce ? undefined : play} delay={0.9} />

      <m.div className="hero__arch" style={{ ['--name-scale' as string]: nameScale(a.first, b.first) }} variants={container} initial={initial} animate={state}>
        <m.p className="script hero__greeting" variants={rise}>{w.hero.greeting}</m.p>

        <h1 id="invitation-title" className="hero__names" tabIndex={-1}>
          <span className="hero__name"><m.span variants={mask}>{a.first}</m.span></span>
          <m.span className="hero__amp" variants={rise} aria-hidden="true">&amp;</m.span>
          <span className="sr-only"> and </span>
          <span className="hero__name"><m.span variants={mask}>{b.first}</m.span></span>
        </h1>

        <m.span className="hero__rule" variants={{ hidden: { scaleX: 0 }, show: { scaleX: 1, transition: { duration: 1, ease: ease.inOut } } }} />
        <m.p className="hero__date" variants={rise}>{w.labels.dateNumeric}</m.p>
        <m.p className="hero__long" variants={rise}>{w.labels.dateLong}</m.p>
        <m.p className="label muted hero__place" variants={rise}>{w.hero.tagline}</m.p>
      </m.div>

      {nextId && (
        <m.a
          className="hero__cue label muted"
          href={`#${nextId}`}
          initial={reduce ? false : { opacity: 0 }}
          animate={reduce || play ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: dur.slow, delay: 1.6 }}
        >
          <span>{w.strings.scroll}</span>
          <i aria-hidden="true" />
        </m.a>
      )}
    </section>
  )
}
