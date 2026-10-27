/** Resolve a config asset path (relative to `public/`) against Vite's base URL. */
export function assetUrl(path: string): string {
  if (/^([a-z][a-z0-9+.-]*:|\/\/|\/)/i.test(path)) return path
  return `${import.meta.env.BASE_URL}${path}`
}
