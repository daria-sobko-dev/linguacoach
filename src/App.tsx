import { useState } from 'react';
import { LEVELS, type GenerateResponse } from '../lib/schema';
import { generateCards } from './api';
import { Flashcard } from './components/Flashcard';
import { Quiz } from './components/Quiz';

const SAMPLE =
  'Quiero aprovechar el fin de semana para descansar. A pesar de la lluvia, fuimos a la playa con mis amigos. La empresa donde trabajo quiere desarrollar nuevas ideas para ayudar a los estudiantes a aprender idiomas de forma más natural.';

type Level = (typeof LEVELS)[number];

export default function App() {
  const [text, setText] = useState('');
  const [level, setLevel] = useState<Level>('B1');
  const [nativeLanguage, setNativeLanguage] = useState('English');
  const [count, setCount] = useState(6);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<GenerateResponse | null>(null);
  const [tab, setTab] = useState<'cards' | 'quiz'>('cards');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await generateCards({ text, level, nativeLanguage, count });
      setData(result);
      setTab('cards');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <header>
        <h1>🦉 LinguaCoach</h1>
        <p className="muted">Paste any text in the language you are learning. AI picks the words that match your level and turns them into flashcards and a quiz.</p>
      </header>

      <form className="panel" onSubmit={onSubmit}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste an article, song lyrics you own, a message from a friend…"
          rows={6}
        />
        <div className="controls">
          <label>My level
            <select value={level} onChange={(e) => setLevel(e.target.value as Level)}>
              {LEVELS.map((l) => <option key={l}>{l}</option>)}
            </select>
          </label>
          <label>Explain in
            <select value={nativeLanguage} onChange={(e) => setNativeLanguage(e.target.value)}>
              {['English', 'Ukrainian', 'Spanish', 'German', 'Polish'].map((l) => <option key={l}>{l}</option>)}
            </select>
          </label>
          <label>Words
            <input type="number" min={3} max={12} value={count} onChange={(e) => setCount(Number(e.target.value))} />
          </label>
          <button type="button" className="ghost" onClick={() => setText(SAMPLE)}>Use sample</button>
          <button type="submit" className="primary" disabled={loading || text.trim().length < 20}>
            {loading ? 'Generating…' : 'Generate'}
          </button>
        </div>
        {error && <p className="error">{error}</p>}
      </form>

      {data && (
        <section>
          {data.demo && <p className="notice">Demo mode: no API key configured, showing sample output.</p>}
          <p className="muted">Detected: <b>{data.detectedLanguage}</b> · Text level: <b>{data.textLevel}</b></p>
          <div className="tabs">
            <button className={tab === 'cards' ? 'active' : ''} onClick={() => setTab('cards')}>Flashcards ({data.cards.length})</button>
            <button className={tab === 'quiz' ? 'active' : ''} onClick={() => setTab('quiz')}>Quiz ({data.quiz.length})</button>
          </div>
          {tab === 'cards' ? (
            <div className="grid">{data.cards.map((c) => <Flashcard key={c.word} card={c} />)}</div>
          ) : (
            <Quiz key={data.quiz.map((q) => q.question).join()} items={data.quiz} />
          )}
        </section>
      )}

      <footer className="muted">Built with React, TypeScript, Gemini API and Zod.</footer>
    </div>
  );
}
