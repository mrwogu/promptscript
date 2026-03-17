# GitHub Copilot — Compatibility Research

## Official Documentation

- Primary docs URL: https://docs.github.com/en/copilot/how-tos/configure-custom-instructions
- Repository instructions: https://docs.github.com/copilot/customizing-copilot/adding-custom-instructions-for-github-copilot
- Support matrix: https://docs.github.com/en/copilot/reference/custom-instructions-support
- Custom agents: https://docs.github.com/en/copilot/how-tos/use-copilot-agents/coding-agent/create-custom-agents
- VS Code reference: https://code.visualstudio.com/docs/copilot/customization/custom-instructions
- GitHub repo: https://github.com/github/awesome-copilot
- Last verified: 2026-03-17

## Expected File Format

- Path: `.github/copilot-instructions.md` (primary); `.github/instructions/*.instructions.md` (path-specific); `.github/prompts/*.prompt.md` (prompt/slash-command files); `.github/agents/*.agent.md` (custom agents); `.github/skills/<name>/SKILL.md` (skills); `AGENTS.md` (agent-compatible overview)
- Format: Markdown (plain, no frontmatter on the main file; YAML frontmatter on path-specific, prompt, skill, and agent files)
- Encoding: UTF-8
- Max size: Not documented with a byte/character count for the main file ("very long instruction files may result in some instructions being overlooked"; agents content capped at 30,000 characters per file)
- Frontmatter: Not required on `copilot-instructions.md`; required/optional fields vary per file type (see below)

### Frontmatter by File Type

| File type          | Required fields            | Optional fields                                               |
| ------------------ | -------------------------- | ------------------------------------------------------------- |
| `.instructions.md` | `applyTo` (glob or `"**"`) | `excludeAgent` (`"code-review"` or `"coding-agent"`)          |
| `.prompt.md`       | `description`              | `mode` (`agent`), `tools` (array), `handoffs`                 |
| `SKILL.md`         | `name`, `description`      | `disable-model-invocation`                                    |
| `.agent.md`        | `description`              | `name`, `tools`, `model`, `mcp-servers`, `target`, `handoffs` |

## Supported Features

| Feature                 | Supported by Platform                                               | Currently Implemented | Gap                               |
| ----------------------- | ------------------------------------------------------------------- | --------------------- | --------------------------------- |
| Single file output      | yes                                                                 | yes                   | none                              |
| Multi-file rules        | yes                                                                 | yes                   | none                              |
| YAML frontmatter        | yes (per-file-type, see above)                                      | yes                   | none                              |
| Frontmatter description | yes (prompt, agent, skill files)                                    | yes                   | none                              |
| Frontmatter globs       | yes (`applyTo` in `.instructions.md`)                               | yes                   | none                              |
| Glob patterns           | yes                                                                 | yes                   | none                              |
| Manual activation       | no                                                                  | no                    | none                              |
| Auto activation         | no (globs auto-match files, not activation type)                    | no                    | none                              |
| Section splitting       | yes                                                                 | yes                   | none                              |
| Character limit         | yes (30,000 chars for agent files; soft limit for main file)        | no                    | missing — no size warning emitted |
| Slash commands          | yes (via `.github/prompts/*.prompt.md`)                             | yes                   | none                              |
| Skills                  | yes (`.github/skills/<name>/SKILL.md`)                              | yes                   | none                              |
| Context inclusion       | yes (file refs in prompt files via `[label](path)` or `#file:path`) | no                    | missing — not generated           |
| @-Mentions              | no                                                                  | no                    | none                              |
| Tool integration        | yes (via `tools` field in prompt and agent frontmatter)             | yes                   | none                              |
| Path-specific rules     | yes (`.github/instructions/*.instructions.md` with `applyTo`)       | yes                   | none                              |
| Prompt files            | yes (`.github/prompts/*.prompt.md`)                                 | yes                   | none                              |
| Agent instructions      | yes (`AGENTS.md` + `.github/agents/*.agent.md`)                     | yes                   | none                              |
| Local memory            | no                                                                  | no                    | none                              |
| Nested memory           | no (AGENTS.md nesting is experimental in VS Code)                   | no                    | none                              |
| MDC format              | no                                                                  | no                    | none                              |
| Workflows               | no                                                                  | no                    | none                              |

## Conventions & Best Practices

- Section ordering: No mandatory ordering; platform recommends short, self-contained statements. Best practice is to organize by concern: project identity, tech stack, architecture, coding standards, git conventions, restrictions.
- Naming conventions: Path-specific files must end with `.instructions.md`; prompt files must end with `.prompt.md`; custom agent files must end with `.agent.md`; filenames for agents may only contain `.`, `-`, `_`, `a-z`, `A-Z`, `0-9`.
- Official examples: The docs show instructions written as single paragraphs or bullet lists separated by blank lines. The docs emphasize that whitespace between instructions is ignored. Examples show that `applyTo: "**"` applies to all files; `applyTo: "**/*.ts,**/*.tsx"` targets TypeScript files.
- Special requirements: The `excludeAgent` field in `.instructions.md` frontmatter restricts which Copilot surface applies the instruction (`code-review` or `coding-agent`). Agent profile content maximum is 30,000 characters. Copilot also recognizes `CLAUDE.md` and `GEMINI.md` as agent-compatible instruction sources (read-only on GitHub Copilot's side for cross-tool compatibility).

## Gap Analysis vs Current Implementation

### Correct (what we do right)

- Output path `.github/copilot-instructions.md` is correct for the primary file.
- Simple/multifile/full version tiers map well to the platform's actual feature set.
- Path-specific instruction files use the correct `.github/instructions/<name>.instructions.md` path and `applyTo` YAML frontmatter.
- The `excludeAgent` field is supported in the `InstructionConfig` interface and emitted to frontmatter.
- Prompt files use the correct `.github/prompts/<name>.prompt.md` path with `description`, `mode`, and `tools` frontmatter fields.
- Tool name mapping (`TOOL_NAME_MAPPING`) correctly translates Claude Code canonical tool names to GitHub Copilot tool identifiers (`read`, `edit`, `search`, `execute`, `web`, `agent`, `todo`).
- Model name mapping (`MODEL_NAME_MAPPING`) correctly translates short model aliases to GitHub Copilot full names.
- Skill files use the correct `.github/skills/<name>/SKILL.md` path with `name`, `description`, and `disable-model-invocation` frontmatter.
- Custom agent files use `.github/agents/<name>.agent.md` with required `description` field and correct `name`, `tools`, `model`, `handoffs` optional fields.
- `AGENTS.md` is generated in full mode at the repo root, consistent with the open AGENTS.md standard supported by GitHub Copilot.
- Handoffs are emitted in YAML frontmatter for both prompt files and agent files.
- `specModel` field is handled in agent frontmatter (GitHub Copilot mixed-model planning/execution mode).
- The `target` field is present in docs (values: `vscode` or `github-copilot`) but not yet surfaced via PRS; the omission is safe (defaults to all environments).
- The feature matrix correctly marks MDC format, workflows, nested memory, local memory, manual activation, auto-activation, @-mentions, and context inclusion as not supported.

### Incorrect (what we do wrong)

- The `description` field is **not** listed as a supported frontmatter field for `.instructions.md` files in the official docs (the docs list only `applyTo` and `excludeAgent`). The current `generateInstructionFile` adds a Markdown `# description` heading below the frontmatter rather than a `description` frontmatter key, which is acceptable, but does not use a frontmatter `description` field for `.instructions.md` — this is consistent with the spec.
- The `name` field in `SKILL.md` frontmatter is emitted with single quotes (e.g., `name: 'my-skill'`). The official docs show `name` as a plain string. The value is functionally correct but the quoting style deviates from the canonical examples.
- The main file header `# copilot-instructions.md` is emitted in markdown convention mode. The official documentation does not specify or require a top-level heading in the main file. This is excess decoration but is not harmful; however, it is not a platform convention.

### Missing (features platform supports but we don't implement)

- **Character limit warning**: The agent file content limit is 30,000 characters. The formatter does not emit a warning when generated agent or skill content would exceed this. The main file has a soft undocumented limit (described as "very long files may result in overlooked instructions") with no warning generated.
- **Context file inclusion in prompt files**: The platform supports `[label](../../path/to/file.ts)` or `#file:../../path/to/file.ts` references inside `.prompt.md` files to inject file context into prompts. The formatter does not generate these references.
- **`target` frontmatter field for agent files**: Agent files support a `target` field (`vscode` or `github-copilot`) to restrict deployment environment. Not yet surfaced in the PRS `@agents` block.
- **`mcp-servers` frontmatter field for agent files**: Agent files support configuring MCP servers via the `mcp-servers` object in frontmatter. Not yet surfaced in the PRS `@agents` block.
- **Organization-level agent profiles**: Agents can be defined in `.github-private/agents/` for org-wide deployment. There is no PRS concept or formatter support for this scope.
- **`name` frontmatter field on `.instructions.md` files** (VS Code): The VS Code docs show `name` as an optional frontmatter field for display in the UI. The formatter does not emit it. Low priority as it is VS Code-specific and optional.
- **`description` frontmatter field on `.instructions.md` files** (VS Code): Similarly, VS Code supports a `description` hover-text field. Not emitted.

### Excess (features we generate but platform doesn't support)

- None identified. All generated files and fields correspond to documented GitHub Copilot features.

## Language Extension Requirements

- **`target` property on agent definitions**: To support environment-scoped agent deployment (`vscode` vs `github-copilot`), the `@agents` block would need a `target` property. Expressible with existing object-property syntax; no new block type needed.
- **`mcp-servers` property on agent definitions**: To configure MCP server access per agent, the `@agents` block would need a nested `mcp-servers` object. Expressible with existing nested object syntax; no new block type needed.
- **File reference syntax in prompt content**: To support `#file:path` or `[label](path)` context inclusions in generated prompt files, either the PRS string syntax must allow a reference type, or a new `@references` sub-block within `@shortcuts` entries would be needed. This cannot currently be expressed cleanly with existing blocks without manual string interpolation.

## Recommended Changes (priority ordered)

1. **Add character limit warning for agent files**: Emit a compile-time warning (not error) when any `.github/agents/*.agent.md` content exceeds 30,000 characters. Update `feature-matrix.ts` to mark `character-limit` as `supported` for `github` once implemented.
2. **Add `target` property support to the `@agents` block for GitHub**: Surface `target: vscode | github-copilot` in agent frontmatter to allow org or repo agents to be scoped to a specific Copilot surface.
3. **Add `mcp-servers` property support to the `@agents` block for GitHub**: Surface MCP server configuration in the GitHub agent file frontmatter.
4. **Emit `name` and `description` VS Code frontmatter fields on `.instructions.md`**: Add optional `name` and `description` frontmatter keys to path-specific instruction files for improved VS Code UI integration (hover text, display name).
5. **Soft limit warning for the main `copilot-instructions.md`**: The platform documentation warns that very long files may result in instructions being overlooked. A soft warning at a reasonable threshold (e.g., 8,000 characters) would improve UX.
6. **Document and potentially expose file context references in prompt content**: Consider a structured way to express `#file:path` references in `.prompt.md` file bodies so that generated prompts can reference repository files as context.
