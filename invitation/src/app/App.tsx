import { LazyMotion, MotionConfig, domAnimation } from 'motion/react'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import type { Wedding } from '../config'
import type { SectionId } from '../config/types'
// import { Details } from '../components/sections/Details'
// import { Countdown } from '../components/sections/Countdown'
import { EnvelopeGate } from '../components/envelope/EnvelopeGate'
import { Footer } from '../components/sections/Footer'
// import { Gallery } from '../components/sections/Gallery'
import { Hero } from '../components/sections/Hero'
import { Rsvp } from '../components/sections/Rsvp'
// import { Schedule } from '../components/sections/Schedule'
import { Story } from '../components/sections/Story'
import { Venue } from '../components/sections/Venue'
import { SiteNav, type NavItem } from '../components/nav/SiteNav'
import { useScrollLock } from '../hooks/useScrollLock'
import { SectionBoundary } from './SectionBoundary'
import { capture, markCaptureReady } from '../lib/capture'
import { GateBoundary } from './GateBoundary'

export default function App({ wedding: w }: { wedding: Wedding }) {
  const gateEnabled = w.envelope.enabled && !capture.enabled
  const [revealed, setRevealed] = useState(!gateEnabled)
  const [unlocked, setUnlocked] = useState(!gateEnabled)
  useScrollLock(!unlocked)

  const onReveal = useCallback(() => setRevealed(true), [])
  const onOpened = useCallback(() => setUnlocked(true), [])

  useEffect(() => {
    void markCaptureReady() // no-op unless ?capture
  }, [])

  // After the envelope closes (and `inert` is gone), move keyboard/screen-reader focus onto the names.
  const wasLocked = useRef(!unlocked)
  useEffect(() => {
    if (unlocked && wasLocked.current) document.getElementById('invitation-title')?.focus({ preventScroll: true })
    wasLocked.current = !unlocked
  }, [unlocked])
  const onGateFail = useCallback(() => {
    setRevealed(true)
    setUnlocked(true)
  }, [])

  const body = w.sections.filter((id) => id !== 'footer')
  const heroIndex = body.indexOf('hero')
  const nextId = heroIndex >= 0 ? body[heroIndex + 1] : undefined

  const render: Record<Exclude<SectionId, 'footer'>, () => ReactNode> = {
    hero: () => <Hero key="hero" w={w} play={revealed} nextId={nextId} />,
    story: () => <Story key="story" w={w} />,
    // countdown: () => <Countdown key="countdown" w={w} />,
    // schedule: () => <Schedule key="schedule" w={w} />,
    venue: () => <Venue key="venue" w={w} />,
    // details: () => <Details key="details" w={w} />,
    // gallery: () => <Gallery key="gallery" w={w} />,
    rsvp: () => <Rsvp key="rsvp" w={w} />,
  }

  const s = w.strings
  const labels: Partial<Record<SectionId, string>> = {
    story: s.navStory,
    // schedule: s.navSchedule,
    // venue: s.navVenue,
    // details: s.navDetails,
    // gallery: s.navGallery,
    rsvp: s.navRsvp,
  }
  const navItems: NavItem[] = body.flatMap((id) => (labels[id] ? [{ id, label: labels[id] }] : []))

  return (
    // `strict` makes any accidental use of the full `motion` component (bundle bloat) throw in dev.
    <LazyMotion features={domAnimation} strict>
      {/* The visitor's OS reduced-motion setting is honoured by every Motion animation. */}
      <MotionConfig reducedMotion={capture.enabled ? 'always' : 'user'}>
        {!unlocked && (
          <GateBoundary onFail={onGateFail}>
            <EnvelopeGate wedding={w} onReveal={onReveal} onOpened={onOpened} />
          </GateBoundary>
        )}
        {/* While the envelope is shut the page is inert: unreachable by keyboard and assistive tech. */}
        <div id="top" inert={!unlocked}>
          <a className="skip-link" href="#main">{s.skipToMain}</a>
          <SiteNav w={w} items={navItems} hasHero={body.includes('hero')} />
          <main id="main" tabIndex={-1}>
            {body.map((id) => (
              <SectionBoundary key={id} name={id}>{render[id as Exclude<SectionId, 'footer'>]()}</SectionBoundary>
            ))}
          </main>
          {w.sections.includes('footer') && <SectionBoundary name="footer"><Footer w={w} /></SectionBoundary>}
        </div>
      </MotionConfig>
    </LazyMotion>
  )
}
