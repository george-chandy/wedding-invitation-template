import { useCallback, useState } from 'react'
import type { ImageAsset } from '../../config/types'
import { assetUrl } from '../../lib/assets'
import { capture } from '../../lib/capture'

/** "path 560w, path 1120w" → the same list with every path resolved against Vite's base URL. */
function resolveSrcSet(srcSet: string) {
  return srcSet
    .split(',')
    .map((entry) => {
      const [path, width] = entry.trim().split(/\s+/)
      return `${assetUrl(path)} ${width}`
    })
    .join(', ')
}

interface PhotoProps {
  img: ImageAsset
  /** The `sizes` attribute for this slot, so the browser downloads the smallest adequate candidate. */
  sizes: string
  /** Hero images load eagerly (they sit behind the envelope and must be ready when it opens). */
  eager?: boolean
  /** Called when the file can't be loaded, so the caller can show its drawn fallback. */
  onFail?: () => void
}

/**
 * One responsive photograph. It fills whatever frame the layout gives it (`object-fit: cover`, crop steered by
 * `img.focus`), reserves its space from `width`/`height`, stays invisible until it has loaded (the frame's tonal
 * ground shows meanwhile) and reports failure upward instead of showing a broken-image icon.
 */
export function Photo({ img, sizes, eager = false, onFail }: PhotoProps) {
  const [loaded, setLoaded] = useState(false)
  // A cached image can finish before React attaches onLoad/onError, so settle it from the element on mount.
  const settle = useCallback(
    (el: HTMLImageElement | null) => {
      if (!el || !el.complete) return
      if (el.naturalWidth > 0) setLoaded(true)
      else onFail?.()
    },
    [onFail],
  )
  return (
    <img
      ref={settle}
      className="photo"
      data-state={loaded ? 'loaded' : 'loading'}
      src={assetUrl(img.src!)}
      srcSet={img.srcSet ? resolveSrcSet(img.srcSet) : undefined}
      sizes={img.srcSet ? sizes : undefined}
      alt={img.alt}
      width={img.width}
      height={img.height}
      loading={eager || capture.enabled ? 'eager' : 'lazy'}
      decoding="async"
      style={img.focus ? { objectPosition: img.focus } : undefined}
      onLoad={() => setLoaded(true)}
      onError={() => onFail?.()}
    />
  )
}
