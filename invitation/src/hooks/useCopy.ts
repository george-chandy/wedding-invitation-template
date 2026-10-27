import { useCallback, useEffect, useState } from 'react'

export type CopyState = 'idle' | 'ok' | 'fail'

async function writeText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // Insecure origins / denied permission: fall back to a transient selection.
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.setAttribute('readonly', '')
      ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0'
      document.body.appendChild(ta)
      ta.select()
      const ok = document.execCommand('copy')
      ta.remove()
      return ok
    } catch {
      return false
    }
  }
}

export function useCopy(text: string, resetMs = 2400) {
  const [state, setState] = useState<CopyState>('idle')
  useEffect(() => {
    if (state === 'idle') return
    const t = window.setTimeout(() => setState('idle'), resetMs)
    return () => window.clearTimeout(t)
  }, [state, resetMs])
  const copy = useCallback(async () => setState((await writeText(text)) ? 'ok' : 'fail'), [text])
  return { state, copy }
}
