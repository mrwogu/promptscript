import type { FastifyInstance } from 'fastify';

export function registerHealthRoute(app: FastifyInstance): void {
  app.get('/api/health', async () => {
    return { status: 'ok' };
  });
}
