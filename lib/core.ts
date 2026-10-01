import { RequestSchema, ResponseSchema, type GenerateResponse } from './schema.js';
import { buildPrompt } from './prompt.js';
import { DEMO_RESPONSE } from './demo.js';

export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

type Env = Record<string, string | undefined>;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function callModel(model: string, prompt: string, env: Env): Promise<Response> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY! },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json', temperature: 0.4 },
    }),
  });
}

// Tries the main model, then fallbacks. Temporary errors (overload, rate limit) are retried with backoff.
async function callGemini(prompt: string, env: Env): Promise<unknown> {
  const models = [env.GEMINI_MODEL || 'gemini-3.8-flash', ...(env.GEMINI_FALLBACK_MODELS || '').split(',')]
    .map((m) => m.trim())
    .filter(Boolean);
  let lastStatus = 0;
  for (const model of models) {
    for (let attempt = 0; attempt < 3; attempt++) {
      const res = await callModel(model, prompt, env);
      if (res.ok) {
        const data: any = await res.json();
        const raw: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!raw) throw new HttpError(502, 'AI returned an empty response.');
        return JSON.parse(raw.replace(/^```json\s*|```$/g, ''));
      }
      lastStatus = res.status;
      if (![429, 500, 503].includes(res.status)) {
        const detail = await res.text();
        throw new HttpError(502, `AI provider error (${res.status}): ${detail.slice(0, 200)}`);
      }
      await sleep(1000 * 2 ** attempt); // 1s, 2s, 4s
    }
  }
  throw new HttpError(503, `The AI model is busy right now (status ${lastStatus}). Please try again in a minute.`);
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
