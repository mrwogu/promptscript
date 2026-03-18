---
title: Building Skills
description: Create custom skills for PromptScript - from simple instructions to parameterized skills with resource files
---

# Building Skills

Skills are reusable units of AI instructions. Each skill is a directory with a `SKILL.md` file and optional resource files. PromptScript compiles them to all your AI coding agents.

## Minimal Skill

A skill only needs a `SKILL.md` file:

```
.promptscript/skills/
└── my-skill/
    └── SKILL.md
```

```markdown
---
name: my-skill
description: Short description of what this skill does
---

Detailed instructions for the AI assistant.
Explain what the skill should do, step by step.
```

Reference it in your `.prs` file:

```promptscript
@skills {
  my-skill: {
    description: "Short description of what this skill does"
  }
}
```

That's it. Run `prs compile` and the skill is available in all your AI agents.

## SKILL.md Frontmatter

The YAML frontmatter defines the skill's identity and content:

```markdown
---
name: code-review
description: Security-focused code review
---

Instructions here...
```

| Property | Type | Default | Description |
|---|---|---|---|
| `name` | string | required | Skill identifier (matches directory name) |
| `description` | string | required | What the skill does |
| `params` | object | - | Parameter definitions for `{{variable}}` templates |
| `inputs` | object | - | Runtime input contract (see [Skill Contracts](skill-contracts.md)) |
| `outputs` | object | - | Runtime output contract (see [Skill Contracts](skill-contracts.md)) |

## Behavior Properties (in .prs only)

Properties like `userInvocable`, `disableModelInvocation`, `context`, `agent`, and `allowedTools` control how AI agents handle the skill. These are set in your `.prs` file, not in SKILL.md frontmatter:

```promptscript
@skills {
  code-review: {
    description: "Security-focused code review"
    userInvocable: true
    context: "fork"
    agent: "general-purpose"
    allowedTools: ["Read", "Grep", "Bash"]
  }
}
```

| Property | Type | Default | Supported by |
|---|---|---|---|
| `userInvocable` | boolean | `false` | Claude, Factory |
| `disableModelInvocation` | boolean | `false` | Claude, GitHub, Factory |
| `context` | string | - | Claude (`"fork"` or `"inherit"`) |
| `agent` | string | - | Claude |
| `allowedTools` | string[] | - | Claude, Factory |

## Writing Good Instructions

### Be specific about what and how

```markdown
---
name: security-audit
description: Audit code for OWASP Top 10 vulnerabilities
---

## What to Check

Scan the provided code for these vulnerability categories:

1. **Injection** - SQL, NoSQL, OS command, LDAP
2. **Broken Authentication** - weak passwords, session fixation
3. **Sensitive Data Exposure** - PII in logs, unencrypted storage
4. **Security Misconfiguration** - debug mode, default credentials

## Output Format

For each finding:
- Severity: Critical / High / Medium / Low
- Location: file and line
- Description: what the vulnerability is
- Fix: how to remediate it

## What NOT to Do

- Don't modify code without explicit approval
- Don't skip files based on extension
- Don't report false positives for framework-handled concerns
```

### Use structured sections

Skills work best when they have clear sections that tell the AI exactly what to do:

- **What to check / What to do** - the task itself
- **Output format** - expected structure of the response
- **Constraints** - boundaries and restrictions
- **Examples** - concrete input/output pairs

## Adding Resource Files

Place files alongside `SKILL.md` to include data, scripts, or templates:

```
.promptscript/skills/ui-design/
├── SKILL.md
├── data/
│   ├── colors.csv
│   ├── typography.csv
│   └── stacks/
│       ├── react.csv
│       └── vue.csv
└── scripts/
    └── search.py
```

All files are copied to every compilation target:

```
.claude/skills/ui-design/SKILL.md
.claude/skills/ui-design/data/colors.csv
.claude/skills/ui-design/scripts/search.py
```

Reference resource files in your instructions using the target path:

```markdown
---
name: ui-design
description: UI design with searchable databases
---

## Available Data

Search the design database:

```bash
python3 .claude/skills/ui-design/scripts/search.py "query"
```

Available data files:
- `data/colors.csv` - Color palettes and accessibility info
- `data/typography.csv` - Font pairings and sizing scales
```

### Resource file limits

- Maximum 1 MB per file
- Maximum 10 MB total per skill
- Maximum 100 files per skill
- Binary files (containing null bytes) and symlinks are excluded
- Path traversal attempts (`../`) are rejected
- Auto-skipped files: `.env`, lock files (`pnpm-lock.yaml`, `yarn.lock`, `package-lock.json`), config files (`package.json`, `tsconfig.json`, `Dockerfile`), ESLint/Prettier configs, and more (45+ patterns)
- Auto-skipped directories: `node_modules`, `.git`, `dist`, `build`, `coverage`, `test`, `__tests__`, and more (16+ patterns)

### .skillignore

Add a `.skillignore` file to any skill directory for custom exclusion rules (gitignore syntax):

```
# .promptscript/skills/my-skill/.skillignore
*.log
tmp/
draft-*.md
```

## Parameterized Skills

Make skills reusable across projects with `{{variable}}` templates:

```markdown
---
name: test-generator
description: Generate {{framework}} tests for {{language}} code
params:
  language:
    type: string
    default: typescript
  framework:
    type: enum
    options: [vitest, jest, mocha, pytest]
    default: vitest
  coverage:
    type: number
    default: 80
---

Write comprehensive {{framework}} tests for the provided {{language}} code.
Target {{coverage}}% code coverage.
```

Pass values in the `.prs` file:

```promptscript
@skills {
  test-generator: {
    language: "python"
    framework: "pytest"
    coverage: 90
  }
}
```

### Parameter types

| Type | Description | Example |
|---|---|---|
| `string` | Free text | `"typescript"` |
| `number` | Numeric value | `90` |
| `boolean` | True/false | `true` |
| `enum` | One of predefined options | `"strict"` (with `options: [relaxed, standard, strict]`) |

## Skill Contracts

Define formal inputs and outputs for skills that interact with external data:

```markdown
---
name: security-scan
description: Scan for vulnerabilities
inputs:
  files:
    description: List of file paths to scan
    type: string
  severity:
    description: Minimum severity level
    type: enum
    options: [low, medium, high]
    default: medium
outputs:
  report:
    description: Scan report in markdown
    type: string
  passed:
    description: Whether scan passed
    type: boolean
---

Scan the provided files for security issues.
Report findings with at least {{severity}} severity.
```

See [Skill Contracts](skill-contracts.md) for the full reference.

## Skill Dependencies

Declare that one skill requires another:

```promptscript
@skills {
  lint-check: {
    description: "Run linting"
  }

  full-review: {
    description: "Complete code review"
    requires: ["lint-check"]
  }
}
```

PromptScript validates that required skills exist and have no circular dependencies.

## Testing Your Skill

### 1. Compile and inspect output

```bash
prs compile
```

Check the generated files:

```bash
cat .claude/skills/my-skill/SKILL.md
```

### 2. Validate

```bash
prs validate --strict
```

This checks:
- Parameter types are valid (PS015)
- Required skills exist (PS016)
- Contract definitions are correct (PS017)

### 3. Try it

Open your AI coding agent and invoke the skill. For user-invocable skills in Claude Code:

```
/my-skill
```

## Publishing Skills

### Share via Git

Push your skill directory to a GitHub repository. Others install it with:

```bash
npx skills add your-org/your-skills \
  --skill my-skill \
  --dir .promptscript/skills
```

### Share via registry

Add skills to your PromptScript registry as part of a package:

```
my-registry/
└── @company/
    └── skills/
        └── security-audit/
            └── SKILL.md
```

Teams inherit them with `@use @company/skills`.

See [Build Your Registry](registry.md) for details.

## Examples

### Simple commit skill

```
.promptscript/skills/commit/
└── SKILL.md
```

```markdown
---
name: commit
description: Create well-structured git commits
---

When creating commits:

1. Use conventional commit format: `type(scope): description`
2. Types: feat, fix, docs, style, refactor, test, chore
3. Keep the first line under 72 characters
4. Add a blank line before the body
5. Explain why, not what
```

Reference in `.prs` with behavior properties:

```promptscript
@skills {
  commit: {
    description: "Create well-structured git commits"
    userInvocable: true
  }
}
```

### Review skill with checklist

```
.promptscript/skills/review/
├── SKILL.md
└── checklist.md
```

```markdown
---
name: review
description: Code review with checklist
---

Review the code changes using the checklist in `checklist.md`.

For each item:
- PASS: requirement met
- FAIL: requirement not met, explain why
- N/A: not applicable

Summarize findings at the end.
```

Reference in `.prs` with behavior properties:

```promptscript
@skills {
  review: {
    description: "Code review with checklist"
    userInvocable: true
    allowedTools: ["Read", "Grep"]
  }
}
```

### Data-driven skill with scripts

```
.promptscript/skills/stack-advisor/
├── SKILL.md
├── data/
│   ├── frameworks.csv
│   └── benchmarks.json
└── scripts/
    └── compare.py
```

```markdown
---
name: stack-advisor
description: Technology stack recommendations backed by data
---

## Available Tools

Run comparisons:
```bash
python3 .claude/skills/stack-advisor/scripts/compare.py "react" "vue"
```

## Data Sources

- `data/frameworks.csv` - Framework comparison matrix
- `data/benchmarks.json` - Performance benchmarks

## Process

1. Understand the requirements
2. Search the data for matching frameworks
3. Run comparisons if needed
4. Recommend with data-backed reasoning
```

## See Also

- [Using npx skills](npx-skills.md) - Install open-source skills from GitHub
- [Local Skills](local-skills.md) - Full reference for skill resolution and resource handling
- [Skill Contracts](skill-contracts.md) - Define inputs and outputs
- [Shared Resources](shared-resources.md) - Share files across all skills
