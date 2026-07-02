// Persona metadata for the six thinking hats + the user (idea proposer).
// `apiName` matches the subagent names emitted by the backend SSE stream.

export type HatKey = 'white' | 'red' | 'black' | 'yellow' | 'green' | 'blue'
export type SpeakerKey = HatKey | 'user'

export interface HatPersona {
  key: HatKey
  apiName: string
  name: string
  role: string
  blurb: string
  /** CSS color used for accents, rings, and the avatar. */
  accent: string
  /** Text color that reads well on top of `accent`. */
  onAccent: string
  /** Soft translucent tint for bubble backgrounds. */
  tint: string
}

export const HATS: Record<HatKey, HatPersona> = {
  white: {
    key: 'white',
    apiName: 'white-hat',
    name: 'White Hat',
    role: 'Facts & Research',
    blurb: 'Neutral data — market size, competitors, and verifiable trends.',
    accent: '#8a90a0',
    onAccent: '#ffffff',
    tint: 'rgba(138, 144, 160, 0.10)',
  },
  red: {
    key: 'red',
    apiName: 'red-hat',
    name: 'Red Hat',
    role: 'Gut & Intuition',
    blurb: 'Raw instinct and emotional reaction — no justification needed.',
    accent: '#e0244a',
    onAccent: '#ffffff',
    tint: 'rgba(224, 36, 74, 0.08)',
  },
  black: {
    key: 'black',
    apiName: 'black-hat',
    name: 'Black Hat',
    role: 'Risks & Caution',
    blurb: 'Critical judgment — weaknesses, threats, and failure modes.',
    accent: '#3a3f4c',
    onAccent: '#ffffff',
    tint: 'rgba(58, 63, 76, 0.08)',
  },
  yellow: {
    key: 'yellow',
    apiName: 'yellow-hat',
    name: 'Yellow Hat',
    role: 'Benefits & Upside',
    blurb: 'Optimism with reason — value, advantages, and best-case outcomes.',
    accent: '#d9941a',
    onAccent: '#ffffff',
    tint: 'rgba(217, 148, 26, 0.10)',
  },
  green: {
    key: 'green',
    apiName: 'green-hat',
    name: 'Green Hat',
    role: 'Creativity & Pivots',
    blurb: 'New angles — alternatives, pivots, and cheap ways to validate.',
    accent: '#1a9c63',
    onAccent: '#ffffff',
    tint: 'rgba(26, 156, 99, 0.09)',
  },
  blue: {
    key: 'blue',
    apiName: 'blue-hat',
    name: 'Blue Hat',
    role: 'Facilitator & Verdict',
    blurb: 'Chairs the meeting, directs each hat, and synthesizes the verdict.',
    accent: '#0066cc',
    onAccent: '#ffffff',
    tint: 'rgba(0, 102, 204, 0.08)',
  },
}

// Seating order around the table.
export const HAT_ORDER: HatKey[] = ['white', 'red', 'yellow', 'green', 'black', 'blue']

const API_NAME_TO_KEY: Record<string, HatKey> = Object.values(HATS).reduce(
  (acc, h) => {
    acc[h.apiName] = h.key
    return acc
  },
  {} as Record<string, HatKey>,
)

/** Map a backend hat name (e.g. "white-hat", "white_hat", "White") to a HatKey. */
export function normalizeHat(raw: string | undefined | null): HatKey | null {
  if (!raw) return null
  const slug = raw.trim().toLowerCase().replace(/[\s_]+/g, '-')
  if (API_NAME_TO_KEY[slug]) return API_NAME_TO_KEY[slug]
  const base = slug.replace(/-hat$/, '')
  if (base in HATS) return base as HatKey
  return null
}
