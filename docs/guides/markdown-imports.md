---
title: Markdown Imports
description: Import skills directly from .md files using @use — no external tools needed
---

# Markdown Imports

Starting with PromptScript v1.8, skills can be imported directly from Markdown files using `@use`. No need for `npx skills`, `skills.sh`, or any external installer.

## Why markdown imports?

Traditional skill installation requires running an external tool (`npx skills add ...`) to copy files into `.promptscript/skills/`. Markdown imports let you reference skill files directly — local or remote — and PromptScript handles the rest at compile time.

Benefits:

- No external tools required
- Version-pinned reproducible builds via `promptscript.lock`
- Works with local files, Git repositories, and directory bundles
- Compatible with all existing `@use` features (aliases, `@extend`, params)

## Syntax

### Local file imports

Reference a `.md` file relative to the current `.prs` file:

```
@use ./skills/frontend-design.md
@use ./shared/commit.md as commit
```

### Remote file imports (Go-module style)

Import directly from any Git repository by host path:

```
@use github.com/anthropics/skills/frontend-design@1.0.0
@use github.com/anthropics/skills/commit@^2.0.0       # semver range
@use github.com/anthropics/skills/code-review@main    # branch
```

Version pinning uses `@` after the path segment. Omitting a version resolves to the latest default branch.

### Directory imports

Import an entire skill directory (containing a `SKILL.md`):

```
@use github.com/repo/skills/gitnexus                  # imports gitnexus/SKILL.md
@use ./skills/my-tool                                  # imports ./skills/my-tool/SKILL.md
```

When the path resolves to a directory, PromptScript automatically loads `SKILL.md` from inside it and discovers any sibling resource files (see [Resource files](#resource-files) below).

## Content detection

When PromptScript loads a `.md` file, it determines how to treat its content:

| Content type                   | How detected                                        | Behaviour                                       |
| ------------------------------ | --------------------------------------------------- | ----------------------------------------------- |
| PromptScript (`.prs` in `.md`) | File contains valid PRS block syntax                | Parsed as a `.prs` fragment and merged normally |
| Skill frontmatter              | YAML frontmatter with `name` / `description` fields | Loaded as a skill definition                    |
| Raw markdown                   | No PRS blocks, no skill frontmatter                 | Treated as free-form knowledge content          |

This means you can point `@use` at any existing `.md` file — PromptScript picks the right interpretation automatically.

## CLI: managing markdown imports

PromptScript v1.8 adds a `prs skills` subcommand for managing markdown-imported skills:

```bash
prs skills add github.com/anthropics/skills/commit@1.0.0
# Adds the import to your .prs file and updates promptscript.lock

prs skills remove commit
# Removes the @use line and lock entry for the skill

prs skills list
# Lists all markdown-imported skills with their resolved versions

prs skills update
# Re-resolves all markdown-imported skills to their latest matching versions
# and updates promptscript.lock
```

## Lock file: version pinning

When a `.prs` file contains remote markdown imports, `prs compile` (or `prs lock`) generates a `promptscript.lock` file recording the exact resolved commit for each dependency:

```yaml
# promptscript.lock (auto-generated — commit to version control)
imports:
  github.com/anthropics/skills/commit@1.0.0:
    resolved: github.com/anthropics/skills
    commit: a3f8c2d1b0e94567890abcdef1234567890abcde
    path: commit
  github.com/repo/skills/gitnexus:
    resolved: github.com/repo/skills
    commit: 9b2e1f0a3c84512367890abcdef1234567890abc
    path: gitnexus
```

Commit `promptscript.lock` to version control. This ensures every machine and CI run resolves to the same content, regardless of what has been pushed to the remote since.

Update a single import to the latest matching version:

```bash
prs skills update github.com/anthropics/skills/commit
prs lock --dry-run                    # Preview changes before applying
```

## Resource files

When a markdown import resolves to a directory (e.g. `github.com/repo/skills/gitnexus` → `gitnexus/SKILL.md`), PromptScript automatically discovers and includes sibling resource files — data files, scripts, templates — that live in the same directory tree.

This mirrors the behaviour of locally installed skills:

```
gitnexus/
├── SKILL.md          # main skill definition
├── data/
│   └── repos.csv     # discovered automatically
└── scripts/
    └── query.py      # discovered automatically
```

All discovered files are copied to every compilation target alongside the skill, just as if the directory were in `.promptscript/skills/`.

## Examples

### Mix local and remote imports

```
@meta { id: "my-project" syntax: "1.1.0" }

# Remote skills with version pins
@use github.com/anthropics/skills/commit@1.2.0
@use github.com/anthropics/skills/code-review@^2.0.0

# Local skill file
@use ./skills/custom-lint.md as lint

@skills {
  commit: {
    description: "Create conventional commits"
    userInvocable: true
  }
  code-review: {
    description: "Review code for quality"
    userInvocable: true
  }
  lint: {
    description: "Run custom linting checks"
  }
}
```

### Extend a remote skill

```
@use github.com/anthropics/skills/code-review@1.0.0 as review

@extend review.standards {
  extra: ["Check for our internal naming conventions"]
}
```

## See Also

- [npx skills](npx-skills.md) - Alternative: install skills with the `skills` CLI
- [Local Skills](local-skills.md) - Full reference for skill resolution and resource handling
- [Building Skills](building-skills.md) - Create skills from scratch
- [Skill Contracts](skill-contracts.md) - Define typed inputs and outputs
