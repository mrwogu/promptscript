# GitHub Copilot Formatter

| Property          | Value                                    |
| ----------------- | ---------------------------------------- |
| **Tier**          | Custom                                   |
| **Main output**   | `.github/copilot-instructions.md`        |
| **Dot directory** | `.github/`                               |
| **Skills**        | Yes (`.github/skills/<name>/SKILL.md`)   |
| **Agents**        | Yes (`.github/agents/<name>.md`)         |
| **Commands**      | Yes (`.github/prompts/<name>.prompt.md`) |
| **Local files**   | No                                       |

## Output Files

| File              | Path                               | Purpose                    |
| ----------------- | ---------------------------------- | -------------------------- |
| Main instructions | `.github/copilot-instructions.md`  | Primary rule file          |
| Skills            | `.github/skills/<name>/SKILL.md`   | Reusable skill definitions |
| Prompts           | `.github/prompts/<name>.prompt.md` | Slash commands             |
| Agents            | `.github/agents/<name>.md`         | Agent configurations       |
| Agents index      | `AGENTS.md`                        | Top-level agents file      |

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
| Character Limit Validation | Planned   |
| Content Section Splitting  | Yes       |
| Context File Inclusion     | No        |
| @-Mentions                 | No        |
| Tool Integration           | No        |
| Path-Specific Rules        | Yes       |
| Prompt Files               | Yes       |
| Slash Commands             | Yes       |
| Skills                     | Yes       |
| Agent Instructions         | Yes       |
| Local Memory               | No        |
| Nested Memory              | No        |

## Limitations & Quirks

- Three output modes: `simple` (single file), `multifile` (path-specific instructions + prompts), `full` (+ skills, agents, AGENTS.md)
- Path-specific instructions use `applyTo` frontmatter for glob targeting
- Prompt files (`.github/prompts/*.prompt.md`) support agent mode with `mode: agent` and `tools` list
- Skills go to `.github/skills/<name>/SKILL.md` with YAML frontmatter
- Agents go to `.github/agents/<name>.md` + top-level `AGENTS.md`
- `@shortcuts` with `prompt: true` become prompt files; without `prompt` they become instruction files

## Example Output

```text
project-root/
├── .github/
│   ├── copilot-instructions.md        # Main instructions
│   ├── instructions/
│   │   └── frontend.instructions.md   # Path-specific (applyTo globs)
│   ├── prompts/
│   │   └── review.prompt.md           # Slash command / prompt
│   ├── skills/
│   │   └── my-skill/
│   │       └── SKILL.md               # Skill definition
│   └── agents/
│       └── reviewer.md                # Agent config
└── AGENTS.md                          # Top-level agents file
```

## Official Documentation

- [GitHub Copilot Custom Instructions](https://docs.github.com/en/copilot/customizing-copilot/adding-repository-custom-instructions-for-github-copilot)
- [GitHub Copilot Prompt Files](https://docs.github.com/en/copilot/tutorials/customization-library/prompt-files)
