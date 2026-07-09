import type { HatPersona } from '../lib/hats'

type Size = 'sm' | 'md' | 'lg'

const SIZE_PX: Record<Size, number> = { sm: 32, md: 40, lg: 56 }

function TopHatGlyph({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" width="58%" height="58%" fill="none" aria-hidden="true">
      <path
        d="M8 4.5h8a1 1 0 0 1 1 1V15H7V5.5a1 1 0 0 1 1-1Z"
        fill={color}
        opacity="0.95"
      />
      <rect x="7" y="12" width="10" height="2.2" fill={color} opacity="0.45" />
      <path
        d="M3.5 15h17a1 1 0 0 1 0 2h-17a1 1 0 0 1 0-2Z"
        fill={color}
        opacity="0.95"
      />
    </svg>
  )
}

function UserGlyph({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" width="58%" height="58%" fill="none" aria-hidden="true">
      <circle cx="12" cy="8.5" r="3.6" fill={color} />
      <path d="M4.5 19.5a7.5 7.5 0 0 1 15 0Z" fill={color} />
    </svg>
  )
}

interface Props {
  persona?: HatPersona
  user?: boolean
  size?: Size
  active?: boolean
}

export function HatAvatar({ persona, user, size = 'md', active = false }: Props) {
  const px = SIZE_PX[size]
  const accent = user ? '#0066cc' : (persona?.accent ?? '#0066cc')
  const glyph = user ? '#ffffff' : persona?.onAccent ?? '#ffffff'

  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center rounded-full ${
        active ? 'animate-pulse-ring shadow-product' : ''
      }`}
      style={
        {
          width: px,
          height: px,
          background: accent,
          boxShadow: active ? `0 0 0 2px ${accent}` : undefined,
          '--ring-color': `${accent}66`,
        } as React.CSSProperties
      }
    >
      {user ? <UserGlyph color={glyph} /> : <TopHatGlyph color={glyph} />}
    </span>
  )
}
