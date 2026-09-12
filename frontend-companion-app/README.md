# Deskemon companion

This directory contains the judge-facing Deskemon interface and is the visual
source of truth for the project.

```bash
npm install
npm run dev
```

The default route opens with the animated Deskémon welcome screen. Tap the pet
to enter companion mode. Open `/?companion=1` to skip the welcome screen or
`/?demo=1` for presenter controls,
`/#scenarios` for the complete scenario library, `/#face-lab` for expressions,
and `/#style` for the UI system.

The welcome screen and companion mode adapt to portrait and landscape phone,
tablet, and desktop viewports. The dashboard is maintained as a separate web
app in `../frontend-dashboard-app` and uses the same responsive breakpoints and
44px minimum interactive targets.

Local companion development URL: `http://localhost:5176`. The Docker stack
serves this same app at `http://localhost:5173`.

The app currently uses seeded adapters so the central demonstration remains
deterministic. The repository's backend and agents are real but are not yet
wired into these adapters. See `HANDOFF.md` and `docs/INTEGRATIONS.md`.
