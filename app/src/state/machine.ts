import type { ExpressionName } from '../face/types';
import type { UIState } from './types';

/**
 * The single mapping from UI state → face expression and copy.
 *
 * Keeping this as one table (rather than conditionals spread through the view)
 * is what makes the 12 states genuinely explicit, and makes the demo controller
 * able to jump to any state deterministically.
 */
export interface StateVisual {
  expression: ExpressionName;
  /** The one short label under the face. */
  label: string;
  /** How much the face dims. 1 = full, lower when a card takes priority. */
  faceDim: number;
  /** Whether the mic is actively processing audio in this state. */
  micActive: boolean;
}

export const STATE_VISUALS: Record<UIState, StateVisual> = {
  sleeping: {
    expression: 'sleeping',
    label: 'Privacy mode',
    faceDim: 0.75,
    micActive: false,
  },
  attentive: {
    expression: 'neutral',
    label: 'Quietly listening nearby',
    faceDim: 1,
    micActive: true,
  },
  speechDetected: {
    expression: 'curious',
    label: 'I hear a conversation',
    faceDim: 1,
    micActive: true,
  },
  listening: {
    expression: 'listening',
    label: 'Listening',
    faceDim: 1,
    micActive: true,
  },
  thinking: {
    expression: 'thinking',
    label: 'Finding what matters…',
    faceDim: 1,
    micActive: true,
  },
  memoryCandidate: {
    expression: 'focused',
    label: 'I caught something',
    faceDim: 0.12,
    micActive: true,
  },
  conflict: {
    expression: 'concerned',
    label: 'That clashes with your day',
    faceDim: 0.1,
    micActive: true,
  },
  speaking: {
    expression: 'speaking',
    label: 'Speaking',
    faceDim: 0.1,
    micActive: false,
  },
  remembering: {
    expression: 'acknowledging',
    label: 'Got it',
    faceDim: 1,
    micActive: true,
  },
  summaryReady: {
    expression: 'neutral',
    label: 'Summary ready',
    faceDim: 0.12,
    micActive: true,
  },
  away: {
    expression: 'sleeping',
    label: 'You stepped away',
    faceDim: 0.7,
    micActive: false,
  },
  error: {
    expression: 'error',
    label: "I couldn't reach that",
    faceDim: 0.6,
    micActive: false,
  },
};

/** Thinking copy cycles through truthful stages — never fake technical logs. */
export const THINKING_COPY = [
  'Finding what matters…',
  'Checking your day…',
  'Looking at your active work…',
];

/** The ordered demo path, for step forward/back. */
export const DEMO_SEQUENCE: UIState[] = [
  'attentive',
  'speechDetected',
  'listening',
  'thinking',
  'memoryCandidate',
  'conflict',
  'speaking',
  'remembering',
  'summaryReady',
];
