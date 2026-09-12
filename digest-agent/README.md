# Deskemon Digest Agent

Standalone agent that turns raw captured events into an LLM-written narrative,
bridging the physical (`phone`) and digital (`browser`/`desktop`/`calendar`)
signals in the `events` table. This is the one intentional LLM-calling
component in this project — see `frontend-companion-app/CLAUDE.md`'s "No LLM
calls" convention for why everything else is deterministic.

Uses the [Claude Agent SDK](https://code.claude.com/docs/en/agent-sdk/python)
(`claude-agent-sdk`), with its built-in `WebSearch` tool enabled for adding a
supporting fact/context to each write-up. Talks to the backend only over
HTTP (`GET /events`, `GET/POST /summaries`, `GET/POST /nudges`) — it never
touches Postgres directly.

## Two loops

1. **Summary loop** (`SUMMARY_INTERVAL_SEC`, default 300 = 5 min): reads
   events since the last summary's `window_end`, asks Claude for a short
   synthesis, posts it to `POST /summaries`.
2. **Digest loop** (`DIGEST_INTERVAL_SEC`, default 3600 = 1 hour): reads all
   summaries since the last `type="digest"` nudge, asks Claude to synthesize
   them into one "hourly ingest," posts it via `POST /nudges` — from there it
   flows through the existing nudge pipeline exactly like any other nudge
   (dashboard, monitor UI, `notifier-agent`'s native notification).

## Run

Via Docker Compose (recommended) — requires `ANTHROPIC_API_KEY` set in the
repo root `.env` (copy `.env.example` and fill it in):

```bash
docker compose up -d --build digest-agent
docker compose logs -f digest-agent
```

Without a key set, it logs an error and idles rather than crash-looping.

## Env vars

- `BACKEND_URL` (default `http://backend:8000`)
- `ANTHROPIC_API_KEY` (required — from the repo root `.env`)
- `SUMMARY_INTERVAL_SEC` (default `300`)
- `DIGEST_INTERVAL_SEC` (default `3600`, overridden faster for demos in
  `docker-compose.yml`)
