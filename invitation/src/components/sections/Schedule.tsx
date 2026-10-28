import { m } from 'motion/react'
import type { Wedding } from '../../config'
import { Reveal } from '../animations/Reveal'
import { ease } from '../animations/tokens'
import { SectionHeading } from '../ui/Heading'
import { useStaticMotion } from '../animations/useStaticMotion'

export function Schedule({ w }: { w: Wedding }) {
  const s = w.schedule!
  const reduce = useStaticMotion()
  return (
    <section id="schedule" className="section section--alt schedule" aria-labelledby="schedule-h" tabIndex={-1}>
      <div className="container">
        <div className="schedule__grid">
        <SectionHeading id="schedule-h" eyebrow={s.eyebrow} title={s.heading} className="schedule__head">
          <p className="lead muted">{w.labels.dateLong}</p>
          <p className="schedule__where label muted">{w.venue.name}</p>
        </SectionHeading>
        <ol className="timeline">
          {reduce ? (
            <span className="timeline__line" aria-hidden="true" />
          ) : (
            <m.span
              className="timeline__line"
              aria-hidden="true"
              initial={{ scaleY: 0 }}
              whileInView={{ scaleY: 1 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ duration: 1.6, ease: ease.inOut }}
            />
          )}
          {s.items.map((it, i) => (
            <Reveal as="li" key={it.time + it.title} className="timeline__item" delay={Math.min(i, 3) * 0.06}>
              <time className="timeline__time" dateTime={it.time}>{w.formatClock(it.time)}</time>
              <div className="timeline__body">
                <h3 className="h3 timeline__title">{it.title}</h3>
                {it.description && <p className="timeline__desc">{it.description}</p>}
                {it.place && <p className="label timeline__place">{it.place}</p>}
              </div>
            </Reveal>
          ))}
        </ol>
        </div>
      </div>
    </section>
  )
}
