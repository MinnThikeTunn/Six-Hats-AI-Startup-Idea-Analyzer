// Defensive safety net: if the backend ever streams a raw LangChain state/
// message repr (e.g. "{'messages': [HumanMessage(...), AIMessage(content='...')]}"),
// pull out the last message's readable content instead of showing the repr.
// With a healthy backend this is a no-op passthrough.

const looksLikeRepr = (s: string) => {
  const t = s.trimStart()
  return t.startsWith("{'messages':") || t.startsWith('{"messages":')
}

function unescapePy(s: string): string {
  return s
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')
    .replace(/\\r/g, '')
    .replace(/\\'/g, "'")
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\')
}

export function sanitizeStreamText(raw: string): string {
  if (!raw || !looksLikeRepr(raw)) return raw
  const matches = [
    ...raw.matchAll(/content=(['"])([\s\S]*?)\1,\s*(?:additional_kwargs|response_metadata|name=)/g),
  ]
  if (matches.length > 0) {
    return unescapePy(matches[matches.length - 1][2]).trim()
  }
  return raw
}
