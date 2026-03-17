# Qoder Implementation Plan

**Registry name:** `qoder`
**Formatter file:** `packages/formatters/src/formatters/qoder.ts`
**Output path:** `.qoder/rules/project.md`
**Tier:** 3

---

## Research Validation

### Output Path

The research specifies `.qoder/rules/project.md` as the output path. The current formatter
confirms this at line 8. This is correct and matches the official Qoder convention.

### File Format

The research describes plain Markdown with no YAML frontmatter, no images, and no external
links inside rule files. The formatter delegates to `createSimpleMarkdownFormatter`, which
produces exactly that. No discrepancy.

### Main File Header

The research states `# Project Rules` as the recommended heading. The formatter sets
`mainFileHeader: '# Project Rules'`. Confirmed correct.

### hasSkills Default — Confirmed Bug

The `createSimpleMarkdownFormatter` factory at
`packages/formatters/src/create-simple-formatter.ts` line 115 defaults `hasSkills` to
`true` when the option is not supplied. The current `qoder.ts` file does not pass
`hasSkills`, so the formatter inherits `hasSkills: true`.

In `formatFull` (lines 223-260 of `markdown-instruction-formatter.ts`), when `hasSkills`
is `true` the formatter iterates `extractSkills(ast)` and calls `generateSkillFile` for
each entry, writing files to `.qoder/skills/<name>/SKILL.md`. Qoder has no such path
convention and will not read those files. The research correctly identifies this as an
incorrect behavior producing excess output.

### hasCommands and hasAgents

Both default to `false` in the factory. The formatter does not override them. These are
confirmed correct — Qoder has no file-based command or agent system.

### Version Descriptions — Confirmed Misleading

`buildVersions` in `create-simple-formatter.ts` (lines 66-83) generates the following
descriptions for a nested output path like `.qoder/rules/project.md`:

- `simple`: `Single .qoder/rules/project.md file`
- `multifile`: `Single .qoder/rules/project.md file (skills via full mode)`
- `full`: `.qoder/rules/project.md + .qoder/skills/<name>/SKILL.md`

The `multifile` description implies that skills will appear in `full` mode. The `full`
description explicitly references `.qoder/skills/`, which Qoder does not use. Once
`hasSkills: false` is set the skill-file generation code path is skipped; however, the
`VERSIONS` descriptions are built independently by `buildVersions`, which does not consult
`hasSkills`. As a result the version description strings will remain inaccurate even after
the fix — they are generated purely from `outputPath` and `dotDir`.

This is a secondary issue but documented here for completeness. Fixing the version
description strings requires either a change to `buildVersions` to accept `hasSkills`, or
the formatter providing custom version descriptions.

### Character Limit

The research documents a 100,000-character silent truncation limit. The formatter produces
no warning. This is a valid gap, but its resolution would require a post-compile hook or
compiler-level validation that does not currently exist in the pipeline. It cannot be fixed
in the formatter alone.

### Feature Gaps Confirmed

All 22 features in the research table have been cross-checked against the source code:

| #    | Finding                                                                 | Validated             |
| ---- | ----------------------------------------------------------------------- | --------------------- |
| 1–12 | Common sections render correctly                                        | Yes                   |
| 13   | Skills emitted in `full` mode due to `hasSkills` defaulting to `true`   | Yes — confirmed bug   |
| 14   | `hasCommands: false` default — correct                                  | Yes                   |
| 15   | `hasAgents: false` default — correct                                    | Yes                   |
| 16   | Per-language rule splitting not implemented                             | Yes                   |
| 17   | Rule-type assignment is IDE-only; cannot encode in file                 | Yes                   |
| 20   | No character limit guard                                                | Yes                   |
| 21   | `# Project Rules` header — correct                                      | Yes                   |
| 22   | Version descriptions reference skill paths even with `hasSkills: false` | Yes — secondary issue |

---

## Changes Required

### Required (correctness fix)

**1. Set `hasSkills: false` in `packages/formatters/src/formatters/qoder.ts`.**

The only change needed to stop incorrect skill file generation:

```ts
export const { Formatter: QoderFormatter, VERSIONS: QODER_VERSIONS } =
  createSimpleMarkdownFormatter({
    name: 'qoder',
    outputPath: '.qoder/rules/project.md',
    description: 'Qoder rules (Markdown)',
    mainFileHeader: '# Project Rules',
    dotDir: '.qoder',
    hasSkills: false,
  });
```

This prevents `formatFull` from calling `generateSkillFile` and writing files under
`.qoder/skills/`, which Qoder does not read.

No other source files need to change for this fix.

### Recommended (quality improvements — not required for correctness)

**2. Add a JSDoc comment to `qoder.ts`** documenting the 100,000-character limit so
developers compiling large `.prs` files are aware of silent truncation risk. This is
purely informational and does not affect runtime behavior.

**3. Correct version description strings.** The `buildVersions` helper in
`create-simple-formatter.ts` generates descriptions that mention skill file paths even for
formatters where `hasSkills: false`. Fixing this properly requires the helper to accept an
`hasSkills` parameter and suppress skill-path references when it is false. This is a
shared infrastructure change affecting all formatters and should be tracked separately.

### Not Required (out of scope for this formatter)

- **Per-language rule splitting** into multiple `.qoder/rules/*.md` files: Would require a
  custom formatter class, not the factory. Tier-3 enhancement only; no correctness impact.
- **Rule-type setup note in output**: An inline comment in the compiled file suggesting
  which IDE rule type to assign (Always Apply, Model Decision, etc.) would reduce user
  friction but is not a correctness issue.
- **AGENTS.md fallback output**: The compiler could optionally emit `AGENTS.md` as a
  secondary target; this is a compiler-level concern outside the formatter scope.
- **Character limit enforcement**: Requires a post-compile validation hook that does not
  currently exist in the pipeline.

---

## Complexity Assessment

**Overall complexity: Low.**

The single required change is one line added to a five-line formatter file. There is no
logic to implement, no new dependencies, and no interface changes.

| Change                                      | Effort                        | Risk                     |
| ------------------------------------------- | ----------------------------- | ------------------------ |
| Add `hasSkills: false` to `qoder.ts`        | Trivial (1 line)              | None                     |
| JSDoc comment for character limit           | Trivial                       | None                     |
| Fix `buildVersions` skill-path descriptions | Low–Medium (shared infra)     | Low — no behavior change |
| Per-language rule splitting                 | High (custom formatter class) | Medium                   |
| Character limit guard                       | Medium (compiler integration) | Low                      |

The required fix has zero risk: the `hasSkills` option is a well-defined toggle already
supported by `MarkdownFormatterConfig` and consumed by the existing `formatFull` branch.
Setting it to `false` simply skips the skill-file generation loop that should never have
run for Qoder.

---

## Implementation Notes

### Execution order

1. Apply the `hasSkills: false` change to `qoder.ts`.
2. Add a JSDoc comment documenting the 100,000-character limit (optional, same file).
3. Run the full verification pipeline (`format`, `lint`, `typecheck`, `test`, `validate`,
   `schema:check`, `skill:check`).
4. Raise a separate issue or task for the `buildVersions` description fix if the misleading
   version strings are considered a user-facing problem.

### Test coverage

No new unit tests are strictly required for the `hasSkills: false` change, because:

- `createSimpleMarkdownFormatter` already has tests covering the `hasSkills` toggle.
- The change is a one-line configuration value, not logic.

However, if a dedicated `qoder.spec.ts` does not exist, consider adding a smoke test that
compiles a `.prs` fixture with skills defined and asserts that no `.qoder/skills/` files
appear in the formatter output. This would prevent regression.

### Registry and schema

`qoder` is already registered as a formatter (visible in `index.ts`). No registry
additions, schema changes, or `VERSIONS` constant renaming are needed.

### Skill sync check

After the change, `pnpm skill:check` must pass. The formatter does not produce skill files,
so there is nothing to sync — the check should pass cleanly. Confirm this during verification.
