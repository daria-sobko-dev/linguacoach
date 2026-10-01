import { z } from 'zod';

export const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;

export const RequestSchema = z.object({
  text: z.string().trim().min(20, 'Text is too short, paste at least one sentence.').max(4000, 'Text is too long (max 4000 characters).'),
  level: z.enum(LEVELS),
  nativeLanguage: z.string().trim().min(2).max(30).default('English'),
  count: z.number().int().min(3).max(12).default(6),
});
export type GenerateRequest = z.infer<typeof RequestSchema>;

export const CardSchema = z.object({
  word: z.string().min(1),
  partOfSpeech: z.string(),
  level: z.enum(LEVELS),
  translation: z.string().min(1),
  definition: z.string().min(1),
  exampleFromText: z.string().min(1),
  newExample: z.string().min(1),
});

export const QuizSchema = z.object({
  question: z.string().min(1),
  options: z.array(z.string().min(1)).length(4),
  answerIndex: z.number().int().min(0).max(3),
  explanation: z.string(),
});

export const ResponseSchema = z.object({
  detectedLanguage: z.string(),
  textLevel: z.enum(LEVELS),
  cards: z.array(CardSchema).min(1),
  quiz: z.array(QuizSchema).min(1),
});
export type Card = z.infer<typeof CardSchema>;
export type QuizItem = z.infer<typeof QuizSchema>;
export type GenerateResponse = z.infer<typeof ResponseSchema> & { demo?: boolean; notice?: string };