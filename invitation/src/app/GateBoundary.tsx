import { Component, type ReactNode } from 'react'

/**
 * If the envelope fails for any reason (animation init, unexpected DOM), drop the gate and show the
 * invitation. Essential content is never trapped behind a decorative interaction.
 */
export class GateBoundary extends Component<{ children: ReactNode; onFail: () => void }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(error: unknown) {
    console.warn('Envelope gate failed; showing the invitation directly.', error)
    this.props.onFail()
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}
