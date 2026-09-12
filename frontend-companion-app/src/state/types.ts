/** The 12 explicit UI states. Never represented as scattered booleans. */
export type UIState =
  | 'sleeping'
  | 'attentive'
  | 'speechDetected'
  | 'listening'
  | 'thinking'
  | 'memoryCandidate'
  | 'conflict'
  | 'speaking'
  | 'remembering'
  | 'summaryReady'
  | 'away'
  | 'error';

export type SlackPresence = 'available' | 'focusing' | 'inMeeting' | 'away';

export interface TranscriptLine {
  id: string;
  speaker: string;
  text: string;
  /** Whether this speaker is the device owner. */
  isOwner: boolean;
}

export interface Commitment {
  id: string;
  what: string;
  /** Display time, e.g. "3:00 PM". */
  time: string;
  /** ISO-ish sortable value for the memory list. */
  at: string;
  savedAt?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
}

export interface CodexTask {
  id: string;
  title: string;
  status: 'running' | 'needsInput' | 'ready' | 'blocked';
}

export interface Conflict {
  commitment: Commitment;
  event: CalendarEvent;
  task: CodexTask;
  /** The proposed alternative time, e.g. "4:30 PM". */
  suggestion: string;
}

export interface MeetingSummary {
  id: string;
  title: string;
  decisions: string[];
  actionItems: { text: string; owner: string; due?: string }[];
  commitments: string[];
  openQuestions: string[];
}
