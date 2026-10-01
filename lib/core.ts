import { RequestSchema, ResponseSchema, type GenerateResponse } from './schema.js';
import { buildPrompt } from './prompt.js';
import { DEMO_RESPONSE } from './demo.js';

export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

type Env = Record<string, string | undefined>;

async function callGemini(prompt: string, env: Env): Promise<unknown> {
  const model = env.GEMINI_MODEL || 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY! },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json', temperature: 0.4 },
    }),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new HttpError(502, `AI provider error (${res.status}): ${detail.slice(0, 200)}`);
  }
  const data: any = await res.json();
  const raw: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!raw) throw new HttpError(502, 'AI returned an empty response.');
  return JSON.parse(raw.replace(/^```json\s*|```$/g, ''));
}

export async function generate(body: unknown, env: Env): Promise<GenerateResponse> {
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) throw new HttpError(400, parsed.error.issues[0]?.message ?? 'Invalid request');

  if (!env.GEMINI_API_KEY) return DEMO_RESPONSE;

  const prompt = buildPrompt(parsed.data);
  // LLM output is validated with Zod; one retry if the JSON does not match the schema.
  let lastError = '';
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const json = await callGemini(prompt, env);
      const result = ResponseSchema.safeParse(json);
      if (result.success) return result.data;
      lastError = result.error.issues[0]?.message ?? 'Schema mismatch';
    } catch (e) {
      if (e instanceof HttpError) throw e;
      lastError = (e as Error).message;
    }
  }
  throw new HttpError(502, `AI response did not match the expected format: ${lastError}`);
}
