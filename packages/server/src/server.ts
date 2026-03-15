import Fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyRateLimit from '@fastify/rate-limit';
import fastifyWebsocket from '@fastify/websocket';
import type { FastifyInstance } from 'fastify';
import { registerHealthRoute } from './routes/health.js';
import { registerConfigRoute } from './routes/config.js';
import { registerRoutes } from './routes/files.js';
import { createFileWatcher, type FileWatchEvent } from './watcher.js';
import { resolveWatchPaths } from './source-dirs.js';
import type { ServerOptions } from './types.js';

export async function createServer(options: ServerOptions): Promise<FastifyInstance> {
  const app = Fastify({ bodyLimit: 1_048_576 });

  await app.register(fastifyCors, {
    origin: options.corsOrigin,
  });

  await app.register(fastifyRateLimit, { max: 1000, timeWindow: '1 minute' });
  await app.register(fastifyWebsocket);

  registerHealthRoute(app);
  registerConfigRoute(app, {
    mode: options.readOnly ? 'readonly' : 'readwrite',
    workspace: options.workspace,
  });
  registerRoutes(app, options.workspace, options.readOnly);

  const clients = new Set<import('ws').WebSocket>();

  app.get('/ws', { websocket: true }, (socket) => {
    clients.add(socket);
    socket.on('close', () => clients.delete(socket));
  });

  const watchPaths = await resolveWatchPaths(options.workspace);
  const watcher = createFileWatcher(options.workspace, watchPaths, (event: FileWatchEvent) => {
    const message = JSON.stringify(event);
    for (const client of clients) {
      if (client.readyState === 1) {
        client.send(message);
      }
    }
  });

  app.addHook('onClose', async () => {
    await watcher.close();
    for (const client of clients) {
      client.close();
    }
  });

  return app;
}

export async function startServer(options: ServerOptions): Promise<void> {
  const app = await createServer(options);

  const shutdown = (): void => {
    // Force exit after 3s if graceful close hangs (e.g. polling watcher)
    const forceTimer = setTimeout(() => process.exit(0), 3000);
    forceTimer.unref();
    app.close().then(
      () => process.exit(0),
      () => process.exit(1)
    );
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  try {
    await app.listen({ port: options.port, host: options.host });
  } catch (err: unknown) {
    if (
      err instanceof Error &&
      'code' in err &&
      (err as NodeJS.ErrnoException).code === 'EADDRINUSE'
    ) {
      console.error(`Port ${options.port} is already in use. Try --port <alternative>`);
      process.exit(1);
    }
    throw err;
  }

  const displayHost = options.host === '0.0.0.0' ? 'localhost' : options.host;
  const playgroundUrl = `https://getpromptscript.dev/playground/?server=${displayHost}:${options.port}`;

  console.log(`\nPromptScript server running at http://${displayHost}:${options.port}`);
  console.log(`Open playground: ${playgroundUrl}`);
  console.log(
    `\nAll compilation happens locally in your browser — no data is sent to any external server.`
  );
}
