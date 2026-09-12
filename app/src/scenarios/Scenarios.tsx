import { useCallback, useState } from 'react';
import { Player, Timeline, useScenarioPlayer } from './Player';
import { CATEGORY_LABEL, SCENARIOS, totalMs } from './registry';
import type { Category, Scenario } from './registry';
import { color, font, radius, space } from '../ui/tokens';

/**
 * #scenarios — the animation reference.
 *
 * Every scenario plays on the real Face and real components, with its beat
 * timeline, director's notes, and an honest statement of what a real build
 * would consume. This is the handoff artifact.
 */
export function Scenarios() {
  const [cat, setCat] = useState<Category>('wellbeing');
  const list = SCENARIOS.filter((s) => s.category === cat);
  const [current, setCurrent] = useState<Scenario>(list[0]);

  const player = useScenarioPlayer(current);
  const { index, setIndex, playing, setPlaying } = player;

  const pickCategory = useCallback((c: Category) => {
    setCat(c);
    const first = SCENARIOS.find((s) => s.category === c)!;
    setCurrent(first);
  }, []);

  const beat = current.beats[index] ?? current.beats[0];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        overflowY: 'auto',
        background: '#07080c',
        color: color.text,
        padding: 22,
      }}
    >
      <header style={{ marginBottom: 16 }}>
        <h1 style={{ font: font.title, margin: '0 0 4px' }}>Scenario reference</h1>
        <p style={{ font: font.meta, color: color.textFaint, margin: 0, maxWidth: 660 }}>
          Ten simulated scenarios. No microphone, no network, no model — the
          animation you see here is the specification.
        </p>
      </header>

      {/* Category tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {(['wellbeing', 'work'] as Category[]).map((c) => (
          <button
            key={c}
            onClick={() => pickCategory(c)}
            style={{
              padding: '9px 16px',
              borderRadius: radius.pill,
              font: font.meta,
              background: c === cat ? color.teal : 'rgba(255,255,255,0.06)',
              color: c === cat ? '#04201e' : color.textSoft,
            }}
          >
            {CATEGORY_LABEL[c]} · {SCENARIOS.filter((s) => s.category === c).length}
          </button>
        ))}
      </div>

      {/* Scenario chips */}
      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 18 }}>
        {list.map((s) => (
          <button
            key={s.id}
            onClick={() => setCurrent(s)}
            style={{
              padding: '8px 14px',
              borderRadius: radius.pill,
              font: font.meta,
              background:
                s.id === current.id ? color.surfaceRaised : 'transparent',
              border: `1px solid ${s.id === current.id ? color.teal : color.line}`,
              color: s.id === current.id ? color.text : color.textFaint,
            }}
          >
            {s.title}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {/* Stage */}
        <div style={{ flex: '1 1 620px', minWidth: 420, maxWidth: 880 }}>
          <Player
            scenario={current}
            playing={playing}
            beatIndex={index}
            onBeat={setIndex}
            onEnd={() => setPlaying(false)}
          />

          <div style={{ marginTop: 10 }}>
            <Timeline
              scenario={current}
              index={index}
              onPick={(i) => {
                setIndex(i);
                setPlaying(false);
              }}
            />
          </div>

          <div
            style={{
              display: 'flex',
              gap: 8,
              alignItems: 'center',
              marginTop: 10,
              flexWrap: 'wrap',
            }}
          >
            <button
              onClick={() => {
                setIndex(0);
                setPlaying(true);
              }}
              style={ctrl(true)}
            >
              ▶ Replay
            </button>
            <button onClick={() => setPlaying((p) => !p)} style={ctrl(false)}>
              {playing ? 'Pause' : 'Play'}
            </button>
            <button
              onClick={() => {
                setPlaying(false);
                setIndex((i) => Math.max(0, i - 1));
              }}
              style={ctrl(false)}
            >
              ←
            </button>
            <button
              onClick={() => {
                setPlaying(false);
                setIndex((i) => Math.min(current.beats.length - 1, i + 1));
              }}
              style={ctrl(false)}
            >
              →
            </button>
            <span style={{ font: font.meta, color: color.textFaint }}>
              beat {index + 1}/{current.beats.length} · {beat.ms}ms ·{' '}
              {(totalMs(current) / 1000).toFixed(1)}s total
            </span>
          </div>
        </div>

        {/* Notes */}
        <aside style={{ flex: '0 1 380px', minWidth: 300, maxWidth: 420 }}>
          <h2 style={{ font: font.label, margin: '0 0 4px' }}>{current.title}</h2>
          <p style={{ font: font.body, color: color.textSoft, margin: `0 0 ${space.md}px` }}>
            {current.premise}
          </p>

          <Meta label="Trigger" value={current.trigger} />
          <Meta label="Adapters" value={current.adapters.join(' · ')} />

          <div
            style={{
              background: 'rgba(255,107,94,0.08)',
              border: `1px solid rgba(255,107,94,0.25)`,
              borderRadius: radius.md,
              padding: 12,
              margin: `${space.md}px 0`,
            }}
          >
            <div style={{ font: font.meta, color: color.coral, marginBottom: 4 }}>
              Honesty
            </div>
            <div style={{ font: font.meta, color: color.textSoft, lineHeight: 1.5 }}>
              {current.honesty}
            </div>
          </div>

          <div
            style={{
              background: color.surface,
              border: `1px solid ${color.line}`,
              borderRadius: radius.md,
              padding: 13,
            }}
          >
            <div style={{ font: font.meta, color: color.textFaint, marginBottom: 5 }}>
              Beat {index + 1} · {beat.expression}
              {beat.energy ? ` · energy ${beat.energy}` : ''}
            </div>
            <div style={{ font: font.body, color: color.text, lineHeight: 1.5 }}>
              {beat.note}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ marginBottom: 9 }}>
      <div style={{ font: font.meta, color: color.textFaint }}>{label}</div>
      <div style={{ font: font.meta, color: color.textSoft, lineHeight: 1.5 }}>
        {value}
      </div>
    </div>
  );
}

function ctrl(primary: boolean) {
  return {
    padding: '9px 15px',
    borderRadius: radius.pill,
    font: font.meta,
    background: primary ? color.teal : color.surfaceRaised,
    color: primary ? '#04201e' : color.text,
    border: primary ? 'none' : `1px solid ${color.line}`,
  } as const;
}
