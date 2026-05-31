# Antigravity Formatter

| Property          | Value                     |
| ----------------- | ------------------------- |
| **Tier**          | Custom                    |
| **Main output**   | `.agent/rules/project.md` |
| **Dot directory** | `.agent/`                 |
| **Skills**        | No                        |
| **Agents**        | No                        |
| **Commands**      | No                        |
| **Local files**   | No                        |

## Output Files

| File              | Path                      | Purpose           |
| ----------------- | ------------------------- | ----------------- |
| Main instructions | `.agent/rules/project.md` | Primary rule file |

## Supported Features

| Feature                    | Supported |
| -------------------------- | --------- |
| Markdown Output            | Yes       |
| MDC Format                 | No        |
| Code Blocks                | Yes       |
| Mermaid Diagrams           | Yes       |
| Single File Output         | Yes       |
| Multiple Rule Files        | Yes       |
| Workflow Files             | Yes       |
| Nested Directory Structure | Planned   |
| YAML Frontmatter           | Yes       |
| Description in Frontmatter | Yes       |
| Globs in Frontmatter       | Yes       |
| Activation Type            | Yes       |
| Glob Pattern Targeting     | Yes       |
| Always Apply Rules         | Yes       |
| Manual Activation          | Yes       |
| Auto/Model Activation      | Yes       |
| Character Limit Validation | Yes       |
| Content Section Splitting  | Yes       |
| Context File Inclusion     | No        |
| @-Mentions                 | No        |
| Tool Integration           | No        |
| Path-Specific Rules        | Yes       |
| Prompt Files               | No        |
| Slash Commands             | Yes       |
| Skills                     | No        |
| Agent Instructions         | No        |
| Local Memory               | No        |
| Nested Memory              | Planned   |

## Limitations & Quirks

- Has a 12,000 character limit per rule file - content validation warns when exceeded
- Three activation types: `always` (default), `auto` (model decides), `manual` (user invokes)
- Supports workflows (`.agent/workflows/*.yaml`) generated from `@shortcuts` blocks with steps
- Uses nested directory structure: `.agent/rules/` with glob-based file targeting
- YAML frontmatter includes `description`, `globs`, and `alwaysApply` fields
- `@shortcuts` with `steps` array produce YAML workflow files; without `steps` they produce markdown rules

## Example Output

```text
project-root/
└── .agent/
    ├── rules/
    │   ├── project.md                 # Main rules
    │   └── frontend.md                # Path-specific rules
    └── workflows/
        └── deploy.yaml                # Workflow definition
```

## Official Documentation

- [Antigravity Rules & Workflows](https://atamel.dev/posts/2025/11-25_customize_antigravity_rules_workflows/)
