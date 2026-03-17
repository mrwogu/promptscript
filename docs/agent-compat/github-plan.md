# GitHub Copilot — Implementation Plan

## Research Validation

- [x] Output path matches: yes — current: `.github/copilot-instructions.md`, documented: `.github/copilot-instructions.md`
- [x] Format matches: yes — plain Markdown, no frontmatter on the main file; YAML frontmatter on `.instructions.md`, `.prompt.md`, `SKILL.md`, and `.agent.md` files; all consistent with the spec
- [x] Frontmatter correct: mostly yes — details below
  - `.instructions.md`: emits `applyTo` (YAML block list) and optional `excludeAgent`; no `description`, `name` frontmatter keys emitted (correct per spec — those are VS Code-only optional fields)
  - `.prompt.md`: emits `description`, optional `mode`, `tools`, `handoffs` — matches spec
  - `SKILL.md`: emits `name` with single quotes (e.g., `name: 'my-skill'`), `description`, and optional `disable-model-invocation` — functionally correct but quoting style deviates from canonical examples
  - `.agent.md`: emits `name`, `description`, optional `tools`, `model`, `specModel`, `handoffs` — matches spec; `target` and `mcp-servers` fields are not emitted (noted as gaps in research)
- [x] Feature list verified against code: yes
  - `character-limit` is marked `not-supported` in feature matrix; confirmed — no size check exists anywhere in `github.ts`
  - `context-inclusion` is marked `not-supported` in feature matrix; confirmed — prompt file generation (`generatePromptFile`) does not add `[label](path)` or `#file:path` references
  - `tool-integration` is marked `not-supported` in feature matrix; confirmed — the GitHub formatter does emit `tools` frontmatter in prompt and agent files, but the feature-matrix entry is using a different definition ("integration with external tools/commands via terminal"). The `tools` field in prompt/agent files is correctly implemented but tracked under separate features (`slash-commands`, `agent-instructions`). No correction needed.
  - `frontmatter-description` is marked `not-supported` for `github` in feature matrix; verified — `.instructions.md` files do not get a `description` frontmatter key (only `applyTo`/`excludeAgent`). Correct per the spec.
- [x] Documentation URLs accessible: not checked (no browser available; URLs recorded in research are from official GitHub docs domains and appear credible)

### Research Items Previously Marked Unclear — Now Verified from Code

- **`name` field on SKILL.md uses single quotes**: Confirmed at `github.ts` line 622: `lines.push(\`name: '${config.name}'\`)`. The spec shows unquoted plain strings. This is a minor formatting deviation.
- **Main file header**: Confirmed at `github.ts` line 954: `return \`# GitHub Copilot Instructions\``. The research says the official docs do not require or show a top-level heading. This is harmless excess decoration.
- **`target` field on agent files**: Confirmed absent. `GitHubAgentConfig` interface (lines 80–95) has no `target` field, and `generateCustomAgentFile` (lines 860–906) does not emit it.
- **`mcp-servers` field on agent files**: Confirmed absent. Neither the interface nor the generation method handles this field.

## Changes Required

### Formatter Changes

File: `packages/formatters/src/formatters/github.ts`

1. Change: `generateSkillFile` — Remove single-quoting around the `name` value in SKILL.md frontmatter
   Reason: The GitHub Copilot SKILL.md documentation shows `name` as an unquoted plain string. Current code emits `name: 'my-skill'` (line 622); it should emit `name: my-skill`.
   Lines: 617–644 (specifically line 622: `lines.push(\`name: '${config.name}'\`)`)

   Proposed replacement:

   ```typescript
   lines.push(`name: ${config.name}`);
   ```

   Note: If the name could contain YAML-special characters, the `yamlString()` helper from `MarkdownInstructionFormatter` should be used. Since `GitHubFormatter` extends `BaseFormatter` directly, add a local `yamlString` equivalent or inline safe quoting. For skill names validated by `isSafeSkillName` (no `/`, `..`, or `\`), plain emission is safe for names that are alphanumeric/hyphenated. As an alternative with defensive quoting only when needed, use the same pattern already used for `description`:

   ```typescript
   lines.push(`name: ${config.name}`); // safe: isSafeSkillName guarantees no special chars
   ```

### New Features to Implement

1. Feature: Character limit warning for agent files
   Platform docs: Agent file content is capped at 30,000 characters per file. The main `copilot-instructions.md` has a soft/undocumented limit ("very long files may result in instructions being overlooked").
   Implementation: In `generateCustomAgentFile`, after building `content`, check `content.length > 30_000` and emit a compiler warning (not an error). Similarly, in `formatSimple`/`formatMultifile`/`formatFull`, check the main file content length and warn at a reasonable threshold (e.g., 8,000 characters). Warning emission mechanism depends on the formatter output type — investigate whether `FormatterOutput` supports warnings or whether a separate diagnostic channel is used.
   Complexity: small

2. Feature: `target` property on agent files
   Platform docs: The `target` frontmatter field accepts `"vscode"` or `"github-copilot"` to restrict which Copilot surface applies the agent profile. Omitting it applies to all surfaces (safe default).
   Implementation: Add optional `target?: 'vscode' | 'github-copilot'` to `GitHubAgentConfig` interface. Extract from `obj['target']` in `extractCustomAgents`. Emit as `target: ${config.target}` in `generateCustomAgentFile` frontmatter if present.
   Complexity: small

3. Feature: `mcp-servers` property on agent files
   Platform docs: Agent frontmatter supports a `mcp-servers` object to configure MCP server access. Structure: named keys with `url` and optional `type` sub-properties.
   Implementation: Add `mcpServers?: Record<string, { url: string; type?: string }>` to `GitHubAgentConfig`. Extract from `obj['mcpServers']` (or `obj['mcp-servers']`) in `extractCustomAgents`. Emit as nested YAML in `generateCustomAgentFile`. Requires careful YAML serialization since this is a nested object, not a flat list.
   Complexity: medium

4. Feature: `name` and `description` frontmatter fields on `.instructions.md` (VS Code only)
   Platform docs: The VS Code docs show `name` and `description` as optional fields in `.instructions.md` frontmatter for display in the VS Code UI (hover text, display name in the instructions panel). These are not in the primary GitHub Copilot docs.
   Implementation: Add optional `vscodeName?: string` and `vscodeDescription?: string` to `InstructionConfig`. When present, emit after the `applyTo` block and before `excludeAgent` in `generateInstructionFile`. This is low priority and VS Code-specific.
   Complexity: small

### Feature Matrix Updates

- `character-limit`: `not-supported` -> `planned` (for `github`) — once the warning is implemented, change to `supported`
- `tool-integration`: No change needed — current `not-supported` is correct for this feature's definition (terminal/command integration); `tools` frontmatter in agent/prompt files is a separate concern already tracked under other features

### Parity Matrix Updates

No structural parity matrix changes are required. The existing header variations for `github` in `parity-matrix.ts` are all confirmed correct by the golden files:

- `project-identity`: `## Project` — golden files show `## project` (lowercase); the parity matrix records `## Project` but the formatter emits `## project`. This is a pre-existing inconsistency in the parity matrix comment, not a functional issue (the `matchesSectionHeader` function does a substring match and the golden tests pass).
- `code-standards`: `## Code Style` — golden files show `## code-standards`; same note as above.
- `git-commits`: `## Git Commits` — golden files show `## git-commits`.
- `restrictions`: `## Don'ts` — golden files show `## donts`.

These discrepancies are between the parity matrix's `headerVariations` strings and the actual lowercase kebab-case section IDs the formatter emits. They represent documentation drift in the parity matrix but do not break tests (the match function uses `content.includes(header)` which is case-sensitive but the golden tests pass because they compare full file content). No immediate correction is required by this plan, but a follow-up cleanup task is recommended.

### Test Changes

1. Golden file: update existing `packages/formatters/src/__tests__/__golden__/github/full.md` (and regenerate if snapshot-driven)
   Expected content changes: SKILL.md frontmatter name field changes from `name: 'my-skill'` to `name: my-skill` once the quoting fix is applied. The main golden files for simple/multifile/full do not show skill file content directly — the skill output is in `additionalFiles`, so the golden for the main file content is unaffected.

2. Parity test: No new assertions needed for existing sections. If `target` or `mcp-servers` are implemented, add assertions that agent files with those properties produce the correct frontmatter keys.

3. Feature test: Add test cases for:
   - Agent file with content exceeding 30,000 characters emits a warning
   - Main file with content exceeding the soft threshold emits a warning
   - Skill name emitted without single quotes in SKILL.md frontmatter
   - Agent file with `target: vscode` emits `target: vscode` in frontmatter (once implemented)
   - Agent file with `mcp-servers` config emits the nested YAML block (once implemented)

### Language Extension Requirements

- Block: No new block type is needed for `target` on agent definitions — expressible by adding a `target` property to the existing `@agents` block object syntax.
- Block: No new block type is needed for `mcp-servers` on agent definitions — expressible as a nested object within the existing `@agents` block.
- Block: `@references` sub-block within `@shortcuts` entries (for prompt file context inclusion)
  Reason: The `#file:path` and `[label](path)` context references in `.prompt.md` files cannot currently be expressed cleanly with existing block syntax. String interpolation would require the user to manually write the markdown reference syntax in the `content` field, which works but is not type-safe or discoverable.
  Platforms needing it: `github` (`.prompt.md` files); potentially others that support file context in prompts.
  Content structure: A `references` array field within a shortcut object, each entry having `label` and `path` properties. The formatter would emit them as `[label](path)` or `#file:path` lines at the top of the prompt content.

## Complexity Assessment

- Formatter changes: small (one-line quoting fix for SKILL.md `name` field)
- New features: small-to-medium (character limit warning: small; `target`: small; `mcp-servers`: medium; VS Code `name`/`description` on `.instructions.md`: small)
- Test changes: small
- Language extensions: none required for current formatter correctness; `@references` is a future enhancement for prompt file context inclusion
- Overall: small

## Implementation Notes

1. **Skill name quoting** is the only confirmed correctness issue. It is a cosmetic deviation — GitHub Copilot processes the file correctly regardless, but it fails to match the canonical documentation examples. Fix is a single-character change.

2. **Character limit warning** requires understanding the formatter's diagnostic/warning output channel. If `FormatterOutput` does not currently support warnings, a new `warnings?: string[]` field would need to be added to that type before the warning feature can be wired up. Check `packages/formatters/src/types.ts` before implementing.

3. **Agent file `target` and `mcp-servers` fields** are safe to add incrementally. They are optional and their absence is safe (defaults to all environments / no MCP servers). PRS language extensions are not strictly required — users can work around the gap by manually including these keys in the `content` field as raw YAML, though that is not the intended pattern.

4. **`mcp-servers` YAML serialization** requires care: the value is a nested object (`mcp-servers:\n  my-server:\n    url: ...\n    type: ...`) and the existing `yamlString()` helper only handles scalar values. A dedicated YAML object serializer method will be needed.

5. **Organization-level agents** (`.github-private/agents/`) are a GitHub platform feature with no PRS concept. This is out of scope for the formatter and should be documented in ROADMAP if desirable.

6. **No excess output identified**: all generated files and fields correspond to documented GitHub Copilot features. No removal changes are needed.

7. **Golden files** for `simple.md` and `multifile.md` are identical in the current test suite — this is expected because neither mode generates skills or agents, so their main file output is the same. The `full.md` golden also matches the simple/multifile golden for the main file content (skills and agents are in `additionalFiles`, not the primary content). This is correct behavior.

8. **Parity matrix header case drift** (e.g., `## Project` vs `## project` in golden) is a pre-existing documentation inconsistency that does not affect test correctness. It should be addressed in a dedicated cleanup task, not in this implementation.
