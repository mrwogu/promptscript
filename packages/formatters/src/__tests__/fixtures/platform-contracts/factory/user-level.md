# Factory AI User-Level AGENTS.md - Out of Scope

Source: https://docs.factory.ai/cli/configuration/agents-md
Retrieved: 2026-07-17

## Contract

`~/.factory/AGENTS.md` is the personal override AGENTS.md file. It is the
last entry in the discovery hierarchy:

1. `./AGENTS.md` in the current working directory
2. The nearest parent directory up to the repo root
3. Any `AGENTS.md` in sub-folders the agent is working inside
4. Personal override: `~/.factory/AGENTS.md`

## Why out of scope

PromptScript must never write user-level files. The compiler scope is the
project tree. `~/.factory/` is outside compiler output.

## What PromptScript must not do

- Emit `~/.factory/AGENTS.md`.
- Emit any file under `~/.factory/`.
- Add a Factory target option that writes to the home directory.
