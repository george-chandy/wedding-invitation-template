/** Hairline · diamond · hairline divider. Decorative. */
export function Ornament({ className = '' }: { className?: string }) {
  return (
    <div className={`ornament ${className}`} aria-hidden="true">
      <svg width="9" height="9" viewBox="0 0 9 9"><path d="M4.5 0 9 4.5 4.5 9 0 4.5z" fill="currentColor" /></svg>
    </div>
  )
}
