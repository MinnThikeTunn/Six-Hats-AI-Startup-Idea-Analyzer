import { useState } from 'react'

const MIN_LEN = 10

const EXAMPLES = [
  {
    label: 'Fresh dog-meal subscription',
    value:
      'A subscription app delivering fresh, locally-sourced dog meals tailored to each dog’s breed and age.',
  },
  {
    label: 'P2P camera-gear rental',
    value:
      'A peer-to-peer marketplace for renting high-end camera gear between creators in the same city.',
  },
  {
    label: 'AI course from YouTube',
    value: 'An AI tutor that turns any YouTube playlist into a structured, quiz-based course.',
  },
]

interface Props {
  onSubmit: (idea: string) => void
  busy: boolean
  onReset: () => void
  hasRun: boolean
}

export function IdeaComposer({ onSubmit, busy, onReset, hasRun }: Props) {
  const [value, setValue] = useState('')
  const trimmed = value.trim()
  const valid = trimmed.length >= MIN_LEN

  const submit = () => {
    if (!valid || busy) return
    onSubmit(trimmed)
  }

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <div className="frosted border-t border-hairline px-4 py-3 md:px-6">
      <div className="relative mx-auto max-w-4xl">
        {!hasRun && !busy && (
          <div className="pointer-events-none absolute inset-x-0 bottom-full mb-3 flex flex-wrap items-center justify-center gap-2 px-2">
            {EXAMPLES.map((ex, i) => (
              <button
                key={ex.label}
                onClick={() => setValue(ex.value)}
                style={{ animationDelay: `${i * 70}ms` }}
                className="glass animate-fade-rise pointer-events-auto rounded-full px-4 py-2 text-[13px] font-medium text-ink-80 transition active:scale-95 hover:text-action"
                title={ex.value}
              >
                {ex.label}
              </button>
            ))}
          </div>
        )}
        <div className="flex items-end gap-2 rounded-[18px] border border-hairline bg-canvas p-2 transition focus-within:border-action">
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKey}
            disabled={busy}
            rows={1}
            placeholder="Pitch your startup idea to the table…"
            className="scrollbar-slim max-h-40 min-h-[44px] flex-1 resize-none bg-transparent px-3 py-2.5 text-[17px] leading-[1.47] text-ink placeholder:text-ink-48 focus:outline-none disabled:opacity-60"
          />
          {hasRun && !busy ? (
            <button
              onClick={onReset}
              className="h-11 shrink-0 rounded-full border border-hairline bg-pearl px-5 text-[15px] font-medium text-ink-80 transition active:scale-95 hover:border-ink-48"
            >
              New idea
            </button>
          ) : null}
          <button
            onClick={submit}
            disabled={!valid || busy}
            className="flex h-11 shrink-0 items-center gap-2 rounded-full bg-action px-6 text-[15px] font-medium text-white transition active:scale-95 disabled:cursor-not-allowed disabled:bg-action/40"
          >
            {busy ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Meeting…
              </>
            ) : (
              <>Analyze</>
            )}
          </button>
        </div>
        <div className="mt-2 px-1 text-[13px] text-ink-48">
          {value.length > 0 && !valid ? (
            <span className="text-amber-600">Add a little more detail ({MIN_LEN}+ characters).</span>
          ) : (
            <span>Press Enter to send · Shift+Enter for a new line</span>
          )}
        </div>
      </div>
    </div>
  )
}
