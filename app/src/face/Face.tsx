import { useEffect, useRef, useState } from 'react';
import { EXPRESSIONS } from './expressions';
import { Eye } from './Eye';
import { Modifier } from './Modifier';
import { lerpFace } from './interpolate';
import type { ExpressionName, FaceGeometry } from './types';

const VIEW_W = 1000;
const VIEW_H = 500;
const EYE_GAP = 250; // centre-to-centre from origin, each side

/**
 * Horizontal half-extent of an eye, so the bar can meet its inner edge exactly.
 * Each shape has a different silhouette width for the same nominal radius.
 */
function innerHalfWidth(eye: FaceGeometry['eyeL']): number {
  const r = eye.radius * eye.scaleX;
  switch (eye.shape) {
    case 'wedge':
      return r; // rect spans -r..r
    case 'arcUp':
    case 'arcDown':
      // Arc endpoints sit at ±r, plus half the stroke cap.
      return r + eye.radius * 0.23;
    case 'ring':
      return r + eye.radius * 0.21;
    case 'cross':
      return r * 0.72 + eye.radius * 0.2;
    case 'heart':
      return r * 0.96;
    case 'circle':
    default:
      return r;
  }
}

export interface FaceProps {
  expression: ExpressionName;
  /** 0–1 damped audio energy. Drives sound arcs and speaking glow. */
  energy?: number;
  /** Overall brightness multiplier — dropped when a card overlays the face. */
  dim?: number;
  reducedMotion?: boolean;
  /**
   * Hold the face perfectly still. Used by reference views (the face lab grid)
   * where a blink caught mid-frame misreads as the expression's real geometry.
   */
  still?: boolean;
}

/**
 * The face. Renders full-bleed: the screen IS the face.
 *
 * Animation runs on one rAF loop writing to a ref'd SVG rather than React state
 * per frame, so a 60fps face doesn't re-render the React tree 60 times a second.
 */
export function Face({
  expression,
  energy = 0,
  dim = 1,
  reducedMotion = false,
  still = false,
}: FaceProps) {
  const [geo, setGeo] = useState<FaceGeometry>(EXPRESSIONS[expression]);
  const geoRef = useRef<FaceGeometry>(EXPRESSIONS[expression]);
  const tRef = useRef(0);

  // Transition progress 0→1 whenever the target expression changes.
  // Driven by elapsed time rather than a stateful spring so that a remount
  // (React StrictMode double-invokes effects) cannot strand it half-finished.
  const fromRef = useRef<FaceGeometry>(EXPRESSIONS[expression]);
  const transitionStart = useRef(-1);
  const target = useRef<ExpressionName>(expression);
  const TRANSITION_S = 0.34;

  // Blink is independent of expression: a separate scaleY multiplier.
  const blink = useRef(1);
  const nextBlink = useRef(2 + Math.random() * 6);

  // Read live values through refs so the rAF loop never has to be torn down.
  const energyRef = useRef(energy);
  energyRef.current = energy;
  const reducedRef = useRef(reducedMotion);
  reducedRef.current = reducedMotion;
  const stillRef = useRef(still);
  stillRef.current = still;

  useEffect(() => {
    if (target.current === expression) return;
    // Start the new transition from wherever we currently are, preserving
    // velocity so interrupted transitions bend rather than snap.
    fromRef.current = geoRef.current;
    target.current = expression;
    transitionStart.current = tRef.current;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expression]);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();

    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 1 / 20);
      last = now;
      tRef.current += dt;
      const t = tRef.current;

      const to = EXPRESSIONS[target.current];
      const reduced = reducedRef.current || stillRef.current;
      const elapsed = t - transitionStart.current;
      const raw =
        transitionStart.current < 0 ? 1 : Math.min(1, elapsed / TRANSITION_S);
      // ease-out cubic — enters quickly, settles softly, matching the UI curves.
      const p = reduced ? 1 : 1 - Math.pow(1 - raw, 3);
      const base = lerpFace(fromRef.current, to, Math.min(1, Math.max(0, p)));

      // --- Idle life -------------------------------------------------------
      // Breathing: ~4s cycle, tiny amplitude. Without it the face reads as a
      // frozen statue rather than a living character.
      const breathe = reduced ? 0 : Math.sin(t * ((2 * Math.PI) / 4)) * 0.008;

      // Blink: 120ms, scheduled 4–8s apart. Suppressed where a blink would be
      // wrong (sleeping eyes are already shut; crosses don't blink).
      const canBlink =
        !reduced &&
        !stillRef.current &&
        target.current !== 'sleeping' &&
        target.current !== 'error' &&
        target.current !== 'inLove';

      if (canBlink) {
        if (t > nextBlink.current) {
          const since = t - nextBlink.current;
          if (since < 0.12) {
            // Triangular: shut at the midpoint, open again by the end.
            blink.current = Math.abs(since - 0.06) / 0.06;
            blink.current = 0.06 + 0.94 * blink.current;
          } else {
            blink.current = 1;
            nextBlink.current = t + 4 + Math.random() * 4;
          }
        }
      } else {
        blink.current = 1;
      }

      const b = blink.current;
      const next = {
        ...base,
        scale: base.scale + breathe,
        eyeL: { ...base.eyeL, scaleY: base.eyeL.scaleY * b },
        eyeR: { ...base.eyeR, scaleY: base.eyeR.scaleY * b },
        // Speaking glow rides output energy; never flashes.
        glow: base.glow * (0.4 + 0.6 * energyRef.current),
      };
      geoRef.current = next;
      setGeo(next);

      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  const opacity = geo.dim * dim;

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ width: '100%', height: '100%', display: 'block' }}
      aria-hidden="true"
    >
      <g
        transform={`translate(${VIEW_W / 2} ${VIEW_H / 2}) scale(${geo.scale}) rotate(${geo.tiltDeg}) translate(0 ${geo.offsetY})`}
        fill="#fff"
        stroke="#fff"
        opacity={opacity}
      >
        {geo.glow > 0.01 && (
          <ellipse
            rx={430}
            ry={190}
            fill="#fff"
            stroke="none"
            opacity={geo.glow * 0.16}
            style={{ filter: 'blur(46px)' }}
          />
        )}

        {/*
          The connecting bar. Straight by design — it must never read as a mouth.
          Its ends are derived from each eye's actual inner edge (and overlap it
          slightly) so the bar always TOUCHES both eyes, with no floating gap,
          whatever radius or offset the current expression uses.
        */}
        {(() => {
          const OVERLAP = 4;
          const leftEdge =
            -EYE_GAP + geo.eyeL.offsetX + innerHalfWidth(geo.eyeL) - OVERLAP;
          const rightEdge =
            EYE_GAP + geo.eyeR.offsetX - innerHalfWidth(geo.eyeR) + OVERLAP;
          return (
            <rect
              x={leftEdge}
              y={-geo.bar.thickness / 2}
              width={Math.max(0, rightEdge - leftEdge)}
              height={geo.bar.thickness}
              rx={geo.bar.thickness / 2}
              stroke="none"
            />
          );
        })()}

        <Eye geo={geo.eyeL} cx={-EYE_GAP} cy={0} />
        <Eye geo={geo.eyeR} cx={EYE_GAP} cy={0} />

        <g stroke="#fff" fill="#fff">
          <Modifier kind={geo.modifier} t={tRef.current} energy={energy} />
        </g>
      </g>
    </svg>
  );
}
