# Cursor Formatter

| Property          | Value                              |
| ----------------- | ---------------------------------- |
| **Tier**          | Custom                             |
| **Main output**   | `.cursor/rules/project.mdc`        |
| **Dot directory** | `.cursor/`                         |
| **Skills**        | No                                 |
| **Agents**        | No                                 |
| **Commands**      | Yes (`.cursor/commands/<name>.md`) |
| **Local files**   | No                                 |

## Output Files

| File              | Path                         | Purpose           |
| ----------------- | ---------------------------- | ----------------- |
| Main instructions | `.cursor/rules/project.mdc`  | Primary rule file |
| Commands          | `.cursor/commands/<name>.md` | Slash commands    |

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
| Character Limit Validation | No        |
| Content Section Splitting  | Yes       |
| Context File Inclusion     | Yes       |
| @-Mentions                 | Planned   |
| Tool Integration           | Partial   |
| Path-Specific Rules        | Yes       |
| Prompt Files               | No        |
| Slash Commands             | Yes       |
| Skills                     | Planned   |
| Agent Instructions         | Planned   |
| Local Memory               | No        |
| Nested Memory              | Planned   |

## Limitations & Quirks

- Uses MDC (Markdown Components) format with YAML frontmatter including `description`, `globs`, and `alwaysApply`
- Supports three output modes: `simple` (.cursorrules single file), `multifile` (.cursor/rules/\*.mdc), `full` (+ commands)
- Commands go to `.cursor/commands/*.md` for slash command support
- `@shortcuts` with multi-line content become command files
- The `.cursorrules` file (simple mode) is a legacy format; `.cursor/rules/*.mdc` is preferred
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
