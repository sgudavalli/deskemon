import { useState } from 'react';
import { Face } from './Face';
import { EXPRESSIONS } from './expressions';
import type { ExpressionName } from './types';

const NAMES = Object.keys(EXPRESSIONS) as ExpressionName[];

/**
 * /face-lab — a tuning surface, not part of the product.
 * Shows every expression at once, plus a large solo view with a simulated
 * energy slider so audio-driven states can be judged without a microphone.
 */
export function FaceLab() {
  const [solo, setSolo] = useState<ExpressionName>('neutral');
  const [energy, setEnergy] = useState(0.5);

  return (
    <div style={{ background: '#07080c', minHeight: '100vh', color: '#fff', padding: 24 }}>
      <h1 style={{ font: '600 20px system-ui', margin: '0 0 4px' }}>Face lab</h1>
      <p style={{ font: '14px system-ui', color: '#8b93a7', margin: '0 0 24px' }}>
        All 20 expressions, held still so the geometry reads true. Click one to solo
        it — the solo view breathes and blinks. Not part of the product.
      </p>

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 22, alignItems: 'flex-start' }}>
        <div
          style={{
            flex: '0 1 420px',
            aspectRatio: '2 / 1',
            background: '#000',
            borderRadius: 20,
            overflow: 'hidden',
          }}
        >
          <Face expression={solo} energy={energy} />
        </div>
        <div style={{ flex: '0 0 240px', font: '14px system-ui' }}>
          <div style={{ marginBottom: 12, fontWeight: 600 }}>{solo}</div>
          <label style={{ display: 'block', color: '#8b93a7', marginBottom: 6 }}>
            simulated energy {energy.toFixed(2)}
          </label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={energy}
            onChange={(e) => setEnergy(Number(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
          gap: 14,
        }}
      >
        {NAMES.map((n) => (
          <button
            key={n}
            onClick={() => setSolo(n)}
            style={{
              background: '#000',
              border: n === solo ? '2px solid #4ecdc4' : '1px solid #1c2130',
              borderRadius: 14,
              padding: 0,
              overflow: 'hidden',
              cursor: 'pointer',
            }}
          >
            <div style={{ aspectRatio: '2 / 1' }}>
              <Face expression={n} energy={energy} still />
            </div>
            <div
              style={{
                font: '12px system-ui',
                color: '#8b93a7',
                padding: '8px 0 10px',
                background: '#0d0f16',
              }}
            >
              {n}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
