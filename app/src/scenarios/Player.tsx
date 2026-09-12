import { useEffect, useRef, useState } from 'react';
import { Face } from '../face/Face';
import {
  Actions,
  Button,
  Caption,
  FactRow,
  Sheet,
  SheetTitle,
  StatusPill,
  Toast,
} from '../ui/components';
import { color, font, space } from '../ui/tokens';
import type { Beat, Scenario } from './registry';

/**
 * Plays a scenario's beats on the real Face and real UI components.
 *
 * This is a simulation surface: no microphone, no network, no model. What it
 * shows IS the animation spec — if it looks right here, it is right.
 */
export function Player({
  scenario,
  playing,
  beatIndex,
  onBeat,
  onEnd,
}: {
  scenario: Scenario;
  playing: boolean;
  beatIndex: number;
  onBeat: (i: number) => void;
  onEnd: () => void;
}) {
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    clearTimeout(timer.current);
    if (!playing) return;
    const beat = scenario.beats[beatIndex];
    if (!beat) return;
    timer.current = window.setTimeout(() => {
      if (beatIndex + 1 < scenario.beats.length) onBeat(beatIndex + 1);
      else onEnd();
    }, beat.ms);
    return () => clearTimeout(timer.current);
  }, [playing, beatIndex, scenario, onBeat, onEnd]);

  const beat: Beat = scenario.beats[beatIndex] ?? scenario.beats[0];
  const panelOpen = Boolean(beat.panel);
  const faceDim = beat.faceDim ?? 1;

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '844 / 390',
        background: color.void,
        borderRadius: 18,
        overflow: 'hidden',
        border: `1px solid ${color.line}`,
      }}
    >
      {/* Face column — yields to the panel when one is open. */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          right: panelOpen ? '62%' : 0,
          display: 'grid',
          placeItems: 'center',
          transition: 'right 420ms cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        <div
          style={{
            width: '100%',
            height: panelOpen ? '46%' : '66%',
            transition: 'height 420ms cubic-bezier(0.16,1,0.3,1)',
          }}
        >
          <Face
            expression={beat.expression}
            energy={beat.energy ?? 0}
            dim={faceDim}
          />
        </div>
      </div>

      {/* Top status */}
      <div
        style={{
          position: 'absolute',
          top: 12,
          left: 14,
          right: 14,
          display: 'flex',
          gap: 8,
          zIndex: 3,
        }}
      >
        <StatusPill tone={beat.expression === 'sleeping' ? 'muted' : 'live'} dot>
          {beat.expression === 'sleeping' ? 'Muted' : 'Listening nearby'}
        </StatusPill>
      </div>

      {/* State label */}
      {beat.label && (!beat.transcript || beat.persistLabel) && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: panelOpen ? '62%' : 0,
            bottom: beat.transcript ? '26%' : beat.caption ? '30%' : '12%',
            textAlign: 'center',
            font: font.label,
            color: color.textSoft,
            zIndex: 2,
            padding: '0 18px',
            transition: 'right 420ms cubic-bezier(0.16,1,0.3,1)',
          }}
        >
          {beat.label}
        </div>
      )}

      {/* Transcript */}
      {beat.transcript && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: panelOpen ? '62%' : 0,
            bottom: '7%',
            display: 'grid',
            gap: 6,
            justifyItems: 'center',
            padding: '0 18px',
            zIndex: 2,
          }}
        >
          {beat.transcript.map((l, i) => (
            <div
              key={l.text}
              style={{
                font: font.body,
                color:
                  i === beat.transcript!.length - 1 ? color.text : color.textFaint,
                opacity: i === beat.transcript!.length - 1 ? 1 : 0.55,
                textAlign: 'center',
                animation: 'caption-in 340ms ease',
              }}
            >
              <span style={{ color: color.textFaint }}>{l.speaker}: </span>
              {l.text}
            </div>
          ))}
        </div>
      )}

      {/* Caption */}
      {beat.caption && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: panelOpen ? '62%' : 0,
            bottom: '9%',
            display: 'grid',
            justifyItems: 'center',
            padding: '0 16px',
            zIndex: 4,
          }}
        >
          <Caption text={beat.caption} />
        </div>
      )}

      {beat.toast && <Toast>{beat.toast}</Toast>}

      {/* Panel */}
      {beat.panel && (
        <Sheet accent={beat.panel.accent}>
          <SheetTitle>{beat.panel.title}</SheetTitle>
          {beat.panel.facts?.map((f) => (
            <FactRow key={f.label} label={f.label} value={f.value} tone={f.tone} />
          ))}
          {beat.panel.sections?.map((sec) => (
            <div key={sec.title} style={{ marginBottom: space.sm }}>
              <div style={{ font: font.meta, color: color.textFaint, marginBottom: 3 }}>
                {sec.title}
              </div>
              <ul style={{ margin: 0, paddingLeft: 17, font: font.body }}>
                {sec.items.map((it) => (
                  <li key={it} style={{ marginBottom: 2 }}>
                    {it}
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {beat.panel.body && (
            <p style={{ font: font.body, color: color.textSoft, margin: `0 0 ${space.sm}px` }}>
              {beat.panel.body}
            </p>
          )}
          {beat.panel.actions && (
            <Actions>
              {beat.panel.actions.map((a) => (
                <Button key={a.label} kind={a.kind}>
                  {a.label}
                </Button>
              ))}
            </Actions>
          )}
        </Sheet>
      )}
    </div>
  );
}

/** Timeline scrubber showing every beat and its duration. */
export function Timeline({
  scenario,
  index,
  onPick,
}: {
  scenario: Scenario;
  index: number;
  onPick: (i: number) => void;
}) {
  const total = scenario.beats.reduce((n, b) => n + b.ms, 0);
  return (
    <div style={{ display: 'flex', gap: 3, width: '100%' }}>
      {scenario.beats.map((b, i) => (
        <button
          key={i}
          onClick={() => onPick(i)}
          title={`${b.expression} · ${b.ms}ms`}
          style={{
            flex: `${b.ms} 0 0`,
            height: 30,
            borderRadius: 6,
            background: i === index ? color.teal : color.surfaceRaised,
            color: i === index ? '#04201e' : color.textFaint,
            font: '600 11px system-ui',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            padding: 0,
          }}
        >
          {Math.round((b.ms / total) * 100) > 7 ? b.expression : i + 1}
        </button>
      ))}
    </div>
  );
}

export function useScenarioPlayer(scenario: Scenario) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [lastId, setLastId] = useState(scenario.id);

  // Reset DURING RENDER rather than in an effect. An effect would let one frame
  // paint the previous scenario's expression against the new scenario, which
  // reads as the face briefly wearing the wrong face.
  if (scenario.id !== lastId) {
    setLastId(scenario.id);
    setIndex(0);
    setPlaying(true);
  }

  return {
    index: scenario.id === lastId ? index : 0,
    setIndex,
    playing,
    setPlaying,
  };
}
