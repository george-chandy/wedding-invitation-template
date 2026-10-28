import type { Wedding } from '../../config'
import { Reveal } from '../animations/Reveal'
import { Unveil } from '../animations/Unveil'
import { Botanical } from '../art/Botanical'
import { SectionHeading } from '../ui/Heading'

/**
 * Editorial spread: heading and message on the left, a vellum arch holding a pressed sprig on the right,
 * and the pull-quote set large across both so the type overlaps the plate. Chapters step down the page.
 */
export function Story({ w }: { w: Wedding }) {
  const s = w.story!
  return (
    <section id="story" className="section story" aria-labelledby="story-h" tabIndex={-1}>
      <div className="container container--wide">
        <div className="story__top">
          <SectionHeading id="story-h" eyebrow={s.eyebrow} title={s.heading} className="story__head" />
          <Unveil className="story__plate-wrap">
            <div className="story__plate paper" aria-hidden="true">
              <Botanical className="story__sprig" />
            </div>
          </Unveil>
          <Reveal className="prose lead story__message" delay={0.1}>
            {s.message.map((p) => <p key={p}>{p}</p>)}
          </Reveal>
          {s.quote && (
            <Reveal as="figure" className="story__quote" delay={0.15}>
              <blockquote>“{s.quote.text}”</blockquote>
              <figcaption className="label">{s.quote.cite}</figcaption>
            </Reveal>
          )}
        </div>

        <ol className="chapters">
          {s.chapters.map((c, i) => (
            <Reveal as="li" key={c.label} className="chapter" delay={i * 0.1}>
              <span className="chapter__label">{c.label}</span>
              <div>
                <h3 className="h3 chapter__title">{c.title}</h3>
                <p className="chapter__body">{c.body}</p>
              </div>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  )
}
