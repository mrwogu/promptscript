import { mkdtemp, writeFile, mkdir, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import Fastify from 'fastify';
import type { FastifyInstance } from 'fastify';
import { registerRoutes } from '../routes/files.js';
import { registerHealthRoute } from '../routes/health.js';
import { registerConfigRoute } from '../routes/config.js';

describe('server routes', () => {
  let app: FastifyInstance;
  let workspace: string;

  beforeEach(async () => {
    workspace = await mkdtemp(join(tmpdir(), 'prs-test-'));
    await mkdir(join(workspace, 'src'), { recursive: true });
    await writeFile(join(workspace, 'src/team.prs'), '@identity Team Lead');
    await writeFile(join(workspace, 'promptscript.yaml'), 'targets: [claude]');

    app = Fastify();
    registerHealthRoute(app);
    registerConfigRoute(app, { mode: 'readwrite', workspace });
    registerRoutes(app, workspace, false);
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
    await rm(workspace, { recursive: true, force: true });
  });

  describe('GET /api/health', () => {
    it('returns 200', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/health' });
      expect(res.statusCode).toBe(200);
    });
  });

  describe('GET /api/config', () => {
    it('returns server config', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/config' });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.mode).toBe('readwrite');
      expect(body.workspace).toBe(workspace);
    });
  });

  describe('GET /api/files', () => {
    it('lists .prs and promptscript.yaml files', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/files' });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.files).toHaveLength(2);
      const paths = body.files.map((f: { path: string }) => f.path).sort();
      expect(paths).toEqual(['promptscript.yaml', 'src/team.prs']);
    });
  });

  describe('GET /api/files/*', () => {
    it('reads a file', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/files/src/team.prs' });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.content).toBe('@identity Team Lead');
    });

    it('returns 404 for nonexistent file', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/files/nope.prs' });
      expect(res.statusCode).toBe(404);
    });

    it('returns 403 for path traversal', async () => {
      // Use encoded slashes (%2F) so the '..' segments reach the handler
      // rather than being normalized away by Fastify's URL routing layer.
      // This mirrors the real-world encoded-slash traversal attack vector.
      const res = await app.inject({
        method: 'GET',
        url: '/api/files/..%2F..%2F..%2Fetc%2Fpasswd',
      });
      expect(res.statusCode).toBe(403);
    });
  });

  describe('PUT /api/files/*', () => {
    it('updates a file', async () => {
      const res = await app.inject({
        method: 'PUT',
        url: '/api/files/src/team.prs',
        payload: { content: '@identity Updated' },
      });
      expect(res.statusCode).toBe(200);

      const read = await app.inject({ method: 'GET', url: '/api/files/src/team.prs' });
      expect(read.json().content).toBe('@identity Updated');
    });
  });

  describe('POST /api/files/*', () => {
    it('creates a new file', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/files/src/new.prs',
        payload: { content: '@identity New' },
      });
      expect(res.statusCode).toBe(201);
    });

    it('returns 409 if file already exists', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/files/src/team.prs',
        payload: { content: 'conflict' },
      });
      expect(res.statusCode).toBe(409);
    });
  });

  describe('DELETE /api/files/*', () => {
    it('deletes a file', async () => {
      const res = await app.inject({ method: 'DELETE', url: '/api/files/src/team.prs' });
      expect(res.statusCode).toBe(200);

      const read = await app.inject({ method: 'GET', url: '/api/files/src/team.prs' });
      expect(read.statusCode).toBe(404);
    });
  });

  describe('PUT /api/files/* with traversal', () => {
    it('returns 403 for path traversal', async () => {
      const res = await app.inject({
        method: 'PUT',
        url: '/api/files/..%2F..%2Fetc%2Fpasswd',
        payload: { content: 'nope' },
      });
      expect(res.statusCode).toBe(403);
    });
  });

  describe('POST /api/files/* with traversal', () => {
    it('returns 403 for path traversal', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/files/..%2F..%2Fetc%2Fpasswd',
        payload: { content: 'nope' },
      });
      expect(res.statusCode).toBe(403);
    });
  });

  describe('DELETE /api/files/* with traversal', () => {
    it('returns 403 for path traversal', async () => {
      const res = await app.inject({
        method: 'DELETE',
        url: '/api/files/..%2F..%2Fetc%2Fpasswd',
      });
      expect(res.statusCode).toBe(403);
    });
  });

  describe('DELETE /api/files/* nonexistent', () => {
    it('returns 404 for nonexistent file', async () => {
      const res = await app.inject({ method: 'DELETE', url: '/api/files/nonexistent.prs' });
      expect(res.statusCode).toBe(404);
    });
  });

  describe('PUT /api/files/* write error', () => {
    it('returns 500 when write fails on valid path', async () => {
      // Try to write to a path that is a directory, causing EISDIR
      await mkdir(join(workspace, 'src/isdir'), { recursive: true });
      const res = await app.inject({
        method: 'PUT',
        url: '/api/files/src/isdir',
        payload: { content: 'content' },
      });
      expect(res.statusCode).toBe(500);
    });
  });

  describe('POST /api/files/* create error', () => {
    it('returns 500 when create fails on valid path', async () => {
      // Write to a path where the parent is a file, causing ENOTDIR
      const res = await app.inject({
        method: 'POST',
        url: '/api/files/src/team.prs/child.prs',
        payload: { content: 'content' },
      });
      expect(res.statusCode).toBe(500);
    });
  });

  describe('read-only mode', () => {
    let roApp: FastifyInstance;

    beforeEach(async () => {
      roApp = Fastify();
      registerRoutes(roApp, workspace, true);
      await roApp.ready();
    });

    afterEach(async () => {
      await roApp.close();
    });

    it('rejects PUT', async () => {
      const res = await roApp.inject({
        method: 'PUT',
        url: '/api/files/src/team.prs',
        payload: { content: 'nope' },
      });
      expect(res.statusCode).toBe(403);
    });

    it('rejects POST', async () => {
      const res = await roApp.inject({
        method: 'POST',
        url: '/api/files/src/new.prs',
        payload: { content: 'nope' },
      });
      expect(res.statusCode).toBe(403);
    });

    it('rejects DELETE', async () => {
      const res = await roApp.inject({ method: 'DELETE', url: '/api/files/src/team.prs' });
      expect(res.statusCode).toBe(403);
    });
  });
});
