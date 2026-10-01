import { generate, HttpError } from '../lib/core';

// Vercel serverless function: POST /api/generate
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const result = await generate(body, process.env);
    return res.status(200).json(result);
  } catch (e) {
    const status = e instanceof HttpError ? e.status : 500;
    return res.status(status).json({ error: (e as Error).message || 'Server error' });
  }
}
