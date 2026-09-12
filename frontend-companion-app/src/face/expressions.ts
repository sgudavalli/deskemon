import type {
  EyeGeometry,
  ExpressionName,
  FaceGeometry,
} from './types';

/**
 * The 20 expressions from the reference sheet, expressed as deltas from neutral.
 *
 * Design rule enforced here: emotion lives in the EYES. The bar stays straight
 * and roughly constant. Modifiers are used sparingly — one at a time, never
 * decoratively.
 */

const EYE: EyeGeometry = {
  shape: 'circle',
  radius: 86,
  scaleY: 1,
  scaleX: 1,
  rotation: 0,
  offsetX: 0,
  offsetY: 0,
};

export const NEUTRAL: FaceGeometry = {
  eyeL: { ...EYE },
  eyeR: { ...EYE },
  bar: { length: 300, thickness: 26, curve: 0 },
  modifier: 'none',
  scale: 1,
  tiltDeg: 0,
  offsetY: 0,
  glow: 0,
  dim: 1,
};

/** Build an expression from neutral with per-eye overrides. */
function face(
  partial: Partial<Omit<FaceGeometry, 'eyeL' | 'eyeR' | 'bar'>> & {
    eyes?: Partial<EyeGeometry>;
    eyeL?: Partial<EyeGeometry>;
    eyeR?: Partial<EyeGeometry>;
    bar?: Partial<FaceGeometry['bar']>;
  },
): FaceGeometry {
  const { eyes, eyeL, eyeR, bar, ...rest } = partial;
  return {
    ...NEUTRAL,
    ...rest,
    eyeL: { ...EYE, ...eyes, ...eyeL },
    eyeR: { ...EYE, ...eyes, ...eyeR },
    bar: { ...NEUTRAL.bar, ...bar },
  };
}

export const EXPRESSIONS: Record<ExpressionName, FaceGeometry> = {
  neutral: NEUTRAL,

  happy: face({ eyes: { shape: 'arcUp', radius: 92 } }),

  excited: face({
    eyes: { shape: 'arcUp', radius: 96 },
    modifier: 'ticks',
    scale: 1.04,
  }),

  // Asymmetry reads as curiosity: one eye larger, slight head tilt.
  curious: face({
    eyeL: { radius: 78 },
    eyeR: { radius: 100 },
    tiltDeg: -3.5,
  }),

  thinking: face({
    eyeL: { radius: 84 },
    eyeR: { radius: 84, offsetX: -14 },
    modifier: 'dots',
    tiltDeg: 2,
  }),

  confused: face({
    eyeL: { radius: 90 },
    eyeR: { radius: 76, offsetY: -10 },
    modifier: 'question',
    tiltDeg: -4,
  }),

  surprised: face({
    eyes: { radius: 104 },
    bar: { length: 288 },
    scale: 1.05,
  }),

  delighted: face({
    eyes: { shape: 'arcUp', radius: 94 },
    modifier: 'ticks',
  }),

  // Angled inner edges. The classic "narrowed eyes" of resolve.
  determined: face({
    eyeL: { shape: 'wedge', rotation: 16, scaleY: 0.82 },
    eyeR: { shape: 'wedge', rotation: -16, scaleY: 0.82 },
  }),

  concerned: face({
    eyeL: { shape: 'arcDown', radius: 74, rotation: -10, offsetY: 6 },
    eyeR: { shape: 'arcDown', radius: 74, rotation: 10, offsetY: 6 },
    tiltDeg: -2,
  }),

  sad: face({
    eyeL: { shape: 'arcDown', radius: 72, offsetY: 14, rotation: -18 },
    eyeR: { shape: 'arcDown', radius: 72, offsetY: 14, rotation: 18 },
    tiltDeg: 3,
    offsetY: 10,
  }),

  celebrating: face({
    eyeL: { shape: 'wedge', rotation: -20, scaleY: 0.7 },
    eyeR: { shape: 'wedge', rotation: 20, scaleY: 0.7 },
    modifier: 'ticks',
    scale: 1.06,
    offsetY: -14,
  }),

  focused: face({ eyes: { radius: 80, scaleY: 0.94 } }),

  processing: face({
    eyes: { shape: 'ring', radius: 88 },
    modifier: 'none',
  }),

  // Sound arcs appear ONLY here and in speaking — never as decoration.
  listening: face({
    eyes: { radius: 88 },
    modifier: 'soundArcs',
  }),

  speaking: face({
    eyes: { radius: 88 },
    glow: 0.6,
  }),

  acknowledging: face({
    eyes: { shape: 'arcUp', radius: 92 },
    modifier: 'ticks',
    tiltDeg: -5,
    offsetY: -8,
  }),

  inLove: face({ eyes: { shape: 'heart', radius: 92 } }),

  sleeping: face({
    eyes: { shape: 'arcUp', radius: 80, scaleY: 0.55 },
    modifier: 'zzz',
    offsetY: 14,
    dim: 0.55,
  }),

  error: face({ eyes: { shape: 'cross', radius: 84 } }),
};
