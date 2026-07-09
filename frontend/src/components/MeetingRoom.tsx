import { useEffect, useLayoutEffect, useRef } from 'react'
import type { MeetingState } from '../hooks/useMeeting'
import { HAT_ORDER, HATS } from '../lib/hats'
import { LoadingOverlay } from './LoadingOverlay'
import { ParticipantCard } from './ParticipantCard'
import { SpeakerBubble } from './SpeakerBubble'
import { SummaryPanel } from './SummaryPanel'

type Props = Pick<MeetingState, 'messages' | 'activeSpeaker' | 'hatStatus' | 'phase' | 'report' | 'idea' | 'error'>

export function MeetingRoom({ messages, activeSpeaker, hatStatus, phase, report, idea, error }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const stickToBottom = useRef(true)

  // Track whether the user is near the bottom so auto-scroll never fights them.
  const onScroll = () => {
    const el = scrollRef.current
    if (!el) return
    stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120
  }

  const lastLen = messages.length ? messages[messages.length - 1].text.length : 0

  useLayoutEffect(() => {
    if (!stickToBottom.current) return
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages.length, lastLen, phase])

  // When a brand-new run starts, force-stick again.
  useEffect(() => {
    if (phase === 'streaming' && messages.length <= 1) stickToBottom.current = true
  }, [phase, messages.length])

  const showWelcome = phase === 'idle' && messages.length === 0
  const convening = phase === 'streaming' && messages.length <= 1

  return (
    <div className="mx-auto grid h-full min-h-0 w-full max-w-6xl grid-rows-[auto_minmax(0,1fr)] gap-0 lg:grid-cols-[300px_minmax(0,1fr)] lg:grid-rows-1 lg:gap-5 lg:px-6 lg:py-5">
      {/* Roster */}
      <aside className="min-w-0 px-4 pt-4 lg:min-h-0 lg:overflow-hidden lg:px-0 lg:pt-0">
        <div className="flex h-full flex-col">
          <h2 className="mb-3 hidden text-[12px] font-semibold uppercase tracking-[0.18em] text-ink-48 lg:block">
            Around the Table
          </h2>
          <div className="relative min-h-0 flex-1">
            <div className="flex gap-2.5 overflow-x-auto pb-2 lg:max-h-full lg:flex-col lg:gap-2.5 lg:overflow-y-auto lg:pb-2 lg:pr-2 scrollbar-slim">
              {HAT_ORDER.map((key) => (
                <div key={key} className="min-w-[200px] w-[200px] shrink-0 md:min-w-[220px] md:w-[220px] lg:w-full lg:min-w-0">
                  <ParticipantCard persona={HATS[key]} status={hatStatus[key]} active={activeSpeaker === key} />
                </div>
              ))}
            </div>
            {/* Scroll indicators for smaller screens (horizontal) */}
            <div className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-parchment to-transparent lg:hidden" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-parchment to-transparent lg:hidden" />
            {/* Scroll indicator for desktop (vertical bottom fade) */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 hidden h-8 bg-gradient-to-t from-parchment to-transparent lg:block" />
          </div>
        </div>
      </aside>

      {/* Conversation */}
      <div className="relative min-h-0">
        <LoadingOverlay show={convening} />
        <div
          ref={scrollRef}
          onScroll={onScroll}
          className="scrollbar-slim h-full overflow-y-auto px-4 pb-6 pt-2 lg:px-2"
        >
          <div
            className={`mx-auto max-w-4xl ${showWelcome ? 'flex min-h-full items-center justify-center py-4' : 'space-y-5'}`}
          >
            {showWelcome && <Welcome />}

            {messages.map((m) => (
              <SpeakerBubble key={m.id} message={m} active={activeSpeaker === m.speaker && phase === 'streaming'} />
            ))}

            {error && (
              <div className="animate-fade-rise rounded-[18px] border border-rose-300 bg-rose-50 px-4 py-3 text-[15px] text-rose-700">
                <p className="font-semibold">The meeting hit a snag</p>
                <p className="mt-1 text-rose-600">{error}</p>
              </div>
            )}

            {phase === 'done' && report && (
              <div className="pt-2">
                <div className="mb-5 flex items-center gap-3 text-[13px] text-ink-48">
                  <span className="h-px flex-1 bg-hairline" />
                  Meeting adjourned
                  <span className="h-px flex-1 bg-hairline" />
                </div>
                <SummaryPanel report={report} idea={idea} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Welcome() {
  return (
    <div className="animate-fade-rise rounded-[18px] border border-hairline bg-canvas p-8 text-center sm:p-12">
      <div className="mx-auto mb-7 flex w-fit -space-x-2">
        {HAT_ORDER.map((key, i) => (
          <span
            key={key}
            className="h-12 w-12 rounded-full ring-[3px] ring-canvas shadow-product"
            style={{ background: HATS[key].accent, zIndex: HAT_ORDER.length - i }}
          />
        ))}
      </div>
      <h2 className="font-display text-[34px] font-semibold leading-tight tracking-[-0.02em] text-ink">
        Welcome to the strategy table
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-[17px] leading-[1.47] text-ink-80">
        Pitch a startup idea below and six expert personas — Facts, Intuition, Upside, Creativity, Risk, and the
        Blue Hat facilitator — will debate it live, then hand you a clear verdict and next steps.
      </p>
      <div className="mx-auto mt-8 grid max-w-2xl gap-3 text-left sm:grid-cols-2">
        {HAT_ORDER.map((key) => {
          const p = HATS[key]
          return (
            <div key={key} className="flex items-start gap-3 rounded-[18px] border border-hairline bg-pearl p-4">
              <span className="mt-1 h-3 w-3 shrink-0 rounded-full" style={{ background: p.accent }} />
              <div>
                <div className="text-[15px] font-semibold text-ink">{p.name}</div>
                <div className="text-[13px] leading-snug text-ink-48">{p.blurb}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
