import { useState } from 'react';
import wavingPet from '../../assets/pet/motions/waving.gif';
import { TransparentPet } from './TransparentPet';
import './splash.css';

export function Splash({ onEnter }: { onEnter: () => void }) {
  const [leaving, setLeaving] = useState(false);

  const enterCompanion = () => {
    if (leaving) return;
    setLeaving(true);
    window.setTimeout(onEnter, 640);
  };

  return (
    <main className={`splash-screen${leaving ? ' is-leaving' : ''}`}>
      <div className="splash-ambient" aria-hidden="true">
        <span className="splash-orbit splash-orbit-one" />
        <span className="splash-orbit splash-orbit-two" />
      </div>

      <section className="splash-content" aria-labelledby="splash-title">
        <div className="splash-kicker">
          <span />
          Your Codex pet, now beside you
        </div>

        <h1 id="splash-title">Deskémon</h1>

        <button
          className="splash-pet-button"
          type="button"
          onClick={enterCompanion}
          aria-label="Wake Deskémon and enter companion mode"
        >
          <span className="splash-pet-halo" aria-hidden="true" />
          <TransparentPet src={wavingPet} label="Baymax waving" />
          <span className="splash-touch-ring" aria-hidden="true" />
        </button>

        <p className="splash-prompt">
          <span>Tap your companion to wake them</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="m8 10 4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </p>
      </section>

      <p className="splash-footnote">AMBIENT COMPANION · LOCAL PROTOTYPE</p>
    </main>
  );
}
