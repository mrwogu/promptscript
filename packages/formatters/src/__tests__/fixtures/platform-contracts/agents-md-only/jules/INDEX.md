# Jules

Source: https://jules.google/docs/
Retrieved: 2026-07-17
Version: Jules (current)

## Contract

Jules is an autonomous coding agent that runs in a virtual machine where it
clones your code, installs dependencies, and modifies files. It integrates
with GitHub.

"Jules now automatically looks for a file named AGENTS.md in the root of your
repository. This file can describe the agents or tools in your codebase, such
as what they do, how to interact with them, or any input and output
conventions. Jules uses this file to better understand your code and generate
more relevant plans and completions."

Keep AGENTS.md up to date - it helps Jules and teammates work with your repo.

## Expected path

`AGENTS.md` (root). Jules reads only the root `AGENTS.md`; nested discovery
is not documented.

## Scope classification

`formatter-scope`. Jules is a cloud coding agent with no project-local skill
or agent file contract.

## PromptScript action (Task 6)

- `outputPath: 'AGENTS.md'`
- `hasSkills: false`, `hasAgents: false`, `hasCommands: false`
- Target-neutral Markdown content; no Jules/Google branding inside the body.
- `simple`, `multifile`, `full` versions emit the same single file.
- Jules reads root `AGENTS.md` only. Do not emit nested AGENTS.md for Jules
  unless a later fixture confirms nested discovery.
