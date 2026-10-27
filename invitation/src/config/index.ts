import { resolveWedding, type Wedding } from './resolve'
import { validateConfig } from './validate'
import type { WeddingConfig } from './types'
import { weddingConfig } from './wedding'

export type { Wedding } from './resolve'
export { ConfigError } from './validate'

/** Validated + resolved config. Throws a ConfigError (listing every issue) if invalid. */
export function loadWedding(config: WeddingConfig = weddingConfig): Wedding {
  return resolveWedding(validateConfig(config))
}
