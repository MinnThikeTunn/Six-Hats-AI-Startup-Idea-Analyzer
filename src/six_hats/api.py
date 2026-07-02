"""FastAPI backend exposing the Six Hats startup-idea analyzer.

Run locally:
    uvicorn six_hats.api:app --reload --app-dir src
Then POST to /analyze, e.g.:
    curl -X POST localhost:8000/analyze -H "Content-Type: application/json" \
         -d '{"idea": "An app that ..."}'
"""

from __future__ import annotations

import json
import os

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.concurrency import run_in_threadpool
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from .agent import _content_to_text, analyze_idea, build_agent

load_dotenv()

app = FastAPI(
    title="Six Hats API",
    description="Evaluate startup ideas with the Six Thinking Hats (DeepAgents + Gemini).",
    version="0.1.0",
)

# Open CORS for now so any frontend can call it during development.
# Tighten `allow_origins` to your real domains before production.
_origins = os.environ.get("SIX_HATS_CORS_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in _origins],
    allow_methods=["*"],
    allow_headers=["*"],
)


class AnalyzeRequest(BaseModel):
    idea: str = Field(..., min_length=10, description="The startup idea to analyze.")


class AnalyzeResponse(BaseModel):
    idea: str
    report: str = Field(..., description="Markdown report ending with verdict + next steps.")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze(req: AnalyzeRequest) -> AnalyzeResponse:
    try:
        report = await run_in_threadpool(analyze_idea, req.idea)
    except Exception as exc:  # surface a clean error to the frontend
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    return AnalyzeResponse(idea=req.idea, report=report)


def _sse(event: str, data: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"


def _messages_of(obj):
    """Pull the message list out of a subagent result (dict or state object)."""
    if isinstance(obj, dict):
        return obj.get("messages")
    return getattr(obj, "messages", None)


def _subagent_text(output) -> str:
    """Extract a hat's readable answer from its subagent result.

    DeepAgents hands back the subagent's full state (e.g.
    ``{"messages": [HumanMessage(...), AIMessage(...)], "files": {}}``), so the
    hat's actual reply is the content of the last message that has any. We never
    fall back to ``str(output)`` because that would leak the raw Python repr.
    """
    msgs = _messages_of(output)
    if msgs:
        for msg in reversed(msgs):
            content = getattr(msg, "content", None)
            if content:
                text = _content_to_text(content)
                if text.strip():
                    return text
    if isinstance(output, str):
        return output
    return ""


def _final_report_from_state(stream) -> str:
    """Read the orchestrator's final report from the run's final state.

    ``stream.output`` drives the (already exhausted) run to completion and
    returns the latest root-level state, whose last message is the Blue Hat's
    synthesized report — mirroring the non-streaming endpoint.
    """
    try:
        state = stream.output
    except Exception:
        state = getattr(stream, "_latest", None)
    if isinstance(state, dict):
        msgs = state.get("messages")
        if msgs:
            return _content_to_text(getattr(msgs[-1], "content", "")).strip()
    return ""


def _message_text(item) -> str:
    """Flatten an orchestrator message, even when Gemini returns content blocks."""
    text = getattr(item, "text", "") or ""
    if text.strip():
        return text
    content = getattr(item, "content", None)
    if content is not None:
        return _content_to_text(content)
    return ""


def _stream_analysis(idea: str):
    """Yield Server-Sent Events as each hat starts/finishes, then the final report.

    Events:
      - `hat`        : a hat subagent started/updated  -> {hat, status}
      - `hat_output` : a hat finished with its output  -> {hat, output}
      - `coordinator`: Blue Hat (orchestrator) message  -> {text}
      - `done`       : final synthesized report          -> {report}
      - `error`      : something failed                  -> {detail}
    """
    try:
        agent = build_agent()
        stream = agent.stream_events(
            {"messages": [{"role": "user", "content": f"Analyze this startup idea:\n\n{idea}"}]},
            version="v3",
        )
        final_report = ""
        for name, item in stream.interleave("messages", "subagents"):
            if name == "subagents":
                hat = getattr(item, "name", "unknown")
                yield _sse("hat", {"hat": hat, "status": str(getattr(item, "status", ""))})
                output = getattr(item, "output", None)
                if output:
                    hat_text = _subagent_text(output)
                    if hat_text.strip():
                        yield _sse("hat_output", {"hat": hat, "output": hat_text})
            else:
                text = _message_text(item)
                if text.strip():
                    final_report = text
                    yield _sse("coordinator", {"text": text})

        # The Blue orchestrator's final synthesis does not always surface on the
        # streamed "messages" channel, so pull it from the run's final state
        # (the same place the non-streaming endpoint reads its report from).
        if not final_report:
            final_report = _final_report_from_state(stream)
            if final_report:
                yield _sse("coordinator", {"text": final_report})

        yield _sse("done", {"report": final_report})
    except Exception as exc:  # stream the error instead of dropping the connection
        yield _sse("error", {"detail": str(exc)})


@app.post("/analyze/stream")
def analyze_stream(req: AnalyzeRequest) -> StreamingResponse:
    """Streaming variant of /analyze. Emits SSE so a frontend can show live per-hat progress."""
    return StreamingResponse(
        _stream_analysis(req.idea),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
