# Claude Code Formatter

| Property          | Value                                  |
| ----------------- | -------------------------------------- |
| **Tier**          | Custom                                 |
| **Main output**   | `CLAUDE.md`                            |
| **Dot directory** | `.claude/`                             |
| **Skills**        | Yes (`.claude/skills/<name>/SKILL.md`) |
| **Agents**        | Yes (`.claude/agents/<name>.md`)       |
| **Commands**      | No                                     |
| **Local files**   | Yes (`CLAUDE.local.md`)                |

## Output Files

| File              | Path                             | Purpose                           |
| ----------------- | -------------------------------- | --------------------------------- |
| Main instructions | `CLAUDE.md`                      | Primary rule file                 |
| Local overrides   | `CLAUDE.local.md`                | Private instructions (gitignored) |
| Skills            | `.claude/skills/<name>/SKILL.md` | Reusable skill definitions        |
| Agents            | `.claude/agents/<name>.md`       | Agent configurations              |

## Supported Features

| Feature                    | Supported |
| -------------------------- | --------- |
| Markdown Output            | Yes       |
| MDC Format                 | No        |
| Code Blocks                | Yes       |
| Mermaid Diagrams           | Yes       |
| Single File Output         | Yes       |
| Multiple Rule Files        | Yes       |
| Workflow Files             | No        |
| Nested Directory Structure | No        |
| YAML Frontmatter           | Yes       |
| Description in Frontmatter | No        |
| Globs in Frontmatter       | Yes       |
| Activation Type            | No        |
| Glob Pattern Targeting     | Yes       |
| Always Apply Rules         | Yes       |
| Manual Activation          | No        |
| Auto/Model Activation      | No        |
| Character Limit Validation | No        |
| Content Section Splitting  | Yes       |
| Context File Inclusion     | No        |
| @-Mentions                 | No        |
| Tool Integration           | No        |
| Path-Specific Rules        | Yes       |
| Prompt Files               | No        |
| Slash Commands             | Yes       |
| Skills                     | Yes       |
| Agent Instructions         | Yes       |
| Local Memory               | Yes       |
| Nested Memory              | Yes       |

## Limitations & Quirks

- `CLAUDE.md` is gitignored by many project templates — you may need to `git add -f CLAUDE.md`
- `CLAUDE.local.md` is intentionally not committed to git (private developer overrides)
- Skills support frontmatter fields: `name`, `description`, plus newer fields like `model`, `allowedTools`, `disallowedTools`, `permissionMode`, `specModel`, `specReasoningEffort`
- Agent files support: `name`, `description`, `model`, `allowedTools`, `disallowedTools`, `permissionMode`, `specModel`, `specReasoningEffort`, `skills`
- The `@local` block content goes to `CLAUDE.local.md` with an import statement added to the main `CLAUDE.md`

## Example Output

```text
project-root/
├── CLAUDE.md                          # Main instructions
├── CLAUDE.local.md                    # Local overrides (gitignored)
└── .claude/
    ├── skills/
    │   └── my-skill/
    │       └── SKILL.md               # Skill with YAML frontmatter
    └── agents/
        └── reviewer.md                # Agent config with frontmatter
```

## Official Documentation

- [Claude Code Documentation](https://docs.anthropic.com/en/docs/claude-code)
- [Claude Code Skills](https://docs.anthropic.com/en/docs/claude-code/skills)
