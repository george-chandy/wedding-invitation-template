import type { Wedding } from '../../config'
import { useCopy } from '../../hooks/useCopy'
import { Reveal } from '../animations/Reveal'
import { OrangeryArch } from '../art/OrangeryArch'
import { Icon } from '../ui/Icon'
import { SectionHeading } from '../ui/Heading'

export function Venue({ w }: { w: Wedding }) {
  const s = w.strings
  const v = w.venue
  const { state, copy } = useCopy(w.venueLine)
  const place = v.coordinates ? `${v.coordinates.lat},${v.coordinates.lng}` : w.mapsQuery
  const q = encodeURIComponent(place)

  return (
    <section id="venue" className="section venue" aria-labelledby="venue-h" tabIndex={-1}>
      <div className="container">
        <div className="venue__grid">
          <div className="venue__art">
            <OrangeryArch label={`Line drawing of ${v.name}`} />
          </div>

          <div className="venue__info">
            <SectionHeading id="venue-h" eyebrow={s.venueEyebrow} title={v.name} />
            <Reveal delay={0.1} className="venue__details">
              <address className="venue__address">
                {v.address.map((line) => <span key={line}>{line}<br /></span>)}
              </address>
              <p className="muted">{v.description}</p>
              <div className="btn-row venue__actions">
                <a className="btn btn--solid" href={`https://www.google.com/maps/search/?api=1&query=${q}`} target="_blank" rel="noopener noreferrer">
                  <Icon name="navigate" /> {s.openMaps} <Icon name="external" size={13} />
                </a>
                <a className="btn" href={`https://www.google.com/maps/dir/?api=1&destination=${q}`} target="_blank" rel="noopener noreferrer">{s.directions}</a>
                <a className="btn" href={`https://maps.apple.com/?q=${q}`} target="_blank" rel="noopener noreferrer">{s.appleMaps}</a>
                <button type="button" className="btn" onClick={copy} data-testid="copy-address">
                  <Icon name={state === 'ok' ? 'check' : 'copy'} /> {state === 'ok' ? s.addressCopied : s.copyAddress}
                </button>
              </div>
              <p className={`status ${state === 'fail' ? 'status--error' : 'status--ok'}`} role="status" aria-live="polite">
                {state === 'ok' ? s.addressCopied : state === 'fail' ? s.copyFailed : ''}
              </p>
              {v.travel.length > 0 && (
                <>
                  <h3 className="label muted">{s.gettingThere}</h3>
                  <ul className="travel">
                    {v.travel.map((t) => (
                      <li key={t.label}>
                        <Icon name={t.icon} size={18} />
                        <div><b>{t.label}</b><span>{t.detail}</span></div>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  )
}
