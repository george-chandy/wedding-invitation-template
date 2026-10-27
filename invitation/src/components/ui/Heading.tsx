import type { ReactNode } from 'react'
import { Reveal } from '../animations/Reveal'

/** Eyebrow + h2 (+ optional lead). Every content section opens with this so hierarchy is consistent. */
export function SectionHeading({ id, eyebrow, title, children, center = false, className = '' }: { id: string; eyebrow: string; title: ReactNode; children?: ReactNode; center?: boolean; className?: string }) {
  return (
    <Reveal as="header" className={`heading ${center ? 'heading--center' : ''} ${className}`}>
      <p className="eyebrow">{eyebrow}</p>
      <h2 id={id} className="h2">{title}</h2>
      {children}
    </Reveal>
  )
}
