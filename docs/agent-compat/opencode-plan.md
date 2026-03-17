# OpenCode — Implementation Plan

## Research Validation

- [x] Output path matches: yes — current: `OPENCODE.md`, should be: `OPENCODE.md`
- [x] Format matches: yes — current: plain Markdown with `# OPENCODE.md` H1, should be: plain Markdown
- [x] Frontmatter correct: yes — skill files emit `name:` + `description:`; command files emit `description:` + optional `argument-hint:`; agent files emit `description:` + `mode: subagent` — all match OpenCode schema requirements
- [x] Feature list verified against code: yes — research table of 25 features cross-checked against `feature-matrix.ts` (22 tracked features); all statuses agree
- [ ] Documentation URLs accessible: not checked — research cites live URLs; no web fetch performed

## Changes Required

### Formatter Changes

File: `packages/formatters/src/formatters/opencode.ts`

No functional changes are required to the formatter file itself. The current 14-line implementation using `createSimpleMarkdownFormatter` is correct and complete for all features PromptScript currently models. The formatter correctly passes `hasAgents: true` and `hasCommands: true`, uses `dotDir: '.opencode'`, `outputPath: 'OPENCODE.md'`, and `mainFileHeader: '# OPENCODE.md'`.

One discrepancy between the formatter and the shared base exists: `generateAgentFile` in `MarkdownInstructionFormatter` (line 436, `markdown-instruction-formatter.ts`) hardcodes `mode: subagent` for all agent files. The research identifies this as gap #1 (agent `mode` field). Addressing it requires a language extension (see below), not a formatter-only change.

### New Features to Implement

None are required to make the formatter functionally correct. The gaps identified in the research are language-level gaps that require both language (parser/AST) and formatter changes across multiple formatters. They are listed here in priority order for future planning:

**Priority 1 — Agent `mode` property (High)**

This is the only hardcoded incorrect frontmatter value. The base class `generateAgentFile` (file: `packages/formatters/src/markdown-instruction-formatter.ts`, line 436) emits `mode: subagent` unconditionally. To fix this:

1. Add `mode?: 'primary' | 'subagent' | 'all'` to `MarkdownAgentConfig` interface (line 37–44 of `markdown-instruction-formatter.ts`).
2. Populate `mode` from `obj['mode']` in `extractAgents` (line 406–428 of `markdown-instruction-formatter.ts`).
3. Emit `mode: ${config.mode ?? 'subagent'}` in `generateAgentFile` (line 430–449) instead of the hardcoded string.
4. The OpenCode formatter inherits this automatically via `createSimpleMarkdownFormatter`; no change to `opencode.ts` itself.
5. Other formatters sharing `generateAgentFile` (Claude, GitHub, Factory) would also benefit; they currently hardcode or ignore `mode`.

**Priority 2 — Agent `model` and `temperature` properties (Medium)**

Add `model?: string` and `temperature?: number` to `MarkdownAgentConfig`. Populate from AST in `extractAgents`. Emit in `generateAgentFile` only when present. This is shared infrastructure; no OpenCode-specific code needed.

**Priority 3 — Command `agent` and `subtask` properties (Medium)**

Add `agent?: string` and `subtask?: boolean` to `MarkdownCommandConfig` (line 9–18 of `markdown-instruction-formatter.ts`). Populate from AST in `extractCommands` (line 282–319). Emit in `generateCommandFile` (line 321–342) after `description:`. No OpenCode-specific code needed.

**Priority 4 — `OPENCODE.local.md` support (Low)**

Would require a formatter override in `opencode.ts` to detect a `local` block and emit `OPENCODE.local.md` as an additional file, parallel to how `ClaudeFormatter` emits `CLAUDE.local.md` in full mode.

**Priority 5 — `opencode.json` generation (Low, out of scope)**

A separate config-file artifact; requires a new output type beyond `FormatterOutput`. Out of scope for formatter work.

### Feature Matrix Updates

File: `packages/formatters/src/feature-matrix.ts`

No changes needed. All 22 tracked features for `opencode` are already correctly classified. The research added two non-tracked features (`local-memory` feature #24 and `nested-memory` feature #25 in the research table) but these map to existing feature matrix entries (`local-memory` at line 528 and `nested-memory` at line 544), both correctly marked `not-supported` for opencode.

### Parity Matrix Updates

File: `packages/formatters/src/parity-matrix.ts`

No changes needed. The `opencode` formatter is already listed in `requiredBy` and `optionalFor` for all relevant sections. The `headerVariations` for `opencode` in the parity matrix are consistent with what the formatter actually emits:

- `restrictions` section uses `'## Restrictions'` (line 342) — matches `sectionNames` default in `create-simple-formatter.ts` which inherits `DEFAULT_SECTION_NAMES.restrictions = 'Restrictions'` from `markdown-instruction-formatter.ts` line 64.
- `code-standards` section uses `'## Code Style'` (line 198) — matches `DEFAULT_SECTION_NAMES.codeStandards = 'Code Style'` (line 60).

### Test Changes

File: `packages/formatters/src/__tests__/golden-files.spec.ts`

The OpenCode formatter is not included in the golden file test suite. Three versioned entries should be added to the `versionedConfigs` array (around line 481) to match the pattern used for GitHub and Claude:

```typescript
// OpenCode versions
{
  name: 'opencode',
  formatter: new OpenCodeFormatter(),
  version: 'simple',
  goldenFile: 'opencode/simple.md',
  extension: 'md',
  options: { version: 'simple' },
},
{
  name: 'opencode',
  formatter: new OpenCodeFormatter(),
  version: 'multifile',
  goldenFile: 'opencode/multifile.md',
  extension: 'md',
  options: { version: 'multifile' },
},
{
  name: 'opencode',
  formatter: new OpenCodeFormatter(),
  version: 'full',
  goldenFile: 'opencode/full.md',
  extension: 'md',
  options: { version: 'full' },
},
```

The import must also be added near the top of the file (around line 10):

```typescript
import { OpenCodeFormatter } from '../formatters/opencode.js';
```

Golden files themselves (`packages/formatters/src/__tests__/__golden__/opencode/simple.md`, `multifile.md`, `full.md`) do not exist yet. Running the test suite with `UPDATE_GOLDEN=true` after adding the configs will auto-generate them.

Additional integration tests to add to `packages/formatters/src/__tests__/golden-files.spec.ts` in the "Additional Files" describe block:

- `opencode full should generate skill files at .opencode/skills/<name>/SKILL.md`
- `opencode full should generate agent files at .opencode/agents/<name>.md with mode: subagent`
- `opencode multifile should generate command files at .opencode/commands/<name>.md`
- `opencode multifile should NOT generate skill files (skills only in full mode)`

These verify the three-tier file structure specific to OpenCode.

### Language Extension Requirements

All gaps requiring language changes are cross-cutting (they affect the shared `MarkdownInstructionFormatter` base class and multiple formatters, not just OpenCode). None of these are OpenCode-specific:

| Gap                           | Scope                                                                                          | Files Affected                                                                      |
| ----------------------------- | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Agent `mode` field            | `MarkdownInstructionFormatter.generateAgentFile`, `extractAgents`, `MarkdownAgentConfig`       | `markdown-instruction-formatter.ts`                                                 |
| Agent `model` / `temperature` | Same as above                                                                                  | `markdown-instruction-formatter.ts`                                                 |
| Command `agent` / `subtask`   | `MarkdownInstructionFormatter.generateCommandFile`, `extractCommands`, `MarkdownCommandConfig` | `markdown-instruction-formatter.ts`                                                 |
| `OPENCODE.local.md`           | New method override in `OpenCodeFormatter`                                                     | `opencode.ts` (requires converting from `createSimpleMarkdownFormatter` to a class) |

## Complexity Assessment

**Overall: Low.** The formatter is already complete and correct.

The only work item in scope for this plan (without language extensions) is adding OpenCode to the golden file test suite. That change touches exactly two files (`golden-files.spec.ts` and creates three new golden files) and carries no risk of regression.

The language-extension work (agent `mode`, `model`, `temperature`; command `agent`, `subtask`) is medium complexity but cross-cutting — it should be planned as a shared infrastructure task that benefits Claude, GitHub, Factory, and OpenCode formatters simultaneously, not as an OpenCode-specific change.

Converting `opencode.ts` from `createSimpleMarkdownFormatter` to a full class (needed for `OPENCODE.local.md`) is low complexity when the time comes — the `GeminiFormatter` and `ClaudeFormatter` serve as implementation templates.

## Implementation Notes

1. The formatter currently delegates to `createSimpleMarkdownFormatter` (14 lines). If `OPENCODE.local.md` support or any other OpenCode-specific override is added, the file must be converted to a class extending `MarkdownInstructionFormatter` directly. The pattern to follow is `packages/formatters/src/formatters/gemini.ts` for the constructor shape and `packages/formatters/src/formatters/claude.ts` for the local-file override pattern.

2. Skills are correctly placed in full mode only (`skillsInMultifile` is not set, defaulting to `false` in `create-simple-formatter.ts` line 115). This matches OpenCode's model: `.opencode/skills/` are on-demand agent tools, not always-active rules.

3. The `argument-hint` frontmatter key emitted by `generateCommandFile` (line 327 of `markdown-instruction-formatter.ts`) is not in OpenCode's documented command frontmatter schema. OpenCode's documented keys are `description`, `agent`, `model`, and `subtask`. The `argument-hint` key is likely OpenCode-ignored but harmless. If confirmed non-functional, it should be removed in a future cleanup — but this requires verification against the live schema at `https://github.com/opencode-ai/opencode/blob/main/opencode-schema.json`.

4. The `## Restrictions` heading (not `## Don'ts`) is already correct for OpenCode. This is controlled via `DEFAULT_SECTION_NAMES` in `markdown-instruction-formatter.ts` (line 59–65) and is the shared default for all formatters that do not override it.

5. The existing `opencode.spec.ts` has comprehensive unit test coverage (26 tests covering all three modes, commands, skills, agents, restrictions, documentation, diagrams, tech stack, and convention support). No gaps in unit test coverage were identified.
