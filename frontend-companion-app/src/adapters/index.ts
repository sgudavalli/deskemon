import type {
  CalendarEvent,
  CodexTask,
  Commitment,
  MeetingSummary,
  SlackPresence,
  TranscriptLine,
} from '../state/types';

/**
 * Integration seams.
 *
 * Every one of these is SEEDED in the current build — nothing here talks to a
 * real service yet. They exist so a real implementation can be dropped in
 * without touching the UI or the state machine. See docs/INTEGRATIONS.md for
 * the honest real-vs-simulated table.
 */

export interface VoiceActivitySource {
  /** Subscribe to damped 0–1 energy. Returns an unsubscribe function. */
  subscribe(cb: (energy: number) => void): () => void;
  /** Whether speech (not room noise) is currently present. */
  isSpeaking(): boolean;
  start(): Promise<void>;
  stop(): void;
}

export interface TranscriptionSource {
  /** Emits lines as they are recognised. */
  subscribe(cb: (line: TranscriptLine) => void): () => void;
}

export interface LiveVoiceSource {
  /** Speak a line. Resolves when finished. Captions are rendered separately. */
  speak(text: string): Promise<void>;
  /** Output energy 0–1, for the speaking glow. */
  subscribeEnergy(cb: (energy: number) => void): () => void;
  cancel(): void;
  /** False when no API key is configured — the UI falls back to captions only. */
  readonly available: boolean;
}

export interface CalendarSource {
  eventsAround(time: string): Promise<CalendarEvent[]>;
}

export interface CodexStateSource {
  currentTask(): Promise<CodexTask | null>;
}

export interface MemoryStore {
  list(): Commitment[];
  save(c: Commitment): void;
  forget(id: string): void;
  subscribe(cb: () => void): () => void;
}

export interface SlackPresenceSource {
  get(): SlackPresence;
  set(p: SlackPresence): Promise<void>;
  subscribe(cb: (p: SlackPresence) => void): () => void;
}

export interface PhysicalPresenceSource {
  /** True when the user is judged to be at the desk. */
  atDesk(): boolean;
  subscribe(cb: (atDesk: boolean) => void): () => void;
}

export interface SummarySource {
  latest(): MeetingSummary | null;
}

export interface Adapters {
  voiceActivity: VoiceActivitySource;
  transcription: TranscriptionSource;
  liveVoice: LiveVoiceSource;
  calendar: CalendarSource;
  codex: CodexStateSource;
  memory: MemoryStore;
  slack: SlackPresenceSource;
  presence: PhysicalPresenceSource;
  summary: SummarySource;
}
