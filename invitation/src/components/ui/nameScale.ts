/** Long first names shrink the display size so they stay inside their composition (8 characters or fewer: full size). */
export function nameScale(...names: string[]) {
  const longest = Math.max(...names.map((n) => [...n].length))
  return Math.max(0.4, Math.min(1, 8 / longest)).toFixed(3)
}
