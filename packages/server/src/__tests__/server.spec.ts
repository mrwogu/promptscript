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
