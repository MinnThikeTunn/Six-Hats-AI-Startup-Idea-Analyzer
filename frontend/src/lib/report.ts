// Splits the final Blue Hat Markdown report into structured sections so the
// summary can be rendered as a polished business report.

export type VerdictKind = 'pursue' | 'pursue-with-changes' | 'investigate' | 'pass' | 'unknown'

export interface VerdictInfo {
  kind: VerdictKind
  label: string
}

export interface ParsedReport {
  verdict: string
  summary: string
  nextSteps: string
  /** Anything that didn't fall under a known heading. */
  extra: string
  verdictInfo: VerdictInfo
}

interface Section {
  title: string
  body: string
}

function splitSections(md: string): Section[] {
  const lines = md.split('\n')
  const sections: Section[] = []
  let current: Section | null = null

  for (const line of lines) {
    const heading = line.match(/^#{1,3}\s+(.*)$/)
    if (heading) {
      if (current) sections.push(current)
      current = { title: heading[1].trim(), body: '' }
    } else if (current) {
      current.body += line + '\n'
    } else {
      current = { title: '', body: line + '\n' }
    }
  }
  if (current) sections.push(current)
  return sections.map((s) => ({ ...s, body: s.body.trim() }))
}

function detectVerdict(text: string): VerdictInfo {
  const upper = text.toUpperCase()
  if (upper.includes('PURSUE WITH CHANGES'))
    return { kind: 'pursue-with-changes', label: 'Pursue With Changes' }
  if (upper.includes('INVESTIGATE FURTHER') || upper.includes('INVESTIGATE'))
    return { kind: 'investigate', label: 'Investigate Further' }
  if (/\bPASS\b/.test(upper)) return { kind: 'pass', label: 'Pass' }
  if (/\bPURSUE\b/.test(upper)) return { kind: 'pursue', label: 'Pursue' }
  return { kind: 'unknown', label: 'Verdict' }
}

export function parseReport(md: string): ParsedReport {
  const sections = splitSections(md)
  let verdict = ''
  let summary = ''
  let nextSteps = ''
  const extra: string[] = []

  for (const { title, body } of sections) {
    const t = title.toLowerCase()
    if (t.includes('verdict')) verdict = body
    else if (t.includes('summary') || t.includes('by hat')) summary = body
    else if (t.includes('next step') || t.includes('recommend')) nextSteps = body
    else if (body) extra.push(title ? `### ${title}\n\n${body}` : body)
  }

  return {
    verdict,
    summary,
    nextSteps,
    extra: extra.join('\n\n'),
    verdictInfo: detectVerdict(verdict || md),
  }
}
