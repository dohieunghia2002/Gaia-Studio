import type { CSSProperties, ReactNode } from 'react';

// Bộ icon nét (kiểu Lucide) chép từ sprite trong mockup. Icon "coin" đánh dấu credit ở mọi nơi.

const STROKE = { fill: 'none', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

type Def = { sw?: number; fill?: boolean; body: ReactNode };

const ICONS = {
  download: { body: <><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" /></> },
  pencil: { body: <><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></> },
  more: { fill: true, body: <><circle cx="5" cy="12" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="19" cy="12" r="1.6" /></> },
  copy: { body: <><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></> },
  trash: { body: <><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="m6 6 1 14h10l1-14" /></> },
  refresh: { body: <><path d="M21 12a9 9 0 1 1-2.64-6.36" /><path d="M21 3v6h-6" /></> },
  check: { sw: 2.25, body: <path d="M20 6 9 17l-5-5" /> },
  x: { sw: 2, body: <><path d="M18 6 6 18" /><path d="m6 6 12 12" /></> },
  plus: { body: <><path d="M12 5v14" /><path d="M5 12h14" /></> },
  alert: { body: <><circle cx="12" cy="12" r="9" /><path d="M12 8v5" /><path d="M12 16h.01" /></> },
  clock: { body: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></> },
  done: { body: <><circle cx="12" cy="12" r="9" /><path d="m8 12 3 3 5-6" /></> },
  chevron: { body: <path d="m6 9 6 6 6-6" /> },
  user: { body: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-6 8-6s8 2 8 6" /></> },
  image: { body: <><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-5-5L5 21" /></> },
  video: { body: <><rect x="2" y="5" width="15" height="14" rx="2" /><path d="m17 10 5-3v10l-5-3" /></> },
  expand: { body: <><path d="M15 3h6v6" /><path d="M9 21H3v-6" /><path d="m21 3-7 7" /><path d="m3 21 7-7" /></> },
  'arrow-right': { sw: 2, body: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></> },
  'arrow-left': { body: <><path d="M19 12H5" /><path d="m12 19-7-7 7-7" /></> },
  play: { fill: true, body: <path d="M8 5v14l11-7z" /> },
  pause: { fill: true, body: <><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></> },
  volume: { body: <><path d="M11 5 6 9H3v6h3l5 4z" /><path d="M15.5 8.5a5 5 0 0 1 0 7" /><path d="M18.5 5.5a9 9 0 0 1 0 13" /></> },
  mute: { body: <><path d="M11 5 6 9H3v6h3l5 4z" /><path d="m22 9-6 6" /><path d="m16 9 6 6" /></> },
  coin: { sw: 2, body: <><circle cx="8" cy="8" r="6" /><path d="M18.09 10.37A6 6 0 1 1 10.34 18" /><path d="M7 6h1v4" /><path d="m16.71 13.88.7.71-2.82 2.82" /></> },
  logout: { body: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5" /><path d="M21 12H9" /></> },
  qr: { body: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><path d="M14 14h3v3h-3z" /><path d="M20 14v.01" /><path d="M14 20h.01" /><path d="M17 20h4v-3" /></> },
  layers: { body: <><path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z" /><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65" /><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65" /></> },
  undo: { body: <><path d="M9 14 4 9l5-5" /><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" /></> },
  max: { body: <><path d="M8 3H3v5" /><path d="M16 3h5v5" /><path d="M8 21H3v-5" /><path d="M16 21h5v-5" /></> },
} satisfies Record<string, Def>;

export type IconName = keyof typeof ICONS;

export function Icon({
  name,
  size = 16,
  className,
  style,
}: {
  name: IconName;
  size?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const def: Def = ICONS[name];
  const paint = def.fill ? { fill: 'currentColor' } : { ...STROKE, strokeWidth: def.sw ?? 1.75 };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={className} style={style} {...paint}>
      {def.body}
    </svg>
  );
}

/** Logo GAIA (bản SVG gốc ở logo/final/gaia-mark.svg). */
export function LogoMark({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className={className} style={{ display: 'block', flex: 'none' }}>
      <rect width="64" height="64" rx="13" fill="#F0A93A" />
      <path d="M10 23.5V10h16M54 44.5V54H38" fill="none" stroke="#1A1206" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17 34.5a15 15 0 0 1 30 0z" fill="#1A1206" />
      <rect x="7.5" y="36" width="49" height="4" fill="#1A1206" />
    </svg>
  );
}
