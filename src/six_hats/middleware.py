"""Mitigation for Gemini's `MALFORMED_FUNCTION_CALL` finish reason.

Gemini (2.5/3.x flash) sometimes emits an invalid tool call (Python-style syntax
or unescaped strings) when tool schemas are complex (e.g. DeepAgents' `write_todos`
and `task`). The API returns finish_reason=MALFORMED_FUNCTION_CALL with empty
content and zero tool calls, so the agent silently stops.

This middleware detects that and retries the model call with an injected nudge to
emit valid, JSON-escaped tool arguments. See:
https://github.com/langchain-ai/langgraph/issues/6574
"""

from __future__ import annotations

import time

from langchain.agents.middleware import wrap_model_call
from langchain_core.messages import AIMessage, HumanMessage

_MALFORMED = "MALFORMED_FUNCTION_CALL"

_NUDGE = (
    "Your previous response was rejected as a MALFORMED_FUNCTION_CALL. "
    "Call exactly one tool now and emit ONLY valid JSON for its arguments. "
    "Ensure every string value is properly JSON-escaped (escape quotes and "
    "newlines). Do NOT use Python syntax, code fences, or a `default_api` prefix."
)

# Transient server-side conditions worth retrying (Gemini capacity blips).
_TRANSIENT_MARKERS = ("503", "unavailable", "high demand", "overloaded", "internal error", "500")

_MAX_RETRIES = 4
_BACKOFF_BASE_SECONDS = 2.0


def _finish_reason(response) -> str | None:
    result = getattr(response, "result", None)
    if not result:
        return None
    msg = result[0]
    if not isinstance(msg, AIMessage):
        return None
    return (msg.response_metadata or {}).get("finish_reason")


def _is_transient(exc: Exception) -> bool:
    text = str(exc).lower()
    return any(marker in text for marker in _TRANSIENT_MARKERS)


@wrap_model_call
def fix_gemini_errors(request, handler):
    """Make Gemini calls resilient to malformed tool calls and transient 503s.

    - Retries (with a JSON-escape nudge) on MALFORMED_FUNCTION_CALL.
    - Retries (with exponential backoff) on transient server errors (503/UNAVAILABLE).
    Applied to BOTH the Blue orchestrator and every hat subagent.
    """
    attempts = 0
    while True:
        try:
            response = handler(request)
        except Exception as exc:
            if _is_transient(exc) and attempts < _MAX_RETRIES:
                time.sleep(_BACKOFF_BASE_SECONDS * (2**attempts))
                attempts += 1
                continue
            raise

        if _finish_reason(response) == _MALFORMED and attempts < _MAX_RETRIES:
            attempts += 1
            request = request.override(messages=[*request.messages, HumanMessage(content=_NUDGE)])
            continue
        return response


# Backwards-compatible alias.
fix_malformed_gemini = fix_gemini_errors
