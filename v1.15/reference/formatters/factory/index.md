# Factory AI Formatter

| Property          | Value                                   |
| ----------------- | --------------------------------------- |
| **Tier**          | Custom                                  |
| **Main output**   | `AGENTS.md`                             |
| **Dot directory** | `.factory/`                             |
| **Skills**        | Yes (`.factory/skills/<name>/SKILL.md`) |
| **Agents**        | Yes (`.factory/droids/<name>.md`)       |
| **Commands**      | Yes (`.factory/commands/<name>.md`)     |
| **Local files**   | No                                      |

## Output Files

| File              | Path                              | Purpose                                  |
| ----------------- | --------------------------------- | ---------------------------------------- |
| Main instructions | `AGENTS.md`                       | Primary rule file                        |
| Always-on rules   | `.factory/rules/**/*.md`          | Split rule files when `rulesMode: split` |
| Skills            | `.factory/skills/<name>/SKILL.md` | Reusable skill definitions               |
| Commands          | `.factory/commands/<name>.md`     | Slash commands                           |
| Agents            | `.factory/droids/<name>.md`       | Agent configurations                     |

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
| Nested Directory Structure | Yes       |
| YAML Frontmatter           | Yes       |
| Description in Frontmatter | Yes       |
| Globs in Frontmatter       | No        |
| Activation Type            | No        |
| Glob Pattern Targeting     | No        |
| Always Apply Rules         | Yes       |
| Manual Activation          | No        |
| Auto/Model Activation      | No        |
| Structured Examples        | Yes       |
| Character Limit Validation | No        |
| Content Section Splitting  | Yes       |
| Guard Dependencies         | Yes       |
| Context File Inclusion     | No        |
| @-Mentions                 | No        |
| Tool Integration           | No        |
| Path-Specific Rules        | No        |
| Prompt Files               | No        |
| Slash Commands             | Yes       |
| Skills                     | Yes       |
| Agent Instructions         | Yes       |
| Local Memory               | No        |
| Nested Memory              | No        |

## Limitations & Quirks

- Uses `AGENTS.md` as the main file (extends MarkdownInstructionFormatter)
- Skills go to `.factory/skills/<name>/SKILL.md`
- Agents are called "droids" - output to `.factory/droids/<name>.md`
- Three output modes: `simple`, `multifile`, `full`
- Always-on rules default to the byte-compatible `monolith` mode
- In `monolith` mode, `@standards` render as grouped `###` subsections (one per topic) under `Conventions & Patterns`, preserving the source topic structure
- Split rules require the `multifile` or `full` output version

## Split Rules

Use `rulesMode: split` to keep `AGENTS.md` focused on operational context while moving the always-on standards into rule files under `.factory/rules/`. `AGENTS.md` links to each rule file so an agent can open the relevant one before editing related code.

```yaml
targets:
  - factory:
      version: multifile
      rulesMode: split
```

Split mode emits one file for each non-empty `@standards` topic, plus semantic files for git workflows, configuration, documentation, diagrams, remaining knowledge, restrictions, and examples when those sections exist. `AGENTS.md` contains a readable index of only the emitted files.

When a custom `outputPath` is configured for the target, the rule files still live in `.factory/rules/` at the project root and the index links are rewritten relative to the custom `AGENTS.md` location.

When rules are removed or the target returns to `rulesMode: monolith`, the CLI removes obsolete files only when they carry a PromptScript generated marker. Unmarked files and symlinks are never removed.

## Example Output

```text
project-root/
├── AGENTS.md                          # Main instructions
└── .factory/
    ├── rules/
    │   ├── standards/
    │   │   ├── security.md
    │   │   └── typescript.md
    │   ├── git-workflows.md
    │   └── restrictions.md
    ├── skills/
    │   └── my-skill/
    │       └── SKILL.md
    └── droids/
        └── reviewer.md
```

## Official Documentation

- [Factory AI Documentation](https://docs.factory.ai/)
