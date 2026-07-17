# AGENTS.md Open Specification

Source: https://github.com/agentsmd/agents.md (repo), https://agents.md/
Retrieved: 2026-07-17
Version: spec repo last commit d1ac7f0 (Mar 12 2026); v1.1 proposal open

## Contract (v1.0, shipped)

AGENTS.md is a simple, open Markdown format for guiding coding agents. It is
plain Markdown; headings provide semantic hints. There is no frontmatter in
the shipped v1.0 spec.

Minimal example:

```markdown
# Sample AGENTS.md file

## Dev environment tips

- Use `pnpm dlx turbo run where <project_name>` to jump to a package.
- Run `pnpm install --filter <project_name>` to add the package to your workspace.

## Testing instructions

- Find the CI plan in the .github/workflows folder.
- Run `pnpm turbo run test --filter <project_name>` to run every check.

## PR instructions

- Title format: [<project_name>] <Title>
- Always run `pnpm lint` and `pnpm test` before committing.
```

## v1.1 proposal (open, not merged)

Source: https://github.com/agentsmd/agents.md/issues/135

The v1.1 proposal adds optional YAML frontmatter:

- `description` (<=200 chars)
- `tags` array

Purpose: progressive disclosure in monorepos with nested AGENTS.md files.

## Risk

YAML frontmatter remains an open proposal. Enabling it by default could break
consumers that expect Markdown from the first line.

## PromptScript action (Task 20)

Implement only behind an experimental target option:

```yaml
targets:
  - factory:
      agentsFrontmatter: experimental
```

- Read `description` and `tags` from entry `@meta`.
- Enforce description length (<=200 chars) and normalized unique tags.
- Emit no frontmatter by default.
- Reject the option for a target whose fixture does not accept frontmatter.
- Remove the `experimental` name only after the standard is merged and
  consumers pass compatibility tests.

Existing output remains byte-compatible when the option is absent.

## Nested AGENTS.md

Confirmed native in: Codex (88 nested files in OpenAI's own monorepo),
Factory (nearest-first walk), Cursor, Kilo Code, GitHub Copilot, Warp, Grok,
Zed, Devin, Jules.

## AGENTS.override.md (Codex-only)

Replaces rather than extends parent instructions. Codex-only. PromptScript
must reject the override filename for non-Codex targets (Task 19).

## 32 KiB cap (Codex)

Codex enforces a 32 KiB cap per AGENTS.md file. PromptScript must validate
root and nested AGENTS.md against this cap for the Codex target (Task 12).
