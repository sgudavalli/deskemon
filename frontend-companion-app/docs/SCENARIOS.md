# Scenario map

Ten scenarios across two categories. **Every one is simulated** — no microphone,
no network, no model. Timings below are the animation specification.

Play them: run the app and open `#scenarios`.

> This file is generated from `src/scenarios/registry.ts`.
> Edit the registry, then run `node scripts-gen-scenarios.mjs` from `frontend-companion-app/`.

---

## Personal wellbeing

### Time to stand

Deskemon notices continuous desk presence and suggests a break, without nagging.

| | |
|---|---|
| **Trigger** | Uninterrupted presence at the desk for 90 minutes. |
| **Adapters** | `physicalPresenceSource` · `calendarSource` |
| **Runtime** | 8.0s · 4 beats |

> **Honesty.** Measures PRESENCE DURATION, not posture. Deskemon has no camera — it knows you have not left, not how you are sitting.

| # | ms | Expression | On screen | Why |
|---|---|---|---|---|
| 1 | 1600 | `neutral` | label: "Quietly listening nearby" | Baseline. Idle breathing, occasional blink. Nothing is happening yet. |
| 2 | 1400 | `curious` | label: "You have been here a while" | Gentle attention-getting: a small lift and head tilt. NOT an alarm — this is a suggestion, not an alert. |
| 3 | 3200 | `concerned` | panel: "You have been at the desk 90 minutes", face 12% | Evidence first, advice second. Showing the calendar gap makes it USEFUL rather than generic — it found a moment that actually works. |
| 4 | 1800 | `happy` | label: "Enjoy the stretch" | Warm acknowledgement, then straight back to attentive. Never lingers or moralises. |

---

### Water

The lightest possible nudge — no panel, no decision, no friction.

| | |
|---|---|
| **Trigger** | Scheduled interval, suppressed while speech is detected. |
| **Adapters** | `physicalPresenceSource` · `voiceActivitySource` |
| **Runtime** | 5.4s · 3 beats |

> **Honesty.** Time-based only. Deskemon cannot see whether you actually drank anything.

| # | ms | Expression | On screen | Why |
|---|---|---|---|---|
| 1 | 1400 | `neutral` | label: "Quietly listening nearby" | Baseline. |
| 2 | 2600 | `happy` | label: "Water?", toast | THE WHOLE SCENARIO IS ONE BEAT. No panel, no buttons, no dismissal needed. The lightest touch in the system — it earns the right to interrupt precisely by asking nothing. Contrast this deliberately with the conflict scenario. |
| 3 | 1400 | `neutral` | label: "Quietly listening nearby" | Fades back on its own. Ignoring it is a valid response. |

---

### Medicine

A reminder that must be acknowledged — the one wellbeing case where being ignored is a failure.

| | |
|---|---|
| **Trigger** | Scheduled time from a user-set medication routine. |
| **Adapters** | `memoryStore` · `physicalPresenceSource` |
| **Runtime** | 7.8s · 4 beats |

> **Honesty.** Deskemon records that you CONFIRMED, not that you took anything. Never presented as a medical record.

| # | ms | Expression | On screen | Why |
|---|---|---|---|---|
| 1 | 1400 | `neutral` | label: "Quietly listening nearby" | Baseline. |
| 2 | 1200 | `determined` | label: "2:00 PM" | Determined, not concerned. This reminder is firm and certain — it does not hedge. Held slightly longer than the water nudge. |
| 3 | 3400 | `focused` | panel: "Time for your medicine", face 12% | Explicit acknowledgement REQUIRED — unlike water, this does not fade away on its own. Three honest outcomes: taken, later, skipped. "Skip" is deliberately available; pretending it is not an option would be dishonest. |
| 4 | 1800 | `acknowledging` | label: "Logged · 2:00 PM" | Small bounce. Records the CONFIRMATION with a timestamp. |

---

### You skipped lunch

Deskemon connects an observed gap to your actual calendar, and offers a real window.

| | |
|---|---|
| **Trigger** | Past 2:30 PM with no meal-break gap in presence data. |
| **Adapters** | `physicalPresenceSource` · `calendarSource` |
| **Runtime** | 6.1s · 3 beats |

> **Honesty.** Infers from an absence of any away-from-desk gap. It cannot see food — only that you never left.

| # | ms | Expression | On screen | Why |
|---|---|---|---|---|
| 1 | 1400 | `neutral` | label: "Quietly listening nearby" | Baseline. |
| 2 | 1300 | `concerned` | label: "It is past two thirty" | Mild concern — downturned arcs. Caring, never scolding. |
| 3 | 3400 | `concerned` | panel: "You have not stepped away since 9:40", face 12% | "I ate already" matters — it lets the user correct a wrong inference instead of arguing with the device. Hands off to the ordering scenario. |

---

### Ordering lunch

The strictest permission gate in the system: the only scenario that spends money.

| | |
|---|---|
| **Trigger** | User accepts the food prompt, or says "order my usual". |
| **Adapters** | `memoryStore` · `liveVoiceSource` |
| **Runtime** | 8.4s · 4 beats |

> **Honesty.** STOPS SHORT OF PURCHASE. Deskemon prepares the order and hands off to the vendor app. It never completes a transaction on the user's behalf.

| # | ms | Expression | On screen | Why |
|---|---|---|---|---|
| 1 | 1400 | `listening` | label: "Listening", transcript ×1, energy 0.55 | Sound arcs respond to real speech energy. Short, natural phrasing. |
| 2 | 1600 | `thinking` | label: "Finding what you usually order…" | Truthful progress copy — it is genuinely looking up a stored preference, not fabricating. |
| 3 | 3600 | `focused` | panel: "Your usual", face 12% | CRITICAL: every detail shown BEFORE any action — vendor, items, exact price, ETA. The button says "Open to confirm", never "Order now". Deskemon does not hold payment details and does not complete the purchase. |
| 4 | 1800 | `acknowledging` | label: "Opened · confirm in the app" | Hands off cleanly. Deskemon takes no credit for a purchase it did not make. |

---

### A long stretch

Observed load, not diagnosed emotion. The scenario that must not overclaim.

| | |
|---|---|
| **Trigger** | Three hours of near-continuous speech with no gap longer than four minutes. |
| **Adapters** | `voiceActivitySource` · `calendarSource` · `physicalPresenceSource` |
| **Runtime** | 8.6s · 4 beats |

> **Honesty.** NOT stress detection. Deskemon has no camera, heart rate, or wearable — it measures TALKING TIME and GAPS. It reports what it counted and lets the user draw the conclusion. Never says "you seem stressed".

| # | ms | Expression | On screen | Why |
|---|---|---|---|---|
| 1 | 1500 | `neutral` | label: "Quietly listening nearby" | Baseline. |
| 2 | 1500 | `curious` | label: "That was a long one" | Notices as the conversation ends — never interrupts mid-conversation. Timing is the whole courtesy here. |
| 3 | 3800 | `concerned` | panel: "Three hours of back-to-back conversation", face 12% | THE MOST IMPORTANT COPY IN THE PROJECT. It states COUNTED FACTS — hours, gap length, next commitment — and never diagnoses. "Nothing needs you right now" removes the excuse rather than pathologising the person. "I am fine" is a real, respected answer. |
| 4 | 1800 | `happy` | label: "I will keep things quiet" | If accepted, it goes quiet — the promise is actually kept, not just stated. |

---

## Work

### Commitment captured

The clean path: a spoken promise becomes a saved, confirmed commitment.

| | |
|---|---|
| **Trigger** | Speech containing a commitment and a time. |
| **Adapters** | `voiceActivitySource` · `transcriptionSource` · `memoryStore` |
| **Runtime** | 14.1s · 7 beats |

> **Honesty.** Extraction is seeded in this build. The INTERACTION — confirm before saving — is real and complete.

| # | ms | Expression | On screen | Why |
|---|---|---|---|---|
| 1 | 1300 | `neutral` | label: "Quietly listening nearby" | Baseline. |
| 2 | 1100 | `curious` | label: "I hear a conversation", energy 0.4 | Small lift. Does NOT show a transcript yet — it has not decided anything matters. |
| 3 | 2400 | `listening` | label: "Listening", transcript ×1, energy 0.62 | Sound arcs track speech energy. Transcript fades in progressively, never dumped at once. |
| 4 | 1900 | `listening` | label: "Listening", transcript ×2, energy 0.5 | The owner line is bright, the earlier line dims. The commitment lands on the second line. |
| 5 | 2000 | `thinking` | label: "Finding what matters…" | Head tilt plus cycling dots. Copy rotates through truthful stages — never fake logs. |
| 6 | 3400 | `focused` | panel: "Possible commitment", face 12% | Shows extracted MEANING, not the raw transcript. Never saves silently — ambiguity always asks. |
| 7 | 2000 | `acknowledging` | label: "Got it · Wednesday evening" | Small anticipation, 8px rise, soft landing, then stillness. Returns to attentive automatically. |

---

### Conflict caught

The full loop: physical conversation → digital context → conflict → permission → action.

| | |
|---|---|
| **Trigger** | An extracted commitment that collides with calendar or active work. |
| **Adapters** | `voiceActivitySource` · `transcriptionSource` · `calendarSource` · `codexStateSource` · `liveVoiceSource` · `memoryStore` |
| **Runtime** | 15.9s · 8 beats |

> **Honesty.** Calendar and Codex state are seeded. The conflict logic is deterministic, not model-inferred.

| # | ms | Expression | On screen | Why |
|---|---|---|---|---|
| 1 | 1200 | `neutral` | label: "Quietly listening nearby" | Baseline. |
| 2 | 1000 | `curious` | label: "I hear a conversation", energy 0.42 | Alert lift, 250–400ms with a soft settle. |
| 3 | 2300 | `listening` | label: "Listening", transcript ×1, energy 0.64 | The judge scenario, verbatim from PROJECT_CONTEXT.md. |
| 4 | 1700 | `listening` | label: "Listening", transcript ×2, energy 0.48 | The promise is made. Four words that create the whole problem. |
| 5 | 2100 | `thinking` | label: "Checking your day…" | Two truthful stages: finding what matters, then checking the day. |
| 6 | 1400 | `concerned` | label: "That clashes with your day" | THE TURN. A held beat of concern BEFORE the panel appears — the face reacts first, so the information feels like it comes from the character, not from a notification system. |
| 7 | 4200 | `speaking` | caption, panel: "That clashes with your day", energy 0.6, face 10% | THE HERO MOMENT. Face dims to 10% but keeps a speaking glow riding output energy. Four facts, top to bottom, readable in five seconds. Two coral (the problem), one teal (the way out). |
| 8 | 2000 | `acknowledging` | label: "Got it · Send revised prototype · 4:30 PM" | Celebration is SMALL. The agent solved a problem; it should not gloat. |

**Spoken lines**

> Champ, you're booked until three and the prototype is still being worked on. Should we move that commitment to 4:30?

---

### Rubber duck

Deskemon helps by being present and mostly silent — the restraint scenario.

| | |
|---|---|
| **Trigger** | User says "let me think out loud" or taps and holds the face. |
| **Adapters** | `voiceActivitySource` · `transcriptionSource` · `liveVoiceSource` |
| **Runtime** | 17.2s · 7 beats |

> **Honesty.** Nothing is saved unless asked. This mode LISTENS and occasionally asks one question — it does not advise.

| # | ms | Expression | On screen | Why |
|---|---|---|---|---|
| 1 | 1400 | `neutral` | label: "Quietly listening nearby" | Baseline. |
| 2 | 1600 | `happy` | label: "Go ahead, I am listening" | Warm entry. Mode is explicitly entered — Deskemon does not decide on its own that you are thinking aloud. |
| 3 | 3000 | `listening` | label: "Thinking out loud · nothing saved", transcript ×1, energy 0.5 | THE LABEL IS THE FEATURE: "nothing saved" is visible for the whole mode. That promise is what makes thinking aloud safe. |
| 4 | 2600 | `focused` | label: "Thinking out loud · nothing saved", transcript ×2, energy 0.34 | Focused: eyes narrow slightly. Deskemon STAYS SILENT while the thought develops. The restraint is the whole design. |
| 5 | 3600 | `speaking` | caption, energy 0.45, face 42% | ONE Socratic question, and only after a real pause. It reframes rather than answers. Face dims only to 42% — no panel here, so the character stays present. |
| 6 | 2400 | `listening` | label: "Thinking out loud · nothing saved", energy 0.4 | Immediately returns to listening. It asked; it does not press. |
| 7 | 2600 | `curious` | panel: "Keep anything from that?", face 12% | On exit, BOTH options are primary — discarding is not the lesser choice. Default is that nothing persists. |

**Spoken lines**

> What would break if the two panels could never open at once?

---

### Codex at work

Continuity of identity: the same companion that lives on the computer, now on the desk.

| | |
|---|---|
| **Trigger** | Codex task state changes — running, needs input, ready, blocked. |
| **Adapters** | `codexStateSource` |
| **Runtime** | 10.7s · 5 beats |

> **Honesty.** Seeded in this build. A real implementation would subscribe to Codex task state.

| # | ms | Expression | On screen | Why |
|---|---|---|---|---|
| 1 | 1500 | `processing` | label: "Codex is working" | Ring eyes (C Ɔ) — the visual language of work in progress. Ambient, glanceable, no panel. You can read it from across the room. |
| 2 | 1800 | `curious` | label: "Codex needs you" | THE STATE THAT JUSTIFIES THE BODY. Your laptop may be on another desktop or behind a window — the phone beside it cannot be missed. |
| 3 | 3200 | `focused` | panel: "Codex needs a decision", face 12% | "Blocked for 4 minutes" is the useful number — it converts a passive notification into a cost you can feel. |
| 4 | 1800 | `processing` | label: "Codex is working" | Straight back to work once unblocked. |
| 5 | 2400 | `celebrating` | label: "Codex finished", toast | Wedge eyes plus radiating ticks. Brief — one bounce and back. The same celebration the pet does on the computer, which is the point: same companion, new senses. |

---
