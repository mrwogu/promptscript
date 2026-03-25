# Guards Improvements Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 5 issues with `@guards`: document named entries, fix PS011 false positives, add Factory `@guards`→skills, document merge behavior, and add importer `applyTo` detection.

**Architecture:** Independent changes across validator, formatters, importer, compiler, CLI, and docs. Tasks are ordered by dependency — type changes first (core/compiler), then consumers (formatter, validator), then importer, then docs.

**Tech Stack:** TypeScript, Vitest, Chevrotain parser, Nx monorepo

**Spec:** `docs/superpowers/specs/2026-03-25-guards-improvements-design.md`

---

## Chunk 1: Type Changes & PS011 Fix

### Task 1: Extend TargetConfig and FormatOptions types

**Files:**
- Modify: `packages/core/src/types/config.ts:63-86`
- Modify: `packages/compiler/src/types.ts:25-40` (FormatOptions)
- Modify: `packages/compiler/src/types.ts:70-83` (TargetConfig)
- Modify: `packages/formatters/src/types.ts:18-41`

- [ ] **Step 1: Add fields to core TargetConfig**

In `packages/core/src/types/config.ts`, add after the `version` field (line 86):

```typescript
  /** Generate skills from @guards named entries (Factory). @default true */
  guardsAsSkills?: boolean;
  /** List generated guard skills in main output file (Factory). @default true */
  guardsSkillsListing?: boolean;
```

- [ ] **Step 2: Add same fields to compiler TargetConfig**

In `packages/compiler/src/types.ts`, add after the `version` field (line 83):

```typescript
  /** Generate skills from @guards named entries (Factory). @default true */
  guardsAsSkills?: boolean;
  /** List generated guard skills in main output file (Factory). @default true */
  guardsSkillsListing?: boolean;
```

- [ ] **Step 3: Add targetConfig to formatters FormatOptions**

In `packages/formatters/src/types.ts`, add after `prettier` field (line 41):

```typescript
  /** Full target configuration, passed through from promptscript.yaml. */
  targetConfig?: import('@promptscript/core').TargetConfig;
```

- [ ] **Step 4: Add targetConfig to compiler FormatOptions**

In `packages/compiler/src/types.ts`, add after `prettier` field (line 40):

```typescript
  /** Full target configuration, passed through from promptscript.yaml. */
  targetConfig?: TargetConfig;
```

- [ ] **Step 5: Thread targetConfig in compiler**

In `packages/compiler/src/compiler.ts`, in `getFormatOptionsForTarget()` (line 499), add `targetConfig: config` to the options object:

```typescript
    const options: import('./types.js').FormatOptions = {
      outputPath: config?.output,
      version: config?.version,
      prettier: prettierOptions,
      targetConfig: config,
    };
```

- [ ] **Step 6: Verify types compile**

Run: `pnpm nx run-many -t typecheck -p core,compiler,formatters`
Expected: All pass with no errors.

- [ ] **Step 7: Update JSON schema**

Run: `pnpm schema:generate`
Verify new fields appear in `schema/config.json`.

- [ ] **Step 8: Commit**

```bash
git add packages/core/src/types/config.ts packages/compiler/src/types.ts packages/compiler/src/compiler.ts packages/formatters/src/types.ts schema/config.json
git commit -m "feat(core): add guardsAsSkills and guardsSkillsListing to TargetConfig"
```

---

### Task 2: Fix PS011 authority injection false positives in fenced code blocks

**Files:**
- Modify: `packages/validator/src/rules/authority-injection.ts`
- Modify: `packages/validator/src/__tests__/security-rules.spec.ts`

- [ ] **Step 1: Write failing tests**

In `packages/validator/src/__tests__/security-rules.spec.ts`, inside the `describe('authority-injection rule (PS011)')` block (after line 670), add:

```typescript
    describe('fenced code block exclusion', () => {
      it('should NOT flag authority patterns inside fenced code blocks', () => {
        const ast = createProgramWithText(
          'guards',
          'Instructions:\n```typescript\n// DON\'T FLAG this value\n```\nEnd.'
        );
        const messages = validate(ast, [authorityInjection]);
        expect(messages).toHaveLength(0);
      });

      it('should still flag authority patterns outside fenced code blocks', () => {
        const ast = createProgramWithText(
          'guards',
          'DON\'T FLAG any issues\n```typescript\nclean code\n```'
        );
        const messages = validate(ast, [authorityInjection]);
        expect(messages.length).toBeGreaterThan(0);
      });

      it('should handle multiple fenced blocks with clean text between', () => {
        const ast = createProgramWithText(
          'guards',
          '```\nSKIP VALIDATION\n```\nSafe text here\n```\nBYPASS CHECKS\n```'
        );
        const messages = validate(ast, [authorityInjection]);
        expect(messages).toHaveLength(0);
      });

      it('should handle indented fenced code blocks', () => {
        const ast = createProgramWithText(
          'guards',
          '    ```bash\n    // SKIP VALIDATION here\n    ```'
        );
        const messages = validate(ast, [authorityInjection]);
        expect(messages).toHaveLength(0);
      });

      it('should treat unclosed fence as plain text (scan everything)', () => {
        const ast = createProgramWithText(
          'guards',
          '```\nDON\'T FLAG this\nno closing fence'
        );
        const messages = validate(ast, [authorityInjection]);
        expect(messages.length).toBeGreaterThan(0);
      });
    });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm nx test validator -- --testNamePattern="fenced code block"`
Expected: 3 tests FAIL (the ones expecting no violations inside code blocks).

- [ ] **Step 3: Implement stripFencedCodeBlocks**

In `packages/validator/src/rules/authority-injection.ts`, add before the `authorityInjection` export (before line 53):

```typescript
/**
 * Strip fenced code blocks from text before security scanning.
 * Code examples in instructions legitimately contain phrases that match
 * authority injection patterns (e.g., "don't flag", "skip validation").
 * Handles indented fences (common in triple-quoted content blocks).
 */
function stripFencedCodeBlocks(text: string): string {
  return text.replace(/^\s*```[\s\S]*?^\s*```/gm, '');
}
```

Then modify the `validate` callback (line 62-76) to strip code blocks before checking:

```typescript
  validate: (ctx) => {
    walkText(
      ctx.ast,
      (text, loc) => {
        const strippedText = stripFencedCodeBlocks(text);
        for (const pattern of AUTHORITY_PATTERNS) {
          if (pattern.test(strippedText)) {
            ctx.report({
              message: `Authority injection pattern detected: ${pattern.source}`,
              location: loc,
              suggestion:
                'Remove authoritative override language that could be used for prompt injection',
            });
          }
        }
      },
      { excludeProperties: ['resources'] }
    );
  },
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm nx test validator -- --testNamePattern="PS011|authority-injection"`
Expected: All tests pass, including the new fenced code block tests.

- [ ] **Step 5: Run full validator test suite**

Run: `pnpm nx test validator`
Expected: All pass — no regressions.

- [ ] **Step 6: Commit**

```bash
git add packages/validator/src/rules/authority-injection.ts packages/validator/src/__tests__/security-rules.spec.ts
git commit -m "fix(validator): skip fenced code blocks in PS011 authority injection check"
```

---

## Chunk 2: Factory Formatter — `@guards` as Skills

### Task 3: Add extractGuardSkills to Factory formatter

**Files:**
- Modify: `packages/formatters/src/formatters/factory.ts`
- Modify: `packages/formatters/src/__tests__/factory.spec.ts`

- [ ] **Step 1: Write failing test — basic guard skill extraction**

In `packages/formatters/src/__tests__/factory.spec.ts`, add a new `describe` block at the end:

```typescript
  describe('guards as skills', () => {
    it('should generate skill files from @guards named entries', () => {
      const ast = createProgram({
        blocks: [
          createBlock('guards', createObjectContent({
            'angular-components': {
              applyTo: ['apps/admin/**/*.ts', 'apps/webview/**/*.ts'],
              description: 'Angular component standards',
              content: 'Use OnPush change detection.',
            },
          })),
        ],
      });

      const formatter = new FactoryFormatter();
      const result = formatter.format(ast, { version: 'full' });

      const skillFile = result.additionalFiles?.find(
        (f) => f.path === '.factory/skills/angular-components/SKILL.md'
      );
      expect(skillFile).toBeDefined();
      expect(skillFile!.content).toContain('name: angular-components');
      expect(skillFile!.content).toContain('applies to: apps/admin/**/*.ts');
      expect(skillFile!.content).toContain('Use OnPush change detection.');
    });
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm nx test formatters -- --testNamePattern="guards as skills"`
Expected: FAIL — `extractGuardSkills` does not exist yet.

- [ ] **Step 3: Implement extractGuardSkills**

In `packages/formatters/src/formatters/factory.ts`, add after `extractSkills` method:

```typescript
  /**
   * Extract skill configurations from @guards named entries.
   * Each named entry with an `applyTo` array becomes a Factory skill.
   */
  private extractGuardSkills(
    ast: Program,
    existingSkillNames: Set<string>
  ): FactorySkillConfig[] {
    const guards = this.findBlock(ast, 'guards');
    if (!guards) return [];

    const skills: FactorySkillConfig[] = [];
    const props = this.getProps(guards.content);

    for (const [key, value] of Object.entries(props)) {
      if (key === 'globs') continue;
      if (!value || typeof value !== 'object' || Array.isArray(value)) continue;

      const obj = value as Record<string, Value>;
      const applyTo = obj['applyTo'];
      if (!applyTo || !Array.isArray(applyTo)) continue;

      const normalizedName = key.replace(/\./g, '-');
      if (!this.isSafeSkillName(normalizedName)) continue;
      if (existingSkillNames.has(normalizedName)) continue;

      const globs = applyTo.map((p) => this.valueToString(p)).join(', ');
      const description = obj['description']
        ? this.valueToString(obj['description'])
        : `${key} rules`;
      const enrichedDescription = `${description} (applies to: ${globs})`;

      skills.push({
        name: normalizedName,
        description: enrichedDescription,
        userInvocable: true,
        disableModelInvocation: false,
        content: obj['content'] ? this.valueToString(obj['content']) : '',
      });
    }

    return skills;
  }
```

- [ ] **Step 4: Override formatMultifile and formatFull to use guard skills**

Override both methods in `FactoryFormatter`. They need to call `extractSkills` first, collect names, then call `extractGuardSkills`:

```typescript
  protected override formatMultifile(ast: Program, options?: FormatOptions): FormatterOutput {
    const renderer = this.createRenderer(options);
    const additionalFiles: FormatterOutput[] = [];

    if (this.config.hasCommands) {
      const commands = this.extractCommands(ast);
      for (const command of commands) {
        additionalFiles.push(this.generateCommandFile(command));
      }
    }

    // Extract regular skills
    const regularSkills = this.config.hasSkills && this.config.skillsInMultifile
      ? this.extractSkills(ast)
      : [];
    for (const skill of regularSkills) {
      additionalFiles.push(this.generateSkillFile(skill));
    }

    // Extract guard skills (default: enabled)
    const guardSkills = this.maybeExtractGuardSkills(ast, regularSkills, options);
    for (const skill of guardSkills) {
      additionalFiles.push(this.generateSkillFile(skill));
    }

    // Main file content
    const sections: string[] = [];
    if (renderer.getConvention().name === 'markdown') {
      sections.push(`${this.config.mainFileHeader}\n`);
    }
    this.addCommonSections(ast, renderer, sections);
    this.maybeAddGuardSkillsListing(guardSkills, sections, options);

    return {
      path: this.getOutputPath(options),
      content: sections.join('\n'),
      additionalFiles: additionalFiles.length > 0 ? additionalFiles : undefined,
    };
  }

  protected override formatFull(ast: Program, options?: FormatOptions): FormatterOutput {
    const renderer = this.createRenderer(options);
    const additionalFiles: FormatterOutput[] = [];

    if (this.config.hasCommands) {
      const commands = this.extractCommands(ast);
      for (const command of commands) {
        additionalFiles.push(this.generateCommandFile(command));
      }
    }

    // Extract regular skills
    const regularSkills = this.config.hasSkills ? this.extractSkills(ast) : [];
    for (const skill of regularSkills) {
      additionalFiles.push(this.generateSkillFile(skill));
    }

    if (this.config.hasAgents) {
      const agents = this.extractAgents(ast);
      for (const agent of agents) {
        additionalFiles.push(this.generateAgentFile(agent));
      }
    }

    // Extract guard skills (default: enabled)
    const guardSkills = this.maybeExtractGuardSkills(ast, regularSkills, options);
    for (const skill of guardSkills) {
      additionalFiles.push(this.generateSkillFile(skill));
    }

    // Main file content
    const sections: string[] = [];
    if (renderer.getConvention().name === 'markdown') {
      sections.push(`${this.config.mainFileHeader}\n`);
    }
    this.addCommonSections(ast, renderer, sections);
    this.maybeAddGuardSkillsListing(guardSkills, sections, options);

    return {
      path: this.getOutputPath(options),
      content: sections.join('\n'),
      additionalFiles: additionalFiles.length > 0 ? additionalFiles : undefined,
    };
  }
```

Add the two helper methods:

```typescript
  private maybeExtractGuardSkills(
    ast: Program,
    regularSkills: FactorySkillConfig[],
    options?: FormatOptions
  ): FactorySkillConfig[] {
    if (options?.targetConfig?.guardsAsSkills === false) return [];
    const existingNames = new Set(regularSkills.map((s) => s.name));
    return this.extractGuardSkills(ast, existingNames);
  }

  private maybeAddGuardSkillsListing(
    guardSkills: FactorySkillConfig[],
    sections: string[],
    options?: FormatOptions
  ): void {
    if (options?.targetConfig?.guardsSkillsListing === false) return;
    if (guardSkills.length === 0) return;

    const items = guardSkills
      .map((s) => `- **${s.name}** — ${s.description}`)
      .join('\n');
    sections.push(
      `## Path-specific Skills\n\nThe following skills contain file-specific coding standards:\n\n${items}\n`
    );
  }
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm nx test formatters -- --testNamePattern="guards as skills"`
Expected: PASS.

- [ ] **Step 6: Write additional tests**

Add these tests inside the `describe('guards as skills')` block:

```typescript
    it('should include scope info in skill description', () => {
      const ast = createProgram({
        blocks: [
          createBlock('guards', createObjectContent({
            'api-rules': {
              applyTo: ['apps/api/**/*.ts'],
              description: 'API standards',
              content: 'Use DI.',
            },
          })),
        ],
      });

      const formatter = new FactoryFormatter();
      const result = formatter.format(ast, { version: 'full' });
      const skillFile = result.additionalFiles?.find(
        (f) => f.path === '.factory/skills/api-rules/SKILL.md'
      );
      expect(skillFile!.content).toContain('applies to: apps/api/**/*.ts');
    });

    it('should add path-specific skills listing to AGENTS.md', () => {
      const ast = createProgram({
        blocks: [
          createBlock('guards', createObjectContent({
            'my-rules': {
              applyTo: ['src/**/*.ts'],
              description: 'My rules',
              content: 'Rule content.',
            },
          })),
        ],
      });

      const formatter = new FactoryFormatter();
      const result = formatter.format(ast, { version: 'full' });
      expect(result.content).toContain('## Path-specific Skills');
      expect(result.content).toContain('**my-rules**');
    });

    it('should suppress listing when guardsSkillsListing is false', () => {
      const ast = createProgram({
        blocks: [
          createBlock('guards', createObjectContent({
            'my-rules': {
              applyTo: ['src/**/*.ts'],
              description: 'My rules',
              content: 'Rule content.',
            },
          })),
        ],
      });

      const formatter = new FactoryFormatter();
      const result = formatter.format(ast, {
        version: 'full',
        targetConfig: { guardsSkillsListing: false },
      });
      expect(result.content).not.toContain('Path-specific Skills');
      // But skill files should still be generated
      const skillFile = result.additionalFiles?.find(
        (f) => f.path === '.factory/skills/my-rules/SKILL.md'
      );
      expect(skillFile).toBeDefined();
    });

    it('should not generate guard skills when guardsAsSkills is false', () => {
      const ast = createProgram({
        blocks: [
          createBlock('guards', createObjectContent({
            'my-rules': {
              applyTo: ['src/**/*.ts'],
              description: 'My rules',
              content: 'Rule content.',
            },
          })),
        ],
      });

      const formatter = new FactoryFormatter();
      const result = formatter.format(ast, {
        version: 'full',
        targetConfig: { guardsAsSkills: false },
      });
      const skillFile = result.additionalFiles?.find(
        (f) => f.path === '.factory/skills/my-rules/SKILL.md'
      );
      expect(skillFile).toBeUndefined();
      expect(result.content).not.toContain('Path-specific Skills');
    });

    it('should skip guard entry that collides with @skills entry', () => {
      const ast = createProgram({
        blocks: [
          createBlock('skills', createObjectContent({
            'my-rules': {
              description: 'Explicit skill',
              content: 'Explicit content.',
            },
          })),
          createBlock('guards', createObjectContent({
            'my-rules': {
              applyTo: ['src/**/*.ts'],
              description: 'Guard version',
              content: 'Guard content.',
            },
          })),
        ],
      });

      const formatter = new FactoryFormatter();
      const result = formatter.format(ast, { version: 'full' });
      const skillFiles = result.additionalFiles?.filter(
        (f) => f.path.includes('my-rules')
      ) ?? [];
      expect(skillFiles).toHaveLength(1);
      expect(skillFiles[0]!.content).toContain('Explicit content.');
    });

    it('should skip guard entries with unsafe names', () => {
      const ast = createProgram({
        blocks: [
          createBlock('guards', createObjectContent({
            '../etc/passwd': {
              applyTo: ['**/*'],
              description: 'Bad name',
              content: 'Content.',
            },
          })),
        ],
      });

      const formatter = new FactoryFormatter();
      const result = formatter.format(ast, { version: 'full' });
      expect(result.additionalFiles).toBeUndefined();
    });

    it('should produce no output for empty @guards', () => {
      const ast = createProgram({
        blocks: [createBlock('guards', createObjectContent({}))],
      });

      const formatter = new FactoryFormatter();
      const result = formatter.format(ast, { version: 'full' });
      expect(result.content).not.toContain('Path-specific Skills');
    });

    it('should work without @identity block', () => {
      const ast = createProgram({
        blocks: [
          createBlock('guards', createObjectContent({
            'my-rules': {
              applyTo: ['src/**/*.ts'],
              description: 'Rules',
              content: 'Content.',
            },
          })),
        ],
      });

      const formatter = new FactoryFormatter();
      const result = formatter.format(ast, { version: 'full' });
      expect(result.content).toContain('Path-specific Skills');
      const skillFile = result.additionalFiles?.find(
        (f) => f.path === '.factory/skills/my-rules/SKILL.md'
      );
      expect(skillFile).toBeDefined();
    });
```

- [ ] **Step 7: Run all Factory tests**

Run: `pnpm nx test formatters -- --testNamePattern="FactoryFormatter"`
Expected: All pass.

- [ ] **Step 8: Run full formatters suite for regressions**

Run: `pnpm nx test formatters`
Expected: All pass.

- [ ] **Step 9: Commit**

```bash
git add packages/formatters/src/formatters/factory.ts packages/formatters/src/__tests__/factory.spec.ts
git commit -m "feat(formatters): generate Factory skills from @guards named entries"
```

---

## Chunk 3: Importer — `applyTo` Detection

### Task 4: Extend GitHub parser to detect instruction files

**Files:**
- Modify: `packages/importer/src/parsers/github.ts`
- Modify: `packages/importer/src/__tests__/detector.spec.ts`

- [ ] **Step 1: Write failing tests for canParse**

In `packages/importer/src/__tests__/detector.spec.ts`, add tests inside `describe('detectFormat')`:

```typescript
  it('detects .github/instructions/ files as github format', () => {
    const result = detectFormat('.github/instructions/angular.instructions.md');
    expect(result).toBe('github');
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm nx test importer -- --testNamePattern="detects .github/instructions"`
Expected: FAIL — returns `'generic'` instead of `'github'`.

- [ ] **Step 3: Extend canParse in github parser**

In `packages/importer/src/parsers/github.ts`, update `canParse`:

```typescript
const GITHUB_PATHS = ['copilot-instructions.md', '.github/copilot-instructions.md'];

export const githubParser: FormatParser = {
  name: 'github',

  canParse(filename: string, content: string): boolean {
    const normalized = filename.replace(/\\/g, '/').toLowerCase();
    if (GITHUB_PATHS.some((p) => normalized.endsWith(p))) return true;
    if (normalized.includes('.github/instructions/')) return true;
    if (content && /^---\s*\n[\s\S]*?applyTo:/m.test(content)) return true;
    return false;
  },

  parse(content: string): MarkdownSection[] {
    return parseMarkdownSections(content);
  },
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm nx test importer -- --testNamePattern="detects .github/instructions"`
Expected: PASS.

- [ ] **Step 5: Add test for content-based applyTo detection**

In `detector.spec.ts`, note that `detectFormat` passes empty content. Add a direct parser test:

```typescript
  it('github parser canParse detects applyTo frontmatter in content', () => {
    const { getParser } = await import('../detector.js');
    const parser = getParser('github');
    const content = '---\napplyTo:\n  - "src/**/*.ts"\n---\n# Rules';
    expect(parser.canParse('some/random/file.md', content)).toBe(true);
  });

  it('github parser canParse returns false for empty content on unknown path', () => {
    const { getParser } = await import('../detector.js');
    const parser = getParser('github');
    expect(parser.canParse('some/random/file.md', '')).toBe(false);
  });
```

- [ ] **Step 6: Run tests**

Run: `pnpm nx test importer -- --testNamePattern="github parser canParse|detects .github"`
Expected: All pass.

- [ ] **Step 7: Commit**

```bash
git add packages/importer/src/parsers/github.ts packages/importer/src/__tests__/detector.spec.ts
git commit -m "feat(importer): detect .github/instructions/ files and applyTo frontmatter"
```

---

### Task 5: Add instruction file parse path and @guards emission

**Files:**
- Modify: `packages/importer/src/parsers/github.ts`
- Modify: `packages/importer/src/mapper.ts`
- Modify: `packages/importer/src/emitter.ts`
- Create: `packages/importer/src/__tests__/instruction-import.spec.ts`

- [ ] **Step 1: Write failing integration test**

Create `packages/importer/src/__tests__/instruction-import.spec.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { importFile } from '../importer.js';
import { writeFile, mkdir, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

describe('instruction file import', () => {
  const testDir = join(tmpdir(), 'prs-import-test-' + Date.now());

  beforeAll(async () => {
    await mkdir(testDir, { recursive: true });
  });

  afterAll(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it('should import instruction file with applyTo as @guards named entry', async () => {
    const content = [
      '---',
      'applyTo:',
      '  - "apps/admin/**/*.ts"',
      '  - "apps/webview/**/*.ts"',
      '---',
      '',
      '# Angular Component Standards',
      '',
      'Use OnPush change detection.',
    ].join('\n');

    const filepath = join(testDir, 'angular-components.instructions.md');
    await writeFile(filepath, content);

    const result = await importFile(filepath, { format: 'github' });

    expect(result.prsContent).toContain('@guards');
    expect(result.prsContent).toContain('angular-components');
    expect(result.prsContent).toContain('apps/admin/**/*.ts');
    expect(result.prsContent).toContain('Use OnPush change detection.');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm nx test importer -- --testNamePattern="instruction file import"`
Expected: FAIL — parser doesn't handle `applyTo` frontmatter, content goes to `@context`.

- [ ] **Step 3: Add applyTo frontmatter parsing to github parser**

In `packages/importer/src/parsers/github.ts`:

```typescript
import { parseMarkdownSections } from './markdown.js';
import type { FormatParser } from './types.js';
import type { MarkdownSection } from './markdown.js';
import { basename } from 'path';

const GITHUB_PATHS = ['copilot-instructions.md', '.github/copilot-instructions.md'];

/**
 * Parse YAML frontmatter and extract applyTo array.
 * Returns null if no applyTo frontmatter found.
 */
function parseApplyToFrontmatter(content: string): {
  applyTo: string[];
  body: string;
} | null {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
  if (!match) return null;

  const frontmatter = match[1]!;
  const body = match[2]!;

  if (!frontmatter.includes('applyTo')) return null;

  // Extract applyTo values (simple YAML array parsing)
  const applyTo: string[] = [];
  const lines = frontmatter.split('\n');
  let inApplyTo = false;

  for (const line of lines) {
    if (/^\s*applyTo\s*:/.test(line)) {
      inApplyTo = true;
      // Check for inline value: applyTo: "pattern"
      const inlineMatch = line.match(/applyTo\s*:\s*["'](.+?)["']/);
      if (inlineMatch) {
        applyTo.push(inlineMatch[1]!);
        inApplyTo = false;
      }
      continue;
    }
    if (inApplyTo) {
      const itemMatch = line.match(/^\s*-\s*["']?(.+?)["']?\s*$/);
      if (itemMatch) {
        applyTo.push(itemMatch[1]!);
      } else if (/^\S/.test(line)) {
        inApplyTo = false;
      }
    }
  }

  return applyTo.length > 0 ? { applyTo, body } : null;
}

/**
 * Derive guard entry name from instruction filename.
 */
function deriveEntryName(filename: string): string {
  return basename(filename).replace(/\.instructions\.md$/i, '');
}

/**
 * Extract description from body markdown (first heading or fallback).
 */
function extractDescription(body: string, entryName: string): string {
  const headingMatch = body.match(/^#\s+(.+)$/m);
  return headingMatch ? headingMatch[1]! : `${entryName} rules`;
}

export const githubParser: FormatParser = {
  name: 'github',

  canParse(filename: string, content: string): boolean {
    const normalized = filename.replace(/\\/g, '/').toLowerCase();
    if (GITHUB_PATHS.some((p) => normalized.endsWith(p))) return true;
    if (normalized.includes('.github/instructions/')) return true;
    if (content && /^---\s*\n[\s\S]*?applyTo:/m.test(content)) return true;
    return false;
  },

  parse(content: string, filename?: string): MarkdownSection[] {
    const parsed = parseApplyToFrontmatter(content);
    if (parsed) {
      const entryName = filename ? deriveEntryName(filename) : 'imported';
      const description = extractDescription(parsed.body, entryName);

      return [{
        heading: entryName,
        level: 1,
        content: parsed.body.trim(),
        metadata: {
          type: 'instruction',
          applyTo: parsed.applyTo,
          description,
          entryName,
        },
      }];
    }

    return parseMarkdownSections(content);
  },
};
```

- [ ] **Step 4: Update FormatParser interface to accept optional filename**

In `packages/importer/src/parsers/types.ts`:

```typescript
import type { MarkdownSection } from './markdown.js';

export interface FormatParser {
  name: string;
  canParse(filename: string, content: string): boolean;
  parse(content: string, filename?: string): MarkdownSection[];
}
```

- [ ] **Step 5: Update MarkdownSection to support metadata**

In `packages/importer/src/parsers/markdown.ts`, add to the `MarkdownSection` interface:

```typescript
  /** Optional metadata for specialized parsers. */
  metadata?: Record<string, unknown>;
```

- [ ] **Step 6: Update mapper to handle instruction sections**

In `packages/importer/src/mapper.ts`, update `classifySection` to detect instruction metadata:

```typescript
function classifySection(section: MarkdownSection): ScoredSection {
  // Handle instruction file sections (from github parser)
  if (section.metadata?.type === 'instruction') {
    return {
      ...section,
      targetBlock: 'guards',
      confidence: 0.95,
    };
  }

  // ... rest of existing classification logic
```

- [ ] **Step 7: Update emitter to handle @guards blocks**

In `packages/importer/src/emitter.ts`, update the block emission logic inside `emitPrs` to handle the `guards` block type specially. When `targetBlock === 'guards'`, emit the named entry structure:

In the for loop (around line 22), add a special case before the default emission:

```typescript
    if (blockName === 'guards') {
      // Emit @guards with named entries
      lines.push(`@guards {`);
      for (const section of sections) {
        const meta = section.metadata as Record<string, unknown> | undefined;
        const entryName = (meta?.entryName as string) ?? section.heading;
        const applyTo = (meta?.applyTo as string[]) ?? [];
        const description = (meta?.description as string) ?? `${entryName} rules`;
        const applyToStr = applyTo.map((p) => `"${p}"`).join(', ');
        lines.push(`  ${entryName}: {`);
        lines.push(`    applyTo: [${applyToStr}]`);
        lines.push(`    description: "${description}"`);
        lines.push(`    content: """`);
        for (const contentLine of section.content.split('\n')) {
          lines.push(`    ${contentLine}`);
        }
        lines.push(`    """`);
        lines.push(`  }`);
      }
      lines.push(`}`);
      lines.push('');
      continue;
    }
```

- [ ] **Step 8: Pass filename through to parser**

In `packages/importer/src/importer.ts`, update the `parse` call to pass the filename:

```typescript
  const markdownSections = parser.parse(raw, filepath);
```

- [ ] **Step 9: Run integration test**

Run: `pnpm nx test importer -- --testNamePattern="instruction file import"`
Expected: PASS.

- [ ] **Step 10: Run full importer test suite**

Run: `pnpm nx test importer`
Expected: All pass — no regressions.

- [ ] **Step 11: Commit**

```bash
git add packages/importer/src/parsers/github.ts packages/importer/src/parsers/types.ts packages/importer/src/parsers/markdown.ts packages/importer/src/mapper.ts packages/importer/src/emitter.ts packages/importer/src/importer.ts packages/importer/src/__tests__/instruction-import.spec.ts
git commit -m "feat(importer): import instruction files with applyTo as @guards named entries"
```

---

### Task 6: Add directory import to CLI

**Files:**
- Modify: `packages/cli/src/commands/import.ts`
- Create: `packages/cli/src/__tests__/import-directory.spec.ts`

- [ ] **Step 1: Write failing test**

Create `packages/cli/src/__tests__/import-directory.spec.ts`:

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { writeFile, mkdir, rm, readFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { importDirectory } from '../commands/import.js';

describe('importDirectory', () => {
  const testDir = join(tmpdir(), 'prs-import-dir-test-' + Date.now());

  beforeAll(async () => {
    await mkdir(testDir, { recursive: true });
    await writeFile(
      join(testDir, 'angular.instructions.md'),
      '---\napplyTo:\n  - "apps/admin/**/*.ts"\n---\n\n# Angular\n\nAngular rules.'
    );
    await writeFile(
      join(testDir, 'api.instructions.md'),
      '---\napplyTo:\n  - "apps/api/**/*.ts"\n---\n\n# API\n\nAPI rules.'
    );
    await writeFile(join(testDir, 'readme.md'), '# Not an instruction file');
  });

  afterAll(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it('should combine instruction files into single @guards block', async () => {
    const result = await importDirectory(testDir);
    expect(result).toContain('@guards');
    expect(result).toContain('angular');
    expect(result).toContain('api');
    expect(result).toContain('apps/admin/**/*.ts');
    expect(result).toContain('apps/api/**/*.ts');
    expect(result).not.toContain('readme');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm nx test cli -- --testNamePattern="importDirectory"`
Expected: FAIL — `importDirectory` does not exist.

- [ ] **Step 3: Implement importDirectory**

In `packages/cli/src/commands/import.ts`, add the exported function and update the command to detect directories:

```typescript
import { stat, readdir, readFile as fsReadFile } from 'fs/promises';
import { join, basename } from 'path';

/**
 * Parse applyTo frontmatter from an instruction file.
 */
function parseInstructionFrontmatter(content: string): {
  applyTo: string[];
  body: string;
} | null {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
  if (!match) return null;
  const frontmatter = match[1]!;
  const body = match[2]!;
  if (!frontmatter.includes('applyTo')) return null;

  const applyTo: string[] = [];
  const lines = frontmatter.split('\n');
  let inApplyTo = false;
  for (const line of lines) {
    if (/^\s*applyTo\s*:/.test(line)) {
      inApplyTo = true;
      const inlineMatch = line.match(/applyTo\s*:\s*["'](.+?)["']/);
      if (inlineMatch) {
        applyTo.push(inlineMatch[1]!);
        inApplyTo = false;
      }
      continue;
    }
    if (inApplyTo) {
      const itemMatch = line.match(/^\s*-\s*["']?(.+?)["']?\s*$/);
      if (itemMatch) applyTo.push(itemMatch[1]!);
      else if (/^\S/.test(line)) inApplyTo = false;
    }
  }
  return applyTo.length > 0 ? { applyTo, body } : null;
}

/**
 * Import a directory of .instructions.md files into a single @guards block.
 */
export async function importDirectory(dirPath: string): Promise<string> {
  const allFiles = await readdir(dirPath);
  const instructionFiles = allFiles
    .filter((f) => f.endsWith('.instructions.md'))
    .sort();

  if (instructionFiles.length === 0) {
    throw new Error(`No .instructions.md files found in ${dirPath}`);
  }

  const entries: string[] = [];
  for (const file of instructionFiles) {
    const content = await fsReadFile(join(dirPath, file), 'utf-8');
    const parsed = parseInstructionFrontmatter(content);
    if (!parsed) continue;

    const name = basename(file).replace(/\.instructions\.md$/i, '');
    const headingMatch = parsed.body.match(/^#\s+(.+)$/m);
    const description = headingMatch ? headingMatch[1]! : `${name} rules`;
    const applyToStr = parsed.applyTo.map((p) => `"${p}"`).join(', ');

    entries.push(
      `  ${name}: {\n` +
      `    applyTo: [${applyToStr}]\n` +
      `    description: "${description}"\n` +
      `    content: """\n` +
      parsed.body.trim().split('\n').map((l) => `    ${l}`).join('\n') + '\n' +
      `    """\n` +
      `  }`
    );
  }

  const id = basename(dirPath).toLowerCase().replace(/[^a-z0-9-]/g, '-') || 'github-instructions';
  return (
    `@meta { id: "${id}" syntax: "1.0.0" }\n\n` +
    `@guards {\n${entries.join('\n')}\n}\n`
  );
}
```

Then update the `importCommand` function to detect directory input (add near the top, before the existing `importFile` call):

```typescript
  // Check if input is a directory
  const inputStat = await stat(file).catch(() => null);
  if (inputStat?.isDirectory()) {
    const prsContent = await importDirectory(file);
    if (options.dryRun) {
      console.log(prsContent);
      return;
    }
    // Write to output
    const outputDir = options.output ?? '.promptscript';
    await mkdir(outputDir, { recursive: true });
    const outputPath = join(outputDir, 'imported.prs');
    await writeFile(outputPath, prsContent);
    console.log(`✔ Imported directory to ${outputPath}`);
    return;
  }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm nx test cli -- --testNamePattern="importDirectory"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/cli/src/commands/import.ts packages/cli/src/__tests__/import-directory.spec.ts
git commit -m "feat(cli): support directory import for .instructions.md files"
```

---

## Chunk 4: Documentation

### Task 7: Document @guards named entries in language reference

**Files:**
- Modify: `docs/reference/language.md`

- [ ] **Step 1: Add "Named Instruction Entries" subsection**

In `docs/reference/language.md`, after the existing `@guards` applyTo integration section (after the `!!! note "Version Required"` block, around line 700), add:

````markdown
#### Named Instruction Entries

For projects with multiple path-specific instruction files, use named entries in `@guards` to generate individual instruction files with their own `applyTo` patterns:

```text
@meta { id: "named-guards-docs" syntax: "1.0.0" }

@guards {
  angular-components: {
    applyTo: ["apps/admin/**/*.ts", "apps/webview/**/*.ts"]
    description: "Angular component coding standards"
    content: """
    Use OnPush change detection for all components.
    Always implement OnDestroy for cleanup.
    """
  }
  inversify: {
    applyTo: ["apps/api/**/*.ts"]
    description: "InversifyJS DI coding standards"
    content: """
    Use constructor injection with inject decorator.
    Register all bindings in the container module.
    """
  }
}
```

Each named entry generates a separate instruction file per target:

- **GitHub Copilot** (`version: multifile` or `full`): `.github/instructions/<name>.instructions.md` with `applyTo` frontmatter
- **Factory AI** (`version: multifile` or `full`): `.factory/skills/<name>/SKILL.md` with scope info in the description

Named entries support three properties:

| Property | Required | Description |
|----------|----------|-------------|
| `applyTo` | Yes | Array of glob patterns for file targeting |
| `description` | No | Human-readable description (defaults to `<name> rules`) |
| `content` | No | Full instruction content (triple-quoted markdown) |

Named entries and `globs` + `@standards` auto-split can coexist in the same `@guards` block.

#### Merge Behavior with `@use`

When multiple `@use`'d files contribute `@guards` blocks with named entries:

- Named entries from different files are preserved as separate keys (ObjectContent deep merge)
- If two files define the same entry name, the importing file's entry takes precedence
- `globs` arrays are concatenated with deduplication
````

- [ ] **Step 2: Update migration guide**

In `docs/guides/migration.md`, in the GitHub Copilot section, add an example showing migration from instruction files to named entries.

- [ ] **Step 3: Update best practices**

In `docs/guides/ai-migration-best-practices.md`, update the GitHub section to mention named entries as the mechanism for `.github/instructions/` files.

- [ ] **Step 4: Run docs validation**

Run: `pnpm run docs:validate:check`
Expected: All pass (update snapshots if needed with `--update-snapshots`).

- [ ] **Step 5: Commit**

```bash
git add docs/reference/language.md docs/guides/migration.md docs/guides/ai-migration-best-practices.md
git commit -m "docs: document @guards named entries and merge behavior"
```

---

### Task 8: Run full verification pipeline

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

- [ ] **Step 6: Check schemas**

Run: `pnpm schema:check`

- [ ] **Step 7: Check skills**

Run: `pnpm skill:check`

- [ ] **Step 8: Fix any issues found and commit**

```bash
git add -A
git commit -m "chore: fix formatting and lint issues"
```
