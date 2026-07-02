import { HAT_ORDER, HATS } from '../lib/hats'

interface Props {
  show: boolean
  label?: string
}

export function LoadingOverlay({ show, label = 'Convening the meeting…' }: Props) {
  if (!show) return null
  return (
    <div className="frosted absolute inset-0 z-10 flex items-center justify-center bg-parchment/60">
      <div className="flex flex-col items-center gap-5 px-6 text-center">
        <div className="flex -space-x-2">
          {HAT_ORDER.map((key, i) => {
            const p = HATS[key]
            return (
              <span
                key={key}
                className="h-9 w-9 rounded-full ring-2 ring-canvas"
                style={{
                  background: p.accent,
                  animation: 'dot-bounce 1.1s infinite ease-in-out',
                  animationDelay: `${i * 0.12}s`,
                }}
              />
            )
          })}
        </div>
        <div>
          <p className="font-display text-[21px] font-semibold tracking-[-0.01em] text-ink">{label}</p>
          <p className="mt-1 text-[15px] text-ink-48">
            The six experts are taking their seats. This can take a minute.
          </p>
        </div>
      </div>
    </div>
  )
}
