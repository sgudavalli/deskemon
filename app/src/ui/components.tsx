import type { CSSProperties, ReactNode } from 'react';
import { color, font, radius, space, TOUCH_MIN } from './tokens';

/* ------------------------------------------------------------------ *
 * Primitives
 * ------------------------------------------------------------------ */

export type ButtonKind = 'primary' | 'secondary' | 'ghost' | 'danger';

export function Button({
  kind = 'secondary',
  children,
  onClick,
  style,
}: {
  kind?: ButtonKind;
  children: ReactNode;
  onClick?: () => void;
  style?: CSSProperties;
}) {
  const base: CSSProperties = {
    minHeight: TOUCH_MIN,
    padding: `0 ${space.lg}px`,
    borderRadius: radius.pill,
    font: font.button,
    transition: 'background-color 180ms, color 180ms, border-color 180ms',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    whiteSpace: 'nowrap',
  };

  const kinds: Record<ButtonKind, CSSProperties> = {
    primary: { background: color.teal, color: '#04201e' },
    secondary: {
      background: color.surfaceRaised,
      color: color.text,
      border: `1px solid ${color.line}`,
    },
    ghost: { background: 'transparent', color: color.textSoft },
    danger: { background: color.coralSoft, color: color.coral },
  };

  return (
    <button style={{ ...base, ...kinds[kind], ...style }} onClick={onClick}>
      {children}
    </button>
  );
}

/** Small rounded status chip for the top bar. */
export function StatusPill({
  children,
  tone = 'neutral',
  dot,
}: {
  children: ReactNode;
  tone?: 'neutral' | 'live' | 'muted';
  dot?: boolean;
}) {
  const tones = {
    neutral: { bg: 'rgba(255,255,255,0.07)', fg: color.textSoft },
    live: { bg: color.tealSoft, fg: color.teal },
    muted: { bg: 'rgba(255,255,255,0.05)', fg: color.textFaint },
  }[tone];

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 7,
        padding: '7px 14px',
        borderRadius: radius.pill,
        background: tones.bg,
        color: tones.fg,
        font: font.meta,
      }}
    >
      {dot && (
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: tones.fg,
            flexShrink: 0,
          }}
        />
      )}
      {children}
    </span>
  );
}

/**
 * The panel that carries every piece of information, overlaying a heavily
 * dimmed face.
 *
 * Landscape is the only orientation, and a phone in landscape is ~390px tall —
 * far too short for a conventional bottom sheet. So this is a full-height panel
 * anchored to the RIGHT, leaving the face visible on the left. The face stays
 * present and reacting; the information gets an uncontested column.
 */
export function Sheet({
  children,
  accent,
}: {
  children: ReactNode;
  accent?: 'coral' | 'teal';
}) {
  const bar =
    accent === 'coral' ? color.coral : accent === 'teal' ? color.teal : undefined;

  return (
    <div
      role="dialog"
      aria-modal="false"
      style={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        right: 0,
        width: 'min(62%, 560px)',
        background: color.surface,
        borderTopLeftRadius: radius.lg,
        borderBottomLeftRadius: radius.lg,
        borderLeft: `1px solid ${color.line}`,
        padding: `max(${space.lg}px, env(safe-area-inset-top)) max(${space.lg}px, env(safe-area-inset-right)) ${space.lg}px ${space.lg}px`,
        animation: 'sheet-in-right 420ms cubic-bezier(0.16, 1, 0.3, 1)',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        // `safe center` keeps short panels centred but falls back to start
        // alignment when content overflows, so the title is never clipped.
        justifyContent: 'safe center',
        zIndex: 6,
      }}
    >
      {bar && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            width: 3,
            background: bar,
          }}
        />
      )}
      {children}
    </div>
  );
}

/** A labelled row of facts inside a sheet. */
export function FactRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: 'coral' | 'teal';
}) {
  const fg = tone === 'coral' ? color.coral : tone === 'teal' ? color.teal : color.text;
  return (
    <div style={{ marginBottom: space.sm }}>
      <div style={{ font: font.meta, color: color.textFaint, marginBottom: 1 }}>
        {label}
      </div>
      <div style={{ font: font.label, color: fg }}>{value}</div>
    </div>
  );
}

export function SheetTitle({ children }: { children: ReactNode }) {
  return (
    <h2 style={{ font: font.title, margin: `0 0 ${space.sm}px` }}>{children}</h2>
  );
}

export function Actions({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        gap: space.sm,
        flexWrap: 'wrap',
        marginTop: space.md,
      }}
    >
      {children}
    </div>
  );
}

/** Caption line for spoken responses — required for accessibility. */
export function Caption({ text }: { text: string }) {
  return (
    <p
      aria-live="polite"
      style={{
        font: font.body,
        color: color.text,
        background: 'rgba(0,0,0,0.55)',
        padding: `${space.sm}px ${space.md}px`,
        borderRadius: radius.md,
        margin: 0,
        textAlign: 'center',
        maxWidth: 760,
      }}
    >
      {text}
    </p>
  );
}

/** Brief transition notice, e.g. Slack presence changes. */
export function Toast({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 'max(16px, env(safe-area-inset-top))',
        left: '50%',
        transform: 'translateX(-50%)',
        background: color.surfaceRaised,
        border: `1px solid ${color.line}`,
        borderRadius: radius.pill,
        padding: '10px 18px',
        font: font.meta,
        color: color.textSoft,
        whiteSpace: 'nowrap',
        animation: 'toast-in 340ms cubic-bezier(0.2, 0.8, 0.3, 1)',
      }}
    >
      {children}
    </div>
  );
}
