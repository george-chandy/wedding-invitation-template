import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import { weddingConfig as c } from './src/config/wedding.ts'

// Matches --color-bg in src/styles/themes.css (used for the browser UI colour before CSS loads).
const THEME_BG = { ivory: '#f7f2e9', midnight: '#111a1f' } as const

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

/** Injects title / description / Open Graph / Twitter tags from the wedding config so link previews work without JS. */
function weddingMeta(): Plugin {
  return {
    name: 'wedding-meta',
    transformIndexHtml: {
      order: 'post',
      handler(html) {
      const { site } = c
      const abs = (p: string) => (site.url ? new URL(p, site.url.endsWith('/') ? site.url : `${site.url}/`).href : p)
      const img = site.shareImage
      const tags = [
        `<title>${esc(site.title)}</title>`,
        `<meta name="description" content="${esc(site.description)}" />`,
        `<meta name="theme-color" content="${THEME_BG[c.theme.name]}" />`,
        `<meta property="og:type" content="website" />`,
        `<meta property="og:title" content="${esc(site.title)}" />`,
        `<meta property="og:description" content="${esc(site.description)}" />`,
        ...(site.url ? [`<meta property="og:url" content="${esc(site.url)}" />`, `<link rel="canonical" href="${esc(site.url)}" />`] : []),
        ...(img
          ? [
              `<meta property="og:image" content="${esc(abs(img.src))}" />`,
              `<meta property="og:image:width" content="${img.width}" />`,
              `<meta property="og:image:height" content="${img.height}" />`,
              `<meta property="og:image:alt" content="${esc(img.alt)}" />`,
            ]
          : []),
        `<meta name="twitter:card" content="${img ? 'summary_large_image' : 'summary'}" />`,
        `<meta name="twitter:title" content="${esc(site.title)}" />`,
        `<meta name="twitter:description" content="${esc(site.description)}" />`,
      ]
      return html.replace('<!--wedding-meta-->', tags.join('\n    ')).replace('<html lang="en">', `<html lang="${esc(site.lang)}" data-theme="${c.theme.name}">`)
      },
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  // Relative base: the built site works from any folder or subpath without rebuilding.
  base: './',
  plugins: [react(), weddingMeta()],
  build: {
    rollupOptions: {
      output: {
        // Vendor chunks: long-lived cache entries that don't change when the invitation content does.
        manualChunks(id) {
          if (/node_modules\/(motion|framer-motion|motion-dom|motion-utils)\//.test(id)) return 'motion'
          if (/node_modules\/(react|react-dom|scheduler)\//.test(id)) return 'react'
        },
      },
    },
  },
})
