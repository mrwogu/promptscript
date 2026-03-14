# Self-Hosted Playground Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `prs serve` command that starts a local file API server, allowing the online playground at getpromptscript.dev to connect to real files on disk.

**Architecture:** New `packages/server` package contains a Fastify server with REST file CRUD and WebSocket file-watch endpoints. The CLI gets a `prs serve` subcommand that imports and starts this server. The playground SPA gains a `FileProvider` abstraction with `MemoryFileProvider` (existing) and `LocalFileProvider` (new, talks to server API). Docker runs `prs serve --host 0.0.0.0`.

**Tech Stack:** Fastify, chokidar, WebSocket (@fastify/websocket), @fastify/cors, fast-glob, Vitest

**Spec:** `docs/superpowers/specs/2026-03-14-self-hosted-playground-design.md`

---

## File Structure

### New Files

```
packages/server/
├── package.json
├── project.json
├── tsconfig.json
├── tsconfig.lib.json
├── tsconfig.spec.json
├── vite.config.ts
├── src/
│   ├── index.ts                    # Public API: createServer, startServer
│   ├── server.ts                   # Fastify server setup, CORS, routes
│   ├── routes/
│   │   ├── health.ts               # GET /api/health
│   │   ├── config.ts               # GET /api/config
│   │   └── files.ts                # GET/PUT/POST/DELETE /api/files
│   ├── watcher.ts                  # Chokidar file watcher + WebSocket push
│   ├── path-guard.ts               # Path traversal validation
│   ├── types.ts                    # ServerOptions, ServerConfig interfaces
│   └── __tests__/
│       ├── path-guard.spec.ts
│       ├── routes.spec.ts          # Integration tests with real Fastify
│       ├── watcher.spec.ts
│       └── server.spec.ts          # CORS, WebSocket, shutdown tests

packages/cli/src/commands/
├── serve.ts                        # prs serve command handler
└── __tests__/serve.spec.ts

packages/playground/src/
├── providers/
│   ├── file-provider.ts            # FileProvider interface
│   ├── memory-file-provider.ts     # Wraps existing Zustand store ops
│   ├── local-file-provider.ts      # REST API client
│   └── __tests__/
│       ├── memory-file-provider.spec.ts
│       └── local-file-provider.spec.ts
├── hooks/
│   ├── types.ts                    # FileWatchEvent type
│   ├── useServerConnection.ts      # Server detection, WebSocket, reconnection
│   ├── useLocalFiles.ts            # Orchestrates LocalFileProvider + store sync
│   └── __tests__/
│       ├── useServerConnection.spec.ts
│       └── useLocalFiles.spec.ts
└── components/
    ├── ConnectionBar.tsx            # Connection status UI bar
    └── __tests__/
        └── ConnectionBar.spec.tsx
```

### Modified Files

```
tsconfig.base.json                  # Add @promptscript/server path alias
packages/cli/src/cli.ts             # Register serve command (before line 129)
packages/cli/src/commands/index.ts   # Export serveCommand
packages/cli/package.json           # Add @promptscript/server dependency
packages/playground/src/App.tsx      # Integrate ConnectionBar, useServerConnection
packages/playground/src/hooks/useUrlState.ts  # Handle ?server= parameter, disable sync in local mode
packages/playground/src/components/Header.tsx  # Hide Share/Examples in local mode
packages/playground/src/components/FileTabs.tsx # YAML file rename handling
Dockerfile                          # Add packages/server COPY lines (builder + runtime)
docker-compose.yaml                 # Add playground service
```

---

## Chunk 1: Server Package — Foundation

### Task 1: Scaffold `packages/server`

**Files:**
- Create: `packages/server/package.json`
- Create: `packages/server/project.json`
- Create: `packages/server/tsconfig.json`
- Create: `packages/server/tsconfig.lib.json`
- Create: `packages/server/tsconfig.spec.json`
- Create: `packages/server/vite.config.ts`
- Create: `packages/server/src/index.ts`
- Create: `packages/server/src/types.ts`
- Modify: `tsconfig.base.json:24-26`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "@promptscript/server",
  "version": "0.0.1",
  "description": "Local development server for PromptScript playground",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.d.ts",
  "dependencies": {
    "@swc/helpers": "~0.5.19",
    "fastify": "^5.0.0",
    "@fastify/cors": "^11.0.0",
    "@fastify/websocket": "^11.0.0",
    "chokidar": "^4.0.0",
    "fast-glob": "^3.3.0"
  }
}
```

- [ ] **Step 2: Create project.json**

```json
{
  "name": "server",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "sourceRoot": "packages/server/src",
  "projectType": "library",
  "tags": ["scope:server", "type:lib"],
  "targets": {
    "build": {
      "executor": "@nx/js:swc",
      "outputs": ["{options.outputPath}"],
      "options": {
        "outputPath": "dist/packages/server",
        "main": "packages/server/src/index.ts",
        "tsConfig": "packages/server/tsconfig.lib.json",
        "assets": ["packages/server/*.md"]
      }
    }
  }
}
```

- [ ] **Step 3: Create tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "importHelpers": true,
    "noImplicitOverride": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noPropertyAccessFromIndexSignature": true
  },
  "files": [],
  "include": [],
  "references": [
    { "path": "./tsconfig.lib.json" },
    { "path": "./tsconfig.spec.json" }
  ]
}
```

- [ ] **Step 4: Create tsconfig.lib.json**

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "../../dist/out-tsc",
    "declaration": true,
    "types": ["node"]
  },
  "include": ["src/**/*.ts"],
  "exclude": [
    "vite.config.ts",
    "vite.config.mts",
    "vitest.config.ts",
    "vitest.config.mts",
    "src/**/*.test.ts",
    "src/**/*.spec.ts",
    "src/**/*.test.tsx",
    "src/**/*.spec.tsx",
    "src/**/*.test.js",
    "src/**/*.spec.js",
    "src/**/*.test.jsx",
    "src/**/*.spec.jsx"
  ]
}
```

- [ ] **Step 5: Create tsconfig.spec.json**

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "../../dist/out-tsc",
    "module": "NodeNext",
    "types": ["vitest/globals", "vitest/importMeta", "vite/client", "node", "vitest"]
  },
  "include": [
    "vite.config.ts",
    "vite.config.mts",
    "vitest.config.ts",
    "vitest.config.mts",
    "src/**/*.test.ts",
    "src/**/*.spec.ts",
    "src/**/*.test.tsx",
    "src/**/*.spec.tsx",
    "src/**/*.test.js",
    "src/**/*.spec.js",
    "src/**/*.test.jsx",
    "src/**/*.spec.jsx",
    "src/**/*.d.ts"
  ]
}
```

- [ ] **Step 6: Create vite.config.ts**

```typescript
/// <reference types='vitest' />
import { defineConfig } from 'vite';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { nxCopyAssetsPlugin } from '@nx/vite/plugins/nx-copy-assets.plugin';

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/packages/server',
  plugins: [nxViteTsPaths(), nxCopyAssetsPlugin(['*.md'])],
  test: {
    name: 'server',
    watch: false,
    globals: true,
    environment: 'node',
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../../coverage/packages/server',
      provider: 'v8' as const,
    },
  },
}));
```

- [ ] **Step 7: Create src/types.ts**

```typescript
export interface ServerOptions {
  /** Port to listen on */
  port: number;
  /** Host to bind to */
  host: string;
  /** Workspace root directory */
  workspace: string;
  /** Read-only mode */
  readOnly: boolean;
  /** Allowed CORS origin */
  corsOrigin: string;
}

export interface ServerConfig {
  mode: 'readwrite' | 'readonly';
  workspace: string;
}

export interface FileEntry {
  path: string;
  size: number;
  modified: string;
}

export interface FileContent {
  path: string;
  content: string;
}
```

- [ ] **Step 8: Create src/index.ts (stub)**

```typescript
export type { ServerOptions, ServerConfig, FileEntry, FileContent } from './types.js';
```

- [ ] **Step 9: Add path alias to tsconfig.base.json**

Add to the `paths` object in `tsconfig.base.json`:

```json
"@promptscript/server": ["packages/server/src/index.ts"]
```

- [ ] **Step 10: Run pnpm install and verify build**

Run: `pnpm install && pnpm nx build server`
Expected: Build succeeds with no errors.

- [ ] **Step 11: Commit**

```bash
git add packages/server/ tsconfig.base.json
git commit -m "feat(server): scaffold server package with types"
```

---

### Task 2: Path Guard — Traversal Prevention

**Files:**
- Create: `packages/server/src/path-guard.ts`
- Create: `packages/server/src/__tests__/path-guard.spec.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// packages/server/src/__tests__/path-guard.spec.ts
import { resolveSafePath } from '../path-guard.js';

describe('resolveSafePath', () => {
  const workspace = '/workspace';

  it('resolves a valid relative path', () => {
    expect(resolveSafePath(workspace, 'src/team.prs')).toBe('/workspace/src/team.prs');
  });

  it('resolves a nested path', () => {
    expect(resolveSafePath(workspace, 'deep/nested/file.prs')).toBe(
      '/workspace/deep/nested/file.prs'
    );
  });

  it('rejects path traversal with ../', () => {
    expect(() => resolveSafePath(workspace, '../etc/passwd')).toThrow();
  });

  it('rejects encoded path traversal', () => {
    expect(() => resolveSafePath(workspace, '..%2F..%2Fetc/passwd')).toThrow();
  });

  it('rejects absolute paths', () => {
    expect(() => resolveSafePath(workspace, '/etc/passwd')).toThrow();
  });

  it('rejects paths that resolve outside workspace', () => {
    expect(() => resolveSafePath(workspace, 'src/../../outside')).toThrow();
  });

  it('allows paths with .. in filenames', () => {
    expect(resolveSafePath(workspace, 'src/my..file.prs')).toBe('/workspace/src/my..file.prs');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm nx test server -- --testPathPattern=path-guard`
Expected: FAIL — `resolveSafePath` not found.

- [ ] **Step 3: Implement path-guard.ts**

```typescript
// packages/server/src/path-guard.ts
import { resolve, relative, isAbsolute } from 'path';

export class PathTraversalError extends Error {
  constructor(requestedPath: string) {
    super(`Path traversal rejected: ${requestedPath}`);
    this.name = 'PathTraversalError';
  }
}

export function resolveSafePath(workspace: string, requestedPath: string): string {
  const decoded = decodeURIComponent(requestedPath);

  if (isAbsolute(decoded)) {
    throw new PathTraversalError(requestedPath);
  }

  const resolved = resolve(workspace, decoded);
  const rel = relative(workspace, resolved);

  if (rel.startsWith('..') || isAbsolute(rel)) {
    throw new PathTraversalError(requestedPath);
  }

  return resolved;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm nx test server -- --testPathPattern=path-guard`
Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/server/src/path-guard.ts packages/server/src/__tests__/path-guard.spec.ts
git commit -m "feat(server): add path traversal guard with tests"
```

---

### Task 3: File Routes

**Files:**
- Create: `packages/server/src/routes/health.ts`
- Create: `packages/server/src/routes/config.ts`
- Create: `packages/server/src/routes/files.ts`
- Create: `packages/server/src/__tests__/routes.spec.ts`

- [ ] **Step 1: Write failing integration tests**

```typescript
// packages/server/src/__tests__/routes.spec.ts
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
      const res = await app.inject({ method: 'GET', url: '/api/files/../../../etc/passwd' });
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm nx test server -- --testPathPattern=routes`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement health.ts**

```typescript
// packages/server/src/routes/health.ts
import type { FastifyInstance } from 'fastify';

export function registerHealthRoute(app: FastifyInstance): void {
  app.get('/api/health', async () => {
    return { status: 'ok' };
  });
}
```

- [ ] **Step 4: Implement config.ts**

```typescript
// packages/server/src/routes/config.ts
import type { FastifyInstance } from 'fastify';
import type { ServerConfig } from '../types.js';

export function registerConfigRoute(app: FastifyInstance, config: ServerConfig): void {
  app.get('/api/config', async () => {
    return config;
  });
}
```

- [ ] **Step 5: Implement files.ts**

```typescript
// packages/server/src/routes/files.ts
import type { FastifyInstance } from 'fastify';
import { readFile, writeFile, unlink, stat, mkdir } from 'fs/promises';
import { dirname, relative } from 'path';
import fg from 'fast-glob';
import { resolveSafePath, PathTraversalError } from '../path-guard.js';

const MAX_BODY_SIZE = 1_048_576; // 1MB

export function registerRoutes(
  app: FastifyInstance,
  workspace: string,
  readOnly: boolean
): void {
  // List files
  app.get('/api/files', async () => {
    const entries = await fg(['**/*.prs', '**/promptscript.yaml'], {
      cwd: workspace,
      ignore: ['**/node_modules/**', '**/.git/**'],
      stats: true,
    });

    const files = entries.map((entry) => ({
      path: typeof entry === 'string' ? entry : entry.path,
      size: typeof entry === 'string' ? 0 : (entry.stats?.size ?? 0),
      modified: typeof entry === 'string' ? new Date().toISOString() : (entry.stats?.mtime?.toISOString() ?? new Date().toISOString()),
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
```

Note: `fast-glob` with `stats: true` returns `Entry` objects. The implementing agent should verify the return type and adjust the mapping if the API differs.

- [ ] **Step 6: Run tests to verify they pass**

Run: `pnpm nx test server -- --testPathPattern=routes`
Expected: All tests PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/server/src/routes/ packages/server/src/__tests__/routes.spec.ts
git commit -m "feat(server): add REST file routes with integration tests"
```

---

### Task 4: File Watcher with WebSocket

**Files:**
- Create: `packages/server/src/watcher.ts`
- Create: `packages/server/src/__tests__/watcher.spec.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// packages/server/src/__tests__/watcher.spec.ts
import { mkdtemp, writeFile, unlink, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { createFileWatcher, type FileWatchEvent } from '../watcher.js';

describe('createFileWatcher', () => {
  let workspace: string;

  beforeEach(async () => {
    workspace = await mkdtemp(join(tmpdir(), 'prs-watch-'));
    await writeFile(join(workspace, 'test.prs'), 'initial');
  });

  afterEach(async () => {
    await rm(workspace, { recursive: true, force: true });
  });

  it('emits file:changed when a .prs file is modified', async () => {
    const events: FileWatchEvent[] = [];
    const watcher = createFileWatcher(workspace, (event) => events.push(event));

    await new Promise((resolve) => setTimeout(resolve, 500));

    await writeFile(join(workspace, 'test.prs'), 'updated');

    await new Promise((resolve) => setTimeout(resolve, 1000));

    await watcher.close();

    expect(events.some((e) => e.type === 'file:changed' && e.path === 'test.prs')).toBe(true);
  });

  it('emits file:created when a new .prs file is added', async () => {
    const events: FileWatchEvent[] = [];
    const watcher = createFileWatcher(workspace, (event) => events.push(event));

    await new Promise((resolve) => setTimeout(resolve, 500));

    await writeFile(join(workspace, 'new.prs'), 'new file');

    await new Promise((resolve) => setTimeout(resolve, 1000));

    await watcher.close();

    expect(events.some((e) => e.type === 'file:created' && e.path === 'new.prs')).toBe(true);
  });

  it('emits file:deleted when a .prs file is removed', async () => {
    const events: FileWatchEvent[] = [];
    const watcher = createFileWatcher(workspace, (event) => events.push(event));

    await new Promise((resolve) => setTimeout(resolve, 500));

    await unlink(join(workspace, 'test.prs'));

    await new Promise((resolve) => setTimeout(resolve, 1000));

    await watcher.close();

    expect(events.some((e) => e.type === 'file:deleted' && e.path === 'test.prs')).toBe(true);
  });

  it('ignores non-.prs files', async () => {
    const events: FileWatchEvent[] = [];
    const watcher = createFileWatcher(workspace, (event) => events.push(event));

    await new Promise((resolve) => setTimeout(resolve, 500));

    await writeFile(join(workspace, 'readme.md'), 'ignored');

    await new Promise((resolve) => setTimeout(resolve, 1000));

    await watcher.close();

    expect(events).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm nx test server -- --testPathPattern=watcher`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement watcher.ts**

```typescript
// packages/server/src/watcher.ts
import { watch, type FSWatcher } from 'chokidar';

export interface FileWatchEvent {
  type: 'file:changed' | 'file:created' | 'file:deleted';
  path: string;
}

export function createFileWatcher(
  workspace: string,
  onEvent: (event: FileWatchEvent) => void
): FSWatcher {
  const watcher = watch(['**/*.prs', '**/promptscript.yaml'], {
    cwd: workspace,
    ignoreInitial: true,
    ignored: ['**/node_modules/**', '**/.git/**'],
  });

  watcher.on('add', (filePath) => {
    onEvent({ type: 'file:created', path: filePath });
  });

  watcher.on('change', (filePath) => {
    onEvent({ type: 'file:changed', path: filePath });
  });

  watcher.on('unlink', (filePath) => {
    onEvent({ type: 'file:deleted', path: filePath });
  });

  return watcher;
}
```

Note: With `cwd` set, chokidar emits relative paths. The implementing agent should verify this on their platform.

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm nx test server -- --testPathPattern=watcher`
Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/server/src/watcher.ts packages/server/src/__tests__/watcher.spec.ts
git commit -m "feat(server): add file watcher with chokidar"
```

---

### Task 5: Server Assembly — Fastify + CORS + WebSocket + Graceful Shutdown

**Files:**
- Create: `packages/server/src/server.ts`
- Create: `packages/server/src/__tests__/server.spec.ts`
- Modify: `packages/server/src/index.ts`

- [ ] **Step 1: Write failing integration tests**

```typescript
// packages/server/src/__tests__/server.spec.ts
import { mkdtemp, writeFile, mkdir, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { createServer } from '../server.js';
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

    // Health endpoint
    const health = await server.inject({ method: 'GET', url: '/api/health' });
    expect(health.statusCode).toBe(200);

    // Config endpoint
    const config = await server.inject({ method: 'GET', url: '/api/config' });
    expect(config.statusCode).toBe(200);
    expect(config.json().mode).toBe('readwrite');

    // Files endpoint
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm nx test server -- --testPathPattern=server.spec`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement server.ts**

```typescript
// packages/server/src/server.ts
import Fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyWebsocket from '@fastify/websocket';
import type { FastifyInstance } from 'fastify';
import { registerHealthRoute } from './routes/health.js';
import { registerConfigRoute } from './routes/config.js';
import { registerRoutes } from './routes/files.js';
import { createFileWatcher, type FileWatchEvent } from './watcher.js';
import type { ServerOptions } from './types.js';

export async function createServer(options: ServerOptions): Promise<FastifyInstance> {
  const app = Fastify({ bodyLimit: 1_048_576 });

  // CORS
  await app.register(fastifyCors, {
    origin: options.corsOrigin,
  });

  // WebSocket
  await app.register(fastifyWebsocket);

  // Routes
  registerHealthRoute(app);
  registerConfigRoute(app, {
    mode: options.readOnly ? 'readonly' : 'readwrite',
    workspace: options.workspace,
  });
  registerRoutes(app, options.workspace, options.readOnly);

  // WebSocket endpoint for file watch events
  const clients = new Set<import('ws').WebSocket>();

  app.get('/ws', { websocket: true }, (socket) => {
    clients.add(socket);
    socket.on('close', () => clients.delete(socket));
  });

  // File watcher
  const watcher = createFileWatcher(options.workspace, (event: FileWatchEvent) => {
    const message = JSON.stringify(event);
    for (const client of clients) {
      if (client.readyState === 1) {
        client.send(message);
      }
    }
  });

  // Clean up watcher and clients on server close
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

  // Graceful shutdown
  const shutdown = async (): Promise<void> => {
    await app.close();
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

  console.log(`PromptScript server running at http://${displayHost}:${options.port}`);
  console.log(`Open playground: ${playgroundUrl}`);
}
```

Note: The `onClose` hook ensures the watcher and clients are cleaned up when the Fastify instance is closed, making `createServer` testable without side-effecting signal handlers.

- [ ] **Step 4: Update index.ts with exports**

```typescript
// packages/server/src/index.ts
export type { ServerOptions, ServerConfig, FileEntry, FileContent } from './types.js';
export { createServer, startServer } from './server.js';
export { createFileWatcher, type FileWatchEvent } from './watcher.js';
```

- [ ] **Step 5: Run all server tests**

Run: `pnpm nx test server`
Expected: All tests PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/server/src/server.ts packages/server/src/index.ts \
  packages/server/src/__tests__/server.spec.ts
git commit -m "feat(server): assemble Fastify server with CORS, WebSocket, and graceful shutdown"
```

---

## Chunk 2: CLI Integration + Docker

### Task 6: `prs serve` CLI Command

**Files:**
- Create: `packages/cli/src/commands/serve.ts`
- Create: `packages/cli/src/commands/__tests__/serve.spec.ts`
- Modify: `packages/cli/src/cli.ts` (insert before line 129, the `registry` command)
- Modify: `packages/cli/src/commands/index.ts`
- Modify: `packages/cli/package.json` (add to `dependencies` block)

- [ ] **Step 1: Write failing test**

```typescript
// packages/cli/src/commands/__tests__/serve.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@promptscript/server', () => ({
  startServer: vi.fn().mockResolvedValue(undefined),
}));

import { serveCommand } from '../serve.js';
import { startServer } from '@promptscript/server';

describe('serveCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls startServer with default options', async () => {
    await serveCommand({});
    expect(startServer).toHaveBeenCalledWith(
      expect.objectContaining({
        port: 3000,
        host: '127.0.0.1',
        readOnly: false,
        corsOrigin: 'https://getpromptscript.dev',
      })
    );
  });

  it('passes custom port', async () => {
    await serveCommand({ port: '8080' });
    expect(startServer).toHaveBeenCalledWith(
      expect.objectContaining({ port: 8080 })
    );
  });

  it('passes host option', async () => {
    await serveCommand({ host: '0.0.0.0' });
    expect(startServer).toHaveBeenCalledWith(
      expect.objectContaining({ host: '0.0.0.0' })
    );
  });

  it('passes read-only flag', async () => {
    await serveCommand({ readOnly: true });
    expect(startServer).toHaveBeenCalledWith(
      expect.objectContaining({ readOnly: true })
    );
  });

  it('passes custom CORS origin', async () => {
    await serveCommand({ corsOrigin: 'https://custom.example.com' });
    expect(startServer).toHaveBeenCalledWith(
      expect.objectContaining({ corsOrigin: 'https://custom.example.com' })
    );
  });

  it('uses process.cwd() as workspace', async () => {
    await serveCommand({});
    expect(startServer).toHaveBeenCalledWith(
      expect.objectContaining({ workspace: process.cwd() })
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm nx test cli -- --testPathPattern=serve`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement serve.ts**

```typescript
// packages/cli/src/commands/serve.ts
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
```

- [ ] **Step 4: Add export to commands/index.ts**

Add to `packages/cli/src/commands/index.ts`:

```typescript
export { serveCommand } from './serve.js';
```

- [ ] **Step 5: Register command in cli.ts**

Add import at top of `packages/cli/src/cli.ts`:

```typescript
import { serveCommand } from './commands/serve.js';
```

Add command registration before the `registry` command (before `const registry = program.command('registry')`):

```typescript
program
  .command('serve')
  .description('Start local development server for playground')
  .option('-p, --port <port>', 'Port to listen on', '3000')
  .option('--host <host>', 'Host to bind to', '127.0.0.1')
  .option('--read-only', 'Disable file modifications')
  .option('--cors-origin <origin>', 'Allowed CORS origin', 'https://getpromptscript.dev')
  .action((opts) => serveCommand(opts));
```

- [ ] **Step 6: Add dependency to CLI package.json**

Add to `packages/cli/package.json` dependencies:

```json
"@promptscript/server": "workspace:^"
```

- [ ] **Step 7: Run pnpm install and tests**

Run: `pnpm install && pnpm nx test cli -- --testPathPattern=serve`
Expected: All tests PASS.

- [ ] **Step 8: Commit**

```bash
git add packages/cli/src/commands/serve.ts packages/cli/src/commands/__tests__/serve.spec.ts \
  packages/cli/src/commands/index.ts packages/cli/src/cli.ts packages/cli/package.json
git commit -m "feat(cli): add prs serve command"
```

---

### Task 7: Docker Configuration

**Files:**
- Modify: `Dockerfile` (add COPY lines for server package)
- Modify: `docker-compose.yaml`

- [ ] **Step 1: Add server package to Dockerfile builder stage**

After line 41 (`COPY packages/cli/package.json packages/cli/`), add:

```dockerfile
COPY packages/server/package.json packages/server/
```

- [ ] **Step 2: Add server dist to Dockerfile runtime stage**

After line 75 (`COPY --from=builder /build/dist/packages/cli/ ./`), add:

```dockerfile
COPY --from=builder /build/dist/packages/server/ ./node_modules/@promptscript/server/
```

Note: The implementing agent should verify the correct path for the server dist based on how `@nx/js:swc` outputs the build. If the CLI bundles its dependencies (via esbuild), the server may already be included in the CLI dist — check and adjust accordingly.

- [ ] **Step 3: Add playground service to docker-compose.yaml**

Append after the `dev` service:

```yaml

  # ---------------------------------------------------------------------------
  # Playground server - connect online playground to local files
  # ---------------------------------------------------------------------------
  # Usage: docker compose up playground
  # Then open: https://getpromptscript.dev/playground/?server=localhost:3000
  playground:
    image: ghcr.io/mrwogu/promptscript:latest
    command: ['serve', '--host', '0.0.0.0']
    ports:
      - '3000:3000'
    volumes:
      - .:/workspace:rw
    working_dir: /workspace
    environment:
      - PROMPTSCRIPT_VERBOSE=${PROMPTSCRIPT_VERBOSE:-}
    healthcheck:
      test: ['CMD', 'wget', '--spider', '-q', 'http://localhost:3000/api/health']
      interval: 10s
      timeout: 3s
      retries: 3
```

- [ ] **Step 4: Commit**

```bash
git add Dockerfile docker-compose.yaml
git commit -m "feat(docker): add playground service and server package to build"
```

---

## Chunk 3: Playground SPA — Local Mode

### Task 8: FileProvider Interface and Implementations

**Files:**
- Create: `packages/playground/src/providers/file-provider.ts`
- Create: `packages/playground/src/providers/memory-file-provider.ts`
- Create: `packages/playground/src/providers/local-file-provider.ts`
- Create: `packages/playground/src/providers/__tests__/local-file-provider.spec.ts`
- Create: `packages/playground/src/providers/__tests__/memory-file-provider.spec.ts`

- [ ] **Step 1: Write failing test for LocalFileProvider**

```typescript
// packages/playground/src/providers/__tests__/local-file-provider.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LocalFileProvider } from '../local-file-provider';

describe('LocalFileProvider', () => {
  let provider: LocalFileProvider;

  beforeEach(() => {
    provider = new LocalFileProvider('localhost:3000');
    vi.restoreAllMocks();
  });

  it('constructs with http:// for non-443 ports', () => {
    expect(provider.serverUrl).toBe('http://localhost:3000');
  });

  it('constructs with https:// for port 443', () => {
    const p = new LocalFileProvider('example.com:443');
    expect(p.serverUrl).toBe('https://example.com:443');
  });

  it('isReadOnly defaults to false', () => {
    expect(provider.isReadOnly).toBe(false);
  });

  it('isReadOnly can be set to true', () => {
    const p = new LocalFileProvider('localhost:3000', true);
    expect(p.isReadOnly).toBe(true);
  });

  it('listFiles fetches from /api/files', async () => {
    const mockFiles = { files: [{ path: 'test.prs', size: 10, modified: '2026-01-01' }] };
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockFiles),
    } as Response);

    const result = await provider.listFiles();
    expect(fetch).toHaveBeenCalledWith('http://localhost:3000/api/files');
    expect(result).toEqual(mockFiles.files);
  });

  it('readFile fetches from /api/files/*', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ path: 'test.prs', content: 'hello' }),
    } as Response);

    const content = await provider.readFile('test.prs');
    expect(fetch).toHaveBeenCalledWith('http://localhost:3000/api/files/test.prs');
    expect(content).toBe('hello');
  });

  it('readFile preserves path slashes (no encodeURIComponent)', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ path: 'src/team.prs', content: 'hello' }),
    } as Response);

    await provider.readFile('src/team.prs');
    expect(fetch).toHaveBeenCalledWith('http://localhost:3000/api/files/src/team.prs');
  });

  it('writeFile sends PUT to /api/files/*', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true } as Response);

    await provider.writeFile('test.prs', 'updated');
    expect(fetch).toHaveBeenCalledWith('http://localhost:3000/api/files/test.prs', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'updated' }),
    });
  });

  it('createFile sends POST to /api/files/*', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true } as Response);

    await provider.createFile('new.prs', 'content');
    expect(fetch).toHaveBeenCalledWith('http://localhost:3000/api/files/new.prs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'content' }),
    });
  });

  it('deleteFile sends DELETE to /api/files/*', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true } as Response);

    await provider.deleteFile('test.prs');
    expect(fetch).toHaveBeenCalledWith('http://localhost:3000/api/files/test.prs', {
      method: 'DELETE',
    });
  });

  it('throws on failed fetch', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      statusText: 'Not Found',
    } as Response);

    await expect(provider.readFile('nope.prs')).rejects.toThrow('Not Found');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm nx test playground -- --testPathPattern=local-file-provider`
Expected: FAIL — module not found.

- [ ] **Step 3: Create FileProvider interface**

```typescript
// packages/playground/src/providers/file-provider.ts
export interface FileListEntry {
  path: string;
  size: number;
  modified: string;
}

export interface FileProvider {
  listFiles(): Promise<FileListEntry[]>;
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  createFile(path: string, content: string): Promise<void>;
  deleteFile(path: string): Promise<void>;
  readonly isReadOnly: boolean;
}
```

- [ ] **Step 4: Create LocalFileProvider**

```typescript
// packages/playground/src/providers/local-file-provider.ts
import type { FileProvider, FileListEntry } from './file-provider';

export class LocalFileProvider implements FileProvider {
  private baseUrl: string;
  readonly isReadOnly: boolean;

  constructor(serverHost: string, readOnly: boolean = false) {
    const protocol = serverHost.endsWith(':443') ? 'https' : 'http';
    this.baseUrl = `${protocol}://${serverHost}`;
    this.isReadOnly = readOnly;
  }

  async listFiles(): Promise<FileListEntry[]> {
    const res = await fetch(`${this.baseUrl}/api/files`);
    if (!res.ok) throw new Error(`Failed to list files: ${res.statusText}`);
    const data = (await res.json()) as { files: FileListEntry[] };
    return data.files;
  }

  async readFile(path: string): Promise<string> {
    const res = await fetch(`${this.baseUrl}/api/files/${path}`);
    if (!res.ok) throw new Error(`Failed to read file: ${res.statusText}`);
    const data = (await res.json()) as { content: string };
    return data.content;
  }

  async writeFile(path: string, content: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/api/files/${path}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    if (!res.ok) throw new Error(`Failed to write file: ${res.statusText}`);
  }

  async createFile(path: string, content: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/api/files/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    if (!res.ok) throw new Error(`Failed to create file: ${res.statusText}`);
  }

  async deleteFile(path: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/api/files/${path}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error(`Failed to delete file: ${res.statusText}`);
  }

  get serverUrl(): string {
    return this.baseUrl;
  }
}
```

- [ ] **Step 5: Create MemoryFileProvider**

```typescript
// packages/playground/src/providers/memory-file-provider.ts
import type { FileProvider, FileListEntry } from './file-provider';
import { usePlaygroundStore } from '../store';

export class MemoryFileProvider implements FileProvider {
  readonly isReadOnly = false;

  async listFiles(): Promise<FileListEntry[]> {
    const files = usePlaygroundStore.getState().files;
    return files.map((f) => ({
      path: f.path,
      size: f.content.length,
      modified: new Date().toISOString(),
    }));
  }

  async readFile(path: string): Promise<string> {
    const file = usePlaygroundStore.getState().files.find((f) => f.path === path);
    if (!file) throw new Error(`File not found: ${path}`);
    return file.content;
  }

  async writeFile(path: string, content: string): Promise<void> {
    usePlaygroundStore.getState().updateFile(path, content);
  }

  async createFile(path: string, content: string): Promise<void> {
    usePlaygroundStore.getState().addFile(path, content);
  }

  async deleteFile(path: string): Promise<void> {
    usePlaygroundStore.getState().deleteFile(path);
  }
}
```

Note: `usePlaygroundStore.getState()` is called outside React components, which is a supported Zustand pattern for imperative access.

- [ ] **Step 6: Write MemoryFileProvider test**

```typescript
// packages/playground/src/providers/__tests__/memory-file-provider.spec.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { usePlaygroundStore } from '../../store';
import { MemoryFileProvider } from '../memory-file-provider';

describe('MemoryFileProvider', () => {
  let provider: MemoryFileProvider;

  beforeEach(() => {
    provider = new MemoryFileProvider();
    // Reset store to default state
    usePlaygroundStore.setState({
      files: [{ path: 'test.prs', content: 'hello' }],
      activeFile: 'test.prs',
    });
  });

  it('lists files from store', async () => {
    const files = await provider.listFiles();
    expect(files).toHaveLength(1);
    expect(files[0]?.path).toBe('test.prs');
  });

  it('reads a file from store', async () => {
    const content = await provider.readFile('test.prs');
    expect(content).toBe('hello');
  });

  it('throws when reading nonexistent file', async () => {
    await expect(provider.readFile('nope.prs')).rejects.toThrow('File not found');
  });

  it('writes to store', async () => {
    await provider.writeFile('test.prs', 'updated');
    expect(usePlaygroundStore.getState().files[0]?.content).toBe('updated');
  });

  it('creates a new file in store', async () => {
    await provider.createFile('new.prs', 'new content');
    expect(usePlaygroundStore.getState().files).toHaveLength(2);
  });

  it('deletes a file from store', async () => {
    await provider.deleteFile('test.prs');
    expect(usePlaygroundStore.getState().files).toHaveLength(0);
  });

  it('is not read-only', () => {
    expect(provider.isReadOnly).toBe(false);
  });
});
```

- [ ] **Step 7: Run tests**

Run: `pnpm nx test playground -- --testPathPattern=file-provider`
Expected: All tests PASS.

- [ ] **Step 8: Commit**

```bash
git add packages/playground/src/providers/
git commit -m "feat(playground): add FileProvider interface with memory and local implementations"
```

---

### Task 9: Server Connection Hook

**Files:**
- Create: `packages/playground/src/hooks/types.ts`
- Create: `packages/playground/src/hooks/useServerConnection.ts`
- Create: `packages/playground/src/hooks/__tests__/useServerConnection.spec.ts`

- [ ] **Step 1: Write failing test**

```typescript
// packages/playground/src/hooks/__tests__/useServerConnection.spec.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useServerConnection } from '../useServerConnection';

describe('useServerConnection', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('starts in disconnected state', () => {
    const { result } = renderHook(() => useServerConnection());
    expect(result.current.status).toBe('disconnected');
    expect(result.current.serverHost).toBeNull();
    expect(result.current.config).toBeNull();
  });

  it('connects to a server', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({ ok: true } as Response) // health
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ mode: 'readwrite', workspace: '/test' }),
      } as Response); // config

    // Mock WebSocket
    const mockWs = { onopen: null, onmessage: null, onclose: null, close: vi.fn() };
    vi.stubGlobal('WebSocket', vi.fn(() => mockWs));

    const { result } = renderHook(() => useServerConnection());

    await act(async () => {
      result.current.connect('localhost:3000');
    });

    // Simulate WebSocket open
    await act(async () => {
      (mockWs as unknown as { onopen: () => void }).onopen?.();
    });

    expect(result.current.status).toBe('connected');
    expect(result.current.serverHost).toBe('localhost:3000');
    expect(result.current.config?.mode).toBe('readwrite');
  });

  it('returns to disconnected on disconnect', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({ ok: true } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ mode: 'readwrite', workspace: '/test' }),
      } as Response);

    const mockWs = { onopen: null, onmessage: null, onclose: null, close: vi.fn() };
    vi.stubGlobal('WebSocket', vi.fn(() => mockWs));

    const { result } = renderHook(() => useServerConnection());

    await act(async () => {
      result.current.connect('localhost:3000');
    });
    await act(async () => {
      (mockWs as unknown as { onopen: () => void }).onopen?.();
    });

    act(() => {
      result.current.disconnect();
    });

    expect(result.current.status).toBe('disconnected');
    expect(result.current.serverHost).toBeNull();
  });

  it('stays disconnected when health check fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({ ok: false } as Response);

    const { result } = renderHook(() => useServerConnection());

    await act(async () => {
      result.current.connect('localhost:3000');
    });

    expect(result.current.status).toBe('disconnected');
  });
});
```

Note: `@testing-library/react` may need to be added as a devDependency of the playground package if not already present. Check and add if needed.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm nx test playground -- --testPathPattern=useServerConnection`
Expected: FAIL — module not found.

- [ ] **Step 3: Create hooks/types.ts**

```typescript
// packages/playground/src/hooks/types.ts
export interface FileWatchEvent {
  type: 'file:changed' | 'file:created' | 'file:deleted';
  path: string;
}
```

- [ ] **Step 4: Implement useServerConnection.ts**

```typescript
// packages/playground/src/hooks/useServerConnection.ts
import { useState, useEffect, useRef, useCallback } from 'react';
import type { FileWatchEvent } from './types';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

interface ServerConfig {
  mode: 'readwrite' | 'readonly';
  workspace: string;
}

interface UseServerConnectionResult {
  status: ConnectionStatus;
  serverHost: string | null;
  config: ServerConfig | null;
  connect: (host: string) => void;
  disconnect: () => void;
  onFileEvent: (handler: (event: FileWatchEvent) => void) => void;
}

export function useServerConnection(): UseServerConnectionResult {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [serverHost, setServerHost] = useState<string | null>(null);
  const [config, setConfig] = useState<ServerConfig | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const fileEventHandlerRef = useRef<((event: FileWatchEvent) => void) | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptRef = useRef(0);
  const hostRef = useRef<string | null>(null);

  const cleanup = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  const connectWebSocket = useCallback(
    (host: string) => {
      const protocol = host.endsWith(':443') ? 'wss' : 'ws';
      const ws = new WebSocket(`${protocol}://${host}/ws`);

      ws.onopen = () => {
        setStatus('connected');
        reconnectAttemptRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data as string) as FileWatchEvent;
          fileEventHandlerRef.current?.(data);
        } catch {
          // Ignore malformed messages
        }
      };

      ws.onclose = () => {
        if (hostRef.current) {
          setStatus('reconnecting');
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptRef.current), 30000);
          reconnectAttemptRef.current++;
          reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket(host);
          }, delay);
        }
      };

      wsRef.current = ws;
    },
    []
  );

  const connect = useCallback(
    async (host: string) => {
      cleanup();
      setStatus('connecting');
      hostRef.current = host;
      setServerHost(host);

      try {
        const protocol = host.endsWith(':443') ? 'https' : 'http';
        const healthRes = await fetch(`${protocol}://${host}/api/health`);
        if (!healthRes.ok) throw new Error('Health check failed');

        const configRes = await fetch(`${protocol}://${host}/api/config`);
        if (!configRes.ok) throw new Error('Config fetch failed');
        const serverConfig = (await configRes.json()) as ServerConfig;
        setConfig(serverConfig);

        connectWebSocket(host);
      } catch {
        setStatus('disconnected');
        setServerHost(null);
        hostRef.current = null;
        setConfig(null);
      }
    },
    [cleanup, connectWebSocket]
  );

  const disconnect = useCallback(() => {
    hostRef.current = null;
    cleanup();
    setStatus('disconnected');
    setServerHost(null);
    setConfig(null);
  }, [cleanup]);

  const onFileEvent = useCallback((handler: (event: FileWatchEvent) => void) => {
    fileEventHandlerRef.current = handler;
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return { status, serverHost, config, connect, disconnect, onFileEvent };
}
```

- [ ] **Step 5: Run tests**

Run: `pnpm nx test playground -- --testPathPattern=useServerConnection`
Expected: All tests PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/playground/src/hooks/types.ts \
  packages/playground/src/hooks/useServerConnection.ts \
  packages/playground/src/hooks/__tests__/useServerConnection.spec.ts
git commit -m "feat(playground): add server connection hook with WebSocket reconnection"
```

---

### Task 10: Local Files Hook

**Files:**
- Create: `packages/playground/src/hooks/useLocalFiles.ts`
- Create: `packages/playground/src/hooks/__tests__/useLocalFiles.spec.ts`

- [ ] **Step 1: Write failing test**

```typescript
// packages/playground/src/hooks/__tests__/useLocalFiles.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePlaygroundStore } from '../../store';
import { useLocalFiles } from '../useLocalFiles';

vi.mock('../../providers/local-file-provider', () => ({
  LocalFileProvider: vi.fn().mockImplementation(() => ({
    listFiles: vi.fn().mockResolvedValue([
      { path: 'test.prs', size: 10, modified: '2026-01-01' },
    ]),
    readFile: vi.fn().mockResolvedValue('@identity Test'),
    writeFile: vi.fn().mockResolvedValue(undefined),
  })),
}));

describe('useLocalFiles', () => {
  const mockOnFileEvent = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    usePlaygroundStore.setState({
      files: [],
      activeFile: '',
    });
  });

  it('loads files from server when connected', async () => {
    const { result } = renderHook(() => useLocalFiles('localhost:3000', mockOnFileEvent));

    // Wait for async file loading
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    const state = usePlaygroundStore.getState();
    expect(state.files).toHaveLength(1);
    expect(state.files[0]?.path).toBe('test.prs');
  });

  it('does not load files when serverHost is null', () => {
    renderHook(() => useLocalFiles(null, mockOnFileEvent));

    const state = usePlaygroundStore.getState();
    expect(state.files).toHaveLength(0);
  });

  it('provides a saveFile function', async () => {
    const { result } = renderHook(() => useLocalFiles('localhost:3000', mockOnFileEvent));

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(result.current.saveFile).toBeInstanceOf(Function);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm nx test playground -- --testPathPattern=useLocalFiles`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement useLocalFiles**

```typescript
// packages/playground/src/hooks/useLocalFiles.ts
import { useEffect, useRef, useCallback } from 'react';
import { usePlaygroundStore } from '../store';
import { LocalFileProvider } from '../providers/local-file-provider';
import type { FileWatchEvent } from './types';

export function useLocalFiles(
  serverHost: string | null,
  onFileEvent: (handler: (event: FileWatchEvent) => void) => void
) {
  const setFiles = usePlaygroundStore((s) => s.setFiles);
  const updateFile = usePlaygroundStore((s) => s.updateFile);
  const addFile = usePlaygroundStore((s) => s.addFile);
  const deleteFile = usePlaygroundStore((s) => s.deleteFile);

  const providerRef = useRef<LocalFileProvider | null>(null);
  const recentSavesRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!serverHost) {
      providerRef.current = null;
      return;
    }

    const provider = new LocalFileProvider(serverHost);
    providerRef.current = provider;

    const loadFiles = async (): Promise<void> => {
      const entries = await provider.listFiles();
      const files = await Promise.all(
        entries.map(async (entry) => ({
          path: entry.path,
          content: await provider.readFile(entry.path),
        }))
      );
      setFiles(files);
    };

    loadFiles();
  }, [serverHost, setFiles]);

  useEffect(() => {
    onFileEvent(async (event: FileWatchEvent) => {
      if (recentSavesRef.current.has(event.path)) {
        return;
      }

      const provider = providerRef.current;
      if (!provider) return;

      switch (event.type) {
        case 'file:changed': {
          const content = await provider.readFile(event.path);
          updateFile(event.path, content);
          break;
        }
        case 'file:created': {
          const content = await provider.readFile(event.path);
          addFile(event.path, content);
          break;
        }
        case 'file:deleted':
          deleteFile(event.path);
          break;
      }
    });
  }, [onFileEvent, updateFile, addFile, deleteFile]);

  const saveFile = useCallback(
    async (path: string, content: string): Promise<void> => {
      const provider = providerRef.current;
      if (!provider) return;

      recentSavesRef.current.add(path);
      setTimeout(() => recentSavesRef.current.delete(path), 1000);

      await provider.writeFile(path, content);
    },
    []
  );

  return { saveFile, provider: providerRef.current };
}
```

- [ ] **Step 4: Run tests**

Run: `pnpm nx test playground -- --testPathPattern=useLocalFiles`
Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/playground/src/hooks/useLocalFiles.ts \
  packages/playground/src/hooks/__tests__/useLocalFiles.spec.ts
git commit -m "feat(playground): add useLocalFiles hook for server file sync"
```

---

### Task 11: ConnectionBar Component

**Files:**
- Create: `packages/playground/src/components/ConnectionBar.tsx`
- Create: `packages/playground/src/components/__tests__/ConnectionBar.spec.tsx`

- [ ] **Step 1: Write failing test**

```typescript
// packages/playground/src/components/__tests__/ConnectionBar.spec.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConnectionBar } from '../ConnectionBar';

describe('ConnectionBar', () => {
  const defaultProps = {
    status: 'disconnected' as const,
    serverHost: null,
    onConnect: vi.fn(),
    onDisconnect: vi.fn(),
  };

  it('shows connect button when disconnected', () => {
    render(<ConnectionBar {...defaultProps} />);
    expect(screen.getByText('Connect to local server')).toBeTruthy();
  });

  it('shows input field after clicking connect', () => {
    render(<ConnectionBar {...defaultProps} />);
    fireEvent.click(screen.getByText('Connect to local server'));
    expect(screen.getByPlaceholderText('localhost:3000')).toBeTruthy();
  });

  it('calls onConnect when submitting host', () => {
    const onConnect = vi.fn();
    render(<ConnectionBar {...defaultProps} onConnect={onConnect} />);
    fireEvent.click(screen.getByText('Connect to local server'));
    fireEvent.click(screen.getByText('Connect'));
    expect(onConnect).toHaveBeenCalledWith('localhost:3000');
  });

  it('shows connected state with disconnect button', () => {
    render(<ConnectionBar {...defaultProps} status="connected" serverHost="localhost:3000" />);
    expect(screen.getByText('Connected')).toBeTruthy();
    expect(screen.getByText('localhost:3000')).toBeTruthy();
    expect(screen.getByText('Disconnect')).toBeTruthy();
  });

  it('calls onDisconnect when clicking disconnect', () => {
    const onDisconnect = vi.fn();
    render(
      <ConnectionBar
        {...defaultProps}
        status="connected"
        serverHost="localhost:3000"
        onDisconnect={onDisconnect}
      />
    );
    fireEvent.click(screen.getByText('Disconnect'));
    expect(onDisconnect).toHaveBeenCalled();
  });

  it('shows reconnecting state', () => {
    render(<ConnectionBar {...defaultProps} status="reconnecting" serverHost="localhost:3000" />);
    expect(screen.getByText('Reconnecting...')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm nx test playground -- --testPathPattern=ConnectionBar`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement ConnectionBar.tsx**

```tsx
// packages/playground/src/components/ConnectionBar.tsx
import { useState } from 'react';
import type { ConnectionStatus } from '../hooks/useServerConnection';

interface ConnectionBarProps {
  status: ConnectionStatus;
  serverHost: string | null;
  onConnect: (host: string) => void;
  onDisconnect: () => void;
}

const STATUS_COLORS: Record<ConnectionStatus, string> = {
  disconnected: 'bg-gray-500',
  connecting: 'bg-yellow-400 animate-pulse',
  connected: 'bg-green-500',
  reconnecting: 'bg-yellow-400 animate-pulse',
};

const STATUS_LABELS: Record<ConnectionStatus, string> = {
  disconnected: 'Not connected',
  connecting: 'Connecting...',
  connected: 'Connected',
  reconnecting: 'Reconnecting...',
};

export function ConnectionBar({ status, serverHost, onConnect, onDisconnect }: ConnectionBarProps) {
  const [showInput, setShowInput] = useState(false);
  const [inputValue, setInputValue] = useState('localhost:3000');

  const handleSubmit = () => {
    if (inputValue.trim()) {
      onConnect(inputValue.trim());
      setShowInput(false);
    }
  };

  if (status === 'disconnected' && !showInput) {
    return (
      <div className="flex items-center gap-2 px-4 py-1.5 bg-ps-bg border-b border-ps-border text-sm">
        <div className={`w-2 h-2 rounded-full ${STATUS_COLORS[status]}`} />
        <span className="text-gray-400">{STATUS_LABELS[status]}</span>
        <button
          onClick={() => setShowInput(true)}
          className="ml-auto px-2 py-0.5 text-xs bg-ps-primary hover:bg-ps-secondary rounded text-white"
        >
          Connect to local server
        </button>
      </div>
    );
  }

  if (showInput) {
    return (
      <div className="flex items-center gap-2 px-4 py-1.5 bg-ps-bg border-b border-ps-border text-sm">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSubmit();
            if (e.key === 'Escape') setShowInput(false);
          }}
          placeholder="localhost:3000"
          className="bg-ps-surface border border-ps-border rounded px-2 py-0.5 text-white text-xs w-48 outline-none focus:border-ps-primary"
          autoFocus
          onClick={(e) => e.stopPropagation()}
        />
        <button
          onClick={handleSubmit}
          className="px-2 py-0.5 text-xs bg-ps-primary hover:bg-ps-secondary rounded text-white"
        >
          Connect
        </button>
        <button
          onClick={() => setShowInput(false)}
          className="px-2 py-0.5 text-xs text-gray-400 hover:text-white"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-4 py-1.5 bg-ps-bg border-b border-ps-border text-sm">
      <div className={`w-2 h-2 rounded-full ${STATUS_COLORS[status]}`} />
      <span className="text-gray-300">{STATUS_LABELS[status]}</span>
      {serverHost && <span className="text-gray-500 text-xs">{serverHost}</span>}
      {status === 'connected' && (
        <button
          onClick={onDisconnect}
          className="ml-auto px-2 py-0.5 text-xs text-gray-400 hover:text-red-400"
        >
          Disconnect
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run tests**

Run: `pnpm nx test playground -- --testPathPattern=ConnectionBar`
Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/playground/src/components/ConnectionBar.tsx \
  packages/playground/src/components/__tests__/ConnectionBar.spec.tsx
git commit -m "feat(playground): add ConnectionBar component with tests"
```

---

### Task 12: Integrate Local Mode into App

**Files:**
- Modify: `packages/playground/src/App.tsx`
- Modify: `packages/playground/src/hooks/useUrlState.ts`
- Modify: `packages/playground/src/components/Header.tsx`
- Modify: `packages/playground/src/components/FileTabs.tsx` (line 31-33)

- [ ] **Step 1: Update useUrlState to handle ?server= and disable sync in local mode**

In `packages/playground/src/hooks/useUrlState.ts`:

Add a `serverParam` ref after line 27:

```typescript
const serverParamRef = useRef<string | null>(null);
const isLocalModeRef = useRef(false);
```

In the mount effect (the first `useEffect`), add server param detection before the state loading:

```typescript
// Detect ?server= parameter
const url = new URL(window.location.href);
serverParamRef.current = url.searchParams.get('server');
isLocalModeRef.current = serverParamRef.current !== null;

// Skip URL state sync in local mode
if (isLocalModeRef.current) return;
```

In the URL sync effect (the second `useEffect`), add an early return:

```typescript
// Don't sync state to URL in local mode — files come from the server
if (isLocalModeRef.current) return;
```

Update the return to include `serverParam`:

```typescript
return { handleShare, serverParam: serverParamRef.current };
```

- [ ] **Step 2: Update App.tsx with local mode integration**

In `packages/playground/src/App.tsx`:

Add imports:

```typescript
import { ConnectionBar } from './components/ConnectionBar';
import { useServerConnection } from './hooks/useServerConnection';
import { useLocalFiles } from './hooks/useLocalFiles';
```

Inside `PlaygroundLayout`, after existing hooks, add:

```typescript
const { status, serverHost, config, connect, disconnect, onFileEvent } = useServerConnection();
const { saveFile } = useLocalFiles(serverHost, onFileEvent);
const isLocalMode = status === 'connected';
```

Update the `handleShare` destructuring:

```typescript
const { handleShare, serverParam } = useUrlState();
```

Add auto-connect and URL management effects:

```typescript
// Auto-connect if ?server= parameter present
useEffect(() => {
  if (serverParam && status === 'disconnected') {
    connect(serverParam);
  }
}, [serverParam, status, connect]);

// Update URL when connection changes
useEffect(() => {
  const url = new URL(window.location.href);
  if (serverHost && status === 'connected') {
    url.searchParams.set('server', serverHost);
    window.history.replaceState(null, '', url.toString());
  }
}, [serverHost, status]);
```

Create a disconnect handler that also cleans the URL:

```typescript
const handleDisconnect = useCallback(() => {
  disconnect();
  const url = new URL(window.location.href);
  url.searchParams.delete('server');
  window.history.replaceState(null, '', url.toString());
}, [disconnect]);
```

Update the Cmd+S keyboard shortcut to also save to server:

```typescript
if (mod && e.key === 's' && !e.shiftKey) {
  e.preventDefault();
  doCompile();
  if (isLocalMode) {
    const state = usePlaygroundStore.getState();
    const content = state.files.find((f) => f.path === state.activeFile)?.content;
    if (content !== undefined) {
      saveFile(state.activeFile, content);
    }
  }
}
```

Add `ConnectionBar` in JSX right after `<Header />`:

```tsx
<ConnectionBar
  status={status}
  serverHost={serverHost}
  onConnect={connect}
  onDisconnect={handleDisconnect}
/>
```

- [ ] **Step 3: Update Header.tsx to hide Share/Examples in local mode**

In `packages/playground/src/components/Header.tsx`:

After the existing state declarations, add:

```typescript
const isLocalMode = window.location.search.includes('server=');
```

Wrap the Examples button (lines 114-122) and Share button (lines 124-130) with `{!isLocalMode && ( ... )}`.

- [ ] **Step 4: Update FileTabs.tsx for YAML rename handling**

In `packages/playground/src/components/FileTabs.tsx`, update `handleRenameSubmit` (lines 31-39):

```typescript
const handleRenameSubmit = (oldPath: string) => {
  if (editValue && editValue !== oldPath) {
    const isYaml = editValue.endsWith('.yaml') || editValue.endsWith('.yml');
    const newPath = isYaml
      ? editValue
      : editValue.endsWith('.prs')
        ? editValue
        : `${editValue}.prs`;
    if (!files.some((f) => f.path === newPath)) {
      renameFile(oldPath, newPath);
    }
  }
  setEditingFile(null);
};
```

- [ ] **Step 5: Run all playground tests**

Run: `pnpm nx test playground`
Expected: All tests PASS (existing + new).

- [ ] **Step 6: Commit**

```bash
git add packages/playground/src/App.tsx packages/playground/src/hooks/useUrlState.ts \
  packages/playground/src/components/Header.tsx packages/playground/src/components/FileTabs.tsx
git commit -m "feat(playground): integrate local mode with server connection and file sync"
```

---

### Task 13: Full Verification

- [ ] **Step 1: Run format**

Run: `pnpm run format`

- [ ] **Step 2: Run lint**

Run: `pnpm run lint`

- [ ] **Step 3: Run typecheck**

Run: `pnpm run typecheck`

- [ ] **Step 4: Run all tests**

Run: `pnpm run test`

- [ ] **Step 5: Validate .prs files**

Run: `pnpm prs validate --strict`

- [ ] **Step 6: Check JSON schemas**

Run: `pnpm schema:check`

- [ ] **Step 7: Check SKILL.md sync**

Run: `pnpm skill:check`

- [ ] **Step 8: Fix any issues found**

Address any failures from steps 1-7.

- [ ] **Step 9: Final commit (if fixes needed)**

```bash
git add -A
git commit -m "chore: fix lint/format/type issues from playground integration"
```
