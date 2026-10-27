import type { Wedding } from '../../config'
import { Reveal } from '../animations/Reveal'
import { SectionHeading } from '../ui/Heading'

export function Details({ w }: { w: Wedding }) {
  const d = w.details!
  return (
    <section id="details" className="section section--alt details" aria-labelledby="details-h" tabIndex={-1}>
      <div className="container">
        <SectionHeading id="details-h" eyebrow={d.eyebrow} title={d.heading} className="details__head" />
        <ul className="details__grid">
          {d.items.map((it, i) => (
            <Reveal as="li" key={it.title} className="detail" delay={(i % 2) * 0.08}>
              <span className="detail__n" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
              <div>
                <h3 className="h3 detail__title">{it.title}</h3>
                <p>{it.body}</p>
              </div>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  )
}
