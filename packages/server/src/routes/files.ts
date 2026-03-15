import type { FastifyInstance } from 'fastify';
import { readFile, writeFile, unlink, stat, mkdir } from 'fs/promises';
import { dirname } from 'path';
import fg from 'fast-glob';
import { resolveSafePath, PathTraversalError } from '../path-guard.js';
import { resolveFileGlobs } from '../source-dirs.js';

const MAX_BODY_SIZE = 1_048_576; // 1MB

export function registerRoutes(app: FastifyInstance, workspace: string, readOnly: boolean): void {
  // List files
  app.get('/api/files', async () => {
    const globs = await resolveFileGlobs(workspace);
    const entries = await fg(globs, {
      cwd: workspace,
      stats: true,
    });

    const files = entries.map((entry) => ({
      path: entry.path,
      size: entry.stats?.size ?? 0,
      modified: entry.stats?.mtime?.toISOString() ?? new Date().toISOString(),
    }));

    return { files };
  });

  // Read file
  app.get<{ Params: { '*': string } }>('/api/files/*', async (request, reply) => {
    const filePath = request.params['*'];
    try {
      const resolved = resolveSafePath(workspace, filePath);
      const content = await readFile(resolved, 'utf-8');
      return { path: filePath, content };
    } catch (err) {
      if (err instanceof PathTraversalError) {
        return reply.status(403).send({ error: 'Forbidden' });
      }
      return reply.status(404).send({ error: 'File not found' });
    }
  });

  // Write file
  app.put<{ Params: { '*': string }; Body: { content: string } }>(
    '/api/files/*',
    { bodyLimit: MAX_BODY_SIZE },
    async (request, reply) => {
      if (readOnly) return reply.status(403).send({ error: 'Read-only mode' });
      const filePath = request.params['*'];
      try {
        const resolved = resolveSafePath(workspace, filePath);
        await writeFile(resolved, request.body.content, 'utf-8');
        return { path: filePath, status: 'updated' };
      } catch (err) {
        if (err instanceof PathTraversalError) {
          return reply.status(403).send({ error: 'Forbidden' });
        }
        return reply.status(500).send({ error: 'Write failed' });
      }
    }
  );

  // Create file
  app.post<{ Params: { '*': string }; Body: { content: string } }>(
    '/api/files/*',
    { bodyLimit: MAX_BODY_SIZE },
    async (request, reply) => {
      if (readOnly) return reply.status(403).send({ error: 'Read-only mode' });
      const filePath = request.params['*'];
      try {
        const resolved = resolveSafePath(workspace, filePath);
        try {
          await stat(resolved);
          return reply.status(409).send({ error: 'File already exists' });
        } catch {
          // File doesn't exist — good
        }
        await mkdir(dirname(resolved), { recursive: true });
        await writeFile(resolved, request.body.content, 'utf-8');
        return reply.status(201).send({ path: filePath, status: 'created' });
      } catch (err) {
        if (err instanceof PathTraversalError) {
          return reply.status(403).send({ error: 'Forbidden' });
        }
        return reply.status(500).send({ error: 'Create failed' });
      }
    }
  );

  // Delete file
  app.delete<{ Params: { '*': string } }>('/api/files/*', async (request, reply) => {
    if (readOnly) return reply.status(403).send({ error: 'Read-only mode' });
    const filePath = request.params['*'];
    try {
      const resolved = resolveSafePath(workspace, filePath);
      await unlink(resolved);
      return { path: filePath, status: 'deleted' };
    } catch (err) {
      if (err instanceof PathTraversalError) {
        return reply.status(403).send({ error: 'Forbidden' });
      }
      return reply.status(404).send({ error: 'File not found' });
    }
  });
}
