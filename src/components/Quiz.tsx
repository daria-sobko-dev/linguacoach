import { useState } from 'react';
import type { QuizItem } from '../../lib/schema';

export function Quiz({ items }: { items: QuizItem[] }) {
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const done = index >= items.length;

  if (done) {
    return (
      <div className="quiz-done">
        <h3>{score} / {items.length} correct</h3>
        <p className="muted">{score === items.length ? 'Perfect! These words are yours.' : 'Review the cards and try again.'}</p>
        <button className="primary" onClick={() => { setIndex(0); setScore(0); setPicked(null); }}>Try again</button>
      </div>
    );
  }

  const q = items[index];
  const choose = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    if (i === q.answerIndex) setScore((s) => s + 1);
  };

  return (
    <div className="quiz">
      <p className="muted">Question {index + 1} of {items.length}</p>
      <h3>{q.question}</h3>
      <div className="options">
        {q.options.map((opt, i) => {
          const state = picked === null ? '' : i === q.answerIndex ? 'correct' : i === picked ? 'wrong' : 'dim';
          return (
            <button key={i} className={`option ${state}`} onClick={() => choose(i)}>{opt}</button>
          );
        })}
      </div>
      {picked !== null && (
        <>
          <p className="explanation">{q.explanation}</p>
          <button className="primary" onClick={() => { setIndex((n) => n + 1); setPicked(null); }}>
            {index + 1 === items.length ? 'See result' : 'Next'}
          </button>
        </>
      )}
    </div>
  );
}
