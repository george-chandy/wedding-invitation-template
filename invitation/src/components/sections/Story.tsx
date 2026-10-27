import type { Wedding } from '../../config'
import { Reveal } from '../animations/Reveal'
import { SectionHeading } from '../ui/Heading'

export function Story({ w }: { w: Wedding }) {
  const s = w.story!
  return (
    <section id="story" className="section story" aria-labelledby="story-h" tabIndex={-1}>
      <div className="container">
        <div className="story__top">
          <SectionHeading id="story-h" eyebrow={s.eyebrow} title={s.heading} />
          <div className="story__body">
            <Reveal className="prose lead" delay={0.1}>
              {s.message.map((p) => <p key={p}>{p}</p>)}
            </Reveal>
            {s.quote && (
              <Reveal as="figure" className="story__quote" delay={0.15}>
                <blockquote>“{s.quote.text}”</blockquote>
                <figcaption className="label">{s.quote.cite}</figcaption>
              </Reveal>
            )}
          </div>
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
