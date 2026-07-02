import { useMemo, useState } from 'react'
import { parseReport } from '../lib/report'
import { Markdown } from './Markdown'
import { VerdictCard } from './VerdictCard'

interface Props {
  report: string
  idea: string
}

function SectionCard({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-[18px] border border-hairline bg-canvas p-6">
      <div className="mb-1 text-[12px] font-semibold uppercase tracking-[0.18em] text-ink-48">{eyebrow}</div>
      <h3 className="mb-3 font-display text-[21px] font-semibold tracking-[-0.01em] text-ink">{title}</h3>
      {children}
    </section>
  )
}

export function SummaryPanel({ report, idea }: Props) {
  const parsed = useMemo(() => parseReport(report), [report])
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(report)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      /* ignore clipboard failures */
    }
  }

  return (
    <div className="animate-fade-rise space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-hairline pb-5">
        <div>
          <div className="text-[12px] font-semibold uppercase tracking-[0.2em] text-action">
            Strategy Report
          </div>
          <h2 className="mt-1 font-display text-[34px] font-semibold leading-tight tracking-[-0.02em] text-ink">
            Six Hats Recommendation
          </h2>
          <p className="mt-1.5 max-w-2xl text-[15px] italic text-ink-48">“{idea}”</p>
        </div>
        <button
          onClick={copy}
          className="rounded-full border border-hairline bg-canvas px-5 py-2 text-[15px] font-medium text-action transition active:scale-95 hover:border-action"
        >
          {copied ? 'Copied ✓' : 'Copy report'}
        </button>
      </header>

      {parsed.verdict && <VerdictCard info={parsed.verdictInfo} body={parsed.verdict} />}

      <div className="grid gap-5 lg:grid-cols-2">
        {parsed.summary && (
          <SectionCard eyebrow="Six Thinking Hats" title="Summary by Hat">
            <Markdown>{parsed.summary}</Markdown>
          </SectionCard>
        )}
        {parsed.nextSteps && (
          <SectionCard eyebrow="Action Plan" title="Recommended Next Steps">
            <Markdown>{parsed.nextSteps}</Markdown>
          </SectionCard>
        )}
      </div>

      {parsed.extra && (
        <SectionCard eyebrow="Additional Notes" title="Further Detail">
          <Markdown>{parsed.extra}</Markdown>
        </SectionCard>
      )}

      {!parsed.verdict && !parsed.summary && !parsed.nextSteps && (
        <SectionCard eyebrow="Strategy Report" title="Full Report">
          <Markdown>{report}</Markdown>
        </SectionCard>
      )}
    </div>
  )
}
