// import { useState } from 'react'
// import type { Wedding } from '../../config'
// import type { ImageAsset } from '../../config/types'
// import { assetUrl } from '../../lib/assets'
// import { capture } from '../../lib/capture'
// import { Reveal } from '../animations/Reveal'
// import { ArtPlate } from '../art/ArtPlate'
// import { SectionHeading } from '../ui/Heading'

// function Plate({ img, index }: { img: ImageAsset; index: number }) {
//   const [failed, setFailed] = useState(false)
//   return (
//     <Reveal as="figure" className="plate" delay={(index % 3) * 0.08}>
//       <div className="plate__frame">
//         {img.src && !failed ? (
//           <img
//             src={assetUrl(img.src)}
//             alt={img.alt}
//             width={img.width}
//             height={img.height}
//             loading={capture.enabled ? 'eager' : 'lazy'}
//             decoding="async"
//             onError={() => setFailed(true)}
//           />
//         ) : (
//           <ArtPlate width={img.width} height={img.height} label={img.alt} />
//         )}
//       </div>
//       {img.caption && <figcaption>{img.caption}</figcaption>}
//     </Reveal>
//   )
// }

// export function Gallery({ w }: { w: Wedding }) {
//   const g = w.gallery!
//   return (
//     <section id="gallery" className="section gallery" aria-labelledby="gallery-h" tabIndex={-1}>
//       <div className="container container--wide">
//         <SectionHeading id="gallery-h" eyebrow={g.eyebrow} title={g.heading} className="gallery__head" />
//         <div className="gallery__grid">
//           {g.images.map((img, i) => <Plate key={`${img.src ?? 'plate'}-${i}`} img={img} index={i} />)}
//         </div>
//       </div>
//     </section>
//   )
// }
