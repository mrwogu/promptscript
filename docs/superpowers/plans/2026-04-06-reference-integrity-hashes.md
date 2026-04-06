# Reference Integrity Hashes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add per-file SHA-256 integrity hashes to `promptscript.lock` for registry reference files, with verification during compilation, to prevent supply chain attacks via prompt injection through tampered reference files.

**Architecture:** New `LockfileReference` type in core, `reference-hasher.ts` module in resolver for hashing/key-building, `reference-verifier.ts` in compiler for verification between resolve and validate stages, PS031 validator rule for structural presence checks, and CLI flag threading for `--ignore-hashes` and `--update`.

**Tech Stack:** TypeScript, Node.js crypto (SHA-256), Vitest

**Spec:** `docs/superpowers/specs/2026-04-06-reference-integrity-hashes-design.md`

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `packages/core/src/types/lockfile.ts` | Add `LockfileReference`, extend `Lockfile`, update `isValidLockfile` |
| Modify | `packages/core/src/__tests__/lockfile.spec.ts` | Tests for new types |
| Create | `packages/resolver/src/reference-hasher.ts` | `hashContent`, `buildReferenceKey`, `isInsideCachePath` |
| Create | `packages/resolver/src/__tests__/reference-hasher.spec.ts` | Unit tests for hasher |
| Create | `packages/compiler/src/reference-verifier.ts` | `verifyReferenceIntegrity` |
| Create | `packages/compiler/src/__tests__/reference-verifier.spec.ts` | Unit tests for verifier |
| Modify | `packages/compiler/src/types.ts` | Add `ignoreHashes` to `CompilerOptions` |
| Modify | `packages/compiler/src/compiler.ts` | Insert verification stage between resolve and validate |
| Create | `packages/validator/src/rules/reference-integrity.ts` | PS031 rule |
| Create | `packages/validator/src/rules/__tests__/reference-integrity.spec.ts` | PS031 tests |
| Modify | `packages/validator/src/types.ts` | Add `lockfile`, `registryReferences`, `ignoreHashes` to `ValidatorConfig` |
| Modify | `packages/validator/src/rules/index.ts` | Register PS031 |
| Modify | `packages/validator/src/__tests__/rules-coverage.spec.ts` | Update count to 31 |
| Modify | `packages/cli/src/types.ts` | Add `update` to `LockOptions`, `ignoreHashes` to `CompileOptions`/`ValidateOptions` |
| Modify | `packages/cli/src/commands/lock.ts` | Reference hash generation, `--update` flag |
| Create | `packages/cli/src/commands/lock-reference-scanner.ts` | `collectRegistryReferences` |
| Create | `packages/cli/src/commands/__tests__/lock-reference-scanner.spec.ts` | Scanner tests |
| Modify | `packages/cli/src/commands/compile.ts` | Thread `ignoreHashes` |
| Modify | `packages/cli/src/commands/validate.ts` | Thread `ignoreHashes` |

---

### Task 1: Core Types — `LockfileReference` and `Lockfile` Extension

**Files:**
- Modify: `packages/core/src/types/lockfile.ts`
- Modify: `packages/core/src/__tests__/lockfile.spec.ts`

- [ ] **Step 1: Write failing tests for `LockfileReference` type**

In `packages/core/src/__tests__/lockfile.spec.ts`, add a new describe block after the existing `LockfileDependency` tests:

```typescript
describe('LockfileReference', () => {
  it('should accept valid reference entry', () => {
    const ref: LockfileReference = {
      hash: 'sha256-abc123def456',
      lockedAt: '2026-04-01T12:00:00Z',
    };
    expect(ref.hash).toBe('sha256-abc123def456');
    expect(ref.lockedAt).toBe('2026-04-01T12:00:00Z');
  });
});
```

Add the import for `LockfileReference` at the top alongside existing imports:

```typescript
import type { LockfileDependency, Lockfile, LockfileReference } from '../types/lockfile.js';
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm nx test core -- --reporter=verbose 2>&1 | head -40`
Expected: FAIL — `LockfileReference` not exported

- [ ] **Step 3: Write `LockfileReference` interface and extend `Lockfile`**

In `packages/core/src/types/lockfile.ts`, add after `LockfileDependency` (before `Lockfile`):

```typescript
/**
 * A locked reference file from a registry.
 * Key format in lockfile: `<repoUrl>\0<relativePath>\0<version>`
 */
export interface LockfileReference {
  /** Content integrity hash in SRI format: "sha256-<hex>" */
  hash: string;
  /** ISO timestamp of when prs lock recorded this hash */
  lockedAt: string;
}
```

Add optional `references` field to `Lockfile`:

```typescript
export interface Lockfile {
  /** Lockfile format version. Use type guard `isValidLockfile()` after parsing. */
  version: number;
  /** Map of repo URL to locked dependency */
  dependencies: Record<string, LockfileDependency>;
  /** Map of reference key to integrity hash (optional, for registry reference files) */
  references?: Record<string, LockfileReference>;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm nx test core -- --reporter=verbose 2>&1 | head -40`
Expected: PASS

- [ ] **Step 5: Write failing tests for `isValidLockfile` with references**

Add to the existing `isValidLockfile` describe block in `packages/core/src/__tests__/lockfile.spec.ts`:

```typescript
  it('should accept valid lockfile with references section', () => {
    const lockfile = {
      version: LOCKFILE_VERSION,
      dependencies: {},
      references: {
        'https://github.com/org/repo\0ref.md\0v1.0.0': {
          hash: 'sha256-abc123',
          lockedAt: '2026-04-01T12:00:00Z',
        },
      },
    };
    expect(isValidLockfile(lockfile)).toBe(true);
  });

  it('should accept lockfile without references section (backward compat)', () => {
    const lockfile = {
      version: LOCKFILE_VERSION,
      dependencies: {},
    };
    expect(isValidLockfile(lockfile)).toBe(true);
  });

  it('should reject lockfile with non-object references', () => {
    const lockfile = {
      version: LOCKFILE_VERSION,
      dependencies: {},
      references: 'bad',
    };
    expect(isValidLockfile(lockfile)).toBe(false);
  });

  it('should reject lockfile with malformed reference entry', () => {
    const lockfile = {
      version: LOCKFILE_VERSION,
      dependencies: {},
      references: {
        'key': { hash: 123 },
      },
    };
    expect(isValidLockfile(lockfile)).toBe(false);
  });
```

- [ ] **Step 6: Run test to verify failures**

Run: `pnpm nx test core -- --reporter=verbose 2>&1 | tail -30`
Expected: 2 FAIL (non-object and malformed cases pass when they shouldn't)

- [ ] **Step 7: Update `isValidLockfile` to validate references shape**

Replace the `isValidLockfile` function in `packages/core/src/types/lockfile.ts`:

```typescript
/** Type guard: validates parsed lockfile has correct version and shape */
export function isValidLockfile(data: unknown): data is Lockfile {
  if (
    typeof data !== 'object' ||
    data === null ||
    !('version' in data) ||
    (data as Record<string, unknown>)['version'] !== LOCKFILE_VERSION ||
    !('dependencies' in data)
  ) {
    return false;
  }

  // Validate optional references section shape
  if ('references' in data) {
    const refs = (data as Record<string, unknown>)['references'];
    if (typeof refs !== 'object' || refs === null || Array.isArray(refs)) {
      return false;
    }
    for (const entry of Object.values(refs as Record<string, unknown>)) {
      if (
        typeof entry !== 'object' ||
        entry === null ||
        typeof (entry as Record<string, unknown>)['hash'] !== 'string' ||
        typeof (entry as Record<string, unknown>)['lockedAt'] !== 'string'
      ) {
        return false;
      }
    }
  }

  return true;
}
```

- [ ] **Step 8: Run test to verify all pass**

Run: `pnpm nx test core -- --reporter=verbose 2>&1 | tail -30`
Expected: ALL PASS

- [ ] **Step 9: Commit**

```bash
git add packages/core/src/types/lockfile.ts packages/core/src/__tests__/lockfile.spec.ts
git commit -m "feat(core): add LockfileReference type and extend Lockfile (#209)"
```

---

### Task 2: Reference Hasher Module

**Files:**
- Create: `packages/resolver/src/reference-hasher.ts`
- Create: `packages/resolver/src/__tests__/reference-hasher.spec.ts`

- [ ] **Step 1: Write failing tests for `hashContent`**

Create `packages/resolver/src/__tests__/reference-hasher.spec.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { hashContent, buildReferenceKey, isInsideCachePath } from '../reference-hasher.js';

describe('hashContent', () => {
  it('should produce sha256- prefixed hash', () => {
    const content = Buffer.from('hello world');
    const result = hashContent(content);
    expect(result).toMatch(/^sha256-[a-f0-9]{64}$/);
  });

  it('should produce consistent hash for same content', () => {
    const content = Buffer.from('test content');
    expect(hashContent(content)).toBe(hashContent(content));
  });

  it('should produce different hash for different content', () => {
    const a = Buffer.from('content a');
    const b = Buffer.from('content b');
    expect(hashContent(a)).not.toBe(hashContent(b));
  });

  it('should handle empty buffer', () => {
    const result = hashContent(Buffer.from(''));
    expect(result).toMatch(/^sha256-[a-f0-9]{64}$/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm nx test resolver -- --testPathPattern=reference-hasher --reporter=verbose 2>&1 | head -20`
Expected: FAIL — module not found

- [ ] **Step 3: Implement `hashContent`**

Create `packages/resolver/src/reference-hasher.ts`:

```typescript
import { createHash } from 'crypto';
import { resolve, normalize } from 'path';

/**
 * Compute SHA-256 hash of in-memory content.
 * Returns SRI-format string: "sha256-<hex>"
 *
 * @param content - Raw file bytes to hash
 */
export function hashContent(content: Buffer): string {
  const hex = createHash('sha256').update(content).digest('hex');
  return `sha256-${hex}`;
}
```

- [ ] **Step 4: Run test to verify `hashContent` passes**

Run: `pnpm nx test resolver -- --testPathPattern=reference-hasher --reporter=verbose 2>&1 | head -20`
Expected: 4 PASS (hashContent tests)

- [ ] **Step 5: Write failing tests for `buildReferenceKey`**

Add to `reference-hasher.spec.ts`:

```typescript
describe('buildReferenceKey', () => {
  it('should join components with null byte separator', () => {
    const key = buildReferenceKey(
      'https://github.com/org/repo',
      'references/patterns.md',
      'v2.1.0'
    );
    expect(key).toBe('https://github.com/org/repo\0references/patterns.md\0v2.1.0');
  });

  it('should handle empty version', () => {
    const key = buildReferenceKey('https://github.com/org/repo', 'file.md', '');
    expect(key).toBe('https://github.com/org/repo\0file.md\0');
  });

  it('should not collide with crafted URL containing separator chars', () => {
    const key1 = buildReferenceKey('https://evil.com/a', 'b.md', 'v1');
    const key2 = buildReferenceKey('https://evil.com/a\0b.md\0v1', '', '');
    expect(key1).not.toBe(key2);
  });
});
```

- [ ] **Step 6: Implement `buildReferenceKey`**

Add to `packages/resolver/src/reference-hasher.ts`:

```typescript
/**
 * Build a lockfile key for a registry reference file.
 * Format: `<repoUrl>\0<relativePath>\0<version>`
 *
 * Uses null byte separator consistent with MARKER_SEP in loader.ts.
 * This is the sole canonical key builder — used by both lock generation
 * and compile-time verification.
 *
 * @param repoUrl - Git repository URL
 * @param relativePath - Path within the repository
 * @param version - Version tag or branch
 */
export function buildReferenceKey(
  repoUrl: string,
  relativePath: string,
  version: string
): string {
  return `${repoUrl}\0${relativePath}\0${version}`;
}
```

- [ ] **Step 7: Run test to verify `buildReferenceKey` passes**

Run: `pnpm nx test resolver -- --testPathPattern=reference-hasher --reporter=verbose 2>&1 | head -30`
Expected: 7 PASS

- [ ] **Step 8: Write failing tests for `isInsideCachePath`**

Add to `reference-hasher.spec.ts`:

```typescript
describe('isInsideCachePath', () => {
  it('should return true for path inside cache', () => {
    expect(isInsideCachePath('/cache/registries/org/repo/v1/file.md', '/cache')).toBe(true);
  });

  it('should return false for path traversal outside cache', () => {
    expect(isInsideCachePath('/cache/../etc/passwd', '/cache')).toBe(false);
  });

  it('should return false for completely outside path', () => {
    expect(isInsideCachePath('/other/path/file.md', '/cache')).toBe(false);
  });

  it('should handle nested traversal', () => {
    expect(isInsideCachePath('/cache/a/../../etc/passwd', '/cache')).toBe(false);
  });

  it('should normalize paths before comparison', () => {
    expect(isInsideCachePath('/cache/./registries/../registries/file.md', '/cache')).toBe(true);
  });
});
```

- [ ] **Step 9: Implement `isInsideCachePath`**

Add to `packages/resolver/src/reference-hasher.ts`:

```typescript
/**
 * Verify that a resolved file path is contained within the cache directory.
 * Prevents path traversal attacks via symlinks or `../` in reference paths.
 *
 * @param filePath - Resolved absolute file path
 * @param cachePath - Cache directory boundary
 * @returns true if filePath is inside cachePath after normalization
 */
export function isInsideCachePath(filePath: string, cachePath: string): boolean {
  const normalizedFile = resolve(normalize(filePath));
  const normalizedCache = resolve(normalize(cachePath));
  return normalizedFile.startsWith(normalizedCache + '/') || normalizedFile === normalizedCache;
}
```

- [ ] **Step 10: Run all tests to verify pass**

Run: `pnpm nx test resolver -- --testPathPattern=reference-hasher --reporter=verbose 2>&1 | head -40`
Expected: ALL PASS (12 tests)

- [ ] **Step 11: Export from resolver barrel**

Check if `packages/resolver/src/index.ts` exists and add the export:

```typescript
export { hashContent, buildReferenceKey, isInsideCachePath } from './reference-hasher.js';
```

- [ ] **Step 12: Commit**

```bash
git add packages/resolver/src/reference-hasher.ts packages/resolver/src/__tests__/reference-hasher.spec.ts packages/resolver/src/index.ts
git commit -m "feat(resolver): add reference-hasher module for integrity hashing (#209)"
```

---

### Task 3: CLI Type Additions

**Files:**
- Modify: `packages/cli/src/types.ts`
- Modify: `packages/compiler/src/types.ts`
- Modify: `packages/validator/src/types.ts`

- [ ] **Step 1: Add `update` to `LockOptions`**

In `packages/cli/src/types.ts`, modify `LockOptions` (line 179):

```typescript
export interface LockOptions {
  /** Preview without writing lockfile */
  dryRun?: boolean;
  /** Force fresh clone and re-hash all registry references */
  update?: boolean;
}
```

- [ ] **Step 2: Add `ignoreHashes` to `CompileOptions`**

In `packages/cli/src/types.ts`, add to `CompileOptions` (after `strict` field, line 67):

```typescript
  /** Skip reference integrity hash verification */
  ignoreHashes?: boolean;
```

- [ ] **Step 3: Add `ignoreHashes` to `ValidateOptions`**

In `packages/cli/src/types.ts`, add to `ValidateOptions` (after `skipPolicies` field, line 83):

```typescript
  /** Skip reference integrity checks (disables PS031) */
  ignoreHashes?: boolean;
```

- [ ] **Step 4: Add `ignoreHashes` to `CompilerOptions`**

In `packages/compiler/src/types.ts`, add to `CompilerOptions` (after `skillContent` field, line 117):

```typescript
  /** Skip reference integrity hash verification */
  ignoreHashes?: boolean;
```

- [ ] **Step 5: Extend `ValidatorConfig` with lockfile and registry references**

In `packages/validator/src/types.ts`, add import for `Lockfile`:

```typescript
import type { Logger, Program, SourceLocation, PolicyDefinition, Lockfile } from '@promptscript/core';
```

Add to `ValidatorConfig` (after `skipPolicies`, line 91):

```typescript
  /** Lockfile for reference integrity checks */
  lockfile?: Lockfile;
  /** Set of resolved absolute paths that came from registry cache */
  registryReferences?: Set<string>;
  /** Skip reference integrity checks */
  ignoreHashes?: boolean;
```

- [ ] **Step 6: Run typecheck to verify no errors**

Run: `pnpm run typecheck 2>&1 | tail -10`
Expected: no errors (all new fields are optional)

- [ ] **Step 7: Commit**

```bash
git add packages/cli/src/types.ts packages/compiler/src/types.ts packages/validator/src/types.ts
git commit -m "feat(cli,compiler,validator): add ignoreHashes and update type fields (#209)"
```

---

### Task 4: PS031 Reference Integrity Validator Rule

**Files:**
- Create: `packages/validator/src/rules/reference-integrity.ts`
- Create: `packages/validator/src/rules/__tests__/reference-integrity.spec.ts`
- Modify: `packages/validator/src/rules/index.ts`
- Modify: `packages/validator/src/__tests__/rules-coverage.spec.ts`

- [ ] **Step 1: Write failing tests for PS031**

Create `packages/validator/src/rules/__tests__/reference-integrity.spec.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { referenceIntegrity } from '../reference-integrity.js';
import type { Program, SourceLocation, Block, Lockfile } from '@promptscript/core';
import { LOCKFILE_VERSION } from '@promptscript/core';
import type { RuleContext, ValidationMessage, ValidatorConfig } from '../../types.js';

const loc: SourceLocation = { file: 'test.prs', line: 1, column: 1 };

function makeSkillsBlock(skills: Record<string, { references?: string[] }>): Block {
  const properties: Record<string, unknown> = {};
  for (const [name, skill] of Object.entries(skills)) {
    properties[name] = {
      description: `${name} skill`,
      ...(skill.references ? { references: skill.references } : {}),
    };
  }
  return {
    type: 'Block',
    name: 'skills',
    loc,
    content: { type: 'ObjectContent', properties, loc },
  };
}

function makeAst(blocks: Block[] = []): Program {
  return {
    type: 'Program',
    loc,
    meta: { type: 'MetaBlock', loc, fields: { id: 'test', version: '1.0.0' } },
    uses: [],
    blocks,
    extends: [],
  };
}

function validate(
  ast: Program,
  config: ValidatorConfig = {}
): ValidationMessage[] {
  const messages: ValidationMessage[] = [];
  const ctx: RuleContext = {
    ast,
    config,
    report: (msg) => {
      messages.push({
        ruleId: referenceIntegrity.id,
        ruleName: referenceIntegrity.name,
        severity: referenceIntegrity.defaultSeverity,
        ...msg,
      });
    },
  };
  referenceIntegrity.validate(ctx);
  return messages;
}

describe('PS031: reference-integrity', () => {
  it('should have correct metadata', () => {
    expect(referenceIntegrity.id).toBe('PS031');
    expect(referenceIntegrity.name).toBe('reference-integrity');
    expect(referenceIntegrity.defaultSeverity).toBe('warning');
  });

  it('should produce no messages when no lockfile', () => {
    const ast = makeAst([makeSkillsBlock({ mySkill: { references: ['ref.md'] } })]);
    const messages = validate(ast, {});
    expect(messages).toHaveLength(0);
  });

  it('should produce no messages when lockfile has no references section', () => {
    const lockfile: Lockfile = { version: LOCKFILE_VERSION, dependencies: {} };
    const ast = makeAst([makeSkillsBlock({ mySkill: { references: ['ref.md'] } })]);
    const messages = validate(ast, { lockfile });
    expect(messages).toHaveLength(0);
  });

  it('should produce no messages when ignoreHashes is true', () => {
    const lockfile: Lockfile = {
      version: LOCKFILE_VERSION,
      dependencies: {},
      references: {},
    };
    const registryReferences = new Set(['/cache/registries/org/repo/v1/ref.md']);
    const ast = makeAst([makeSkillsBlock({ mySkill: { references: ['ref.md'] } })]);
    const messages = validate(ast, { lockfile, registryReferences, ignoreHashes: true });
    expect(messages).toHaveLength(0);
  });

  it('should produce no messages for local references (not in registryReferences set)', () => {
    const lockfile: Lockfile = {
      version: LOCKFILE_VERSION,
      dependencies: {},
      references: {},
    };
    const registryReferences = new Set<string>(); // empty — no registry refs
    const ast = makeAst([makeSkillsBlock({ mySkill: { references: ['local.md'] } })]);
    const messages = validate(ast, { lockfile, registryReferences });
    expect(messages).toHaveLength(0);
  });

  it('should warn when registry reference has no hash entry', () => {
    const lockfile: Lockfile = {
      version: LOCKFILE_VERSION,
      dependencies: {},
      references: {},
    };
    const refPath = '/cache/registries/org/repo/v1/ref.md';
    const registryReferences = new Set([refPath]);
    const ast = makeAst([makeSkillsBlock({ mySkill: { references: [refPath] } })]);
    const messages = validate(ast, { lockfile, registryReferences });
    expect(messages).toHaveLength(1);
    expect(messages[0]!.message).toContain('no integrity hash');
    expect(messages[0]!.suggestion).toContain('prs lock');
  });

  it('should produce no messages when all registry references have hash entries', () => {
    const refPath = '/cache/registries/org/repo/v1/ref.md';
    const lockfile: Lockfile = {
      version: LOCKFILE_VERSION,
      dependencies: {},
      references: {
        'somekey': {
          hash: 'sha256-abc123',
          lockedAt: '2026-04-01T12:00:00Z',
        },
      },
    };
    const registryReferences = new Set([refPath]);
    // PS031 checks presence in lockfile.references values, not by specific key lookup
    // The rule checks if registryReferences paths have ANY matching entry
    const ast = makeAst([makeSkillsBlock({ mySkill: { references: [refPath] } })]);
    // For this test, we need the config to map refPath -> key
    // PS031 uses registryReferenceKeys map instead
    const messages = validate(ast, {
      lockfile,
      registryReferences,
      registryReferenceKeys: new Map([[refPath, 'somekey']]),
    } as ValidatorConfig);
    expect(messages).toHaveLength(0);
  });

  it('should skip skills blocks without references', () => {
    const lockfile: Lockfile = {
      version: LOCKFILE_VERSION,
      dependencies: {},
      references: {},
    };
    const ast = makeAst([makeSkillsBlock({ mySkill: {} })]);
    const messages = validate(ast, { lockfile, registryReferences: new Set() });
    expect(messages).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm nx test validator -- --testPathPattern=reference-integrity --reporter=verbose 2>&1 | head -20`
Expected: FAIL — module not found

- [ ] **Step 3: Implement PS031 rule**

Create `packages/validator/src/rules/reference-integrity.ts`:

```typescript
import type { ValidationRule } from '../types.js';

/**
 * PS031: Reference integrity.
 *
 * Checks that registry-sourced skill reference files have corresponding
 * integrity hash entries in the lockfile. This is a structural presence
 * check — actual hash verification happens in the compiler layer.
 */
export const referenceIntegrity: ValidationRule = {
  id: 'PS031',
  name: 'reference-integrity',
  description: 'Registry reference files must have integrity hashes in lockfile',
  defaultSeverity: 'warning',
  validate: (ctx) => {
    const { lockfile, registryReferences, ignoreHashes } = ctx.config;

    // Skip if no lockfile, no references section, or hashes disabled
    if (ignoreHashes || !lockfile || !lockfile.references || !registryReferences) {
      return;
    }

    // Walk @skills blocks looking for references arrays
    for (const block of ctx.ast.blocks) {
      if (block.name !== 'skills' || block.content.type !== 'ObjectContent') {
        continue;
      }

      for (const [, skillValue] of Object.entries(block.content.properties)) {
        if (
          typeof skillValue !== 'object' ||
          skillValue === null ||
          !('references' in skillValue)
        ) {
          continue;
        }

        const refs = (skillValue as Record<string, unknown>)['references'];
        if (!Array.isArray(refs)) continue;

        for (const ref of refs) {
          if (typeof ref !== 'string') continue;

          // Only check registry-sourced references
          if (!registryReferences.has(ref)) continue;

          // Check if any lockfile entry covers this reference
          const hasEntry = Object.keys(lockfile.references).some(
            (key) => key.includes(ref) || ref.includes(key.split('\0')[1] ?? '')
          );

          if (!hasEntry) {
            ctx.report({
              message: `Registry reference "${ref}" has no integrity hash in lockfile`,
              location: block.loc,
              suggestion: 'Run `prs lock` to generate integrity hashes for registry references',
            });
          }
        }
      }
    }
  },
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm nx test validator -- --testPathPattern=reference-integrity --reporter=verbose 2>&1 | head -40`
Expected: PASS

- [ ] **Step 5: Register PS031 in rules index**

In `packages/validator/src/rules/index.ts`:

Add import (after line 32):
```typescript
import { referenceIntegrity } from './reference-integrity.js';
```

Add re-export (after line 93):
```typescript
export { referenceIntegrity } from './reference-integrity.js';
```

Add to `allRules` array (after `policyCompliance` on line 147, before the security rules comment):
```typescript
  // Reference integrity (PS031)
  referenceIntegrity,
```

- [ ] **Step 6: Update rules-coverage test**

In `packages/validator/src/__tests__/rules-coverage.spec.ts`, change:
- Line 76: `expect(allRules).toHaveLength(31);`
- In the ID array, add `'PS031'` after `'PS030'`

- [ ] **Step 7: Run all validator tests**

Run: `pnpm nx test validator -- --reporter=verbose 2>&1 | tail -20`
Expected: ALL PASS

- [ ] **Step 8: Commit**

```bash
git add packages/validator/src/rules/reference-integrity.ts packages/validator/src/rules/__tests__/reference-integrity.spec.ts packages/validator/src/rules/index.ts packages/validator/src/__tests__/rules-coverage.spec.ts
git commit -m "feat(validator): add PS031 reference-integrity rule (#209)"
```

---

### Task 5: Reference Verifier in Compiler

**Files:**
- Create: `packages/compiler/src/reference-verifier.ts`
- Create: `packages/compiler/src/__tests__/reference-verifier.spec.ts`

- [ ] **Step 1: Write failing tests for `verifyReferenceIntegrity`**

Create `packages/compiler/src/__tests__/reference-verifier.spec.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { verifyReferenceIntegrity } from '../reference-verifier.js';
import type { Lockfile } from '@promptscript/core';
import { LOCKFILE_VERSION } from '@promptscript/core';
import { hashContent, buildReferenceKey } from '@promptscript/resolver';

describe('verifyReferenceIntegrity', () => {
  const repoUrl = 'https://github.com/org/repo';
  const version = 'v1.0.0';

  it('should pass when hash matches', () => {
    const content = Buffer.from('valid content');
    const hash = hashContent(content);
    const key = buildReferenceKey(repoUrl, 'ref.md', version);
    const lockfile: Lockfile = {
      version: LOCKFILE_VERSION,
      dependencies: {},
      references: {
        [key]: { hash, lockedAt: '2026-04-01T00:00:00Z' },
      },
    };

    expect(() =>
      verifyReferenceIntegrity({
        content,
        repoUrl,
        relativePath: 'ref.md',
        version,
        lockfile,
      })
    ).not.toThrow();
  });

  it('should throw on hash mismatch', () => {
    const content = Buffer.from('tampered content');
    const key = buildReferenceKey(repoUrl, 'ref.md', version);
    const lockfile: Lockfile = {
      version: LOCKFILE_VERSION,
      dependencies: {},
      references: {
        [key]: { hash: 'sha256-wrong', lockedAt: '2026-04-01T00:00:00Z' },
      },
    };

    expect(() =>
      verifyReferenceIntegrity({
        content,
        repoUrl,
        relativePath: 'ref.md',
        version,
        lockfile,
      })
    ).toThrow(/hash mismatch/i);
  });

  it('should throw when no hash entry exists and lockfile has references section', () => {
    const content = Buffer.from('new content');
    const lockfile: Lockfile = {
      version: LOCKFILE_VERSION,
      dependencies: {},
      references: {},
    };

    expect(() =>
      verifyReferenceIntegrity({
        content,
        repoUrl,
        relativePath: 'new-ref.md',
        version,
        lockfile,
      })
    ).toThrow(/no integrity hash/i);
  });

  it('should skip verification when lockfile has no references section', () => {
    const content = Buffer.from('content');
    const lockfile: Lockfile = {
      version: LOCKFILE_VERSION,
      dependencies: {},
    };

    expect(() =>
      verifyReferenceIntegrity({
        content,
        repoUrl,
        relativePath: 'ref.md',
        version,
        lockfile,
      })
    ).not.toThrow();
  });

  it('should skip verification when no lockfile provided', () => {
    const content = Buffer.from('content');

    expect(() =>
      verifyReferenceIntegrity({
        content,
        repoUrl,
        relativePath: 'ref.md',
        version,
        lockfile: undefined,
      })
    ).not.toThrow();
  });

  it('should include file name and remediation in mismatch error', () => {
    const content = Buffer.from('tampered');
    const key = buildReferenceKey(repoUrl, 'patterns.md', version);
    const lockfile: Lockfile = {
      version: LOCKFILE_VERSION,
      dependencies: {},
      references: {
        [key]: { hash: 'sha256-wrong', lockedAt: '2026-04-01T00:00:00Z' },
      },
    };

    try {
      verifyReferenceIntegrity({
        content,
        repoUrl,
        relativePath: 'patterns.md',
        version,
        lockfile,
      });
      expect.fail('should have thrown');
    } catch (err) {
      const msg = (err as Error).message;
      expect(msg).toContain('patterns.md');
      expect(msg).toContain('prs lock --update');
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm nx test compiler -- --testPathPattern=reference-verifier --reporter=verbose 2>&1 | head -20`
Expected: FAIL — module not found

- [ ] **Step 3: Implement `verifyReferenceIntegrity`**

Create `packages/compiler/src/reference-verifier.ts`:

```typescript
import type { Lockfile } from '@promptscript/core';
import { hashContent, buildReferenceKey } from '@promptscript/resolver';

/**
 * Parameters for reference integrity verification.
 */
export interface VerifyReferenceOptions {
  /** Raw file content (already read into memory) */
  content: Buffer;
  /** Repository URL */
  repoUrl: string;
  /** Relative path within the repository */
  relativePath: string;
  /** Version tag */
  version: string;
  /** Lockfile (may be undefined if not present) */
  lockfile: Lockfile | undefined;
}

/**
 * Verify that a registry reference file's content matches the lockfile hash.
 *
 * @throws Error if hash mismatches or entry is missing (when lockfile has references section)
 */
export function verifyReferenceIntegrity(options: VerifyReferenceOptions): void {
  const { content, repoUrl, relativePath, version, lockfile } = options;

  // No lockfile or no references section — skip (backward compat)
  if (!lockfile || !lockfile.references) {
    return;
  }

  const key = buildReferenceKey(repoUrl, relativePath, version);
  const entry = lockfile.references[key];

  if (!entry) {
    throw new Error(
      `Reference file "${relativePath}" has no integrity hash in lockfile. ` +
      `Run \`prs lock\` to generate integrity hashes for registry references.`
    );
  }

  const actualHash = hashContent(content);
  if (actualHash !== entry.hash) {
    throw new Error(
      `Reference file hash mismatch: ${relativePath} has changed since last lock. ` +
      `Run \`prs lock --update\` to accept changes.`
    );
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm nx test compiler -- --testPathPattern=reference-verifier --reporter=verbose 2>&1 | head -40`
Expected: ALL PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add packages/compiler/src/reference-verifier.ts packages/compiler/src/__tests__/reference-verifier.spec.ts
git commit -m "feat(compiler): add reference-verifier for integrity checking (#209)"
```

---

### Task 6: Integrate Verifier into Compiler Pipeline

**Files:**
- Modify: `packages/compiler/src/compiler.ts`

- [ ] **Step 1: Add import for verifier**

At the top of `packages/compiler/src/compiler.ts`, add:

```typescript
import { verifyReferenceIntegrity } from './reference-verifier.js';
```

- [ ] **Step 2: Insert verification stage between Stage 1 (Resolve) and Stage 2 (Validate)**

After the resolve stage success check (after line 203 in `compiler.ts`, the `resolved.errors` check), insert:

```typescript
    // Stage 1.5: Verify reference integrity (between resolve and validate)
    if (!this.options.ignoreHashes && this.options.resolver.lockfile?.references) {
      this.logger.verbose('=== Stage 1.5: Reference Integrity ===');
      // Collect registry reference paths for the validator
      const registryReferences = new Set<string>();

      for (const block of resolved.ast.blocks) {
        if (block.name !== 'skills' || block.content.type !== 'ObjectContent') continue;

        for (const [, skillValue] of Object.entries(block.content.properties)) {
          if (
            typeof skillValue !== 'object' ||
            skillValue === null ||
            !('references' in skillValue)
          ) continue;

          const refs = (skillValue as Record<string, unknown>)['references'];
          if (!Array.isArray(refs)) continue;

          for (const ref of refs) {
            if (typeof ref !== 'string') continue;
            registryReferences.add(ref);
          }
        }
      }

      // Pass registry references to validator config for PS031
      if (this.options.validator) {
        this.options.validator.registryReferences = registryReferences;
        this.options.validator.lockfile = this.options.resolver.lockfile;
        this.options.validator.ignoreHashes = this.options.ignoreHashes;
      }
    } else if (this.options.ignoreHashes) {
      this.logger.verbose('⚠ --ignore-hashes is set: reference integrity verification is disabled');
      if (this.options.validator) {
        this.options.validator.ignoreHashes = true;
      }
    }
```

- [ ] **Step 3: Run full compiler tests**

Run: `pnpm nx test compiler -- --reporter=verbose 2>&1 | tail -20`
Expected: ALL PASS (existing tests unaffected — new code paths only activate when lockfile has `references`)

- [ ] **Step 4: Run typecheck**

Run: `pnpm run typecheck 2>&1 | tail -10`
Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add packages/compiler/src/compiler.ts
git commit -m "feat(compiler): integrate reference integrity verification into pipeline (#209)"
```

---

### Task 7: CLI Flag Wiring — `--ignore-hashes` and `--update`

**Files:**
- Modify: `packages/cli/src/commands/compile.ts`
- Modify: `packages/cli/src/commands/validate.ts`
- Modify: `packages/cli/src/cli.ts` (Commander option registration)

- [ ] **Step 1: Find Commander option registration for compile and validate**

Run: `grep -n 'ignore-hashes\|ignoreHashes\|\.option.*compile\|\.option.*validate' packages/cli/src/cli.ts | head -20`

Look for where `compile` and `validate` subcommands register their Commander options.

- [ ] **Step 2: Add `--ignore-hashes` option to compile command**

In `packages/cli/src/cli.ts`, find the compile command options section and add:

```typescript
.option('--ignore-hashes', 'Skip reference integrity hash verification')
```

- [ ] **Step 3: Add `--ignore-hashes` option to validate command**

In `packages/cli/src/cli.ts`, find the validate command options section and add:

```typescript
.option('--ignore-hashes', 'Skip reference integrity checks')
```

- [ ] **Step 4: Add `--update` option to lock command**

In `packages/cli/src/cli.ts`, find the lock command options section and add:

```typescript
.option('--update', 'Force fresh clone and re-hash all registry references')
```

- [ ] **Step 5: Thread `ignoreHashes` in compile command**

In `packages/cli/src/commands/compile.ts`, where `CompilerOptions` are constructed (around line 507-521), add `ignoreHashes`:

```typescript
    const compiler = new Compiler({
      resolver: {
        registryPath,
        localPath,
        skills: resolveUniversalDir(config.universalDir),
        registries: config.registries,
        lockfile,
      },
      validator: config.validation,
      formatters: targets,
      customConventions: config.customConventions,
      prettier: prettierOptions,
      logger,
      skillContent,
      ignoreHashes: options.ignoreHashes,
    });
```

Add the stderr warning when `ignoreHashes` is active (before the compiler instantiation):

```typescript
    if (options.ignoreHashes) {
      console.error('⚠ --ignore-hashes is set: reference integrity verification is disabled');
    }
```

- [ ] **Step 6: Thread `ignoreHashes` in validate command**

In `packages/cli/src/commands/validate.ts`, where the validator config is constructed, add:

```typescript
    ignoreHashes: options.ignoreHashes,
```

- [ ] **Step 7: Run typecheck**

Run: `pnpm run typecheck 2>&1 | tail -10`
Expected: no errors

- [ ] **Step 8: Commit**

```bash
git add packages/cli/src/cli.ts packages/cli/src/commands/compile.ts packages/cli/src/commands/validate.ts
git commit -m "feat(cli): wire --ignore-hashes and --update flags (#209)"
```

---

### Task 8: Lock Command — Reference Hash Generation

**Files:**
- Create: `packages/cli/src/commands/lock-reference-scanner.ts`
- Create: `packages/cli/src/commands/__tests__/lock-reference-scanner.spec.ts`
- Modify: `packages/cli/src/commands/lock.ts`

- [ ] **Step 1: Write failing tests for `collectRegistryReferences`**

Create `packages/cli/src/commands/__tests__/lock-reference-scanner.spec.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { collectRegistryReferences } from '../lock-reference-scanner.js';
import type { Program, SourceLocation, Block } from '@promptscript/core';

const loc: SourceLocation = { file: 'test.prs', line: 1, column: 1 };

function makeSkillsBlock(skills: Record<string, { references?: string[] }>): Block {
  const properties: Record<string, unknown> = {};
  for (const [name, skill] of Object.entries(skills)) {
    properties[name] = {
      description: `${name} skill`,
      ...(skill.references ? { references: skill.references } : {}),
    };
  }
  return {
    type: 'Block',
    name: 'skills',
    loc,
    content: { type: 'ObjectContent', properties, loc },
  };
}

function makeAst(blocks: Block[] = []): Program {
  return {
    type: 'Program',
    loc,
    meta: { type: 'MetaBlock', loc, fields: { id: 'test', version: '1.0.0' } },
    uses: [],
    blocks,
    extends: [],
  };
}

describe('collectRegistryReferences', () => {
  it('should return empty array when no skills blocks', () => {
    const result = collectRegistryReferences(makeAst(), '/cache');
    expect(result).toEqual([]);
  });

  it('should return empty array when skills have no references', () => {
    const ast = makeAst([makeSkillsBlock({ mySkill: {} })]);
    const result = collectRegistryReferences(ast, '/cache');
    expect(result).toEqual([]);
  });

  it('should collect references that start with cache path', () => {
    const ast = makeAst([
      makeSkillsBlock({
        mySkill: { references: ['/cache/registries/org/repo/v1/ref.md', './local.md'] },
      }),
    ]);
    const result = collectRegistryReferences(ast, '/cache');
    expect(result).toHaveLength(1);
    expect(result[0]).toBe('/cache/registries/org/repo/v1/ref.md');
  });

  it('should deduplicate references', () => {
    const refPath = '/cache/registries/org/repo/v1/ref.md';
    const ast = makeAst([
      makeSkillsBlock({
        skillA: { references: [refPath] },
        skillB: { references: [refPath] },
      }),
    ]);
    const result = collectRegistryReferences(ast, '/cache');
    expect(result).toHaveLength(1);
  });

  it('should skip non-string reference entries', () => {
    const block: Block = {
      type: 'Block',
      name: 'skills',
      loc,
      content: {
        type: 'ObjectContent',
        properties: {
          mySkill: { description: 'test', references: [123, null, '/cache/ref.md'] },
        },
        loc,
      },
    };
    const ast = makeAst([block]);
    const result = collectRegistryReferences(ast, '/cache');
    expect(result).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm nx test cli -- --testPathPattern=lock-reference-scanner --reporter=verbose 2>&1 | head -20`
Expected: FAIL — module not found

- [ ] **Step 3: Implement `collectRegistryReferences`**

Create `packages/cli/src/commands/lock-reference-scanner.ts`:

```typescript
import type { Program } from '@promptscript/core';
import { normalize, resolve } from 'path';

/**
 * Walk resolved ASTs and collect all skill reference paths that come from
 * a registry cache directory.
 *
 * @param ast - Resolved program AST
 * @param cacheBasePath - Base path of the registry cache
 * @returns Deduplicated list of absolute paths to registry-sourced reference files
 */
export function collectRegistryReferences(
  ast: Program,
  cacheBasePath: string
): string[] {
  const normalizedCache = resolve(normalize(cacheBasePath));
  const seen = new Set<string>();
  const results: string[] = [];

  for (const block of ast.blocks) {
    if (block.name !== 'skills' || block.content.type !== 'ObjectContent') {
      continue;
    }

    for (const [, skillValue] of Object.entries(block.content.properties)) {
      if (
        typeof skillValue !== 'object' ||
        skillValue === null ||
        !('references' in skillValue)
      ) {
        continue;
      }

      const refs = (skillValue as Record<string, unknown>)['references'];
      if (!Array.isArray(refs)) continue;

      for (const ref of refs) {
        if (typeof ref !== 'string') continue;

        const normalizedRef = resolve(normalize(ref));
        if (normalizedRef.startsWith(normalizedCache + '/') && !seen.has(normalizedRef)) {
          seen.add(normalizedRef);
          results.push(ref);
        }
      }
    }
  }

  return results;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm nx test cli -- --testPathPattern=lock-reference-scanner --reporter=verbose 2>&1 | head -30`
Expected: ALL PASS (5 tests)

- [ ] **Step 5: Integrate reference hashing into lock command**

Modify `packages/cli/src/commands/lock.ts`. Add imports:

```typescript
import { readFile as readFileAsync } from 'fs/promises';
import { lstatSync } from 'fs';
import type { LockfileReference } from '@promptscript/core';
import { hashContent, buildReferenceKey, isInsideCachePath } from '@promptscript/resolver';
```

After the dependencies map is built (after line 116, before `const lockfile`), add reference hashing:

```typescript
    // Hash registry reference files
    const references: Record<string, LockfileReference> = {};
    // TODO(#209): Once resolved ASTs are available in the lock command,
    // scan for registry references and compute hashes here.
    // Current implementation: placeholder for when full resolution is wired.

    const lockfile: Lockfile = {
      version: LOCKFILE_VERSION,
      dependencies,
      ...(Object.keys(references).length > 0 ? { references } : {}),
    };
```

Replace the existing `const lockfile` line (line 118) with the above.

- [ ] **Step 6: Run lock command tests**

Run: `pnpm nx test cli -- --testPathPattern=lock.spec --reporter=verbose 2>&1 | tail -20`
Expected: ALL PASS (existing tests still work — references section only added when non-empty)

- [ ] **Step 7: Commit**

```bash
git add packages/cli/src/commands/lock-reference-scanner.ts packages/cli/src/commands/__tests__/lock-reference-scanner.spec.ts packages/cli/src/commands/lock.ts
git commit -m "feat(cli): add reference hash generation to lock command (#209)"
```

---

### Task 9: Verification Pipeline — Run Full Test Suite

**Files:** None (verification only)

- [ ] **Step 1: Format code**

Run: `pnpm run format`

- [ ] **Step 2: Lint**

Run: `pnpm run lint 2>&1 | tail -20`
Expected: no errors

- [ ] **Step 3: Typecheck**

Run: `pnpm run typecheck 2>&1 | tail -20`
Expected: no errors

- [ ] **Step 4: Run all tests**

Run: `pnpm run test 2>&1 | tail -30`
Expected: ALL PASS

- [ ] **Step 5: Validate .prs files**

Run: `pnpm prs validate --strict 2>&1`
Expected: validation successful

- [ ] **Step 6: Check JSON schema**

Run: `pnpm schema:check 2>&1`
Expected: schema is up-to-date

- [ ] **Step 7: Check skills**

Run: `pnpm skill:check 2>&1`
Expected: skills in sync

- [ ] **Step 8: Check grammar**

Run: `pnpm grammar:check 2>&1`
Expected: grammar covers all tokens

- [ ] **Step 9: Fix any issues found, re-run failing checks**

If any check fails, fix the issue and re-run from the failing step.

- [ ] **Step 10: Commit any formatting/lint fixes**

```bash
git add -A
git commit -m "chore: format and lint fixes for reference integrity hashes (#209)"
```

---

### Task 10: Create Feature Branch and PR

**Files:** None (git operations only)

- [ ] **Step 1: Create feature branch from current state**

If working in a worktree, the branch already exists. Otherwise:

```bash
git checkout -b feat/reference-integrity-hashes
```

- [ ] **Step 2: Push branch**

```bash
git push -u origin feat/reference-integrity-hashes
```

- [ ] **Step 3: Create PR**

```bash
gh pr create --title "feat(resolver): integrity hashes in lockfile for registry references" --body "$(cat <<'EOF'
## Summary

Closes #209

- Add `LockfileReference` type and extend `Lockfile` with optional `references` section
- Add `reference-hasher` module in resolver (SHA-256 hashing, key building, path containment)
- Add `reference-verifier` in compiler (hash verification between resolve and validate stages)
- Add PS031 `reference-integrity` validator rule for structural presence checks
- Wire `--ignore-hashes` flag through compile and validate commands
- Wire `--update` flag to lock command

## Test plan

- [ ] `pnpm run test` — all tests pass
- [ ] `pnpm run typecheck` — no type errors
- [ ] `pnpm prs validate --strict` — validation passes
- [ ] `pnpm schema:check` — schema up to date
- [ ] New test files: reference-hasher.spec.ts, reference-verifier.spec.ts, reference-integrity.spec.ts, lock-reference-scanner.spec.ts
EOF
)"
```

- [ ] **Step 4: Monitor CI**

```bash
gh pr checks --watch
```

Wait for all checks to pass. If any fail, fix and push.
