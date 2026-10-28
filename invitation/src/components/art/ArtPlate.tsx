import { Botanical } from './Botanical'

/** Generated stand-in shown when a gallery image has no `src` or fails to load. Fills whatever frame the layout gives it. */
export function ArtPlate({ label }: { label: string }) {
  return (
    <div role="img" aria-label={label} style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', color: 'var(--color-accent)', background: 'var(--color-plate)' }}>
      <Botanical className="art-plate__sprig" />
    </div>
  )
}
