import { useCallback, useReducer, useRef } from 'react'
import { streamAnalyze, type StreamEvent } from '../lib/api'
import { normalizeHat, type HatKey, type SpeakerKey } from '../lib/hats'

export type Phase = 'idle' | 'streaming' | 'done' | 'error'
export type MessageStatus = 'thinking' | 'streaming' | 'final'
export type HatStatus = 'idle' | 'thinking' | 'spoke'

export interface MeetingMessage {
  id: string
  speaker: SpeakerKey
  text: string
  status: MessageStatus
}

export interface MeetingState {
  phase: Phase
  idea: string
  messages: MeetingMessage[]
  hatStatus: Record<HatKey, HatStatus>
  activeSpeaker: SpeakerKey | null
  report: string
  error: string | null
}

const IDLE_HATS: Record<HatKey, HatStatus> = {
  white: 'idle',
  red: 'idle',
  black: 'idle',
  yellow: 'idle',
  green: 'idle',
  blue: 'idle',
}

const initialState: MeetingState = {
  phase: 'idle',
  idea: '',
  messages: [],
  hatStatus: { ...IDLE_HATS },
  activeSpeaker: null,
  report: '',
  error: null,
}

type Action =
  | { type: 'START'; idea: string; userId: string }
  | { type: 'EVENT'; event: StreamEvent; newId: string }
  | { type: 'STREAM_ERROR'; detail: string }
  | { type: 'RESET' }

let idCounter = 0
const nextId = () => `m${++idCounter}`

function reducer(state: MeetingState, action: Action): MeetingState {
  switch (action.type) {
    case 'START':
      return {
        ...initialState,
        phase: 'streaming',
        idea: action.idea,
        hatStatus: { ...IDLE_HATS },
        messages: [{ id: action.userId, speaker: 'user', text: action.idea, status: 'final' }],
      }

    case 'RESET':
      return { ...initialState, hatStatus: { ...IDLE_HATS } }

    case 'STREAM_ERROR':
      return { ...state, phase: 'error', error: action.detail, activeSpeaker: null }

    case 'EVENT':
      return applyEvent(state, action.event, action.newId)

    default:
      return state
  }
}

function applyEvent(state: MeetingState, event: StreamEvent, newId: string): MeetingState {
  switch (event.type) {
    case 'hat': {
      const key = normalizeHat(event.hat)
      if (!key) return state
      if (state.hatStatus[key] === 'spoke') {
        return { ...state, activeSpeaker: key }
      }
      const hasBubble = state.messages.some((m) => m.speaker === key)
      const messages = hasBubble
        ? state.messages
        : [...state.messages, { id: newId, speaker: key, text: '', status: 'thinking' as MessageStatus }]
      return {
        ...state,
        activeSpeaker: key,
        hatStatus: { ...state.hatStatus, [key]: 'thinking' },
        messages,
      }
    }

    case 'hat_output': {
      const key = normalizeHat(event.hat)
      if (!key) return state
      const text = event.output.trim()
      if (!text) return state
      const idx = state.messages.findIndex((m) => m.speaker === key && m.status !== 'final')
      let messages: MeetingMessage[]
      if (idx >= 0) {
        messages = state.messages.map((m, i) =>
          i === idx ? { ...m, text, status: 'final' as MessageStatus } : m,
        )
      } else {
        messages = [...state.messages, { id: newId, speaker: key, text, status: 'final' as MessageStatus }]
      }
      return {
        ...state,
        activeSpeaker: key,
        hatStatus: { ...state.hatStatus, [key]: 'spoke' },
        messages,
      }
    }

    case 'coordinator': {
      const text = event.text.trim()
      if (!text) return state
      // Keep a single evolving Blue bubble that grows into the final synthesis.
      const idx = state.messages.findIndex((m) => m.speaker === 'blue')
      let messages: MeetingMessage[]
      if (idx >= 0) {
        messages = state.messages.map((m, i) =>
          i === idx ? { ...m, text, status: 'streaming' as MessageStatus } : m,
        )
      } else {
        messages = [...state.messages, { id: newId, speaker: 'blue', text, status: 'streaming' as MessageStatus }]
      }
      return {
        ...state,
        activeSpeaker: 'blue',
        hatStatus: { ...state.hatStatus, blue: 'thinking' },
        messages,
      }
    }

    case 'done': {
      const report = event.report.trim()
      const messages = state.messages.map((m) =>
        m.speaker === 'blue' ? { ...m, text: report || m.text, status: 'final' as MessageStatus } : m,
      )
      return {
        ...state,
        phase: 'done',
        report: report || state.report,
        activeSpeaker: null,
        hatStatus: { ...state.hatStatus, blue: 'spoke' },
        messages,
      }
    }

    case 'error':
      return { ...state, phase: 'error', error: event.detail, activeSpeaker: null }

    default:
      return state
  }
}

export interface UseMeeting extends MeetingState {
  start: (idea: string) => void
  reset: () => void
  cancel: () => void
}

export function useMeeting(): UseMeeting {
  const [state, dispatch] = useReducer(reducer, initialState)
  const abortRef = useRef<AbortController | null>(null)

  const cancel = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
  }, [])

  const start = useCallback((idea: string) => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    dispatch({ type: 'START', idea, userId: nextId() })

    streamAnalyze(idea, {
      signal: controller.signal,
      onEvent: (event) => dispatch({ type: 'EVENT', event, newId: nextId() }),
    }).catch((err: unknown) => {
      if (controller.signal.aborted) return
      const detail = err instanceof Error ? err.message : 'The meeting was interrupted.'
      dispatch({ type: 'STREAM_ERROR', detail })
    })
  }, [])

  const reset = useCallback(() => {
    cancel()
    dispatch({ type: 'RESET' })
  }, [cancel])

  return { ...state, start, reset, cancel }
}
