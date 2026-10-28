import { animate } from 'motion/mini'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { Wedding } from '../../config'
import { ease } from '../animations/tokens'
import { useStaticMotion } from '../animations/useStaticMotion'
import { Seal } from '../art/Seal'
import { Flap, Pocket } from './EnvelopeArt'

interface Props {
  wedding: Wedding
  /** Fired as the overlay starts to fade, so the hero entrance can begin underneath it. */
  onReveal: () => void
  /** Fired when the overlay is gone. The page becomes interactive and focus moves into it. */
  onOpened: () => void
}

type Stage = 'closed' | 'opening'
type Playback = ReturnType<typeof animate>

/** Seconds from the press to the points the rest of the page cares about. */
const T = { reveal: 1.9 }

/**
 * The signature interaction: press the wax seal → the seal lifts → the flap swings open in 3D →
 * the letter rises out of the pocket → the letter swells and the overlay dissolves into the hero.
 *
 * Ownership of animated properties (nothing is animated by two systems at once):
 *   .gate__intro              CSS keyframe (entrance)
 *   .env                      CSS transition (hover lift / pressed)
 *   .env__seal                CSS transition (hover / pressed scale)
 *   .env__seal-art            Motion (scale, opacity)
 *   .env__flap                Motion (rotateX, zIndex)
 *   .env__flap-shadow         Motion (opacity)
 *   .env__letter              Motion (y, scale, opacity)
 *   .env__stage               Motion (y, scale)
 *   .gate (root)              Motion (opacity)
 */
export function EnvelopeGate({ wedding, onReveal, onOpened }: Props) {
  const { strings, couple } = wedding
  const root = useRef<HTMLDivElement>(null)
  const [stage, setStage] = useState<Stage>('closed')
  const reduce = useStaticMotion()

  const stageRef = useRef<Stage>('closed')
  const controls = useRef<Playback[]>([])
  const timers = useRef<number[]>([])
  const finished = useRef(false)

  const finish = useCallback(() => {
    if (finished.current) return
    finished.current = true
    timers.current.forEach(clearTimeout)
    timers.current = []
    onReveal()
    onOpened()
  }, [onReveal, onOpened])

  const open = useCallback(() => {
    if (stageRef.current !== 'closed' || !root.current) return
    stageRef.current = 'opening'
    setStage('opening')
    const el = root.current

    if (reduce) {
      // Essential interaction preserved; the choreography collapses to one short fade.
      onReveal()
      try {
        const fade = animate(el, { opacity: 0 }, { duration: 0.2 })
        controls.current = [fade]
        fade.then(finish)
      } catch {
        el.style.opacity = '0'
        finish()
      }
      return
    }

    try {
      const q = (sel: string) => el.querySelector<HTMLElement>(sel)!
      const play = (target: Element, keyframes: Parameters<typeof animate>[1], options: Parameters<typeof animate>[2]) => {
        const c = animate(target, keyframes, options)
        controls.current.push(c)
        return c
      }
      const bezier = (b: readonly [number, number, number, number]): [number, number, number, number] => [b[0], b[1], b[2], b[3]]
      const out = bezier(ease.out)
      const inOut = bezier(ease.inOut)
      const t = T.reveal

      // 1. press and break the seal
      play(q('.env__seal-art'), { transform: ['scale(1)', 'scale(0.9)', 'scale(1.12)'], opacity: [1, 1, 0] }, { duration: 0.55, ease: 'easeOut' })
      // 2. flap swings up and over the hinge; drops behind the letter once it is edge-on
      play(q('.env__flap'), { transform: ['rotateX(0deg)', 'rotateX(180deg)'] }, { duration: 0.95, delay: 0.3, ease: inOut })
      play(q('.env__flap'), { zIndex: [5, 1] }, { duration: 0.001, delay: 0.3 + 0.47 })
      // the flap's cast shadow lifts away with it
      play(q('.env__flap-shadow'), { opacity: [1, 0] }, { duration: 0.6, delay: 0.35, ease: 'easeIn' })
      // 3 + 4. letter rises out of the pocket, then swells toward the reader (one animation: no overlapping transforms)
      play(q('.env__letter'), { transform: ['translateY(0%)', 'translateY(-62%)', 'translateY(-62%) scale(1.22)'], offset: [0, 0.5, 1] }, { duration: 1.85, delay: 1.0, ease: [out, inOut] })
      play(q('.env__letter'), { opacity: [1, 0] }, { duration: 0.5, delay: t, ease: 'easeIn' })
      // 5. the scene settles back and the whole overlay dissolves into the hero
      play(q('.env__stage'), { transform: ['translateY(0px) scale(1)', 'translateY(18px) scale(0.97)'] }, { duration: 0.85, delay: t - 0.1, ease: inOut })
      const last = play(el, { opacity: [1, 0] }, { duration: 0.8, delay: t, ease: 'easeInOut' })

      timers.current.push(window.setTimeout(onReveal, t * 1000))
      last.then(finish)
    } catch (error) {
      // Animation could not start (unsupported/blocked WAAPI, unexpected DOM): never trap the visitor.
      console.warn('Envelope animation failed; opening the invitation directly.', error)
      controls.current.forEach((c) => c.stop())
      el.style.opacity = '0'
      finish()
    }
  }, [reduce, onReveal, finish])

  /** Skip: jump the sequence to its end state (or bypass it entirely). */
  const skip = useCallback(() => {
    if (stageRef.current === 'closed') {
      stageRef.current = 'opening'
      if (root.current) root.current.style.opacity = '0'
      finish()
      return
    }
    controls.current.forEach((c) => c.complete())
    finish()
  }, [finish])

  useEffect(() => {
    // Focus the dialog itself: announces it to screen readers, and the first Tab lands on the envelope.
    root.current?.focus({ preventScroll: true })
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') skip()
    }
    window.addEventListener('keydown', onKey)
    const pending = timers.current
    return () => {
      window.removeEventListener('keydown', onKey)
      controls.current.forEach((c) => c.stop())
      pending.forEach(clearTimeout)
    }
  }, [skip])

  const [a, b] = couple.people

  return (
    <div ref={root} className="gate" role="dialog" aria-modal="true" aria-label={strings.openInvitation} data-stage={stage} tabIndex={-1}>
      <div className="gate__intro">
        <button
          type="button"
          className="env"
          // Accessible name starts with the visible text on the envelope (WCAG 2.5.3 label-in-name).
          aria-label={`${a.first} & ${b.first} ${wedding.labels.dateNumeric}. ${strings.envelopeAria}`}
          aria-disabled={stage !== 'closed'}
          onClick={open}
        >
          <span className="env__stage">
            <span className="env__shadow" />
            <span className="env__back" />
            <span className="env__letter" aria-hidden="true">
              <span className="env__letter-arch" />
              <span className="env__letter-name">{a.first} <i>&amp;</i> {b.first}</span>
              <span className="env__letter-rule" />
              <span className="env__letter-line">{wedding.labels.dateNumeric}</span>
            </span>
            <Pocket />
            <span className="env__flap-shadow" />
            <Flap />
            <span className="env__seal" aria-hidden="true">
              <span className="env__seal-art"><Seal monogram={couple.monogram} /></span>
            </span>
          </span>
        </button>
        <div className="gate__hint" aria-hidden="true">
          <span className="label">{wedding.envelope.hint}</span>
          <span className="gate__names">{wedding.names.short}</span>
        </div>
      </div>
      <button type="button" className="gate__skip" onClick={skip}>{strings.skipToContent}</button>
      <p className="sr-only" role="status">{stage === 'opening' ? strings.envelopeOpening : ''}</p>
    </div>
  )
}
