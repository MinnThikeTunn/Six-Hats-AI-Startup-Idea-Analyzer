import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'

const components: Components = {
  h1: ({ children }) => (
    <h1 className="mt-5 mb-3 font-display text-[22px] font-semibold tracking-[-0.02em] text-ink first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="mt-5 mb-2.5 font-display text-[19px] font-semibold tracking-[-0.01em] text-ink first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-4 mb-2 text-[17px] font-semibold text-ink first:mt-0">{children}</h3>
  ),
  h4: ({ children }) => (
    <h4 className="mt-3 mb-1.5 text-[13px] font-semibold uppercase tracking-wide text-ink-48 first:mt-0">
      {children}
    </h4>
  ),
  p: ({ children }) => <p className="my-2.5 leading-[1.47] text-ink-80">{children}</p>,
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className="font-medium text-action underline decoration-action/30 underline-offset-2 hover:decoration-action break-words"
    >
      {children}
    </a>
  ),
  ul: ({ children }) => <ul className="my-2.5 space-y-1.5 pl-1">{children}</ul>,
  ol: ({ children }) => <ol className="my-2.5 list-decimal space-y-1.5 pl-5 marker:text-ink-48">{children}</ol>,
  li: ({ children }) => (
    <li className="relative pl-5 leading-[1.47] text-ink-80 [ol_&]:pl-1 marker:text-ink-48">
      <span className="absolute left-0 top-[0.7em] hidden h-1.5 w-1.5 rounded-full bg-current opacity-40 [ul_&]:inline-block" />
      {children}
    </li>
  ),
  strong: ({ children }) => <strong className="font-semibold text-ink">{children}</strong>,
  em: ({ children }) => <em className="italic text-ink-80">{children}</em>,
  blockquote: ({ children }) => (
    <blockquote className="my-3 border-l-2 border-action/40 bg-pearl py-1 pl-4 pr-3 italic text-ink-80">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-4 border-hairline" />,
  code: ({ className, children }) => {
    const isBlock = /language-/.test(className ?? '')
    if (isBlock) {
      return <code className={`${className ?? ''} font-mono text-[0.85em]`}>{children}</code>
    }
    return (
      <code className="rounded-md bg-pearl px-1.5 py-0.5 font-mono text-[0.85em] text-action">{children}</code>
    )
  },
  pre: ({ children }) => (
    <pre className="scrollbar-slim my-3 overflow-x-auto rounded-[11px] border border-hairline bg-parchment p-3.5 text-[14px] leading-6 text-ink">
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <div className="scrollbar-slim my-3 overflow-x-auto rounded-[11px] border border-hairline">
      <table className="w-full border-collapse text-[14px]">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-parchment">{children}</thead>,
  th: ({ children }) => (
    <th className="border-b border-hairline px-3 py-2 text-left font-semibold text-ink">{children}</th>
  ),
  td: ({ children }) => (
    <td className="border-b border-divider px-3 py-2 align-top text-ink-80">{children}</td>
  ),
}

export function Markdown({ children }: { children: string }) {
  return (
    <div className="text-[15px]">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  )
}
