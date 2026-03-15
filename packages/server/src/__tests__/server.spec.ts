import { mkdtemp, writeFile, mkdir, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { vi } from 'vitest';
import { createServer, startServer } from '../server.js';
import type { FastifyInstance } from 'fastify';

describe('createServer', () => {
  let workspace: string;
  let server: FastifyInstance;

  beforeEach(async () => {
    workspace = await mkdtemp(join(tmpdir(), 'prs-server-'));
    await mkdir(join(workspace, 'src'), { recursive: true });
    await writeFile(join(workspace, 'src/test.prs'), '@identity Test');
  });

  afterEach(async () => {
    if (server) await server.close();
    await rm(workspace, { recursive: true, force: true });
  });

  it('creates a Fastify server with all routes registered', async () => {
    server = await createServer({
      port: 0,
      host: '127.0.0.1',
      workspace,
      readOnly: false,
      corsOrigin: 'https://getpromptscript.dev',
    });
    await server.ready();

    const health = await server.inject({ method: 'GET', url: '/api/health' });
    expect(health.statusCode).toBe(200);

    const config = await server.inject({ method: 'GET', url: '/api/config' });
    expect(config.statusCode).toBe(200);
    expect(config.json().mode).toBe('readwrite');

    const files = await server.inject({ method: 'GET', url: '/api/files' });
    expect(files.statusCode).toBe(200);
    expect(files.json().files.length).toBeGreaterThan(0);
  });

  it('sets CORS headers for allowed origin', async () => {
    server = await createServer({
      port: 0,
      host: '127.0.0.1',
      workspace,
      readOnly: false,
      corsOrigin: 'https://getpromptscript.dev',
    });
    await server.ready();

    const res = await server.inject({
      method: 'OPTIONS',
      url: '/api/health',
      headers: {
        origin: 'https://getpromptscript.dev',
        'access-control-request-method': 'GET',
      },
    });
    expect(res.headers['access-control-allow-origin']).toBe('https://getpromptscript.dev');
  });

  it('rejects CORS for disallowed origin', async () => {
    server = await createServer({
      port: 0,
      host: '127.0.0.1',
      workspace,
      readOnly: false,
      corsOrigin: 'https://getpromptscript.dev',
    });
    await server.ready();

    const res = await server.inject({
      method: 'OPTIONS',
      url: '/api/health',
      headers: {
        origin: 'https://evil.example.com',
        'access-control-request-method': 'GET',
      },
    });
    expect(res.headers['access-control-allow-origin']).not.toBe('https://evil.example.com');
  });

  it('startServer listens and can be stopped', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    // Start server on random port
    const serverPromise = startServer({
      port: 0,
      host: '127.0.0.1',
      workspace,
      readOnly: false,
      corsOrigin: 'https://getpromptscript.dev',
    });

    // Give it time to start
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Verify it logged startup messages
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('PromptScript server running'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Open playground:'));

    consoleSpy.mockRestore();

    // Trigger shutdown via SIGINT handler
    process.emit('SIGINT');
    await serverPromise.catch(() => {});
    await new Promise((resolve) => setTimeout(resolve, 500));
  });

  it('startServer uses localhost display for 0.0.0.0 host', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const serverPromise = startServer({
      port: 0,
      host: '0.0.0.0',
      workspace,
      readOnly: false,
      corsOrigin: 'https://getpromptscript.dev',
    });

    await new Promise((resolve) => setTimeout(resolve, 500));

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('http://localhost:'));

    consoleSpy.mockRestore();
    process.emit('SIGINT');
    await serverPromise.catch(() => {});
    await new Promise((resolve) => setTimeout(resolve, 500));
  });

  it('startServer handles EADDRINUSE error', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

    // Occupy a port with a raw TCP server
    const net = await import('net');
    const blocker = net.createServer();
    const usedPort = await new Promise<number>((resolve) => {
      blocker.listen(0, '127.0.0.1', () => {
        const addr = blocker.address();
        resolve(typeof addr === 'object' && addr ? addr.port : 0);
      });
    });

    try {
      // startServer will hit EADDRINUSE and call process.exit(1)
      await startServer({
        port: usedPort,
        host: '127.0.0.1',
        workspace,
        readOnly: false,
        corsOrigin: 'https://getpromptscript.dev',
      });
    } catch {
      // startServer may throw after mocked process.exit returns
    }

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('already in use'));
    expect(exitSpy).toHaveBeenCalledWith(1);

    consoleSpy.mockRestore();
    exitSpy.mockRestore();
    blocker.close();
  });

  it('onClose hook cleans up WebSocket clients', async () => {
    server = await createServer({
      port: 0,
      host: '127.0.0.1',
      workspace,
      readOnly: false,
      corsOrigin: '*',
    });
    await server.listen({ port: 0, host: '127.0.0.1' });
    const address = server.server.address();
    const port = typeof address === 'object' && address ? address.port : 0;

    // Connect a WebSocket client
    const { default: WebSocket } = await import('ws');
    const ws = new WebSocket(`ws://127.0.0.1:${port}/ws`);

    await new Promise<void>((resolve) => {
      ws.on('open', resolve);
    });

    // Close server should close ws clients too
    const closePromise = new Promise<void>((resolve) => {
      ws.on('close', resolve);
    });
    await server.close();
    await closePromise;

    expect(ws.readyState).toBe(WebSocket.CLOSED);
    // Prevent afterEach from double-closing
    server = undefined as unknown as FastifyInstance;
  });

  it('startServer re-throws non-EADDRINUSE listen errors', async () => {
    // Binding to an invalid host triggers EADDRNOTAVAIL, not EADDRINUSE
    await expect(
      startServer({
        port: 0,
        host: '192.0.2.1', // TEST-NET-1, not assignable locally
        workspace,
        readOnly: false,
        corsOrigin: 'https://getpromptscript.dev',
      })
    ).rejects.toThrow();
  });

  it('creates server in read-only mode', async () => {
    server = await createServer({
      port: 0,
      host: '127.0.0.1',
      workspace,
      readOnly: true,
      corsOrigin: 'https://getpromptscript.dev',
    });
    await server.ready();

    const config = await server.inject({ method: 'GET', url: '/api/config' });
    expect(config.json().mode).toBe('readonly');

    const put = await server.inject({
      method: 'PUT',
      url: '/api/files/src/test.prs',
      payload: { content: 'nope' },
    });
    expect(put.statusCode).toBe(403);
  });
});
