import { color, radius, TOUCH_MIN } from './tokens';

/**
 * The one persistent, unmistakable privacy control.
 *
 * The R1 earned trust with a lens that physically rotates shut. We have no
 * hardware, so the honest equivalent is the face itself: privacy mode closes
 * the eyes. This button is the switch for that, and it is never hidden.
 */
export function PrivacyControl({
  muted,
  onToggle,
}: {
  muted: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      aria-pressed={muted}
      aria-label={muted ? 'Privacy mode on. Tap to wake Deskemon.' : 'Deskemon is listening. Tap for privacy mode.'}
      style={{
        width: TOUCH_MIN,
        height: TOUCH_MIN,
        borderRadius: radius.pill,
        background: muted ? color.coralSoft : 'rgba(255,255,255,0.07)',
        border: `1px solid ${muted ? 'rgba(255,107,94,0.4)' : color.line}`,
        display: 'grid',
        placeItems: 'center',
        transition: 'background-color 180ms, border-color 180ms',
        flexShrink: 0,
      }}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3Z"
          fill={muted ? color.coral : color.text}
        />
        <path
          d="M5 11a7 7 0 0 0 14 0M12 18v3"
          stroke={muted ? color.coral : color.text}
          strokeWidth="2"
          strokeLinecap="round"
        />
        {muted && (
          <path
            d="M4 4l16 16"
            stroke={color.coral}
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        )}
      </svg>
    </button>
  );
}
