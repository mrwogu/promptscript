# AdaL Implementation Plan

**Platform:** AdaL (SylphAI)
**Registry name:** `adal`
**Formatter file:** `packages/formatters/src/formatters/adal.ts`
**Tier:** 3
**Plan date:** 2026-03-17

---

## Research Validation

### Confirmed correct

The research report accurately describes the current formatter. Code inspection confirms:

- `adal.ts` delegates entirely to `createSimpleMarkdownFormatter` with five parameters: `name: 'adal'`, `outputPath: '.adal/rules/project.md'`, `description: 'AdaL rules (Markdown)'`, `mainFileHeader: '# Project Rules'`, `dotDir: '.adal'`.
- No optional flags (`hasAgents`, `hasCommands`, `hasSkills`) are set, so all fall through to factory defaults: `hasSkills: true`, `hasAgents: false`, `hasCommands: false`.
- `AdalFormatter` and `ADAL_VERSIONS` are exported from `packages/formatters/src/formatters/index.ts` under the Tier 3 comment block (line 70–71), confirming the formatter is registered and surfaced to the compiler.
- The three-version map (`simple`, `multifile`, `full`) is built automatically by `buildVersions()` in `create-simple-formatter.ts`. Because `outputPath` starts with `dotDir + '/'`, the version descriptions are:
  - `simple`: `Single .adal/rules/project.md file`
  - `multifile`: `Single .adal/rules/project.md file (skills via full mode)`
  - `full`: `.adal/rules/project.md + .adal/skills/<name>/SKILL.md`
- Skills in `full` mode write to `.adal/skills/<name>/SKILL.md` via the inherited `generateSkillFile()` method, which emits YAML front matter (`name`, `description`) followed by skill content.

### Discrepancies between research and code

None. The research correctly quoted the formatter source and accurately described every flag. No discrepancy was found between the report and the actual file.

### Output path assessment

The output path `.adal/rules/project.md` is internally consistent with the dot-directory convention used by Junie (`.junie/rules/project.md`) and Windsurf (`.windsurf/rules/project.md`). AdaL's public documentation is not available, so path correctness against the live platform cannot be confirmed. The research report correctly flags this as the primary unresolved risk.

### Feature table validation

All feature flags in the research table match the factory defaults applied by the formatter:

| Feature           | Research says     | Code confirms                                                                |
| ----------------- | ----------------- | ---------------------------------------------------------------------------- |
| Single file out   | Yes (simple mode) | Yes                                                                          |
| Skills (full)     | Yes               | Yes (`hasSkills: true`)                                                      |
| YAML front matter | No (main file)    | No (main file only; skill files do get front matter via `generateSkillFile`) |
| Commands          | No                | No (`hasCommands: false`)                                                    |
| Agents            | No                | No (`hasAgents: false`)                                                      |

One nuance the research understates: skill files in full mode DO include YAML front matter (`name`, `description` fields), produced by `generateSkillFile()`. This is harmless and consistent with every other `createSimpleMarkdownFormatter`-based formatter in the codebase.

---

## Changes Required

### Priority 1 — Path verification (prerequisite to any other change)

**What:** Confirm that AdaL CLI auto-discovers `.adal/rules/project.md`.

**How:** Review the `adal-cli` repository source on GitHub (`github.com/sylphai-inc/adal-cli`) or contact SylphAI directly. Alternative: install `adal-cli` locally and inspect its configuration loading code or default file paths.

**Blocking:** Yes. If the actual path differs (e.g., `.adal/rules.md`, `.adal/project.md`, or a flat `.adalrc.md`), the `outputPath` in `adal.ts` must be updated before this formatter is useful to users.

**Effort:** External research only; no code change until path is confirmed.

### Priority 2 — No source code changes required at this time

The formatter implementation is complete, minimal, and consistent with the factory pattern used by all equivalent Tier 3 formatters. There are no missing features that have confirmed platform support, no mismatches in format or structure, and no excess output that would cause harm.

Specifically:

- **No new language constructs** are required. AdaL consumes plain Markdown; `createSimpleMarkdownFormatter` already produces this.
- **No `hasAgents` or `hasCommands` enablement** is warranted — neither feature has confirmed support in AdaL's public materials.
- **No YAML front matter on the main file** — no evidence that AdaL requires it; adding speculative front matter would add noise without confirmed benefit.
- **No CI/CD-scoped rule files** — AdaL's CI/CD integration is a platform-level runtime feature, not a rules-file concern.

### Conditional future changes (post path confirmation)

| Scenario                                      | Change needed                                                  |
| --------------------------------------------- | -------------------------------------------------------------- |
| Path is confirmed as `.adal/rules/project.md` | No change                                                      |
| Path is a flat file, e.g. `.adal/rules.md`    | Update `outputPath` in `adal.ts`                               |
| Path is a top-level file, e.g. `.adalrc.md`   | Update `outputPath` and `dotDir` in `adal.ts`                  |
| Platform requires YAML front matter           | Add a custom `formatSimple` override or extend factory options |
| Platform documents command support            | Add `hasCommands: true` and confirm command file path          |

---

## Complexity Assessment

**Overall complexity: Low.**

The formatter is already implemented. All identified gaps are either unconfirmed (and therefore not actionable) or out of scope (platform-level features). The only concrete action is external path verification.

| Dimension                   | Rating     | Rationale                                                                                                                        |
| --------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Implementation completeness | Complete   | Factory pattern fully covers the known feature set                                                                               |
| Code changes needed now     | None       | Formatter is correct given available information                                                                                 |
| Risk                        | Low-medium | Output path unverified; formatter may write to a silently ignored location                                                       |
| Test coverage               | Inherited  | `createSimpleMarkdownFormatter` is covered by factory-level tests; no adal-specific tests needed unless path or behavior changes |
| Documentation               | No gap     | `ADAL_VERSIONS` is auto-built; no external docs to update                                                                        |
| Registry                    | Complete   | `AdalFormatter` and `ADAL_VERSIONS` already exported from `index.ts`                                                             |

---

## Implementation Notes

### Factory pattern consistency

`adal.ts` is structurally identical to `junie.ts` and `windsurf.ts` (both confirmed Tier 2/3 formatters). If AdaL's path is eventually confirmed, updating the formatter is a one-line change to `outputPath` in `adal.ts` — no test additions, no infrastructure changes, and no registry updates are needed.

### Skills in full mode

In `full` mode, `MarkdownInstructionFormatter.formatFull()` calls `extractSkills()` and `generateSkillFile()` for each skill. The generated skill file at `.adal/skills/<name>/SKILL.md` contains YAML front matter with `name` and `description`, followed by the skill body. This is the open SKILL.md convention and is harmless even if AdaL does not read the files, since they are written into a subdirectory that AdaL would need to explicitly traverse.

### Skill discovery path

The skill base path is `.adal/skills` (returned by `getSkillBasePath()` via `dotDir`). If AdaL's skill discovery uses a different path convention (e.g., `.adal/knowledge/<name>/` or flat `.adal/<name>.md`), the `dotDir` alone cannot be changed without also changing the skills subdirectory. In that case, a custom `getSkillBasePath()` override would be needed on the formatter class rather than a factory option change.

### No test file exists for adal.ts

This is expected: all `createSimpleMarkdownFormatter` formatters rely on the shared factory-level test suite. A dedicated `adal.spec.ts` is only warranted if a custom override is added (e.g., for path correction or front matter). Until then, coverage is inherited.

### Version map description accuracy

The `multifile` version description reads `Single .adal/rules/project.md file (skills via full mode)` because `skillsInMultifile` defaults to `false`. This is intentional — skills are deferred to `full` mode, matching the behavior of junie, windsurf, and all other `createSimpleMarkdownFormatter` formatters that do not set `skillsInMultifile: true`. The description is accurate.

### Recommended follow-up action

The single highest-value follow-up is to access the `adal-cli` source (`github.com/sylphai-inc/adal-cli`) and inspect the file-loading logic or `README` to confirm the rules file path. Once confirmed, update `outputPath` if needed and add a comment in `adal.ts` citing the source, matching the documentation pattern used in `factory.ts` (`@see https://docs.factory.ai/cli/configuration`).
