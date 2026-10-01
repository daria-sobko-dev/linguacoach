import { useState } from 'react';
import type { Card } from '../../lib/schema';

export function Flashcard({ card }: { card: Card }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <button className={`card ${flipped ? 'flipped' : ''}`} onClick={() => setFlipped((f) => !f)} aria-label={`Flashcard ${card.word}`}>
      <div className="card-inner">
        <div className="card-face front">
          <span className="badge">{card.level}</span>
          <h3>{card.word}</h3>
          <p className="muted">{card.partOfSpeech}</p>
          <p className="example">“{card.exampleFromText}”</p>
          <span className="hint">Tap to see meaning</span>
        </div>
        <div className="card-face back">
          <h3>{card.translation}</h3>
          <p>{card.definition}</p>
          <p className="example">{card.newExample}</p>
          <span className="hint">Tap to flip back</span>
        </div>
      </div>
    </button>
  );
}
