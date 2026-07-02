import type { VerdictInfo, VerdictKind } from '../lib/report'
import { Markdown } from './Markdown'

const STYLES: Record<VerdictKind, { ring: string; chip: string; dot: string }> = {
  pursue: {
    ring: 'border-emerald-300',
    chip: 'bg-emerald-50 text-emerald-700',
    dot: 'bg-emerald-500',
  },
  'pursue-with-changes': {
    ring: 'border-amber-300',
    chip: 'bg-amber-50 text-amber-700',
    dot: 'bg-amber-500',
  },
  investigate: {
    ring: 'border-sky-300',
    chip: 'bg-sky-50 text-sky-700',
    dot: 'bg-sky-500',
  },
  pass: {
    ring: 'border-rose-300',
    chip: 'bg-rose-50 text-rose-700',
    dot: 'bg-rose-500',
  },
  unknown: {
    ring: 'border-hairline',
    chip: 'bg-pearl text-ink-80',
    dot: 'bg-ink-48',
  },
}

interface Props {
  info: VerdictInfo
  body: string
}

export function VerdictCard({ info, body }: Props) {
  const s = STYLES[info.kind]
  return (
    <div className={`rounded-[18px] border bg-canvas p-6 ${s.ring}`}>
      <div className="mb-3 flex items-center gap-3">
        <span className="text-[12px] font-semibold uppercase tracking-[0.18em] text-ink-48">
          Final Verdict
        </span>
        <span className={`flex items-center gap-2 rounded-full px-3 py-1 text-[14px] font-semibold ${s.chip}`}>
          <span className={`h-2 w-2 rounded-full ${s.dot}`} />
          {info.label}
        </span>
      </div>
      <Markdown>{body}</Markdown>
    </div>
  )
}
