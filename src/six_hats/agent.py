"""Assembles the Six Hats deep agent: Blue orchestrator + five hat subagents."""

from __future__ import annotations

import os
from functools import lru_cache

from dotenv import load_dotenv
# Load environment variables early and override any shell-defined variables
load_dotenv(override=True)

from deepagents import create_deep_agent
from langchain_core.rate_limiters import InMemoryRateLimiter
from langchain_google_genai import ChatGoogleGenerativeAI


from .middleware import fix_gemini_errors
from .prompts import (
    BLACK_HAT_PROMPT,
    BLUE_HAT_PROMPT,
    GREEN_HAT_PROMPT,
    RED_HAT_PROMPT,
    WHITE_HAT_PROMPT,
    YELLOW_HAT_PROMPT,
)
from .tools import internet_search

DEFAULT_MODEL = os.environ.get("SIX_HATS_MODEL", "google_genai:gemini-3.1-flash-lite")
# A cheaper/faster model can be used for the lightweight hats (Red, Yellow).
FAST_MODEL = os.environ.get("SIX_HATS_FAST_MODEL", DEFAULT_MODEL)

# Gemini's free tier allows only ~5 requests/min/model. A 6-agent run blows past
# that, so all model instances SHARE one rate limiter to self-throttle, plus
# retry-with-backoff. Raise via SIX_HATS_RPM if you have a paid quota.
_RPM = float(os.environ.get("SIX_HATS_RPM", "10"))
_rate_limiter = InMemoryRateLimiter(
    requests_per_second=_RPM / 60.0,
    check_every_n_seconds=0.5,
    max_bucket_size=max(1, int(_RPM)),
)


def _model(spec: str) -> ChatGoogleGenerativeAI:
    """Build a Gemini chat model that shares the global rate limiter."""
    name = spec.split(":", 1)[1] if spec.startswith("google_genai:") else spec
    return ChatGoogleGenerativeAI(model=name, rate_limiter=_rate_limiter, max_retries=6)


def _build_subagents() -> list[dict]:
    return [
        {
            "name": "white-hat",
            "description": (
                "Gathers neutral FACTS about the idea's market, competitors, and "
                "trends using web search. Delegate to this FIRST."
            ),
            "system_prompt": WHITE_HAT_PROMPT,
            "tools": [internet_search],
            "model": _model(DEFAULT_MODEL),
            "middleware": [fix_gemini_errors],
        },
        {
            "name": "yellow-hat",
            "description": "Argues the genuine UPSIDE, benefits, and best-case for the idea.",
            "system_prompt": YELLOW_HAT_PROMPT,
            "model": _model(FAST_MODEL),
            "middleware": [fix_gemini_errors],
        },
        {
            "name": "black-hat",
            "description": "Surfaces RISKS, weaknesses, and failure modes of the idea.",
            "system_prompt": BLACK_HAT_PROMPT,
            "model": _model(DEFAULT_MODEL),
            "middleware": [fix_gemini_errors],
        },
        {
            "name": "green-hat",
            "description": "Generates creative ALTERNATIVES, pivots, and cheap validation ideas.",
            "system_prompt": GREEN_HAT_PROMPT,
            "model": _model(DEFAULT_MODEL),
            "middleware": [fix_gemini_errors],
        },
        {
            "name": "red-hat",
            "description": "Gives a fast GUT-FEELING / intuition reaction with conviction scores.",
            "system_prompt": RED_HAT_PROMPT,
            "model": _model(FAST_MODEL),
            "middleware": [fix_gemini_errors],
        },
    ]


@lru_cache(maxsize=1)
def build_agent():
    """Build (and cache) the Blue orchestrator deep agent."""
    return create_deep_agent(
        model=_model(DEFAULT_MODEL),
        system_prompt=BLUE_HAT_PROMPT,
        subagents=_build_subagents(),
        middleware=[fix_gemini_errors],
    )


def _content_to_text(content) -> str:
    """Flatten a message's content to plain text.

    Gemini 3.x returns content as a list of blocks (e.g. [{'type': 'text', ...}])
    rather than a plain string, so join the text parts into one report string.
    """
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts = []
        for block in content:
            if isinstance(block, dict):
                if block.get("type") == "text" and block.get("text"):
                    parts.append(block["text"])
            elif isinstance(block, str):
                parts.append(block)
        return "\n".join(parts)
    return str(content)


def analyze_idea(idea: str) -> str:
    """Run a full Six Hats analysis on a startup idea and return the final report."""
    agent = build_agent()
    result = agent.invoke(
        {"messages": [{"role": "user", "content": f"Analyze this startup idea:\n\n{idea}"}]}
    )
    return _content_to_text(result["messages"][-1].content)
