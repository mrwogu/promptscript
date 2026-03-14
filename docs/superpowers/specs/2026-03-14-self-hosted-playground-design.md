# Self-Hosted Playground Design

**Issue:** [#64 — Self Host Playground w/ repo](https://github.com/mrwogu/promptscript/issues/64)
**Date:** 2026-03-14
**Status:** Draft

## Problem

The PromptScript playground is browser-only with no way to work against real files on disk. Developers want a local playground connected to their repo for live editing and compilation feedback.

## Solution

A `prs serve` CLI command that starts a local API server against the current working directory. The existing online playground at `getpromptscript.dev` auto-detects the running server and switches to local mode — connecting to the developer's real files. No SPA bundling in the CLI. Docker runs the same `prs serve` command.

## Architecture

```
+---------------------------+          +---------------------------+
|  getpromptscript.dev      |          |  Developer's machine      |
|  (Online Playground SPA)  |   CORS   |  or Docker container      |
|                           | <------> |                           |
|  - Monaco editor          |          |  prs serve (Fastify)      |
|  - browser-compiler       |          |  - REST API (File CRUD)   |
|  - auto-detects server    |          |  - WebSocket (File Watch) |
+---------------------------+          +-------------+-------------+
                                                     |
                                            CWD or /workspace
                                                     |
                                          +----------+----------+
                                          |  Local filesystem   |
                                          |  (user's repo)      |
                                          +---------------------+
```

### New Package: `packages/server`

A Fastify server (~200-300 lines) that:

- Provides REST endpoints for file operations (scoped to CWD or configured workspace root)
- Runs a chokidar file watcher (watching `**/*.prs` and `**/promptscript.yaml` only) and pushes change events over WebSocket
- Sets CORS headers allowing `getpromptscript.dev` origin (configurable via `--cors-origin`)
- Binds to `127.0.0.1` by default (local use), `0.0.0.0` when `--host 0.0.0.0` is passed (Docker use)
- Handles SIGINT/SIGTERM for graceful shutdown (closes server, file watcher, and WebSocket connections)

### Modified Package: `packages/cli`

New `prs serve` subcommand that:

- Imports and starts the server from `@promptscript/server`
- Accepts options: `--port` (default `3000`), `--host` (default `127.0.0.1`), `--read-only`, `--cors-origin`
- Prints the local URL and the playground URL with connection parameter on startup
- If the port is in use, exits with an error message suggesting `--port <alternative>`

### Modified Package: `packages/playground`

Gains a "local mode" by introducing a file provider abstraction:

- `FileProvider` interface with two implementations:
  - `MemoryFileProvider` — existing behavior when no server is detected
  - `LocalFileProvider` — talks to the local `prs serve` API
- Local mode activated via URL parameter (e.g., `?server=localhost:3000`) or a "Connect to local server" UI button
- The `server` parameter is persisted in the URL. Refreshing the page retains the connection. Clicking "Disconnect" removes the parameter.
- On activation, playground probes `GET /api/health` to verify the server is reachable
- Compilation remains client-side via `browser-compiler` (unchanged)

### Server Parameter Format

The `?server=` URL parameter accepts `host:port` (e.g., `localhost:3000`). The playground uses `http://` for connections to non-443 ports and `https://` for port 443.

## API Design

### REST Endpoints

All paths scoped to the workspace root. Path traversal (`../`) rejected with 403. PUT body limited to 1MB.

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
  "workspace": "/Users/dev/my-project"
}
```

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

- All file paths resolved relative to workspace root — traversal attempts return 403
- In read-only mode (`--read-only`), mutating endpoints return 403
- CORS: Server allows requests from `https://getpromptscript.dev` only by default. Configurable via `--cors-origin` for self-hosted playground instances.
- Default bind to `127.0.0.1` — only accessible locally unless explicitly changed with `--host`

## Playground SPA Changes

### Connection Flow

1. User runs `prs serve` — CLI prints:
   ```
   PromptScript server running at http://localhost:3000
   Open playground: https://getpromptscript.dev/playground/?server=localhost:3000
   ```
2. User opens the URL (or clicks it in their terminal)
3. Playground detects `?server=` parameter, probes `GET /api/health`
4. If reachable, switches to local mode. If not, shows connection error with retry option.

Alternatively, users can open `getpromptscript.dev/playground/` and click "Connect to local server" to enter the server address manually.

### Local Mode Behavior

- File tab list populated from `GET /api/files`
- Opening a tab fetches content via `GET /api/files/*`
- Cmd+S saves to disk via `PUT` AND recompiles
- WebSocket connection listens for external changes
- "Share" and "Examples" features hidden; "Disconnect" button shown instead
- New file creation UI available in read-write mode
- Connection status indicator in the toolbar (connected/disconnected/reconnecting)

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
- The playground works exactly as before when no server is connected

## Docker Configuration

### Read-Write (default)

```yaml
playground:
  image: ghcr.io/mrwogu/promptscript:latest
  command: ["serve", "--host", "0.0.0.0"]
  ports:
    - "3000:3000"
  volumes:
    - .:/workspace:rw
  working_dir: /workspace
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
  command: ["serve", "--host", "0.0.0.0", "--read-only"]
  ports:
    - "3000:3000"
  volumes:
    - .:/workspace:ro
  working_dir: /workspace
  healthcheck:
    test: ["CMD", "wget", "--spider", "-q", "http://localhost:3000/api/health"]
    interval: 10s
    timeout: 3s
    retries: 3
```

### Self-Hosted with Custom CORS

For environments where the playground is self-hosted at a different origin:

```yaml
playground-custom:
  image: ghcr.io/mrwogu/promptscript:latest
  command: ["serve", "--host", "0.0.0.0", "--cors-origin", "https://promptscript.internal.company.com"]
  ports:
    - "3000:3000"
  volumes:
    - .:/workspace:rw
  working_dir: /workspace
```

### Dockerfile Changes

- Add `COPY packages/server/package.json packages/server/` to the builder stage for layer caching
- Ensure `@promptscript/server` dist output is included in the runtime stage (either bundled into CLI dist or copied separately)
- No entrypoint changes — `prs serve` is a standard CLI subcommand handled by the existing entrypoint

### Developer Workflow

**Without Docker (Node.js installed):**

```bash
cd my-promptscript-repo
prs serve
# → PromptScript server running at http://localhost:3000
# → Open playground: https://getpromptscript.dev/playground/?server=localhost:3000
```

**With Docker:**

```bash
cd my-promptscript-repo
docker compose up playground
# → Same output, open the playground URL in browser
```

## Known Limitations

### Mixed Content (HTTPS playground → HTTP server)

The playground at `https://getpromptscript.dev` is served over HTTPS. The local server runs on HTTP. Modern browsers exempt `localhost`/`127.0.0.1` from mixed-content blocking, so **local development works without issues**.

However, connecting to a **remote** non-HTTPS server (e.g., `http://192.168.1.50:3000`) from the HTTPS playground **will be blocked** by browsers. Solutions for remote use:

1. Place the server behind a reverse proxy with TLS (e.g., nginx, caddy)
2. Self-host the playground SPA on HTTP alongside the server (same origin, no mixed content)

## Testing Strategy

### server (new package)

- **Unit tests:** File path validation (traversal rejection), config parsing, route handlers with mocked filesystem, file size limits, CORS header validation, graceful shutdown
- **Integration tests:** Fastify server against a temp directory — full CRUD lifecycle, WebSocket events on file changes, read-only mode enforcement, health check endpoint, port conflict error
- **Target:** >90% coverage

### cli (modifications)

- **Unit tests:** `serve` command option parsing and server startup (mocked server)

### playground (modifications)

- **Unit tests:** `FileProvider` interface, `LocalFileProvider` API calls (mocked fetch), server detection logic, conflict notification logic, WebSocket reconnection, connection status UI, URL parameter persistence
- **Existing tests** remain unchanged — `MemoryFileProvider` path is the default

### E2E (stretch goal)

- Start `prs serve` against a fixture directory, open playground, verify file operations end-to-end

## Packages Not Affected

core, parser, resolver, validator, compiler, formatters, browser-compiler — no changes needed.
