# @promptscript/playground

> **Internal package** - Part of the [PromptScript](https://github.com/mrwogu/promptscript) monorepo.

Web-based playground for writing and previewing PromptScript in the browser.

## Status

This is a **private** internal package. It is not published to npm.

## Purpose

An interactive editor that lets users write `.prs` code and see compiled output in real time, directly in the browser.

## Architecture

```
+-------------------+     +----------------------+
|  Monaco Editor    | --> |  browser-compiler    |
|  (.prs input)     |     |  (parse + format)    |
+-------------------+     +----------+-----------+
                                     |
                          +----------v-----------+
                          |  Formatted output    |
                          |  (preview panel)     |
                          +-----------------------+
```

## Targets

GitHub, Claude, Cursor and Antigravity are on by default. Turn other coding targets on in the
configuration panel. The `bundle` and `prompt-text` targets are opt-in too: turn them on there or
load the Support Refund Reply example.

Prompt targets compile in a separate pass without environment variables. A `${VAR}` in a prompt
stays text in the bundle, the same as with the CLI. Coding targets still get your variables.

## Tech Stack

- [React](https://react.dev/) 19
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) for code editing
- [Zustand](https://github.com/pmndrs/zustand) for state management
- [Tailwind CSS](https://tailwindcss.com/) v4 for styling
- [Vite](https://vite.dev/) for build tooling
- `@promptscript/browser-compiler` for in-browser compilation

## Development

```bash
pnpm nx dev playground    # Start dev server
pnpm nx build playground  # Production build
```

## License

MIT
