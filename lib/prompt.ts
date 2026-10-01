import type { GenerateRequest } from './schema.js';

export function buildPrompt({ text, level, nativeLanguage, count }: GenerateRequest): string {
  return `You are an experienced language tutor. A learner at CEFR level ${level} wants to learn vocabulary from the text below.

TASK
1. Detect the language of the text and estimate the CEFR level of the text as a whole.
2. Pick exactly ${count} words or short expressions FROM THE TEXT that are most useful for this learner:
   - slightly above their level (${level} or one level higher), not trivial words they surely know;
   - prefer words that are frequent in everyday language over rare ones;
   - use the dictionary form (infinitive, singular) in "word".
3. For each word give: part of speech, its CEFR level, a translation into ${nativeLanguage}, a short simple definition in ${nativeLanguage},
   the exact sentence from the text where it appears ("exampleFromText"), and one NEW natural example sentence in the text's language ("newExample").
4. Create ${Math.min(count, 5)} multiple-choice quiz questions that check meaning or usage of the chosen words.
   Each has exactly 4 options, one correct ("answerIndex" is 0-3), and a one-sentence explanation in ${nativeLanguage}.
   Vary the position of the correct answer.

Return ONLY valid JSON with this exact shape:
{
  "detectedLanguage": string,
  "textLevel": "A1"|"A2"|"B1"|"B2"|"C1"|"C2",
  "cards": [{ "word": string, "partOfSpeech": string, "level": "A1"|"A2"|"B1"|"B2"|"C1"|"C2", "translation": string, "definition": string, "exampleFromText": string, "newExample": string }],
  "quiz": [{ "question": string, "options": [string, string, string, string], "answerIndex": number, "explanation": string }]
}

TEXT:
"""
${text}
"""`;
}
