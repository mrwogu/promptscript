import { ConsoleOutput } from '../output/console.js';

interface ServeOptions {
  port?: string;
  host?: string;
  readOnly?: boolean;
  corsOrigin?: string;
}

export async function serveCommand(options: ServeOptions): Promise<void> {
  const port = options.port === undefined ? 3000 : Number(options.port);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    ConsoleOutput.error(`Invalid port "${options.port}". Expected an integer from 1 to 65535.`);
    process.exitCode = 1;
    return;
  }

  try {
    const { startServer } = await import('@promptscript/server');
    await startServer({
      port,
      host: options.host ?? '127.0.0.1',
      workspace: process.cwd(),
      readOnly: options.readOnly ?? false,
      corsOrigin: options.corsOrigin ?? 'https://getpromptscript.dev',
    });
  } catch (error) {
    ConsoleOutput.error(
      `Failed to start server: ${error instanceof Error ? error.message : String(error)}`
    );
    process.exitCode = 1;
  }
}
