import { Component, type ReactNode } from 'react'

/**
 * Isolates one section: if it throws while rendering, that section is skipped (and logged) while the rest of the
 * invitation stays usable. With `fallback`, a message is shown instead — used at the very top level.
 */
export class SectionBoundary extends Component<{ name: string; children: ReactNode; fallback?: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(error: unknown) {
    console.error(`The "${this.props.name}" section failed to render and was skipped.`, error)
  }
  render() {
    return this.state.failed ? (this.props.fallback ?? null) : this.props.children
  }
}
