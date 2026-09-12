import type { EyeGeometry, FaceGeometry } from './types';

/**
 * Geometry interpolation + a critically-damped spring.
 *
 * Shapes are discrete (a circle cannot be 40% of a cross), so shape swaps at the
 * midpoint of the transition — by which time the blink/squash is usually hiding
 * the change anyway. Everything numeric interpolates continuously.
 */

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function lerpEye(a: EyeGeometry, b: EyeGeometry, t: number): EyeGeometry {
  return {
    shape: t < 0.5 ? a.shape : b.shape,
    radius: lerp(a.radius, b.radius, t),
    scaleY: lerp(a.scaleY, b.scaleY, t),
    scaleX: lerp(a.scaleX, b.scaleX, t),
    rotation: lerp(a.rotation, b.rotation, t),
    offsetX: lerp(a.offsetX, b.offsetX, t),
    offsetY: lerp(a.offsetY, b.offsetY, t),
  };
}

export function lerpFace(
  a: FaceGeometry,
  b: FaceGeometry,
  t: number,
): FaceGeometry {
  return {
    eyeL: lerpEye(a.eyeL, b.eyeL, t),
    eyeR: lerpEye(a.eyeR, b.eyeR, t),
    bar: {
      length: lerp(a.bar.length, b.bar.length, t),
      thickness: lerp(a.bar.thickness, b.bar.thickness, t),
      curve: lerp(a.bar.curve, b.bar.curve, t),
    },
    modifier: t < 0.5 ? a.modifier : b.modifier,
    scale: lerp(a.scale, b.scale, t),
    tiltDeg: lerp(a.tiltDeg, b.tiltDeg, t),
    offsetY: lerp(a.offsetY, b.offsetY, t),
    glow: lerp(a.glow, b.glow, t),
    dim: lerp(a.dim, b.dim, t),
  };
}

/**
 * A spring that carries velocity, so interrupting a transition mid-flight bends
 * the motion instead of snapping it. `stiffness`/`damping` are tuned soft: this
 * character is inflatable, it should settle rather than twang.
 */
export class Spring {
  value: number;
  private velocity = 0;

  private stiffness: number;
  private damping: number;

  constructor(initial: number, stiffness = 120, damping = 20) {
    this.value = initial;
    this.stiffness = stiffness;
    this.damping = damping;
  }

  /** Advance by `dt` seconds toward `target`. Returns the new value. */
  step(target: number, dt: number): number {
    // Clamp dt so a backgrounded tab doesn't explode the integrator.
    const h = Math.min(dt, 1 / 30);
    const force = (target - this.value) * this.stiffness;
    const drag = this.velocity * this.damping;
    this.velocity += (force - drag) * h;
    this.value += this.velocity * h;
    return this.value;
  }

  /** Jump immediately, killing velocity. Used for reduced-motion. */
  snap(to: number) {
    this.value = to;
    this.velocity = 0;
  }
}
