import type { ReactNode } from 'react'

const paths = {
  calendar: <><rect x="3.5" y="5" width="17" height="15" rx="1.5" /><path d="M3.5 10h17M8 3v4M16 3v4" /></>,
  download: <path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M5 20h14" />,
  external: <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />,
  navigate: <path d="m4 11 16-7-7 16-2-7z" />,
  copy: <><rect x="8" y="8" width="12" height="12" rx="1.5" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></>,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  up: <path d="M12 19V5M6 11l6-6 6 6" />,
  mail: <><rect x="3.5" y="5.5" width="17" height="13" rx="1.5" /><path d="m4 7 8 6 8-6" /></>,
  plane: <path d="m3 13 18-8-6 16-3-6.5zM12 14.5 21 5" />,
  train: <><rect x="5" y="3.5" width="14" height="13" rx="3" /><path d="M5 11h14M8 20l2-3.5M16 20l-2-3.5" /><circle cx="9" cy="14" r=".6" /><circle cx="15" cy="14" r=".6" /></>,
  car: <><path d="M4 16v-3l2-5h12l2 5v3zM4 16v2M20 16v2" /><circle cx="8" cy="14" r=".6" /><circle cx="16" cy="14" r=".6" /></>,
  bus: <><rect x="5" y="3.5" width="14" height="14" rx="2" /><path d="M5 12h14M7 20.5v-3M17 20.5v-3" /><circle cx="9" cy="15" r=".6" /><circle cx="15" cy="15" r=".6" /></>,
  walk: <><circle cx="13" cy="4.5" r="1.8" /><path d="m9 21 2.5-6-2-3 1-4 3.5 2 2.5 1M13 10l-1 4 3 3 1 4" /></>,
} satisfies Record<string, ReactNode>

export type IconName = keyof typeof paths

export function Icon({ name, size = 16 }: { name: IconName; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {paths[name]}
    </svg>
  )
}
