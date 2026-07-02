# Six Hats — Frontend

A React + TypeScript + Tailwind UI for the **Six Hats** startup-idea analyzer.
It turns the backend's streaming analysis into a **live executive strategy
meeting**: you pitch an idea and six expert personas (White, Red, Black, Yellow,
Green, and the Blue Hat facilitator) debate it in real time around the table,
then hand you a polished verdict and next steps.

## Highlights

- **Live meeting** — each hat "speaks" as the SSE stream arrives, with a
  typewriter reveal, active-speaker highlighting, and auto-scroll.
- **Readable by design** — full Markdown support (headings, bullets, tables,
  code, links) with comfortable spacing and large type.
- **Business report** — when the meeting adjourns, a summary panel renders the
  Final Verdict, Summary by Hat, and Recommended Next Steps.
- **Robust** — loading overlay, error states, responsive layout, and a
  defensive sanitizer for malformed stream payloads.

## Prerequisites

The backend must be running (see the repo root `README.md` / `API.md`):

```bash
# from the repo root
uvicorn six_hats.api:app --reload --app-dir src   # serves http://127.0.0.1:8000
```

## Run the frontend

```bash
cd frontend
npm install
npm run dev          # http://localhost:5173
```

In development, requests to `/analyze`, `/analyze/stream`, and `/health` are
proxied to the backend (default `http://127.0.0.1:8000`).

## Configuration

| Variable | Default | Where | Purpose |
|----------|---------|-------|---------|
| `VITE_BACKEND_URL` | `http://127.0.0.1:8000` | dev (Vite proxy) | Backend the dev proxy forwards to. |
| `VITE_API_BASE` | `''` (same origin) | build/runtime | Base URL the app calls directly. Set for production if the API is on another origin. |

Copy `.env.example` to `.env` to override. Example for a non-default backend:

```bash
echo "VITE_BACKEND_URL=http://127.0.0.1:8011" > .env
```

## Scripts

- `npm run dev` — start the Vite dev server with API proxy.
- `npm run build` — typecheck (`tsc -b`) and build for production.
- `npm run preview` — preview the production build.
- `npm run lint` — run oxlint.

## Architecture

```
src/
  lib/
    api.ts        # fetch + SSE stream reader for /analyze/stream
    hats.ts       # persona metadata (names, roles, colors)
    report.ts     # parse final Markdown into Verdict / Summary / Next Steps
    sanitize.ts   # defensive cleanup of malformed stream payloads
  hooks/
    useMeeting.ts     # SSE events -> ordered conversation state
    useTypewriter.ts  # incremental "speaking" reveal
  components/
    MeetingRoom · ParticipantCard · SpeakerBubble · StreamingMessage
    Markdown · VerdictCard · SummaryPanel · LoadingOverlay
    IdeaComposer · HatAvatar
  App.tsx
```
