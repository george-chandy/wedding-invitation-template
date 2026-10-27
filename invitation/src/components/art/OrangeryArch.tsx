import { DrawPath } from '../animations/DrawPath'

const PATHS = [
  'M20 450H380',
  'M60 450V430M340 450V430',
  'M150 430V230a50 50 0 0 1 100 0v200z',
  'M162 430V230a38 38 0 0 1 76 0v200',
  'M200 192V430M150 310h100',
  'M70 430V290a30 30 0 0 1 60 0v140z',
  'M100 260V430M70 355h60',
  'M270 430V290a30 30 0 0 1 60 0v140z',
  'M300 260V430M270 355h60',
  'M60 430V215M340 430V215',
  'M45 205H355M55 216H345',
  'M120 205 200 128 280 205',
  'M200 128V205M160 166V205M240 166V205',
  'M110 450v12h180v-12M90 462v12h220v-12',
  'M35 372a22 22 0 1 0 0 .1M35 417v23M25 440h20l-3 10H28z',
  'M365 372a22 22 0 1 0 0 .1M365 417v23M355 440h20l-3 10h-14z',
]

/** Line drawing of the arched glasshouse. Original artwork; stroke follows currentColor. */
export function OrangeryArch({ label }: { label: string }) {
  return (
    <svg viewBox="0 0 400 500" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" role="img" aria-label={label}>
      {PATHS.map((d, i) => (
        <DrawPath key={i} d={d} delay={i * 0.08} duration={1.4} vectorEffect="non-scaling-stroke" />
      ))}
    </svg>
  )
}
