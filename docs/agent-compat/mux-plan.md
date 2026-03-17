# Mux Implementation Plan

**Platform:** Mux (by Coder)
**Registry Name:** `mux`
**Formatter File:** `packages/formatters/src/formatters/mux.ts`
**Tier:** 3
**Plan Date:** 2026-03-17

---

## Research Validation

### Output Path

- Research claims: `.mux/rules/project.md`
- Formatter emits: `.mux/rules/project.md` (set via `outputPath` in `createSimpleMarkdownFormatter`)
- Status: Correct.

### Main File Header

- Research claims: `# Project Rules` H1 header, plain Markdown, no YAML frontmatter
- Formatter emits: `# Project Rules` (set via `mainFileHeader`)
- Status: Correct.

### Skill File Emission (`hasSkills`)

- Research claims: Mux has no documented `.mux/skills/` concept; files placed there are not read by Mux
- Code reality: `createSimpleMarkdownFormatter` defaults `hasSkills` to `true` (confirmed in `create-simple-formatter.ts`). The MuxFormatter passes no `hasSkills` override, so it inherits `true`. In `full` mode, `formatFull` will call `extractSkills` and `generateSkillFile`, emitting `.mux/skills/<name>/SKILL.md` files.
- Status: Bug confirmed. Skill files are emitted but unread by Mux. Fix is one line.

### Agent File Emission (`hasAgents`)

- Research claims: Mux supports `.mux/agents/*.md` with YAML frontmatter; formatter does not emit these
- Code reality: `hasAgents` defaults to `false` in the factory. No agent files are emitted. Confirmed.
- Additional finding not in research: The base `generateAgentFile` method in `MarkdownInstructionFormatter` emits `mode: subagent` in YAML frontmatter (a GitHub Copilot / VS Code Insiders convention). Mux does not use `mode: subagent`. To emit correct Mux agent files, the formatter must override `generateAgentFile` to produce Mux-compatible frontmatter (`name`, `description`, `base`). Flipping `hasAgents: true` alone would emit structurally wrong files.

### Command File Emission (`hasCommands`)

- Research claims: No command file concept in Mux
- Code reality: `hasCommands` defaults to `false`. No command files are emitted. Confirmed correct.

### Feature Matrix Accuracy

- The research feature matrix is accurate. Items marked "Supported / Yes" (`markdown-output`, `code-blocks`, `single-file`, `always-apply`, `sections-splitting`) are correctly implemented by the formatter.
- Items marked "Not Supported / No" are not implemented — consistent with the factory defaults and the formatter's minimal definition.

---

## Changes Required

### Change 1 — Set `hasSkills: false` (required, low risk)

**File:** `packages/formatters/src/formatters/mux.ts`

The current formatter:

```ts
export const { Formatter: MuxFormatter, VERSIONS: MUX_VERSIONS } = createSimpleMarkdownFormatter({
  name: 'mux',
  outputPath: '.mux/rules/project.md',
  description: 'Mux rules (Markdown)',
  mainFileHeader: '# Project Rules',
  dotDir: '.mux',
});
```

Must add `hasSkills: false`:

```ts
export const { Formatter: MuxFormatter, VERSIONS: MUX_VERSIONS } = createSimpleMarkdownFormatter({
  name: 'mux',
  outputPath: '.mux/rules/project.md',
  description: 'Mux rules (Markdown)',
  mainFileHeader: '# Project Rules',
  dotDir: '.mux',
  hasSkills: false,
});
```

This prevents `full` mode from emitting `.mux/skills/<name>/SKILL.md` files that Mux will not read.

No test changes are expected beyond updating any snapshot/fixture that currently asserts skill file emission for Mux in `full` mode — those tests should be updated to assert no skill files are emitted.

### Change 2 — Add agent file emission with Mux-specific frontmatter (optional, medium complexity)

**Files:**

- `packages/formatters/src/formatters/mux.ts` — convert from factory-produced class to hand-written subclass
- `packages/formatters/src/formatters/mux.spec.ts` — add agent emission tests

The base `generateAgentFile` in `MarkdownInstructionFormatter` writes:

```yaml
---
description: <description>
mode: subagent
---
```

Mux requires:

```yaml
---
name: <display name>
description: <description>
base: exec
---
```

Because the frontmatter structure differs, the formatter cannot simply set `hasAgents: true` on the factory call. It must be converted to a hand-written subclass that overrides `generateAgentFile`:

```ts
import { MarkdownInstructionFormatter } from '../markdown-instruction-formatter.js';
import type { MarkdownAgentConfig } from '../markdown-instruction-formatter.js';
import type { FormatterOutput } from '../types.js';

export type MuxVersion = 'simple' | 'multifile' | 'full';

class MuxFormatterClass extends MarkdownInstructionFormatter {
  constructor() {
    super({
      name: 'mux',
      outputPath: '.mux/rules/project.md',
      description: 'Mux rules (Markdown)',
      defaultConvention: 'markdown',
      mainFileHeader: '# Project Rules',
      dotDir: '.mux',
      skillFileName: 'SKILL.md',
      hasAgents: true,
      hasCommands: false,
      hasSkills: false,
    });
  }

  static getSupportedVersions() {
    /* ... */
  }

  protected override generateAgentFile(config: MarkdownAgentConfig): FormatterOutput {
    const lines: string[] = [
      '---',
      `name: ${config.name}`,
      `description: ${this.yamlString(config.description)}`,
      'base: exec',
      '---',
      '',
    ];
    if (config.content) {
      lines.push(this.normalizeMarkdownForPrettier(this.dedent(config.content)));
    }
    return {
      path: `${this.config.dotDir}/agents/${config.name}.md`,
      content: lines.join('\n') + '\n',
    };
  }
}

export const MuxFormatter = MuxFormatterClass;
export const MUX_VERSIONS = MuxFormatterClass.getSupportedVersions();
```

This change is gated on the decision to support agent emission for Mux. The PromptScript `agents` block must supply at minimum `description` and `content` for agent files to be emitted (current `extractAgents` requires `description`). No language-level changes are needed for basic agent emission.

### Change 3 — `base` property on `agents` block (optional, language change)

To allow PromptScript authors to control Mux agent inheritance, a `base` property in the `agents` block would map to the `base:` frontmatter field. This requires:

- Parser/core changes to recognize `base` as a valid agent property
- Formatter reads `obj['base']` and emits it in frontmatter (values: `exec`, `plan`, or another agent ID)

This is a language-level change outside the formatter scope and should be tracked as a separate task.

### Change 4 — `model` property on `agents` block (optional, language change)

Maps to Mux's `ai.model` frontmatter. Same scope as Change 3 — language-level, separate task.

---

## Complexity Assessment

| Change                                | Scope                                       | Risk   | Effort  |
| ------------------------------------- | ------------------------------------------- | ------ | ------- |
| 1. Set `hasSkills: false`             | Formatter (1 line)                          | Low    | Minimal |
| 2. Agent file emission with override  | Formatter (refactor to subclass + override) | Medium | Small   |
| 3. `base` property on `agents` block  | Language (parser + resolver + formatter)    | Medium | Medium  |
| 4. `model` property on `agents` block | Language (parser + resolver + formatter)    | Medium | Medium  |

Change 1 is the only immediately actionable and zero-risk change. It fixes a correctness bug where the formatter emits files Mux will not read.

Change 2 is self-contained within the formatters package. It requires converting the factory-produced MuxFormatter to a hand-written subclass, overriding `generateAgentFile`. No changes to other packages.

Changes 3 and 4 are language-level extensions deferred to separate tasks.

---

## Implementation Notes

### Formatter Conversion (Change 2)

When converting from the factory call to a hand-written subclass, the `VERSIONS` constant and `getSupportedVersions()` static method must be preserved. The `buildVersions` helper is private to `create-simple-formatter.ts` and cannot be imported directly — the subclass must replicate the version map inline or a helper must be exported. Check whether `buildVersions` can be exported before implementing.

### Agent Name Validation

The current `extractAgents` in `MarkdownInstructionFormatter` skips agents without a `description`. Mux agent IDs (derived from filename) must be lowercase and use only `[a-z0-9_-]`. The formatter should apply the same `isSafeSkillName` guard (or a similar slug-safe check) to agent names before emitting `.mux/agents/<name>.md`. If `isSafeSkillName` is not already accessible, verify it is defined on `BaseFormatter` or `MarkdownInstructionFormatter` and usable in the override.

### Skill File Emission in `full` Mode

After Change 1, the `full` mode version description generated by `buildVersions` will still mention `${dotDir}/skills/<name>/SKILL.md` in its description string (because `buildVersions` does not inspect `hasSkills`). This is a cosmetic inaccuracy in the `VERSIONS` map. It can be corrected by either updating the description manually in the hand-written subclass (if Change 2 is implemented) or left as-is for a purely factory-based implementation since it only affects metadata strings, not emitted files.

### Test Coverage

After Change 1, add or update tests in `packages/formatters/src/formatters/mux.spec.ts`:

- Assert that `full` mode does NOT emit any files matching `.mux/skills/`
- Assert that `full` mode still emits `.mux/rules/project.md`

After Change 2, add tests:

- Assert that `full` mode emits `.mux/agents/<name>.md` for each agent block entry with a description
- Assert the emitted file contains `name:`, `description:`, and `base: exec` in frontmatter
- Assert the emitted file does NOT contain `mode: subagent`
- Assert that agents without `description` are skipped

### Verification Pipeline

After any change, run the mandatory pipeline:

```bash
pnpm run format
pnpm run lint
pnpm run typecheck
pnpm run test
pnpm prs validate --strict
pnpm schema:check
pnpm skill:check
```
