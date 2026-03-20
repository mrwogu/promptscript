# @promptscript/server

> **Internal package** - Part of the [PromptScript](https://github.com/mrwogu/promptscript) monorepo.

Local development server for the PromptScript playground.

## Status

This is a **private** internal package bundled into `@promptscript/cli` via the `prs serve` command. It is not published to npm.

## Purpose

Provides a Fastify-based HTTP/WebSocket server that:

- Serves `.prs` files from the local project to the playground UI
- Watches for file changes via chokidar and pushes updates over WebSocket
- Supports read-only mode for safe browsing

## Architecture

```
prs serve
    |
    v
+------------------+
|  Fastify Server  |
|  (HTTP + WS)     |
+--------+---------+
         |
    +----+----+
    |         |
  REST API  WebSocket
  (files)   (file watch events)
```

## Exports

- `createServer`, `startServer` -- server lifecycle
- `createFileWatcher` -- chokidar-based file watcher
- Types: `ServerOptions`, `ServerConfig`, `FileEntry`, `FileContent`, `FileWatchEvent`

## Tech Stack

- [Fastify](https://fastify.dev/) v5
- [@fastify/websocket](https://github.com/fastify/fastify-websocket) for live reload
- [chokidar](https://github.com/paulmillr/chokidar) for file watching

## License

MIT
