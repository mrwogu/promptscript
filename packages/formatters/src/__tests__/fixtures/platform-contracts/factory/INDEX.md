# Factory AI Contracts

Source: https://docs.factory.ai/cli/configuration/agents-md

## Fixture index

| File          | Source URL                                          | Version     | Retrieved  | Expected path                       | Scope           |
| ------------- | --------------------------------------------------- | ----------- | ---------- | ----------------------------------- | --------------- |
| agents-md.md  | https://docs.factory.ai/cli/configuration/agents-md | Factory CLI | 2026-07-17 | `AGENTS.md` (repo root, nested)     | formatter-scope |
| user-level.md | https://docs.factory.ai/cli/configuration/agents-md | Factory CLI | 2026-07-17 | `~/.factory/AGENTS.md` (user-level) | out-of-scope    |

## Scope notes

### AGENTS.md (formatter-scope)

Factory Droids look for `AGENTS.md` in this order (first match wins):

1. `./AGENTS.md` in the current working directory
2. The nearest parent directory up to the repo root
3. Any `AGENTS.md` in sub-folders the agent is working inside
4. Personal override: `~/.factory/AGENTS.md`

Multiple files can coexist. The closer one to the file being edited takes
precedence.

Plain Markdown; headings provide semantic hints. Recommended sections: Build
& Test, Architecture Overview, Security, Git Workflows, Conventions &
Patterns. Aim for <= 150 lines.

PromptScript Factory formatter already emits root `AGENTS.md`. Nested
generation through build profiles is in scope (Task 19). Existing Factory
filtering of unsupported frontmatter fields (including `license`) on generated
and injected skills stays until a Factory fixture allows `license`.

### User-level (out-of-scope)

`~/.factory/AGENTS.md` is a personal override. PromptScript must NEVER write
user-level files. Keep `~/.factory/` outside compiler output.

### Specification mode

`specModel` and `specReasoningEffort` are GA and already supported in
`@agents`.

### Custom droids

`.factory/droids/<name>.md` are GA and already supported via `@agents`.
