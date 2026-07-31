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

| File              | Path                              | Purpose                                   |
| ----------------- | --------------------------------- | ----------------------------------------- |
| Main instructions | `AGENTS.md`                       | Primary rule file                         |
| Always-on rules   | `.factory/rules/**/*.md`          | Split rule files when `rulesMode: split`  |
| Lifecycle hooks   | `.factory/hooks.json`             | Project hooks in multifile and full modes |
| Skills            | `.factory/skills/<name>/SKILL.md` | Reusable skill definitions                |
| Commands          | `.factory/commands/<name>.md`     | Slash commands                            |
| Agents            | `.factory/droids/<name>.md`       | Agent configurations                      |

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
- `@hooks` uses `.factory/hooks.json` with PascalCase event names in `multifile` and `full` modes
- Hook `matcher` values match Factory tool names (for example `Execute`, `Read`, `Edit|Write`); other targets use different tool-name vocabularies, so a matcher that works here may match nothing elsewhere
- `.factory/settings.json` remains a Factory fallback; `prs hooks install factory` migrates its unambiguous hooks
- When `@hooks` is removed or no longer emits, the CLI removes a fully PromptScript-owned `.factory/hooks.json`; directories emptied by cleanup (`.factory/rules` and its subdirectories) are pruned as well
- Three output modes: `simple`, `multifile`, `full`
- Always-on rules default to the byte-compatible `monolith` mode
- In `monolith` mode, `@standards` render as grouped `###` subsections (one per topic) under `Conventions & Patterns`, preserving the source topic structure
- Free-form text `@standards` (triple-quoted string) renders under `Conventions & Patterns` in `monolith` mode, or as `.factory/rules/standards.md` in split rules mode; embedded headings are adjusted to nest under the surrounding section (h2 downgraded to h3 in monolith, relative shift in split)
- Split rules require the `multifile` or `full` output version

PromptScript versions before 1.16 could place language-level hooks in `.factory/settings.json`. `prs hooks install factory` copies unambiguous legacy entries into `.factory/hooks.json`, preserves unrelated settings, and refuses partial migrations when event names or entries are ambiguous. `prs compile` reports a `PS4002` warning while the fallback file still contains a non-PromptScript-owned `hooks` key and `.factory/hooks.json` is absent.

## Split Rules

Use `rulesMode: split` to keep `AGENTS.md` focused on operational context while moving the always-on standards into rule files under `.factory/rules/`. `AGENTS.md` links to each rule file so an agent can open the relevant one before editing related code.

```yaml
targets:
  - factory:
      version: multifile
      rulesMode: split
```

Split mode emits one file for each non-empty `@standards` topic, plus semantic files for git workflows, configuration, documentation, diagrams, remaining knowledge, restrictions, and examples when those sections exist. `AGENTS.md` contains a readable index of only the emitted files.

When `@standards` contains free-form text instead of topics, split mode emits a single `.factory/rules/standards.md` file with the text normalized (common indentation stripped, headings shifted relative to the shallowest one so it becomes h2 below the `# Standards` title, capped at h6).

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
- [Factory Hooks Reference](https://docs.factory.ai/reference/hooks-reference)
