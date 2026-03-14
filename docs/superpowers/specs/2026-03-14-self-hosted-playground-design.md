# Self-Hosted Playground Design

**Issue:** [#64 — Self Host Playground w/ repo](https://github.com/mrwogu/promptscript/issues/64)
**Date:** 2026-03-14
**Status:** Draft

## Problem

The PromptScript playground is browser-only with no way to work against real files on disk. Developers want a local playground connected to their repo for live editing and compilation feedback.

## Solution

A Docker-based self-hosted playground that mounts a local repo and serves the existing playground SPA backed by a thin file I/O server. No git operations inside the container — files are volume-mounted and git stays on the host.

## Architecture

```
+---------------------------------------------+
|              Docker Container                |
|                                              |
|  +---------------------------------------+   |
|  |      playground-server (Fastify)      |   |
|  |                                       |   |
|  |  Static Files -- Playground SPA       |   |
|  |  REST API ---- File CRUD              |   |
|  |  WebSocket --- File Watch Events      |   |
|  +----------------+----------------------+   |
|                   |                           |
|              /workspace (volume mount)        |
+-------------------+---------------------------+
                    |
          +---------+---------+
          |  Host filesystem  |
          |  (user's repo)    |
          +-------------------+
```

### New Package: `packages/playground-server`

A Fastify server (~200-300 lines) that:

- Serves the built playground SPA as static files
- Provides REST endpoints for file operations (scoped to `/workspace`)
- Runs a chokidar file watcher (watching `**/*.prs` and `**/promptscript.yaml` only) and pushes change events over WebSocket
- Binds to `0.0.0.0` inside the container (required for Docker port forwarding)

### Modified Package: `packages/playground`

Gains a "local mode" by introducing a file provider abstraction:

- `FileProvider` interface with two implementations:
  - `MemoryFileProvider` — existing behavior for the web playground
  - `LocalFileProvider` — talks to playground-server REST API
- Local mode detected via `window.__PLAYGROUND_CONFIG__` injected into the HTML template by the server
- Compilation remains client-side via `browser-compiler` (unchanged)

### Docker Integration

New `playground` service in `docker-compose.yaml`. The Dockerfile entrypoint is changed to a shell script that dispatches between the CLI (`prs`) and the playground server based on the first argument.

## API Design

### REST Endpoints

All paths scoped to `/workspace`. Path traversal (`../`) rejected with 403. PUT body limited to 1MB.

| Method   | Endpoint         | Description                                          |
|----------|------------------|------------------------------------------------------|
| `GET`    | `/api/health`    | Health check — returns `200 OK`                      |
| `GET`    | `/api/config`    | Server config (mode, workspace root)                 |
| `GET`    | `/api/files`     | List all `.prs` and `promptscript.yaml` files        |
| `GET`    | `/api/files/*`   | Read a single file's contents                        |
| `PUT`    | `/api/files/*`   | Write/update a file (read-write mode only)           |
| `POST`   | `/api/files/*`   | Create a new file (read-write mode only)             |
| `DELETE` | `/api/files/*`   | Delete a file (read-write mode only)                 |

### Response Shapes

**`GET /api/config`:**

```json
{
  "mode": "readwrite",
  "workspace": "/workspace"
}
```

This is also injected into the HTML as `window.__PLAYGROUND_CONFIG__` so the SPA can detect local mode without an extra API call on startup.

**`GET /api/files`:**

```json
{
  "files": [
    { "path": "src/team.prs", "size": 1234, "modified": "2026-03-14T12:00:00Z" },
    { "path": "promptscript.yaml", "size": 256, "modified": "2026-03-14T11:00:00Z" }
  ]
}
```

**`GET /api/files/*`:**

```json
{
  "path": "src/team.prs",
  "content": "@identity Team Lead\n..."
}
```

### WebSocket (`/ws`)

```json
{ "type": "file:changed", "path": "src/team.prs" }
{ "type": "file:created", "path": "src/new.prs" }
{ "type": "file:deleted", "path": "src/old.prs" }
```

**Reconnection policy:** Client reconnects with exponential backoff (1s, 2s, 4s, max 30s). On reconnection, client re-fetches `GET /api/files` to reconcile state and catch missed events.

### Security

- All file paths resolved relative to `/workspace` — traversal attempts return 403
- In read-only mode, mutating endpoints return 403
- Mode controlled via `PLAYGROUND_MODE=readonly|readwrite` (default: `readwrite`)
- CORS not required — SPA and API are same-origin (served from the same Fastify instance)

## Playground SPA Changes

### Local Mode Behavior

- File tab list populated from `GET /api/files`
- Opening a tab fetches content via `GET /api/files/*`
- Cmd+S saves to disk via `PUT` AND recompiles
- WebSocket connection listens for external changes
- "Share" and "Examples" features hidden
- New file creation UI available in read-write mode

### Conflict Handling

When a file is modified externally while the editor has unsaved changes:
- Show a notification offering to **reload** (discard local edits) or **keep** local changes
- WebSocket events for a file that was just saved via PUT are debounced (ignored for 1 second) to avoid false conflict notifications

### `promptscript.yaml` Handling

Listed in the file tree and openable in the editor for viewing/editing, but treated as a plain YAML file (no PromptScript compilation). The `FileTabs` rename logic only applies `.prs` extension constraints to non-YAML files.

### Unchanged

- Monaco editor, syntax highlighting, compilation output panel
- All formatter targets
- Config/environment panels
- Keyboard shortcuts (Cmd+S gains save-to-disk behavior)

## Docker Configuration

### Read-Write (default)

```yaml
playground:
  image: ghcr.io/mrwogu/promptscript:latest
  command: ["playground"]
  ports:
    - "3000:3000"
  volumes:
    - .:/workspace:rw
  environment:
    - PLAYGROUND_MODE=readwrite
    - PLAYGROUND_PORT=3000
  healthcheck:
    test: ["CMD", "wget", "--spider", "-q", "http://localhost:3000/api/health"]
    interval: 10s
    timeout: 3s
    retries: 3
```

### Read-Only

```yaml
playground-readonly:
  image: ghcr.io/mrwogu/promptscript:latest
  command: ["playground"]
  ports:
    - "3000:3000"
  volumes:
    - .:/workspace:ro
  environment:
    - PLAYGROUND_MODE=readonly
  healthcheck:
    test: ["CMD", "wget", "--spider", "-q", "http://localhost:3000/api/health"]
    interval: 10s
    timeout: 3s
    retries: 3
```

### Dockerfile Changes

- Playground SPA build output and playground-server included in the final image
- Entrypoint changed from `ENTRYPOINT ["node", "/app/bin/prs.js"]` to a dispatcher script (`/app/entrypoint.sh`) that:
  - If first argument is `playground`: starts the Fastify server via `node /app/packages/playground-server/dist/main.js`
  - Otherwise: passes arguments to the CLI via `node /app/bin/prs.js "$@"`
- This keeps backward compatibility — existing `docker run ghcr.io/mrwogu/promptscript compile` still works

### Image Size Considerations

Adding the playground SPA (~5-10MB gzipped) and Fastify server will increase the image size. If this becomes a concern, a separate image tag (e.g., `ghcr.io/mrwogu/promptscript:playground`) could be published to keep the CLI-only image lean. For now, a single image simplifies distribution.

### Developer Workflow

```bash
cd my-promptscript-repo
docker compose up playground
# Browser opens at http://localhost:3000
# Edit .prs files in browser or IDE, see live compilation
```

## Testing Strategy

### playground-server (new package)

- **Unit tests:** File path validation (traversal rejection), config parsing, route handlers with mocked filesystem, file size limits
- **Integration tests:** Fastify server against a temp directory — full CRUD lifecycle, WebSocket events on file changes, read-only mode enforcement, health check endpoint
- **Target:** >90% coverage

### playground (modifications)

- **Unit tests:** `FileProvider` interface, `LocalFileProvider` API calls (mocked fetch), config detection logic, conflict notification logic, WebSocket reconnection
- **Existing tests** remain unchanged — `MemoryFileProvider` path is the default

### E2E (stretch goal)

- Docker-based test: build image, mount a fixture repo, verify the playground serves and files are accessible via API

## Packages Not Affected

core, parser, resolver, validator, compiler, formatters, browser-compiler — no changes needed.

Note: The CLI package itself is not modified. The Docker entrypoint dispatcher script handles routing to the playground-server, keeping the CLI decoupled.
