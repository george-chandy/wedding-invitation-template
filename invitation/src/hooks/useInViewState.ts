import { useEffect, useState } from 'react'

/** Whether the element with `id` intersects the viewport. Returns `true` if the element does not exist. */
export function useIdVisible(id: string | null): boolean {
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    const el = id ? document.getElementById(id) : null
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0, rootMargin: '-1px 0px 0px 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [id])
  return id ? visible : false
}

/** The id (from `ids`) of the section currently crossing the middle of the viewport. */
export function useActiveSection(ids: string[]): string | null {
  const [active, setActive] = useState<string | null>(null)
  const key = ids.join('|')
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return
    const els = key.split('|').map((id) => document.getElementById(id)).filter((e): e is HTMLElement => !!e)
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id)
      },
      { rootMargin: '-45% 0px -50% 0px' },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [key])
  return active
}
