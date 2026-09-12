import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './ui/global.css';
import { Deskemon } from './Deskemon';
import { FaceLab } from './face/FaceLab';
import { StyleGuide } from './ui/StyleGuide';
import { Scenarios } from './scenarios/Scenarios';

// Minimal hash routing — no router dependency needed for three views.
function Root() {
  const h = window.location.hash;
  if (h.startsWith('#face-lab')) return <FaceLab />;
  if (h.startsWith('#style')) return <StyleGuide />;
  if (h.startsWith('#scenarios')) return <Scenarios />;
  return <Deskemon />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);

window.addEventListener('hashchange', () => window.location.reload());
