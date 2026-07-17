# Aider

Source: https://aider.chat/docs/usage/conventions.html
Retrieved: 2026-07-17
Version: Aider (current)

## Contract

Aider loads conventions via `--read CONVENTIONS.md` (or `/read
CONVENTIONS.md` in chat), marked as read-only and cached if prompt caching is
enabled. Always-load conventions can be configured in `.aider.conf.yml`:

```yaml
# alone
read: CONVENTIONS.md

# multiple files
read: [CONVENTIONS.md, anotherfile.txt]
```

Aider reads `AGENTS.md` as project-level conventions (the cross-tool
standard). No frontmatter, no skill directory, no agent file. Aider is a
pair-programming tool that works via diffs/patches.

## Expected path

`AGENTS.md` (root).

## Scope classification

`formatter-scope`. Aider has no project-local skill or agent file contract.

## PromptScript action (Task 6)

- `outputPath: 'AGENTS.md'`
- `hasSkills: false`, `hasAgents: false`, `hasCommands: false`
- Target-neutral Markdown content; no Aider branding inside the body.
- `simple`, `multifile`, `full` versions emit the same single file.
- Aider does not document nested AGENTS.md discovery; emit root only unless a
  later fixture confirms nested support.
