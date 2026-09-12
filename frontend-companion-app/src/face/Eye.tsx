import type { EyeGeometry } from './types';

/**
 * One eye, drawn from its geometry. All shapes are sized against `radius` so
 * they stay visually consistent when interpolating between them.
 */
export function Eye({ geo, cx, cy }: { geo: EyeGeometry; cx: number; cy: number }) {
  const r = geo.radius;
  const transform = `translate(${cx + geo.offsetX} ${cy + geo.offsetY}) rotate(${geo.rotation}) scale(${geo.scaleX} ${geo.scaleY})`;

  return <g transform={transform}>{shape(geo.shape, r)}</g>;
}

function shape(kind: EyeGeometry['shape'], r: number) {
  switch (kind) {
    case 'circle':
      return <circle r={r} stroke="none" />;

    // A thick arc opening upward: ∪ — happy, sleeping.
    case 'arcUp':
      return (
        <path
          d={`M ${-r} ${-r * 0.18} A ${r} ${r} 0 0 0 ${r} ${-r * 0.18}`}
          fill="none"
          strokeWidth={r * 0.46}
          strokeLinecap="round"
        />
      );

    // Opening downward: ∩ — concerned, sad.
    case 'arcDown':
      return (
        <path
          d={`M ${-r} ${r * 0.18} A ${r} ${r} 0 0 1 ${r} ${r * 0.18}`}
          fill="none"
          strokeWidth={r * 0.46}
          strokeLinecap="round"
        />
      );

    // An angled slab — determined, celebrating.
    case 'wedge':
      return <rect x={-r} y={-r * 0.5} width={r * 2} height={r} rx={r * 0.34} stroke="none" />;

    // An open ring, C-shaped — processing.
    case 'ring':
      return (
        <path
          d={`M ${r * 0.72} ${-r * 0.66} A ${r} ${r} 0 1 0 ${r * 0.72} ${r * 0.66}`}
          fill="none"
          strokeWidth={r * 0.42}
          strokeLinecap="round"
        />
      );

    case 'cross':
      return (
        <g strokeWidth={r * 0.4} strokeLinecap="round" fill="none">
          <line x1={-r * 0.72} y1={-r * 0.72} x2={r * 0.72} y2={r * 0.72} />
          <line x1={r * 0.72} y1={-r * 0.72} x2={-r * 0.72} y2={r * 0.72} />
        </g>
      );

    case 'heart': {
      const s = r / 100;
      return (
        <path
          stroke="none"
          transform={`scale(${s})`}
          d="M 0 78 C -96 16 -74 -68 -30 -68 C -8 -68 0 -52 0 -40 C 0 -52 8 -68 30 -68 C 74 -68 96 16 0 78 Z"
        />
      );
    }
  }
}
