# Deskemon companion

This directory contains the judge-facing Deskemon interface and is the visual
source of truth for the project.

```bash
npm install
npm run dev -- --host
```

Use a landscape viewport. Open `/?demo=1` for presenter controls,
`/#scenarios` for the complete scenario library, `/#face-lab` for expressions,
and `/#style` for the UI system.

The app currently uses seeded adapters so the central demonstration remains
deterministic. The repository's backend and agents are real but are not yet
wired into these adapters. See `HANDOFF.md` and `docs/INTEGRATIONS.md`.
