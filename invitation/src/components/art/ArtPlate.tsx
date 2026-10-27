import { Botanical } from './Botanical'

/** Generated stand-in shown when a gallery image has no `src` or fails to load. */
export function ArtPlate({ width, height, label }: { width: number; height: number; label: string }) {
  return (
    <div role="img" aria-label={label} style={{ aspectRatio: `${width} / ${height}`, display: 'grid', placeItems: 'center', color: 'var(--color-accent)', background: 'var(--color-bg-alt)' }}>
      <Botanical className="" />
    </div>
  )
}
