# Kode Formatter Implementation Plan

**Platform:** Kode
**Registry name:** `kode`
**Formatter file:** `packages/formatters/src/formatters/kode.ts`
**Tier:** 3
**Plan date:** 2026-03-17

---

## Research Validation

### What the research got right

The research report accurately describes the current state of the formatter. All five
`createSimpleMarkdownFormatter` parameters match the live source:

| Parameter        | Research claim           | Actual value in source   | Match |
| ---------------- | ------------------------ | ------------------------ | ----- |
| `name`           | `kode`                   | `kode`                   | Yes   |
| `outputPath`     | `.kode/rules/project.md` | `.kode/rules/project.md` | Yes   |
| `description`    | `Kode rules (Markdown)`  | `Kode rules (Markdown)`  | Yes   |
| `mainFileHeader` | `# Project Rules`        | `# Project Rules`        | Yes   |
| `dotDir`         | `.kode`                  | `.kode`                  | Yes   |

The report correctly identifies:

- The formatter is implemented with the tier-3 factory pattern (`createSimpleMarkdownFormatter`).
- `hasSkills` defaults to `true`, `hasAgents` and `hasCommands` default to `false`.
- Skill files in `full` mode would be emitted at `.kode/skills/<name>/SKILL.md`.
- No official documentation exists; all attempted URLs were either parked or unrelated.
- The implementation is a reasonable placeholder, consistent with similar dot-directory tools.

### What the research could not verify

The following remain unverified due to the absence of public Kode documentation:

- Whether `.kode/rules/project.md` is the actual path Kode reads (vs. a different filename,
  a flat dot-file like `.koderules`, or a config key in a project manifest).
- Whether the `# Project Rules` header is expected, ignored, or causes a parse error.
- Whether Kode supports multi-file skill discovery.
- Whether front matter (YAML or TOML) is required or supported.
- Whether `hasAgents` or `hasCommands` should be enabled.

### Registry and test coverage validation

The formatter is already fully integrated into the codebase:

- Exported from `packages/formatters/src/formatters/index.ts` under the `// Tier 3` group
  alongside `CortexFormatter`, `CrushFormatter`, `CommandCodeFormatter`, etc.
- Covered by the shared formatter test suite in
  `packages/formatters/src/__tests__/new-agents.spec.ts`, which asserts:
  - Correct `name`, `outputPath`, `description`
  - `defaultConvention === 'markdown'`
  - Static `getSupportedVersions()` returns `simple`, `multifile`, `full`
  - Minimal program produces output containing `# Project Rules`
  - Identity block produces a `## Project` section
  - Full mode generates skill files at `.kode/skills/test-skill/SKILL.md`
- Counted in the registry total assertion: the test file asserts 37 formatters are registered;
  kode is one of the 30 new ones.

No formatter-specific spec file exists for `kode` (e.g., `kode.spec.ts`), which is consistent
with every other `createSimpleMarkdownFormatter`-based tier-3 formatter — they all rely on the
shared `new-agents.spec.ts` matrix instead of individual spec files.

---

## Changes Required

### No source code changes required

The formatter is complete and correct for its current state. Because official Kode documentation
does not exist, no behavioral changes can be justified with evidence. The `createSimpleMarkdownFormatter`
factory produces output consistent with the broader ecosystem pattern and with every other
unverified tier-3 formatter in the registry.

### Conditional future changes (post-documentation)

The following changes are scoped for later and should only be made once official Kode
documentation is found and verified. Each is listed with the specific code it would affect.

#### 1. Output path correction (if needed)

If the official path differs from `.kode/rules/project.md` (e.g., `.koderules` or
`.kode/instructions.md`), update the single `outputPath` parameter in `kode.ts` and the
corresponding entry in `new-agents.spec.ts`.

#### 2. Main file header correction (if needed)

If Kode expects a different heading or no heading at all, update `mainFileHeader` in `kode.ts`.
If no header is wanted, the `MarkdownInstructionFormatter.formatSimple()` guard
(`if (renderer.getConvention().name === 'markdown')`) ensures the header is only emitted in
markdown convention mode; setting `mainFileHeader` to an empty string would suppress it cleanly.

#### 3. Enable `hasAgents` or `hasCommands` (if Kode supports them)

If Kode has a native agent or command file format:

- Set `hasAgents: true` or `hasCommands: true` in the `createSimpleMarkdownFormatter` call.
- The base `MarkdownInstructionFormatter` will automatically start generating
  `.kode/agents/<name>.md` or `.kode/commands/<name>.md` files in `full` mode.
- Add format-specific overrides to `generateAgentFile` or `generateCommandFile` if Kode's
  schema differs from the generic YAML-frontmatter format the base class emits.

#### 4. Add YAML front matter (if required by Kode)

If Kode requires front matter (e.g., an `activation` or `type` key), the formatter would need
to be promoted from a pure factory call to a subclass of `MarkdownInstructionFormatter` that
overrides `formatSimple()` (and `formatFull()`) to prepend the front matter block. See
`AntigravityFormatter` for the reference pattern.

#### 5. Adjust skill file format (if Kode's schema differs)

The base `generateSkillFile()` in `MarkdownInstructionFormatter` emits:

```
---
name: <skill-name>
description: <description>
---

<content>
```

If Kode uses a different skill front-matter schema or a different filename (not `SKILL.md`),
update `skillFileName` in the factory options and/or override `generateSkillFile()` in a
subclass.

---

## Complexity Assessment

**Current complexity: None.** The formatter is already implemented and tested. No code change
is needed at this time.

**Future complexity if changes are required:**

| Scenario                                   | Complexity | Effort estimate |
| ------------------------------------------ | ---------- | --------------- |
| Output path or header correction           | Trivial    | < 5 minutes     |
| Enable agents or commands (generic format) | Low        | 15–30 minutes   |
| Add YAML front matter                      | Low–Medium | 30–60 minutes   |
| Custom skill front-matter schema           | Low        | 30–45 minutes   |
| Promote to subclass with method overrides  | Medium     | 1–2 hours       |

Promoting to a full subclass (abandoning the factory) is the only scenario that would require
updating `new-agents.spec.ts` to remove the kode entry and adding a dedicated `kode.spec.ts`.
All other scenarios can be accommodated by modifying the factory parameters alone.

---

## Implementation Notes

### How to find official Kode documentation

The research exhausted the obvious search vectors. Suggested next steps, in priority order:

1. Search npm for a kode CLI: `npm search kode agent` or `npm info kode`.
2. Search PyPI: `pip index versions kode` or check `https://pypi.org/search/?q=kode+agent`.
3. Search GitHub: `https://github.com/search?q=.kode%2Frules&type=code` — if any public repo
   contains `.kode/rules/`, the file format can be inferred from its content.
4. Search for the tool under alternative names ("Kode IDE", "Kode assistant", "Kode CLI").
5. Check the VS Code Marketplace for a Kode extension, which would contain its config schema.

### Factory pattern constraints

The `createSimpleMarkdownFormatter` factory does not support per-instance method overrides.
If the formatter needs any behavior beyond what the five core parameters and the three boolean
flags (`hasSkills`, `hasAgents`, `hasCommands`) provide, the file must be rewritten as a
`MarkdownInstructionFormatter` subclass. The factory call in the current `kode.ts` would become
the `super()` call in the subclass constructor.

The transition is mechanical: copy the parameter object from the factory call into `super({...})`
in the constructor, add `static getSupportedVersions()` returning the hand-built VERSIONS constant,
and add the override methods. The public API (`KodeFormatter`, `KODE_VERSIONS`, `KodeVersion`) does
not change and no downstream code needs to be updated.

### Test strategy when changes are made

- If only factory parameters change: the existing `new-agents.spec.ts` matrix assertions are
  sufficient; update the `outputPath`, `description`, `mainHeader`, or `dotDir` value in the
  `NEW_FORMATTERS` array to match the new parameters.
- If a subclass with overrides is introduced: add `packages/formatters/src/__tests__/kode.spec.ts`
  following the pattern of `factory.spec.ts` or `antigravity.spec.ts`. Remove the kode entry
  from `new-agents.spec.ts` and update the registry total assertion from 37 to 37 (no change —
  kode remains registered, just tested differently).
- If front matter is added: test that the `simple` version output starts with `---` and contains
  the expected keys; test that the `full` version still emits skill files correctly.
- In all cases, run the full verification pipeline after changes:
  `pnpm run format && pnpm run lint && pnpm run typecheck && pnpm run test && pnpm prs validate --strict && pnpm schema:check && pnpm skill:check`

### Relationship to other formatters

Kode is structurally identical to the following tier-3 formatters (same factory, same defaults,
only name/path differs): `cortex`, `crush`, `command-code`, `mcpjam`, `mistral-vibe`, `mux`,
`openhands`, `pi`, `qoder`, `qwen-code`, `zencoder`, `neovate`, `pochi`, `adal`, `iflow`,
`codebuddy`. Any pattern established for Kode should be consistent with how these formatters
are evolved if their own documentation is found.
