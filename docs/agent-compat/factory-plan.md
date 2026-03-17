# Factory AI — Implementation Plan

## Research Validation

- [ ] Output path matches: yes — current: `AGENTS.md`, should be: `AGENTS.md`
- [ ] Format matches: yes — plain Markdown, no YAML frontmatter on main file; formatter emits `# AGENTS.md` header with markdown sections
- [ ] Frontmatter correct: yes — YAML frontmatter is used only in skill, command, and droid files (not AGENTS.md); formatter correctly omits it from the main file and emits it for `.factory/skills/`, `.factory/commands/`, and `.factory/droids/`
- [ ] Feature list verified against code: **partial discrepancy found** — details below
- [ ] Documentation URLs accessible: not checked

### Feature List Discrepancies

The research report tracks 28 features (rows #1–28) but `FEATURE_MATRIX` in `feature-matrix.ts` currently has **28 entries** (ids: `markdown-output` through `nested-memory`). The row numbering in the research report is consistent with the code. No feature IDs are missing or mis-labeled.

One substantive discrepancy was found between the research report and the parity matrix:

| Item                              | Research Report                                                       | Code (`parity-matrix.ts`)           | Verdict                                                                                            |
| --------------------------------- | --------------------------------------------------------------------- | ----------------------------------- | -------------------------------------------------------------------------------------------------- |
| `config-files` header for factory | `## Configuration` (via `sectionNames.configFiles = 'Configuration'`) | `## Configuration Files` (line 234) | **Mismatch** — parity matrix uses `'Configuration Files'` but formatter emits `'## Configuration'` |

The formatter's `sectionNames` config passes `configFiles: 'Configuration'` to `getSectionName('configFiles')`, which produces the heading `## Configuration`. The parity matrix `headerVariations.factory` for `config-files` is `'## Configuration Files'`. These do not agree. One of the two must be corrected during implementation.

The research report table lists the factory section name as `## Configuration` (matching the formatter), which is likely the intended value. The parity matrix is therefore the stale entry.

---

## Changes Required

### Formatter Changes

File: `packages/formatters/src/formatters/factory.ts`

No functional changes are required to the formatter itself. The formatter is complete and correct:

- Output path `AGENTS.md` is correct (line 122)
- Section name overrides are correct: `Conventions & Patterns`, `Git Workflows`, `Configuration`, `Build & Test`, `Don'ts` (lines 132–138)
- `restrictionsTransform` rewrites `Never X` to `Don't X` (line 139)
- Skill file generation emits proper YAML frontmatter with `name`, `description`, `user-invocable`, `disable-model-invocation`, `allowed-tools` (lines 287–306)
- Skill files use hyphenated names (`speckit-plan`) (line 284)
- Droid file generation emits `name`, `description`, `model`, `reasoningEffort`, `specModel`, `specReasoningEffort`, `tools` (lines 362–393)
- Command file generation emits `description`, `agent`, `tools`, `handoffs` (lines 203–226)
- Three version modes (`simple`, `multifile`, `full`) are correctly wired via `MarkdownInstructionFormatter` (lines 18–34)
- `skillsInMultifile: true` causes skills to also be emitted in multifile mode (line 131)

### Parity Matrix Updates

File: `packages/formatters/src/parity-matrix.ts`

1. **Fix `config-files` header variation for factory**
   - Location: line 234, `headerVariations` object for the `config-files` section
   - Current value: `factory: '## Configuration Files'`
   - Correct value: `factory: '## Configuration'`
   - Reason: The formatter emits `## Configuration` (via `sectionNames.configFiles = 'Configuration'`), not `## Configuration Files`. The parity matrix must match actual formatter output or parity tests will false-positive.

### Feature Matrix Updates

File: `packages/formatters/src/feature-matrix.ts`

The research report recommends adding `docsUrl` entries for three features. These are additive-only changes; no existing entries need modification.

2. **Add `docsUrl.factory` to the `slash-commands` feature**
   - Location: lines 486–492, inside the `slash-commands` entry's `docsUrl` object
   - Add: `factory: 'https://docs.factory.ai/cli/configuration'`
   - Reason: The feature entry already has docs for GitHub, Cursor, Claude, Antigravity but omits Factory despite Factory supporting slash commands via `.factory/commands/`.

3. **Add `docsUrl.factory` to the `skills` feature**
   - Location: lines 507–508, inside the `skills` entry's `docsUrl` object (currently no `docsUrl` key exists for this entry)
   - Add: `docsUrl: { factory: 'https://docs.factory.ai/cli/configuration' }`
   - Reason: Same rationale as above; skills are fully supported and implemented.

4. **Add `docsUrl.factory` to the `agent-instructions` feature**
   - Location: lines 524–526, inside the `agent-instructions` entry's `docsUrl` object (currently no `docsUrl` key exists)
   - Add: `docsUrl: { factory: 'https://docs.factory.ai/cli/configuration/custom-droids' }`
   - Reason: Droid files are fully supported and the specific docs URL is known.

### Test Changes

File: `packages/formatters/src/__tests__/golden-files.spec.ts`

5. **Add factory to the `versionedConfigs` array**
   - Location: lines 481–573, inside the `versionedConfigs` array
   - Add three entries mirroring the existing claude/github pattern:

   ```typescript
   {
     name: 'factory',
     formatter: new FactoryFormatter(),
     version: 'simple',
     goldenFile: 'factory/simple.md',
     extension: 'md',
     options: { version: 'simple' },
   },
   {
     name: 'factory',
     formatter: new FactoryFormatter(),
     version: 'multifile',
     goldenFile: 'factory/multifile.md',
     extension: 'md',
     options: { version: 'multifile' },
   },
   {
     name: 'factory',
     formatter: new FactoryFormatter(),
     version: 'full',
     goldenFile: 'factory/full.md',
     extension: 'md',
     options: { version: 'full' },
   },
   ```

   - Add import at the top of the file (alongside existing formatter imports):
     `import { FactoryFormatter } from '../formatters/factory.js';`
   - Reason: Factory has no golden files yet (`packages/formatters/src/__tests__/__golden__/factory/` does not exist). The first test run with `UPDATE_GOLDEN=true` will create them. Without these entries the formatter is not covered by regression testing.

6. **Add factory-specific additional-file assertions**
   - Location: `describe('Additional Files for Multifile/Full Versions')` block, after the antigravity frontmatter test (around line 851)
   - Add tests verifying:
     - `factory multifile` generates `.factory/commands/*.md` files and `.factory/skills/commit/SKILL.md`
     - `factory full` additionally generates `.factory/droids/code-reviewer.md` and `.factory/droids/debugger.md` with correct YAML frontmatter fields (`name`, `description`, `model`, `reasoningEffort` where applicable)
     - Skill files contain `user-invocable:` key (hyphenated, not camelCase) — this validates the recommendation in the research report (item 7)
     - Droid file for `code-reviewer` contains `model: sonnet` (mapped from the agents block)
   - Reason: The canonical AST in `createCanonicalAST()` already includes `agents`, `skills`, and `shortcuts` blocks with full Factory-compatible data, so no AST changes are needed.

File: `packages/formatters/src/__tests__/factory.spec.ts`

The existing spec file already covers the formatter's basic metadata, version structure, section name overrides, droid generation, skill generation, command generation, handoff extraction, and restrictions transform. No new unit tests are strictly required. The following additions are optional but would directly address the research report's open questions:

7. **Add regression test for `user-invocable` key spelling in skill YAML**
   - Verify that `generateSkillFile` emits `user-invocable: false` (hyphenated) and not `userInvocable: false` (camelCase) when `userInvocable` is set to `false`
   - Reason: Research report item 7 flags this as a risk for key name regression.

8. **Add regression test for `specModel` / `specReasoningEffort` emission**
   - Verify that a droid config with `specModel: 'claude-opus-4-1'` and `specReasoningEffort: 'high'` emits those exact keys in the YAML frontmatter
   - Reason: Research report item 1 flags these fields as needing verification against current Factory docs.

### New Features to Implement

None. All features described in the research report are already implemented in the formatter. The formatter supports:

- Simple, multifile, and full output modes
- AGENTS.md with Factory-specific section headings
- `.factory/skills/<name>/SKILL.md` with full YAML frontmatter
- `.factory/commands/<name>.md` with agent routing and handoffs
- `.factory/droids/<name>.md` with model, reasoning effort, spec model fields
- Skill name hyphenation (`speckit.plan` → `speckit-plan`)
- Droid name sanitization (`.` → `-`)
- Restrictions transform (`Never X` → `Don't X`)

### Language Extension Requirements

No PromptScript language changes are needed for the current feature set. The formatter-specific types (`FactoryDroidConfig`, `FactoryCommandConfig`, `FactorySkillConfig`) handle all Factory-specific fields using existing `.prs` block structures.

The research report identifies two potential future extensions that could be added later without breaking existing behavior:

- **Tool category string validation** — a validator rule in `@agents` blocks enforcing that string values for `tools` are one of `read-only`, `edit`, `execute`, `web`, `mcp`
- **Droid name character validation** — a validator rule enforcing `[a-z0-9\-_]` naming for droid entries when targeting the `factory` formatter

Both are deferred; they are not required for a correct Tier 0 implementation.

---

## Complexity Assessment

**Low.** The formatter is already complete and correct. All required changes are:

- 1 one-line fix in `parity-matrix.ts` (header variation string correction)
- 3 additive `docsUrl` entries in `feature-matrix.ts`
- 3 new entries in the `versionedConfigs` array in `golden-files.spec.ts` plus 1 import line
- 1 new `describe` block in `golden-files.spec.ts` with factory-specific file assertions
- 2 optional unit tests in `factory.spec.ts`

No new source files are required. No formatter logic needs to change. The golden files themselves will be created automatically on the first test run with `UPDATE_GOLDEN=true`.

Total estimated effort: **1–2 hours** for a developer familiar with the test patterns.

---

## Implementation Notes

### Execution Order

1. Fix `parity-matrix.ts` first (prevents false-positive parity failures during subsequent test runs)
2. Add `docsUrl` entries to `feature-matrix.ts`
3. Add factory entries to `golden-files.spec.ts`
4. Run `UPDATE_GOLDEN=true pnpm nx test formatters` to generate the three golden files under `packages/formatters/src/__tests__/__golden__/factory/`
5. Run `pnpm nx test formatters` without `UPDATE_GOLDEN` to confirm all tests pass
6. Optionally add the two regression tests to `factory.spec.ts`
7. Run the full verification pipeline: `pnpm run format && pnpm run lint && pnpm run typecheck && pnpm run test`

### Key Paths

| Artifact          | Path                                                                    |
| ----------------- | ----------------------------------------------------------------------- |
| Formatter         | `packages/formatters/src/formatters/factory.ts`                         |
| Parity matrix     | `packages/formatters/src/parity-matrix.ts`                              |
| Feature matrix    | `packages/formatters/src/feature-matrix.ts`                             |
| Existing spec     | `packages/formatters/src/__tests__/factory.spec.ts`                     |
| Golden files spec | `packages/formatters/src/__tests__/golden-files.spec.ts`                |
| Golden files dir  | `packages/formatters/src/__tests__/__golden__/factory/` (to be created) |

### Verification of `specModel` / `specReasoningEffort`

The research report notes (item 1) that `specModel` and `specReasoningEffort` were not confirmed in the fetched Factory docs at the time of research. Before the implementation PR is merged, the author should re-check https://docs.factory.ai/cli/configuration/custom-droids. If the fields are confirmed, no action is needed. If they are not found in the live docs, the emission of these fields in `generateAgentFile` (lines 378–381) should be gated behind a feature flag or removed, and the `FactoryDroidConfig` interface should be updated accordingly.

### Why `skillsInMultifile: true` Is Correct

Most formatters emit skills only in `full` mode. Factory sets `skillsInMultifile: true` (line 131 of `factory.ts`), meaning skills are also written in `multifile` mode. This matches the research report's mode table: multifile is defined as "AGENTS.md + per-skill SKILL.md files". The golden file test for `factory multifile` must therefore assert that `additionalFiles` includes skill files, not just command files.
