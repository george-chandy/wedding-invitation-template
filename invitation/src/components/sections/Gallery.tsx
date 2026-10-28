import { useCallback, useState } from 'react'
import type { Wedding } from '../../config'
import type { ImageAsset } from '../../config/types'
import { Unveil } from '../animations/Unveil'
import { ArtPlate } from '../art/ArtPlate'
import { SectionHeading } from '../ui/Heading'
import { Photo } from '../ui/Photo'

/**
 * Mount board: plates are art-directed to fixed crops (4:5, 5:4, 1:1, 3:4 in rotation) with `object-fit: cover`,
 * whatever the source image's own proportions. Placement is pure CSS (`:nth-child`), so any number of images works.
 */
function Plate({ img, index }: { img: ImageAsset; index: number }) {
  const [failed, setFailed] = useState(false)
  const onFail = useCallback(() => setFailed(true), [])
  return (
    <figure className="plate">
      <Unveil className="plate__frame paper" delay={(index % 2) * 0.12}>
        <div className="plate__print">
          {img.src && !failed ? (
            <Photo img={img} sizes="(min-width: 768px) 46vw, 90vw" onFail={onFail} />
          ) : (
            <ArtPlate label={img.alt} />
          )}
        </div>
      </Unveil>
      {img.caption && <figcaption><span className="plate__no" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>{img.caption}</figcaption>}
    </figure>
  )
}

export function Gallery({ w }: { w: Wedding }) {
  const g = w.gallery!
  return (
    <section id="gallery" className="section gallery" aria-labelledby="gallery-h" tabIndex={-1}>
      <div className="container container--wide">
        <SectionHeading id="gallery-h" eyebrow={g.eyebrow} title={g.heading} className="gallery__head" />
        <div className="gallery__grid">
          {g.images.map((img, i) => <Plate key={`${img.src ?? 'plate'}-${i}`} img={img} index={i} />)}
        </div>
      </div>
    </section>
  )
}
