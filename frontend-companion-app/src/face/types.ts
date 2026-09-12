/**
 * Deskemon face geometry model.
 *
 * The screen IS the face. There is no character artwork — every expression is
 * described as pure geometry so it can be interpolated, blinked, and driven by
 * live audio. The identity atom is: two eyes + one connecting bar.
 *
 * The bar is a mouth substitute that never becomes a mouth. It stays straight
 * (or barely curved) while the eyes carry the emotion. That restraint is what
 * keeps the character reading as Baymax.
 */

/** Eye silhouettes. Everything is drawn from these five primitives. */
export type EyeShape =
  | 'circle' // neutral, the resting state
  | 'arcUp' // ∪ — happy / delighted / sleeping (curve opens upward)
  | 'arcDown' // ∩ — sad / concerned (curve opens downward)
  | 'wedge' // angled slab — determined
  | 'ring' // C / Ɔ — processing, an open ring
  | 'cross' // × — error
  | 'heart'; // ♥ — in love (easter egg)

/** Sparse symbols placed beside the face. Never more than one at a time. */
export type Modifier =
  | 'none'
  | 'dots' // … thinking
  | 'question' // ? confused
  | 'ticks' // radiating lines — excited / celebrating / acknowledging
  | 'soundArcs' // ((  )) listening — ONLY when audio is truly being processed
  | 'zzz'; // sleeping

export interface EyeGeometry {
  shape: EyeShape;
  /** Base radius in face units (viewBox is 1000×500). */
  radius: number;
  /** Vertical squash. 1 = open, 0.06 = fully blinked shut. */
  scaleY: number;
  /** Horizontal squash, used for squints. */
  scaleX: number;
  /** Degrees. Positive tilts the inner edge down (determined/angry). */
  rotation: number;
  /** Offset from the eye's home position, in face units. */
  offsetX: number;
  offsetY: number;
}

export interface BarGeometry {
  /** Distance between eye centres is fixed; this is the drawn bar length. */
  length: number;
  thickness: number;
  /**
   * Curve amount in face units. Kept near 0 by design — a curved bar starts to
   * read as a mouth, which the brief explicitly forbids.
   */
  curve: number;
}

export interface FaceGeometry {
  eyeL: EyeGeometry;
  eyeR: EyeGeometry;
  bar: BarGeometry;
  modifier: Modifier;
  /** Whole-face uniform scale. */
  scale: number;
  /** Whole-face tilt in degrees — the "head turn" the old flat asset couldn't do. */
  tiltDeg: number;
  /** Vertical bob, in face units. Used for lifts and settles. */
  offsetY: number;
  /** 0–1 glow behind the features. Driven by speech output energy. */
  glow: number;
  /** 0–1 overall brightness. Dropped when a card overlays the face. */
  dim: number;
}

/** The 20 named expressions from the reference sheet. */
export type ExpressionName =
  | 'neutral'
  | 'happy'
  | 'excited'
  | 'curious'
  | 'thinking'
  | 'confused'
  | 'surprised'
  | 'delighted'
  | 'determined'
  | 'concerned'
  | 'sad'
  | 'celebrating'
  | 'focused'
  | 'processing'
  | 'listening'
  | 'speaking'
  | 'acknowledging'
  | 'inLove'
  | 'sleeping'
  | 'error';
