#uvicorn six_hats.api:app --reload --app-dir src Six Hats API Reference

HTTP API for the **Six Hats** startup-idea analyzer. POST a startup idea and a
six-agent pipeline (Blue orchestrator + White / Yellow / Black / Green / Red hats,
powered by Google Gemini) returns a balanced Markdown report with a verdict and
next steps.

- **Base URL (local):** `http://127.0.0.1:8000`
- **Content type:** `application/json` (request and non-streaming response)
- **Auth:** none (intended to run behind your own gateway / frontend)

> **Interactive docs:** FastAPI auto-generates live, try-it-out docs:
> - Swagger UI → `http://127.0.0.1:8000/docs`
> - ReDoc → `http://127.0.0.1:8000/redoc`
> - OpenAPI schema (JSON) → `http://127.0.0.1:8000/openapi.json`

---

## Endpoints

| Method | Path | Description | Response |
|--------|------|-------------|----------|
| `GET`  | `/health` | Liveness check | `application/json` |
| `POST` | `/analyze` | Run a full analysis and block until done | `application/json` |
| `POST` | `/analyze/stream` | Run an analysis, streaming live per-hat progress | `text/event-stream` (SSE) |

---

## `GET /health`

Liveness probe. Does not call the model.

**Response `200 OK`**

```json
{ "status": "ok" }
```

**Example**

```bash
curl http://127.0.0.1:8000/health
```

---

## `POST /analyze`

Runs the complete Six Hats analysis and returns the final report. This call
**blocks** until the whole pipeline finishes (typically ~1–2 minutes, since it
fans out to six agents and the White Hat performs live web searches).

### Request body

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `idea` | string | yes | min length 10 | The startup idea / decision to analyze. |

```json
{
  "idea": "A subscription app that delivers fresh, locally-sourced dog meals tailored to each dog's breed and age."
}
```

### Response `200 OK`

| Field | Type | Description |
|-------|------|-------------|
| `idea` | string | Echo of the submitted idea. |
| `report` | string | Markdown report: `## Verdict`, per-hat summary, and recommended next steps. |

```json
{
  "idea": "A subscription app that delivers fresh, locally-sourced dog meals...",
  "report": "## Verdict\n**INVESTIGATE FURTHER.** ...\n\n## Summary by Hat\n- **Facts (White):** ...\n\n## Recommended Next Steps\n1. ..."
}
```

### Errors

| Status | When | Body |
|--------|------|------|
| `422 Unprocessable Entity` | `idea` missing or shorter than 10 chars | FastAPI validation error |
| `500 Internal Server Error` | Model/tool failure (e.g. Gemini quota exhausted, network) | `{ "detail": "<error message>" }` |

A common `500` cause is hitting the Gemini free-tier limit. Per-minute limits
(15 RPM / 250K TPM for Gemini 3.1 Flash-Lite) are self-throttled by the server,
but a per-**day** quota can still surface as `RESOURCE_EXHAUSTED` in `detail`.

### Examples

**curl (bash / Git Bash)**

```bash
curl -X POST http://127.0.0.1:8000/analyze \
  -H "Content-Type: application/json" \
  -d '{"idea": "A subscription app delivering locally-sourced dog meals by breed and age."}'
```

**PowerShell** (avoids `curl` quoting issues on Windows)

```powershell
Invoke-RestMethod -Uri http://127.0.0.1:8000/analyze -Method Post `
  -ContentType "application/json" `
  -Body '{"idea": "A subscription app delivering locally-sourced dog meals by breed and age."}'
```

**Python (`requests`)**

```python
import requests

resp = requests.post(
    "http://127.0.0.1:8000/analyze",
    json={"idea": "A subscription app delivering locally-sourced dog meals by breed and age."},
    timeout=300,
)
resp.raise_for_status()
print(resp.json()["report"])
```

**JavaScript (`fetch`)**

```js
const res = await fetch("http://127.0.0.1:8000/analyze", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ idea: "A subscription app delivering locally-sourced dog meals by breed and age." }),
});
const { idea, report } = await res.json();
console.log(report);
```

---

## `POST /analyze/stream`

Same input as `/analyze`, but streams **Server-Sent Events (SSE)** so a frontend
can show each hat working in real time instead of waiting for the full run.

- **Response content type:** `text/event-stream`
- **Request body:** identical to `/analyze` (`{ "idea": string }`)

### SSE event types

Each event is emitted in standard SSE framing:

```
event: <type>
data: <json>

```

| Event | Data shape | Meaning |
|-------|------------|---------|
| `hat` | `{ "hat": string, "status": string }` | A hat subagent started or updated. |
| `hat_output` | `{ "hat": string, "output": string }` | A hat finished with its result. |
| `coordinator` | `{ "text": string }` | A Blue Hat (orchestrator) message. |
| `done` | `{ "report": string }` | Final synthesized Markdown report. |
| `error` | `{ "detail": string }` | Something failed mid-stream. |

> The `done` event carries the same Markdown report you'd get from `/analyze`.
> Errors are streamed as an `error` event rather than terminating the HTTP
> connection abruptly.

### Example (JavaScript, raw stream reader)

```js
const res = await fetch("http://127.0.0.1:8000/analyze/stream", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ idea }),
});

const reader = res.body.getReader();
const decoder = new TextDecoder();
let buffer = "";

while (true) {
  const { value, done } = await reader.read();
  if (done) break;
  buffer += decoder.decode(value, { stream: true });

  // SSE events are separated by a blank line.
  const events = buffer.split("\n\n");
  buffer = events.pop(); // keep the trailing partial event
  for (const chunk of events) {
    const eventLine = chunk.match(/^event: (.*)$/m)?.[1];
    const dataLine = chunk.match(/^data: (.*)$/m)?.[1];
    if (!dataLine) continue;
    const data = JSON.parse(dataLine);
    switch (eventLine) {
      case "hat":         console.log("hat:", data.hat, data.status); break;
      case "hat_output":  console.log("output from", data.hat); break;
      case "coordinator": console.log("blue:", data.text); break;
      case "done":        console.log("FINAL REPORT:\n", data.report); break;
      case "error":       console.error("error:", data.detail); break;
    }
  }
}
```

> Note: the browser's native `EventSource` only supports `GET`, so for this
> `POST` SSE endpoint use `fetch` + a stream reader as shown above.

---

## Data models

### `AnalyzeRequest`

```json
{ "idea": "string (min length 10)" }
```

### `AnalyzeResponse`

```json
{ "idea": "string", "report": "string (Markdown)" }
```

---

## Configuration (server-side)

These environment variables (read from `.env`) affect API behavior:

| Variable | Default | Purpose |
|----------|---------|---------|
| `GOOGLE_API_KEY` | — (required) | Gemini API key. |
| `TAVILY_API_KEY` | — (required for White Hat search) | Tavily web-search key. |
| `SIX_HATS_MODEL` | `google_genai:gemini-3.1-flash-lite` | Main model for all hats. |
| `SIX_HATS_FAST_MODEL` | = `SIX_HATS_MODEL` | Model for lightweight hats (Red/Yellow). |
| `SIX_HATS_RPM` | `10` | Requests/min cap, shared across all hats (keeps under Gemini limits). |
| `SIX_HATS_CORS_ORIGINS` | `*` | Comma-separated allowed origins. Lock down in production. |

---

## Running the server

```bash
# bash / Git Bash (use forward slashes)
.venv/Scripts/python.exe -m uvicorn six_hats.api:app --reload --app-dir src
```

```powershell
# PowerShell
.\.venv\Scripts\python.exe -m uvicorn six_hats.api:app --reload --app-dir src
```

The server listens on `http://127.0.0.1:8000` by default.
