// import { memo } from 'react'
// import type { Wedding } from '../../config'
// import { useNow } from '../../hooks/useNow'
// import { downloadIcs, googleCalendarUrl, toCalendarEvent } from '../../lib/calendar'
// import { breakdown, phaseAt } from '../../lib/time'
// import { Reveal } from '../animations/Reveal'
// import { Icon } from '../ui/Icon'
// import { SectionHeading } from '../ui/Heading'

// // Only the unit whose text actually changed re-renders each second.
// const Unit = memo(function Unit({ value, label, pad }: { value: number; label: string; pad: boolean }) {
//   return (
//     <div className="countdown__unit" aria-hidden="true">
//       <span className="numeral countdown__num">{pad ? String(value).padStart(2, '0') : value}</span>
//       <span className="label">{label}</span>
//     </div>
//   )
// })

// export function Countdown({ w }: { w: Wedding }) {
//   const c = w.countdown!
//   const s = w.strings
//   const now = useNow()
//   const phase = phaseAt(now, w.start.getTime(), w.end.getTime())
//   const t = breakdown(w.start.getTime() - now)
//   const event = toCalendarEvent(w)
//   // Screen readers get a minute-resolution sentence (not announced each second).
//   const spoken = `${t.days} ${s.days.toLowerCase()}, ${t.hours} ${s.hours.toLowerCase()}, ${t.minutes} ${s.minutes.toLowerCase()} ${s.untilLabel}`

//   return (
//     <section id="countdown" className="section section--inverse countdown" aria-labelledby="countdown-h" tabIndex={-1}>
//       <div className="container container--wide">
//         <SectionHeading id="countdown-h" center eyebrow={c.eyebrow} title={c.heading} />
//         <Reveal delay={0.1}>
//           {phase === 'before' ? (
//             <div className="countdown__grid" role="timer" aria-label={spoken}>
//               <Unit value={t.days} label={s.days} pad={false} />
//               <Unit value={t.hours} label={s.hours} pad />
//               <Unit value={t.minutes} label={s.minutes} pad />
//               <Unit value={t.seconds} label={s.seconds} pad />
//             </div>
//           ) : (
//             <p className="countdown__message" role="status">{phase === 'during' ? c.during : c.after}</p>
//           )}
//           <p className="countdown__note label muted">{w.labels.dateLong} · {w.labels.time} · {w.venue.name}</p>
//           {phase !== 'after' && (
//             <div className="btn-row">
//               <a className="btn btn--solid" href={googleCalendarUrl(event)} target="_blank" rel="noopener noreferrer" data-testid="google-calendar">
//                 <Icon name="calendar" /> {s.addToGoogle} <Icon name="external" size={13} />
//               </a>
//               <button type="button" className="btn" onClick={() => downloadIcs(event)} data-testid="download-ics">
//                 <Icon name="download" /> {s.saveIcs}
//               </button>
//             </div>
//           )}
//           {phase !== 'after' && <p className="countdown__hint">{s.saveIcsHint}</p>}
//         </Reveal>
//       </div>
//     </section>
//   )
// }
