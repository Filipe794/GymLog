export type IconName = 'grid' | 'dumbbell' | 'calendar' | 'chart' | 'user' | 'menu' | 'plus' | 'arrow' | 'edit' | 'trash' | 'up' | 'down' | 'close' | 'eye' | 'eye-off' | 'logout' | 'check'

type IconProps = {
  name: IconName
  size?: number
}

export function Icon({ name, size = 20 }: IconProps) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

  if (name === 'grid') return <svg {...common}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
  if (name === 'dumbbell') return <svg {...common}><path d="M6.5 6.5v11M3.5 9v6M17.5 6.5v11M20.5 9v6M6.5 12h11" /></svg>
  if (name === 'calendar') return <svg {...common}><rect x="3" y="4.5" width="18" height="17" rx="2" /><path d="M16 2.5v4M8 2.5v4M3 9h18" /></svg>
  if (name === 'chart') return <svg {...common}><path d="M4 19V5M4 19h17M8 16v-4M12 16V8M16 16v-6M20 16v-9" /></svg>
  if (name === 'user') return <svg {...common}><circle cx="12" cy="8" r="3.5" /><path d="M4.5 20c.8-3.5 3.3-5.5 7.5-5.5s6.7 2 7.5 5.5" /></svg>
  if (name === 'menu') return <svg {...common}><path d="M4 6h16M4 12h16M4 18h16" /></svg>
  if (name === 'plus') return <svg {...common}><path d="M12 5v14M5 12h14" /></svg>
  if (name === 'edit') return <svg {...common}><path d="m4 16.5-.8 3.3 3.3-.8L18.2 7.3a2.3 2.3 0 0 0-3.3-3.3L3.2 15.7M13.5 5.5l3.3 3.3" /></svg>
  if (name === 'trash') return <svg {...common}><path d="M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V4h6v3" /></svg>
  if (name === 'up') return <svg {...common}><path d="m6 10 6-6 6 6M12 4v16" /></svg>
  if (name === 'down') return <svg {...common}><path d="m6 14 6 6 6-6M12 20V4" /></svg>
  if (name === 'close') return <svg {...common}><path d="m6 6 12 12M18 6 6 18" /></svg>
  if (name === 'eye') return <svg {...common}><path d="M2.5 12s3.2-5 9.5-5 9.5 5 9.5 5-3.2 5-9.5 5-9.5-5-9.5-5Z" /><circle cx="12" cy="12" r="2.2" /></svg>
  if (name === 'eye-off') return <svg {...common}><path d="m3 3 18 18M10.6 10.7a2.2 2.2 0 0 0 3 3M9.9 5.2A10.7 10.7 0 0 1 12 5c6.3 0 9.5 5 9.5 5a16 16 0 0 1-3.1 3.6M6.3 6.3C3.8 7.8 2.5 10 2.5 10s3.2 5 9.5 5c1 0 1.9-.1 2.7-.4" /></svg>
  if (name === 'logout') return <svg {...common}><path d="M10 5H5v14h5M14 8l4 4-4 4M9 12h9" /></svg>
  if (name === 'check') return <svg {...common}><path d="m5 12 4 4L19 6" /></svg>
  return <svg {...common}><path d="M5 12h13M13 6l6 6-6 6" /></svg>
}
