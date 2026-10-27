import { AnimatePresence, m } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import type { Wedding } from '../../config'
import { useActiveSection, useIdVisible } from '../../hooks/useInViewState'
import { useScrollLock } from '../../hooks/useScrollLock'
import { dur, ease } from '../animations/tokens'
import { useStaticMotion } from '../animations/useStaticMotion'

export interface NavItem { id: string; label: string }

/**
 * Appears once the hero has scrolled out of view. Desktop: inline links. Mobile: a menu button that
 * opens a full-height sheet. Plain hash links → native history, anchors and keyboard behaviour.
 */
export function SiteNav({ w, items, hasHero }: { w: Wedding; items: NavItem[]; hasHero: boolean }) {
  const reduce = useStaticMotion()
  const heroVisible = useIdVisible(hasHero ? 'hero' : null)
  const active = useActiveSection(items.map((i) => i.id))
  const [open, setOpen] = useState(false)
  const toggle = useRef<HTMLButtonElement>(null)
  const show = !heroVisible
  const menuOpen = open && show
  useScrollLock(menuOpen)

  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        toggle.current?.focus()
      }
    }
    const mq = window.matchMedia('(min-width: 48rem)')
    const onMq = () => mq.matches && setOpen(false)
    window.addEventListener('keydown', onKey)
    mq.addEventListener('change', onMq)
    return () => {
      window.removeEventListener('keydown', onKey)
      mq.removeEventListener('change', onMq)
    }
  }, [menuOpen])

  const [a, b] = w.couple.people
  const slide = reduce ? {} : { initial: { y: '-100%' }, animate: { y: 0 }, exit: { y: '-100%' }, transition: { duration: dur.base, ease: ease.out } }

  return (
    <AnimatePresence>
      {show && (
        <m.header key="nav" className="nav" {...slide}>
          <nav className="nav__bar container container--wide" aria-label={w.strings.nav}>
            <a className="nav__brand" href="#top" aria-label={w.strings.home} onClick={() => setOpen(false)}>
              {a.first[0]}<i>&amp;</i>{b.first[0]}
            </a>
            <ul className="nav__links">
              {items.map((it) => (
                <li key={it.id}>
                  <a className="nav__link" href={`#${it.id}`} aria-current={active === it.id ? 'location' : undefined}>{it.label}</a>
                </li>
              ))}
            </ul>
            <button
              ref={toggle}
              type="button"
              className="nav__toggle"
              aria-expanded={menuOpen}
              aria-controls="nav-menu"
              onClick={() => setOpen((o) => !o)}
            >
              <span>{menuOpen ? w.strings.closeMenu : w.strings.menu}</span>
              <span className="nav__toggle-icon" aria-hidden="true" />
            </button>
          </nav>
          <AnimatePresence>
            {menuOpen && (
              <m.div
                key="menu"
                id="nav-menu"
                className="nav__menu"
                initial={reduce ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={reduce ? undefined : { opacity: 0 }}
                transition={{ duration: dur.base, ease: ease.out }}
              >
                {items.map((it, i) => (
                  <a key={it.id} href={`#${it.id}`} aria-current={active === it.id ? 'location' : undefined} onClick={() => setOpen(false)}>
                    <span aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                    {it.label}
                  </a>
                ))}
              </m.div>
            )}
          </AnimatePresence>
        </m.header>
      )}
    </AnimatePresence>
  )
}
