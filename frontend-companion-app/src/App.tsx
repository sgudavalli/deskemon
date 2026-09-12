import { useState } from 'react';
import { Deskemon } from './Deskemon';
import { FaceLab } from './face/FaceLab';
import { Scenarios } from './scenarios/Scenarios';
import { Splash } from './splash/Splash';
import { StyleGuide } from './ui/StyleGuide';

function CompanionEntry() {
  const parameters = new URLSearchParams(window.location.search);
  const bypassSplash = parameters.get('demo') === '1' || parameters.get('companion') === '1';
  const [entered, setEntered] = useState(bypassSplash);

  return entered ? <Deskemon /> : <Splash onEnter={() => setEntered(true)} />;
}

// Minimal hash routing keeps the prototype dependency-free.
export function App() {
  const hash = window.location.hash;
  if (hash.startsWith('#face-lab')) return <FaceLab />;
  if (hash.startsWith('#style')) return <StyleGuide />;
  if (hash.startsWith('#scenarios')) return <Scenarios />;
  return <CompanionEntry />;
}
