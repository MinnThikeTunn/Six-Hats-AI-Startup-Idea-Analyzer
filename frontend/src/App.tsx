import { useEffect, useState } from 'react'
import { IdeaComposer } from './components/IdeaComposer'
import { MeetingRoom } from './components/MeetingRoom'
import { checkHealth } from './lib/api'
import { useMeeting } from './hooks/useMeeting'

export default function App() {
  const meeting = useMeeting()
  const [online, setOnline] = useState<boolean | null>(null)

  useEffect(() => {
    let active = true
    checkHealth().then((ok) => active && setOnline(ok))
    return () => {
      active = false
    }
  }, [])

  const busy = meeting.phase === 'streaming'
  const hasRun = meeting.phase !== 'idle'

  return (
    <div className="flex h-dvh flex-col bg-parchment text-ink">
      <Header online={online} />
      <main className="min-h-0 flex-1">
        <MeetingRoom
          messages={meeting.messages}
          activeSpeaker={meeting.activeSpeaker}
          hatStatus={meeting.hatStatus}
          phase={meeting.phase}
          report={meeting.report}
          idea={meeting.idea}
          error={meeting.error}
        />
      </main>
      <IdeaComposer onSubmit={meeting.start} busy={busy} onReset={meeting.reset} hasRun={hasRun} />
    </div>
  )
}

function Header({ online }: { online: boolean | null }) {
  return (
    <header className="frosted z-20 flex items-center justify-between border-b border-hairline px-5 py-3 md:px-8">
      <div className="flex items-center gap-3">
        <div className="flex -space-x-1.5">
          {['#8a90a0', '#e0244a', '#d9941a', '#1a9c63', '#3a3f4c', '#0066cc'].map((c, i) => (
            <span
              key={c}
              className="h-5 w-5 rounded-full ring-2 ring-canvas"
              style={{ background: c, zIndex: 6 - i }}
            />
          ))}
        </div>
        <div>
          <h1 className="font-display text-[19px] font-semibold leading-tight tracking-[-0.02em] text-ink">
            Six Hats <span className="font-normal text-ink-48">Strategy Meeting</span>
          </h1>
          <p className="hidden text-[13px] leading-tight text-ink-48 sm:block">
            Six expert personas analyze your startup idea in real time.
          </p>
        </div>
      </div>
      <ConnectionBadge online={online} />
    </header>
  )
}

function ConnectionBadge({ online }: { online: boolean | null }) {
  const label = online === null ? 'Connecting' : online ? 'Online' : 'Offline'
  const color = online === null ? 'bg-amber-500' : online ? 'bg-emerald-500' : 'bg-rose-500'
  return (
    <span className="flex items-center gap-2 rounded-full border border-hairline bg-canvas px-3 py-1.5 text-[13px] font-medium text-ink-80">
      <span className={`h-2 w-2 rounded-full ${color} ${online === null ? 'animate-pulse' : ''}`} />
      {label}
    </span>
  )
}
