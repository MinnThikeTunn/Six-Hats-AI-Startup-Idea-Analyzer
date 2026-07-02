import { useEffect, useRef, useState } from 'react'

/**
 * Progressively reveals `text`, creating a live "speaking" effect. As `text`
 * grows (e.g. streamed tokens), the reveal continues toward the new length.
 * When `enabled` is false the full text is shown immediately.
 *
 * Speed is proportional to the remaining characters so long passages don't
 * crawl, while short ones still feel typed.
 */
export function useTypewriter(text: string, enabled: boolean): { revealed: string; isTyping: boolean } {
  const [count, setCount] = useState(enabled ? 0 : text.length)
  const frame = useRef<number | null>(null)
  const last = useRef<number>(0)

  useEffect(() => {
    if (!enabled) {
      setCount(text.length)
      return
    }

    const tick = (now: number) => {
      const dt = last.current ? now - last.current : 16
      last.current = now
      setCount((prev) => {
        if (prev >= text.length) return prev
        const remaining = text.length - prev
        // ~ reveal proportional to backlog, clamped for smoothness.
        const perMs = Math.max(0.06, remaining / 600)
        const step = Math.max(1, Math.min(remaining, Math.ceil(perMs * dt)))
        return prev + step
      })
      frame.current = requestAnimationFrame(tick)
    }

    frame.current = requestAnimationFrame(tick)
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current)
      frame.current = null
      last.current = 0
    }
  }, [text, enabled])

  const clamped = Math.min(count, text.length)
  return { revealed: text.slice(0, clamped), isTyping: enabled && clamped < text.length }
}
