import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// Lets `npm run dev` serve /api/generate locally, the same handler Vercel runs in production.
function localApi(): Plugin {
  return {
    name: 'local-api',
    configureServer(server) {
      server.middlewares.use('/api/generate', async (req, res) => {
        let body = '';
        req.on('data', (c) => (body += c));
        req.on('end', async () => {
          const { generate } = await server.ssrLoadModule('/lib/core.ts');
          try {
            const result = await generate(JSON.parse(body || '{}'), process.env);
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(result));
          } catch (e: any) {
            res.statusCode = e.status ?? 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: e.message ?? 'Server error' }));
          }
        });
      });
    },
  };
}

export default defineConfig({ plugins: [react(), localApi()] });
