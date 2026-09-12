/**
 * Deskemon design tokens.
 *
 * Rule that governs everything here: THE FACE IS NEVER TINTED. It stays pure
 * white on pure black, always. Colour exists only in the information layer, so
 * an accent always means "this card needs your attention" and never leaks into
 * the character's identity.
 *
 * The vibe is Baymax-anime: soft, rounded, generous, uncluttered. Nothing
 * sharp, nothing dense, one accent at a time.
 */

export const color = {
  /** The face's world. Pure black so the white face has maximum contrast. */
  void: '#000000',
  /** Card surfaces, lifted just off the void. */
  surface: '#14161d',
  surfaceRaised: '#1c1f28',
  /** Hairlines and dividers. Never heavier than this. */
  line: '#2a2e3a',

  text: '#ffffff',
  textSoft: '#a8b0c2',
  textFaint: '#818b9e',

  /** Conflict / caution. Used once, on the hero moment. */
  coral: '#ff6b5e',
  coralSoft: 'rgba(255, 107, 94, 0.14)',

  /** Confirmation / success / trust. */
  teal: '#4ecdc4',
  tealSoft: 'rgba(78, 205, 196, 0.14)',

  /** Live-microphone indicator. Only shown when audio is truly processed. */
  live: '#4ecdc4',
} as const;

/** Baymax is all curves. Radii stay large; nothing is ever square. */
export const radius = {
  sm: 12,
  md: 18,
  lg: 26,
  pill: 999,
} as const;

export const space = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 36,
} as const;

export const font = {
  family:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
  /** Large and glanceable — readable at arm's length in a bright venue. */
  label: '600 19px/1.3 var(--f)',
  title: '600 25px/1.25 var(--f)',
  body: '400 17px/1.45 var(--f)',
  meta: '500 14px/1.35 var(--f)',
  button: '600 18px/1 var(--f)',
} as const;

/**
 * Motion. Soft settles, never twangs — the character is inflatable and the UI
 * should agree with it.
 */
export const motion = {
  quick: '180ms cubic-bezier(0.2, 0.8, 0.3, 1)',
  settle: '340ms cubic-bezier(0.2, 0.8, 0.3, 1)',
  sheet: '420ms cubic-bezier(0.16, 1, 0.3, 1)',
} as const;

/** Minimum one-handed touch target. */
export const TOUCH_MIN = 52;
