# Pochi — Implementation Plan

## Research Validation

- [x] Output path matches: yes — current: `.pochi/rules/project.md`, should be: `.pochi/rules/project.md`
- [x] Format matches: yes — current: plain Markdown, should be: plain Markdown; no schema or frontmatter required for the main rules file
- [x] Main file header correct: yes — `# Project Rules` is an appropriate, conventional heading; Pochi imposes no heading requirements
- [x] Dot directory correct: yes — `.pochi` is Pochi's primary dot directory for both rules and skills
- [x] Skill file support correct: yes — formatter emits `${dotDir}/skills/<name>/SKILL.md`, which is `.pochi/skills/<name>/SKILL.md`; this matches Pochi's highest-priority native skill discovery path
- [x] `hasSkills` default correct: yes — `createSimpleMarkdownFormatter` defaults `hasSkills` to `true`; the pochi formatter does not override it, so skills are enabled
- [x] `hasAgents` and `hasCommands` correct: yes — both default to `false`; Pochi has no documented agents or slash-command sub-format
- [x] Formatter registered: yes — `FormatterRegistry.register('pochi', PochiFormatter)` at `packages/formatters/src/index.ts` line 197
- [x] Formatter exported: yes — `packages/formatters/src/formatters/index.ts` lines 68–69 export `PochiFormatter`, `POCHI_VERSIONS`, and `PochiVersion`
- [x] Skill path inventory test: yes — `packages/formatters/src/__tests__/skill-path-inventory.spec.ts` line 42 asserts `basePath: '.pochi/skills'` and `fileName: 'SKILL.md'`
- [x] Registry test: yes — `packages/formatters/src/__tests__/registry.spec.ts` line 557 includes `'pochi'` in the registered formatter list
- [x] New-agents test coverage: yes — `packages/formatters/src/__tests__/new-agents.spec.ts` lines 305–312 include a complete fixture entry for the pochi formatter covering `outputPath`, `description`, `mainHeader`, and `dotDir`
- [x] Feature matrix entry: yes — `'pochi'` is present in the `Tier3Formatter` union in `packages/formatters/src/feature-matrix.ts` line 53
- [x] Parity matrix entry: yes — `'pochi'` is present in the `Tier3Formatter` union in `packages/formatters/src/parity-matrix.ts` line 51
- [x] Skill frontmatter correct: yes — `generateSkillFile` in `MarkdownInstructionFormatter` emits `name:` and `description:` YAML frontmatter fields, which match the Pochi skill file schema exactly
- [x] Config file gap: confirmed non-issue — Pochi's `.pochi/config.jsonc` controls LLM provider settings, not rule content; PromptScript has no reason to emit it
- [x] Global rules gap: confirmed non-issue — `~/.pochi/README.pochi.md` is a user-global path outside workspace scope; local-workspace compilation cannot target it

### Discrepancies Found

None. Every aspect of the current formatter implementation is correct and consistent with Pochi's official documentation.

---

## Changes Required

### Formatter Changes

None required. The formatter is correct as-is.

### New Features to Implement

None required for Tier 3 parity. The following are optional future enhancements noted for completeness but are explicitly out of scope for this plan:

1. Enhancement (future, low priority): `AGENTS.md` alias output
   Pochi also recognises `AGENTS.md` at the workspace root as an equivalent to `.pochi/rules/project.md`. The formatter could optionally emit `AGENTS.md` in addition to its primary output path. However, this is a cross-formatter concern (the `agents` formatter already covers `AGENTS.md`) rather than a Pochi-specific gap. No action needed.

2. Enhancement (future, low priority): Global rules path
   PromptScript cannot target `~/.pochi/README.pochi.md` without a user-global output mode that does not exist in the compilation model. No action needed.

### Feature Matrix Updates

None required. No status values are incorrect for `pochi` in `feature-matrix.ts`.

### Parity Matrix Updates

None required. No header variation entries for `pochi` are incorrect in `parity-matrix.ts`.

### Test Changes

None required. The existing test coverage in `new-agents.spec.ts`, `skill-path-inventory.spec.ts`, and `registry.spec.ts` is sufficient for a Tier 3 formatter.

### Language Extension Requirements

None. Pochi is a VS Code extension and reads `.pochi/rules/project.md` as plain Markdown. No special file association, JSON schema registration, or language server configuration is needed.

---

## Complexity Assessment

- Formatter source changes: none
- New version modes: none
- Test changes: none
- Feature/parity matrix corrections: none
- Language extension: none
- Overall: no work required

---

## Implementation Notes

1. The Pochi formatter is a textbook example of a correct Tier 3 `createSimpleMarkdownFormatter` usage. All five required options (`name`, `outputPath`, `description`, `mainFileHeader`, `dotDir`) are set correctly, and no optional overrides (`hasAgents`, `hasCommands`, `hasSkills`, `skillFileName`) need to deviate from their defaults.

2. Skill file YAML frontmatter alignment: Pochi's native skill format requires `name:` and `description:` in the YAML front matter block, with Markdown body content following the closing `---`. The shared `generateSkillFile` method in `MarkdownInstructionFormatter` (lines 377–400 of `markdown-instruction-formatter.ts`) emits exactly this structure. No per-formatter override is needed.

3. The `full` version is the correct production mode for Pochi users who want skill files emitted. The `simple` and `multifile` versions both suppress skill output (skills are only emitted in `full` mode when `skillsInMultifile` is `false`, which is the default). This matches the shared `createSimpleMarkdownFormatter` contract and requires no documentation changes beyond what the `POCHI_VERSIONS` constant already expresses.

4. Cross-agent compatibility via `.agents/skills/`: Pochi also discovers skills from `.agents/skills/<name>/SKILL.md`, which is the cross-agent standard path. PromptScript's `agents` formatter targets this path. Users who want skills available across multiple agents should compile with both `pochi` (for `.pochi/skills/`) and `agents` (for `.agents/skills/`). No change to the pochi formatter is needed to support this workflow.

5. Verification commands after any future formatter changes: `pnpm nx test formatters`, `pnpm run typecheck`, `pnpm prs validate --strict`, and `pnpm schema:check` are sufficient to confirm correctness for a `createSimpleMarkdownFormatter`-based formatter.
