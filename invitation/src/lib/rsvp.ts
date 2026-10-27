export interface RsvpReply {
  name: string
  attending: string
  guests: string
  notes: string
}

/** Builds the mailto: URL used by `rsvp.mode = "email"`. Pure so it can be unit-tested. */
export function buildRsvpMailto(opts: { email: string; names: string; reply: RsvpReply; yes: string; no: string }): string {
  const { email, names, reply, yes, no } = opts
  const body = [
    `Name: ${reply.name}`,
    `Attending: ${reply.attending === 'yes' ? yes : no}`,
    reply.attending === 'yes' ? `Guests: ${reply.guests}` : '',
    reply.notes ? `Notes: ${reply.notes}` : '',
  ].filter(Boolean).join('\r\n')
  return `mailto:${email}?subject=${encodeURIComponent(`RSVP — ${reply.name} — ${names}`)}&body=${encodeURIComponent(body)}`
}
