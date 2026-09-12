import { useEffect, useState } from 'react';
import { DEMO_SEQUENCE } from '../state/machine';
import type { UIState } from '../state/types';
import { color, font, radius } from '../ui/tokens';

/**
 * Presenter controls. Hidden unless ?demo=1, and never part of the product
 * experience. Keyboard-first so the sequence can be rehearsed on a laptop.
 *
 *   space / →  next state      ←  previous state
 *   r          reset           s  run full scenario
 *   c          jump to conflict
 *   a          step away       b  come back
 *   d          hide/show this panel
 */
export function DemoController({
  state,
  setState,
  runScenario,
  showConflict,
  reset,
  stepAway,
  comeBack,
  setEnergy,
  liveVoiceAvailable,
}: {
  state: UIState;
  setState: (s: UIState) => void;
  runScenario: () => void;
  showConflict: () => void;
  reset: () => void;
  stepAway: () => void;
  comeBack: () => void;
  setEnergy: (e: number) => void;
  liveVoiceAvailable: boolean;
}) {
  const enabled =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('demo') === '1';
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      const i = DEMO_SEQUENCE.indexOf(state);
      switch (e.key) {
        case ' ':
        case 'ArrowRight':
          e.preventDefault();
          setState(DEMO_SEQUENCE[Math.min(DEMO_SEQUENCE.length - 1, i + 1)] ?? 'attentive');
          break;
        case 'ArrowLeft':
          e.preventDefault();
          setState(DEMO_SEQUENCE[Math.max(0, i - 1)] ?? 'attentive');
          break;
        case 'r':
          reset();
          break;
        case 's':
          runScenario();
          break;
        case 'c':
          showConflict();
          break;
        case 'a':
          stepAway();
          break;
        case 'b':
          comeBack();
          break;
        case 'd':
          setOpen((o) => !o);
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [enabled, state, setState, reset, runScenario, showConflict, stepAway, comeBack]);

  if (!enabled || !open) return null;

  const btn = {
    padding: '7px 11px',
    borderRadius: radius.sm,
    background: 'rgba(255,255,255,0.08)',
    color: color.text,
    font: font.meta,
  } as const;

  return (
    <div
      className="demo-controller"
      style={{
        position: 'absolute',
        right: 10,
        bottom: 10,
        zIndex: 50,
        background: 'rgba(8,10,14,0.92)',
        border: `1px solid ${color.line}`,
        borderRadius: radius.md,
        padding: 12,
        display: 'grid',
        gap: 8,
        maxWidth: 260,
        backdropFilter: 'blur(8px)',
      }}
    >
      <div style={{ font: font.meta, color: color.textFaint }}>
        demo · {state} · voice:{liveVoiceAvailable ? 'live' : 'captions'}
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button style={btn} onClick={runScenario}>▶ scenario (s)</button>
        <button style={btn} onClick={showConflict}>conflict (c)</button>
        <button style={btn} onClick={reset}>reset (r)</button>
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button style={btn} onClick={stepAway}>away (a)</button>
        <button style={btn} onClick={comeBack}>back (b)</button>
        <button style={btn} onClick={() => setState('error')}>error</button>
      </div>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <span style={{ font: font.meta, color: color.textFaint }}>mic</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          defaultValue={0}
          onChange={(e) => setEnergy(Number(e.target.value))}
          style={{ flex: 1 }}
        />
      </div>
      <div style={{ font: font.meta, color: color.textFaint, fontSize: 12 }}>
        ← → step · d hides
      </div>
    </div>
  );
}
