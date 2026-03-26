# Markdown Imports Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend `@use` to support plain `.md` files and directories, add `prs skills` CLI, replace `skills.sh` entirely.

**Architecture:** Extension-aware resolver approach. Parser token regexes widened to accept dots in paths. Resolver intercepts `.md` paths in `loadAndParse()` and routes through content detection → `parseSkillMd()` or PRS parser → synthesized `Program`. Lock file extended with optional fields. New CLI command for skill management.

**Tech Stack:** TypeScript, Vitest, Chevrotain (parser), pnpm + Nx (monorepo), yaml (lock file parsing)

**Spec:** `docs/design/2026-03-26-markdown-imports-design.md`

---

## File Structure

### New Files

| File                                                              | Responsibility                                                             |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `packages/resolver/src/content-detector.ts`                       | Detect `.md` content type: `'prs'` / `'skill'` / `'raw'`                   |
| `packages/resolver/src/content-detector.spec.ts`                  | Tests for content detection                                                |
| `packages/resolver/src/ast-factory.ts`                            | Shared `makeBlock()`, `makeObjectContent()`, `makeTextContent()` utilities |
| `packages/resolver/src/ast-factory.spec.ts`                       | Tests for AST factory                                                      |
| `packages/resolver/src/__tests__/md-imports.spec.ts`              | Integration tests for `.md` import resolution                              |
| `packages/resolver/src/__tests__/__fixtures__/md-imports/`        | Test fixture `.md` and `.prs` files                                        |
| `packages/validator/src/rules/duplicate-skills.ts`                | Validator: duplicate skill names, auto-discovery conflicts                 |
| `packages/validator/src/rules/__tests__/duplicate-skills.spec.ts` | Tests for duplicate skill validator                                        |
| `packages/cli/src/commands/skills.ts`                             | `prs skills add\|remove\|list\|search\|update` CLI command                 |
| `packages/cli/src/commands/__tests__/skills.spec.ts`              | Tests for skills CLI command                                               |

### Modified Files

| File                                      | Changes                                                                                   |
| ----------------------------------------- | ----------------------------------------------------------------------------------------- |
| `packages/parser/src/lexer/tokens.ts`     | Add `.` to `RelativePath` and `PathReference` character classes                           |
| `packages/core/src/types/lockfile.ts`     | Add optional `source`, `fetchedAt`, `skills` fields to `LockfileDependency`               |
| `packages/resolver/src/loader.ts`         | Skip `.prs` append for `.md` paths in `resolveRef()` and `toAbsolutePath()`               |
| `packages/resolver/src/resolver.ts`       | `.md` intercept in `loadAndParse()`, directory fallback, `resolveRegistryImport()` update |
| `packages/resolver/src/imports.ts`        | Pre-merge duplicate skill check in `resolveUses()`                                        |
| `packages/resolver/src/auto-discovery.ts` | Extract helpers to `ast-factory.ts`, add `<dirname>.md` convention                        |
| `packages/resolver/src/skills.ts`         | Extend `parseSkillMd()` for raw markdown (no frontmatter)                                 |
| `packages/resolver/src/git-registry.ts`   | Skip `.prs` append for `.md` in `resolveFilePath()`                                       |
| `packages/validator/src/index.ts`         | Register new duplicate-skills rule                                                        |
| `packages/cli/src/commands/index.ts`      | Register `skills` command                                                                 |
| `packages/cli/src/commands/lock.ts`       | Preserve `source: 'md'` entries, add `maxAliasCount` to YAML parse                        |
| `packages/cli/src/commands/update.ts`     | Add `maxAliasCount` to YAML parse                                                         |
| `packages/cli/src/commands/compile.ts`    | Add `maxAliasCount` to YAML parse                                                         |
| `packages/cli/src/commands/vendor.ts`     | Add `maxAliasCount` to YAML parse                                                         |

---

## Chunk 1: Foundation

### Task 1: Parser — Widen Token Regexes

**Files:**

- Modify: `packages/parser/src/lexer/tokens.ts`
- Test: `packages/parser/src/__tests__/lexer.spec.ts`

- [ ] **Step 1: Write failing test — RelativePath with `.md` extension**

Add test in `packages/parser/src/__tests__/lexer.spec.ts`:

```typescript
it('should tokenize RelativePath with .md extension', () => {
  const result = tokenize('./skills/frontend-design.md');
  expect(result.tokens).toHaveLength(1);
  expect(result.tokens[0]?.tokenType.name).toBe('RelativePath');
  expect(result.tokens[0]?.image).toBe('./skills/frontend-design.md');
});

it('should tokenize RelativePath with ../ prefix and .md extension', () => {
  const result = tokenize('../shared/security-scan.md');
  expect(result.tokens).toHaveLength(1);
  expect(result.tokens[0]?.tokenType.name).toBe('RelativePath');
  expect(result.tokens[0]?.image).toBe('../shared/security-scan.md');
});

it('should tokenize RelativePath with mid-segment dots', () => {
  const result = tokenize('./some.dir/file.prs');
  expect(result.tokens).toHaveLength(1);
  expect(result.tokens[0]?.tokenType.name).toBe('RelativePath');
  expect(result.tokens[0]?.image).toBe('./some.dir/file.prs');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm nx test parser -- --testPathPattern=lexer`
Expected: FAIL — `./skills/frontend-design` captured without `.md`

- [ ] **Step 3: Update RelativePath regex**

In `packages/parser/src/lexer/tokens.ts`, change:

```typescript
export const RelativePath = createToken({
  name: 'RelativePath',
  pattern: /\.\/[a-zA-Z0-9_/.-]+|\.\.\/[a-zA-Z0-9_/.-]+/,
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm nx test parser -- --testPathPattern=lexer`
Expected: PASS

- [ ] **Step 5: Write failing test — PathReference with `.md` extension**

```typescript
it('should tokenize PathReference with .md extension', () => {
  const result = tokenize('@org/skills/frontend-design.md');
  expect(result.tokens).toHaveLength(1);
  expect(result.tokens[0]?.tokenType.name).toBe('PathReference');
  expect(result.tokens[0]?.image).toBe('@org/skills/frontend-design.md');
});

it('should tokenize PathReference with .md and version', () => {
  const result = tokenize('@org/skills/frontend-design.md@2.1.0');
  expect(result.tokens).toHaveLength(1);
  expect(result.tokens[0]?.tokenType.name).toBe('PathReference');
  expect(result.tokens[0]?.image).toBe('@org/skills/frontend-design.md@2.1.0');
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `pnpm nx test parser -- --testPathPattern=lexer`
Expected: FAIL

- [ ] **Step 7: Update PathReference regex**

In `packages/parser/src/lexer/tokens.ts`, change:

```typescript
export const PathReference = createToken({
  name: 'PathReference',
  pattern: /@[a-zA-Z_][a-zA-Z0-9_-]*\/[a-zA-Z0-9_/.-]*(?:@[a-zA-Z0-9^~./-]+)?/,
});
```

- [ ] **Step 8: Run test to verify it passes**

Run: `pnpm nx test parser -- --testPathPattern=lexer`
Expected: PASS

- [ ] **Step 9: Run full parser test suite (regression)**

Run: `pnpm nx test parser`
Expected: All existing tests PASS

- [ ] **Step 10: Commit**

```bash
git add packages/parser/src/lexer/tokens.ts packages/parser/src/__tests__/lexer.spec.ts
git commit -m "$(cat <<'EOF'
feat(parser): widen RelativePath and PathReference to accept dots in paths

Allow `.md` extensions in @use path references by adding `.` to the
character classes. This enables `@use ./skill.md` and `@use @org/skill.md`.
EOF
)"
```

---

### Task 2: Core Types — Extend LockfileDependency

**Files:**

- Modify: `packages/core/src/types/lockfile.ts`
- Test: `packages/core/src/__tests__/lockfile.spec.ts` (if exists, otherwise create)

- [ ] **Step 1: Write failing test — new optional fields accepted**

```typescript
it('should allow LockfileDependency with source field', () => {
  const dep: LockfileDependency = {
    version: '1.0.0',
    commit: 'abc123',
    integrity: 'sha256-xyz',
    source: 'md',
  };
  expect(dep.source).toBe('md');
});

it('should allow LockfileDependency without new optional fields', () => {
  const dep: LockfileDependency = {
    version: '1.0.0',
    commit: 'abc123',
    integrity: 'sha256-xyz',
  };
  expect(dep.source).toBeUndefined();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm nx test core`
Expected: FAIL — `source` does not exist on `LockfileDependency`

- [ ] **Step 3: Add optional fields to LockfileDependency**

In `packages/core/src/types/lockfile.ts`:

```typescript
export interface LockfileDependency {
  /** Resolved version (tag name or branch) */
  version: string;
  /** Exact commit hash */
  commit: string;
  /** Content integrity hash */
  integrity: string;
  /** Source discriminator for .md-sourced dependencies */
  source?: 'md';
  /** ISO timestamp of last fetch (informational) */
  fetchedAt?: string;
  /** Discovered skill names for directory imports (advisory) */
  skills?: string[];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm nx test core`
Expected: PASS

- [ ] **Step 5: Run typecheck to confirm backward compatibility**

Run: `pnpm run typecheck`
Expected: PASS — existing code constructing `{ version, commit, integrity }` remains valid

- [ ] **Step 6: Commit**

```bash
git add packages/core/src/types/lockfile.ts packages/core/src/__tests__/
git commit -m "$(cat <<'EOF'
feat(core): extend LockfileDependency with optional source, fetchedAt, skills fields

Additive change for .md import support. Existing code constructing
LockfileDependency with only { version, commit, integrity } remains valid.
EOF
)"
```

---

### Task 3: AST Factory — Extract Shared Utilities

**Files:**

- Create: `packages/resolver/src/ast-factory.ts`
- Create: `packages/resolver/src/__tests__/ast-factory.spec.ts`
- Modify: `packages/resolver/src/auto-discovery.ts`

- [ ] **Step 1: Write test for makeBlock and makeObjectContent**

Create `packages/resolver/src/__tests__/ast-factory.spec.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { makeBlock, makeObjectContent, makeTextContent, VIRTUAL_LOC } from '../ast-factory.js';

describe('ast-factory', () => {
  describe('makeObjectContent', () => {
    it('should create ObjectContent with properties', () => {
      const result = makeObjectContent({ foo: 'bar' });
      expect(result.type).toBe('ObjectContent');
      expect(result.properties).toEqual({ foo: 'bar' });
      expect(result.loc).toEqual(VIRTUAL_LOC);
    });
  });

  describe('makeTextContent', () => {
    it('should create TextContent with value', () => {
      const result = makeTextContent('hello world');
      expect(result.type).toBe('TextContent');
      expect(result.value).toBe('hello world');
    });
  });

  describe('makeBlock', () => {
    it('should create Block with ObjectContent', () => {
      const content = makeObjectContent({ key: 'value' });
      const result = makeBlock('skills', content);
      expect(result.type).toBe('Block');
      expect(result.name).toBe('skills');
      expect(result.content).toBe(content);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm nx test resolver -- --testPathPattern=ast-factory`
Expected: FAIL — module not found

- [ ] **Step 3: Create ast-factory.ts**

Create `packages/resolver/src/ast-factory.ts`:

```typescript
import type { Block, ObjectContent, TextContent, Value, SourceLocation } from '@promptscript/core';

/** Virtual source location for synthesized AST nodes. */
export const VIRTUAL_LOC: SourceLocation = {
  file: '<synthesized>',
  line: 1,
  column: 1,
  offset: 0,
};

/** Synthesize an ObjectContent node from a properties record. */
export function makeObjectContent(properties: Record<string, Value>): ObjectContent {
  return {
    type: 'ObjectContent',
    properties,
    loc: VIRTUAL_LOC,
  };
}

/** Synthesize a TextContent node. */
export function makeTextContent(value: string, file?: string): TextContent {
  return {
    type: 'TextContent',
    value,
    loc: file ? { file, line: 1, column: 1, offset: 0 } : VIRTUAL_LOC,
  };
}

/** Synthesize a Block node. */
export function makeBlock(name: string, content: ObjectContent | TextContent): Block {
  return {
    type: 'Block',
    name,
    content,
    loc: VIRTUAL_LOC,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm nx test resolver -- --testPathPattern=ast-factory`
Expected: PASS

- [ ] **Step 5: Refactor auto-discovery.ts to use ast-factory**

In `packages/resolver/src/auto-discovery.ts`:

- Remove local `makeObjectContent`, `makeBlock`, `VIRTUAL_LOC` definitions (lines 40-70)
- Add import: `import { makeBlock, makeObjectContent, makeTextContent, VIRTUAL_LOC } from './ast-factory.js';`

- [ ] **Step 6: Run full resolver tests (regression)**

Run: `pnpm nx test resolver`
Expected: All existing tests PASS

- [ ] **Step 7: Export from resolver index**

Add to `packages/resolver/src/index.ts`:

```typescript
export { makeBlock, makeObjectContent, makeTextContent, VIRTUAL_LOC } from './ast-factory.js';
```

- [ ] **Step 8: Commit**

```bash
git add packages/resolver/src/ast-factory.ts packages/resolver/src/__tests__/ast-factory.spec.ts packages/resolver/src/auto-discovery.ts packages/resolver/src/index.ts
git commit -m "$(cat <<'EOF'
refactor(resolver): extract AST factory helpers to shared module

Move makeBlock, makeObjectContent, VIRTUAL_LOC from auto-discovery.ts
to ast-factory.ts for reuse by .md import synthesis.
EOF
)"
```

---

### Task 4: Content Detector

**Files:**

- Create: `packages/resolver/src/content-detector.ts`
- Create: `packages/resolver/src/__tests__/content-detector.spec.ts`

- [ ] **Step 1: Write tests for content detection**

Create `packages/resolver/src/__tests__/content-detector.spec.ts`:

````typescript
import { describe, it, expect } from 'vitest';
import { detectContentType } from '../content-detector.js';

describe('detectContentType', () => {
  it('should detect PRS content when @identity is at start of line', () => {
    const content = '@identity {\n  role: "developer"\n}';
    expect(detectContentType(content)).toBe('prs');
  });

  it('should detect skill when YAML frontmatter is present', () => {
    const content = '---\nname: my-skill\ndescription: A skill\n---\nSkill body here';
    expect(detectContentType(content)).toBe('skill');
  });

  it('should detect raw when no frontmatter and no PRS blocks', () => {
    const content = '# My Skill\n\nDo something useful.';
    expect(detectContentType(content)).toBe('raw');
  });

  it('should NOT detect PRS when @identity is inside fenced code block', () => {
    const content = '# Guide\n\n```promptscript\n@identity {\n  role: "x"\n}\n```\n';
    expect(detectContentType(content)).toBe('raw');
  });

  it('should NOT detect PRS when @identity is inside ~~~ fence', () => {
    const content = '# Guide\n\n~~~\n@identity {\n  role: "x"\n}\n~~~\n';
    expect(detectContentType(content)).toBe('raw');
  });

  it('should NOT detect PRS when only @skills without @identity', () => {
    const content = '@skills {\n  foo: { description: "x" }\n}';
    expect(detectContentType(content)).toBe('raw');
  });

  it('should detect PRS over skill when both @identity and frontmatter', () => {
    const content = '---\nname: x\n---\n@identity {\n  role: "y"\n}';
    expect(detectContentType(content)).toBe('prs');
  });

  it('should handle fenced code with language identifier', () => {
    const content = '```typescript\n@identity { role: "x" }\n```\n';
    expect(detectContentType(content)).toBe('raw');
  });

  it('should handle BOM prefix', () => {
    const content = '\uFEFF---\nname: skill\n---\nBody';
    expect(detectContentType(content)).toBe('skill');
  });

  it('should return raw for empty content', () => {
    expect(detectContentType('')).toBe('raw');
  });
});
````

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm nx test resolver -- --testPathPattern=content-detector`
Expected: FAIL — module not found

- [ ] **Step 3: Implement content-detector.ts**

Create `packages/resolver/src/content-detector.ts`:

````typescript
/**
 * Content type detection for .md files.
 *
 * Determines how a .md file should be processed:
 * - 'prs': Contains @identity block outside fenced code → parse as PromptScript
 * - 'skill': Has YAML frontmatter (---) → parse with parseSkillMd()
 * - 'raw': Plain markdown → create synthetic skill node
 */

/** Strip UTF-8 BOM if present. */
function stripBom(content: string): string {
  return content.charCodeAt(0) === 0xfeff ? content.slice(1) : content;
}

/** Remove content inside fenced code blocks (``` or ~~~). */
function stripFencedCodeBlocks(content: string): string {
  return content.replace(/^(`{3,}|~{3,})[^\n]*\n[\s\S]*?^\1\s*$/gm, '');
}

/** Check if content has @identity at start of line (outside fenced blocks). */
function hasPrsIdentityBlock(content: string): boolean {
  const stripped = stripFencedCodeBlocks(content);
  return /^@identity\b/m.test(stripped);
}

/** Check if content starts with YAML frontmatter. */
function hasYamlFrontmatter(content: string): boolean {
  const trimmed = content.trimStart();
  return trimmed.startsWith('---\n') || trimmed.startsWith('---\r\n');
}

export type ContentType = 'prs' | 'skill' | 'raw';

/**
 * Detect the content type of a .md file.
 *
 * Precedence: PRS (@identity) > skill (frontmatter) > raw
 */
export function detectContentType(content: string): ContentType {
  const clean = stripBom(content);

  if (hasPrsIdentityBlock(clean)) {
    return 'prs';
  }

  if (hasYamlFrontmatter(clean)) {
    return 'skill';
  }

  return 'raw';
}
````

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm nx test resolver -- --testPathPattern=content-detector`
Expected: PASS

- [ ] **Step 5: Export from resolver index**

Add to `packages/resolver/src/index.ts`:

```typescript
export { detectContentType, type ContentType } from './content-detector.js';
```

- [ ] **Step 6: Commit**

```bash
git add packages/resolver/src/content-detector.ts packages/resolver/src/__tests__/content-detector.spec.ts packages/resolver/src/index.ts
git commit -m "$(cat <<'EOF'
feat(resolver): add content detector for .md file type classification

Detects whether a .md file contains PRS blocks (@identity), YAML
frontmatter (skill), or raw markdown. Excludes fenced code blocks
from PRS detection to prevent false positives.
EOF
)"
```

---

## Chunk 2: Local .md Resolution

### Task 5: Loader — Skip `.prs` Append for `.md` Paths

**Files:**

- Modify: `packages/resolver/src/loader.ts`
- Test: `packages/resolver/src/__tests__/loader.spec.ts`

- [ ] **Step 1: Write failing tests**

Add to `packages/resolver/src/__tests__/loader.spec.ts`:

```typescript
describe('.md extension handling', () => {
  it('should NOT append .prs when path ends with .md (resolveRef)', () => {
    const ref = createPathRef('./skills/my-skill.md', { isRelative: true });
    const result = loader.resolveRef(ref, '/project/main.prs');
    expect(result).toMatch(/my-skill\.md$/);
    expect(result).not.toMatch(/\.prs$/);
  });

  it('should NOT append .prs when path ends with .md (toAbsolutePath registry)', () => {
    const result = loader.toAbsolutePath('@org/skills/my-skill.md');
    expect(result).toMatch(/my-skill\.md$/);
    expect(result).not.toMatch(/\.prs$/);
  });

  it('should still append .prs for paths without .md extension', () => {
    const ref = createPathRef('./skills/my-skill', { isRelative: true });
    const result = loader.resolveRef(ref, '/project/main.prs');
    expect(result).toMatch(/my-skill\.prs$/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm nx test resolver -- --testPathPattern=loader`
Expected: FAIL — `.md.prs` appended

- [ ] **Step 3: Update resolveRef() to skip `.prs` for `.md` paths**

In `packages/resolver/src/loader.ts`, modify `resolveRef()` (around line 145):

```typescript
if (ref.isRelative) {
  const dir = dirname(fromFile);
  const rawPath = ref.raw.endsWith('.prs') || ref.raw.endsWith('.md') ? ref.raw : `${ref.raw}.prs`;
  return resolve(dir, rawPath);
}
```

- [ ] **Step 4: Update toAbsolutePath() — registry path (line 124)**

```typescript
const fileName =
  segments.endsWith('.prs') || segments.endsWith('.md') ? segments : `${segments}.prs`;
```

- [ ] **Step 5: Update toAbsolutePath() — local path (line 130)**

```typescript
const fileName = path.endsWith('.prs') || path.endsWith('.md') ? path : `${path}.prs`;
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `pnpm nx test resolver -- --testPathPattern=loader`
Expected: PASS (new + existing)

- [ ] **Step 7: Commit**

```bash
git add packages/resolver/src/loader.ts packages/resolver/src/__tests__/loader.spec.ts
git commit -m "$(cat <<'EOF'
feat(resolver): skip .prs extension append for .md paths in loader

resolveRef() and toAbsolutePath() now preserve .md extension instead
of appending .prs. Paths without extension still get .prs as before.
EOF
)"
```

---

### Task 6: Resolver — `.md` Intercept in `loadAndParse()`

**Files:**

- Modify: `packages/resolver/src/resolver.ts`
- Modify: `packages/resolver/src/skills.ts`
- Test: `packages/resolver/src/__tests__/md-imports.spec.ts`
- Fixtures: `packages/resolver/src/__tests__/__fixtures__/md-imports/`

- [ ] **Step 1: Create test fixtures**

Create fixture files:

`packages/resolver/src/__tests__/__fixtures__/md-imports/skill-with-frontmatter.md`:

```markdown
---
name: test-skill
description: A test skill
---

This is the skill body content.
```

`packages/resolver/src/__tests__/__fixtures__/md-imports/raw-skill.md`:

```markdown
# Raw Skill

This is raw markdown without frontmatter.
```

`packages/resolver/src/__tests__/__fixtures__/md-imports/prs-in-md.md`:

```markdown
@identity {
role: "developer"
}

@standards {
testing: "Write tests for everything"
}
```

`packages/resolver/src/__tests__/__fixtures__/md-imports/main.prs`:

```promptscript
@meta {
  id: "test"
  version: "1.0.0"
}

@use ./skill-with-frontmatter.md

@identity {
  role: "tester"
}
```

- [ ] **Step 2: Write failing integration test**

Create `packages/resolver/src/__tests__/md-imports.spec.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { resolve } from 'path';
import { Resolver } from '../resolver.js';
import { FileLoader } from '../loader.js';

const FIXTURES = resolve(__dirname, '__fixtures__/md-imports');

describe('.md imports', () => {
  it('should resolve @use with .md skill (frontmatter)', async () => {
    const resolver = new Resolver({ registryPath: FIXTURES, localPath: FIXTURES });
    const result = await resolver.resolve(resolve(FIXTURES, 'main.prs'));

    expect(result.errors).toHaveLength(0);
    expect(result.ast).not.toBeNull();

    const skillsBlock = result.ast!.blocks.find((b) => b.name === 'skills');
    expect(skillsBlock).toBeDefined();

    const content = skillsBlock!.content as ObjectContent;
    expect(content.properties['test-skill']).toBeDefined();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm nx test resolver -- --testPathPattern=md-imports`
Expected: FAIL — `.md` file not loaded or parsed incorrectly

- [ ] **Step 4: Extend parseSkillMd() for raw markdown (no frontmatter)**

In `packages/resolver/src/skills.ts`, update `parseSkillMd()` to handle the case where frontmatter is absent — it already does this by returning `bodyContent = content.trim()` when no frontmatter delimiters found. Add a utility to generate name from filename:

```typescript
import { basename } from 'path';

/** Derive skill name from file path (e.g., '/path/to/my-skill.md' → 'my-skill'). */
export function skillNameFromPath(filePath: string): string {
  return basename(filePath, '.md');
}
```

- [ ] **Step 5: Update loadAndParse() with .md intercept**

In `packages/resolver/src/resolver.ts`, modify `loadAndParse()`:

```typescript
private async loadAndParse(
  absPath: string,
  sources: string[],
  errors: ResolveError[]
): Promise<{ ast: Program | null }> {
  let source: string;
  try {
    source = await this.loader.load(absPath);
  } catch (err) {
    if (err instanceof FileNotFoundError) {
      // Directory fallback: strip .prs, check if it's a directory
      if (absPath.endsWith('.prs')) {
        const dirPath = absPath.slice(0, -4);
        const dirResult = await this.tryDirectoryScan(dirPath, sources, errors);
        if (dirResult) return dirResult;
      }
      errors.push(new ResolveError(err.message));
      return { ast: null };
    }
    throw err;
  }

  // .md file intercept
  if (absPath.endsWith('.md')) {
    return this.loadAndParseMd(absPath, source, sources, errors);
  }

  const parseResult = parse(source, { filename: absPath });
  // ... rest unchanged
}
```

- [ ] **Step 6: Implement loadAndParseMd()**

Add new private method in `resolver.ts`:

```typescript
import { detectContentType } from './content-detector.js';
import { parseSkillMd, skillNameFromPath } from './skills.js';
import { makeBlock, makeObjectContent, makeTextContent, VIRTUAL_LOC } from './ast-factory.js';

private async loadAndParseMd(
  absPath: string,
  source: string,
  sources: string[],
  errors: ResolveError[]
): Promise<{ ast: Program | null }> {
  const contentType = detectContentType(source);

  if (contentType === 'prs') {
    // Parse as PromptScript
    const parseResult = parse(source, { filename: absPath });
    if (!parseResult.ast) {
      for (const e of parseResult.errors) {
        errors.push(new ResolveError(e.message, e.location));
      }
      return { ast: null };
    }
    return { ast: parseResult.ast };
  }

  // Skill or raw markdown → synthesize Program
  const parsed = parseSkillMd(source);
  const skillName = parsed.name ?? skillNameFromPath(absPath);

  if (!parsed.name) {
    this.logger.warn(`Missing frontmatter in ${absPath} — using filename "${skillName}" as skill name`);
  }

  const skillProps: Record<string, Value> = {};
  if (parsed.description) {
    skillProps['description'] = parsed.description;
  }
  if (parsed.content) {
    skillProps['content'] = makeTextContent(parsed.content, absPath);
  }

  const program: Program = {
    type: 'Program',
    blocks: [makeBlock('skills', makeObjectContent({ [skillName]: skillProps }))],
    uses: [],
    extends: [],
    loc: VIRTUAL_LOC,
  };

  return { ast: program };
}
```

- [ ] **Step 7: Run test to verify it passes**

Run: `pnpm nx test resolver -- --testPathPattern=md-imports`
Expected: PASS

- [ ] **Step 8: Run full resolver tests (regression)**

Run: `pnpm nx test resolver`
Expected: All PASS

- [ ] **Step 9: Commit**

```bash
git add packages/resolver/src/resolver.ts packages/resolver/src/skills.ts packages/resolver/src/__tests__/md-imports.spec.ts packages/resolver/src/__tests__/__fixtures__/md-imports/
git commit -m "$(cat <<'EOF'
feat(resolver): support .md file imports via @use directive

loadAndParse() now intercepts .md paths, runs content detection, and
synthesizes a Program AST from skill markdown. Supports frontmatter
skills, raw markdown, and PRS-in-.md detection.
EOF
)"
```

---

### Task 7: Resolver — Directory Imports

**Files:**

- Modify: `packages/resolver/src/resolver.ts`
- Test: `packages/resolver/src/__tests__/md-imports.spec.ts`
- Fixtures: `packages/resolver/src/__tests__/__fixtures__/md-imports/skill-dir/`

- [ ] **Step 1: Create directory fixture**

```
packages/resolver/src/__tests__/__fixtures__/md-imports/skill-dir/
  alpha/
    SKILL.md     → "---\nname: alpha\ndescription: Alpha skill\n---\nAlpha body"
  beta/
    beta.md      → "---\nname: beta\ndescription: Beta skill\n---\nBeta body"
```

And `packages/resolver/src/__tests__/__fixtures__/md-imports/main-dir.prs`:

```promptscript
@meta {
  id: "test-dir"
  version: "1.0.0"
}

@use ./skill-dir

@identity {
  role: "tester"
}
```

- [ ] **Step 2: Write failing test for directory import**

```typescript
it('should resolve directory import scanning for skills', async () => {
  const loader = new FileLoader(FIXTURES, FIXTURES);
  const resolver = new Resolver(loader, { logger: silentLogger });
  const result = await resolver.resolve(resolve(FIXTURES, 'main-dir.prs'));

  expect(result.errors).toHaveLength(0);
  const skillsBlock = result.ast!.blocks.find((b) => b.name === 'skills');
  expect(skillsBlock).toBeDefined();

  const content = skillsBlock!.content as ObjectContent;
  expect(content.properties['alpha']).toBeDefined();
  expect(content.properties['beta']).toBeDefined();
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm nx test resolver -- --testPathPattern=md-imports`
Expected: FAIL

- [ ] **Step 4: Implement tryDirectoryScan()**

Add to `resolver.ts`:

```typescript
import { lstat, readdir, readFile } from 'fs/promises';

private async tryDirectoryScan(
  dirPath: string,
  sources: string[],
  errors: ResolveError[]
): Promise<{ ast: Program | null } | null> {
  try {
    const stat = await lstat(dirPath);
    if (!stat.isDirectory()) return null;
  } catch {
    return null;
  }

  this.logger.debug(`Scanning directory for skills: ${dirPath}`);
  const skillProperties = await this.scanDirectoryForSkills(dirPath);

  if (!skillProperties || Object.keys(skillProperties).length === 0) {
    errors.push(new ResolveError(`No skills found in directory: ${dirPath}`));
    return { ast: null };
  }

  const program: Program = {
    type: 'Program',
    blocks: [makeBlock('skills', makeObjectContent(skillProperties))],
    uses: [],
    extends: [],
    loc: VIRTUAL_LOC,
  };

  return { ast: program };
}

private async scanDirectoryForSkills(
  dir: string,
  depth = 0
): Promise<Record<string, Value>> {
  if (depth >= 3) return {};

  const properties: Record<string, Value> = {};
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return {};
  }

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.isSymbolicLink()) continue;

    const subdir = resolve(dir, entry.name);

    // Convention 1: SKILL.md
    const skillMdPath = resolve(subdir, 'SKILL.md');
    // Convention 2: <dirname>.md
    const dirnameMdPath = resolve(subdir, `${entry.name}.md`);

    let mdPath: string | null = null;
    try {
      await lstat(skillMdPath);
      mdPath = skillMdPath;
    } catch {
      try {
        await lstat(dirnameMdPath);
        mdPath = dirnameMdPath;
      } catch {
        // Recurse deeper
        const nested = await this.scanDirectoryForSkills(subdir, depth + 1);
        Object.assign(properties, nested);
        continue;
      }
    }

    if (mdPath) {
      try {
        const raw = await readFile(mdPath, 'utf-8');
        const parsed = parseSkillMd(raw);
        const skillName = parsed.name ?? entry.name;

        const skillProps: Record<string, Value> = {};
        if (parsed.description) skillProps['description'] = parsed.description;
        if (parsed.content) {
          skillProps['content'] = makeTextContent(parsed.content, mdPath);
        }
        properties[skillName] = skillProps;
      } catch {
        // Skip unreadable skill files
      }
    }
  }

  return properties;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm nx test resolver -- --testPathPattern=md-imports`
Expected: PASS

- [ ] **Step 6: Run full resolver tests**

Run: `pnpm nx test resolver`
Expected: All PASS

- [ ] **Step 7: Commit**

```bash
git add packages/resolver/src/resolver.ts packages/resolver/src/__tests__/
git commit -m "$(cat <<'EOF'
feat(resolver): support directory imports scanning for SKILL.md and <dirname>.md

@use ./dir now scans subdirectories for skills. Supports SKILL.md
(existing convention) and <dirname>.md (new convention). Scans up to
depth 3, consistent with discoverSkillDirs().
EOF
)"
```

---

## Chunk 3: Remote Resolution & Lock File

### Task 8: Git Registry — `.md` Extension Handling

**Files:**

- Modify: `packages/resolver/src/git-registry.ts`
- Modify: `packages/resolver/src/resolver.ts` (resolveRegistryImport)

- [ ] **Step 1: Write failing test for git-registry .md path**

Add to git-registry tests:

```typescript
it('should NOT append .prs when path ends with .md', () => {
  const result = registry['resolveFilePath']('/repo', 'skills/my-skill.md');
  expect(result).toMatch(/my-skill\.md$/);
  expect(result).not.toMatch(/\.prs$/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm nx test resolver -- --testPathPattern=git-registry`
Expected: FAIL

- [ ] **Step 3: Update resolveFilePath()**

In `packages/resolver/src/git-registry.ts`, modify `resolveFilePath()`:

```typescript
private resolveFilePath(repoPath: string, relativePath: string): string {
  let cleanPath = relativePath;

  // Add .prs extension if not present, not .md, and not ending with /
  if (!cleanPath.endsWith('.prs') && !cleanPath.endsWith('.md') && !cleanPath.endsWith('/')) {
    cleanPath += '.prs';
  }

  if (this.subPath) {
    return join(repoPath, this.subPath, cleanPath);
  }
  return join(repoPath, cleanPath);
}
```

- [ ] **Step 4: Update resolveRegistryImport() for `.md` intercept**

In `packages/resolver/src/resolver.ts`, modify `resolveRegistryImport()` — the `.prs` extension append around line 457:

```typescript
// Resolve the file path within the cached repo
const isMdPath = subPath.endsWith('.md');
const prsFileName = isMdPath ? subPath : subPath.endsWith('.prs') ? subPath : `${subPath}.prs`;
const fullPath = join(cachePath, prsFileName);

let resolvedAST: Program | null = null;

if (existsSync(fullPath)) {
  if (isMdPath) {
    // .md file — use content detection
    const source = await this.loader.load(fullPath);
    const loadResult = await this.loadAndParseMd(fullPath, source, sources, errors);
    resolvedAST = loadResult.ast;
  } else {
    // .prs file — parse normally
    const source = await this.loader.load(fullPath);
    const parseResult = parse(source, { filename: fullPath });
    if (parseResult.ast) {
      resolvedAST = parseResult.ast;
    } else {
      for (const e of parseResult.errors) {
        errors.push(new ResolveError(e.message, e.location));
      }
    }
  }
} else {
  // Directory or auto-discovery fallback
  const discoverDir = join(cachePath, subPath);
  // Try directory scan first
  const dirResult = await this.tryDirectoryScan(discoverDir, sources, errors);
  if (dirResult?.ast) {
    resolvedAST = dirResult.ast;
  } else {
    // Fall back to auto-discovery
    resolvedAST = await discoverNativeContent(discoverDir);
    if (!resolvedAST) {
      errors.push(
        new ResolveError(
          `Cannot resolve registry import: no .prs file, .md file, or native content at '${subPath}' in ${repoUrl}`
        )
      );
    }
  }
}
```

- [ ] **Step 5: Run full resolver tests**

Run: `pnpm nx test resolver`
Expected: All PASS

- [ ] **Step 6: Commit**

```bash
git add packages/resolver/src/git-registry.ts packages/resolver/src/resolver.ts
git commit -m "$(cat <<'EOF'
feat(resolver): support .md imports in remote registry resolution

resolveFilePath() skips .prs append for .md paths. resolveRegistryImport()
routes .md files through content detection and directory scanning.
EOF
)"
```

---

### Task 9: Lock File — YAML Safety & `source` Field Handling

**Files:**

- Modify: `packages/cli/src/commands/compile.ts`
- Modify: `packages/cli/src/commands/lock.ts`
- Modify: `packages/cli/src/commands/update.ts`
- Modify: `packages/cli/src/commands/vendor.ts`

- [ ] **Step 1: Add `maxAliasCount` to all parseYaml calls**

In each of the 4 files, find `parseYaml(...)` and add options:

```typescript
// Before:
const parsed = parseYaml(raw);
// After:
const parsed = parseYaml(raw, { maxAliasCount: 100 });
```

- [ ] **Step 2: Update lock.ts to preserve `source: 'md'` entries**

In `packages/cli/src/commands/lock.ts`, when regenerating the lock file, preserve entries where `source === 'md'`:

```typescript
// Preserve .md-sourced entries from previous lock
const mdEntries: Record<string, LockfileDependency> = {};
if (existingLock) {
  for (const [key, dep] of Object.entries(existingLock.dependencies)) {
    if (dep.source === 'md') {
      mdEntries[key] = dep;
    }
  }
}

// After generating new dependencies, merge:
const allDeps = { ...newDeps, ...mdEntries };
```

- [ ] **Step 3: Run CLI tests**

Run: `pnpm nx test cli`
Expected: All PASS

- [ ] **Step 4: Commit**

```bash
git add packages/cli/src/commands/compile.ts packages/cli/src/commands/lock.ts packages/cli/src/commands/update.ts packages/cli/src/commands/vendor.ts
git commit -m "$(cat <<'EOF'
fix(cli): add YAML maxAliasCount safety and preserve .md lock entries

Add maxAliasCount: 100 to all parseYaml() calls parsing lock files.
Lock command now preserves entries with source: 'md' during regeneration.
EOF
)"
```

---

## Chunk 4: Validation & Security

### Task 10: Path Traversal Validation

**Files:**

- Modify: `packages/resolver/src/loader.ts`
- Modify: `packages/resolver/src/git-registry.ts`

- [ ] **Step 1: Write failing test for path traversal**

```typescript
it('should reject path traversal outside project root', () => {
  const ref = createPathRef('./../../etc/passwd', { isRelative: true });
  expect(() => loader.resolveRef(ref, '/project/main.prs')).toThrow(/path traversal/i);
});
```

- [ ] **Step 2: Run test to verify it fails**

Expected: FAIL — no traversal check exists

- [ ] **Step 3: Add traversal check in resolveRef()**

```typescript
if (ref.isRelative) {
  const dir = dirname(fromFile);
  const rawPath = ref.raw.endsWith('.prs') || ref.raw.endsWith('.md') ? ref.raw : `${ref.raw}.prs`;
  const resolved = resolve(dir, rawPath);

  // Path traversal check
  const projectRoot = this.localPath;
  if (!resolved.startsWith(projectRoot)) {
    throw new PSError(`Path traversal outside project root is not allowed: ${ref.raw}`);
  }

  return resolved;
}
```

- [ ] **Step 4: Run test to verify it passes**

Expected: PASS

- [ ] **Step 5: Add similar check to git-registry resolveFilePath()**

After `join()`, verify path is under `repoPath`.

- [ ] **Step 6: Run full tests**

Run: `pnpm nx test resolver`
Expected: All PASS

- [ ] **Step 7: Commit**

```bash
git add packages/resolver/src/loader.ts packages/resolver/src/git-registry.ts
git commit -m "$(cat <<'EOF'
fix(resolver): add path traversal validation for local and remote imports

resolveRef() and resolveFilePath() now verify resolved paths stay within
project root (local) or cloned repo root (remote).
EOF
)"
```

---

### Task 11: Validator — Duplicate Skills Rule

**Files:**

- Create: `packages/validator/src/rules/duplicate-skills.ts`
- Create: `packages/validator/src/rules/__tests__/duplicate-skills.spec.ts`
- Modify: `packages/validator/src/index.ts`

- [ ] **Step 1: Write tests**

- [ ] **Step 2: Implement duplicate-skills rule (PS020)**

Check for:

- Duplicate skill names across different `@use` imports
- Duplicate aliases across `@use` directives
- Pre-merge collision with existing `@skills` block entries

- [ ] **Step 3: Register in allRules array**

- [ ] **Step 4: Run all validator tests**

Run: `pnpm nx test validator`
Expected: All PASS

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(validator): add duplicate skill name detection rule (PS020)"
```

---

## Chunk 5: CLI `prs skills` Command

### Task 12: CLI — `prs skills add` Command

**Files:**

- Create: `packages/cli/src/commands/skills.ts`
- Create: `packages/cli/src/commands/__tests__/skills.spec.ts`
- Modify: `packages/cli/src/commands/index.ts`

- [ ] **Step 1: Write tests for source validation**

- [ ] **Step 2: Implement `prs skills add` with source validation, .prs file modification, lock update**

- [ ] **Step 3: Implement `prs skills remove`**

- [ ] **Step 4: Implement `prs skills list`**

- [ ] **Step 5: Implement `prs skills update`**

- [ ] **Step 6: Implement `prs skills search`**

- [ ] **Step 7: Add `--dry-run` flag**

- [ ] **Step 8: Register in CLI index**

- [ ] **Step 9: Run all CLI tests**

- [ ] **Step 10: Commit**

```bash
git commit -m "feat(cli): add prs skills command for skill management"
```

---

## Chunk 6: Auto-Discovery Update & Integration

### Task 13: Auto-Discovery — `<dirname>.md` Convention

**Files:**

- Modify: `packages/resolver/src/auto-discovery.ts`

- [ ] **Step 1: Write test for `<dirname>.md` discovery**

- [ ] **Step 2: Update discoverSkills() to check `<dirname>.md` fallback**

- [ ] **Step 3: Run resolver tests**

- [ ] **Step 4: Commit**

```bash
git commit -m "feat(resolver): support <dirname>.md convention in auto-discovery"
```

---

### Task 14: Duplicate Skill Pre-Merge Check in resolveUses()

**Files:**

- Modify: `packages/resolver/src/imports.ts`

- [ ] **Step 1: Write test for merge collision detection**

- [ ] **Step 2: Add pre-merge check before mergeBlocks()**

- [ ] **Step 3: Run resolver tests**

- [ ] **Step 4: Commit**

```bash
git commit -m "fix(resolver): detect duplicate skill names before merge"
```

---

## Chunk 7: Documentation & README

### Task 15: Documentation Updates

**Files:**

- Modify: `docs/guides/npx-skills.md`
- Modify: `.promptscript/skills/promptscript/SKILL.md`
- Modify: `docs/guides/building-skills.md`
- Create: `docs/guides/markdown-imports.md`

- [ ] **Step 1: Create `docs/guides/markdown-imports.md`** — full guide

- [ ] **Step 2: Update `docs/guides/npx-skills.md`** — add note about PromptScript native support

- [ ] **Step 3: Update `.promptscript/skills/promptscript/SKILL.md`** — add `@use` .md syntax

- [ ] **Step 4: Update `docs/guides/building-skills.md`** — mention direct import via `@use`

- [ ] **Step 5: Commit**

```bash
git commit -m "docs: add markdown imports guide and update skill documentation"
```

---

### Task 16: CLI README — npm Registry Marketing

**Files:**

- Modify: `packages/cli/README.md`

- [ ] **Step 1: Read current README**

- [ ] **Step 2: Rewrite with attention-grabbing techniques**

Focus areas:

- Hook headline: "One compiler. Every AI coding agent. Zero external tools."
- Problem-solution framing: "Stop juggling skills.sh, npx skills, and manual file management"
- Social proof: "Compiles to 30+ AI tools including Claude Code, GitHub Copilot, Cursor"
- Feature showcase: `@use github.com/org/skills/frontend-design@1.0.0` — one line, done
- All-in-one positioning: "Prompt-as-Code" paradigm
- Clear CTA: quick start in 3 commands

- [ ] **Step 3: Commit**

```bash
git commit -m "docs(cli): update npm README with markdown imports as headline feature"
```

---

## Chunk 8: Verification

### Task 17: Full Verification Pipeline

- [ ] **Step 1: Format**
      Run: `pnpm run format`

- [ ] **Step 2: Lint**
      Run: `pnpm run lint`

- [ ] **Step 3: Typecheck**
      Run: `pnpm run typecheck`

- [ ] **Step 4: Test all**
      Run: `pnpm run test`

- [ ] **Step 5: Validate .prs files**
      Run: `pnpm prs validate --strict`

- [ ] **Step 6: Schema check**
      Run: `pnpm schema:check`

- [ ] **Step 7: Skill check**
      Run: `pnpm skill:check`

- [ ] **Step 8: Fix any failures and re-run**

- [ ] **Step 9: Final commit if needed**
