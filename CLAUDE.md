# Claude Implementation Brief — Deskemon UI, Interaction, and Motion

Read `PROJECT_CONTEXT.md`, `README.md`, and `RESUME_HERE.md` before changing the project. Treat `PROJECT_CONTEXT.md` as the product source of truth for this prototype.

Your assignment is to create the complete mobile-first UI, interaction flow, and animation system for the Deskemon hackathon prototype. Make it polished enough to demonstrate on a phone and record in a two-minute video.

## Experience principle

The pet is the interface. Do not lead with a dashboard, transcript list, or conventional chatbot. The main screen should make Deskemon feel physically present on the desk. Information and controls appear around the companion only when they are needed.

Deskemon should feel calm, observant, warm, and competent. Avoid noisy gradients, excessive glass effects, floating decorative particles, large walls of text, or constant motion.

## Visual direction

- Mobile portrait first, designed for a phone standing beside a laptop.
- Use the supplied transparent Baymax artwork from `assets/character/baymax-reference.png`.
- Existing motion references are under `assets/pet/motions/` and `assets/pet/motion-preview.html`.
- Give the white character enough contrast through the environment rather than adding a heavy card around it.
- Suggested environment: deep midnight blue or soft blue-gray with a warm ambient glow and restrained coral/teal accents for state changes.
- Use generous empty space and large, glanceable status labels.
- Keep interactive targets large enough for one-handed use.
- Make the design work on both a dark phone screen and in a bright hackathon venue.

## Main screen hierarchy

The default screen contains:

1. a compact top status area showing privacy/listening state and current Slack presence;
2. the large animated companion in the center;
3. one short state label below it, such as “Quietly listening nearby”;
4. a subtle live audio indicator when speech is present;
5. a contextual bottom area that appears only for transcripts, memories, conflicts, summaries, or confirmation actions;
6. one persistent, unmistakable mute/privacy control.

Do not make the user navigate through several screens before seeing the pet.

## Required state machine

Implement these states as explicit UI states rather than scattered booleans:

### Sleeping

- Character rests with very slow breathing.
- Screen is dimmer.
- Copy: “Resting” or “Privacy mode.”
- Microphone is visibly inactive.

### Attentive

- Default desk state.
- Gentle breathing and rare sway.
- Copy: “Quietly listening nearby.”
- Show a small, persistent trust indicator; avoid a dramatic recording symbol when no speech is being processed.

### Speech detected

- Character becomes alert through a small lift or quicker response.
- Audio indicator responds smoothly to volume.
- Copy: “I hear a conversation.”
- Do not immediately interrupt or display a full transcript.

### Listening

- Use a soft breathing waveform or subtle ring around/under the pet.
- Reveal the current transcript in a restrained, fading caption treatment.
- Maintain a clear visual indication that audio is being processed.

### Thinking

- Character settles into a focused motion.
- Copy cycles carefully through truthful states such as “Finding what matters…” and “Checking your day…”
- Do not show fake technical logs.

### Memory candidate

- Present a compact bottom sheet with extracted meaning rather than the entire transcript.
- Example: “Possible commitment · Revised prototype · Today at 3:00 PM.”
- Actions: **Remember**, **Edit**, and **Forget**.
- Default behavior should not silently confirm ambiguous memories.

### Conflict detected

- Make this the hero agentic moment.
- Character speaks while a concise conflict card appears.
- Show the spoken commitment, the conflicting calendar/work item, and the suggested resolution.
- Example: “Portfolio review · 2:00–3:00” conflicts with “Send revised prototype · 3:00.”
- Primary action: **Move to 4:30**.
- Secondary actions: **Keep 3:00** and **Forget this**.

### Speaking

- Synchronize a subtle mouthless speaking treatment with audio energy: torso pulse, eye-line response, or glow beneath the pet. Do not invent a mouth.
- Show captions for accessibility and noisy venues.
- Let the user interrupt naturally.

### Remembering / success

- Use the small bounce or celebration motion.
- Brief confirmation: “Got it. Revised prototype · 4:30 PM.”
- Return to the attentive state automatically after the acknowledgment.

### Meeting summary ready

- Present a clean summary sheet with sections for Decisions, Action items, Commitments, and Open questions.
- Make owner and time information scan quickly.
- Include **Save summary** and **Discard** actions.
- Avoid a dense transcript-focused screen.

### Away / Slack updated

- Character appears asleep or looks toward the empty workspace.
- Show a small transition toast: “You stepped away · Slack set to Away.”
- When the user returns, restore the appropriate presence and show a brief welcome-back motion.

### Error / offline

- Use the restrained deflate motion.
- Explain what failed in plain language.
- Preserve the candidate transcript or action when recovery is possible.
- Offer **Try again** and **Use demo mode** where appropriate.

## Primary demo sequence

Build a deterministic demo path that works with or without live integrations:

1. Start in Attentive.
2. Trigger Speech detected.
3. Reveal this conversation progressively:
   - Coworker: “Can you send me the revised prototype before three?”
   - Champ: “Yes, I’ll do it.”
4. Transition to Thinking.
5. Reveal the extracted commitment.
6. Show the 2:00–3:00 calendar conflict and that the Codex task is still running.
7. Have Deskemon propose 4:30 through voice/captions.
8. Let the user approve the change.
9. Show the success bounce and saved memory.
10. Offer the action-oriented conversation summary.
11. Provide a separate presence demonstration: user steps away and Slack changes to Away.

The sequence should be understandable without narration, while still leaving room for the presenter to explain the idea.

## Demo controls

Create a hidden or unobtrusive demo controller available through `?demo=1`, a long press, or a keyboard shortcut. It must allow the presenter to:

- reset the complete scenario;
- move forward or backward by state;
- simulate microphone activity;
- simulate the transcript;
- simulate a calendar conflict;
- trigger voice playback or caption-only fallback;
- simulate leaving and returning to the desk;
- toggle API-connected and seeded modes.

Keep these controls out of the normal product experience. Clearly document which integrations are real and which are simulated.

## Interaction requirements

- Every visible control must work.
- Never strand the presenter in a modal or permission state.
- Preserve state if the screen rotates or briefly loses focus where practical.
- Use optimistic transitions only for reversible demo actions.
- Ask for confirmation before saving a commitment or updating an external system.
- Support “forget that” as both a visible action and a voice-intent hook.
- Add captions for every spoken Deskemon response.
- Respect reduced-motion preferences with calm fades and a still character.
- Provide strong focus states, keyboard navigation for desktop rehearsal, and sufficient color contrast.

## Motion direction

Motion should communicate state and preserve the character's soft inflatable quality:

- Idle breathing: roughly 3–5 seconds, tiny vertical scale change, feet visually anchored.
- Alert: 250–400 ms lift with a soft settle.
- Listening: low-amplitude rhythmic response driven by audio energy, damped to prevent jitter.
- Thinking: slow 1–2 degree lean or contained side-to-side focus movement.
- Speaking: smooth response to output audio with easing; never rapid flashing.
- Success: one small anticipation, 6–10 px rise, soft landing, then stillness.
- Waiting: gentle forward or side lean, held long enough to read.
- Error: subtle compression/deflation, then recovery when retried.
- Away: slow settling motion into sleep.

Use transform-based animation where possible. Anchor transforms near the feet so the pet does not float. Prefer spring or ease-in-out curves with controlled damping. Avoid simultaneous scaling, rotation, translation, glow, and particle effects; one or two coordinated cues per state are enough.

The supplied art is one flattened character. Do not pretend the current asset has independently rigged arms or facial components. If the implementation needs true waving, blinking, or head turning, create that as a separate layered asset task and preserve the supplied look.

## Audio behavior

- Smooth the input volume before mapping it to visual motion.
- Use a noise floor so keyboards and room hum do not constantly animate the pet.
- Keep a short pre-roll buffer so the opening of speech is not lost.
- Use silence to end a conversational segment.
- Visually distinguish local attentiveness from cloud processing.
- Prevent the pet's own speaker output from being treated as a new user utterance where possible.

## Data and integration seams

Define small adapters so real services can replace seeded data without rebuilding the UI:

- `voiceActivitySource`
- `transcriptionSource`
- `liveVoiceSource`
- `calendarSource`
- `codexStateSource`
- `memoryStore`
- `slackPresenceSource`
- `physicalPresenceSource`

The UI state machine should consume normalized events from these adapters. Seed the exact judge scenario above for demo mode.

## Suggested routes or views

Keep navigation minimal:

- `/` — live companion screen;
- `/memories` — recent confirmed commitments and decisions;
- `/summary/:id` — one action-oriented meeting summary;
- `/settings` — microphone, privacy, integrations, voice, and demo-mode disclosure.

If a single-screen prototype communicates the story more clearly, use bottom sheets instead of separate routes.

## Acceptance criteria

The UI work is complete when:

- it runs cleanly in a modern mobile browser;
- the pet is the visual center of the experience;
- all required states can be triggered deterministically;
- the primary scenario completes without dead ends;
- transitions feel smooth at 60 fps on a phone;
- reduced-motion mode remains usable;
- the listening and privacy states are always clear;
- the conflict and confirmation moment is understandable within five seconds;
- the meeting summary emphasizes actions and decisions;
- Slack presence change is visible without dominating the demo;
- the experience can be recorded vertically or framed inside a horizontal two-minute demo;
- setup and demo instructions are documented in the project README.

## Working rule for the hackathon

Build a coherent, camera-ready interaction before expanding functionality. If a visual flourish threatens microphone, voice, conflict detection, confirmation, or demo reliability, protect the complete primary flow first.

