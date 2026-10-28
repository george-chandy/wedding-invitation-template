import { m, type Variants } from 'motion/react'
import { useCallback, useState } from 'react'
import type { Wedding } from '../../config'
import { dur, ease } from '../animations/tokens'
import { Botanical } from '../art/Botanical'
import { useStaticMotion } from '../animations/useStaticMotion'
import { nameScale } from '../ui/nameScale'
import { Photo } from '../ui/Photo'

const rise: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: dur.slow, ease: ease.out } },
}
const mask: Variants = {
  hidden: { y: '108%' },
  show: { y: 0, transition: { duration: 1.15, ease: ease.out } },
}
const window_: Variants = {
  hidden: { clipPath: 'inset(100% 0 0 0)' },
  show: { clipPath: 'inset(0% 0 0 0)', transition: { duration: 1.4, ease: ease.out } },
}

/**
 * Hero entrance, in order: arched window plate unveils → greeting → first name (masked rise) → ampersand →
 * second name → rule → date/place → cue. The botanical line-drawing runs inside the plate.
 * `play` is flipped by the envelope gate as it dissolves.
 *
 * Composition: the two names are offset (first left, second right) and cross the edge of the plate, so the
 * type and the image read as one layered object. `.hero__arch` is the composition box that every name must stay inside.
 */
export function Hero({ w, play, nextId }: { w: Wedding; play: boolean; nextId?: string }) {
  const reduce = useStaticMotion()
  const [a, b] = w.couple.people
  const [photoFailed, setPhotoFailed] = useState(false)
  const onPhotoFail = useCallback(() => setPhotoFailed(true), [])
  const image = w.hero.image
  // No photograph configured (or it failed to load): the drawn plate (low sun and sprigs) stands in.
  const photo = image?.src && !photoFailed ? image : undefined
  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.13, delayChildren: 0.05 } },
  }
  // Static mode (reduced motion / capture / no animation support) is always the final state, never 'hidden'.
  const state = reduce || play ? 'show' : 'hidden'
  const initial = reduce ? false : 'hidden'

  return (
    <section id="hero" className="hero" aria-labelledby="invitation-title">
      <m.div className="hero__arch" style={{ ['--name-scale' as string]: nameScale(a.first, b.first) }} variants={container} initial={initial} animate={state}>
        <m.div className={`hero__window paper${photo ? ' hero__window--photo' : ''}`} aria-hidden={photo ? undefined : true} variants={window_}>
          {photo ? (
            <Photo img={photo} sizes="(min-width: 768px) 30vw, 72vw" eager onFail={onPhotoFail} />
          ) : (
            <>
              <span className="hero__sun" />
              <Botanical className="hero__sprig hero__sprig--tr" play={reduce ? undefined : play} delay={0.5} />
              <Botanical className="hero__sprig hero__sprig--bl" play={reduce ? undefined : play} delay={0.9} />
            </>
          )}
        </m.div>

        <m.p className="script hero__greeting" variants={rise}>{w.hero.greeting}</m.p>

        <h1 id="invitation-title" className="hero__names" tabIndex={-1}>
          <span className="hero__name hero__name--a"><m.span variants={mask}>{a.first}</m.span></span>
          <m.span className="hero__amp" variants={rise} aria-hidden="true">&amp;</m.span>
          <span className="sr-only"> and </span>
          <span className="hero__name hero__name--b"><m.span variants={mask}>{b.first}</m.span></span>
        </h1>

        <div className="hero__meta">
          <m.span className="hero__rule" variants={{ hidden: { scaleX: 0 }, show: { scaleX: 1, transition: { duration: 1, ease: ease.inOut } } }} />
          <m.p className="hero__date" variants={rise}>{w.labels.dateNumeric}</m.p>
          <m.p className="hero__long" variants={rise}>{w.labels.dateLong}</m.p>
          <m.p className="label muted hero__place" variants={rise}>{w.hero.tagline}</m.p>
        </div>

        <m.p className="hero__vertical label" aria-hidden="true" variants={rise}>{w.labels.dateShort}</m.p>
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
