# Claude Code — Implementation Plan

## Research Validation

- [x] Output path matches: yes — current: `CLAUDE.md`, should be: `CLAUDE.md`
- [x] Format matches: yes — plain Markdown, no frontmatter on main file; YAML frontmatter used only in rules, skills, agents, and commands files. All match research.
- [x] Frontmatter correct: partial — rules files emit a `description` field that is not documented by Anthropic for `.claude/rules/*.md` (only `paths` is documented). Skills and agents frontmatter is otherwise correct.
- [x] Feature list verified against code: yes — all items from the research table were traced to the formatter source. Discrepancies noted below.
- [x] Documentation URLs accessible: not checked

### Validation Notes

**Output path:** `ClaudeFormatter.outputPath = 'CLAUDE.md'` (line 137). Correct.

**`CLAUDE.local.md` behavior confirmed in code:** `generateLocalFile()` (lines 739–757) produces a standalone `CLAUDE.local.md`. No `@CLAUDE.local.md` import line is added to the main `CLAUDE.md`. The research finding is accurate: this file is silently generated but will not be auto-loaded by Claude Code.

**Feature matrix discrepancies found by code inspection:**

| Feature                            | Research says                                                                   | Feature matrix says                                                        | Verdict                                                                                                                                                                                                                                   |
| ---------------------------------- | ------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `context-inclusion` / `@-mentions` | Platform supports `@path` imports; formatter does not generate them             | `not-supported` for claude                                                 | Correct — but note the platform does support it; the `not-supported` status means "formatter doesn't implement it", which is technically conflating tool support with formatter support. The research correctly identifies this as a gap. |
| `tool-integration`                 | Platform supports `allowed-tools` in skill frontmatter; formatter implements it | `not-supported` for claude                                                 | **Incorrect in feature matrix.** The formatter does generate `allowed-tools` in SKILL.md frontmatter (lines 496–501 of `claude.ts`). Feature matrix should be `supported` for claude.                                                     |
| `local-memory`                     | Research flags CLAUDE.local.md as "excess / incorrect"                          | `supported` for claude; testStrategy says "Check for CLAUDE.local.md file" | The feature matrix marks this as supported, but the research shows the platform does not auto-load `CLAUDE.local.md`. The status and test strategy need updating to reflect the broken behavior.                                          |
| `nested-memory`                    | Platform supports `<subdir>/CLAUDE.md`; formatter doesn't generate it           | `supported` for claude                                                     | **Incorrect in feature matrix.** The formatter has no code to generate subdirectory CLAUDE.md files. Should be `planned` (tool supports, formatter doesn't implement yet).                                                                |

**Parity matrix discrepancy found:**

The parity matrix `code-standards` entry has `headerVariations.claude = '## Code Standards'` (line 196 of `parity-matrix.ts`), but the formatter emits `## Code Style` (via `renderer.renderSection('Code Style', ...)` at line 896 of `claude.ts`). This means the parity check for `code-standards` against claude will fail to find the header. The golden files confirm the actual output is `## Code Style`.

**`description` in rules frontmatter confirmed in code:** `generateRuleFile()` (lines 358–383) emits `description:` before `paths:` in every rules file. The research finding is accurate.

**Skill `disable-model-invocation` confirmed absent:** `generateSkillFile()` (lines 481–523) generates `user-invocable` but not `disable-model-invocation`. Confirmed missing.

**Skill `argument-hint` confirmed absent:** `ClaudeSkillConfig` interface (lines 45–62) has no `argumentHint` field. Confirmed missing. Note: `MarkdownInstructionFormatter.extractCommands()` does handle `argumentHint` for commands — the gap is only for skills.

**Skill `model` field confirmed absent from skills (present in agents only):** `ClaudeSkillConfig` has no `model` field. `ClaudeAgentConfig` has `model?: ClaudeAgentModel` (line 106). Confirmed missing for skills.

**Agent `maxTurns`, `mcpServers`, `hooks`, `memory`, `background`, `isolation` confirmed absent:** `ClaudeAgentConfig` (lines 96–113) and `parseAgentConfig()` (lines 627–641) do not handle these fields. Confirmed missing.

---

## Changes Required

### Formatter Changes

File: `packages/formatters/src/formatters/claude.ts`

1. Change: `generateLocalFile()` — add `@CLAUDE.local.md` import line to main CLAUDE.md output so the file is actually loaded by the platform.
   Reason: Claude Code does not auto-load `CLAUDE.local.md`. The file is silently generated with no effect. Adding `@CLAUDE.local.md` to the main file's content makes it functional. This is the minimal-disruption fix that preserves backward compatibility.
   Lines: 739–757 (`generateLocalFile`) and 272–283 (`formatFull`, where `sections` are assembled for main file content). The import line should be appended at the end of the main file content, e.g., `\n@CLAUDE.local.md` appended after `addCommonSections`.

2. Change: `generateRuleFile()` — remove the `description:` field from rules frontmatter, or move it after `paths:`.
   Reason: Official Claude Code docs only document `paths` as a valid frontmatter field for `.claude/rules/*.md`. The `description` field is undocumented for rules and may confuse users expecting strict compliance. At minimum, `paths` should come before `description` to match documented examples.
   Lines: 362–368 (YAML frontmatter block in `generateRuleFile`). Change to emit `paths:` first, then omit `description` entirely (the H1 header already serves as description).

3. Change: `ClaudeSkillConfig` interface — add `disableModelInvocation?: boolean` field.
   Reason: `disable-model-invocation: true` prevents Claude from auto-invoking a skill (keeps it user-only). This is distinct from `userInvocable` which controls menu visibility. Both are needed to fully express skill invocation behavior. Documentation: https://code.claude.com/docs/en/skills
   Lines: 45–62 (`ClaudeSkillConfig` interface).

4. Change: `extractSkills()` — extract `disableModelInvocation` from the `@skills` block properties.
   Reason: Required to populate the new `disableModelInvocation` field on `ClaudeSkillConfig`.
   Lines: 448–475 (`extractSkills`). Add `disableModelInvocation: obj['disableModelInvocation'] === true` to the pushed skill config.

5. Change: `generateSkillFile()` — emit `disable-model-invocation: true` in YAML frontmatter when set.
   Reason: Platform needs this field to suppress automatic skill invocation.
   Lines: 481–523 (`generateSkillFile`). Add after the `user-invocable` block (approximately line 503).

6. Change: `ClaudeSkillConfig` interface — add `argumentHint?: string` field.
   Reason: The `argument-hint` frontmatter field is shown in Claude Code's autocomplete UI when invoking skills with arguments. Improves UX for parameterized skills.
   Lines: 45–62 (`ClaudeSkillConfig` interface).

7. Change: `extractSkills()` — extract `argumentHint` from the `@skills` block properties.
   Lines: 448–475.

8. Change: `generateSkillFile()` — emit `argument-hint:` in YAML frontmatter when set.
   Lines: 481–523. Add after `name:` / `description:` block, before `context:`.

9. Change: `ClaudeSkillConfig` interface — add `model?: string` field (accept full model ID string, not just the `ClaudeAgentModel` union, since skill docs allow full model IDs like `claude-opus-4-5`).
   Reason: Platform supports per-skill model selection. Different skills can use different models (e.g., complex analysis on Opus, quick lookups on Haiku).
   Lines: 45–62.

10. Change: `extractSkills()` — extract `model` from skill properties.
    Lines: 448–475.

11. Change: `generateSkillFile()` — emit `model:` in YAML frontmatter when set.
    Lines: 481–523.

12. Change: `ClaudeAgentConfig` interface — add `maxTurns?: number`, `memory?: 'user' | 'project' | 'local'`, `mcpServers?: string[]`, `hooks?: Record<string, unknown>`, `background?: boolean`, `isolation?: 'worktree'` fields.
    Reason: These are documented agent frontmatter fields that control agent behavior, cost, and lifecycle.
    Lines: 96–113 (`ClaudeAgentConfig` interface).

13. Change: `parseAgentConfig()` — parse the new agent fields from the AST object.
    Lines: 627–641.

14. Change: `generateAgentFile()` — emit the new agent fields in YAML frontmatter when set.
    Lines: 685–730.

### New Features to Implement

1. Feature: `@`-import context inclusion in CLAUDE.md
   Platform docs: Claude Code supports `@path/to/file` syntax in CLAUDE.md to import additional files into context (relative to the CLAUDE.md file). This is the recommended way to reference README, package.json, or supplementary docs.
   Implementation: No new PRS block required for the `CLAUDE.local.md` case (handled in formatter change #1). For user-defined imports, a new `@imports` block or an `imports` property on the `@knowledge` block would be needed. This is a language extension and deferred.
   Complexity: small (for CLAUDE.local.md fix); large (for general @-import support)

2. Feature: Skill `disable-model-invocation` frontmatter field
   Platform docs: `disable-model-invocation: true` in SKILL.md frontmatter prevents Claude from automatically loading the skill.
   Implementation: Add field to `ClaudeSkillConfig`, extraction in `extractSkills()`, and emission in `generateSkillFile()`. See Formatter Changes 3–5 above.
   Complexity: small

3. Feature: Skill `argument-hint` frontmatter field
   Platform docs: `argument-hint: "<hint>"` is displayed in autocomplete when a skill is invoked with `/skill-name`.
   Implementation: Add field to `ClaudeSkillConfig`, extraction, and emission. See Formatter Changes 6–8 above.
   Complexity: small

4. Feature: Skill `model` frontmatter field
   Platform docs: `model: sonnet | opus | haiku | <full-model-id>` selects the model for a specific skill.
   Implementation: Add field to `ClaudeSkillConfig`, extraction, and emission. See Formatter Changes 9–11 above.
   Complexity: small

5. Feature: Agent extended frontmatter fields (`maxTurns`, `memory`, `mcpServers`, `hooks`, `background`, `isolation`)
   Platform docs: Documented in https://code.claude.com/docs/en/sub-agents.
   Implementation: See Formatter Changes 12–14 above.
   Complexity: small

### Feature Matrix Updates

File: `packages/formatters/src/feature-matrix.ts`

- `tool-integration`: `not-supported` -> `supported` for claude (formatter already generates `allowed-tools` in skill frontmatter)
- `local-memory`: `supported` -> `partial` for claude (formatter generates CLAUDE.local.md but it is not auto-loaded without an @-import reference in main file; after the fix in Formatter Change #1, this becomes `supported`)
- `nested-memory`: `supported` -> `planned` for claude (formatter has no code to generate subdirectory CLAUDE.md files; the matrix incorrectly marks this as supported)
- `context-inclusion`: `not-supported` -> `planned` for claude (platform supports @-import syntax; formatter gap is confirmed; should be `planned` once the CLAUDE.local.md fix is in place, to signal the remaining general @-import work)

### Parity Matrix Updates

File: `packages/formatters/src/parity-matrix.ts`

- `code-standards` section: `headerVariations.claude` is `'## Code Standards'` but the formatter actually emits `'## Code Style'`. Change to: `claude: '## Code Style'`
- `config-files` section: `headerVariations.claude` is `'## Configuration Files'` but the formatter emits `'## Config Files'` (via `renderer.renderSection('Config Files', ...)` at line 936). Change to: `claude: '## Config Files'`

### Test Changes

1. Golden file: update `packages/formatters/src/__tests__/__golden__/claude/full.md`
   Expected content changes: Add `@CLAUDE.local.md` import line at the end of the main CLAUDE.md content (after the last section, before EOF). This reflects Formatter Change #1.

2. Golden file: update `packages/formatters/src/__tests__/__golden__/claude/` — add a `full-skills.md` or extend existing snapshot to include a SKILL.md example with `disable-model-invocation`, `argument-hint`, and `model` fields in frontmatter. This validates Formatter Changes 3–11.

3. Golden file: update `packages/formatters/src/__tests__/__golden__/claude/` — add or extend agent snapshot to include `maxTurns`, `memory`, `background`, `isolation` fields in `.claude/agents/<name>.md` frontmatter. This validates Formatter Changes 12–14.

4. Golden file: update `packages/formatters/src/__tests__/__golden__/claude/` — rules file snapshot should show frontmatter with `paths:` only (no `description:` field), validating Formatter Change #2.

5. Parity test: add assertion that `## Code Style` (not `## Code Standards`) is present in claude formatter output to catch the header variation mismatch.

6. Feature test: add test cases in `packages/formatters/src/__tests__/claude.spec.ts` for:
   - Skill with `disableModelInvocation: true` produces `disable-model-invocation: true` in SKILL.md
   - Skill with `argumentHint` produces `argument-hint:` in SKILL.md
   - Skill with `model` produces `model:` in SKILL.md
   - Agent with `maxTurns` produces `maxTurns:` in agent frontmatter
   - Agent with `memory` produces `memory:` in agent frontmatter
   - Full mode with `@local` block produces CLAUDE.local.md AND appends `@CLAUDE.local.md` to CLAUDE.md

### Language Extension Requirements

The following missing skill/agent fields can be added as new properties within existing `@skills` and `@agents` block schemas without requiring new PRS block types:

- `@skills`: add `disableModelInvocation`, `argumentHint`, `model`
- `@agents`: add `maxTurns`, `memory`, `mcpServers`, `hooks`, `background`, `isolation`

For general `@`-import context inclusion (beyond the CLAUDE.local.md fix), a language extension would be needed — either a new `@imports` block type or an `imports` property on `@knowledge`. This is deferred and should be tracked as a separate feature.

---

## Complexity Assessment

- Formatter changes: medium (14 targeted changes, mostly additive field additions; the CLAUDE.local.md fix requires touching both `formatFull` and `generateLocalFile`)
- New features: small (all new fields are additive; no structural changes to existing format)
- Test changes: small (golden file updates + new unit test cases; no new test infrastructure)
- Language extensions: none (for the planned formatter changes; @-import is deferred)
- Overall: small

---

## Implementation Notes

**Priority order:**

1. Fix CLAUDE.local.md loading (High — currently broken behavior; silent file with no effect)
2. Fix feature matrix and parity matrix entries (High — incorrect data affects tests and documentation)
3. Fix rules frontmatter `description` field ordering (Medium — correctness vs documentation)
4. Add skill `disable-model-invocation` (Medium — semantically important, commonly needed)
5. Add skill `argument-hint` and `model` (Low — nice to have)
6. Add agent extended fields (Low — additive, low risk)

**CLAUDE.local.md fix details:** The cleanest implementation is to modify `formatFull()` (lines 265–283 in `claude.ts`): after calling `addCommonSections`, append `\n\n@CLAUDE.local.md` to the main sections array only when a `@local` block exists and `generateLocalFile()` returns a non-null result. Alternatively, `generateLocalFile()` could return a tuple of `(localFile, importLine)`. The simplest approach is to check whether `localFile` is non-null and, if so, push the import line directly into `sections` before the `return` statement.

**Rules frontmatter change:** Removing `description` from rules files is a breaking change to generated output for anyone whose tooling parses the existing format. A safer approach is to keep `description` but document it as a PromptScript convention. The implementation plan favors removal (or reordering so `paths` comes first) for strict compliance, but the team should decide based on backward compatibility tolerance.

**Parity matrix header bug:** The `## Code Style` vs `## Code Standards` discrepancy means existing parity tests for claude are silently skipped (the `matchesSectionHeader` function returns false, causing the section to be counted as "missing" only for required sections — but `code-standards` is `optionalFor` claude, so the bug may be undetected). Still worth fixing for documentation accuracy.

**ClaudeFormatter is not yet using MarkdownInstructionFormatter base class:** The formatter is still a direct `BaseFormatter` subclass with its own private implementation, while other formatters (`opencode`, `gemini`, etc.) use the shared `MarkdownInstructionFormatter` base. This is not a bug but is a divergence worth noting. The formatter changes in this plan should be made to `claude.ts` directly without attempting a migration to `MarkdownInstructionFormatter` — that refactor is out of scope.
