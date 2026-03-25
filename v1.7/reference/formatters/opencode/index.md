# OpenCode Formatter

| Property          | Value                                    |
| ----------------- | ---------------------------------------- |
| **Tier**          | Custom                                   |
| **Main output**   | `OPENCODE.md`                            |
| **Dot directory** | `.opencode/`                             |
| **Skills**        | Yes (`.opencode/skills/<name>/SKILL.md`) |
| **Agents**        | Yes (`.opencode/agents/<name>.md`)       |
| **Commands**      | Yes (`.opencode/commands/<name>.md`)     |
| **Local files**   | No                                       |

## Output Files

| File              | Path                               | Purpose                    |
| ----------------- | ---------------------------------- | -------------------------- |
| Main instructions | `OPENCODE.md`                      | Primary rule file          |
| Skills            | `.opencode/skills/<name>/SKILL.md` | Reusable skill definitions |
| Commands          | `.opencode/commands/<name>.md`     | Slash commands             |
| Agents            | `.opencode/agents/<name>.md`       | Agent configurations       |

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
| Description in Frontmatter | Yes       |
| Globs in Frontmatter       | No        |
| Activation Type            | No        |
| Glob Pattern Targeting     | No        |
| Always Apply Rules         | Yes       |
| Manual Activation          | No        |
| Auto/Model Activation      | No        |
| Character Limit Validation | No        |
| Content Section Splitting  | Yes       |
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

- Main file is `OPENCODE.md` at project root
- Full feature support: commands, skills, and agents
- Commands go to `.opencode/commands/<name>.md`
- Skills go to `.opencode/skills/<name>/SKILL.md`
- Agents go to `.opencode/agents/<name>.md`
- Three output modes: `simple`, `multifile`, `full`

## Example Output

```text
project-root/
├── OPENCODE.md                        # Main instructions
└── .opencode/
    ├── commands/
    │   └── review.md                  # Command definition
    ├── skills/
    │   └── my-skill/
    │       └── SKILL.md               # Skill definition
    └── agents/
        └── reviewer.md               # Agent config
```

## Official Documentation

- [OpenCode](https://github.com/nicholasgriffintn/opencode)
