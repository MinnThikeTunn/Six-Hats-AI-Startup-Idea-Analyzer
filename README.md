# Six Hats — AI Startup-Idea Analyzer

A multi-agent **FastAPI backend** that evaluates **startup ideas** through Edward de Bono's
**Six Thinking Hats**, built on [LangChain DeepAgents](https://docs.langchain.com/oss/python/deepagents/overview)
with **Google Gemini**. Designed to expose a clean API for any frontend.

## Concept

You POST a startup idea. Six specialized agents analyze it from six distinct
angles, then a final synthesis returns a balanced recommendation and next steps.

| Hat | Role | Tooling |
|-----|------|---------|
| 🔵 Blue | Orchestrator — plans, delegates, synthesizes | DeepAgent main loop |
| ⚪ White | Facts — market size, competitors, trends | **Web search (Tavily)** |
| 🟡 Yellow | Benefits & upside | Reasoning |
| ⚫ Black | Risks & failure modes | Reasoning |
| 🟢 Green | Creative alternatives / pivots | Reasoning |
| 🔴 Red | Gut feeling / intuition | Reasoning |

## Architecture

```text
HTTP POST /analyze {idea}
   │
┌──▼── Blue (orchestrator) ──┐  plan → delegate via task() → synthesize
│                            │
├─ White (web search: facts) │  ← delegated first; others build on its facts
├─ Yellow (benefits)         │
├─ Black (risks)             │
├─ Green (alternatives)      │
└─ Red (gut feeling)         │
   │
   └──► Blue → Markdown report (verdict + next steps)
```

## Tech stack

- **DeepAgents** (`deepagents`) — orchestration, subagents, planning
- **Gemini** via `langchain-google-genai` (model: `google_genai:gemini-3.1-flash-lite`)
- **Tavily** (`tavily-python`) — web search for the White Hat
- **FastAPI** + **Uvicorn** — HTTP API

## Project layout

```text
src/six_hats/
  prompts.py   # Blue orchestrator + 5 hat system prompts
  tools.py     # internet_search (Tavily) — White Hat's tool
  agent.py     # build_agent(): create_deep_agent + 5 hat subagents
  api.py       # FastAPI app: POST /analyze, GET /health
```

## Setup

```bash
python -m venv .venv
# Windows PowerShell:
.venv\Scripts\Activate.ps1
pip install -r requirements.txt

copy .env.example .env   # then fill in GOOGLE_API_KEY and TAVILY_API_KEY
```

## Run

```bash
uvicorn six_hats.api:app --reload --app-dir src
```

- Docs (Swagger UI): http://localhost:8000/docs
- Health check: `GET http://localhost:8000/health`

### Example request

```bash
curl -X POST http://localhost:8000/analyze \
  -H "Content-Type: application/json" \
  -d "{\"idea\": \"A subscription app that delivers fresh dog meals based on vet data\"}"
```

Response:

```json
{ "idea": "...", "report": "## Verdict\nPURSUE WITH CHANGES\n..." }
```

## API for frontends

> **Full API reference:** see [`API.md`](API.md) for detailed endpoint specs,
> request/response schemas, error codes, and client examples (curl, PowerShell,
> Python, JavaScript). Live interactive docs are at `/docs` (Swagger) and `/redoc`.

| Method | Path | Body | Returns |
|--------|------|------|---------|
| `GET`  | `/health` | — | `{ "status": "ok" }` |
| `POST` | `/analyze` | `{ "idea": string }` | `{ "idea": string, "report": markdown }` (blocks until done) |
| `POST` | `/analyze/stream` | `{ "idea": string }` | **Server-Sent Events** stream of live per-hat progress |

CORS is open by default for development. Set `SIX_HATS_CORS_ORIGINS`
(comma-separated) to lock it to your frontend domains in production.

### Streaming (`/analyze/stream`)

Emits Server-Sent Events so the frontend can show each hat working in real time
(a full run takes ~20-40s). Event types:

| Event | Data | Meaning |
|-------|------|---------|
| `hat` | `{ hat, status }` | a hat subagent started / updated |
| `hat_output` | `{ hat, output }` | a hat finished with its result |
| `coordinator` | `{ text }` | Blue Hat (orchestrator) message |
| `done` | `{ report }` | final synthesized Markdown report |
| `error` | `{ detail }` | something failed mid-stream |

Frontend example:

```js
const res = await fetch("/analyze/stream", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ idea }),
});
const reader = res.body.getReader();
const decoder = new TextDecoder();
while (true) {
  const { value, done } = await reader.read();
  if (done) break;
  console.log(decoder.decode(value)); // parse SSE: "event: <type>\ndata: <json>\n\n"
}
```

## Status

🚧 Backend scaffolded and runnable. Next: streaming responses (per-hat updates),
auth, and persistence of past analyses.
