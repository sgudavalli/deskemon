# Deskemon — handoff

Everything an agent or developer needs to pick this up cold.

**Status:** the complete mobile UI, interaction flow, animation system, and ten
simulated scenarios are built and verified in-browser. No integration is live.

---

## 1. Read in this order

| # | File | Why |
|---|---|---|
| 1 | `PROJECT_CONTEXT.md` | Product source of truth. The judge scenario, trust model, scope exclusions. |
| 2 | `CLAUDE.md` | The UI/interaction/motion brief this build implements. |
| 3 | **this file** | What exists now, and what is deliberately not done. |
| 4 | `docs/SCENARIOS.md` | All ten scenarios, beat by beat, with timings. |
| 5 | `docs/UI-GUIDE.md` | Design system with measured contrast data. |
| 6 | `docs/INTEGRATIONS.md` | Exactly what is real vs simulated. |
| 7 | `DESIGN.md` | Champ's wider input architecture (sensors, extension, agent). See §7. |

---

## 2. Run it

```bash
cd app
npm install
npm run dev -- --host
```

**Landscape only.** On a laptop, size the window wide and short (~844×390) to
match a phone in a stand.

| Route | What |
|---|---|
| `/` | The live companion screen |
| `/?demo=1` | Presenter controls (hidden otherwise) |
| `/#scenarios` | **All ten scenarios, playable.** The animation reference. |
| `/#face-lab` | All 20 expressions |
| `/#style` | UI components + measured contrast |

Demo keys: `s` scenario · `c` conflict · `r` reset · `a`/`b` away/back ·
`←` `→` step · `d` hide panel. **Press `d` before recording.**

---

## 3. The one idea that explains the whole codebase

**The phone screen IS the face.** Not a screen showing a character — the entire
display is a face, drawn as pure geometry: two eyes plus one connecting bar.

Consequences that run through every file:

- **No character artwork is used.** `assets/` holds the *Codex pet* — a flat
  Baymax illustration for the computer companion. That is a different product
  surface. Deskemon draws its face in SVG so it can blink, emote, and react to
  audio, none of which a flat PNG could do.
- **Emotion lives in the eyes.** The bar stays straight. A curved bar reads as a
  mouth, and Baymax has none — `CLAUDE.md` forbids inventing one.
- **The face is never tinted.** White on black, always. Colour exists only in the
  information layer, so an accent always means "information needs attention" and
  never "the mood changed."

---

## 4. Architecture

```
app/src/
  face/          The face engine — geometry, not images
    types.ts       EyeShape, Modifier, FaceGeometry, ExpressionName
    expressions.ts The 20 named expressions as deltas from neutral
    Eye.tsx        Seven shape primitives (circle, arcs, wedge, ring, cross, heart)
    Modifier.tsx   Sparse symbols: dots, ?, ticks, sound arcs, zzz
    Face.tsx       One rAF loop: transitions, breathing, blinking
    FaceLab.tsx    #face-lab
  state/
    types.ts       12 UI states + domain types
    machine.ts     STATE_VISUALS — the single state→expression→copy table
  adapters/
    index.ts       The 8 integration seams as TS interfaces
    seeded.ts      Seeded implementations + the judge scenario constants
  scenarios/
    registry.ts    ★ All 10 scenarios AS DATA. The source of truth.
    Player.tsx     Plays beats on the real Face and real components
    Scenarios.tsx  #scenarios
  ui/
    tokens.ts      Colour, type, space, radius, motion
    components.tsx Button, StatusPill, Sheet, FactRow, Caption, Toast
    PrivacyControl.tsx
    StyleGuide.tsx #style
    global.css     Reset, focus rings, reduced-motion, keyframes
  audio/mic.ts     Real Web Audio VAD — built, not yet wired
  demo/            Presenter controls
  Deskemon.tsx     The live companion screen
```

### The registry is the important file

`scenarios/registry.ts` defines every scenario as data — beats, timings,
expressions, panels, and a director's note per beat. It drives **both** the live
simulator and `docs/SCENARIOS.md` (generated via
`node scripts-gen-scenarios.mjs` from `app/`), so the spec and the running code
cannot drift.

**To change an animation, edit the registry and regenerate the doc.** Do not
hand-edit `docs/SCENARIOS.md`.

---

## 5. Decisions worth not re-litigating

| Decision | Why |
|---|---|
| **Landscape-locked, two-column panels** | A phone in landscape is ~390px tall. A conventional bottom sheet overflowed and clipped its buttons. The panel now takes the right 62% full-height; the face keeps the left column at 10–12% opacity. Information gets an uncontested column and the character stays visibly present. |
| **Time-based transitions, not springs** | The original spring stalled mid-transition under React StrictMode's double-mount, leaving the face permanently between two expressions. Transitions are now driven by elapsed time with ease-out cubic — idempotent and remount-safe. |
| **Blink phase randomised per instance** | Every Face started with the same blink timer, so multiple faces blinked in lockstep. That reads as a glitch, not as life. |
| **`still` prop on Face** | Reference grids hold faces motionless; a blink caught mid-frame misreads as the expression's real geometry. |
| **System font stack** | The design-system generator suggested Orbitron + JetBrains Mono. Rejected — cyberpunk-tactical is the opposite of Baymax's warmth. System fonts also render instantly with no layout shift. |
| **`textFaint` is `#818b9e`** | It was `#6b7488` at 3.85:1, failing WCAG AA for the 14px labels it is used on. Measured, not assumed. |
| **Reduced motion keeps motion** | Motion is how state is communicated here. Removing it entirely would make the interface *less* usable. Vestibular triggers (large translate/scale) are dropped; opacity transitions and expression changes stay. |

---

## 6. The ten scenarios

Two categories. All simulated. Full beat tables in `docs/SCENARIOS.md`.

**Personal wellbeing** — Time to stand (8.0s) · Water (5.4s) · Medicine (7.8s) ·
You skipped lunch (6.1s) · Ordering lunch (8.4s) · A long stretch (8.6s)

**Work** — Commitment captured (14.1s) · Conflict caught (15.9s) ·
Rubber duck (17.2s) · Codex at work (10.7s)

### Three scenarios where the copy is load-bearing

**A long stretch** — this is *not* stress detection. Deskemon has a microphone;
no camera, no heart rate, no wearable. It reports **counted facts** — three hours
of conversation, longest gap four minutes, nothing until 4:30 — and lets the user
draw the conclusion. It must never say "you seem stressed." `DESIGN.md` reaches
the same conclusion independently, calling it "a synthetic proxy, framed as such."

**Ordering lunch** — the only scenario that spends money. It shows vendor, items,
exact price and ETA *before* any action, and the button reads **"Open to
confirm"**, never "Order now." Deskemon holds no payment details and never
completes a transaction.

**Rubber duck** — the label `"Thinking out loud · nothing saved"` stays visible
for the entire mode, including while a transcript is on screen (`persistLabel` on
the beat). That label is the privacy promise; hiding it breaks the feature.

### Deliberate contrast in interruption weight

Water is one beat with no panel and no buttons — ignoring it is a valid response.
Medicine demands explicit acknowledgement and will not fade. Conflict takes over
the screen. Same character, three levels of insistence. Keep that gradient.

---

## 7. Reconciling with `DESIGN.md`

`DESIGN.md` describes a wider input architecture — phone GPS/motion, a browser
extension, a desktop agent, calendar OAuth, all writing to one events table
feeding a rules engine.

**This build does not contradict it; it implements the output half.** The eight
adapter interfaces in `adapters/index.ts` are exactly the seam where that events
store would plug in:

| `DESIGN.md` source | Adapter it would feed |
|---|---|
| Phone motion/GPS | `physicalPresenceSource` |
| Desktop agent, browser extension | `codexStateSource`, `physicalPresenceSource` |
| Calendar API | `calendarSource` |
| Rules engine output | the scenario trigger conditions |

The rules engine decides *when*; the registry decides *what it looks like*.

---

## 8. What is NOT done

Stated plainly so nobody assumes otherwise.

- **No backend.** No server, no database, no API keys anywhere.
- **No live integrations.** Calendar, Slack, Codex state and transcription are
  all seeded. Nothing is sent to Slack; no OAuth exists.
- **No speech recognition and no TTS.** `liveVoice.available === false`, so
  captions carry every spoken line. The speech *energy envelope* is synthesised
  so the glow behaves correctly.
- **The microphone is built but not wired.** `audio/mic.ts` is working Web Audio
  (RMS → adaptive noise floor measured in gaps between words → hysteresis →
  damping). The live screen currently drives the face from a seeded envelope.
  Wiring it is a small change in `Deskemon.tsx`; it is RMS-grade VAD, not
  spectral or model-based, and should be described that way.
- **Memory is in-memory only.** Commitments do not survive a reload.
- **No Remotion video.** Planned as the final phase; `#scenarios` currently
  serves as the animation reference.
- **Not tested on physical hardware.** Everything was verified in-browser at
  844×390. Safe-area insets around the notch — which in landscape sit on a *side*,
  where the status pills and privacy control live — have not been checked on a
  real device. **Do this before recording.**

---

## 9. Suggested next steps

1. **Open `#scenarios` on a real phone in landscape.** Check safe areas, OLED
   black, and legibility in a bright room.
2. **Wire `MicEngine` into `Deskemon.tsx`** so the listening arcs respond to real
   speech. Highest credibility-per-hour change available.
3. **Pick the video cut.** Ten scenarios will not fit in two minutes. Suggested:
   Conflict caught → Water → Codex needs you. Agentic range, tonal range, and the
   "same companion" argument in roughly 40 seconds.
4. **Then** the Remotion film, if time allows.

---

## 10. Invariants — do not break these

- The face is never tinted.
- The bar never curves into a mouth.
- Sound arcs appear **only** when audio is genuinely being processed. They are a
  trust signal, not decoration.
- Privacy mode closes the eyes. That is the honest substitute for hardware with
  no shutter.
- Thinking copy cycles through truthful stages — never fake technical logs.
- Consequential actions always confirm before acting.
- One accent colour on screen at a time.
