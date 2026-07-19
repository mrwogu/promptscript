# Cursor Formatter

| Property          | Value                                  |
| ----------------- | -------------------------------------- |
| **Tier**          | Custom                                 |
| **Main output**   | `.cursor/rules/project.mdc`            |
| **Dot directory** | `.cursor/`                             |
| **Skills**        | Yes (`.agents/skills/<name>/SKILL.md`) |
| **Agents**        | Yes (`.cursor/agents/<name>.md`)       |
| **Commands**      | Yes (`.cursor/commands/<name>.md`)     |
| **Local files**   | No                                     |

## Output Files

| File              | Path                             | Purpose                    |
| ----------------- | -------------------------------- | -------------------------- |
| Main instructions | `.cursor/rules/project.mdc`      | Primary rule file          |
| Skills            | `.agents/skills/<name>/SKILL.md` | Reusable skill definitions |
| Commands          | `.cursor/commands/<name>.md`     | Slash commands             |
| Agents            | `.cursor/agents/<name>.md`       | Agent configurations       |

## Supported Features

| Feature                    | Supported |
| -------------------------- | --------- |
| Markdown Output            | Yes       |
| MDC Format                 | Yes       |
| Code Blocks                | Yes       |
| Mermaid Diagrams           | Yes       |
| Single File Output         | Yes       |
| Multiple Rule Files        | Yes       |
| Workflow Files             | No        |
| Nested Directory Structure | Yes       |
| YAML Frontmatter           | Yes       |
| Description in Frontmatter | Yes       |
| Globs in Frontmatter       | Yes       |
| Activation Type            | Yes       |
| Glob Pattern Targeting     | Yes       |
| Always Apply Rules         | Yes       |
| Manual Activation          | Partial   |
| Auto/Model Activation      | Partial   |
| Structured Examples        | Yes       |
| Character Limit Validation | No        |
| Content Section Splitting  | Yes       |
| Guard Dependencies         | No        |
| Context File Inclusion     | Yes       |
| @-Mentions                 | Planned   |
| Tool Integration           | Partial   |
| Path-Specific Rules        | Yes       |
| Prompt Files               | No        |
| Slash Commands             | Yes       |
| Skills                     | Yes       |
| Agent Instructions         | Yes       |
| Local Memory               | No        |
| Nested Memory              | Planned   |

## Limitations & Quirks

- Uses MDC (Markdown Components) format with YAML frontmatter including `description`, `globs`, and `alwaysApply`
- Supports `modern`, `multifile`, `legacy`, `agents-md`, and `full` output modes
- Commands go to `.cursor/commands/*.md` for slash command support
- `@shortcuts` with multi-line content become command files
- The `.cursorrules` file (`legacy` mode) is deprecated; `.cursor/rules/*.mdc` is preferred
- `full` mode adds commands, `.agents/skills/<name>/SKILL.md`, and `.cursor/agents/<name>.md`
- Supports `@file` and `@folder` context references in rules
- Nested directory rules are supported

## Example Output

```text
project-root/
├── .cursor/
│   ├── rules/
│   │   ├── project.mdc               # Main rules (MDC format)
│   │   └── frontend.mdc              # Path-specific rules
│   └── commands/
│       └── review.md                  # Slash command
```

## Official Documentation

- [Cursor Rules](https://docs.cursor.com/context/rules-for-ai)
- [Cursor Commands](https://cursor.com/changelog/1-6)
