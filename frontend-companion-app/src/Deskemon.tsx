import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Face } from './face/Face';
import { PrivacyControl } from './ui/PrivacyControl';
import {
  Actions,
  Button,
  Caption,
  FactRow,
  Sheet,
  SheetTitle,
  StatusPill,
  Toast,
} from './ui/components';
import { color, font, space } from './ui/tokens';
import { STATE_VISUALS, THINKING_COPY } from './state/machine';
import type { UIState } from './state/types';
import {
  createSeededAdapters,
  SCENARIO_COMMITMENT,
  SCENARIO_EVENT,
  SCENARIO_SPOKEN,
  SCENARIO_SUGGESTION,
  SCENARIO_SUMMARY,
  SCENARIO_TASK,
  SCENARIO_TRANSCRIPT,
} from './adapters/seeded';
import type { Commitment, SlackPresence, TranscriptLine } from './state/types';
import { DemoController } from './demo/DemoController';

const PRESENCE_LABEL: Record<SlackPresence, string> = {
  available: 'Slack · Available',
  focusing: 'Slack · Focusing',
  inMeeting: 'Slack · In a meeting',
  away: 'Slack · Away',
};

export function Deskemon() {
  const adapters = useMemo(() => createSeededAdapters(), []);

  const [state, setState] = useState<UIState>('attentive');
  const [energy, setEnergy] = useState(0);
  const [lines, setLines] = useState<TranscriptLine[]>([]);
  const [caption, setCaption] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [slack, setSlack] = useState<SlackPresence>('available');
  const [saved, setSaved] = useState<Commitment | null>(null);
  const [thinkingIdx, setThinkingIdx] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  const timers = useRef<number[]>([]);
  const after = useCallback((ms: number, fn: () => void) => {
    const id = window.setTimeout(fn, ms);
    timers.current.push(id);
    return id;
  }, []);
  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReducedMotion(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useEffect(() => adapters.slack.subscribe(setSlack), [adapters]);

  // Thinking copy cycles through truthful stages.
  useEffect(() => {
    if (state !== 'thinking') return;
    const id = window.setInterval(
      () => setThinkingIdx((i) => (i + 1) % THINKING_COPY.length),
      1400,
    );
    return () => clearInterval(id);
  }, [state]);

  const visual = STATE_VISUALS[state];
  const muted = state === 'sleeping';

  /* ---------------------------------------------------------------- *
   * The primary demo sequence
   * ---------------------------------------------------------------- */

  const reset = useCallback(() => {
    clearTimers();
    setState('attentive');
    setLines([]);
    setCaption(null);
    setToast(null);
    setSaved(null);
    setEnergy(0);
    void adapters.slack.set('available');
  }, [adapters, clearTimers]);

  const runScenario = useCallback(() => {
    clearTimers();
    setLines([]);
    setCaption(null);
    setSaved(null);

    setState('speechDetected');
    // A gentle simulated envelope so the arcs move like real speech.
    let t = 0;
    const pulse = window.setInterval(() => {
      t += 0.1;
      setEnergy(0.32 + 0.34 * Math.abs(Math.sin(t * 2.1)));
    }, 100);
    timers.current.push(pulse as unknown as number);

    after(900, () => {
      setState('listening');
      setLines([SCENARIO_TRANSCRIPT[0]]);
    });
    after(2600, () => setLines(SCENARIO_TRANSCRIPT));
    after(4100, () => {
      clearInterval(pulse);
      setEnergy(0);
      setState('thinking');
    });
    after(6300, () => setState('memoryCandidate'));
  }, [after, clearTimers]);

  const showConflict = useCallback(() => {
    clearTimers();
    setState('conflict');
    after(700, () => {
      setState('speaking');
      setCaption(SCENARIO_SPOKEN);
      const unsub = adapters.liveVoice.subscribeEnergy(setEnergy);
      void adapters.liveVoice.speak(SCENARIO_SPOKEN).then(() => {
        unsub();
        setEnergy(0);
        setState('conflict');
      });
    });
  }, [adapters, after, clearTimers]);

  const approve = useCallback(() => {
    clearTimers();
    const c: Commitment = {
      ...SCENARIO_COMMITMENT,
      time: SCENARIO_SUGGESTION,
      at: 'today-16:30',
      savedAt: new Date().toISOString(),
    };
    adapters.memory.save(c);
    setSaved(c);
    setCaption(null);
    setState('remembering');
    after(2200, () => setState('summaryReady'));
  }, [adapters, after, clearTimers]);

  const keepOriginal = useCallback(() => {
    clearTimers();
    const c: Commitment = { ...SCENARIO_COMMITMENT, savedAt: new Date().toISOString() };
    adapters.memory.save(c);
    setSaved(c);
    setCaption(null);
    setState('remembering');
    after(2200, () => setState('attentive'));
  }, [adapters, after, clearTimers]);

  const forget = useCallback(() => {
    clearTimers();
    setCaption(null);
    setSaved(null);
    setToast('Forgotten. Nothing was saved.');
    setState('attentive');
    after(2600, () => setToast(null));
  }, [after, clearTimers]);

  const stepAway = useCallback(() => {
    clearTimers();
    setState('away');
    void adapters.slack.set('away');
    setToast('You stepped away · Slack set to Away');
    after(3200, () => setToast(null));
  }, [adapters, after, clearTimers]);

  const comeBack = useCallback(() => {
    clearTimers();
    setState('remembering');
    void adapters.slack.set('available');
    setToast('Welcome back · Slack set to Available');
    after(1600, () => setState('attentive'));
    after(3400, () => setToast(null));
  }, [adapters, after, clearTimers]);

  const togglePrivacy = useCallback(() => {
    clearTimers();
    setCaption(null);
    setState((s) => (s === 'sleeping' ? 'attentive' : 'sleeping'));
  }, [clearTimers]);

  const label =
    state === 'thinking' ? THINKING_COPY[thinkingIdx] : visual.label;

  const showingTranscript =
    (state === 'listening' || state === 'thinking') && lines.length > 0;

  // A right-hand panel is open — the face yields the right side of the screen.
  const panelOpen = ['memoryCandidate', 'conflict', 'speaking', 'summaryReady', 'error'].includes(
    state,
  );

  return (
    <div
      className="companion-app"
      style={{
        position: 'fixed',
        inset: 0,
        background: color.void,
        overflow: 'hidden',
      }}
    >
      {/* ---- The face fills the screen. It IS the interface. ---- */}
      <div
        className={`companion-face-stage${panelOpen ? ' panel-open' : ''}`}
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          right: panelOpen ? 'min(62%, 560px)' : 0,
          display: 'grid',
          placeItems: 'center',
          transition: 'right 420ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <div className="companion-face-canvas" style={{ width: '100%', height: panelOpen ? '46%' : '72%', transition: 'height 420ms cubic-bezier(0.16,1,0.3,1)' }}>
          <Face
            expression={visual.expression}
            energy={energy}
            dim={visual.faceDim}
            reducedMotion={reducedMotion}
          />
        </div>
      </div>

      {/* ---- Top status ---- */}
      <div
        className="companion-topbar"
        style={{
          position: 'absolute',
          top: 'max(14px, env(safe-area-inset-top))',
          left: 'max(16px, env(safe-area-inset-left))',
          right: 'max(16px, env(safe-area-inset-right))',
          display: 'flex',
          alignItems: 'center',
          gap: space.sm,
          zIndex: 3,
        }}
      >
        <StatusPill tone={muted ? 'muted' : visual.micActive ? 'live' : 'neutral'} dot>
          {muted ? 'Muted' : visual.micActive ? 'Listening nearby' : 'Not listening'}
        </StatusPill>
        <StatusPill>{PRESENCE_LABEL[slack]}</StatusPill>
        <div style={{ flex: 1 }} />
        <PrivacyControl muted={muted} onToggle={togglePrivacy} />
      </div>

      {/*
        State label under the face. Hidden while a transcript or sheet is
        showing — the transcript IS the state at that point, and two stacked
        text blocks would collide in a 390px-tall landscape viewport.
      */}
      {!['memoryCandidate', 'conflict', 'summaryReady'].includes(state) &&
        !showingTranscript && (
          <div
            className="companion-state-label"
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: caption ? '30%' : '13%',
              textAlign: 'center',
              font: font.label,
              color: color.textSoft,
              transition: 'bottom 340ms cubic-bezier(0.2,0.8,0.3,1)',
              zIndex: 2,
              padding: '0 24px',
            }}
          >
            {label}
          </div>
        )}

      {/* ---- Live transcript, restrained and fading ---- */}
      {(state === 'listening' || state === 'thinking') && lines.length > 0 && (
        <div
          className="companion-transcript"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: '8%',
            display: 'grid',
            gap: 8,
            justifyItems: 'center',
            padding: '0 24px',
            zIndex: 2,
          }}
        >
          {lines.map((l, i) => (
            <div
              key={l.id}
              style={{
                font: font.body,
                color: i === lines.length - 1 ? color.text : color.textFaint,
                opacity: i === lines.length - 1 ? 1 : 0.5,
                animation: 'caption-in 340ms ease',
                textAlign: 'center',
                maxWidth: 720,
              }}
            >
              <span style={{ color: color.textFaint }}>{l.speaker}: </span>
              {l.text}
            </div>
          ))}
        </div>
      )}

      {/* ---- Spoken captions ---- */}
      {caption && (
        <div
          className={`companion-caption${panelOpen ? ' panel-open' : ''}`}
          style={{
            position: 'absolute',
            left: 0,
            // Captions live under the face, in whatever column the face holds.
            right: panelOpen ? 'min(62%, 560px)' : 0,
            bottom: '10%',
            display: 'grid',
            justifyItems: 'center',
            padding: '0 20px',
            zIndex: 4,
            transition: 'right 420ms cubic-bezier(0.16,1,0.3,1)',
          }}
        >
          <Caption text={caption} />
        </div>
      )}

      {toast && <Toast>{toast}</Toast>}

      {/* ---- Memory candidate ---- */}
      {state === 'memoryCandidate' && (
        <Sheet>
          <SheetTitle>Possible commitment</SheetTitle>
          <FactRow label="What" value={SCENARIO_COMMITMENT.what} />
          <FactRow label="When" value={`Today at ${SCENARIO_COMMITMENT.time}`} />
          <Actions>
            <Button kind="primary" onClick={showConflict}>
              Remember
            </Button>
            <Button kind="secondary" onClick={showConflict}>
              Edit
            </Button>
            <Button kind="ghost" onClick={forget}>
              Forget
            </Button>
          </Actions>
        </Sheet>
      )}

      {/* ---- THE HERO MOMENT ---- */}
      {(state === 'conflict' || state === 'speaking') && (
        <Sheet accent="coral">
          <SheetTitle>That clashes with your day</SheetTitle>
          <FactRow
            label="You committed to"
            value={`${SCENARIO_COMMITMENT.what} · ${SCENARIO_COMMITMENT.time}`}
          />
          <FactRow
            label="But you're booked"
            value={`${SCENARIO_EVENT.title} · ${SCENARIO_EVENT.start}–${SCENARIO_EVENT.end}`}
            tone="coral"
          />
          <FactRow
            label="And Codex is still working"
            value={`${SCENARIO_TASK.title} · running`}
            tone="coral"
          />
          <FactRow label="Suggested" value={`Move to ${SCENARIO_SUGGESTION}`} tone="teal" />
          <Actions>
            <Button kind="primary" onClick={approve}>
              Move to {SCENARIO_SUGGESTION}
            </Button>
            <Button kind="secondary" onClick={keepOriginal}>
              Keep {SCENARIO_COMMITMENT.time}
            </Button>
            <Button kind="ghost" onClick={forget}>
              Forget this
            </Button>
          </Actions>
        </Sheet>
      )}

      {/* ---- Success ---- */}
      {state === 'remembering' && saved && (
        <div
          className="companion-confirmation"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: '14%',
            textAlign: 'center',
            font: font.label,
            color: color.teal,
            zIndex: 3,
          }}
        >
          Got it. {saved.what} · {saved.time}
        </div>
      )}

      {/* ---- Meeting summary ---- */}
      {state === 'summaryReady' && (
        <Sheet accent="teal">
          <SheetTitle>{SCENARIO_SUMMARY.title}</SheetTitle>
          <SummarySection title="Decisions" items={SCENARIO_SUMMARY.decisions} />
          <SummarySection
            title="Action items"
            items={SCENARIO_SUMMARY.actionItems.map(
              (a) => `${a.text} — ${a.owner}${a.due ? ` · ${a.due}` : ''}`,
            )}
          />
          <SummarySection title="Commitments" items={SCENARIO_SUMMARY.commitments} />
          <SummarySection title="Open questions" items={SCENARIO_SUMMARY.openQuestions} />
          <Actions>
            <Button kind="primary" onClick={() => { setToast('Summary saved'); setState('attentive'); after(2400, () => setToast(null)); }}>
              Save summary
            </Button>
            <Button kind="ghost" onClick={() => setState('attentive')}>
              Discard
            </Button>
          </Actions>
        </Sheet>
      )}

      {/* ---- Error ---- */}
      {state === 'error' && (
        <Sheet>
          <SheetTitle>I couldn't reach your calendar</SheetTitle>
          <p style={{ font: font.body, color: color.textSoft, margin: `0 0 ${space.sm}px` }}>
            The commitment is still here — nothing was lost.
          </p>
          <FactRow label="Held" value={`${SCENARIO_COMMITMENT.what} · ${SCENARIO_COMMITMENT.time}`} />
          <Actions>
            <Button kind="primary" onClick={showConflict}>Try again</Button>
            <Button kind="secondary" onClick={() => setState('memoryCandidate')}>
              Use demo mode
            </Button>
          </Actions>
        </Sheet>
      )}

      <DemoController
        state={state}
        setState={setState}
        runScenario={runScenario}
        showConflict={showConflict}
        reset={reset}
        stepAway={stepAway}
        comeBack={comeBack}
        setEnergy={setEnergy}
        liveVoiceAvailable={adapters.liveVoice.available}
      />
    </div>
  );
}

function SummarySection({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div style={{ marginBottom: space.md }}>
      <div style={{ font: font.meta, color: color.textFaint, marginBottom: 5 }}>
        {title}
      </div>
      <ul style={{ margin: 0, paddingLeft: 18, font: font.body, color: color.text }}>
        {items.map((t) => (
          <li key={t} style={{ marginBottom: 4 }}>
            {t}
          </li>
        ))}
      </ul>
    </div>
  );
}
