// Client for the Six Hats backend. The browser's native EventSource only
// supports GET, so the POST SSE endpoint is consumed with fetch + a stream
// reader and parsed manually.

import { sanitizeStreamText } from './sanitize'

const API_BASE = import.meta.env.VITE_API_BASE ?? ''

export type StreamEvent =
  | { type: 'hat'; hat: string; status: string }
  | { type: 'hat_output'; hat: string; output: string }
  | { type: 'coordinator'; text: string }
  | { type: 'done'; report: string }
  | { type: 'error'; detail: string }

export interface StreamHandlers {
  onEvent: (event: StreamEvent) => void
  signal?: AbortSignal
}

function parseEventBlock(block: string): StreamEvent | null {
  let eventName = 'message'
  const dataLines: string[] = []
  for (const line of block.split('\n')) {
    if (line.startsWith('event:')) eventName = line.slice(6).trim()
    else if (line.startsWith('data:')) dataLines.push(line.slice(5).trimStart())
  }
  if (dataLines.length === 0) return null

  let data: Record<string, unknown>
  try {
    data = JSON.parse(dataLines.join('\n'))
  } catch {
    return null
  }

  switch (eventName) {
    case 'hat':
      return { type: 'hat', hat: String(data.hat ?? ''), status: String(data.status ?? '') }
    case 'hat_output':
      return {
        type: 'hat_output',
        hat: String(data.hat ?? ''),
        output: sanitizeStreamText(String(data.output ?? '')),
      }
    case 'coordinator':
      return { type: 'coordinator', text: sanitizeStreamText(String(data.text ?? '')) }
    case 'done':
      return { type: 'done', report: String(data.report ?? '') }
    case 'error':
      return { type: 'error', detail: String(data.detail ?? 'Unknown error') }
    default:
      return null
  }
}

/**
 * Open the streaming analysis and invoke `onEvent` for every SSE event as it
 * arrives. Resolves when the stream closes; rejects on network/HTTP errors or
 * when aborted via `signal`.
 */
export async function streamAnalyze(idea: string, { onEvent, signal }: StreamHandlers): Promise<void> {
  const res = await fetch(`${API_BASE}/analyze/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
    body: JSON.stringify({ idea }),
    signal,
  })

  if (!res.ok || !res.body) {
    let detail = `Request failed (${res.status})`
    try {
      const body = await res.json()
      if (body?.detail) {
        detail = Array.isArray(body.detail)
          ? body.detail.map((d: { msg?: string }) => d.msg ?? JSON.stringify(d)).join('; ')
          : String(body.detail)
      }
    } catch {
      /* keep the generic message */
    }
    throw new Error(detail)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    // SSE events are separated by a blank line; keep the trailing partial.
    const blocks = buffer.split(/\r?\n\r?\n/)
    buffer = blocks.pop() ?? ''
    for (const block of blocks) {
      if (!block.trim()) continue
      const event = parseEventBlock(block)
      if (event) onEvent(event)
    }
  }

  // Flush any final buffered event.
  if (buffer.trim()) {
    const event = parseEventBlock(buffer)
    if (event) onEvent(event)
  }
}

export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`)
    return res.ok
  } catch {
    return false
  }
}
