import { useEffect } from 'react'

/** Locks page scrolling on <html> while `locked` is true. `scrollbar-gutter: stable` prevents layout jump. */
export function useScrollLock(locked: boolean) {
  useEffect(() => {
    document.documentElement.classList.toggle('is-locked', locked)
    return () => document.documentElement.classList.remove('is-locked')
  }, [locked])
}
