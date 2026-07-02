import type { HatStatus } from '../hooks/useMeeting'
import type { HatPersona } from '../lib/hats'
import { HatAvatar } from './HatAvatar'

const STATUS_LABEL: Record<HatStatus, string> = {
  idle: 'Waiting',
  thinking: 'Speaking…',
  spoke: 'Done',
}

interface Props {
  persona: HatPersona
  status: HatStatus
  active: boolean
}

export function ParticipantCard({ persona, status, active }: Props) {
  return (
    <div
      className="flex items-center gap-3 rounded-[18px] border bg-canvas p-3 transition-all duration-300"
      style={{
        background: active ? persona.tint : '#ffffff',
        borderColor: active ? persona.accent : '#e0e0e0',
      }}
    >
      <HatAvatar persona={persona} size="md" active={active} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-[15px] font-semibold text-ink">{persona.name}</span>
          <StatusPill status={status} accent={persona.accent} />
        </div>
        <p className="truncate text-[13px] text-ink-48">{persona.role}</p>
      </div>
    </div>
  )
}

function StatusPill({ status, accent }: { status: HatStatus; accent: string }) {
  if (status === 'thinking') {
    return (
      <span className="flex items-center gap-1 text-[11px] font-medium" style={{ color: accent }}>
        <span className="h-1.5 w-1.5 animate-ping rounded-full" style={{ background: accent }} />
        {STATUS_LABEL.thinking}
      </span>
    )
  }
  return (
    <span
      className={`text-[11px] font-medium ${status === 'spoke' ? 'text-emerald-600' : 'text-ink-48'}`}
    >
      {STATUS_LABEL[status]}
    </span>
  )
}
