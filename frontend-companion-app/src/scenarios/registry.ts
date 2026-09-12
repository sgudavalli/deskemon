import type { ExpressionName } from '../face/types';

/**
 * The scenario registry.
 *
 * Every scenario is DATA, not bespoke code. One definition drives the
 * simulator, the storyboard view, and docs/SCENARIOS.md, so the three can
 * never drift apart.
 *
 * Nothing here consumes real input. Timings are the animation spec: this is
 * what Codex should build against.
 */

export type Category = 'wellbeing' | 'work';

/** What the panel shows during a beat, if anything. */
export interface PanelSpec {
  title: string;
  /** Label/value pairs. `tone` colours the value. */
  facts?: { label: string; value: string; tone?: 'coral' | 'teal' }[];
  /** Bulleted sections, for summaries. */
  sections?: { title: string; items: string[] }[];
  body?: string;
  actions?: { label: string; kind: 'primary' | 'secondary' | 'ghost' }[];
  accent?: 'coral' | 'teal';
}

export interface Beat {
  /** Milliseconds this beat holds before the next one starts. */
  ms: number;
  expression: ExpressionName;
  /** The short line under the face. Omit to hide it. */
  label?: string;
  /** Spoken line — always shown as a caption. */
  caption?: string;
  /** Transcript lines revealed so far. */
  transcript?: { speaker: string; text: string; isOwner: boolean }[];
  panel?: PanelSpec;
  toast?: string;
  /** 0–1 simulated audio energy driving arcs and glow. */
  energy?: number;
  /** Face brightness. Drops when a panel takes priority. */
  faceDim?: number;
  /**
   * Keep the label visible even when a transcript is showing. For labels that
   * are a PROMISE rather than a status — "nothing saved" must never disappear.
   */
  persistLabel?: boolean;
  /** Director's note: why this beat looks the way it does. */
  note: string;
}

export interface Scenario {
  id: string;
  category: Category;
  title: string;
  /** One line on what this proves. */
  premise: string;
  /** What sets it off in a real build. */
  trigger: string;
  /** Which adapters a real implementation would consume. */
  adapters: string[];
  /** Honest statement of what would be real vs inferred. */
  honesty: string;
  beats: Beat[];
}

/* ------------------------------------------------------------------ *
 * PERSONAL WELLBEING
 * ------------------------------------------------------------------ */

const sedentary: Scenario = {
  id: 'sedentary',
  category: 'wellbeing',
  title: 'Time to stand',
  premise:
    'Deskemon notices continuous desk presence and suggests a break, without nagging.',
  trigger: 'Uninterrupted presence at the desk for 90 minutes.',
  adapters: ['physicalPresenceSource', 'calendarSource'],
  honesty:
    'Measures PRESENCE DURATION, not posture. Deskemon has no camera — it knows you have not left, not how you are sitting.',
  beats: [
    {
      ms: 1600,
      expression: 'neutral',
      label: 'Quietly listening nearby',
      note: 'Baseline. Idle breathing, occasional blink. Nothing is happening yet.',
    },
    {
      ms: 1400,
      expression: 'curious',
      label: 'You have been here a while',
      note: 'Gentle attention-getting: a small lift and head tilt. NOT an alarm — this is a suggestion, not an alert.',
    },
    {
      ms: 3200,
      expression: 'concerned',
      faceDim: 0.12,
      panel: {
        title: 'You have been at the desk 90 minutes',
        facts: [
          { label: 'Since', value: '1:10 PM · no break' },
          { label: 'Next meeting', value: 'Portfolio review · 2:00 PM', tone: 'teal' },
        ],
        body: 'There is a gap now. A good moment to stand up.',
        actions: [
          { label: 'Remind me in 20', kind: 'secondary' },
          { label: 'Thanks', kind: 'primary' },
        ],
      },
      note: 'Evidence first, advice second. Showing the calendar gap makes it USEFUL rather than generic — it found a moment that actually works.',
    },
    {
      ms: 1800,
      expression: 'happy',
      label: 'Enjoy the stretch',
      note: 'Warm acknowledgement, then straight back to attentive. Never lingers or moralises.',
    },
  ],
};

const hydration: Scenario = {
  id: 'hydration',
  category: 'wellbeing',
  title: 'Water',
  premise: 'The lightest possible nudge — no panel, no decision, no friction.',
  trigger: 'Scheduled interval, suppressed while speech is detected.',
  adapters: ['physicalPresenceSource', 'voiceActivitySource'],
  honesty:
    'Time-based only. Deskemon cannot see whether you actually drank anything.',
  beats: [
    {
      ms: 1400,
      expression: 'neutral',
      label: 'Quietly listening nearby',
      note: 'Baseline.',
    },
    {
      ms: 2600,
      expression: 'happy',
      label: 'Water?',
      toast: 'A sip would be good',
      note: 'THE WHOLE SCENARIO IS ONE BEAT. No panel, no buttons, no dismissal needed. The lightest touch in the system — it earns the right to interrupt precisely by asking nothing. Contrast this deliberately with the conflict scenario.',
    },
    {
      ms: 1400,
      expression: 'neutral',
      label: 'Quietly listening nearby',
      note: 'Fades back on its own. Ignoring it is a valid response.',
    },
  ],
};

const medicine: Scenario = {
  id: 'medicine',
  category: 'wellbeing',
  title: 'Medicine',
  premise:
    'A reminder that must be acknowledged — the one wellbeing case where being ignored is a failure.',
  trigger: 'Scheduled time from a user-set medication routine.',
  adapters: ['memoryStore', 'physicalPresenceSource'],
  honesty:
    'Deskemon records that you CONFIRMED, not that you took anything. Never presented as a medical record.',
  beats: [
    {
      ms: 1400,
      expression: 'neutral',
      label: 'Quietly listening nearby',
      note: 'Baseline.',
    },
    {
      ms: 1200,
      expression: 'determined',
      label: '2:00 PM',
      note: 'Determined, not concerned. This reminder is firm and certain — it does not hedge. Held slightly longer than the water nudge.',
    },
    {
      ms: 3400,
      expression: 'focused',
      faceDim: 0.12,
      panel: {
        title: 'Time for your medicine',
        facts: [
          { label: 'What', value: 'Vitamin D · 1 tablet' },
          { label: 'Scheduled', value: 'Daily at 2:00 PM' },
        ],
        actions: [
          { label: 'Taken', kind: 'primary' },
          { label: 'Snooze 15 min', kind: 'secondary' },
          { label: 'Skip today', kind: 'ghost' },
        ],
      },
      note: 'Explicit acknowledgement REQUIRED — unlike water, this does not fade away on its own. Three honest outcomes: taken, later, skipped. "Skip" is deliberately available; pretending it is not an option would be dishonest.',
    },
    {
      ms: 1800,
      expression: 'acknowledging',
      label: 'Logged · 2:00 PM',
      note: 'Small bounce. Records the CONFIRMATION with a timestamp.',
    },
  ],
};

const food: Scenario = {
  id: 'food',
  category: 'wellbeing',
  title: 'You skipped lunch',
  premise:
    'Deskemon connects an observed gap to your actual calendar, and offers a real window.',
  trigger: 'Past 2:30 PM with no meal-break gap in presence data.',
  adapters: ['physicalPresenceSource', 'calendarSource'],
  honesty:
    'Infers from an absence of any away-from-desk gap. It cannot see food — only that you never left.',
  beats: [
    {
      ms: 1400,
      expression: 'neutral',
      label: 'Quietly listening nearby',
      note: 'Baseline.',
    },
    {
      ms: 1300,
      expression: 'concerned',
      label: 'It is past two thirty',
      note: 'Mild concern — downturned arcs. Caring, never scolding.',
    },
    {
      ms: 3400,
      expression: 'concerned',
      faceDim: 0.12,
      panel: {
        title: 'You have not stepped away since 9:40',
        facts: [
          { label: 'Now', value: '2:34 PM' },
          { label: 'Free until', value: '4:00 PM', tone: 'teal' },
        ],
        body: 'There is a clear window. Want to take it?',
        actions: [
          { label: 'Order something', kind: 'primary' },
          { label: 'I ate already', kind: 'secondary' },
          { label: 'Not now', kind: 'ghost' },
        ],
      },
      note: '"I ate already" matters — it lets the user correct a wrong inference instead of arguing with the device. Hands off to the ordering scenario.',
    },
  ],
};

const ordering: Scenario = {
  id: 'ordering',
  category: 'wellbeing',
  title: 'Ordering lunch',
  premise:
    'The strictest permission gate in the system: the only scenario that spends money.',
  trigger: 'User accepts the food prompt, or says "order my usual".',
  adapters: ['memoryStore', 'liveVoiceSource'],
  honesty:
    'STOPS SHORT OF PURCHASE. Deskemon prepares the order and hands off to the vendor app. It never completes a transaction on the user\'s behalf.',
  beats: [
    {
      ms: 1400,
      expression: 'listening',
      label: 'Listening',
      energy: 0.55,
      transcript: [{ speaker: 'Champ', text: 'Order my usual.', isOwner: true }],
      note: 'Sound arcs respond to real speech energy. Short, natural phrasing.',
    },
    {
      ms: 1600,
      expression: 'thinking',
      label: 'Finding what you usually order…',
      note: 'Truthful progress copy — it is genuinely looking up a stored preference, not fabricating.',
    },
    {
      ms: 3600,
      expression: 'focused',
      faceDim: 0.12,
      panel: {
        title: 'Your usual',
        accent: 'teal',
        facts: [
          { label: 'From', value: 'Sattvic Kitchen' },
          { label: 'Order', value: 'Dal khichdi + salad' },
          { label: 'Total', value: '₹320', tone: 'teal' },
          { label: 'Arrives', value: 'About 3:05 PM' },
        ],
        body: 'I will open the app for you to confirm and pay.',
        actions: [
          { label: 'Open to confirm', kind: 'primary' },
          { label: 'Change order', kind: 'secondary' },
          { label: 'Cancel', kind: 'ghost' },
        ],
      },
      note: 'CRITICAL: every detail shown BEFORE any action — vendor, items, exact price, ETA. The button says "Open to confirm", never "Order now". Deskemon does not hold payment details and does not complete the purchase.',
    },
    {
      ms: 1800,
      expression: 'acknowledging',
      label: 'Opened · confirm in the app',
      note: 'Hands off cleanly. Deskemon takes no credit for a purchase it did not make.',
    },
  ],
};

const overload: Scenario = {
  id: 'overload',
  category: 'wellbeing',
  title: 'A long stretch',
  premise:
    'Observed load, not diagnosed emotion. The scenario that must not overclaim.',
  trigger:
    'Three hours of near-continuous speech with no gap longer than four minutes.',
  adapters: ['voiceActivitySource', 'calendarSource', 'physicalPresenceSource'],
  honesty:
    'NOT stress detection. Deskemon has no camera, heart rate, or wearable — it measures TALKING TIME and GAPS. It reports what it counted and lets the user draw the conclusion. Never says "you seem stressed".',
  beats: [
    {
      ms: 1500,
      expression: 'neutral',
      label: 'Quietly listening nearby',
      note: 'Baseline.',
    },
    {
      ms: 1500,
      expression: 'curious',
      label: 'That was a long one',
      note: 'Notices as the conversation ends — never interrupts mid-conversation. Timing is the whole courtesy here.',
    },
    {
      ms: 3800,
      expression: 'concerned',
      faceDim: 0.12,
      panel: {
        title: 'Three hours of back-to-back conversation',
        facts: [
          { label: 'Since', value: '11:00 AM' },
          { label: 'Longest gap', value: '4 minutes', tone: 'coral' },
          { label: 'Next commitment', value: 'Nothing until 4:30', tone: 'teal' },
        ],
        body: 'Nothing needs you right now.',
        actions: [
          { label: 'Take twenty', kind: 'primary' },
          { label: 'I am fine', kind: 'ghost' },
        ],
      },
      note: 'THE MOST IMPORTANT COPY IN THE PROJECT. It states COUNTED FACTS — hours, gap length, next commitment — and never diagnoses. "Nothing needs you right now" removes the excuse rather than pathologising the person. "I am fine" is a real, respected answer.',
    },
    {
      ms: 1800,
      expression: 'happy',
      label: 'I will keep things quiet',
      note: 'If accepted, it goes quiet — the promise is actually kept, not just stated.',
    },
  ],
};

/* ------------------------------------------------------------------ *
 * WORK
 * ------------------------------------------------------------------ */

const commitment: Scenario = {
  id: 'commitment',
  category: 'work',
  title: 'Commitment captured',
  premise:
    'The clean path: a spoken promise becomes a saved, confirmed commitment.',
  trigger: 'Speech containing a commitment and a time.',
  adapters: ['voiceActivitySource', 'transcriptionSource', 'memoryStore'],
  honesty:
    'Extraction is seeded in this build. The INTERACTION — confirm before saving — is real and complete.',
  beats: [
    {
      ms: 1300,
      expression: 'neutral',
      label: 'Quietly listening nearby',
      note: 'Baseline.',
    },
    {
      ms: 1100,
      expression: 'curious',
      label: 'I hear a conversation',
      energy: 0.4,
      note: 'Small lift. Does NOT show a transcript yet — it has not decided anything matters.',
    },
    {
      ms: 2400,
      expression: 'listening',
      label: 'Listening',
      energy: 0.62,
      transcript: [
        { speaker: 'Coworker', text: 'Can you review the deck by Thursday?', isOwner: false },
      ],
      note: 'Sound arcs track speech energy. Transcript fades in progressively, never dumped at once.',
    },
    {
      ms: 1900,
      expression: 'listening',
      label: 'Listening',
      energy: 0.5,
      transcript: [
        { speaker: 'Coworker', text: 'Can you review the deck by Thursday?', isOwner: false },
        { speaker: 'Champ', text: 'Yes, I will look at it Wednesday night.', isOwner: true },
      ],
      note: 'The owner line is bright, the earlier line dims. The commitment lands on the second line.',
    },
    {
      ms: 2000,
      expression: 'thinking',
      label: 'Finding what matters…',
      note: 'Head tilt plus cycling dots. Copy rotates through truthful stages — never fake logs.',
    },
    {
      ms: 3400,
      expression: 'focused',
      faceDim: 0.12,
      panel: {
        title: 'Possible commitment',
        facts: [
          { label: 'What', value: 'Review the deck' },
          { label: 'When', value: 'Wednesday evening' },
          { label: 'For', value: 'Thursday deadline' },
        ],
        actions: [
          { label: 'Remember', kind: 'primary' },
          { label: 'Edit', kind: 'secondary' },
          { label: 'Forget', kind: 'ghost' },
        ],
      },
      note: 'Shows extracted MEANING, not the raw transcript. Never saves silently — ambiguity always asks.',
    },
    {
      ms: 2000,
      expression: 'acknowledging',
      label: 'Got it · Wednesday evening',
      note: 'Small anticipation, 8px rise, soft landing, then stillness. Returns to attentive automatically.',
    },
  ],
};

const conflict: Scenario = {
  id: 'conflict',
  category: 'work',
  title: 'Conflict caught',
  premise:
    'The full loop: physical conversation → digital context → conflict → permission → action.',
  trigger: 'An extracted commitment that collides with calendar or active work.',
  adapters: [
    'voiceActivitySource',
    'transcriptionSource',
    'calendarSource',
    'codexStateSource',
    'liveVoiceSource',
    'memoryStore',
  ],
  honesty:
    'Calendar and Codex state are seeded. The conflict logic is deterministic, not model-inferred.',
  beats: [
    {
      ms: 1200,
      expression: 'neutral',
      label: 'Quietly listening nearby',
      note: 'Baseline.',
    },
    {
      ms: 1000,
      expression: 'curious',
      label: 'I hear a conversation',
      energy: 0.42,
      note: 'Alert lift, 250–400ms with a soft settle.',
    },
    {
      ms: 2300,
      expression: 'listening',
      label: 'Listening',
      energy: 0.64,
      transcript: [
        {
          speaker: 'Coworker',
          text: 'Can you send me the revised prototype before three?',
          isOwner: false,
        },
      ],
      note: 'The judge scenario, verbatim from PROJECT_CONTEXT.md.',
    },
    {
      ms: 1700,
      expression: 'listening',
      label: 'Listening',
      energy: 0.48,
      transcript: [
        {
          speaker: 'Coworker',
          text: 'Can you send me the revised prototype before three?',
          isOwner: false,
        },
        { speaker: 'Champ', text: "Yes, I'll do it.", isOwner: true },
      ],
      note: 'The promise is made. Four words that create the whole problem.',
    },
    {
      ms: 2100,
      expression: 'thinking',
      label: 'Checking your day…',
      note: 'Two truthful stages: finding what matters, then checking the day.',
    },
    {
      ms: 1400,
      expression: 'concerned',
      label: 'That clashes with your day',
      note: 'THE TURN. A held beat of concern BEFORE the panel appears — the face reacts first, so the information feels like it comes from the character, not from a notification system.',
    },
    {
      ms: 4200,
      expression: 'speaking',
      faceDim: 0.1,
      energy: 0.6,
      caption:
        "Champ, you're booked until three and the prototype is still being worked on. Should we move that commitment to 4:30?",
      panel: {
        title: 'That clashes with your day',
        accent: 'coral',
        facts: [
          { label: 'You committed to', value: 'Send revised prototype · 3:00 PM' },
          { label: "But you're booked", value: 'Portfolio review · 2:00–3:00 PM', tone: 'coral' },
          { label: 'And Codex is still working', value: 'Revised prototype build · running', tone: 'coral' },
          { label: 'Suggested', value: 'Move to 4:30 PM', tone: 'teal' },
        ],
        actions: [
          { label: 'Move to 4:30 PM', kind: 'primary' },
          { label: 'Keep 3:00 PM', kind: 'secondary' },
          { label: 'Forget this', kind: 'ghost' },
        ],
      },
      note: 'THE HERO MOMENT. Face dims to 10% but keeps a speaking glow riding output energy. Four facts, top to bottom, readable in five seconds. Two coral (the problem), one teal (the way out).',
    },
    {
      ms: 2000,
      expression: 'acknowledging',
      label: 'Got it · Send revised prototype · 4:30 PM',
      note: 'Celebration is SMALL. The agent solved a problem; it should not gloat.',
    },
  ],
};

const rubberDuck: Scenario = {
  id: 'rubber-duck',
  category: 'work',
  title: 'Rubber duck',
  premise:
    'Deskemon helps by being present and mostly silent — the restraint scenario.',
  trigger: 'User says "let me think out loud" or taps and holds the face.',
  adapters: ['voiceActivitySource', 'transcriptionSource', 'liveVoiceSource'],
  honesty:
    'Nothing is saved unless asked. This mode LISTENS and occasionally asks one question — it does not advise.',
  beats: [
    {
      ms: 1400,
      expression: 'neutral',
      label: 'Quietly listening nearby',
      note: 'Baseline.',
    },
    {
      ms: 1600,
      expression: 'happy',
      label: 'Go ahead, I am listening',
      note: 'Warm entry. Mode is explicitly entered — Deskemon does not decide on its own that you are thinking aloud.',
    },
    {
      ms: 3000,
      expression: 'listening',
      label: 'Thinking out loud · nothing saved',
      persistLabel: true,
      energy: 0.5,
      transcript: [
        {
          speaker: 'Champ',
          text: 'The state machine keeps breaking when two panels overlap…',
          isOwner: true,
        },
      ],
      note: 'THE LABEL IS THE FEATURE: "nothing saved" is visible for the whole mode. That promise is what makes thinking aloud safe.',
    },
    {
      ms: 2600,
      expression: 'focused',
      label: 'Thinking out loud · nothing saved',
      persistLabel: true,
      energy: 0.34,
      transcript: [
        {
          speaker: 'Champ',
          text: 'The state machine keeps breaking when two panels overlap…',
          isOwner: true,
        },
        {
          speaker: 'Champ',
          text: '…and I keep patching the symptom instead of the cause.',
          isOwner: true,
        },
      ],
      note: 'Focused: eyes narrow slightly. Deskemon STAYS SILENT while the thought develops. The restraint is the whole design.',
    },
    {
      ms: 3600,
      expression: 'speaking',
      faceDim: 0.42,
      energy: 0.45,
      caption: 'What would break if the two panels could never open at once?',
      note: 'ONE Socratic question, and only after a real pause. It reframes rather than answers. Face dims only to 42% — no panel here, so the character stays present.',
    },
    {
      ms: 2400,
      expression: 'listening',
      label: 'Thinking out loud · nothing saved',
      energy: 0.4,
      note: 'Immediately returns to listening. It asked; it does not press.',
    },
    {
      ms: 2600,
      expression: 'curious',
      faceDim: 0.12,
      panel: {
        title: 'Keep anything from that?',
        body: 'Nothing has been saved.',
        actions: [
          { label: 'Save the insight', kind: 'primary' },
          { label: 'Discard it all', kind: 'primary' },
        ],
      },
      note: 'On exit, BOTH options are primary — discarding is not the lesser choice. Default is that nothing persists.',
    },
  ],
};

const codexStatus: Scenario = {
  id: 'codex-status',
  category: 'work',
  title: 'Codex at work',
  premise:
    'Continuity of identity: the same companion that lives on the computer, now on the desk.',
  trigger: 'Codex task state changes — running, needs input, ready, blocked.',
  adapters: ['codexStateSource'],
  honesty:
    'Seeded in this build. A real implementation would subscribe to Codex task state.',
  beats: [
    {
      ms: 1500,
      expression: 'processing',
      label: 'Codex is working',
      note: 'Ring eyes (C Ɔ) — the visual language of work in progress. Ambient, glanceable, no panel. You can read it from across the room.',
    },
    {
      ms: 1800,
      expression: 'curious',
      label: 'Codex needs you',
      note: 'THE STATE THAT JUSTIFIES THE BODY. Your laptop may be on another desktop or behind a window — the phone beside it cannot be missed.',
    },
    {
      ms: 3200,
      expression: 'focused',
      faceDim: 0.12,
      panel: {
        title: 'Codex needs a decision',
        facts: [
          { label: 'Task', value: 'Revised prototype build' },
          { label: 'Waiting on', value: 'Which layout to keep', tone: 'coral' },
          { label: 'Blocked for', value: '4 minutes', tone: 'coral' },
        ],
        body: 'It cannot continue until you choose.',
        actions: [
          { label: 'Show me', kind: 'primary' },
          { label: 'Later', kind: 'ghost' },
        ],
      },
      note: '"Blocked for 4 minutes" is the useful number — it converts a passive notification into a cost you can feel.',
    },
    {
      ms: 1800,
      expression: 'processing',
      label: 'Codex is working',
      note: 'Straight back to work once unblocked.',
    },
    {
      ms: 2400,
      expression: 'celebrating',
      label: 'Codex finished',
      toast: 'Revised prototype build · done',
      note: 'Wedge eyes plus radiating ticks. Brief — one bounce and back. The same celebration the pet does on the computer, which is the point: same companion, new senses.',
    },
  ],
};

export const SCENARIOS: Scenario[] = [
  sedentary,
  hydration,
  medicine,
  food,
  ordering,
  overload,
  commitment,
  conflict,
  rubberDuck,
  codexStatus,
];

export const CATEGORY_LABEL: Record<Category, string> = {
  wellbeing: 'Personal wellbeing',
  work: 'Work',
};

export function totalMs(s: Scenario): number {
  return s.beats.reduce((n, b) => n + b.ms, 0);
}
