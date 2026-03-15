import type { FastifyInstance } from 'fastify';
import type { ServerConfig } from '../types.js';
import { readProjectConfig } from '../source-dirs.js';

export function registerConfigRoute(
  app: FastifyInstance,
  config: ServerConfig,
  workspace: string
): void {
  app.get('/api/config', async () => {
    const projectConfig = await readProjectConfig(workspace);
    return { ...config, project: projectConfig };
  });
}
