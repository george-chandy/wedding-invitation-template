import type { Wedding } from '../config'

/** Applies theme name, language and colour overrides to <html> before the first render. */
export function applyTheme(w: Wedding) {
  const el = document.documentElement
  el.dataset.theme = w.theme.name
  el.lang = w.site.lang
  for (const [token, value] of Object.entries(w.theme.overrides ?? {})) {
    el.style.setProperty(`--color-${token}`, value)
  }
}
