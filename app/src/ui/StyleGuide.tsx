import {
  Actions,
  Button,
  Caption,
  FactRow,
  SheetTitle,
  StatusPill,
  Toast,
} from './components';
import { PrivacyControl } from './PrivacyControl';
import { color, font, radius, space } from './tokens';
import { useState } from 'react';

/** #style — the living component reference. Not part of the product. */
export function StyleGuide() {
  const [muted, setMuted] = useState(false);

  return (
    <div
      style={{
        background: '#07080c',
        minHeight: '100vh',
        color: color.text,
        padding: 28,
        overflowY: 'auto',
        position: 'fixed',
        inset: 0,
      }}
    >
      <h1 style={{ font: font.title, margin: '0 0 6px' }}>Deskemon UI guide</h1>
      <p style={{ font: font.body, color: color.textSoft, margin: '0 0 8px', maxWidth: 620 }}>
        Soft, rounded, generous. Nothing sharp, nothing dense, one accent at a time.
      </p>
      <p style={{ font: font.meta, color: color.coral, margin: '0 0 28px', maxWidth: 620 }}>
        Rule: the face is never tinted. Colour lives only here, in the information layer.
      </p>

      <Section title="Colour · measured contrast">
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
          {(
            [
              ['void', color.void],
              ['surface', color.surface],
              ['raised', color.surfaceRaised],
              ['line', color.line],
              ['text', color.text],
              ['textSoft', color.textSoft],
              ['textFaint', color.textFaint],
              ['coral', color.coral],
              ['teal', color.teal],
            ] as const
          ).map(([n, c]) => (
            <div key={n} style={{ width: 92 }}>
              <div
                style={{
                  height: 52,
                  background: c,
                  borderRadius: radius.sm,
                  border: `1px solid ${color.line}`,
                }}
              />
              <div style={{ font: font.meta, color: color.textFaint, marginTop: 5 }}>{n}</div>
            </div>
          ))}
        </div>
        <table style={{ borderCollapse: 'collapse', font: font.meta }}>
          <tbody>
            {(
              [
                ['white on void', '21.00', 'AAA'],
                ['white on surface', '18.07', 'AAA'],
                ['teal on surface', '9.34', 'AAA'],
                ['textSoft on surface', '8.31', 'AAA'],
                ['coral on surface', '6.47', 'AA'],
                ['textFaint on surface', '5.27', 'AA'],
              ] as const
            ).map(([pair, r, grade]) => (
              <tr key={pair}>
                <td style={{ padding: '5px 18px 5px 0', color: color.textSoft }}>{pair}</td>
                <td
                  style={{
                    padding: '5px 14px 5px 0',
                    color: color.text,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {r}:1
                </td>
                <td style={{ padding: '5px 0', color: color.teal }}>{grade}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p style={{ font: font.meta, color: color.textFaint, marginTop: 12, maxWidth: 520 }}>
          textFaint was #6b7488 at 3.85:1 — failing AA for 14px labels. Raised to #818b9e.
        </p>
      </Section>

      <Section title="Type">
        <div style={{ display: 'grid', gap: 8 }}>
          <div style={{ font: font.title }}>Title · 25px semibold</div>
          <div style={{ font: font.label }}>Label · 19px semibold — glanceable at arm's length</div>
          <div style={{ font: font.body, color: color.textSoft }}>
            Body · 17px — short sentences only, never a wall of text
          </div>
          <div style={{ font: font.meta, color: color.textFaint }}>Meta · 14px</div>
        </div>
      </Section>

      <Section title="Buttons — min 52px touch target">
        <Actions>
          <Button kind="primary">Move to 4:30 PM</Button>
          <Button kind="secondary">Keep 3:00 PM</Button>
          <Button kind="ghost">Forget this</Button>
          <Button kind="danger">Delete</Button>
        </Actions>
      </Section>

      <Section title="Status pills & privacy control">
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <StatusPill tone="live" dot>Listening nearby</StatusPill>
          <StatusPill tone="muted" dot>Muted</StatusPill>
          <StatusPill>Slack · Available</StatusPill>
          <PrivacyControl muted={muted} onToggle={() => setMuted((m) => !m)} />
        </div>
      </Section>

      <Section title="Sheet content">
        <div
          style={{
            background: color.surface,
            border: `1px solid ${color.line}`,
            borderRadius: radius.lg,
            padding: space.lg,
            maxWidth: 560,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 3,
              background: color.coral,
            }}
          />
          <SheetTitle>That clashes with your day</SheetTitle>
          <FactRow label="You committed to" value="Send revised prototype · 3:00 PM" />
          <FactRow label="But you're booked" value="Portfolio review · 2:00–3:00" tone="coral" />
          <FactRow label="Suggested" value="Move to 4:30 PM" tone="teal" />
          <Actions>
            <Button kind="primary">Move to 4:30 PM</Button>
            <Button kind="ghost">Forget this</Button>
          </Actions>
        </div>
      </Section>

      <Section title="Caption & toast">
        <div style={{ display: 'grid', gap: 16, justifyItems: 'start' }}>
          <Caption text="Champ, you're booked until three. Should we move that to 4:30?" />
          <div style={{ position: 'relative', height: 56, width: 340 }}>
            <Toast>You stepped away · Slack set to Away</Toast>
          </div>
        </div>
      </Section>

      <Section title="Routes">
        <div style={{ font: font.body, color: color.textSoft, display: 'grid', gap: 6 }}>
          <a href="#" style={{ color: color.teal }}>#  — live companion screen</a>
          <a href="#face-lab" style={{ color: color.teal }}>#face-lab — all 20 expressions</a>
          <a href="?demo=1" style={{ color: color.teal }}>?demo=1 — presenter controls</a>
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 36 }}>
      <h2
        style={{
          font: font.meta,
          color: color.textFaint,
          textTransform: 'uppercase',
          letterSpacing: 1.2,
          margin: '0 0 14px',
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}
