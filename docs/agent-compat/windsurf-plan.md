# Windsurf — Implementation Plan

## Research Validation

- [x] Output path matches: yes — current: `.windsurf/rules/project.md`, should be: `.windsurf/rules/project.md`
- [x] Format matches: yes — current: standard Markdown, should be: standard Markdown
- [ ] Frontmatter correct: no — current: no frontmatter emitted at all, should be: `trigger: always_on` YAML frontmatter block preceding body content
- [x] Feature list verified against code: yes — all 22 research features cross-checked against `createSimpleMarkdownFormatter` and `MarkdownInstructionFormatter` source
- [ ] Documentation URLs accessible: not checked

### Validation Notes

**Output path** — `createSimpleMarkdownFormatter` is called with `outputPath: '.windsurf/rules/project.md'`. Matches research exactly.

**Format** — The factory's `formatSimple` / `formatMultifile` / `formatFull` paths all call `addCommonSections` and emit standard Markdown. Correct for Windsurf.

**Frontmatter** — The factory (`createSimpleMarkdownFormatter`) never emits YAML frontmatter. The main file header `# Project Rules` is written directly as the first line. Windsurf's documented behavior for workspace rule files inside `.windsurf/rules/` requires a `trigger` field in YAML frontmatter; without it, activation is undefined. This is the primary correctness gap.

**Feature matrix gap** — `windsurf` is present as a `ToolName` in `feature-matrix.ts` but has **zero** `tools:` entries across all 28 `FEATURE_MATRIX` specs. Every feature record only covers the original 7 formatters (`github`, `cursor`, `claude`, `antigravity`, `factory`, `opencode`, `gemini`). Windsurf must be added to the relevant feature records.

**Parity matrix gap** — `windsurf` is present as a `FormatterName` in `parity-matrix.ts` but has zero entries in `requiredBy`, `optionalFor`, or `headerVariations` across all 12 `PARITY_MATRIX` specs.

**Skills** — The formatter has `hasSkills: true` (default) and `dotDir: '.windsurf'`, so skills are output to `.windsurf/skills/<name>/SKILL.md`. Research confirms this path matches the Windsurf skills directory. The generated skill frontmatter uses `name:` and `description:` fields — Windsurf's native skill system fields are not fully documented in the research, so this is treated as compatible pending deeper verification (see low-priority item 5).

**Workflows** — The formatter has `hasCommands: false` (default). No workflow files are generated. This is a tracked gap but does not affect correctness of the main rules file.

**Version descriptions** — `buildVersions` produces misleading text for the `multifile` version when `outputPath` is nested (i.e., starts with `dotDir + '/'`): it says `"Single .windsurf/rules/project.md file (skills via full mode)"` — identical to `simple` in effect, because `hasCommands: false` means multifile adds nothing beyond skills (which require `full`). This is cosmetic only; no behaviour difference.

---

## Changes Required

### Formatter Changes

File: `packages/formatters/src/formatters/windsurf.ts`

The `createSimpleMarkdownFormatter` factory does not support emitting frontmatter on the main file — that capability does not exist in `SimpleFormatterOptions` or `MarkdownFormatterConfig`. To emit `trigger: always_on` frontmatter the formatter must be converted from the simple factory to a hand-written subclass of `MarkdownInstructionFormatter`, overriding the `formatSimple`, `formatMultifile`, and `formatFull` methods to prepend a frontmatter block before the main file header.

1. **Convert from `createSimpleMarkdownFormatter` to a hand-written class**

   Replace the current one-call factory with an explicit class extending `MarkdownInstructionFormatter`. The class wires the same five config values (`name`, `outputPath`, `description`, `mainFileHeader`, `dotDir`) through `super()` plus `defaultConvention: 'markdown'`, `skillFileName: 'SKILL.md'`, `hasAgents: false`, `hasCommands: false`, `hasSkills: true`.

   Reason: `SimpleFormatterOptions` / `MarkdownFormatterConfig` / `MarkdownInstructionFormatter` have no `frontmatter` or `preamble` option. Adding one would affect all 31 simple formatters. A targeted subclass override is the correct minimal change, consistent with how `ClaudeFormatter` overrides behaviour that the factory cannot express.

2. **Override `formatSimple`, `formatMultifile`, `formatFull` to prepend `trigger: always_on` frontmatter**

   Each override calls `super.formatSimple` / `super.formatMultifile` / `super.formatFull` (or replicates the small body), then prepends:

   ```
   ---
   trigger: always_on
   ---

   ```

   to `output.content` before returning, keeping all existing section logic unchanged.

   Reason: Without `trigger: always_on`, Windsurf's Cascade may not include the rule file in its system prompt. This is the documented requirement for workspace rule files in `.windsurf/rules/`.

3. **Export `WINDSURF_VERSIONS` constant and `WindsurfVersion` type** to maintain the same public surface as the factory output.

   Current exports from the factory:
   - `WindsurfFormatter` (class)
   - `WINDSURF_VERSIONS` (constant)
   - `WindsurfVersion` (type alias `'simple' | 'multifile' | 'full'`)

   These must all be preserved with identical names.

### New Features to Implement

None required for the high-priority correctness fix. Medium and low priority items below are future work and must not be included in this implementation.

### Feature Matrix Updates

File: `packages/formatters/src/feature-matrix.ts`

Add `windsurf` entries to the following feature records. Status values are derived from the research gap analysis:

| Feature ID                | Status          | Rationale                                                                                            |
| ------------------------- | --------------- | ---------------------------------------------------------------------------------------------------- |
| `markdown-output`         | `supported`     | Primary format; formatter emits standard Markdown                                                    |
| `code-blocks`             | `supported`     | `renderCodeBlock` used in Commands section                                                           |
| `mermaid-diagrams`        | `supported`     | Pass-through from `@context` / `@knowledge` text                                                     |
| `single-file`             | `supported`     | Default output to `.windsurf/rules/project.md`                                                       |
| `multi-file-rules`        | `not-supported` | No multifile rule splitting; `multifile` version is identical to `simple`                            |
| `workflows`               | `not-supported` | `hasCommands: false`; no `.windsurf/workflows/` output                                               |
| `nested-directories`      | `not-supported` | No nested rule directories generated                                                                 |
| `yaml-frontmatter`        | `planned`       | Platform requires it; formatter does not emit it yet — becomes `supported` after this implementation |
| `frontmatter-description` | `not-supported` | `description` field used only with `model_decision` trigger; not implemented                         |
| `frontmatter-globs`       | `not-supported` | `globs` field not emitted; no `@guards`-to-glob mapping                                              |
| `activation-type`         | `planned`       | `trigger: always_on` needed; becomes `supported` after this implementation                           |
| `glob-patterns`           | `not-supported` | No glob-targeted rule files                                                                          |
| `always-apply`            | `planned`       | Becomes `supported` once `trigger: always_on` frontmatter is emitted                                 |
| `manual-activation`       | `not-supported` | `trigger: manual` not implemented                                                                    |
| `auto-activation`         | `not-supported` | `trigger: model_decision` not implemented                                                            |
| `character-limit`         | `not-supported` | No 12,000-character limit warning                                                                    |
| `sections-splitting`      | `supported`     | Standard section splitting via `addCommonSections`                                                   |
| `context-inclusion`       | `not-supported` | Not a Windsurf feature                                                                               |
| `at-mentions`             | `not-supported` | Not a Windsurf feature                                                                               |
| `tool-integration`        | `not-supported` | Not applicable                                                                                       |
| `path-specific-rules`     | `not-supported` | No glob-targeted additional rule files                                                               |
| `prompt-files`            | `not-supported` | Not a Windsurf feature                                                                               |
| `slash-commands`          | `not-supported` | `hasCommands: false`; no `.windsurf/workflows/` output                                               |
| `skills`                  | `supported`     | `.windsurf/skills/<name>/SKILL.md` generated in full mode                                            |
| `agent-instructions`      | `not-supported` | No agent files; Windsurf has no agent file format                                                    |
| `local-memory`            | `not-supported` | No local memory file; Windsurf Memories are AI-generated, not compiled                               |
| `nested-memory`           | `not-supported` | No nested rule files                                                                                 |

### Parity Matrix Updates

File: `packages/formatters/src/parity-matrix.ts`

Add `windsurf` to `requiredBy` or `optionalFor` for each `SectionSpec`, and add a `windsurf` entry to each `headerVariations` map:

| Section ID         | requiredBy / optionalFor | `headerVariations.windsurf`   |
| ------------------ | ------------------------ | ----------------------------- |
| `project-identity` | `optionalFor`            | `'## Project'`                |
| `tech-stack`       | `optionalFor`            | `'## Tech Stack'`             |
| `architecture`     | `optionalFor`            | `'## Architecture'`           |
| `code-standards`   | `optionalFor`            | `'## Code Style'`             |
| `git-commits`      | `optionalFor`            | `'## Git Commits'`            |
| `config-files`     | `optionalFor`            | `'## Config Files'`           |
| `commands`         | `optionalFor`            | `'## Commands'`               |
| `dev-commands`     | `optionalFor`            | `'## Commands'`               |
| `post-work`        | `optionalFor`            | `'## Post-Work Verification'` |
| `documentation`    | `optionalFor`            | `'## Documentation'`          |
| `diagrams`         | `optionalFor`            | `'## Diagrams'`               |
| `restrictions`     | `optionalFor`            | `'## Restrictions'`           |

All sections are `optionalFor` rather than `requiredBy` because the Windsurf formatter uses `createSimpleMarkdownFormatter` / `MarkdownInstructionFormatter` defaults — sections are only rendered when the corresponding AST blocks are present.

### Test Changes

File: `packages/formatters/src/__tests__/` — create a new `windsurf.spec.ts`

The test file should cover:

1. **Frontmatter is emitted** — all three versions (`simple`, `multifile`, `full`) must produce output whose `content` starts with `---\ntrigger: always_on\n---\n`.
2. **Main file header is present after frontmatter** — content contains `# Project Rules` after the frontmatter block.
3. **Output path is correct** — `output.path === '.windsurf/rules/project.md'` for all three versions.
4. **Skills are generated in full mode** — when a `@skills` block is present, `output.additionalFiles` contains a file at `.windsurf/skills/<name>/SKILL.md` with `name:` and `description:` frontmatter.
5. **Skills are NOT generated in simple/multifile mode** — `additionalFiles` is undefined or empty when version is `simple` or `multifile`.
6. **Common sections render correctly** — given an AST with `@identity`, `@context`, `@standards`, `@restrictions`, the output contains the expected `## Project`, `## Tech Stack`, `## Code Style`, `## Restrictions` sections.
7. **`getSupportedVersions()` returns all three versions** — static method returns `simple`, `multifile`, `full` entries with correct `outputPath`.
8. **No commands generated** — even when a `@shortcuts` block with multiline entries is present, no additional workflow files are output.

The test structure should follow the AAA pattern used in `claude.spec.ts` and `opencode.spec.ts`, using inline AST construction (not fixtures) for speed.

### Language Extension Requirements

None required for this implementation. The following are future considerations documented in the research:

- **`trigger` mode per-target** — would require a `@targets` block property; no core language change needed, formatter-level convention
- **`description` field for `model_decision`** — similar to above
- **Glob rule targeting** — reuse of `@guards` block, formatter-level only
- **Workflow generation from `@shortcuts`** — enable `hasCommands` or add `hasWorkflows`; formatter-level only

---

## Complexity Assessment

**Low.** The change is a one-file formatter conversion (12 lines → ~80 lines) plus new test file and matrix updates. No core language changes. No new AST blocks. No new compiler pipeline stages. The only runtime behaviour change is the frontmatter prefix prepended to the main output file content.

Estimated effort: 2–3 hours for implementation + tests + matrix updates + verification pipeline.

Risk: Low. The `MarkdownInstructionFormatter` base class is stable and well-tested. The override pattern is identical to how `ClaudeFormatter` customises behaviour (e.g., `donts` instead of `restrictions`, `CLAUDE.local.md` generation). The frontmatter addition does not affect any existing snapshot tests because no `windsurf` snapshots currently exist.

---

## Implementation Notes

### Conversion Pattern

The converted class should follow this skeleton (matching the pattern in `claude.ts`, `github.ts`):

```ts
import { MarkdownInstructionFormatter } from '../markdown-instruction-formatter.js';
import type { FormatOptions, FormatterOutput } from '../types.js';
import type { Program } from '@promptscript/core';

export type WindsurfVersion = 'simple' | 'multifile' | 'full';

const FRONTMATTER = '---\ntrigger: always_on\n---\n\n';

function prependFrontmatter(output: FormatterOutput): FormatterOutput {
  return { ...output, content: FRONTMATTER + output.content };
}

export const WINDSURF_VERSIONS = { ... } as const;

export class WindsurfFormatter extends MarkdownInstructionFormatter {
  readonly name = 'windsurf';
  readonly outputPath = '.windsurf/rules/project.md';
  readonly description = 'Windsurf rules (Markdown)';
  readonly defaultConvention = 'markdown';

  constructor() {
    super({
      name: 'windsurf',
      outputPath: '.windsurf/rules/project.md',
      description: 'Windsurf rules (Markdown)',
      defaultConvention: 'markdown',
      mainFileHeader: '# Project Rules',
      dotDir: '.windsurf',
      skillFileName: 'SKILL.md',
      hasAgents: false,
      hasCommands: false,
      hasSkills: true,
    });
  }

  static getSupportedVersions() { return WINDSURF_VERSIONS; }

  protected override formatSimple(ast: Program, options?: FormatOptions): FormatterOutput {
    return prependFrontmatter(super.formatSimple(ast, options));
  }

  protected override formatMultifile(ast: Program, options?: FormatOptions): FormatterOutput {
    return prependFrontmatter(super.formatMultifile(ast, options));
  }

  protected override formatFull(ast: Program, options?: FormatOptions): FormatterOutput {
    return prependFrontmatter(super.formatFull(ast, options));
  }
}
```

### Registry Impact

Check `packages/formatters/src/registry.ts` (or equivalent) to confirm `WindsurfFormatter` is exported and registered. The factory currently exports `WindsurfFormatter` under the same name — the class rename from the inner anonymous class to `WindsurfFormatter` must match whatever the registry imports.

### Snapshot Tests

Because no windsurf snapshot currently exists in `snapshot.spec.ts` (it only covers `GitHubFormatter`, `ClaudeFormatter`, `CursorFormatter`), no existing snapshot will break. The new `windsurf.spec.ts` will establish the baseline.

### Verification Order

After implementation:

1. `pnpm run format`
2. `pnpm run lint`
3. `pnpm run typecheck`
4. `pnpm nx test formatters`
5. `pnpm prs validate --strict`
6. `pnpm schema:check`
7. `pnpm skill:check`
