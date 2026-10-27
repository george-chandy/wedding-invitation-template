import { useReducedMotion } from 'motion/react'
import { capture } from '../../lib/capture'

/** Can this browser run the animations at all? A failing probe means content must render static, never hidden. */
const motionSupported = (() => {
  try {
    if (typeof IntersectionObserver === 'undefined' || typeof Element === 'undefined' || typeof Element.prototype.animate !== 'function') return false
    document.createElement('div').animate({ opacity: [0, 1] }, 1).cancel()
    return true
  } catch {
    return false
  }
})()

/**
 * True when content should render in its final state with no movement: the visitor prefers reduced motion,
 * capture mode is on, or the browser can't run the animations. One definition shared by every animated component.
 */
export function useStaticMotion(): boolean {
  const reduce = useReducedMotion()
  return Boolean(reduce) || capture.enabled || !motionSupported
}
