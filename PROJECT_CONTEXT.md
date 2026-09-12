# Deskemon — Complete Project Context

## What Deskemon is

Deskemon is the physical embodiment of the user's Codex pet. The same companion that represents agent activity on the computer continues into the physical workspace through a phone prototype placed on the desk and, eventually, a dedicated device.

Deskemon is not a second notification screen for Codex. Its physical position gives the agent new context. It can hear conversations that were never typed, understand when the user is at the desk, connect those events with digital work, and take useful actions after asking permission.

Core phrase: **Same companion. Same context. New senses.**

## Hackathon context

This is being built for the AI Tinkerers **Agents Everywhere** hackathon. The premise is to create an agent that lives where people already work and gains useful context from that placement. Many entries will live inside apps such as Slack or Gmail. Deskemon stands out by living in the physical workspace and bridging it with digital tools.

The prototype is built on hackathon day, 2026-09-12. The working build window is short, so one complete, convincing interaction is more valuable than many disconnected features.

Expected submission materials include a public repository, a short description, a two-minute video, and a social post. Keep the demo legible on camera.

## Problem

Digital agents know what happens inside software but miss much of the work around it:

- a coworker asks for something beside the desk;
- the user promises a deadline on speakerphone;
- decisions and follow-ups emerge in a physical conversation;
- the user walks away while Slack still suggests availability;
- an offline commitment conflicts with the user's calendar or active work.

These moments are often not captured until they are forgotten or become a problem.

## Product promise

Deskemon listens for speech around the desk, converts useful moments into selective memory, checks them against calendar and work context, and asks before taking consequential action. GPT-Live gives the companion a natural voice.

The product should feel like a calm companion that notices and helps, not an enterprise recorder or a surveillance dashboard.

## Primary judge demo

A coworker says: **“Can you send me the revised prototype before three?”**

The user replies: **“Yes, I’ll do it.”**

Deskemon visibly moves through listening and thinking states. It recognizes a commitment and checks context:

- a calendar meeting runs from 2:00–3:00;
- the relevant Codex task is still running or incomplete.

Deskemon speaks:

> “Champ, you’re booked until three and the prototype is still being worked on. Should we move that commitment to 4:30?”

The user confirms. Deskemon saves the revised commitment and celebrates briefly. This shows the complete loop:

**Physical conversation → understanding → digital context → conflict → permission → action**

## Supporting capabilities

### Meeting summaries

Deskemon already has the transcript stream needed for selective memory. At the end of a conversation it can produce a concise, action-oriented summary containing:

- decisions;
- commitments;
- action items, owners, and deadlines;
- unresolved questions;
- follow-ups.

Avoid long generic summaries. The useful output is what changed and what someone must do next.

### Automatic Slack presence

Physical desk presence becomes digital workplace context. Intended states include:

- at desk and available;
- focusing or in an active conversation;
- in a scheduled meeting;
- away from desk;
- out of office.

For the prototype, a seeded integration or adapter is acceptable if the UI makes the behavior clear and the implementation notes state what is simulated.

### Codex continuity

The pet should reflect recognizable Codex-style task states such as running, needing input, ready, and blocked. The important idea is continuity of identity: Deskemon is the same companion across the computer and the desk.

## Ambient attention model

Deskemon treats everything audible around the desk as one consistent acoustic input. It does not require separate Zoom, phone-call, or multi-speaker integrations for the physical prototype. Laptop speakers, a separate phone on speaker, and people near the desk all reach the same microphone.

The intended architecture separates lightweight attention from expensive intelligence:

1. The local microphone remains available while Deskemon is attentive.
2. Voice activity detection notices the beginning and end of human speech.
3. A short rolling buffer preserves the opening words of an utterance.
4. Speech segments are transcribed.
5. A memory filter decides whether the segment contains a useful commitment, decision, deadline, task, preference, or follow-up.
6. Irrelevant material is discarded.
7. The agent checks useful information against calendar, tasks, Codex state, or other approved context.
8. GPT-Live speaks only when interaction is useful.

Product framing: **ambiently attentive and selectively remembering**.

## Trust and privacy behavior

Trust must be visible in the experience:

- always show whether Deskemon is sleeping, attentive, listening, processing, or muted;
- provide an obvious privacy control;
- make raw audio temporary where possible;
- discard irrelevant material;
- ask before saving ambiguous commitments or performing consequential actions;
- allow “forget that” and immediate deletion of a candidate memory;
- avoid claiming perfect speaker identification in overlapping conversations.

The prototype should demonstrate these safeguards through behavior, not a wall of explanatory text.

## Prototype architecture

The fastest practical structure is a mobile-first web app or PWA:

```text
Phone browser
  ├── Deskemon character and animation state machine
  ├── microphone, playback, and visible privacy controls
  └── WebRTC voice session
              ↓
GPT-Live conversation layer
              ↓ delegates useful work
Backend agent / adapters
  ├── transcribe or consume transcripts
  ├── extract meaningful memories
  ├── check_calendar()
  ├── save_commitment()
  ├── summarize_meeting()
  └── update_slack_status()
              ↓
Local JSON, browser storage, or a simple database
```

Keep API keys on a trusted server. The UI must also run in a deterministic demo mode so the pitch can survive poor venue connectivity or unfinished integrations.

## Build priority

1. Phone microphone, voice activity, transcription, and GPT-Live speech.
2. Pet-centered UI with clear listening, thinking, speaking, remembering, and privacy states.
3. Commitment extraction and a seeded calendar-conflict check.
4. Confirmation and saved-memory behavior.
5. Meeting summaries.
6. Slack presence.
7. Live Codex-state synchronization if time permits.

## Scope exclusions for the hackathon MVP

These belong in the future vision unless the core loop is already stable:

- posture analysis;
- water and sedentary reminders;
- robust speaker diarization;
- direct capture of headphone-only audio;
- full production-grade Google Calendar OAuth;
- continuous cloud recording;
- dedicated physical hardware;
- broad emotional coaching.

## Character and naming

The current prototype character uses Baymax artwork supplied by the user. The source PNG and SVG are stored under `assets/character/`. A Codex-compatible local pet and motion previews are stored under `assets/pet/` and installed locally as **Baymax Companion**.

The product/project name is **Deskemon**. Earlier ideation sometimes used “Deskimon”; use **Deskemon** consistently in new work.

The supplied artwork is a flat transparent image rather than a layered character rig. The current pet motion therefore uses restrained whole-character breathing, swaying, waddling, leaning, and bouncing while preserving the original illustration.

## Positioning for judges

One-line pitch:

> Deskemon gives your Codex pet a physical body, allowing the same companion to hear the work happening around your desk, connect it with your digital context, and take useful, permissioned action.

If asked why this is more than a Codex notification screen:

> A notification screen only reflects context Codex already has. Deskemon creates new context. It hears commitments that were never typed, understands physical presence, connects that information with digital workload, and acts with permission.

If compared with an AI recorder:

> Recorders preserve conversations. Deskemon understands how physical conversations affect digital work and intervenes before commitments are broken.

Closing line:

> Today, agents understand what happens inside our computers. Deskemon gives them a place and a purpose in the world around us.

## Definition of a successful prototype

The prototype succeeds when a judge can watch one short live sequence and immediately understand:

1. why the agent must live on the desk;
2. what physical context it gains;
3. how it connects that context to digital work;
4. what decision it makes;
5. how the user remains in control;
6. why the companion form makes the interaction approachable and memorable.

