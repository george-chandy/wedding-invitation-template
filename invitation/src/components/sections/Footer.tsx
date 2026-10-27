import type { Wedding } from '../../config'
import { Reveal } from '../animations/Reveal'
import { Seal } from '../art/Seal'
import { Icon } from '../ui/Icon'
import { Ornament } from '../ui/Ornament'

export function Footer({ w }: { w: Wedding }) {
  const f = w.footer
  const [a, b] = w.couple.people
  return (
    <footer className="section section--inverse footer">
      <div className="container container--prose">
        <Reveal className="footer__in">
          <Seal monogram={w.couple.monogram} className="footer__seal" />
          <p className="eyebrow">{f.eyebrow}</p>
          <p className="footer__names">{a.first} <i>&amp;</i> {b.first}</p>
          <Ornament />
          <p className="label muted">{w.labels.dateShort} · {w.venue.name}</p>
          <p className="footer__message">{f.message}</p>
          <a className="btn" href="#top">
            <Icon name="up" size={14} /> {w.strings.backToTop}
          </a>
          {f.credit && <p className="footer__credit">{f.credit}</p>}
        </Reveal>
      </div>
    </footer>
  )
}
