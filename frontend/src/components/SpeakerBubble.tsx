import type { MeetingMessage } from '../hooks/useMeeting'
import { HATS } from '../lib/hats'
import { HatAvatar } from './HatAvatar'
import { StreamingMessage } from './StreamingMessage'

interface Props {
  message: MeetingMessage
  active: boolean
}

export function SpeakerBubble({ message, active }: Props) {
  if (message.speaker === 'user') {
    return (
      <div className="animate-fade-rise flex items-end justify-end gap-3">
        <div className="max-w-[78%] rounded-[18px] rounded-br-[6px] bg-action px-4 py-3 text-[15px] leading-[1.47] text-white">
          <div className="mb-0.5 text-[11px] font-semibold uppercase tracking-wide text-white/75">
            You · Idea Proposer
          </div>
          <p className="whitespace-pre-wrap">{message.text}</p>
        </div>
        <HatAvatar user size="md" active={active} />
      </div>
    )
  }

  const persona = HATS[message.speaker]

  return (
    <div className="animate-fade-rise flex items-start gap-3">
      <HatAvatar persona={persona} size="md" active={active} />
      <div className="min-w-0 max-w-[88%] flex-1">
        <div className="mb-1.5 flex items-center gap-2">
          <span className="text-[15px] font-semibold" style={{ color: persona.accent }}>
            {persona.name}
          </span>
          <span className="rounded-full border border-hairline bg-pearl px-2 py-0.5 text-[11px] font-medium tracking-wide text-ink-48">
            {persona.role}
          </span>
        </div>
        <div
          className="rounded-[18px] rounded-tl-[6px] border bg-canvas px-4 py-3 transition-all duration-300"
          style={{
            background: active ? persona.tint : '#ffffff',
            borderColor: active ? persona.accent : '#e0e0e0',
          }}
        >
          <StreamingMessage text={message.text} status={message.status} />
        </div>
      </div>
    </div>
  )
}
