import type { FastifyInstance } from 'fastify';
import type { ServerConfig } from '../types.js';

export function registerConfigRoute(app: FastifyInstance, config: ServerConfig): void {
  app.get('/api/config', async () => {
    return config;
  });
}
