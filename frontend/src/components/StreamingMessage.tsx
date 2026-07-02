import { useTypewriter } from '../hooks/useTypewriter'
import type { MessageStatus } from '../hooks/useMeeting'
import { Markdown } from './Markdown'

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1 py-2" aria-label="thinking">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="typing-dot h-2 w-2 rounded-full bg-current opacity-50"
          style={{ animationDelay: `${i * 0.16}s` }}
        />
      ))}
    </span>
  )
}

interface Props {
  text: string
  status: MessageStatus
}

export function StreamingMessage({ text, status }: Props) {
  const animate = status !== 'final'
  const { revealed, isTyping } = useTypewriter(text, true)

  if (!text.trim()) {
    return <TypingDots />
  }

  const display = animate || isTyping ? revealed : text
  const showCaret = isTyping || status === 'streaming'

  return (
    <div className="relative">
      <Markdown>{display}</Markdown>
      {showCaret && (
        <span className="caret-blink ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 rounded bg-action align-middle" />
      )}
    </div>
  )
}
