import asyncio
import json
import logging
import os
from collections import Counter
from datetime import datetime, timedelta, timezone

import requests
from claude_agent_sdk import AssistantMessage, ClaudeAgentOptions, TextBlock, query

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("digest-agent")

BACKEND_URL = os.environ.get("BACKEND_URL", "http://backend:8000")
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
SUMMARY_INTERVAL_SEC = float(os.environ.get("SUMMARY_INTERVAL_SEC", 300))
DIGEST_INTERVAL_SEC = float(os.environ.get("DIGEST_INTERVAL_SEC", 3600))

SUMMARY_SYSTEM_PROMPT = (
    "You are Deskemon's digest writer. You are given a short window of raw "
    "sensor/activity events spanning the user's physical world (phone "
    "location/motion) and digital world (browser tabs, desktop app focus, "
    "calendar meetings). Write a concise 2-4 sentence synthesis connecting "
    "what happened physically and digitally in that window. You may use one "
    "web search to add a single relevant, well-known wellbeing or "
    "productivity fact if it fits naturally — do not force it. Do not "
    "invent events that weren't given to you. Respond with plain text only, "
    "no headers or bullet points."
)

DIGEST_SYSTEM_PROMPT = (
    "You are Deskemon's hourly digest writer. You are given a sequence of "
    "5-minute activity summaries covering the last hour. Synthesize them "
    "into one cohesive 'hourly ingest' — 3-5 sentences the user can read in "
    "a few seconds, highlighting the overall pattern across physical and "
    "digital activity (e.g. sedentary stretches, focus/distraction, "
    "meetings). Respond with plain text only, no headers or bullet points."
)


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _iso(dt: datetime) -> str:
    return dt.isoformat()


def get_events(since: str) -> list[dict]:
    resp = requests.get(f"{BACKEND_URL}/events", params={"since": since}, timeout=30)
    resp.raise_for_status()
    return resp.json()


def get_summaries(since: str) -> list[dict]:
    resp = requests.get(f"{BACKEND_URL}/summaries", params={"since": since}, timeout=30)
    resp.raise_for_status()
    return resp.json()


def get_latest_digest_timestamp() -> str | None:
    resp = requests.get(f"{BACKEND_URL}/nudges", timeout=30)
    resp.raise_for_status()
    digests = [n for n in resp.json() if n["type"] == "digest"]
    if not digests:
        return None
    return max(n["timestamp"] for n in digests)


def post_summary(window_start: str, window_end: str, summary: str, sources: list[str]) -> None:
    resp = requests.post(
        f"{BACKEND_URL}/summaries",
        json={
            "window_start": window_start,
            "window_end": window_end,
            "summary": summary,
            "sources": sources,
        },
        timeout=30,
    )
    resp.raise_for_status()


def post_nudge(nudge_type: str, message: str) -> None:
    resp = requests.post(
        f"{BACKEND_URL}/nudges",
        json={"type": nudge_type, "message": message},
        timeout=30,
    )
    resp.raise_for_status()


def _describe_events(events: list[dict]) -> str:
    if not events:
        return "No events were captured in this window."

    counts = Counter((e["source"], e["type"]) for e in events)
    lines = [f"- {source}/{etype}: {count}" for (source, etype), count in counts.items()]

    samples = []
    for e in events[-10:]:
        samples.append(f"  {e['timestamp']} {e['source']}/{e['type']}: {json.dumps(e['payload'])}")

    return "Event counts:\n" + "\n".join(lines) + "\n\nRecent samples:\n" + "\n".join(samples)


async def _ask_claude(system_prompt: str, prompt: str, allow_web_search: bool) -> str:
    options = ClaudeAgentOptions(
        system_prompt=system_prompt,
        max_turns=3,
        allowed_tools=["WebSearch"] if allow_web_search else [],
    )
    text_parts: list[str] = []
    async for message in query(prompt=prompt, options=options):
        if isinstance(message, AssistantMessage):
            for block in message.content:
                if isinstance(block, TextBlock):
                    text_parts.append(block.text)
    return "\n".join(text_parts).strip()


async def run_summary_tick() -> None:
    existing = get_summaries(since=_iso(_now() - timedelta(days=1)))
    window_start = existing[-1]["window_end"] if existing else _iso(_now() - timedelta(seconds=SUMMARY_INTERVAL_SEC))
    window_end = _iso(_now())

    events = get_events(since=window_start)
    events = [e for e in events if e["timestamp"] < window_end]
    sources = sorted({e["source"] for e in events})

    prompt = (
        f"Window: {window_start} to {window_end}\n\n{_describe_events(events)}\n\n"
        "Write the synthesis now."
    )
    summary_text = await _ask_claude(SUMMARY_SYSTEM_PROMPT, prompt, allow_web_search=True)
    if not summary_text:
        summary_text = "No notable activity in this window."

    post_summary(window_start, window_end, summary_text, sources)
    log.info("posted summary for window %s -> %s", window_start, window_end)


async def run_digest_tick() -> None:
    last_digest_at = get_latest_digest_timestamp()
    since = last_digest_at or _iso(_now() - timedelta(seconds=DIGEST_INTERVAL_SEC))

    summaries = get_summaries(since=since)
    if not summaries:
        log.info("no summaries available yet, skipping digest")
        return

    joined = "\n\n".join(f"[{s['window_start']} - {s['window_end']}] {s['summary']}" for s in summaries)
    prompt = f"Summaries from the last period:\n\n{joined}\n\nWrite the hourly ingest now."
    digest_text = await _ask_claude(DIGEST_SYSTEM_PROMPT, prompt, allow_web_search=True)
    if not digest_text:
        return

    post_nudge("digest", digest_text)
    log.info("posted hourly-ingest digest nudge")


async def _loop(name: str, interval_sec: float, tick):
    while True:
        try:
            await tick()
        except Exception:
            log.exception("%s tick failed", name)
        await asyncio.sleep(interval_sec)


async def main() -> None:
    if not ANTHROPIC_API_KEY:
        log.error(
            "ANTHROPIC_API_KEY is not set — digest-agent will idle without "
            "producing summaries or digests. Set it in the repo root .env."
        )
        while True:
            await asyncio.sleep(3600)

    log.info(
        "digest-agent starting: summary every %ss, digest every %ss",
        SUMMARY_INTERVAL_SEC,
        DIGEST_INTERVAL_SEC,
    )
    await asyncio.gather(
        _loop("summary", SUMMARY_INTERVAL_SEC, run_summary_tick),
        _loop("digest", DIGEST_INTERVAL_SEC, run_digest_tick),
    )


if __name__ == "__main__":
    asyncio.run(main())
