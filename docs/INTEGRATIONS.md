# What is real and what is simulated

The brief requires this to be stated plainly rather than implied. Nothing below
is dressed up.

| Seam | Status | Detail |
|---|---|---|
| `voiceActivitySource` | **Real code, not yet wired to the UI** | `src/audio/mic.ts` is a working Web Audio implementation: `getFloatTimeDomainData` → RMS → adaptive noise floor → hysteresis + hang time → damped 0–1 energy. The live screen currently drives the face from the seeded envelope; swapping in `MicEngine` is a one-line change. It is **RMS-grade VAD**, not spectral or model-based. |
| `transcriptionSource` | **Simulated** | The two scenario lines are seeded and revealed on a timer. No speech recognition runs. |
| `liveVoiceSource` | **Simulated** | `available: false` — no API key in this build, so captions carry every spoken line. The speech *energy envelope* is synthesised so the glow behaves like real output. Captions are the accessibility requirement anyway, so this path is the one that must work. |
| `calendarSource` | **Seeded** | Returns the fixed 2:00–3:00 "Portfolio review". No Google Calendar OAuth. |
| `codexStateSource` | **Seeded** | Returns a fixed `running` task. Not connected to the real Codex pet. |
| `memoryStore` | **Real, in-memory** | Saves and forgets commitments for the session. Not persisted across reloads. |
| `slackPresenceSource` | **Seeded** | Presence changes are real state changes in the app and visibly update the UI, but nothing is sent to Slack. |
| `physicalPresenceSource` | **Seeded** | Away/return is triggered by the demo controller, not by any sensor. |

## Why it is built this way

The brief's working rule: protect the complete primary flow first. A demo that
depends on venue wifi, a calendar OAuth consent screen, and a live speech API is
a demo that can fail in three places while a judge watches.

Every seam is a TypeScript interface in `src/adapters/index.ts`. Replacing a
seeded implementation with a real one does not touch the UI or the state
machine.

## The one thing to say out loud during the demo

The commitment-conflict logic is seeded, not inferred by a model. The point of
the prototype is the *interaction* — that a physical conversation reaches
digital context, produces a conflict, and asks permission before acting. That
loop is real and complete in the UI.
