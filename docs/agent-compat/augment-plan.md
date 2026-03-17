# Augment — Implementation Plan

## Research Validation

- [x] Output path matches: yes — current: `.augment/rules/project.md`, research confirms this is correct
- [x] Format matches: yes — plain Markdown, no frontmatter by default; consistent with `always_apply` default behaviour
- [x] Frontmatter correct: yes — no frontmatter is emitted; Augment defaults to `always_apply` when frontmatter is absent, so the output is valid
- [x] Feature list verified against code: yes — all 28 features cross-checked against `feature-matrix.ts`; `augment` has zero entries in every `tools` object, confirming the gap
- [ ] Documentation URLs accessible: not checked — URLs recorded in research report; accessibility verification deferred

### Key Findings from Code Review

**Formatter (`packages/formatters/src/formatters/augment.ts`):** 13 lines. Pure delegation to `createSimpleMarkdownFormatter` with correct `outputPath`, `dotDir`, and `mainFileHeader`. `hasSkills` defaults to `true` (factory default), `hasAgents` and `hasCommands` default to `false`. This means skill files would be emitted to `.augment/skills/` in `full` mode — a path Augment does not recognise. This is an active correctness issue, not merely a missing feature.

**Feature matrix (`packages/formatters/src/feature-matrix.ts`):** `augment` is listed in `ToolName` but has no entry in any `tools` object across all 28 `FeatureSpec` records. `getFeatureCoverage('augment')` currently returns `supported: 0, partial: 0, planned: 0, notSupported: 0` — all zeros — because the tool has no entries at all. This makes coverage queries nonsensical and causes the `feature-coverage.spec.ts` coverage-sum assertion to pass vacuously.

**Parity matrix (`packages/formatters/src/parity-matrix.ts`):** `augment` is listed in `FormatterName` but appears in neither `requiredBy` nor `optionalFor` for any section. `getRequiredSections('augment')` returns `[]`. No parity tests enforce augment section presence.

**`createSimpleMarkdownFormatter` defaults:** `hasSkills = true` is the default when `hasSkills` is omitted from `SimpleFormatterOptions`. The current augment formatter call does not pass `hasSkills: false`, so in `full` mode it will generate `.augment/skills/<name>/SKILL.md` files. Augment has no `skills` directory concept, making this output incorrect.

**Version descriptions:** `buildVersions` produces `"Single .augment/rules/project.md file (skills via full mode)"` for `multifile` and `".augment/rules/project.md + .augment/skills/<name>/SKILL.md"` for `full`. Both descriptions are misleading because Augment has no skills concept.

---

## Changes Required

### Formatter Changes

**File:** `packages/formatters/src/formatters/augment.ts`

Three changes are needed:

1. **Add `hasSkills: false`** — prevents incorrect `.augment/skills/` output in `full` mode. This is the only correctness fix; everything else is additive.

2. **Add character-limit warning** — post-format `console.warn` when output exceeds 49,512 characters, matching the pattern in `packages/formatters/src/formatters/antigravity.ts`. The warning should be emitted from within a `formatSimple` / `formatFull` override in a subclass (the formatter must switch from `createSimpleMarkdownFormatter` to a hand-written `MarkdownInstructionFormatter` subclass to do this cleanly, or alternatively the warning can be added in the `format` entry point via a thin wrapper class).

   Preferred approach: replace `createSimpleMarkdownFormatter` delegation with a minimal hand-written class extending `MarkdownInstructionFormatter` directly. This keeps the formatter self-contained and avoids factory limitations.

3. **Correct version descriptions** — override the three version description strings to remove the misleading `skills` reference and instead reflect Augment's actual multi-file capability:
   - `simple`: `"Single .augment/rules/project.md file"`
   - `multifile`: `"Single .augment/rules/project.md file (multiple rule files via full mode)"`
   - `full`: `".augment/rules/project.md (always_apply rule)"`

   These can be provided by implementing a static `getSupportedVersions()` on the hand-written class rather than relying on `buildVersions()`.

### New Features to Implement

Ordered by priority derived from the research gap analysis:

| Priority | Feature                                   | Implementation Notes                                                                                                                                                                                                                                                     |
| -------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| High     | `hasSkills: false` correctness fix        | One-line change; prevents incorrect output today                                                                                                                                                                                                                         |
| Medium   | Character-limit validation (49,512 chars) | Add `console.warn` in `format()`; mirrors `antigravity` pattern                                                                                                                                                                                                          |
| Medium   | Corrected version descriptions            | Requires hand-written class or `VERSIONS` constant override                                                                                                                                                                                                              |
| Low      | YAML frontmatter (`type` + `description`) | Blocked: no PromptScript language construct maps to activation type or rule description; cannot implement without parser/AST extensions                                                                                                                                  |
| Low      | Multi-file rule emission                  | Blocked: requires language support for per-section file splitting or new `.prs` `@rules` block                                                                                                                                                                           |
| Low      | Subagent file emission                    | Blocked: Augment's subagent frontmatter schema (`name`, `color`, `model`, `tools`, `disabled_tools`) differs from base class `generateAgentFile` format (`description`, `mode: subagent`); cannot enable `hasAgents: true` without a custom `generateAgentFile` override |

### Feature Matrix Updates

**File:** `packages/formatters/src/feature-matrix.ts`

Add `augment` entries to every `FeatureSpec.tools` object. The complete set of values, derived from the research report and validated against Augment documentation:

```ts
// output-format
'markdown-output':         'supported'
'mdc-format':              'not-supported'
'code-blocks':             'supported'
'mermaid-diagrams':        'supported'

// file-structure
'single-file':             'supported'
'multi-file-rules':        'supported'   // platform yes; formatter does not yet emit multiple files
'workflows':               'not-supported'
'nested-directories':      'supported'   // platform discovery of AGENTS.md/CLAUDE.md in subdirs

// metadata
'yaml-frontmatter':        'supported'   // platform yes; formatter does not yet emit frontmatter
'frontmatter-description': 'supported'   // platform yes; formatter does not yet emit it
'frontmatter-globs':       'not-supported'
'activation-type':         'supported'   // always_apply / agent_requested / manual; formatter not yet

// targeting
'glob-patterns':           'not-supported'
'always-apply':            'supported'
'manual-activation':       'supported'   // IDE @-mention only; not a formatter output concern
'auto-activation':         'supported'   // agent_requested type; formatter not yet

// content
'character-limit':         'supported'   // 49,512 char combined limit; formatter does not yet validate
'sections-splitting':      'supported'

// advanced
'context-inclusion':       'not-supported'
'at-mentions':             'supported'   // IDE @-mention to attach manual rules
'tool-integration':        'supported'   // subagent tools/disabled_tools; formatter not yet
'path-specific-rules':     'not-supported'
'prompt-files':            'not-supported'
'slash-commands':          'not-supported'
'skills':                  'not-supported'
'agent-instructions':      'supported'   // .augment/agents/ (CLI only); formatter not yet
'local-memory':            'not-supported'
'nested-memory':           'supported'   // runtime subdirectory discovery; not a formatter output
```

Note on status semantics: features the platform supports but the formatter does not yet implement should be recorded as `'supported'` (not `'planned'`) because `'planned'` is defined in `FeatureStatus` as "Tool supports, formatter doesn't implement yet" — meaning there is an active intent to implement in the formatter. Features blocked by missing language constructs (frontmatter, activation-type, multi-file, agent-instructions) should be `'supported'` at the platform level; the formatter gap is tracked in this plan and the gap analysis, not by changing the matrix status.

Where there is clear intent to implement in the formatter in this plan (character-limit), the status can remain `'supported'` once the formatter implements it. Before the formatter implements it, it is still correct to record it as `'supported'` because the matrix tracks _platform_ capability, not formatter completeness. The `planned` status would only be used if a formal implementation task were being tracked in the matrix itself. Align with the convention used for other tier-2 formatters (e.g., `windsurf`, `cline`) where platform capability is `'supported'` regardless of whether the formatter has implemented it yet.

### Parity Matrix Updates

**File:** `packages/formatters/src/parity-matrix.ts`

Add `'augment'` to `requiredBy` and/or `optionalFor` arrays for the sections that `addCommonSections` renders. Since `AugmentFormatter` delegates to `MarkdownInstructionFormatter.addCommonSections`, it produces the same section set as other simple formatters.

Sections to add `augment` to `requiredBy`:

- `project-identity` (from `identity` block — always rendered)
- `restrictions` (from `restrictions` block — always rendered when present)

Sections to add `augment` to `optionalFor`:

- `tech-stack`
- `architecture`
- `code-standards`
- `git-commits`
- `config-files`
- `commands`
- `dev-commands`
- `post-work`
- `documentation`
- `diagrams`

Add `headerVariations` entries for `augment` to each section using the same header strings produced by `MarkdownInstructionFormatter` defaults:

```ts
augment: '## Project'; // project-identity
augment: '## Tech Stack'; // tech-stack
augment: '## Architecture'; // architecture
augment: '## Code Style'; // code-standards (DEFAULT_SECTION_NAMES.codeStandards)
augment: '## Git Commits'; // git-commits
augment: '## Config Files'; // config-files
augment: '## Commands'; // commands
augment: '## Development Commands'; // dev-commands
augment: '## Post-Work Verification'; // post-work
augment: '## Documentation'; // documentation
augment: '## Diagrams'; // diagrams
augment: '## Restrictions'; // restrictions (DEFAULT_SECTION_NAMES.restrictions)
```

### Test Changes

**Files to create or modify:**

1. **`packages/formatters/src/__tests__/feature-coverage.spec.ts`** (modify)
   - The existing `'augment'` tool is absent from all `it.each` arrays in the file (the arrays currently enumerate only the original 7 formatters: github, cursor, claude, antigravity, factory, opencode, gemini).
   - Add `'augment'` to the `it.each` array for `markdown-output`, `code-blocks`, `mermaid-diagrams`, `sections-splitting`, and `always-apply` describe blocks.
   - Add an `augment` entry to the `formatters` Map via `import { AugmentFormatter } from '../formatters/augment.js'` and `formatters.set('augment', new AugmentFormatter())`.
   - Add a new `character-limit` test for `augment` mirroring the existing `antigravity` character-limit test but with the 49,512 threshold.

2. **`packages/formatters/src/__tests__/parity-matrix.spec.ts`** (modify)
   - Add `'augment'` to the formatter list in the parity test `it.each` arrays once parity matrix entries are added.
   - Add `new AugmentFormatter()` to the formatters map.

3. **No new dedicated `augment.spec.ts` file is strictly required** given the formatter's simplicity, but a dedicated test file is consistent with tier-1 formatters that have hand-written tests (e.g., `antigravity.spec.ts`). Create `packages/formatters/src/__tests__/augment.spec.ts` with:
   - Output path assertion: `result.path === '.augment/rules/project.md'`
   - Header assertion: content starts with or contains `'# Project Rules'`
   - No frontmatter emitted by default (no `---` at start)
   - No skills files emitted in `full` mode (no `.augment/skills/` paths in `additionalFiles`)
   - Character-limit warning test: content > 49,512 chars triggers `console.warn`
   - `getSupportedVersions()` returns `simple`, `multifile`, and `full` entries with correct `outputPath`

### Language Extension Requirements

No language extensions are required for the formatter to produce correct, functional output at its current capability level after the `hasSkills: false` fix. The following extensions would be needed to implement the medium/low-priority features in this plan and are out of scope for this formatter implementation:

| Extension                                           | Unlocks                               | Blocks                                                   |
| --------------------------------------------------- | ------------------------------------- | -------------------------------------------------------- |
| Rule activation type property on `.prs` rule blocks | YAML frontmatter `type:` field        | `yaml-frontmatter`, `activation-type`, `auto-activation` |
| Rule description property on `.prs` rule blocks     | YAML frontmatter `description:` field | `frontmatter-description`                                |
| Per-section file output mode                        | Multi-file rules emission             | `multi-file-rules`                                       |
| `@agents` block with Augment-specific schema        | `.augment/agents/<name>.md` emission  | `agent-instructions`, `tool-integration`                 |

---

## Complexity Assessment

**Overall complexity: Low**

The formatter is already functional and correct for the `always_apply` use case. The required work is:

| Task                                  | Complexity | Effort                          |
| ------------------------------------- | ---------- | ------------------------------- |
| `hasSkills: false` fix                | Trivial    | 1 line                          |
| Convert factory to hand-written class | Low        | ~30 lines                       |
| Corrected version descriptions        | Low        | ~15 lines                       |
| Character-limit validation            | Low        | ~10 lines + 1 test              |
| Feature matrix entries (28 features)  | Low        | ~30 lines across 28 objects     |
| Parity matrix section entries         | Low        | ~50 lines                       |
| Test additions                        | Low-Medium | ~80 lines across 2–3 test files |

The only structural decision is whether to keep the `createSimpleMarkdownFormatter` factory pattern or switch to a hand-written `MarkdownInstructionFormatter` subclass. The factory pattern cannot be extended to add character-limit validation without a wrapper; a hand-written class is cleaner for any post-format logic. Given that other formatters that require post-format logic (e.g., `antigravity`) are hand-written, the same pattern should be followed here.

---

## Implementation Notes

### Correctness Fix — `hasSkills: false`

The current formatter call:

```ts
createSimpleMarkdownFormatter({
  name: 'augment',
  outputPath: '.augment/rules/project.md',
  description: 'Augment rules (Markdown)',
  mainFileHeader: '# Project Rules',
  dotDir: '.augment',
});
```

omits `hasSkills`, so the factory defaults to `true`. In `full` mode, any `@skills` blocks in the source `.prs` file will produce `.augment/skills/<name>/SKILL.md` output. Augment does not recognise this path. The fix is to add `hasSkills: false` to the options object.

### Character-Limit Warning Pattern

The `AntigravityFormatter` in `packages/formatters/src/formatters/antigravity.ts` demonstrates the pattern: after building the content string, check `content.length` against the known limit and emit `console.warn`. The same pattern should be used for augment with the 49,512 limit. The warning message should follow the same format as antigravity's for consistency.

### Feature Matrix — Status Value for Unimplemented Platform Features

Several Augment features that the platform supports are not implemented in the formatter (frontmatter, multi-file, agent-instructions). The correct `FeatureStatus` value is still `'supported'` because the matrix tracks platform capability. Only use `'planned'` if there is an active implementation intent tracked in the matrix. The gap is documented in this plan. If a decision is made to track the formatter gap explicitly in the matrix, introduce `'supported'` for platform support and accept that the coverage percentage will be inflated relative to actual formatter completeness — consistent with how all other Tier 2 formatters are currently recorded.

### Parity Matrix — `requiredBy` vs `optionalFor`

The parity matrix `requiredBy` field means the formatter MUST produce this section when the source block is present. For `augment`, since `addCommonSections` always renders `project-identity` and `restrictions` when their blocks exist, these belong in `requiredBy`. All other sections are conditional on the source block containing data and belong in `optionalFor`. This matches how the original 7 formatters are categorised.

### Test File Scope

The new `augment.spec.ts` test file should be self-contained and not import from `feature-matrix.ts` or `parity-matrix.ts` to avoid circular dependency on the matrices being updated in the same PR. Matrix-level tests go in the existing `feature-coverage.spec.ts` and `parity-matrix.spec.ts` files.
