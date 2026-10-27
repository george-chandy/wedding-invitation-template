import { useEffect, useState } from 'react'
import { capture } from '../lib/capture'

const wholeSecond = () => Math.floor(Date.now() / 1000) * 1000

/**
 * Current time, updated once per second, aligned to second boundaries (no drift).
 * Pauses while the tab is hidden and resyncs on return. The timer is cleared on unmount.
 * State only changes when the whole-second value changes, so no redundant renders.
 */
export function useNow(): number {
  const [now, setNow] = useState(() => capture.now ?? wholeSecond())
  useEffect(() => {
    if (capture.now !== undefined) return // frozen clock for deterministic screenshots
    let id = 0
    const tick = () => {
      setNow(wholeSecond())
      id = window.setTimeout(tick, 1000 - (Date.now() % 1000) + 5)
    }
    const onVisibility = () => {
      window.clearTimeout(id)
      if (!document.hidden) tick()
    }
    id = window.setTimeout(tick, 1000 - (Date.now() % 1000) + 5)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.clearTimeout(id)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])
  return now
}
