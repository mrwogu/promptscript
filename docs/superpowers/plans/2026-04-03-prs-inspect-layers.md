# `prs inspect --layers` Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `__layerTrace` metadata recording during skill extension and a `prs inspect <skill>` CLI command to visualize per-property provenance and layer breakdown.

**Architecture:** `mergeSkillValue()` in extensions.ts records a `LayerTraceEntry` for each property merge, stored as `__layerTrace` on the skill object (in `SKILL_PRESERVE_PROPERTIES`). A new `prs inspect` CLI command resolves the entry file, finds the target skill, reads trace metadata, and formats output (property view, layer view, or JSON).

**Tech Stack:** TypeScript, Commander.js, Vitest, chalk

**Spec:** `docs/superpowers/specs/2026-04-03-prs-inspect-layers-design.md`

---

## File Structure

| File | Responsibility |
|------|---------------|
| `packages/resolver/src/extensions.ts` | Record `__layerTrace` entries in `mergeSkillValue`, add to `SKILL_PRESERVE_PROPERTIES` |
| `packages/resolver/src/__tests__/skill-references.spec.ts` | Trace recording unit tests |
| `packages/cli/src/commands/inspect.ts` | New `prs inspect` command implementation |
| `packages/cli/src/cli.ts` | Register `inspect` command |
| `packages/cli/src/types.ts` | `InspectOptions` interface |

---

### Task 1: Record `__layerTrace` in `mergeSkillValue`

**Files:**
- Modify: `packages/resolver/src/extensions.ts:36,456-500`
- Test: `packages/resolver/src/__tests__/skill-references.spec.ts`

- [ ] **Step 1: Write failing tests for trace recording**

Add to `packages/resolver/src/__tests__/skill-references.spec.ts` inside the `describe('skill-aware @extend semantics', ...)` block:

```typescript
  describe('__layerTrace recording', () => {
    it('should record trace entry when replacing a property via @extend', () => {
      const ast = createProgram({
        blocks: [
          createBlock(
            'skills',
            createObjectContent({
              expert: createObjectContent({
                description: 'Base expert',
                content: createTextContent('Base instructions'),
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
      const expert = skills.properties['expert'] as Record<string, unknown>;
      const trace = expert['__layerTrace'] as Array<Record<string, string>>;

      expect(trace).toBeDefined();
      expect(trace).toHaveLength(1);
      expect(trace[0]!.property).toBe('description');
      expect(trace[0]!.strategy).toBe('replace');
      expect(trace[0]!.action).toBe('replaced');
      expect(trace[0]!.source).toBeDefined();
    });

    it('should record trace entry when appending references via @extend', () => {
      const ast = createProgram({
        blocks: [
          createBlock(
            'skills',
            createObjectContent({
              expert: createObjectContent({
                description: 'Base expert',
                references: createArrayContent(['base.md']) as unknown as Value,
              }) as unknown as Value,
            })
          ),
        ],
        extends: [
          createExtendBlock(
            'skills.expert',
            createObjectContent({
              references: createArrayContent(['overlay.md']) as unknown as Value,
            })
          ),
        ],
      });

      const result = applyExtends(ast);
      const skills = result.blocks[0]?.content as ObjectContent;
      const expert = skills.properties['expert'] as Record<string, unknown>;
      const trace = expert['__layerTrace'] as Array<Record<string, string>>;

      expect(trace).toBeDefined();
      expect(trace).toHaveLength(1);
      expect(trace[0]!.property).toBe('references');
      expect(trace[0]!.strategy).toBe('append');
      expect(trace[0]!.action).toBe('appended');
    });

    it('should record trace entry for merge-strategy properties', () => {
      const ast = createProgram({
        blocks: [
          createBlock(
            'skills',
            createObjectContent({
              expert: createObjectContent({
                description: 'Base',
                params: createObjectContent({ name: 'string' }) as unknown as Value,
              }) as unknown as Value,
            })
          ),
        ],
        extends: [
          createExtendBlock(
            'skills.expert',
            createObjectContent({
              params: createObjectContent({ age: 'number' }) as unknown as Value,
            })
          ),
        ],
      });

      const result = applyExtends(ast);
      const skills = result.blocks[0]?.content as ObjectContent;
      const expert = skills.properties['expert'] as Record<string, unknown>;
      const trace = expert['__layerTrace'] as Array<Record<string, string>>;

      expect(trace).toBeDefined();
      expect(trace).toHaveLength(1);
      expect(trace[0]!.property).toBe('params');
      expect(trace[0]!.strategy).toBe('merge');
      expect(trace[0]!.action).toBe('merged');
    });

    it('should record source file from ext.loc.file', () => {
      const loc = { file: '/project/overlay.prs', line: 1, column: 1 };
      const ast = createProgram({
        blocks: [
          createBlock(
            'skills',
            createObjectContent({
              expert: createObjectContent({
                description: 'Base',
              }) as unknown as Value,
            })
          ),
        ],
        extends: [
          {
            type: 'ExtendBlock' as const,
            targetPath: 'skills.expert',
            content: {
              type: 'ObjectContent' as const,
              properties: { description: 'New' },
              loc,
            },
            loc,
          },
        ],
      });

      const result = applyExtends(ast);
      const skills = result.blocks[0]?.content as ObjectContent;
      const expert = skills.properties['expert'] as Record<string, unknown>;
      const trace = expert['__layerTrace'] as Array<Record<string, string>>;

      expect(trace[0]!.source).toBe('/project/overlay.prs');
    });

    it('should accumulate trace entries across multiple extends', () => {
      const ast = createProgram({
        blocks: [
          createBlock(
            'skills',
            createObjectContent({
              expert: createObjectContent({
                description: 'Base',
                references: createArrayContent(['base.md']) as unknown as Value,
              }) as unknown as Value,
            })
          ),
        ],
        extends: [
          createExtendBlock(
            'skills.expert',
            createObjectContent({
              description: 'Layer 2',
            })
          ),
          createExtendBlock(
            'skills.expert',
            createObjectContent({
              references: createArrayContent(['layer3.md']) as unknown as Value,
            })
          ),
        ],
      });

      const result = applyExtends(ast);
      const skills = result.blocks[0]?.content as ObjectContent;
      const expert = skills.properties['expert'] as Record<string, unknown>;
      const trace = expert['__layerTrace'] as Array<Record<string, string>>;

      expect(trace).toHaveLength(2);
      expect(trace[0]!.property).toBe('description');
      expect(trace[1]!.property).toBe('references');
    });

    it('should not have __layerTrace when no extends are applied', () => {
      const ast = createProgram({
        blocks: [
          createBlock(
            'skills',
            createObjectContent({
              expert: createObjectContent({
                description: 'Base only',
              }) as unknown as Value,
            })
          ),
        ],
      });

      const result = applyExtends(ast);
      const skills = result.blocks[0]?.content as ObjectContent;
      const expert = skills.properties['expert'] as Record<string, unknown>;

      expect(expert['__layerTrace']).toBeUndefined();
    });

    it('should prevent __layerTrace from being overwritten by @extend', () => {
      const ast = createProgram({
        blocks: [
          createBlock(
            'skills',
            createObjectContent({
              expert: createObjectContent({
                description: 'Base',
              }) as unknown as Value,
            })
          ),
        ],
        extends: [
          createExtendBlock(
            'skills.expert',
            createObjectContent({
              description: 'First extend',
            })
          ),
          createExtendBlock(
            'skills.expert',
            createObjectContent({
              __layerTrace: 'attempt to overwrite' as unknown as Value,
            })
          ),
        ],
      });

      const result = applyExtends(ast);
      const skills = result.blocks[0]?.content as ObjectContent;
      const expert = skills.properties['expert'] as Record<string, unknown>;
      const trace = expert['__layerTrace'] as Array<Record<string, string>>;

      // Should still be the array from the first extend, not the string from the second
      expect(Array.isArray(trace)).toBe(true);
      expect(trace).toHaveLength(1);
    });
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm nx test resolver -- --testPathPattern=skill-references -t "__layerTrace"`
Expected: FAIL — no trace recording exists

- [ ] **Step 3: Add `__layerTrace` to `SKILL_PRESERVE_PROPERTIES`**

In `packages/resolver/src/extensions.ts`, update line 36:

```typescript
const SKILL_PRESERVE_PROPERTIES = new Set(['composedFrom', '__composedFrom', 'sealed', '__layerTrace']);
```

- [ ] **Step 4: Add trace recording to `mergeSkillValue`**

In `packages/resolver/src/extensions.ts`, modify `mergeSkillValue` function. Add a `trace` array at the top of the function (after the base/flatten setup, around line 455), and record entries in each strategy branch. At the end, store the trace on the base object.

Add after line 454 (the flatten loop closing brace):

```typescript
  const trace: Array<{ property: string; source: string; strategy: string; action: string }> = [];
  const sourceFile = ext.loc?.file ?? '<unknown>';
```

Then modify each strategy branch to record a trace entry after the merge. In the **replace** branch (after line 474):

```typescript
      trace.push({ property: key, source: sourceFile, strategy: 'replace', action: 'replaced' });
```

In the **append** branch — after the `if/else if/else` block that handles `processAppendWithNegations` (after line 488):

```typescript
      trace.push({ property: key, source: sourceFile, strategy: 'append', action: 'appended' });
```

In the **merge** branch — after the `if/else if/else` block (after line 500):

```typescript
      trace.push({ property: key, source: sourceFile, strategy: 'merge', action: 'merged' });
```

In the **fallback** branch — after the `if/else` block (around line 515):

```typescript
      trace.push({ property: key, source: sourceFile, strategy: 'unknown', action: 'merged' });
```

Then, before `return base as unknown as Value;` at the end of the function, add:

```typescript
  // Store accumulated layer trace entries
  if (trace.length > 0) {
    const existingTrace = Array.isArray(base['__layerTrace']) ? (base['__layerTrace'] as unknown[]) : [];
    base['__layerTrace'] = [...existingTrace, ...trace] as unknown as Value;
  }
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm nx test resolver -- --testPathPattern=skill-references -t "__layerTrace"`
Expected: ALL PASS

- [ ] **Step 6: Run full resolver test suite**

Run: `pnpm nx test resolver`
Expected: ALL PASS

- [ ] **Step 7: Commit**

```bash
git add packages/resolver/src/extensions.ts packages/resolver/src/__tests__/skill-references.spec.ts
git commit -m "feat(resolver): record __layerTrace metadata during skill extension merges (#203)"
```

---

### Task 2: Add `InspectOptions` type and register CLI command

**Files:**
- Modify: `packages/cli/src/types.ts`
- Modify: `packages/cli/src/cli.ts`
- Create: `packages/cli/src/commands/inspect.ts`

- [ ] **Step 1: Add `InspectOptions` to types.ts**

Add at the end of `packages/cli/src/types.ts` (before the closing of the file):

```typescript
/**
 * Options for the inspect command.
 */
export interface InspectOptions {
  /** Show layer-level view instead of property-level */
  layers?: boolean;
  /** Output format */
  format?: 'text' | 'json';
  /** Path to custom config file */
  config?: string;
  /** Working directory (project root) */
  cwd?: string;
}
```

- [ ] **Step 2: Create the inspect command file**

Create `packages/cli/src/commands/inspect.ts`:

```typescript
import { existsSync } from 'fs';
import { resolve, basename } from 'path';
import type { ObjectContent, TextContent, Value } from '@promptscript/core';
import { Resolver } from '@promptscript/resolver';
import type { InspectOptions } from '../types.js';
import { loadConfig } from '../config/loader.js';
import { resolveRegistryPath } from '../utils/registry-resolver.js';
import { ConsoleOutput, createSpinner } from '../output/console.js';

interface LayerTraceEntry {
  property: string;
  source: string;
  strategy: string;
  action: string;
}

/**
 * `prs inspect <skill-name>` — show per-property provenance for a skill.
 */
export async function inspectCommand(
  skillName: string,
  options: InspectOptions
): Promise<void> {
  const isJson = options.format === 'json';
  const spinner = isJson ? createSpinner('').stop() : createSpinner('Resolving...').start();

  try {
    const config = await loadConfig(options.config);
    const registry = await resolveRegistryPath(config);

    const resolver = new Resolver({
      registryPath: registry.path,
      localPath: './.promptscript',
      registries: config.registries,
    });

    const entryPath = resolve('./.promptscript/project.prs');
    if (!existsSync(entryPath)) {
      spinner.stop();
      ConsoleOutput.error(`Entry file not found: ${entryPath}`);
      process.exitCode = 1;
      return;
    }

    const result = await resolver.resolve(entryPath);

    if (!result.ast) {
      spinner.stop();
      ConsoleOutput.error('Resolution failed');
      for (const err of result.errors) {
        ConsoleOutput.error(`  ${err.message}`);
      }
      process.exitCode = 1;
      return;
    }

    spinner.stop();

    // Find @skills block
    const skillsBlock = result.ast.blocks.find((b) => b.name === 'skills');
    if (!skillsBlock || skillsBlock.content.type !== 'ObjectContent') {
      ConsoleOutput.error('No @skills block in resolved output');
      process.exitCode = 1;
      return;
    }

    const content = skillsBlock.content as ObjectContent;
    const availableSkills = Object.keys(content.properties);

    // Find the target skill
    const skillValue = content.properties[skillName];
    if (!skillValue || typeof skillValue !== 'object' || skillValue === null || Array.isArray(skillValue)) {
      ConsoleOutput.error(
        `Skill '${skillName}' not found. Available skills: ${availableSkills.join(', ')}`
      );
      process.exitCode = 1;
      return;
    }

    const skill = skillValue as Record<string, unknown>;
    const trace = (Array.isArray(skill['__layerTrace']) ? skill['__layerTrace'] : []) as LayerTraceEntry[];
    const sealed = Array.isArray(skill['sealed']) ? (skill['sealed'] as string[]) : skill['sealed'] === true ? ['(all replace)'] : [];
    const composedFrom = Array.isArray(skill['__composedFrom']) ? skill['__composedFrom'] : null;
    const baseSource = skillsBlock.loc?.file ?? '<unknown>';

    if (isJson) {
      outputJson(skillName, skill, trace, sealed, composedFrom, baseSource);
    } else if (options.layers) {
      outputLayers(skillName, skill, trace, sealed, baseSource);
    } else {
      outputProperties(skillName, skill, trace, sealed, baseSource);
    }
  } catch (error) {
    spinner.stop();
    ConsoleOutput.error(`Inspect failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}

function summarizeValue(val: unknown): string {
  if (val === undefined || val === null) return '(empty)';
  if (typeof val === 'string') {
    return val.length > 40 ? `"${val.slice(0, 37)}..."` : `"${val}"`;
  }
  if (typeof val === 'boolean') return String(val);
  if (Array.isArray(val)) return `${val.length} items`;
  if (typeof val === 'object' && val !== null) {
    const obj = val as Record<string, unknown>;
    if (obj['type'] === 'TextContent') {
      const text = (obj as TextContent).value;
      const lines = text.split('\n').length;
      return `(${lines} lines)`;
    }
    return `{${Object.keys(obj).length} keys}`;
  }
  return String(val);
}

function shortPath(source: string): string {
  return basename(source);
}

function getPropertySource(
  propName: string,
  trace: LayerTraceEntry[],
  baseSource: string
): { source: string; strategy: string } {
  // Find the last trace entry for this property (most recent layer wins)
  for (let i = trace.length - 1; i >= 0; i--) {
    if (trace[i]!.property === propName) {
      return { source: trace[i]!.source, strategy: trace[i]!.strategy };
    }
  }
  return { source: baseSource, strategy: 'base' };
}

const INTERNAL_KEYS = new Set(['type', 'loc', 'properties', '__layerTrace', '__composedFrom', 'composedFrom']);

function outputProperties(
  skillName: string,
  skill: Record<string, unknown>,
  trace: LayerTraceEntry[],
  sealed: string[],
  baseSource: string
): void {
  console.log(`\nSkill: ${skillName}\n`);

  const sealedSet = new Set(sealed);

  for (const [key, val] of Object.entries(skill)) {
    if (INTERNAL_KEYS.has(key)) continue;

    const { source, strategy } = getPropertySource(key, trace, baseSource);
    const isSealed = sealedSet.has(key) || (skill['sealed'] === true && strategy === 'base');
    const tag = isSealed ? '[sealed]' : strategy !== 'base' ? `[${strategy}]` : '';
    const summary = summarizeValue(val);

    console.log(`  ${key.padEnd(18)} ${summary.padEnd(30)} ${tag.padEnd(10)} ← ${shortPath(source)}`);
  }

  console.log('');
}

function outputLayers(
  skillName: string,
  skill: Record<string, unknown>,
  trace: LayerTraceEntry[],
  sealed: string[],
  baseSource: string
): void {
  // Group trace entries by source
  const layers = new Map<string, LayerTraceEntry[]>();
  for (const entry of trace) {
    const existing = layers.get(entry.source) ?? [];
    existing.push(entry);
    layers.set(entry.source, existing);
  }

  const totalLayers = 1 + layers.size;
  console.log(`\nSkill: ${skillName} (${totalLayers} layer${totalLayers > 1 ? 's' : ''})\n`);

  // Layer 1: base
  console.log(`Layer 1 — ${shortPath(baseSource)} (base)`);
  for (const [key, val] of Object.entries(skill)) {
    if (INTERNAL_KEYS.has(key)) continue;
    // Show property if it's from the base (no trace entry for it, or there IS a trace but base still set it)
    const hasTraceEntry = trace.some((t) => t.property === key);
    if (!hasTraceEntry) {
      console.log(`  + ${key}: ${summarizeValue(val)}`);
    }
  }
  if (sealed.length > 0) {
    console.log(`  + sealed: [${sealed.join(', ')}]`);
  }
  console.log('');

  // Extension layers
  let layerNum = 2;
  for (const [source, entries] of layers) {
    console.log(`Layer ${layerNum} — ${shortPath(source)} (@extend)`);
    for (const entry of entries) {
      const symbol = entry.action === 'replaced' ? '~' : entry.action === 'negated' ? '-' : '+';
      console.log(`  ${symbol} ${entry.property}: ${entry.action}`);
    }
    console.log('');
    layerNum++;
  }
}

function outputJson(
  skillName: string,
  skill: Record<string, unknown>,
  trace: LayerTraceEntry[],
  sealed: string[],
  composedFrom: unknown,
  baseSource: string
): void {
  const layers = new Map<string, LayerTraceEntry[]>();
  for (const entry of trace) {
    const existing = layers.get(entry.source) ?? [];
    existing.push(entry);
    layers.set(entry.source, existing);
  }

  const properties: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(skill)) {
    if (INTERNAL_KEYS.has(key)) continue;
    const { source, strategy } = getPropertySource(key, trace, baseSource);
    properties[key] = {
      value: summarizeValue(val),
      source: shortPath(source),
      strategy,
      sealed: sealed.includes(key),
    };
  }

  const output = {
    skill: skillName,
    baseSource: shortPath(baseSource),
    layers: Array.from(layers.entries()).map(([source, changes]) => ({
      source: shortPath(source),
      type: 'extend',
      changes,
    })),
    properties,
    sealed,
    composedFrom: composedFrom ?? null,
  };

  console.log(JSON.stringify(output, null, 2));
}
```

- [ ] **Step 3: Register the command in cli.ts**

In `packages/cli/src/cli.ts`, add the import near the other command imports:

```typescript
import { inspectCommand } from './commands/inspect.js';
```

Then register the command (after the `validate` command registration, around line 122):

```typescript
program
  .command('inspect <skill-name>')
  .description('Inspect skill composition layers and property provenance')
  .option('--layers', 'Show layer-level breakdown')
  .option('--format <format>', 'Output format (text, json)', 'text')
  .option('-c, --config <path>', 'Path to custom config file')
  .option('--cwd <dir>', 'Working directory (project root)')
  .action((skillName, opts) => inspectCommand(skillName, opts));
```

- [ ] **Step 4: Run typecheck to verify compilation**

Run: `pnpm nx typecheck cli`
Expected: PASS (or known pre-existing warnings only)

- [ ] **Step 5: Commit**

```bash
git add packages/cli/src/commands/inspect.ts packages/cli/src/cli.ts packages/cli/src/types.ts
git commit -m "feat(cli): add prs inspect command for skill layer debugging (#203)"
```

---

### Task 3: Run full verification pipeline

**Files:** None (verification only)

- [ ] **Step 1: Format**

Run: `pnpm run format`

- [ ] **Step 2: Lint**

Run: `pnpm run lint`
Expected: PASS

- [ ] **Step 3: Typecheck**

Run: `pnpm run typecheck`
Expected: PASS

- [ ] **Step 4: Test all packages**

Run: `pnpm run test`
Expected: ALL PASS

- [ ] **Step 5: Validate PRS files**

Run: `pnpm prs validate --strict`
Expected: PASS

- [ ] **Step 6: Schema, skill, grammar checks**

Run: `pnpm schema:check && pnpm skill:check && pnpm grammar:check`
Expected: ALL PASS

- [ ] **Step 7: Fix any issues and commit**

If any step fails, fix and commit:
```bash
git add -A
git commit -m "fix(cli): address verification pipeline issues"
```

---

### Task 4: Update documentation and ROADMAP

**Files:**
- Modify: `docs/guides/skill-overlays.md`
- Modify: `ROADMAP.md`

- [ ] **Step 1: Add inspect section to skill-overlays guide**

In `docs/guides/skill-overlays.md`, before the `## Validation Rules` section, add:

```markdown
## Debugging with `prs inspect`

Use `prs inspect` to see how layers compose a skill:

```bash
# Property-level view (default) — shows each property with source
prs inspect code-review

# Layer-level view — groups changes by source file
prs inspect code-review --layers

# JSON output for tooling
prs inspect code-review --format json
```

The property view shows each property's current value, merge strategy, and which file contributed it. The layer view shows what each `@extend` changed.
```

- [ ] **Step 2: Mark inspect as done in ROADMAP**

In `ROADMAP.md`, change:
```
- [ ] **`prs inspect --layers`** — Show per-property merge layers for a compiled skill (base vs overlay)
```
to:
```
- [x] **`prs inspect --layers`** — Show per-property merge layers for a compiled skill (base vs overlay)
```

- [ ] **Step 3: Update docs snapshots if needed**

Run: `node --import @swc-node/register/esm-register scripts/validate-docs-examples.mts --update-snapshots`

- [ ] **Step 4: Format, commit**

```bash
pnpm run format
git add docs/guides/skill-overlays.md ROADMAP.md docs/__snapshots__/
git commit -m "docs: document prs inspect command and update ROADMAP (#203)"
```
