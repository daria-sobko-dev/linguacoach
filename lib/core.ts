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

// Asks Google which models this API key can use, so we can fall back automatically.
async function listFlashModels(env: Env): Promise<string[]> {
  try {
    const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=200', {
      headers: { 'x-goog-api-key': env.GEMINI_API_KEY! },
    });
    if (!res.ok) return [];
    const data: any = await res.json();
    return (data.models ?? [])
      .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
      .map((m: any) => String(m.name).replace(/^models\//, ''))
      .filter((n: string) => n.includes('flash') && !/(image|tts|audio|live|embedding|thinking-exp)/.test(n));
  } catch {
    return [];
  }
}

const TEMPORARY = [429, 500, 503];

// Tries the main model, then fallbacks. Temporary errors (overload, rate limit) are retried with backoff.
// If every configured model is busy, it discovers other available "flash" models and tries them too.
async function callGemini(prompt: string, env: Env): Promise<unknown> {
  const configured = [env.GEMINI_MODEL || 'gemini-3.8-flash', ...(env.GEMINI_FALLBACK_MODELS || '').split(',')]
    .map((m) => m.trim())
    .filter(Boolean);
  const tried = new Set<string>();
  let lastStatus = 0;

  const tryModel = async (model: string, attempts: number): Promise<unknown | undefined> => {
    tried.add(model);
    for (let attempt = 0; attempt < attempts; attempt++) {
      const res = await callModel(model, prompt, env);
      if (res.ok) {
        const data: any = await res.json();
        const raw: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!raw) throw new HttpError(502, 'AI returned an empty response.');
        return JSON.parse(raw.replace(/^```json\s*|```$/g, ''));
      }
      lastStatus = res.status;
      if (res.status === 404) return undefined; // model not available for this key, try the next one
      if (!TEMPORARY.includes(res.status)) {
        const detail = await res.text();
        throw new HttpError(502, `AI provider error (${res.status}): ${detail.slice(0, 200)}`);
      }
      if (res.status === 429) return undefined; // quota for this model is used up, switch model
      if (attempt < attempts - 1) await sleep(2000);
    }
    return undefined;
  };

  for (const model of configured) {
    const result = await tryModel(model, 2);
    if (result !== undefined) return result;
  }
  const discovered = (await listFlashModels(env)).filter((m) => !tried.has(m)).slice(0, 4);
  for (const model of discovered) {
    const result = await tryModel(model, 1);
    if (result !== undefined) return result;
  }
  throw new HttpError(503, `The AI model is busy right now (status ${lastStatus}). Please try again in a minute.`);
}

// Same text + settings returns the cached result, which saves the free-tier quota.
const cache = new Map<string, GenerateResponse>();

export async function generate(body: unknown, env: Env): Promise<GenerateResponse> {
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) throw new HttpError(400, parsed.error.issues[0]?.message ?? 'Invalid request');

  if (!env.GEMINI_API_KEY) return DEMO_RESPONSE;

  const key = JSON.stringify(parsed.data);
  const cached = cache.get(key);
  if (cached) return cached;

  const prompt = buildPrompt(parsed.data);
  // LLM output is validated with Zod; one retry if the JSON does not match the schema.
  let lastError = '';
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const json = await callGemini(prompt, env);
      const result = ResponseSchema.safeParse(json);
      if (result.success) {
        cache.set(key, result.data);
        return result.data;
      }
      lastError = result.error.issues[0]?.message ?? 'Schema mismatch';
    } catch (e) {
      // All models are busy or out of free quota: show the example instead of a broken page.
      if (e instanceof HttpError && e.status === 503) {
        return { ...DEMO_RESPONSE, notice: 'The free AI quota is busy or used up right now, so this is an example result. Try again later for a live one.' };
      }
      if (e instanceof HttpError) throw e;
      lastError = (e as Error).message;
    }
  }
  throw new HttpError(502, `AI response did not match the expected format: ${lastError}`);
}