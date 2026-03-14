import { startServer } from '@promptscript/server';

interface ServeOptions {
  port?: string;
  host?: string;
  readOnly?: boolean;
  corsOrigin?: string;
}

export async function serveCommand(options: ServeOptions): Promise<void> {
  await startServer({
    port: options.port ? parseInt(options.port, 10) : 3000,
    host: options.host ?? '127.0.0.1',
    workspace: process.cwd(),
    readOnly: options.readOnly ?? false,
    corsOrigin: options.corsOrigin ?? 'https://getpromptscript.dev',
  });
}
