import type { GenerateResponse } from './schema.js';

// Returned when no API key is configured, so the UI can still be explored.
export const DEMO_RESPONSE: GenerateResponse = {
  demo: true,
  detectedLanguage: 'Spanish',
  textLevel: 'B1',
  cards: [
    { word: 'aprovechar', partOfSpeech: 'verb', level: 'B1', translation: 'to make the most of', definition: 'To use an opportunity or resource well.', exampleFromText: 'Quiero aprovechar el fin de semana para descansar.', newExample: 'Aprovecha el buen tiempo y sal a caminar.' },
    { word: 'a pesar de', partOfSpeech: 'phrase', level: 'B1', translation: 'despite', definition: 'Used to say something happens even though there is a problem.', exampleFromText: 'A pesar de la lluvia, fuimos a la playa.', newExample: 'A pesar de estar cansada, terminó el proyecto.' },
    { word: 'desarrollar', partOfSpeech: 'verb', level: 'B2', translation: 'to develop', definition: 'To grow or make something grow and improve.', exampleFromText: 'La empresa quiere desarrollar nuevas ideas.', newExample: 'Leer mucho ayuda a desarrollar el vocabulario.' },
  ],
  quiz: [
    { question: 'What does "a pesar de" mean?', options: ['because of', 'despite', 'instead of', 'next to'], answerIndex: 1, explanation: '"A pesar de" introduces something that does not stop the action.' },
    { question: 'Choose the correct word: "___ el tiempo libre para estudiar."', options: ['Desarrolla', 'Aprovecha', 'A pesar de', 'Descansa'], answerIndex: 1, explanation: '"Aprovechar" means to use time or an opportunity well.' },
  ],
};
