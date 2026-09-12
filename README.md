# Deskemon

Deskemon is the physical embodiment of a Codex pet: the same companion continues beyond the screen, gains awareness of the workspace around it, and connects physical conversations with digital work context.

## Hackathon premise

Agents understand what happens inside computers but miss promises, decisions, meetings, and presence around the desk. Deskemon lives in that physical gap. A phone serves as the working prototype; a future dedicated desk device provides the intended form factor.

## Core experience

Deskemon listens for speech around the desk, turns useful moments into selective memory, checks them against calendar and work context, and asks before taking consequential action. GPT-Live gives the companion a responsive voice.

The primary demonstration is a spoken commitment that conflicts with the user's calendar or active work. Deskemon notices the conflict, explains it, suggests a realistic alternative, requests confirmation, and saves the approved commitment.

## Supporting capabilities

- Action-oriented meeting summaries: decisions, commitments, action items, and follow-ups.
- Automatic Slack presence based on physical desk presence, calendar context, and active work.
- Continuity with the Codex pet's identity and task states.
- Visible listening, thinking, speaking, remembering, waiting, and privacy states.

## Trust model

Deskemon is ambiently attentive and selectively remembers. Its listening state must be visible. Raw audio should be temporary, irrelevant material should be discarded, and consequential memories or actions should be confirmed by the user.

## Project state

Created on 2026-09-12 for the Agents Everywhere hackathon build day. See `RESUME_HERE.md` before starting implementation.

## Start here

**Picking this up cold? Read `HANDOFF.md` first.** It covers what exists, what is
deliberately not done, and the decisions worth not re-litigating.

- `HANDOFF.md` — current state, architecture, invariants, next steps.
- `PROJECT_CONTEXT.md` contains the complete product, hackathon, technical, trust, and pitch context.
- `CLAUDE.md` is the implementation brief for the mobile UI, interactions, animation system, and deterministic judge demo.
- `assets/character/` contains the supplied transparent Baymax PNG and SVG.
- `assets/pet/` contains the current Codex pet package and motion references.

## Running the prototype

```bash
cd app
npm install
npm run dev
```

Open on a phone in **landscape** (the layout is landscape-only). On a laptop,
size the window wide and short to match.

### Routes

| URL | What |
|---|---|
| `/` | The live companion screen |
| `/?demo=1` | Presenter controls (hidden otherwise) |
| `/#scenarios` | **All ten scenarios, playable.** The animation reference |
| `/#face-lab` | All 20 expressions, with a simulated-energy slider |
| `/#style` | The UI component guide, with measured contrast ratios |

### Demo controls (`?demo=1`)

| Key | Action |
|---|---|
| `s` | Run the full judge scenario |
| `c` | Jump to the conflict moment |
| `r` | Reset |
| `a` / `b` | Step away / come back (Slack presence) |
| `←` `→` | Step backward / forward through states |
| `d` | Hide or show the control panel |

Press `d` before recording — the panel must not appear in the video.

### Demo script (about 90 seconds)

1. Start in Attentive. The face breathes and blinks. "It is listening, and it
   shows you that it is."
2. Press `s`. Speech is detected, the transcript reveals progressively, then it
   thinks through truthful stages.
3. The extracted commitment appears — meaning, not a transcript dump.
4. Press Remember. **The hero moment:** the conflict card. Commitment, the
   2:00–3:00 clash, the still-running Codex task, and a suggested 4:30.
5. Deskemon speaks; captions carry the line.
6. Tap **Move to 4:30 PM**. Success bounce, saved.
7. The action-oriented summary follows.
8. Press `a` for the separate presence demonstration.

## Documentation

- `HANDOFF.md` — **start here.** State, architecture, decisions, invariants.
- `docs/SCENARIOS.md` — all ten scenarios beat by beat (generated from the registry).
- `docs/UI-GUIDE.md` — the design system, with verified WCAG contrast data.
- `docs/INTEGRATIONS.md` — exactly what is real and what is simulated.
- `PROJECT_CONTEXT.md` — product source of truth.
- `CLAUDE.md` — the implementation brief.

## Note on the character

The Codex pet assets under `assets/` are the *computer* companion — a flat
Baymax illustration. Deskemon is a different surface: the phone screen **is** the
face. It is drawn as pure geometry (two eyes, one connecting bar) so it can
blink, emote, and react to audio — none of which the flat artwork could do.
