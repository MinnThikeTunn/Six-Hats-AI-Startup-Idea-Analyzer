"""Tools available to the hats. Only the White Hat (facts) gets web search."""

from __future__ import annotations

import os
from typing import Any, Literal


def internet_search(
    query: str,
    max_results: int = 5,
    topic: Literal["general", "news", "finance"] = "general",
    include_raw_content: bool = False,
) -> dict[str, Any]:
    """Search the web for facts about a market, competitors, or trends.

    Use this to ground claims in real, current data: market size, existing
    competitors, pricing, regulations, and recent news relevant to a startup idea.
    Returns Tavily search results (titles, urls, and content snippets).
    """
    from tavily import TavilyClient

    api_key = os.environ.get("TAVILY_API_KEY")
    if not api_key:
        raise RuntimeError(
            "TAVILY_API_KEY is not set. Copy .env.example to .env and add your key."
        )

    client = TavilyClient(api_key=api_key)
    return client.search(
        query,
        max_results=max_results,
        include_raw_content=include_raw_content,
        topic=topic,
    )
