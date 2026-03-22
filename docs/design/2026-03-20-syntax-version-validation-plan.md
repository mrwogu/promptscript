# Syntax Version Validation & Upgrade — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add syntax version validation (PS018, PS019), auto-fix, and `prs upgrade` command to catch version mismatches and typos in `.prs` files.

**Architecture:** Central syntax version registry in `@promptscript/core` maps versions to valid blocks. Two new validator rules (PS018: version compat, PS019: unknown blocks) consume the registry. CLI gets `--fix` on validate and a new `upgrade` command.

**Tech Stack:** TypeScript, Vitest, Commander.js, Chevrotain (parser)

**Spec:** `docs/design/2026-03-20-syntax-version-validation.md`

---

## File Structure

**Core (new files):**

- `packages/core/src/syntax-versions.ts` — version registry + query functions
- `packages/core/src/utils/levenshtein.ts` — Levenshtein distance utility
- `packages/core/src/__tests__/syntax-versions.spec.ts`
- `packages/core/src/__tests__/levenshtein.spec.ts`

**Core (modify):**

- `packages/core/src/utils/index.ts` — add levenshtein export (line 5)

**Validator (new files):**

- `packages/validator/src/rules/syntax-version-compat.ts` — PS018
- `packages/validator/src/rules/unknown-block-name.ts` — PS019
- `packages/validator/src/__tests__/rules/syntax-version-compat.spec.ts`
- `packages/validator/src/__tests__/rules/unknown-block-name.spec.ts`

**Validator (modify):**

- `packages/validator/src/rules/index.ts` — register PS018, PS019 (after line 19, 67, 101)
- `packages/validator/src/presets.ts` — add rule names to all 3 presets

**CLI (new files):**

- `packages/cli/src/commands/upgrade.ts` — upgrade command
- `packages/cli/src/commands/__tests__/upgrade.spec.ts`
- `packages/cli/src/commands/__tests__/validate-fix.spec.ts`

**CLI (modify):**

- `packages/cli/src/types.ts` — add `fix` to `ValidateOptions` (line 56)
- `packages/cli/src/cli.ts` — add `--fix` option (line 97), register `upgrade` command
- `packages/cli/src/commands/validate.ts` — add `--fix` logic

**Docs (modify):**

- `packages/core/README.md`
- `packages/validator/README.md`
- `packages/cli/README.md`

---

## Chunk 1: Core — Levenshtein Utility

### Task 1: Levenshtein distance utility

**Files:**

- Create: `packages/core/src/utils/levenshtein.ts`
- Create: `packages/core/src/__tests__/levenshtein.spec.ts`
- Modify: `packages/core/src/utils/index.ts:5`

- [ ] **Step 1: Write tests**

Create `packages/core/src/__tests__/levenshtein.spec.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { levenshteinDistance, findClosestMatch } from '../utils/levenshtein.js';

describe('levenshteinDistance', () => {
  it('should return 0 for identical strings', () => {
    expect(levenshteinDistance('agents', 'agents')).toBe(0);
  });

  it('should return string length for empty comparison', () => {
    expect(levenshteinDistance('', 'abc')).toBe(3);
    expect(levenshteinDistance('abc', '')).toBe(3);
  });

  it('should calculate single character difference', () => {
    expect(levenshteinDistance('agents', 'agenst')).toBe(2); // transposition = 2 ops
  });

  it('should calculate insertion', () => {
    expect(levenshteinDistance('agent', 'agents')).toBe(1);
  });

  it('should calculate deletion', () => {
    expect(levenshteinDistance('agents', 'agent')).toBe(1);
  });

  it('should calculate substitution', () => {
    expect(levenshteinDistance('agents', 'agentx')).toBe(1);
  });

  it('should handle completely different strings', () => {
    expect(levenshteinDistance('abc', 'xyz')).toBe(3);
  });
});

describe('findClosestMatch', () => {
  const candidates = ['identity', 'context', 'standards', 'restrictions', 'agents', 'skills'];

  it('should find exact match with distance 0', () => {
    expect(findClosestMatch('agents', candidates)).toEqual({ match: 'agents', distance: 0 });
  });

  it('should find close match within threshold', () => {
    const result = findClosestMatch('agenst', candidates, 2);
    expect(result).toEqual({ match: 'agents', distance: 2 });
  });

  it('should return undefined when no match within threshold', () => {
    expect(findClosestMatch('foobar', candidates, 2)).toBeUndefined();
  });

  it('should use default threshold of 2', () => {
    expect(findClosestMatch('agent', candidates)).toEqual({ match: 'agents', distance: 1 });
  });

  it('should return closest when multiple matches', () => {
    expect(findClosestMatch('skill', candidates)).toEqual({ match: 'skills', distance: 1 });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm nx test core -- --testPathPattern=levenshtein`
Expected: FAIL — module not found

- [ ] **Step 3: Implement levenshtein utility**

Create `packages/core/src/utils/levenshtein.ts`:

```typescript
/**
 * Calculate the Levenshtein distance between two strings.
 */
export function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0]![j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const cost = b[i - 1] === a[j - 1] ? 0 : 1;
      matrix[i]![j] = Math.min(
        matrix[i - 1]![j]! + 1, // deletion
        matrix[i]![j - 1]! + 1, // insertion
        matrix[i - 1]![j - 1]! + cost // substitution
      );
    }
  }

  return matrix[b.length]![a.length]!;
}

/**
 * Find the closest match from a list of candidates.
 *
 * @param input - The input string to match
 * @param candidates - List of candidate strings
 * @param maxDistance - Maximum Levenshtein distance (default: 2)
 * @returns The closest match and its distance, or undefined if none within threshold
 */
export function findClosestMatch(
  input: string,
  candidates: readonly string[],
  maxDistance = 2
): { match: string; distance: number } | undefined {
  let best: { match: string; distance: number } | undefined;

  for (const candidate of candidates) {
    const distance = levenshteinDistance(input, candidate);
    if (distance <= maxDistance && (!best || distance < best.distance)) {
      best = { match: candidate, distance };
    }
  }

  return best;
}
```

- [ ] **Step 4: Export from utils index**

Add to `packages/core/src/utils/index.ts` after line 5:

```typescript
export * from './levenshtein.js';
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm nx test core -- --testPathPattern=levenshtein`
Expected: PASS — all tests green

- [ ] **Step 6: Commit**

```bash
git add packages/core/src/utils/levenshtein.ts packages/core/src/__tests__/levenshtein.spec.ts packages/core/src/utils/index.ts
git commit -m "feat(core): add Levenshtein distance utility for fuzzy matching"
```

---

## Chunk 2: Core — Syntax Version Registry

### Task 2: Syntax version registry

**Files:**

- Create: `packages/core/src/syntax-versions.ts`
- Create: `packages/core/src/__tests__/syntax-versions.spec.ts`
- Modify: `packages/core/src/index.ts:27`

- [ ] **Step 1: Write tests**

Create `packages/core/src/__tests__/syntax-versions.spec.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  SYNTAX_VERSIONS,
  getLatestSyntaxVersion,
  isKnownSyntaxVersion,
  getBlocksForVersion,
  getMinimumVersionForBlock,
} from '../syntax-versions.js';
import { BLOCK_TYPES } from '../types/constants.js';

describe('SYNTAX_VERSIONS', () => {
  it('should have 1.0.0 and 1.1.0 entries', () => {
    expect(SYNTAX_VERSIONS['1.0.0']).toBeDefined();
    expect(SYNTAX_VERSIONS['1.1.0']).toBeDefined();
  });

  it('should have cumulative block lists (1.1.0 includes all 1.0.0 blocks)', () => {
    const v100blocks = SYNTAX_VERSIONS['1.0.0']!.blocks;
    const v110blocks = SYNTAX_VERSIONS['1.1.0']!.blocks;
    for (const block of v100blocks) {
      expect(v110blocks).toContain(block);
    }
  });

  it('1.1.0 should add agents, workflows, prompts', () => {
    const v110blocks = SYNTAX_VERSIONS['1.1.0']!.blocks;
    expect(v110blocks).toContain('agents');
    expect(v110blocks).toContain('workflows');
    expect(v110blocks).toContain('prompts');
  });

  it('1.0.0 should NOT contain agents, workflows, prompts', () => {
    const v100blocks = SYNTAX_VERSIONS['1.0.0']!.blocks;
    expect(v100blocks).not.toContain('agents');
    expect(v100blocks).not.toContain('workflows');
    expect(v100blocks).not.toContain('prompts');
  });
});

describe('registry consistency', () => {
  it('latest version should contain ALL block types from BLOCK_TYPES', () => {
    const latest = getLatestSyntaxVersion();
    const latestBlocks = getBlocksForVersion(latest);
    for (const blockType of BLOCK_TYPES) {
      expect(latestBlocks).toContain(blockType);
    }
  });
});

describe('getLatestSyntaxVersion', () => {
  it('should return the highest known version', () => {
    expect(getLatestSyntaxVersion()).toBe('1.1.0');
  });
});

describe('isKnownSyntaxVersion', () => {
  it('should return true for known versions', () => {
    expect(isKnownSyntaxVersion('1.0.0')).toBe(true);
    expect(isKnownSyntaxVersion('1.1.0')).toBe(true);
  });

  it('should return false for unknown versions', () => {
    expect(isKnownSyntaxVersion('1.4.7')).toBe(false);
    expect(isKnownSyntaxVersion('2.0.0')).toBe(false);
    expect(isKnownSyntaxVersion('0.0.1')).toBe(false);
  });
});

describe('getBlocksForVersion', () => {
  it('should return blocks for known version', () => {
    const blocks = getBlocksForVersion('1.0.0');
    expect(blocks).toContain('identity');
    expect(blocks).toContain('skills');
    expect(blocks).not.toContain('agents');
  });

  it('should return undefined for unknown version', () => {
    expect(getBlocksForVersion('9.9.9')).toBeUndefined();
  });
});

describe('getMinimumVersionForBlock', () => {
  it('should return 1.0.0 for base blocks', () => {
    expect(getMinimumVersionForBlock('identity')).toBe('1.0.0');
    expect(getMinimumVersionForBlock('skills')).toBe('1.0.0');
  });

  it('should return 1.1.0 for new blocks', () => {
    expect(getMinimumVersionForBlock('agents')).toBe('1.1.0');
    expect(getMinimumVersionForBlock('workflows')).toBe('1.1.0');
    expect(getMinimumVersionForBlock('prompts')).toBe('1.1.0');
  });

  it('should return undefined for unknown block names', () => {
    expect(getMinimumVersionForBlock('foobar')).toBeUndefined();
    expect(getMinimumVersionForBlock('my-custom-block')).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm nx test core -- --testPathPattern=syntax-versions`
Expected: FAIL — module not found

- [ ] **Step 3: Implement syntax version registry**

Create `packages/core/src/syntax-versions.ts`:

```typescript
import { compareVersions } from './utils/version.js';

/**
 * Definition of a syntax version's capabilities.
 * Block lists are cumulative — each version includes all blocks from prior versions.
 */
export interface SyntaxVersionDef {
  /** All block types valid for this version (cumulative, not delta) */
  readonly blocks: readonly string[];
}

/**
 * Registry of known PromptScript syntax versions and their supported blocks.
 */
export const SYNTAX_VERSIONS: Readonly<Record<string, SyntaxVersionDef>> = {
  '1.0.0': {
    blocks: [
      'identity',
      'context',
      'standards',
      'restrictions',
      'knowledge',
      'shortcuts',
      'commands',
      'guards',
      'params',
      'skills',
      'local',
    ],
  },
  '1.1.0': {
    blocks: [
      'identity',
      'context',
      'standards',
      'restrictions',
      'knowledge',
      'shortcuts',
      'commands',
      'guards',
      'params',
      'skills',
      'local',
      'agents',
      'workflows',
      'prompts',
    ],
  },
};

/** Latest known syntax version. */
export const LATEST_SYNTAX_VERSION = '1.1.0';

/**
 * Get the latest known syntax version.
 */
export function getLatestSyntaxVersion(): string {
  return LATEST_SYNTAX_VERSION;
}

/**
 * Check if a version string is a known syntax version.
 */
export function isKnownSyntaxVersion(version: string): boolean {
  return version in SYNTAX_VERSIONS;
}

/**
 * Get the list of valid blocks for a known syntax version.
 *
 * @returns Block list, or undefined if version is unknown
 */
export function getBlocksForVersion(version: string): readonly string[] | undefined {
  return SYNTAX_VERSIONS[version]?.blocks;
}

/**
 * Get the minimum syntax version that supports a given block type.
 *
 * @returns Version string, or undefined if the block is not in any known version
 */
export function getMinimumVersionForBlock(blockName: string): string | undefined {
  const versions = Object.keys(SYNTAX_VERSIONS).sort((a, b) => compareVersions(a, b));

  for (const version of versions) {
    if (SYNTAX_VERSIONS[version]!.blocks.includes(blockName)) {
      return version;
    }
  }

  return undefined;
}
```

- [ ] **Step 4: Export from core index**

Add to `packages/core/src/index.ts` after line 27:

```typescript
// Syntax version registry
export * from './syntax-versions.js';
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm nx test core -- --testPathPattern=syntax-versions`
Expected: PASS — all tests green

- [ ] **Step 6: Run full core test suite**

Run: `pnpm nx test core`
Expected: PASS — no regressions

- [ ] **Step 7: Commit**

```bash
git add packages/core/src/syntax-versions.ts packages/core/src/__tests__/syntax-versions.spec.ts packages/core/src/index.ts
git commit -m "feat(core): add syntax version registry with block compatibility"
```

---

## Chunk 3: Validator — PS018 syntax-version-compat

### Task 3: PS018 validation rule

**Files:**

- Create: `packages/validator/src/rules/syntax-version-compat.ts`
- Create: `packages/validator/src/__tests__/rules/syntax-version-compat.spec.ts`
- Modify: `packages/validator/src/rules/index.ts:19,67,101`
- Modify: `packages/validator/src/presets.ts`

- [ ] **Step 1: Write tests**

Create `packages/validator/src/__tests__/rules/syntax-version-compat.spec.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { syntaxVersionCompat } from '../../rules/syntax-version-compat.js';
import type { Program, SourceLocation } from '@promptscript/core';

const loc: SourceLocation = { file: 'test.prs', line: 1, column: 1 };

function makeAst(syntaxVersion: string, blockNames: string[] = []): Program {
  return {
    type: 'Program',
    loc,
    meta: {
      type: 'MetaBlock',
      loc,
      fields: { id: 'test', syntax: syntaxVersion },
    },
    blocks: blockNames.map((name) => ({
      type: 'Block' as const,
      name,
      loc,
      content: { type: 'TextContent' as const, value: '', loc },
    })),
    extends: [],
    uses: [],
    inherit: undefined,
  };
}

function validate(ast: Program): { message: string; suggestion?: string }[] {
  const messages: { message: string; suggestion?: string }[] = [];
  syntaxVersionCompat.validate({
    ast,
    report: (msg) => messages.push(msg),
    config: {},
  });
  return messages;
}

describe('PS018: syntax-version-compat', () => {
  it('should have correct metadata', () => {
    expect(syntaxVersionCompat.id).toBe('PS018');
    expect(syntaxVersionCompat.name).toBe('syntax-version-compat');
    expect(syntaxVersionCompat.defaultSeverity).toBe('warning');
  });

  it('should pass for known version with compatible blocks', () => {
    const messages = validate(makeAst('1.0.0', ['identity', 'skills']));
    expect(messages).toHaveLength(0);
  });

  it('should pass for 1.1.0 with agents', () => {
    const messages = validate(makeAst('1.1.0', ['agents']));
    expect(messages).toHaveLength(0);
  });

  it('should warn for unknown syntax version', () => {
    const messages = validate(makeAst('1.4.7'));
    expect(messages).toHaveLength(1);
    expect(messages[0]!.message).toContain('Unknown syntax version "1.4.7"');
    expect(messages[0]!.message).toContain('1.1.0');
  });

  it('should warn when block requires higher version', () => {
    const messages = validate(makeAst('1.0.0', ['identity', 'agents']));
    expect(messages).toHaveLength(1);
    expect(messages[0]!.message).toContain('@agents');
    expect(messages[0]!.message).toContain('1.1.0');
    expect(messages[0]!.message).toContain('1.0.0');
  });

  it('should skip unknown block names (defers to PS019)', () => {
    const messages = validate(makeAst('1.0.0', ['my-custom-block']));
    expect(messages).toHaveLength(0);
  });

  it('should skip when syntax is not a string', () => {
    const ast = makeAst('1.0.0');
    ast.meta!.fields['syntax'] = 123 as unknown as string;
    const messages = validate(ast);
    expect(messages).toHaveLength(0);
  });

  it('should skip when syntax is invalid semver', () => {
    const ast = makeAst('not-a-version');
    const messages = validate(ast);
    expect(messages).toHaveLength(0);
  });

  it('should skip when no meta block', () => {
    const ast = makeAst('1.0.0');
    ast.meta = undefined as unknown as Program['meta'];
    const messages = validate(ast);
    expect(messages).toHaveLength(0);
  });

  it('should check blocks in extends too', () => {
    const ast = makeAst('1.0.0');
    ast.extends = [
      {
        type: 'ExtendBlock',
        targetPath: 'agents',
        loc,
        content: { type: 'TextContent' as const, value: '', loc },
      },
    ];
    const messages = validate(ast);
    expect(messages).toHaveLength(1);
    expect(messages[0]!.message).toContain('@agents');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm nx test validator -- --testPathPattern=syntax-version-compat`
Expected: FAIL — module not found

- [ ] **Step 3: Implement PS018 rule**

Create `packages/validator/src/rules/syntax-version-compat.ts`:

```typescript
import type { ValidationRule } from '../types.js';
import { walkBlocks } from '../walker.js';
import { isValidSemver } from './valid-semver.js';
import {
  isKnownSyntaxVersion,
  getLatestSyntaxVersion,
  getMinimumVersionForBlock,
  compareVersions,
} from '@promptscript/core';

/**
 * Get the block name from a Block or ExtendBlock.
 * Block has `name`, ExtendBlock has `targetPath` (dot-separated, first segment is the block name).
 */
function getBlockName(block: { type: string; name?: string; targetPath?: string }): string {
  if (block.type === 'Block') return (block as { name: string }).name;
  return (block as { targetPath: string }).targetPath.split('.')[0]!;
}

/**
 * PS018: Syntax version compatibility check.
 *
 * Warns when:
 * 1. The declared syntax version is not a known PromptScript version
 * 2. A block requires a higher syntax version than declared
 */
export const syntaxVersionCompat: ValidationRule = {
  id: 'PS018',
  name: 'syntax-version-compat',
  description: 'Check syntax version compatibility with used blocks',
  defaultSeverity: 'warning',
  validate: (ctx) => {
    const meta = ctx.ast.meta;
    if (!meta?.fields?.['syntax']) return;

    const syntax = meta.fields['syntax'];
    if (typeof syntax !== 'string' || !isValidSemver(syntax)) return;

    // Check 1: Is this a known syntax version?
    if (!isKnownSyntaxVersion(syntax)) {
      ctx.report({
        message: `Unknown syntax version "${syntax}". Latest known version is "${getLatestSyntaxVersion()}".`,
        location: meta.loc ?? ctx.ast.loc,
        suggestion: 'Use "prs upgrade" to update to the latest syntax version.',
      });
      return; // Don't check block compat for unknown versions
    }

    // Check 2: Are all blocks compatible with the declared version?
    walkBlocks(ctx.ast, (block) => {
      const blockName = getBlockName(block);
      const minVersion = getMinimumVersionForBlock(blockName);
      if (!minVersion) return; // Unknown block — PS019 handles this

      if (compareVersions(syntax, minVersion) < 0) {
        ctx.report({
          message: `Block @${blockName} requires syntax >= ${minVersion}, but file declares "${syntax}".`,
          location: block.loc,
          suggestion: 'Use "prs validate --fix" to update the syntax version.',
        });
      }
    });
  },
};
```

- [ ] **Step 4: Register PS018 in rules index**

Modify `packages/validator/src/rules/index.ts`:

Add import after line 19:

```typescript
import { syntaxVersionCompat } from './syntax-version-compat.js';
```

Add re-export after line 67:

```typescript
export { syntaxVersionCompat } from './syntax-version-compat.js';
```

Add to `allRules` array after line 101 (before the closing `]`):

```typescript
  // Syntax version compatibility (PS018)
  syntaxVersionCompat,
```

- [ ] **Step 5: Add to presets**

Modify `packages/validator/src/presets.ts`:

In `SECURITY_STRICT.rules` (after `'empty-block': 'warning'` at line 159):

```typescript
    'syntax-version-compat': 'warning',
```

In `SECURITY_MODERATE.rules` (after `'empty-block': 'info'` at line 210):

```typescript
    'syntax-version-compat': 'warning',
```

In `SECURITY_MINIMAL.rules` (after `'empty-block': 'off'` at line 249):

```typescript
    'syntax-version-compat': 'off',
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `pnpm nx test validator -- --testPathPattern=syntax-version-compat`
Expected: PASS

- [ ] **Step 7: Run full validator test suite**

Run: `pnpm nx test validator`
Expected: PASS — no regressions

- [ ] **Step 8: Commit**

```bash
git add packages/validator/src/rules/syntax-version-compat.ts packages/validator/src/__tests__/rules/syntax-version-compat.spec.ts packages/validator/src/rules/index.ts packages/validator/src/presets.ts
git commit -m "feat(validator): add PS018 syntax-version-compat validation rule"
```

---

## Chunk 4: Validator — PS019 unknown-block-name

### Task 4: PS019 validation rule

**Files:**

- Create: `packages/validator/src/rules/unknown-block-name.ts`
- Create: `packages/validator/src/__tests__/rules/unknown-block-name.spec.ts`
- Modify: `packages/validator/src/rules/index.ts`
- Modify: `packages/validator/src/presets.ts`

- [ ] **Step 1: Write tests**

Create `packages/validator/src/__tests__/rules/unknown-block-name.spec.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { unknownBlockName } from '../../rules/unknown-block-name.js';
import type { Program, SourceLocation } from '@promptscript/core';

const loc: SourceLocation = { file: 'test.prs', line: 1, column: 1 };

function makeAst(blockNames: string[]): Program {
  return {
    type: 'Program',
    loc,
    meta: {
      type: 'MetaBlock',
      loc,
      fields: { id: 'test', syntax: '1.1.0' },
    },
    blocks: blockNames.map((name) => ({
      type: 'Block' as const,
      name,
      loc,
      content: { type: 'TextContent' as const, value: '', loc },
    })),
    extends: [],
    uses: [],
    inherit: undefined,
  };
}

function validate(ast: Program): { message: string; suggestion?: string }[] {
  const messages: { message: string; suggestion?: string }[] = [];
  unknownBlockName.validate({
    ast,
    report: (msg) => messages.push(msg),
    config: {},
  });
  return messages;
}

describe('PS019: unknown-block-name', () => {
  it('should have correct metadata', () => {
    expect(unknownBlockName.id).toBe('PS019');
    expect(unknownBlockName.name).toBe('unknown-block-name');
    expect(unknownBlockName.defaultSeverity).toBe('warning');
  });

  it('should pass for all known block types', () => {
    const messages = validate(makeAst(['identity', 'context', 'agents', 'skills']));
    expect(messages).toHaveLength(0);
  });

  it('should warn for typo with fuzzy suggestion', () => {
    const messages = validate(makeAst(['agenst']));
    expect(messages).toHaveLength(1);
    expect(messages[0]!.message).toContain('@agenst');
    expect(messages[0]!.suggestion).toContain('@agents');
  });

  it('should warn for unknown block with full list', () => {
    const messages = validate(makeAst(['foobar']));
    expect(messages).toHaveLength(1);
    expect(messages[0]!.message).toContain('@foobar');
    expect(messages[0]!.suggestion).toContain('identity');
  });

  it('should warn for typo: identiy → identity', () => {
    const messages = validate(makeAst(['identiy']));
    expect(messages).toHaveLength(1);
    expect(messages[0]!.suggestion).toContain('@identity');
  });

  it('should check extends blocks too', () => {
    const ast = makeAst([]);
    ast.extends = [
      {
        type: 'ExtendBlock',
        targetPath: 'agenst',
        loc,
        content: { type: 'TextContent' as const, value: '', loc },
      },
    ];
    const messages = validate(ast);
    expect(messages).toHaveLength(1);
    expect(messages[0]!.suggestion).toContain('@agents');
  });

  it('should report multiple unknown blocks', () => {
    const messages = validate(makeAst(['foobar', 'bazqux']));
    expect(messages).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm nx test validator -- --testPathPattern=unknown-block-name`
Expected: FAIL — module not found

- [ ] **Step 3: Implement PS019 rule**

Create `packages/validator/src/rules/unknown-block-name.ts`:

```typescript
import type { ValidationRule } from '../types.js';
import { walkBlocks } from '../walker.js';
import { isBlockType, BLOCK_TYPES, findClosestMatch } from '@promptscript/core';

/**
 * Get the block name from a Block or ExtendBlock.
 */
function getBlockName(block: { type: string; name?: string; targetPath?: string }): string {
  if (block.type === 'Block') return (block as { name: string }).name;
  return (block as { targetPath: string }).targetPath.split('.')[0]!;
}

/**
 * PS019: Unknown block name detection.
 *
 * Warns when a block name is not a known PromptScript block type.
 * Provides fuzzy match suggestions for typos.
 */
export const unknownBlockName: ValidationRule = {
  id: 'PS019',
  name: 'unknown-block-name',
  description: 'Detect unknown block type names with typo suggestions',
  defaultSeverity: 'warning',
  validate: (ctx) => {
    walkBlocks(ctx.ast, (block) => {
      const blockName = getBlockName(block);
      if (isBlockType(blockName)) return;

      const closest = findClosestMatch(blockName, BLOCK_TYPES, 2);

      if (closest) {
        ctx.report({
          message: `Unknown block type @${blockName}.`,
          location: block.loc,
          suggestion: `Did you mean @${closest.match}?`,
        });
      } else {
        ctx.report({
          message: `Unknown block type @${blockName}.`,
          location: block.loc,
          suggestion: `Known block types: ${BLOCK_TYPES.join(', ')}.`,
        });
      }
    });
  },
};
```

- [ ] **Step 4: Register PS019 in rules index**

Modify `packages/validator/src/rules/index.ts`:

Add import (after the syntaxVersionCompat import):

```typescript
import { unknownBlockName } from './unknown-block-name.js';
```

Add re-export (after the syntaxVersionCompat export):

```typescript
export { unknownBlockName } from './unknown-block-name.js';
```

Add to `allRules` array (after syntaxVersionCompat):

```typescript
  // Unknown block name detection (PS019)
  unknownBlockName,
```

- [ ] **Step 5: Add to presets**

Modify `packages/validator/src/presets.ts`:

In `SECURITY_STRICT.rules` (after `'syntax-version-compat'`):

```typescript
    'unknown-block-name': 'warning',
```

In `SECURITY_MODERATE.rules` (after `'syntax-version-compat'`):

```typescript
    'unknown-block-name': 'warning',
```

In `SECURITY_MINIMAL.rules` (after `'syntax-version-compat'`):

```typescript
    'unknown-block-name': 'off',
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `pnpm nx test validator -- --testPathPattern=unknown-block-name`
Expected: PASS

- [ ] **Step 7: Run full validator test suite**

Run: `pnpm nx test validator`
Expected: PASS — no regressions

- [ ] **Step 8: Commit**

```bash
git add packages/validator/src/rules/unknown-block-name.ts packages/validator/src/__tests__/rules/unknown-block-name.spec.ts packages/validator/src/rules/index.ts packages/validator/src/presets.ts
git commit -m "feat(validator): add PS019 unknown-block-name rule with fuzzy matching"
```

---

## Chunk 5: CLI — validate --fix

### Task 5: Add --fix flag to validate command

**Files:**

- Modify: `packages/cli/src/types.ts:54-59`
- Modify: `packages/cli/src/cli.ts:94-99`
- Modify: `packages/cli/src/commands/validate.ts`
- Create: `packages/cli/src/commands/__tests__/validate-fix.spec.ts`

- [ ] **Step 1: Write tests**

Create `packages/cli/src/commands/__tests__/validate-fix.spec.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { vol } from 'memfs';

// Mock fs for file writes
vi.mock('node:fs', async () => {
  const memfs = await import('memfs');
  return memfs.fs;
});
vi.mock('node:fs/promises', async () => {
  const memfs = await import('memfs');
  return memfs.fs.promises;
});

describe('validate --fix', () => {
  beforeEach(() => {
    vol.reset();
  });

  it('should reject --fix with --format json', async () => {
    // Test that the combination is rejected
    // Implementation will call validateCommand({ fix: true, format: 'json' })
    // and expect it to throw or exit with error
    const { validateCommand } = await import('../validate.js');
    await expect(validateCommand({ fix: true, format: 'json' })).rejects.toThrow(
      '--fix is incompatible with --format json'
    );
  });

  it('should update syntax version when blocks require higher version', async () => {
    const prsContent = `@meta {
  id: "test"
  syntax: "1.0.0"
}

@agents {
  helper: { description: "test" content: "test" }
}
`;
    vol.fromJSON({
      '/.promptscript/project.prs': prsContent,
    });

    // The fix logic should update syntax: "1.0.0" → "1.1.0"
    // Test the fixSyntaxVersion helper directly
    const { fixSyntaxVersion } = await import('../validate.js');
    const result = fixSyntaxVersion(prsContent, '1.0.0', '1.1.0');
    expect(result).toContain('syntax: "1.1.0"');
    expect(result).not.toContain('syntax: "1.0.0"');
  });

  it('should not downgrade syntax version', async () => {
    const prsContent = `@meta {
  id: "test"
  syntax: "1.1.0"
}

@identity {
  "Just a basic file"
}
`;
    const { fixSyntaxVersion } = await import('../validate.js');
    // minimumRequired is 1.0.0 but declared is 1.1.0 — no change
    const result = fixSyntaxVersion(prsContent, '1.1.0', '1.0.0');
    expect(result).toBeNull(); // null = no change needed
  });

  it('should only replace syntax within @meta block', async () => {
    const prsContent = `@meta {
  id: "test"
  syntax: "1.0.0"
}

@context {
  "The syntax: \\"1.0.0\\" is the old format"
}
`;
    const { fixSyntaxVersion } = await import('../validate.js');
    const result = fixSyntaxVersion(prsContent, '1.0.0', '1.1.0');
    expect(result).toContain('syntax: "1.1.0"');
    // The string in @context should NOT be changed
    expect(result).toContain('The syntax: \\"1.0.0\\" is the old format');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm nx test cli -- --testPathPattern=validate-fix`
Expected: FAIL — `fixSyntaxVersion` not found

- [ ] **Step 3: Add `fix` to ValidateOptions**

Modify `packages/cli/src/types.ts` — add to `ValidateOptions` interface:

```typescript
export interface ValidateOptions {
  /** Treat warnings as errors */
  strict?: boolean;
  /** Output format (text, json) */
  format?: 'text' | 'json';
  /** Auto-fix syntax version issues */
  fix?: boolean;
}
```

- [ ] **Step 4: Add --fix option to CLI**

Modify `packages/cli/src/cli.ts` — add `.option('--fix', ...)` to validate command registration (after `--format` option):

```typescript
  .option('--fix', 'Auto-fix syntax version issues')
```

- [ ] **Step 5: Implement fix logic in validate command**

Modify `packages/cli/src/commands/validate.ts` — add:

1. Import at top:

```typescript
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { getMinimumVersionForBlock, compareVersions } from '@promptscript/core';
import { parse } from '@promptscript/parser';
```

2. Export `fixSyntaxVersion` helper function:

```typescript
/**
 * Replace syntax version within the @meta block only.
 * Returns the modified content, or null if no change needed.
 */
export function fixSyntaxVersion(
  content: string,
  currentVersion: string,
  targetVersion: string
): string | null {
  if (compareVersions(targetVersion, currentVersion) <= 0) return null;

  // Find @meta block boundaries
  const metaStart = content.indexOf('@meta');
  if (metaStart === -1) return null;

  const braceStart = content.indexOf('{', metaStart);
  if (braceStart === -1) return null;

  // Find matching closing brace
  let depth = 1;
  let braceEnd = braceStart + 1;
  while (braceEnd < content.length && depth > 0) {
    if (content[braceEnd] === '{') depth++;
    else if (content[braceEnd] === '}') depth--;
    braceEnd++;
  }

  // Replace syntax within meta block span only
  const before = content.slice(0, braceStart);
  const metaBody = content.slice(braceStart, braceEnd);
  const after = content.slice(braceEnd);

  const updatedMeta = metaBody.replace(/syntax:\s*"[^"]*"/, `syntax: "${targetVersion}"`);

  if (updatedMeta === metaBody) return null;

  return before + updatedMeta + after;
}
```

3. Add fix handling at the start of `validateCommand`:

```typescript
if (options.fix && options.format === 'json') {
  throw new Error('--fix is incompatible with --format json');
}

if (options.fix) {
  await runFix();
  return;
}
```

4. Add helper to discover `.prs` files (no external dependency):

```typescript
export function discoverPrsFiles(dir: string): string[] {
  const results: string[] = [];
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...discoverPrsFiles(fullPath));
      } else if (entry.name.endsWith('.prs')) {
        results.push(fullPath);
      }
    }
  } catch {
    // Directory doesn't exist — return empty
  }
  return results;
}
```

5. Add `runFix` function:

```typescript
async function runFix(): Promise<void> {
  const files = discoverPrsFiles('.promptscript');
  let fixedCount = 0;

  for (const filePath of files) {
    const content = readFileSync(filePath, 'utf-8');
    const result = parse(content);
    if (!result.ast?.meta?.fields?.['syntax']) continue;

    const declaredVersion = result.ast.meta.fields['syntax'];
    if (typeof declaredVersion !== 'string') continue;

    // Find minimum required version based on blocks used
    let minRequired = '1.0.0';
    for (const block of result.ast.blocks) {
      const blockMin = getMinimumVersionForBlock(block.name);
      if (blockMin && compareVersions(blockMin, minRequired) > 0) {
        minRequired = blockMin;
      }
    }
    for (const ext of result.ast.extends) {
      const blockName = ext.targetPath.split('.')[0]!;
      const blockMin = getMinimumVersionForBlock(blockName);
      if (blockMin && compareVersions(blockMin, minRequired) > 0) {
        minRequired = blockMin;
      }
    }

    // Only upgrade, never downgrade
    const fixed = fixSyntaxVersion(content, declaredVersion, minRequired);
    if (fixed) {
      writeFileSync(filePath, fixed, 'utf-8');
      console.log(`Fixed: ${filePath} syntax "${declaredVersion}" → "${minRequired}"`);
      fixedCount++;
    }
  }

  if (fixedCount === 0) {
    console.log('No syntax version fixes needed.');
  } else {
    console.log(`\n${fixedCount} file(s) fixed.`);
  }
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `pnpm nx test cli -- --testPathPattern=validate-fix`
Expected: PASS

- [ ] **Step 7: Run full CLI test suite**

Run: `pnpm nx test cli`
Expected: PASS — no regressions

- [ ] **Step 8: Commit**

```bash
git add packages/cli/src/types.ts packages/cli/src/cli.ts packages/cli/src/commands/validate.ts packages/cli/src/commands/__tests__/validate-fix.spec.ts
git commit -m "feat(cli): add --fix flag to validate command for syntax version auto-fix"
```

---

## Chunk 6: CLI — prs upgrade command

### Task 6: Upgrade command

**Files:**

- Create: `packages/cli/src/commands/upgrade.ts`
- Create: `packages/cli/src/commands/__tests__/upgrade.spec.ts`
- Modify: `packages/cli/src/cli.ts`

- [ ] **Step 1: Write tests**

Create `packages/cli/src/commands/__tests__/upgrade.spec.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { vol } from 'memfs';

vi.mock('node:fs', async () => {
  const memfs = await import('memfs');
  return memfs.fs;
});
vi.mock('node:fs/promises', async () => {
  const memfs = await import('memfs');
  return memfs.fs.promises;
});

describe('prs upgrade', () => {
  beforeEach(() => {
    vol.reset();
  });

  it('should upgrade syntax to latest version', async () => {
    vol.fromJSON({
      '/.promptscript/project.prs': `@meta {
  id: "test"
  syntax: "1.0.0"
}

@identity { "test" }
`,
    });

    const { upgradeCommand } = await import('../upgrade.js');
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await upgradeCommand({ dryRun: false });

    const content = vol.readFileSync('/.promptscript/project.prs', 'utf-8') as string;
    expect(content).toContain('syntax: "1.1.0"');
    consoleSpy.mockRestore();
  });

  it('should skip files already at latest', async () => {
    vol.fromJSON({
      '/.promptscript/project.prs': `@meta {
  id: "test"
  syntax: "1.1.0"
}
`,
    });

    const { upgradeCommand } = await import('../upgrade.js');
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await upgradeCommand({ dryRun: false });

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('already'));
    consoleSpy.mockRestore();
  });

  it('should not write files in dry-run mode', async () => {
    const original = `@meta {
  id: "test"
  syntax: "1.0.0"
}
`;
    vol.fromJSON({ '/.promptscript/project.prs': original });

    const { upgradeCommand } = await import('../upgrade.js');
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await upgradeCommand({ dryRun: true });

    const content = vol.readFileSync('/.promptscript/project.prs', 'utf-8') as string;
    expect(content).toContain('syntax: "1.0.0"'); // unchanged
    consoleSpy.mockRestore();
  });

  it('should skip files without @meta', async () => {
    vol.fromJSON({
      '/.promptscript/context.prs': `@context { "just context" }`,
    });

    const { upgradeCommand } = await import('../upgrade.js');
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await upgradeCommand({ dryRun: false });

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('0'));
    consoleSpy.mockRestore();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm nx test cli -- --testPathPattern=upgrade`
Expected: FAIL — module not found

- [ ] **Step 3: Implement upgrade command**

Create `packages/cli/src/commands/upgrade.ts`:

```typescript
import { readFileSync, writeFileSync } from 'node:fs';
import { getLatestSyntaxVersion } from '@promptscript/core';
import { parse } from '@promptscript/parser';
import { fixSyntaxVersion, discoverPrsFiles } from './validate.js';

export interface UpgradeOptions {
  dryRun?: boolean;
}

/**
 * Upgrade all .prs files to the latest syntax version.
 */
export async function upgradeCommand(options: UpgradeOptions): Promise<void> {
  const latest = getLatestSyntaxVersion();
  const files = discoverPrsFiles('.promptscript');

  let upgradedCount = 0;
  let skippedCount = 0;

  for (const filePath of files) {
    const content = readFileSync(filePath, 'utf-8');
    const result = parse(content);

    if (!result.ast?.meta?.fields?.['syntax']) {
      skippedCount++;
      continue;
    }

    const declaredVersion = result.ast.meta.fields['syntax'];
    if (typeof declaredVersion !== 'string') {
      skippedCount++;
      continue;
    }

    const fixed = fixSyntaxVersion(content, declaredVersion, latest);
    if (!fixed) {
      console.log(`Skipped:  ${filePath} (already at ${declaredVersion})`);
      skippedCount++;
      continue;
    }

    if (options.dryRun) {
      console.log(`Would upgrade: ${filePath}  "${declaredVersion}" → "${latest}"`);
    } else {
      writeFileSync(filePath, fixed, 'utf-8');
      console.log(`Upgraded: ${filePath}  "${declaredVersion}" → "${latest}"`);
    }
    upgradedCount++;
  }

  const verb = options.dryRun ? 'would be upgraded' : 'upgraded';
  console.log(`\n${upgradedCount} file(s) ${verb}, ${skippedCount} skipped.`);
}
```

- [ ] **Step 4: Register upgrade command in CLI**

Modify `packages/cli/src/cli.ts` — add after the last command registration (before `run()` function):

```typescript
program
  .command('upgrade')
  .description('Upgrade .prs files to the latest syntax version')
  .option('--dry-run', 'Show what would be changed without writing')
  .action(upgradeCommand);
```

Add import at top:

```typescript
import { upgradeCommand } from './commands/upgrade.js';
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm nx test cli -- --testPathPattern=upgrade`
Expected: PASS

- [ ] **Step 6: Run full CLI test suite**

Run: `pnpm nx test cli`
Expected: PASS — no regressions

- [ ] **Step 7: Commit**

```bash
git add packages/cli/src/commands/upgrade.ts packages/cli/src/commands/__tests__/upgrade.spec.ts packages/cli/src/cli.ts
git commit -m "feat(cli): add prs upgrade command for syntax version bumping"
```

---

## Chunk 7: Verification & Documentation

### Task 7: Full verification pipeline

- [ ] **Step 1: Run format**

Run: `pnpm run format`

- [ ] **Step 2: Run lint**

Run: `pnpm run lint`
Fix any issues.

- [ ] **Step 3: Run typecheck**

Run: `pnpm run typecheck`
Expected: PASS — no type errors

- [ ] **Step 4: Run all tests**

Run: `pnpm run test`
Expected: PASS — all tests green

- [ ] **Step 5: Validate .prs files**

Run: `pnpm prs validate --strict`
Expected: PASS (PS018 may warn if local `.prs` files have outdated syntax — fix with `prs validate --fix` if so)

- [ ] **Step 6: Check schemas**

Run: `pnpm schema:check`
Expected: PASS

- [ ] **Step 7: Check skills**

Run: `pnpm skill:check`
Expected: PASS

- [ ] **Step 8: Check formatter docs**

Run: `pnpm docs:formatters:check`
Expected: PASS

### Task 8: Update documentation

**Files:**

- Modify: `packages/core/README.md`
- Modify: `packages/validator/README.md`
- Modify: `packages/cli/README.md`
- Modify: `docs/reference/language.md`
- Modify: `.promptscript/skills/promptscript/SKILL.md`

- [ ] **Step 1: Update core README**

Add to API reference section in `packages/core/README.md`:

Document `SYNTAX_VERSIONS`, `getLatestSyntaxVersion()`, `isKnownSyntaxVersion()`, `getBlocksForVersion()`, `getMinimumVersionForBlock()`, `levenshteinDistance()`, `findClosestMatch()`.

- [ ] **Step 2: Update validator README**

Add PS018 and PS019 to the rules table in `packages/validator/README.md`:

| PS018 | syntax-version-compat | warning | Checks syntax version compatibility with used blocks |
| PS019 | unknown-block-name | warning | Detects unknown block names with typo suggestions |

- [ ] **Step 3: Update CLI README**

Add to `packages/cli/README.md`:

- `prs validate --fix` — auto-fix syntax version issues
- `prs upgrade [--dry-run]` — upgrade all files to latest syntax version

- [ ] **Step 4: Update language reference**

Add syntax version table to `docs/reference/language.md` listing known versions and which blocks each supports.

- [ ] **Step 5: Update SKILL.md**

Update `.promptscript/skills/promptscript/SKILL.md` with syntax version info (known versions, `prs upgrade`, `prs validate --fix`). Then run `pnpm skill:check` to verify sync.

- [ ] **Step 6: Commit documentation**

```bash
git add packages/core/README.md packages/validator/README.md packages/cli/README.md docs/reference/language.md .promptscript/skills/promptscript/SKILL.md
git commit -m "docs: document syntax version validation, PS018/PS019 rules, and upgrade command"
```

### Task 9: Final verification and full pipeline

- [ ] **Step 1: Run full verification pipeline**

```bash
pnpm run format
pnpm run lint
pnpm run typecheck
pnpm run test
pnpm prs validate --strict
pnpm schema:check
pnpm skill:check
pnpm docs:formatters:check
```

All must pass before considering work complete.
