import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import './styles/index.css'
import App from './app/App'
import { applyTheme } from './app/theme'
import { ConfigError, loadWedding, type Wedding } from './config'
import type { WeddingConfig } from './config/types'
import { SectionBoundary } from './app/SectionBoundary'
import { initCapture } from './lib/capture'

declare global {
  interface Window {
    /** Test builds only (`vite build --mode test`): lets the e2e suite inject a configuration. Dead-code-eliminated in production. */
    __WEDDING_CONFIG__?: WeddingConfig
  }
}

const root = document.getElementById('root')!

let wedding: Wedding | null = null
try {
  wedding = import.meta.env.MODE === 'test' && window.__WEDDING_CONFIG__ ? loadWedding(window.__WEDDING_CONFIG__) : loadWedding()
} catch (e) {
  // A broken config should be obvious to the person editing it, not a blank page.
  const issues = e instanceof ConfigError ? e.issues : [`Unexpected error while reading the configuration: ${String(e)}`]
  root.innerHTML = `<main style="font:16px/1.6 system-ui;padding:2rem;max-width:42rem;margin:auto"><h1>Invitation configuration problem</h1><p>Fix these in <code>src/config/wedding.ts</code>:</p><ul>${issues.map((i) => `<li>${i.replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' })[c]!)}</li>`).join('')}</ul></main>`
}

if (wedding) {
  initCapture()
  applyTheme(wedding)
  createRoot(root).render(
    <StrictMode>
      <SectionBoundary name="app" fallback={<main style={{ font: '16px/1.6 system-ui', padding: '2rem', maxWidth: '42rem', margin: 'auto' }}><h1>This invitation could not be displayed</h1><p>Please reload the page, or contact the hosts directly.</p></main>}>
        <App wedding={wedding} />
      </SectionBoundary>
    </StrictMode>,
  )
}
