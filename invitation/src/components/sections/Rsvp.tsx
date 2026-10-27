import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { Wedding } from '../../config'
import { buildRsvpMailto } from '../../lib/rsvp'
import { Reveal } from '../animations/Reveal'
import { Icon } from '../ui/Icon'
import { SectionHeading } from '../ui/Heading'

type Status = 'idle' | 'sending' | 'sent' | 'error'

const REQUEST_TIMEOUT_MS = 15_000
const NAME_MAX = 120
const NOTES_MAX = 1000

/**
 * RSVP never pretends to store anything. Depending on `rsvp.mode`:
 *  - link:     opens an external form the couple already runs
 *  - email:    composes an email in the guest's own mail app (nothing is sent by this site)
 *  - endpoint: POSTs JSON to the configured provider (https only, host shown to the guest);
 *              "thank you" is shown only after a 2xx response
 */
export function Rsvp({ w }: { w: Wedding }) {
  const r = w.rsvp!
  const s = w.strings
  const [status, setStatus] = useState<Status>('idle')
  const [nameError, setNameError] = useState(false)
  const abort = useRef<AbortController | null>(null)

  // Cancel an in-flight request if the section unmounts.
  useEffect(() => () => abort.current?.abort(), [])

  const endpointHost = r.mode === 'endpoint' && r.endpoint ? new URL(r.endpoint).host : ''

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (status === 'sending') return
    const f = new FormData(e.currentTarget)
    const reply = {
      name: String(f.get('name') ?? '').trim().slice(0, NAME_MAX),
      attending: f.get('attending') === 'no' ? 'no' : 'yes',
      guests: String(Math.min(Math.max(parseInt(String(f.get('guests') ?? '1'), 10) || 1, 1), r.maxGuests)),
      notes: String(f.get('notes') ?? '').trim().slice(0, NOTES_MAX),
    }
    if (!reply.name) {
      setNameError(true)
      return
    }
    setNameError(false)

    if (r.mode === 'email' && r.email) {
      window.location.href = buildRsvpMailto({ email: r.email, names: w.names.short, reply, yes: s.rsvpYes, no: s.rsvpNo })
      return
    }
    if (r.mode === 'endpoint' && r.endpoint) {
      setStatus('sending')
      const ctrl = new AbortController()
      abort.current = ctrl
      const timer = window.setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS)
      try {
        const res = await fetch(r.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(reply),
          signal: ctrl.signal,
          credentials: 'omit',
          referrerPolicy: 'no-referrer',
          redirect: 'error',
        })
        if (!ctrl.signal.aborted || res.ok) setStatus(res.ok ? 'sent' : 'error')
      } catch {
        if (abort.current === ctrl) setStatus('error')
      } finally {
        window.clearTimeout(timer)
      }
    }
  }

  return (
    <section id="rsvp" className="section rsvp" aria-labelledby="rsvp-h" tabIndex={-1}>
      <div className="container">
        <div className="rsvp__grid">
          <div className="rsvp__aside">
            <SectionHeading id="rsvp-h" eyebrow={r.eyebrow} title={r.heading} />
            <Reveal delay={0.1} className="rsvp__aside">
              <p className="lead">{r.intro}</p>
              {r.deadline && <p className="label rsvp__deadline">{s.replyBy} {w.formatDate(r.deadline)}</p>}
              {r.contacts && r.contacts.length > 0 && (
                <div className="contacts">
                  <p className="label muted">{s.contact}</p>
                  {r.contacts.map((c) => (
                    <p key={c.name}>
                      <strong>{c.name}</strong> <span className="muted">· {c.role}</span>
                      {c.email && <><br /><a href={`mailto:${c.email}`}>{c.email}</a></>}
                      {c.phone && <><br /><a href={`tel:${c.phone.replace(/\s+/g, '')}`}>{c.phone}</a></>}
                    </p>
                  ))}
                </div>
              )}
            </Reveal>
          </div>

          <Reveal delay={0.15}>
            {r.mode === 'link' ? (
              <div className="rsvp__form">
                <p className="rsvp__note">{s.rsvpLinkNote}</p>
                <a className="btn btn--solid" href={r.url} target="_blank" rel="noopener noreferrer">{s.rsvpLink} <Icon name="external" size={13} /></a>
              </div>
            ) : status === 'sent' ? (
              <div className="rsvp__form"><p className="lead status--ok" role="status">{s.rsvpThanks}</p></div>
            ) : (
              <form className="rsvp__form" onSubmit={onSubmit} aria-describedby="rsvp-note" noValidate>
                <div className="field">
                  <label htmlFor="rsvp-name">{s.rsvpName}</label>
                  <input id="rsvp-name" name="name" className="input" required maxLength={NAME_MAX} autoComplete="name" aria-invalid={nameError || undefined} aria-describedby={nameError ? 'rsvp-name-error' : undefined} onChange={() => nameError && setNameError(false)} />
                  {nameError && <p id="rsvp-name-error" className="status status--error" role="alert">{s.rsvpNameRequired}</p>}
                </div>
                <fieldset className="field">
                  <legend>{s.rsvpAttending}</legend>
                  <div className="choice-row">
                    <label className="choice"><input type="radio" name="attending" value="yes" defaultChecked /><span>{s.rsvpYes}</span></label>
                    <label className="choice"><input type="radio" name="attending" value="no" /><span>{s.rsvpNo}</span></label>
                  </div>
                </fieldset>
                <div className="field">
                  <label htmlFor="rsvp-guests">{s.rsvpGuests}</label>
                  <select id="rsvp-guests" name="guests" className="input" defaultValue="1">
                    {Array.from({ length: r.maxGuests }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="rsvp-notes">{s.rsvpNotes}</label>
                  <textarea id="rsvp-notes" name="notes" className="input" rows={3} maxLength={NOTES_MAX} />
                </div>
                <button className="btn btn--solid" type="submit" disabled={status === 'sending'}>
                  <Icon name="mail" /> {status === 'sending' ? s.rsvpSending : r.mode === 'email' ? s.rsvpSendEmail : s.rsvpSubmit}
                </button>
                <p id="rsvp-note" className="rsvp__note">{r.mode === 'email' ? s.rsvpEmailNote : s.rsvpEndpointNote.replace('{host}', endpointHost)}</p>
                <p className="status status--error" role="alert">{status === 'error' ? s.rsvpError : ''}</p>
              </form>
            )}
          </Reveal>
        </div>
      </div>
    </section>
  )
}
