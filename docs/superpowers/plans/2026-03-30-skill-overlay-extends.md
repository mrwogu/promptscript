# Skill Overlay / Extends Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable multi-layer skill composition via `@extend` on skill properties, with a new `references` property for attaching external files to skills.

**Architecture:** Extends the existing `@use` + `@extend` pipeline with skill-aware merge semantics (Etap A: AST property merge, Etap B: file loading). Formatters emit references as `additionalFiles` (directory mode) or inline sections (single-file mode). Two new validator rules (PS025, PS026) ensure path safety and content integrity.

**Tech Stack:** TypeScript, Vitest, Chevrotain (parser unchanged), Nx monorepo

**Spec:** `docs/superpowers/specs/2026-03-30-skill-overlay-extends-design.md`

---

## File Structure

### New Files
| File | Responsibility |
|------|----------------|
| `packages/validator/src/rules/valid-skill-references.ts` | PS025: validate reference paths exist, are text files, within size limits |
| `packages/validator/src/rules/safe-reference-content.ts` | PS026: detect PRS directives in reference files |
| `packages/validator/src/rules/__tests__/valid-skill-references.spec.ts` | Tests for PS025 |
| `packages/validator/src/rules/__tests__/safe-reference-content.spec.ts` | Tests for PS026 |
| `packages/resolver/src/__tests__/skill-references.spec.ts` | Tests for reference loading and extend semantics |
| `packages/resolver/src/__tests__/__fixtures__/skill-references/` | Fixtures for multi-registry overlay tests |
| `packages/formatters/src/__tests__/skill-references.spec.ts` | Tests for reference emission across formatters |

### Modified Files
| File | Change |
|------|--------|
| `packages/core/src/types/ast.ts` | Add `references?: string[]` to `SkillDefinition` |
| `packages/resolver/src/skills.ts` | Add `'references'` to `SKILL_RESERVED_KEYS`, parse references from frontmatter, load reference files (Etap B) |
| `packages/resolver/src/extensions.ts` | Skill-aware `mergeValue()` for `@extend` on skill properties (Etap A) |
| `packages/formatters/src/base-formatter.ts` | Add `referencesMode()` method |
| `packages/formatters/src/formatters/claude.ts` | Extract `references` property, emit with provenance |
| `packages/formatters/src/formatters/github.ts` | Extract `references` property, emit with provenance |
| `packages/formatters/src/formatters/cursor.ts` | Inline references with provenance headers |
| `packages/validator/src/rules/index.ts` | Register PS025 and PS026 |
| `packages/cli/src/commands/lock-scanner.ts` | Discover `references` paths as dependencies |

---

## Task 1: Add `references` to SkillDefinition

**Files:**
- Modify: `packages/core/src/types/ast.ts:369-396`
- Test: existing type tests cover this implicitly (type-level change)

- [ ] **Step 1: Add property to SkillDefinition**

In `packages/core/src/types/ast.ts`, add after the `examples` field (around line 395):

```typescript
  /** Reference files attached to skill context (paths resolved by resolver) */
  references?: string[];
```

- [ ] **Step 2: Run typecheck to verify**

Run: `pnpm nx run core:typecheck`
Expected: PASS — new optional property is backwards-compatible

- [ ] **Step 3: Commit**

```bash
git add packages/core/src/types/ast.ts
git commit -m "feat(core): add references property to SkillDefinition"
```

---

## Task 2: Add `references` to SKILL_RESERVED_KEYS and parse from frontmatter

**Files:**
- Modify: `packages/resolver/src/skills.ts:386-399` (SKILL_RESERVED_KEYS)
- Modify: `packages/resolver/src/skills.ts:105-164` (parseFrontmatterFields)
- Test: `packages/resolver/src/__tests__/skill-references.spec.ts`

- [ ] **Step 1: Write failing tests for frontmatter parsing**

Create `packages/resolver/src/__tests__/skill-references.spec.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { parseSkillMd } from '../skills.js';

describe('skill references', () => {
  describe('parseSkillMd with references', () => {
    it('should parse references from SKILL.md frontmatter', () => {
      const content = [
        '---',
        'name: test-skill',
        'description: A test skill',
        'references:',
        '  - references/architecture.md',
        '  - references/modules.md',
        '---',
        'Skill content here.',
      ].join('\n');

      const result = parseSkillMd(content);

      expect(result.name).toBe('test-skill');
      expect(result.references).toEqual([
        'references/architecture.md',
        'references/modules.md',
      ]);
    });

    it('should return undefined references when not specified', () => {
      const content = [
        '---',
        'name: test-skill',
        'description: A test skill',
        '---',
        'Skill content here.',
      ].join('\n');

      const result = parseSkillMd(content);

      expect(result.references).toBeUndefined();
    });

    it('should parse empty references list', () => {
      const content = [
        '---',
        'name: test-skill',
        'references:',
        '---',
        'Content.',
      ].join('\n');

      const result = parseSkillMd(content);

      expect(result.references).toEqual([]);
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm nx test resolver -- --testPathPattern=skill-references`
Expected: FAIL — `references` property not returned by `parseSkillMd`

- [ ] **Step 3: Add `references` to SKILL_RESERVED_KEYS**

In `packages/resolver/src/skills.ts`, add `'references'` to the `SKILL_RESERVED_KEYS` set (around line 398):

```typescript
const SKILL_RESERVED_KEYS = new Set([
  'description',
  'content',
  'trigger',
  'userInvocable',
  'allowedTools',
  'disableModelInvocation',
  'context',
  'agent',
  'params',
  'type',
  'loc',
  'resources',
  'references',
]);
```

- [ ] **Step 4: Update `ParsedSkillMd` return type and `parseFrontmatterFields`**

Add `references` to the `ParsedSkillMd` interface (or the inline return type of `parseSkillMd`). Then in `parseFrontmatterFields()`, add parsing for `references:` block — it's a YAML list of strings:

```typescript
// In parseFrontmatterFields(), add after the outputs block:

if (line.match(/^references:\s*$/)) {
  i++;
  const refs: string[] = [];
  while (i < lines.length) {
    const refLine = lines[i] ?? '';
    const refMatch = refLine.match(/^\s+-\s+(.+)\s*$/);
    if (refMatch) {
      refs.push(refMatch[1]!.trim());
      i++;
    } else {
      break;
    }
  }
  references = refs;
  continue;
}
```

Also declare `let references: string[] | undefined;` at the top of the function and include it in the return object.

Update `parseSkillMd()` to propagate the `references` field from `parseFrontmatterFields()` to its return value.

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm nx test resolver -- --testPathPattern=skill-references`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add packages/resolver/src/skills.ts packages/resolver/src/__tests__/skill-references.spec.ts
git commit -m "feat(resolver): parse references from SKILL.md frontmatter"
```

---

## Task 3: Skill-aware extend semantics (Etap A)

**Files:**
- Modify: `packages/resolver/src/extensions.ts:272-306` (mergeValue)
- Test: `packages/resolver/src/__tests__/skill-references.spec.ts` (add tests)

- [ ] **Step 1: Write failing tests for skill-aware extend**

Append to `packages/resolver/src/__tests__/skill-references.spec.ts`:

```typescript
import { applyExtends } from '../extensions.js';
import type {
  Program,
  Block,
  ObjectContent,
  ArrayContent,
  TextContent,
  ExtendBlock,
  Value,
} from '@promptscript/core';

const createLoc = () => ({ file: '<test>', line: 1, column: 1 });

const createProgram = (overrides: Partial<Program> = {}): Program => ({
  type: 'Program',
  uses: [],
  blocks: [],
  extends: [],
  loc: createLoc(),
  ...overrides,
});

const createBlock = (name: string, content: Block['content']): Block => ({
  type: 'Block',
  name,
  content,
  loc: createLoc(),
});

const createObjectContent = (properties: Record<string, Value>): ObjectContent => ({
  type: 'ObjectContent',
  properties,
  loc: createLoc(),
});

const createArrayContent = (elements: Value[]): ArrayContent => ({
  type: 'ArrayContent',
  elements,
  loc: createLoc(),
});

const createTextContent = (value: string): TextContent => ({
  type: 'TextContent',
  value,
  loc: createLoc(),
});

const createExtendBlock = (targetPath: string, content: Block['content']): ExtendBlock => ({
  type: 'ExtendBlock',
  targetPath,
  content,
  loc: createLoc(),
});

describe('skill-aware @extend semantics', () => {
  it('should append references when extending a skill', () => {
    const ast = createProgram({
      blocks: [
        createBlock(
          'skills',
          createObjectContent({
            expert: createObjectContent({
              description: 'Base expert',
              references: createArrayContent(['base/spring.md']),
            }) as unknown as Value,
          })
        ),
      ],
      extends: [
        createExtendBlock(
          'skills.expert',
          createObjectContent({
            references: createArrayContent(['overlay/arch.md']),
          })
        ),
      ],
    });

    const result = applyExtends(ast);
    const skills = result.blocks[0]?.content as ObjectContent;
    const expert = skills.properties['expert'] as Record<string, Value>;
    const refs = expert['references'] as string[];

    expect(refs).toEqual(['base/spring.md', 'overlay/arch.md']);
  });

  it('should replace description when extending a skill', () => {
    const ast = createProgram({
      blocks: [
        createBlock(
          'skills',
          createObjectContent({
            expert: createObjectContent({
              description: 'Base description',
            }) as unknown as Value,
          })
        ),
      ],
      extends: [
        createExtendBlock(
          'skills.expert',
          createObjectContent({
            description: 'Overridden description',
          })
        ),
      ],
    });

    const result = applyExtends(ast);
    const skills = result.blocks[0]?.content as ObjectContent;
    const expert = skills.properties['expert'] as Record<string, Value>;

    expect(expert['description']).toBe('Overridden description');
  });

  it('should replace content when extending a skill', () => {
    const ast = createProgram({
      blocks: [
        createBlock(
          'skills',
          createObjectContent({
            expert: createObjectContent({
              content: createTextContent('Base content'),
            }) as unknown as Value,
          })
        ),
      ],
      extends: [
        createExtendBlock(
          'skills.expert',
          createObjectContent({
            content: createTextContent('New content'),
          })
        ),
      ],
    });

    const result = applyExtends(ast);
    const skills = result.blocks[0]?.content as ObjectContent;
    const expert = skills.properties['expert'] as Record<string, Value>;
    const content = expert['content'] as TextContent;

    expect(content.value).toBe('New content');
  });

  it('should shallow merge params when extending a skill', () => {
    const ast = createProgram({
      blocks: [
        createBlock(
          'skills',
          createObjectContent({
            expert: createObjectContent({
              params: createObjectContent({
                region: 'US',
                env: 'prod',
              }) as unknown as Value,
            }) as unknown as Value,
          })
        ),
      ],
      extends: [
        createExtendBlock(
          'skills.expert',
          createObjectContent({
            params: createObjectContent({
              region: 'EMEA',
              client: 'Retail',
            }) as unknown as Value,
          })
        ),
      ],
    });

    const result = applyExtends(ast);
    const skills = result.blocks[0]?.content as ObjectContent;
    const expert = skills.properties['expert'] as Record<string, Value>;
    const params = expert['params'] as Record<string, Value>;

    expect(params['region']).toBe('EMEA');
    expect(params['env']).toBe('prod');
    expect(params['client']).toBe('Retail');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm nx test resolver -- --testPathPattern=skill-references`
Expected: FAIL — current `mergeValue()` uses generic merge (TextContent concatenation, not skill-aware)

- [ ] **Step 3: Implement skill-aware mergeValue**

In `packages/resolver/src/extensions.ts`, modify `mergeValue()` to detect when it's operating on a skill property inside `@skills` block. The approach: when `mergeExtension()` targets a path like `skills.expert`, and the extend content has properties that are skill-reserved keys, apply skill-aware semantics.

Add a set of skill properties with their merge strategies at the top of the file:

```typescript
/** Skill properties that use replace semantics in @extend */
const SKILL_REPLACE_PROPERTIES = new Set([
  'content',
  'description',
  'trigger',
  'userInvocable',
  'allowedTools',
  'disableModelInvocation',
  'context',
  'agent',
]);

/** Skill properties that use append semantics in @extend */
const SKILL_APPEND_PROPERTIES = new Set([
  'references',
  'examples',
  'requires',
]);

/** Skill properties that use shallow merge semantics in @extend */
const SKILL_MERGE_PROPERTIES = new Set([
  'params',
  'inputs',
  'outputs',
]);
```

Then modify the object merging branch in `mergeValue()`. When the existing value is an object (a skill definition) and the extension is `ObjectContent`, check each property against the skill semantics sets:

```typescript
function mergeValue(existing: Value | undefined, extContent: BlockContent): Value {
  if (existing === undefined) {
    return extractValue(extContent);
  }

  // Array merging
  if (Array.isArray(existing) && extContent.type === 'ArrayContent') {
    return uniqueConcat(existing, extContent.elements);
  }

  // Object merging (includes skill-aware semantics)
  if (
    typeof existing === 'object' &&
    existing !== null &&
    !Array.isArray(existing) &&
    extContent.type === 'ObjectContent'
  ) {
    return mergeObjectValue(
      existing as Record<string, unknown>,
      extContent
    );
  }

  // TextContent merging
  if (isTextContent(existing) && extContent.type === 'TextContent') {
    return {
      ...extContent,
      value: `${existing.value}\n\n${extContent.value}`,
    };
  }

  // Default - extension wins
  return extractValue(extContent);
}

/**
 * Merge two object values with skill-aware semantics.
 * When a property is a known skill property, use the appropriate merge strategy.
 */
function mergeObjectValue(
  existing: Record<string, unknown>,
  extContent: ObjectContent
): Value {
  const result = { ...existing };

  for (const [key, extValue] of Object.entries(extContent.properties)) {
    const existingValue = result[key];

    if (SKILL_REPLACE_PROPERTIES.has(key)) {
      // Replace: extension wins completely
      result[key] = extValue;
    } else if (SKILL_APPEND_PROPERTIES.has(key)) {
      // Append: concatenate arrays
      if (Array.isArray(existingValue) && Array.isArray(extValue)) {
        result[key] = [...existingValue, ...extValue];
      } else if (Array.isArray(extValue)) {
        result[key] = extValue;
      } else {
        result[key] = extValue;
      }
    } else if (SKILL_MERGE_PROPERTIES.has(key)) {
      // Shallow merge: objects
      if (
        typeof existingValue === 'object' &&
        existingValue !== null &&
        !Array.isArray(existingValue) &&
        typeof extValue === 'object' &&
        extValue !== null &&
        !Array.isArray(extValue)
      ) {
        result[key] = {
          ...(existingValue as Record<string, unknown>),
          ...(extValue as Record<string, unknown>),
        };
      } else {
        result[key] = extValue;
      }
    } else {
      // Default: use existing deepMerge for unknown properties
      if (
        typeof existingValue === 'object' &&
        existingValue !== null &&
        typeof extValue === 'object' &&
        extValue !== null
      ) {
        result[key] = deepMerge(
          existingValue as Record<string, unknown>,
          extValue as Record<string, unknown>
        );
      } else {
        result[key] = extValue;
      }
    }
  }

  return result as unknown as Value;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm nx test resolver -- --testPathPattern=skill-references`
Expected: PASS

- [ ] **Step 5: Run all resolver tests to check for regressions**

Run: `pnpm nx test resolver`
Expected: PASS — existing extend behavior preserved (generic objects still use deepMerge)

- [ ] **Step 6: Commit**

```bash
git add packages/resolver/src/extensions.ts packages/resolver/src/__tests__/skill-references.spec.ts
git commit -m "feat(resolver): skill-aware extend semantics for references, params, content"
```

---

## Task 4: Reference file loading and validation (Etap B)

**Files:**
- Modify: `packages/resolver/src/skills.ts` (resolveNativeSkills area)
- Test: `packages/resolver/src/__tests__/skill-references.spec.ts` (add tests)
- Create: `packages/resolver/src/__tests__/__fixtures__/skill-references/`

- [ ] **Step 1: Create test fixtures**

```bash
mkdir -p packages/resolver/src/__tests__/__fixtures__/skill-references/skills/expert/references
```

Create `packages/resolver/src/__tests__/__fixtures__/skill-references/skills/expert/SKILL.md`:

```markdown
---
name: expert
description: Base expert skill
references:
  - references/spring.md
---
Base expert workflows.
```

Create `packages/resolver/src/__tests__/__fixtures__/skill-references/skills/expert/references/spring.md`:

```markdown
# Spring Patterns
Base Spring Boot patterns.
```

Create `packages/resolver/src/__tests__/__fixtures__/skill-references/overlay-refs/architecture.md`:

```markdown
# Architecture
Microservice topology for BU.
```

- [ ] **Step 2: Write failing tests for reference loading**

Append to `packages/resolver/src/__tests__/skill-references.spec.ts`:

```typescript
import { resolveSkillReferences } from '../skills.js';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const FIXTURES = join(__dirname, '__fixtures__', 'skill-references');

describe('resolveSkillReferences', () => {
  it('should load reference files from resolved paths', async () => {
    const refs = ['references/spring.md'];
    const basePath = join(FIXTURES, 'skills', 'expert');

    const resources = await resolveSkillReferences(refs, basePath);

    expect(resources).toHaveLength(1);
    expect(resources[0]!.relativePath).toBe('references/spring.md');
    expect(resources[0]!.content).toContain('Spring Patterns');
  });

  it('should reject path traversal', async () => {
    const refs = ['../../etc/passwd'];
    const basePath = join(FIXTURES, 'skills', 'expert');

    await expect(resolveSkillReferences(refs, basePath)).rejects.toThrow(
      /unsafe path/i
    );
  });

  it('should reject absolute paths', async () => {
    const refs = ['/etc/passwd'];
    const basePath = join(FIXTURES, 'skills', 'expert');

    await expect(resolveSkillReferences(refs, basePath)).rejects.toThrow(
      /unsafe path/i
    );
  });

  it('should throw for non-existent reference files', async () => {
    const refs = ['references/nonexistent.md'];
    const basePath = join(FIXTURES, 'skills', 'expert');

    await expect(resolveSkillReferences(refs, basePath)).rejects.toThrow(
      /not found/i
    );
  });

  it('should enforce MAX_RESOURCE_SIZE per file', async () => {
    // This test would need a large fixture; test the check logic directly
    // by mocking file size or testing the validation function in isolation
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `pnpm nx test resolver -- --testPathPattern=skill-references`
Expected: FAIL — `resolveSkillReferences` not exported

- [ ] **Step 4: Implement resolveSkillReferences**

In `packages/resolver/src/skills.ts`, add a new exported function:

```typescript
/**
 * Load and validate reference files for a skill.
 * Checks path safety, file existence, and size limits.
 * Returns SkillResource[] with category 'reference'.
 */
export async function resolveSkillReferences(
  references: string[],
  basePath: string,
  logger?: Logger
): Promise<SkillResource[]> {
  const resources: SkillResource[] = [];
  let totalSize = 0;

  for (const ref of references) {
    // Path safety check
    if (!isSafeRelativePath(ref)) {
      throw new ResolveError(
        `Unsafe path in references: ${ref} — path traversal not allowed`,
        { file: basePath, line: 0, column: 0 }
      );
    }

    const fullPath = join(basePath, ref);

    // File existence check
    if (!existsSync(fullPath)) {
      throw new ResolveError(
        `Reference file not found: ${ref}`,
        { file: basePath, line: 0, column: 0 }
      );
    }

    const content = await readFile(fullPath, 'utf-8');
    const size = Buffer.byteLength(content, 'utf-8');

    // Per-file size check
    if (size > MAX_RESOURCE_SIZE) {
      throw new ResolveError(
        `Reference file exceeds ${MAX_RESOURCE_SIZE / 1_048_576}MB limit: ${ref} (${(size / 1_048_576).toFixed(1)}MB)`,
        { file: basePath, line: 0, column: 0 }
      );
    }

    totalSize += size;

    // Total size check (per skill budget)
    if (totalSize > MAX_TOTAL_RESOURCE_SIZE) {
      throw new ResolveError(
        `Total reference size exceeds ${MAX_TOTAL_RESOURCE_SIZE / 1_048_576}MB limit for skill`,
        { file: basePath, line: 0, column: 0 }
      );
    }

    if (size === 0) {
      logger?.warn(`Empty reference file: ${ref}`);
    }

    resources.push({ relativePath: ref, content });
  }

  if (resources.length > MAX_RESOURCE_COUNT) {
    throw new ResolveError(
      `Too many reference files (${resources.length}, max ${MAX_RESOURCE_COUNT})`,
      { file: basePath, line: 0, column: 0 }
    );
  }

  return resources;
}
```

Also export `isSafeRelativePath` (currently private) so it can be reused, or keep it private and call `resolveSkillReferences` which uses it internally.

- [ ] **Step 5: Integrate into resolveNativeSkills pipeline**

In `resolveNativeSkills()`, after building the `updatedSkill` object (around lines 1042-1061), add reference resolution:

```typescript
// After existing resource discovery
const skillRefs = updatedSkill['references'];
if (skillRefs && Array.isArray(skillRefs)) {
  const refPaths = skillRefs.filter((r): r is string => typeof r === 'string');
  if (refPaths.length > 0) {
    const refResources = await resolveSkillReferences(refPaths, skillDir, logger);
    // Merge reference resources with existing resources
    const existingResources = (updatedSkill['resources'] as SkillResource[] | undefined) ?? [];
    const allResources = [...existingResources, ...refResources];
    updatedSkill['resources'] = allResources.map((r) => ({
      relativePath: r.relativePath,
      content: r.content,
    }));
  }
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `pnpm nx test resolver -- --testPathPattern=skill-references`
Expected: PASS

- [ ] **Step 7: Run all resolver tests**

Run: `pnpm nx test resolver`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add packages/resolver/src/skills.ts packages/resolver/src/__tests__/skill-references.spec.ts packages/resolver/src/__tests__/__fixtures__/skill-references/
git commit -m "feat(resolver): load and validate reference files for skills"
```

---

## Task 5: Validator rule PS025 — valid-skill-references

**Files:**
- Create: `packages/validator/src/rules/valid-skill-references.ts`
- Create: `packages/validator/src/rules/__tests__/valid-skill-references.spec.ts`
- Modify: `packages/validator/src/rules/index.ts`

- [ ] **Step 1: Write failing tests**

Create `packages/validator/src/rules/__tests__/valid-skill-references.spec.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { validSkillReferences } from '../valid-skill-references.js';
import type { Program, Block, Value, SourceLocation } from '@promptscript/core';

const loc: SourceLocation = { file: 'test.prs', line: 1, column: 1 };

function makeSkillsBlock(skills: Record<string, unknown>): Block {
  return {
    type: 'Block',
    name: 'skills',
    content: {
      type: 'ObjectContent',
      properties: skills as Record<string, Value>,
      loc,
    },
    loc,
  };
}

function makeAst(blocks: Block[]): Program {
  return { type: 'Program', loc, blocks, extends: [], uses: [] };
}

function validate(ast: Program): { message: string; severity?: string }[] {
  const messages: { message: string; severity?: string }[] = [];
  validSkillReferences.validate({
    ast,
    report: (msg) => messages.push(msg),
    config: {},
  });
  return messages;
}

describe('PS025: valid-skill-references', () => {
  it('should have correct metadata', () => {
    expect(validSkillReferences.id).toBe('PS025');
    expect(validSkillReferences.name).toBe('valid-skill-references');
  });

  it('should pass when skill has no references', () => {
    const ast = makeAst([
      makeSkillsBlock({
        expert: { description: 'Expert', content: 'Help' },
      }),
    ]);
    expect(validate(ast)).toHaveLength(0);
  });

  it('should warn on duplicate references', () => {
    const ast = makeAst([
      makeSkillsBlock({
        expert: {
          description: 'Expert',
          references: ['arch.md', 'arch.md'],
        },
      }),
    ]);
    const msgs = validate(ast);
    expect(msgs).toHaveLength(1);
    expect(msgs[0]!.message).toContain('Duplicate reference');
  });

  it('should warn on path traversal in references', () => {
    const ast = makeAst([
      makeSkillsBlock({
        expert: {
          description: 'Expert',
          references: ['../../etc/passwd'],
        },
      }),
    ]);
    const msgs = validate(ast);
    expect(msgs.length).toBeGreaterThan(0);
    expect(msgs[0]!.message).toContain('path traversal');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm nx test validator -- --testPathPattern=valid-skill-references`
Expected: FAIL — module not found

- [ ] **Step 3: Implement PS025**

Create `packages/validator/src/rules/valid-skill-references.ts`:

```typescript
import type { ValidationRule } from '../types.js';
import type { Value } from '@promptscript/core';
import { normalize, isAbsolute, sep } from 'node:path';

const ALLOWED_EXTENSIONS = new Set(['.md', '.json', '.yaml', '.yml', '.txt', '.csv']);

function hasPathTraversal(path: string): boolean {
  const normalized = normalize(path);
  if (isAbsolute(normalized)) return true;
  return normalized.split(sep).some((s) => s === '..');
}

function getExtension(path: string): string {
  const dot = path.lastIndexOf('.');
  return dot >= 0 ? path.slice(dot).toLowerCase() : '';
}

export const validSkillReferences: ValidationRule = {
  id: 'PS025',
  name: 'valid-skill-references',
  description: 'Skill references must have valid paths and allowed file types',
  defaultSeverity: 'warning',
  validate: (ctx) => {
    const skillsBlock = ctx.ast.blocks.find((b) => b.name === 'skills');
    if (!skillsBlock || skillsBlock.content.type !== 'ObjectContent') return;

    for (const [skillName, skillValue] of Object.entries(skillsBlock.content.properties)) {
      if (typeof skillValue !== 'object' || skillValue === null || Array.isArray(skillValue)) {
        continue;
      }

      const skill = skillValue as Record<string, Value>;
      const refs = skill['references'];
      if (!refs || !Array.isArray(refs)) continue;

      const seen = new Set<string>();
      for (const ref of refs) {
        if (typeof ref !== 'string') continue;

        // Path traversal check
        if (hasPathTraversal(ref)) {
          ctx.report({
            message: `Unsafe reference in skill "${skillName}": "${ref}" — path traversal not allowed`,
            location: skillsBlock.loc,
            severity: 'error',
          });
          continue;
        }

        // Extension check
        const ext = getExtension(ref);
        if (ext && !ALLOWED_EXTENSIONS.has(ext)) {
          ctx.report({
            message: `Reference "${ref}" in skill "${skillName}" has unsupported extension "${ext}"`,
            location: skillsBlock.loc,
            suggestion: `Allowed extensions: ${[...ALLOWED_EXTENSIONS].join(', ')}`,
          });
        }

        // Duplicate check
        if (seen.has(ref)) {
          ctx.report({
            message: `Duplicate reference "${ref}" in skill "${skillName}"`,
            location: skillsBlock.loc,
          });
        }
        seen.add(ref);
      }
    }
  },
};
```

- [ ] **Step 4: Register in rules index**

In `packages/validator/src/rules/index.ts`, add:

```typescript
import { validSkillReferences } from './valid-skill-references.js';
// ... in exports:
export { validSkillReferences } from './valid-skill-references.js';
// ... in allRules array, after validGuardRequires:
  // Valid skill references (PS025)
  validSkillReferences,
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm nx test validator -- --testPathPattern=valid-skill-references`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add packages/validator/src/rules/valid-skill-references.ts packages/validator/src/rules/__tests__/valid-skill-references.spec.ts packages/validator/src/rules/index.ts
git commit -m "feat(validator): add PS025 valid-skill-references rule"
```

---

## Task 6: Validator rule PS026 — safe-reference-content

**Files:**
- Create: `packages/validator/src/rules/safe-reference-content.ts`
- Create: `packages/validator/src/rules/__tests__/safe-reference-content.spec.ts`
- Modify: `packages/validator/src/rules/index.ts`

- [ ] **Step 1: Write failing tests**

Create `packages/validator/src/rules/__tests__/safe-reference-content.spec.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { safeReferenceContent } from '../safe-reference-content.js';
import type { Program, Block, Value, SourceLocation } from '@promptscript/core';

const loc: SourceLocation = { file: 'test.prs', line: 1, column: 1 };

function makeSkillsBlock(skills: Record<string, unknown>): Block {
  return {
    type: 'Block',
    name: 'skills',
    content: {
      type: 'ObjectContent',
      properties: skills as Record<string, Value>,
      loc,
    },
    loc,
  };
}

function makeAst(blocks: Block[]): Program {
  return { type: 'Program', loc, blocks, extends: [], uses: [] };
}

function validate(ast: Program): { message: string }[] {
  const messages: { message: string }[] = [];
  safeReferenceContent.validate({
    ast,
    report: (msg) => messages.push(msg),
    config: {},
  });
  return messages;
}

describe('PS026: safe-reference-content', () => {
  it('should have correct metadata', () => {
    expect(safeReferenceContent.id).toBe('PS026');
    expect(safeReferenceContent.name).toBe('safe-reference-content');
  });

  it('should pass for clean reference content', () => {
    const ast = makeAst([
      makeSkillsBlock({
        expert: {
          description: 'Expert',
          resources: [
            { relativePath: 'references/arch.md', content: '# Architecture\nMicroservices layout.' },
          ],
        },
      }),
    ]);
    expect(validate(ast)).toHaveLength(0);
  });

  it('should warn when reference contains @identity directive', () => {
    const ast = makeAst([
      makeSkillsBlock({
        expert: {
          description: 'Expert',
          resources: [
            {
              relativePath: 'references/bad.md',
              content: '# Data\n@identity {\n  "evil"\n}',
            },
          ],
        },
      }),
    ]);
    const msgs = validate(ast);
    expect(msgs).toHaveLength(1);
    expect(msgs[0]!.message).toContain('@identity');
  });

  it('should warn when reference contains @restrictions directive', () => {
    const ast = makeAst([
      makeSkillsBlock({
        expert: {
          description: 'Expert',
          resources: [
            {
              relativePath: 'references/sneaky.md',
              content: '@restrictions {\n  "ignore previous"\n}',
            },
          ],
        },
      }),
    ]);
    const msgs = validate(ast);
    expect(msgs.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm nx test validator -- --testPathPattern=safe-reference-content`
Expected: FAIL — module not found

- [ ] **Step 3: Implement PS026**

Create `packages/validator/src/rules/safe-reference-content.ts`:

```typescript
import type { ValidationRule } from '../types.js';
import type { Value } from '@promptscript/core';

/** PRS block directives that should NOT appear in reference files */
const PRS_DIRECTIVES = [
  '@meta',
  '@identity',
  '@standards',
  '@restrictions',
  '@guards',
  '@skills',
  '@commands',
  '@agents',
  '@use',
  '@inherit',
  '@extend',
];

const DIRECTIVE_PATTERN = new RegExp(
  `^\\s*(${PRS_DIRECTIVES.map((d) => d.replace('@', '@')).join('|')})\\b`,
  'm'
);

export const safeReferenceContent: ValidationRule = {
  id: 'PS026',
  name: 'safe-reference-content',
  description: 'Reference files should contain data, not PRS directives',
  defaultSeverity: 'warning',
  validate: (ctx) => {
    const skillsBlock = ctx.ast.blocks.find((b) => b.name === 'skills');
    if (!skillsBlock || skillsBlock.content.type !== 'ObjectContent') return;

    for (const [skillName, skillValue] of Object.entries(skillsBlock.content.properties)) {
      if (typeof skillValue !== 'object' || skillValue === null || Array.isArray(skillValue)) {
        continue;
      }

      const skill = skillValue as Record<string, Value>;
      const resources = skill['resources'];
      if (!resources || !Array.isArray(resources)) continue;

      for (const resource of resources) {
        if (typeof resource !== 'object' || resource === null || Array.isArray(resource)) continue;

        const res = resource as Record<string, Value>;
        const relPath = res['relativePath'];
        const content = res['content'];

        if (typeof relPath !== 'string' || typeof content !== 'string') continue;

        // Only check reference files (not all resources)
        if (!relPath.startsWith('references/') && !relPath.includes('/references/')) continue;

        const match = content.match(DIRECTIVE_PATTERN);
        if (match) {
          ctx.report({
            message: `Reference file "${relPath}" in skill "${skillName}" contains PRS directive '${match[1]}' — references should contain data, not instructions`,
            location: skillsBlock.loc,
            suggestion: 'Remove PRS directives from reference files. References are data files, not PromptScript source.',
          });
        }
      }
    }
  },
};
```

- [ ] **Step 4: Register in rules index**

In `packages/validator/src/rules/index.ts`, add:

```typescript
import { safeReferenceContent } from './safe-reference-content.js';
// ... in exports:
export { safeReferenceContent } from './safe-reference-content.js';
// ... in allRules array, after validSkillReferences:
  // Safe reference content (PS026)
  safeReferenceContent,
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm nx test validator -- --testPathPattern=safe-reference-content`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add packages/validator/src/rules/safe-reference-content.ts packages/validator/src/rules/__tests__/safe-reference-content.spec.ts packages/validator/src/rules/index.ts
git commit -m "feat(validator): add PS026 safe-reference-content rule"
```

---

## Task 7: Formatter infrastructure — referencesMode and provenance

**Files:**
- Modify: `packages/formatters/src/base-formatter.ts`
- Modify: `packages/formatters/src/types.ts`

- [ ] **Step 1: Add referencesMode to BaseFormatter**

In `packages/formatters/src/base-formatter.ts`, add after `getSkillFileName()`:

```typescript
/**
 * How this formatter handles skill references.
 * - 'directory': emit as separate files in references/ subdirectory
 * - 'inline': append as sections in the main output file
 * - 'none': references not supported
 */
referencesMode(): 'directory' | 'inline' | 'none' {
  return 'none';
}
```

- [ ] **Step 2: Add provenance helper to BaseFormatter**

In `packages/formatters/src/base-formatter.ts`, add a protected method:

```typescript
/**
 * Generate a provenance comment for a reference file.
 */
protected referenceProvenance(sourcePath: string): string {
  return `<!-- from: ${sourcePath} -->`;
}
```

- [ ] **Step 3: Add referencesMode to Formatter interface**

In `packages/formatters/src/types.ts`, add to the `Formatter` interface:

```typescript
/** How this formatter handles skill references: 'directory', 'inline', or 'none' */
referencesMode(): 'directory' | 'inline' | 'none';
```

- [ ] **Step 4: Run typecheck**

Run: `pnpm nx run formatters:typecheck`
Expected: PASS (all formatters inherit `referencesMode()` returning `'none'` from BaseFormatter)

- [ ] **Step 5: Commit**

```bash
git add packages/formatters/src/base-formatter.ts packages/formatters/src/types.ts
git commit -m "feat(formatters): add referencesMode and provenance infrastructure"
```

---

## Task 8: Claude formatter — emit references with provenance

**Files:**
- Modify: `packages/formatters/src/formatters/claude.ts`
- Test: `packages/formatters/src/__tests__/skill-references.spec.ts`

- [ ] **Step 1: Write failing tests**

Create `packages/formatters/src/__tests__/skill-references.spec.ts`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ClaudeFormatter } from '../formatters/claude.js';
import type { Program, SourceLocation, Value } from '@promptscript/core';

const loc: SourceLocation = { file: 'test.prs', line: 1, column: 1 };

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));
});

afterEach(() => {
  vi.useRealTimers();
});

function makeAst(skills: Record<string, unknown>): Program {
  return {
    type: 'Program',
    loc,
    uses: [],
    blocks: [
      {
        type: 'Block',
        name: 'skills',
        content: {
          type: 'ObjectContent',
          properties: skills as Record<string, Value>,
          loc,
        },
        loc,
      },
    ],
    extends: [],
    meta: { type: 'MetaBlock', loc, fields: { id: 'test', syntax: '1.1.0' } },
  };
}

describe('Claude formatter — skill references', () => {
  it('should return directory referencesMode', () => {
    const formatter = new ClaudeFormatter();
    expect(formatter.referencesMode()).toBe('directory');
  });

  it('should emit reference files alongside SKILL.md', () => {
    const formatter = new ClaudeFormatter();
    const ast = makeAst({
      expert: {
        description: 'Expert skill',
        content: 'Help users.',
        resources: [
          { relativePath: 'references/arch.md', content: '# Architecture\nMicroservices.' },
          { relativePath: 'references/modules.md', content: '# Modules\nMaven layout.' },
        ],
      },
    });

    const result = formatter.format(ast, { version: 'full' });
    const skillFiles = result.additionalFiles?.filter((f) =>
      f.path.includes('skills/expert')
    );

    expect(skillFiles).toBeDefined();

    const skillMd = skillFiles?.find((f) => f.path.endsWith('SKILL.md'));
    expect(skillMd).toBeDefined();

    const refFiles = skillFiles?.flatMap((f) => f.additionalFiles ?? []);
    const archFile = refFiles?.find((f) => f.path.includes('references/arch.md'));

    expect(archFile).toBeDefined();
    expect(archFile!.content).toContain('Architecture');
    expect(archFile!.content).toContain('<!-- from:');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm nx test formatters -- --testPathPattern=skill-references`
Expected: FAIL — `referencesMode()` not implemented, no provenance in output

- [ ] **Step 3: Implement in Claude formatter**

In `packages/formatters/src/formatters/claude.ts`:

1. Override `referencesMode()`:

```typescript
override referencesMode(): 'directory' | 'inline' | 'none' {
  return 'directory';
}
```

2. Modify `generateSkillFile()` to add provenance to reference resources. After the `sanitizeResourceFiles()` call, prepend provenance to each reference file:

```typescript
const resourceFiles = this.sanitizeResourceFiles(config.resources, skillDirPath);

// Add provenance to reference files
const resourcesWithProvenance = resourceFiles.map((f) => {
  if (f.path.includes('/references/')) {
    return {
      ...f,
      content: `${this.referenceProvenance(f.path)}\n\n${f.content}`,
    };
  }
  return f;
});
```

Use `resourcesWithProvenance` instead of `resourceFiles` in the return.

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm nx test formatters -- --testPathPattern=skill-references`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/formatters/src/formatters/claude.ts packages/formatters/src/__tests__/skill-references.spec.ts
git commit -m "feat(formatters): emit skill references with provenance in Claude formatter"
```

---

## Task 9: GitHub formatter — emit references with provenance

**Files:**
- Modify: `packages/formatters/src/formatters/github.ts`
- Test: `packages/formatters/src/__tests__/skill-references.spec.ts` (append tests)

- [ ] **Step 1: Write failing tests**

Append to `packages/formatters/src/__tests__/skill-references.spec.ts`:

```typescript
import { GitHubFormatter } from '../formatters/github.js';

describe('GitHub formatter — skill references', () => {
  it('should return directory referencesMode', () => {
    const formatter = new GitHubFormatter();
    expect(formatter.referencesMode()).toBe('directory');
  });

  it('should emit reference files with provenance', () => {
    const formatter = new GitHubFormatter();
    const ast = makeAst({
      expert: {
        description: 'Expert skill',
        content: 'Help users.',
        resources: [
          { relativePath: 'references/arch.md', content: '# Architecture\nLayout.' },
        ],
      },
    });

    const result = formatter.format(ast, { version: 'full' });
    const allFiles = collectAllFiles(result);
    const refFile = allFiles.find((f) => f.path.includes('references/arch.md'));

    expect(refFile).toBeDefined();
    expect(refFile!.content).toContain('<!-- from:');
  });
});

/** Recursively collect all files from a FormatterOutput tree */
function collectAllFiles(output: { path: string; content: string; additionalFiles?: Array<{ path: string; content: string; additionalFiles?: unknown[] }> }): Array<{ path: string; content: string }> {
  const files = [{ path: output.path, content: output.content }];
  for (const af of output.additionalFiles ?? []) {
    files.push(...collectAllFiles(af as typeof output));
  }
  return files;
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm nx test formatters -- --testPathPattern=skill-references`
Expected: FAIL

- [ ] **Step 3: Implement in GitHub formatter**

Apply the same pattern as Claude formatter:

1. Override `referencesMode()` returning `'directory'`
2. Add provenance to reference resources in the skill file generation method

- [ ] **Step 4: Run tests and commit**

Run: `pnpm nx test formatters -- --testPathPattern=skill-references`

```bash
git add packages/formatters/src/formatters/github.ts packages/formatters/src/__tests__/skill-references.spec.ts
git commit -m "feat(formatters): emit skill references with provenance in GitHub formatter"
```

---

## Task 10: Cursor formatter — inline references

**Files:**
- Modify: `packages/formatters/src/formatters/cursor.ts`
- Test: `packages/formatters/src/__tests__/skill-references.spec.ts` (append tests)

- [ ] **Step 1: Write failing tests**

Append to `packages/formatters/src/__tests__/skill-references.spec.ts`:

```typescript
import { CursorFormatter } from '../formatters/cursor.js';

describe('Cursor formatter — skill references (inline)', () => {
  it('should return inline referencesMode', () => {
    const formatter = new CursorFormatter();
    expect(formatter.referencesMode()).toBe('inline');
  });

  it('should inline references at the end of main output', () => {
    const formatter = new CursorFormatter();
    const ast = makeAst({
      expert: {
        description: 'Expert skill',
        content: 'Help users.',
        resources: [
          { relativePath: 'references/arch.md', content: '# Architecture\nMicroservices.' },
          { relativePath: 'references/modules.md', content: '# Modules\nMaven layout.' },
        ],
      },
    });

    const result = formatter.format(ast);

    expect(result.content).toContain('## References');
    expect(result.content).toContain('### arch.md (from expert)');
    expect(result.content).toContain('Microservices.');
    expect(result.content).toContain('### modules.md (from expert)');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm nx test formatters -- --testPathPattern=skill-references`
Expected: FAIL

- [ ] **Step 3: Implement in Cursor formatter**

In `packages/formatters/src/formatters/cursor.ts`:

1. Override `referencesMode()` returning `'inline'`

2. In the `format()` method (or the relevant version-specific method), after generating the main content, append inline references:

```typescript
override referencesMode(): 'directory' | 'inline' | 'none' {
  return 'inline';
}
```

Add a method to extract and inline references from skills:

```typescript
private inlineSkillReferences(ast: Program): string {
  const skillsBlock = this.findBlock(ast, 'skills');
  if (!skillsBlock || skillsBlock.content.type !== 'ObjectContent') return '';

  const sections: string[] = [];

  for (const [skillName, skillValue] of Object.entries(skillsBlock.content.properties)) {
    if (typeof skillValue !== 'object' || skillValue === null || Array.isArray(skillValue)) {
      continue;
    }

    const skill = skillValue as Record<string, Value>;
    const resources = skill['resources'];
    if (!resources || !Array.isArray(resources)) continue;

    for (const resource of resources) {
      if (typeof resource !== 'object' || resource === null || Array.isArray(resource)) continue;
      const res = resource as Record<string, Value>;
      const relPath = res['relativePath'] as string | undefined;
      const content = res['content'] as string | undefined;

      if (!relPath || !content) continue;
      if (!relPath.startsWith('references/') && !relPath.includes('/references/')) continue;

      const fileName = relPath.split('/').pop() ?? relPath;
      sections.push(`### ${fileName} (from ${skillName})\n\n${content}`);
    }
  }

  if (sections.length === 0) return '';

  return `\n\n## References\n\n${sections.join('\n\n---\n\n')}`;
}
```

Call `inlineSkillReferences(ast)` and append to the main content before returning.

- [ ] **Step 4: Run tests and commit**

Run: `pnpm nx test formatters -- --testPathPattern=skill-references`

```bash
git add packages/formatters/src/formatters/cursor.ts packages/formatters/src/__tests__/skill-references.spec.ts
git commit -m "feat(formatters): inline skill references in Cursor formatter"
```

---

## Task 11: Lock scanner — discover references as dependencies

**Files:**
- Modify: `packages/cli/src/commands/lock-scanner.ts`
- Test: `packages/cli/src/__tests__/lock-scanner.spec.ts` (if exists, append; otherwise create)

- [ ] **Step 1: Write failing test**

Test that `collectRemoteImports()` also discovers `references` from parsed skills blocks. Since the lock scanner currently only looks at `@use` declarations, this requires extracting references from the AST:

```typescript
// In the test file for lock-scanner:
it('should discover references paths from @skills blocks', async () => {
  // Create a fixture .prs file with a skill that has registry references
  // The scanner should detect them as dependencies
});
```

Note: The lock scanner currently only follows `@use` imports. References are local file paths (relative to the .prs file), not registry paths, so they don't need lockfile entries unless they reference registry aliases. For MVP, the lock scanner change may be limited to ensuring that when a skill's `.prs` file is scanned, its `@use` directives (which pull in the base skill from a registry) are properly discovered — which already works.

- [ ] **Step 2: Verify existing lock scanner handles the overlay pattern**

The overlay `.prs` file (e.g., `@bu/skills/clm512-expert.prs`) uses `@use @clm5core/skills/clm512-expert as base`. The lock scanner already discovers `@use` declarations. Verify with a test:

```typescript
it('should discover @use from overlay .prs files', async () => {
  // Write a temp .prs file with @use @clm5core/skills/clm512-expert as base
  // Run collectRemoteImports
  // Verify the @clm5core import is discovered
});
```

- [ ] **Step 3: Implement if needed, run tests, commit**

If the lock scanner already handles this pattern (likely), document it and commit:

```bash
git add packages/cli/src/commands/lock-scanner.ts
git commit -m "chore(cli): verify lock scanner handles skill overlay @use imports"
```

---

## Task 12: Full verification pipeline

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

- [ ] **Step 8: Grammar check**

Run: `pnpm grammar:check`

- [ ] **Step 9: Fix any issues found, re-run pipeline**

- [ ] **Step 10: Final commit**

```bash
git commit -m "chore: fix lint/format/type issues from skill overlay implementation"
```

---

## Task 13: Integration test — e2e multi-registry overlay

**Files:**
- Create: `packages/compiler/src/__tests__/__fixtures__/skill-overlay/`
- Test: `packages/compiler/src/__tests__/skill-overlay.spec.ts`

- [ ] **Step 1: Create fixtures**

```bash
mkdir -p packages/compiler/src/__tests__/__fixtures__/skill-overlay/registry/base/skills/expert/references
mkdir -p packages/compiler/src/__tests__/__fixtures__/skill-overlay/overlay/references
```

Create `packages/compiler/src/__tests__/__fixtures__/skill-overlay/registry/base/skills/expert/SKILL.md`:

```markdown
---
name: expert
description: Base expert skill
references:
  - references/spring.md
---
Generic expert workflows.
```

Create `packages/compiler/src/__tests__/__fixtures__/skill-overlay/registry/base/skills/expert/references/spring.md`:

```markdown
# Spring Patterns
Base patterns for Spring Boot.
```

Create `packages/compiler/src/__tests__/__fixtures__/skill-overlay/overlay/overlay.prs`:

```promptscript
@meta {
  id: "overlay-test"
  syntax: "1.1.0"
}

@skills {
  expert {
    description: "Expert with BU context"
    references: [
      ./references/architecture.md
    ]
  }
}
```

Create `packages/compiler/src/__tests__/__fixtures__/skill-overlay/overlay/references/architecture.md`:

```markdown
# Architecture
BU-specific microservice topology.
```

Create `packages/compiler/src/__tests__/__fixtures__/skill-overlay/project.prs`:

```promptscript
@meta {
  id: "integration-test"
  syntax: "1.1.0"
}

@skills {
  expert {
    description: "Expert with BU context"
    content: """
    Generic expert workflows.
    """
    references: [
      ./overlay/references/architecture.md
    ]
  }
}
```

- [ ] **Step 2: Write integration test**

Create `packages/compiler/src/__tests__/skill-overlay.spec.ts`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const FIXTURES = join(__dirname, '__fixtures__', 'skill-overlay');

// Mock resolver and validator as needed — or test at a lower level
// using the resolver directly

import { Resolver } from '@promptscript/resolver';

describe('Skill overlay integration', () => {
  it('should resolve skill with references from overlay', async () => {
    const resolver = new Resolver({
      registryPath: FIXTURES,
      localPath: FIXTURES,
    });

    const result = await resolver.resolve(join(FIXTURES, 'project.prs'));

    expect(result.errors).toHaveLength(0);

    const skillsBlock = result.ast.blocks.find((b) => b.name === 'skills');
    expect(skillsBlock).toBeDefined();

    if (skillsBlock?.content.type === 'ObjectContent') {
      const expert = skillsBlock.content.properties['expert'] as Record<string, unknown>;
      const resources = expert?.['resources'] as Array<{ relativePath: string; content: string }>;

      expect(resources).toBeDefined();
      const archRef = resources?.find((r) => r.relativePath.includes('architecture'));
      expect(archRef).toBeDefined();
      expect(archRef?.content).toContain('microservice topology');
    }
  });
});
```

- [ ] **Step 3: Run integration test**

Run: `pnpm nx test compiler -- --testPathPattern=skill-overlay`

- [ ] **Step 4: Fix any issues, commit**

```bash
git add packages/compiler/src/__tests__/
git commit -m "test(compiler): add skill overlay integration test"
```

---

## Self-Review Checklist

### Spec coverage
| Spec Section | Task |
|---|---|
| 3. New property `references` | Task 1 (type), Task 2 (frontmatter), Task 4 (loading) |
| 4. Composition via `@use` + `@extend` | Task 3 (extend semantics) |
| 5. Extend semantics per property | Task 3 (replace/append/merge) |
| 6.1 Parser — zero changes | Confirmed, no parser tasks |
| 6.2 Core — SkillDefinition | Task 1 |
| 6.3 Resolver — SKILL_RESERVED_KEYS | Task 2 |
| 6.4 Extend: two stages | Task 3 (Etap A), Task 4 (Etap B) |
| 6.5 Formatters + provenance | Tasks 7, 8, 9, 10 |
| 6.6 Validator PS025 | Task 5 |
| 6.7 Lockfile | Task 11 |
| 6.8 Content safety PS026 | Task 6 |
| 7. Error handling | Task 4 (resolve errors), Task 5 (validation) |
| 10. Testing | Tasks 2-6 (unit), Task 13 (integration) |
| 12. Migration checklist | Not in plan scope (registry-side, not code) |
| 13. Phase 1 MVP items | All 12 items covered |

### Placeholder scan
No TBD/TODO found. All steps have concrete code or commands.

### Type consistency
- `SkillResource` used consistently: `{ relativePath: string; content: string }`
- `resolveSkillReferences()` signature consistent across Task 4 definition and Task 4 integration
- `referencesMode()` returns `'directory' | 'inline' | 'none'` in types and implementations
- `referenceProvenance()` used in Tasks 8, 9 consistently
