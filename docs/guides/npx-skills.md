---
title: Using npx skills with PromptScript
description: Install open-source skills from GitHub repositories and use them with PromptScript
---

# Using npx skills with PromptScript

> **Note:** With PromptScript v1.8+, you can import skills directly using `@use` — no need for `npx skills` or `skills.sh`. See [Markdown Imports](./markdown-imports.md).

The [`skills`](https://www.npmjs.com/package/skills) CLI lets you install open-source skills from GitHub repositories directly into your project. PromptScript compiles these skills to all your AI coding agents automatically.

## Quick Start

### 1. Browse available skills

```bash
# List all skills in the official Anthropic skills repo
npx skills add anthropics/skills --list

# List skills from any GitHub repo
npx skills add vercel-labs/agent-skills --list
```

### 2. Install a skill

```bash
# Install to .promptscript/skills/ for PromptScript projects
npx skills add anthropics/skills \
  --skill frontend-design \
  --dir .promptscript/skills

# Install multiple skills
npx skills add anthropics/skills \
  --skill commit \
  --dir .promptscript/skills

npx skills add anthropics/skills \
  --skill code-review \
  --dir .promptscript/skills
```

This creates the following structure:

```
.promptscript/
└── skills/
    ├── frontend-design/
    │   ├── SKILL.md
    │   ├── data/
    │   │   └── colors.csv
    │   └── scripts/
    │       └── search.py
    ├── commit/
    │   └── SKILL.md
    └── code-review/
        └── SKILL.md
```

### 3. Reference skills in your `.prs` file

```promptscript
@skills {
  frontend-design: {
    description: "UI/UX design with searchable databases"
  }

  commit: {
    description: "Create git commits"
    userInvocable: true
  }

  code-review: {
    description: "Review code changes"
    userInvocable: true
  }
}
```

You only need the skill name and optional metadata. PromptScript loads content from `SKILL.md` automatically.

### 4. Compile

```bash
prs compile
```

Each skill (with all its resource files) is copied to every target:

```
.claude/skills/frontend-design/SKILL.md
.claude/skills/frontend-design/data/colors.csv
.claude/skills/frontend-design/scripts/search.py
.factory/skills/frontend-design/SKILL.md
.factory/skills/frontend-design/data/colors.csv
.factory/skills/frontend-design/scripts/search.py
.gemini/skills/frontend-design/skill.md
...
```

## Alternative: `.agents/` directory

By default, `npx skills add` installs to `.agents/skills/`. PromptScript discovers this directory automatically without any extra configuration:

```bash
# Default install location (no --dir flag)
npx skills add anthropics/skills --skill commit
# Installs to .agents/skills/commit/SKILL.md
```

PromptScript checks skills in this order:

1. `.promptscript/skills/<name>/` (local, highest priority)
2. `.agents/skills/<name>/` (universal directory)
3. Registry (lowest priority)

If you prefer to keep `npx skills` defaults and not use `--dir`, everything works out of the box. To disable this behavior:

```yaml
# promptscript.yaml
universalDir: false
```

## Skill Sources

### Official repositories

| Repository                                                         | Command                                          |
| ------------------------------------------------------------------ | ------------------------------------------------ |
| [Anthropic Skills](https://github.com/anthropics/skills)           | `npx skills add anthropics/skills --list`        |
| [Vercel Agent Skills](https://github.com/vercel-labs/agent-skills) | `npx skills add vercel-labs/agent-skills --list` |

### Community skills

Any GitHub repository that contains skill directories (with `SKILL.md` files) works:

```bash
npx skills add someone/their-skills \
  --skill my-skill \
  --dir .promptscript/skills
```

### OpenSkills

[OpenSkills](https://github.com/numman-ali/openskills) is another skill installer:

```bash
npx openskills install frontend-design \
  --dir .promptscript/skills
```

## Overriding skill metadata

When a skill from `npx skills` doesn't have the exact settings you need, override them in your `.prs` file:

```promptscript
@skills {
  commit: {
    description: "Create commits with conventional format"
    userInvocable: true          # Override default
    disableModelInvocation: true # Override default
  }
}
```

The `content` always comes from `SKILL.md` and cannot be overridden in `.prs`. For other properties, the `.prs` file takes precedence - for example, `description` from `.prs` overrides `description` from SKILL.md frontmatter.

## Parameterized skills

Some skills accept parameters via `{{variable}}` templates in their `SKILL.md`:

```text
---
name: code-review
description: Review {{language}} code
params:
  language:
    type: string
    default: typescript
---

Review the provided {{language}} files.
```

Pass parameter values in your `.prs` file:

```promptscript
@skills {
  code-review: {
    language: "python"
  }
}
```

## Updating skills

To update an installed skill, reinstall it:

```bash
npx skills add anthropics/skills \
  --skill frontend-design \
  --dir .promptscript/skills
```

This overwrites the existing skill directory with the latest version.

## Version control

Commit installed skills to git. They are part of your project's AI configuration:

```bash
git add .promptscript/skills/
git commit -m "feat: add frontend-design and commit skills"
```

## See Also

- [Local Skills](local-skills.md) - Full reference for local skills, resolution order, and resource files
- [Building Skills](building-skills.md) - Create your own skills from scratch
- [Skill Contracts](skill-contracts.md) - Define inputs and outputs for skills
- [Shared Resources](shared-resources.md) - Share files across all skills
