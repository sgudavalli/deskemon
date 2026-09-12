import type { Modifier as ModifierKind } from './types';

/**
 * Sparse symbols beside the face. One at a time, never decorative.
 *
 * `soundArcs` is the only modifier driven by live data — its amplitude comes
 * from damped microphone RMS, so it is a truthful signal that audio is being
 * processed, not an animation that merely suggests it.
 */
export function Modifier({
  kind,
  t,
  energy,
}: {
  kind: ModifierKind;
  /** Seconds since mount, for cycling animations. */
  t: number;
  /** 0–1 damped audio energy. */
  energy: number;
}) {
  switch (kind) {
    case 'none':
      return null;

    case 'dots': {
      // Three dots fading in sequence — a truthful "working" cue.
      const phase = (t * 1.6) % 3;
      return (
        <g transform="translate(330 -70)">
          {[0, 1, 2].map((i) => (
            <circle
              key={i}
              cx={i * 52}
              cy={0}
              r={15}
              opacity={0.25 + 0.75 * Math.max(0, 1 - Math.abs(phase - i))}
            />
          ))}
        </g>
      );
    }

    case 'question':
      return (
        <text
          x={352}
          y={-96}
          fontSize={128}
          fontWeight={700}
          textAnchor="middle"
          fontFamily="system-ui, sans-serif"
        >
          ?
        </text>
      );

    case 'ticks': {
      // Radiating lines above both eyes — excitement, acknowledgement.
      const pulse = 1 + 0.12 * Math.sin(t * 9);
      return (
        <g strokeWidth={13} strokeLinecap="round" fill="none">
          {[-1, 1].map((side) =>
            [-28, 0, 28].map((deg) => {
              const a = ((deg - 90) * Math.PI) / 180;
              const ox = side * 250;
              const oy = -30;
              const r0 = 118;
              const r1 = (118 + 48) * pulse;
              return (
                <line
                  key={`${side}-${deg}`}
                  x1={ox + Math.cos(a) * r0}
                  y1={oy + Math.sin(a) * r0}
                  x2={ox + Math.cos(a) * r1}
                  y2={oy + Math.sin(a) * r1}
                />
              );
            }),
          )}
        </g>
      );
    }

    case 'soundArcs': {
      // Concentric arcs either side, scaled by real audio energy.
      const amp = 0.35 + energy * 0.65;
      return (
        <g strokeWidth={13} strokeLinecap="round" fill="none">
          {[-1, 1].map((side) =>
            [0, 1, 2].map((i) => {
              // Arcs sit OUTSIDE the eyes, opening away from the face, so they
              // never overlap the features they are reporting on.
              const r = 60 + i * 40;
              const o = Math.max(0, amp - i * 0.26);
              const sweep = side === 1 ? 1 : 0;
              const x = side * 385;
              return (
                <path
                  key={`${side}-${i}`}
                  opacity={o}
                  d={`M ${x + side * r * 0.55} ${-r * 0.78} A ${r} ${r} 0 0 ${sweep} ${x + side * r * 0.55} ${r * 0.78}`}
                />
              );
            }),
          )}
        </g>
      );
    }

    case 'zzz': {
      const drift = (t * 0.5) % 1;
      return (
        <g fontFamily="system-ui, sans-serif" fontWeight={700}>
          {[0, 1, 2].map((i) => {
            const p = (drift + i / 3) % 1;
            return (
              <text
                key={i}
                x={300 + p * 80}
                y={-96 - p * 120}
                fontSize={44 + i * 16}
                opacity={Math.sin(p * Math.PI) * 0.9}
              >
                z
              </text>
            );
          })}
        </g>
      );
    }
  }
}
