import type { Adapters } from './index';
import type {
  CalendarEvent,
  CodexTask,
  Commitment,
  MeetingSummary,
  SlackPresence,
  TranscriptLine,
} from '../state/types';

/**
 * The exact judge scenario from PROJECT_CONTEXT.md, seeded.
 *
 * Coworker: "Can you send me the revised prototype before three?"
 * Champ:    "Yes, I'll do it."
 * → commitment at 3:00 conflicts with Portfolio review 2:00–3:00,
 *   and the Codex task is still running → propose 4:30.
 */

export const SCENARIO_TRANSCRIPT: TranscriptLine[] = [
  {
    id: 't1',
    speaker: 'Coworker',
    text: 'Can you send me the revised prototype before three?',
    isOwner: false,
  },
  { id: 't2', speaker: 'Champ', text: "Yes, I'll do it.", isOwner: true },
];

export const SCENARIO_COMMITMENT: Commitment = {
  id: 'c1',
  what: 'Send revised prototype',
  time: '3:00 PM',
  at: 'today-15:00',
};

export const SCENARIO_EVENT: CalendarEvent = {
  id: 'e1',
  title: 'Portfolio review',
  start: '2:00 PM',
  end: '3:00 PM',
};

export const SCENARIO_TASK: CodexTask = {
  id: 'k1',
  title: 'Revised prototype build',
  status: 'running',
};

export const SCENARIO_SUGGESTION = '4:30 PM';

export const SCENARIO_SPOKEN =
  "Champ, you're booked until three and the prototype is still being worked on. Should we move that commitment to 4:30?";

export const SCENARIO_SUMMARY: MeetingSummary = {
  id: 's1',
  title: 'Desk conversation · this afternoon',
  decisions: ['Revised prototype will ship today, after the portfolio review.'],
  actionItems: [
    { text: 'Send revised prototype', owner: 'Champ', due: '4:30 PM' },
    { text: 'Review prototype and reply', owner: 'Coworker', due: 'End of day' },
  ],
  commitments: ['Champ → revised prototype by 4:30 PM'],
  openQuestions: ['Does the coworker need the source files as well?'],
};

/** Minimal pub/sub used by the seeded adapters. */
function emitter<T>() {
  const subs = new Set<(v: T) => void>();
  return {
    subscribe(cb: (v: T) => void) {
      subs.add(cb);
      return () => subs.delete(cb);
    },
    emit(v: T) {
      subs.forEach((s) => s(v));
    },
  };
}

export function createSeededAdapters(): Adapters & {
  /** Demo hooks — not part of the adapter contract. */
  _emitTranscript(line: TranscriptLine): void;
  _emitEnergy(e: number): void;
  _setSpeaking(v: boolean): void;
  _setAtDesk(v: boolean): void;
} {
  const energyBus = emitter<number>();
  const transcriptBus = emitter<TranscriptLine>();
  const slackBus = emitter<SlackPresence>();
  const presenceBus = emitter<boolean>();
  const memoryBus = emitter<void>();

  let speaking = false;
  let slack: SlackPresence = 'available';
  let atDesk = true;
  let commitments: Commitment[] = [];

  const voiceEnergy = emitter<number>();

  return {
    voiceActivity: {
      subscribe: energyBus.subscribe,
      isSpeaking: () => speaking,
      async start() {},
      stop() {},
    },

    transcription: { subscribe: transcriptBus.subscribe },

    liveVoice: {
      available: false, // No API key in this build — captions carry the line.
      async speak(text: string) {
        // Simulate speech energy so the glow behaves like real output.
        const ms = Math.min(6000, 380 + text.length * 42);
        const started = performance.now();
        return new Promise<void>((resolve) => {
          const tick = () => {
            const p = (performance.now() - started) / ms;
            if (p >= 1) {
              voiceEnergy.emit(0);
              resolve();
              return;
            }
            // Pseudo-syllabic envelope, smoothed — never a flat drone.
            const e =
              0.45 +
              0.3 * Math.sin(p * Math.PI * 18) * Math.sin(p * Math.PI * 2.3) +
              0.18 * Math.sin(p * Math.PI * 7);
            voiceEnergy.emit(Math.max(0.12, Math.min(1, e)));
            requestAnimationFrame(tick);
          };
          tick();
        });
      },
      subscribeEnergy: voiceEnergy.subscribe,
      cancel() {
        voiceEnergy.emit(0);
      },
    },

    calendar: {
      async eventsAround() {
        return [SCENARIO_EVENT];
      },
    },

    codex: {
      async currentTask() {
        return SCENARIO_TASK;
      },
    },

    memory: {
      list: () => commitments,
      save(c) {
        commitments = [c, ...commitments.filter((x) => x.id !== c.id)];
        memoryBus.emit();
      },
      forget(id) {
        commitments = commitments.filter((x) => x.id !== id);
        memoryBus.emit();
      },
      subscribe: (cb) => memoryBus.subscribe(cb),
    },

    slack: {
      get: () => slack,
      async set(p) {
        slack = p;
        slackBus.emit(p);
      },
      subscribe: slackBus.subscribe,
    },

    presence: {
      atDesk: () => atDesk,
      subscribe: presenceBus.subscribe,
    },

    summary: { latest: () => SCENARIO_SUMMARY },

    _emitTranscript: transcriptBus.emit,
    _emitEnergy: energyBus.emit,
    _setSpeaking(v: boolean) {
      speaking = v;
    },
    _setAtDesk(v: boolean) {
      atDesk = v;
      presenceBus.emit(v);
    },
  };
}
