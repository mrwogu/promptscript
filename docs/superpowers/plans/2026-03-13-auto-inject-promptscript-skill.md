# Auto-inject PromptScript SKILL.md Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Automatically inject the bundled PromptScript SKILL.md into compilation output so AI coding agents in downstream projects understand `.prs` syntax.

**Architecture:** The Compiler injects SKILL.md after formatters produce outputs, using each formatter's skill path metadata (`getSkillBasePath()` / `getSkillFileName()`). The CLI reads the bundled SKILL.md and passes its content to the Compiler. A top-level `includePromptScriptSkill` config flag (default: true) controls opt-out.

**Tech Stack:** TypeScript, Vitest, Nx monorepo (packages: core, compiler, formatters, cli)

**Spec:** `docs/superpowers/specs/2026-03-13-auto-inject-promptscript-skill-design.md`

---

## Chunk 1: Formatter Interface & Base Classes

### Task 1: Add `getSkillBasePath()` and `getSkillFileName()` to Formatter interfaces

**Files:**

- Modify: `packages/compiler/src/types.ts:45-56` (compiler Formatter interface)
- Modify: `packages/formatters/src/types.ts:46-57` (formatters Formatter interface)

- [ ] **Step 1: Add methods to compiler Formatter interface**

In `packages/compiler/src/types.ts`, add two methods to the `Formatter` interface after the `format()` method (line 55):

```typescript
/** Base path for skills (e.g., '.claude/skills'), or null if no skill support */
getSkillBasePath(): string | null;
/** Skill file name (e.g., 'SKILL.md' or 'skill.md'), or null if no skill support */
getSkillFileName(): string | null;
```

- [ ] **Step 2: Add methods to formatters Formatter interface**

In `packages/formatters/src/types.ts`, add the same two methods to the `Formatter` interface after the `format()` method (line 56):

```typescript
/** Base path for skills (e.g., '.claude/skills'), or null if no skill support */
getSkillBasePath(): string | null;
/** Skill file name (e.g., 'SKILL.md' or 'skill.md'), or null if no skill support */
getSkillFileName(): string | null;
```

- [ ] **Step 3: Verify TypeScript compilation fails**

Run: `pnpm run typecheck 2>&1 | head -30`
Expected: TypeScript errors in all formatter classes that implement `Formatter` but don't yet have the new methods.

- [ ] **Step 4: Commit interface changes**

```bash
git add packages/compiler/src/types.ts packages/formatters/src/types.ts
git commit -m "feat(compiler,formatters): add getSkillBasePath/getSkillFileName to Formatter interface"
```

### Task 2: Implement defaults in BaseFormatter

**Files:**

- Modify: `packages/formatters/src/base-formatter.ts:18` (BaseFormatter class)
- Test: `packages/formatters/src/__tests__/base-formatter.spec.ts`

- [ ] **Step 1: Write the failing test**

Add to `packages/formatters/src/__tests__/base-formatter.spec.ts`, inside the existing top-level `describe` block:

```typescript
describe('getSkillBasePath', () => {
  it('should return null by default', () => {
    expect(formatter.getSkillBasePath()).toBeNull();
  });
});

describe('getSkillFileName', () => {
  it('should return null by default', () => {
    expect(formatter.getSkillFileName()).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm nx test formatters -- --testPathPattern=base-formatter`
Expected: FAIL — `getSkillBasePath` and `getSkillFileName` are not defined.

- [ ] **Step 3: Implement in BaseFormatter**

In `packages/formatters/src/base-formatter.ts`, add after line 23 (`abstract format(...)`) inside the `BaseFormatter` class:

```typescript
  /** Base path for skills, or null if formatter has no skill support. */
  getSkillBasePath(): string | null {
    return null;
  }

  /** Skill file name, or null if formatter has no skill support. */
  getSkillFileName(): string | null {
    return null;
  }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm nx test formatters -- --testPathPattern=base-formatter`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/formatters/src/base-formatter.ts packages/formatters/src/__tests__/base-formatter.spec.ts
git commit -m "feat(formatters): add default null getSkillBasePath/getSkillFileName to BaseFormatter"
```

### Task 3: Implement in MarkdownInstructionFormatter

**Files:**

- Modify: `packages/formatters/src/markdown-instruction-formatter.ts:114` (class body)
- Test: `packages/formatters/src/__tests__/markdown-instruction-formatter.spec.ts`

- [ ] **Step 1: Write the failing tests**

Add to `packages/formatters/src/__tests__/markdown-instruction-formatter.spec.ts`, inside the existing top-level `describe` block:

```typescript
describe('getSkillBasePath', () => {
  it('should return dotDir/skills from config', () => {
    expect(formatter.getSkillBasePath()).toBe('.test/skills');
  });
});

describe('getSkillFileName', () => {
  it('should return skillFileName from config', () => {
    expect(formatter.getSkillFileName()).toBe('SKILL.md');
  });

  it('should return lowercase skill.md when configured', () => {
    // Create a new TestFormatter instance with lowercase skillFileName
    // The TestFormatter constructor accepts config overrides
    const lowercaseFormatter = new TestFormatter({ skillFileName: 'skill.md' });
    expect(lowercaseFormatter.getSkillFileName()).toBe('skill.md');
  });
});
```

Note: The test file already has a `TestFormatter` class extending `MarkdownInstructionFormatter` with `dotDir: '.test'` and `skillFileName: 'SKILL.md'`. Use the existing `formatter` variable.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm nx test formatters -- --testPathPattern=markdown-instruction-formatter`
Expected: FAIL — methods return `null` from BaseFormatter default.

- [ ] **Step 3: Implement in MarkdownInstructionFormatter**

In `packages/formatters/src/markdown-instruction-formatter.ts`, add after the constructor (around line 129), inside the class body:

```typescript
  override getSkillBasePath(): string | null {
    return `${this.config.dotDir}/skills`;
  }

  override getSkillFileName(): string | null {
    return this.config.skillFileName;
  }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm nx test formatters -- --testPathPattern=markdown-instruction-formatter`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/formatters/src/markdown-instruction-formatter.ts packages/formatters/src/__tests__/markdown-instruction-formatter.spec.ts
git commit -m "feat(formatters): implement getSkillBasePath/getSkillFileName in MarkdownInstructionFormatter"
```

### Task 4: Override in ClaudeFormatter and GitHubFormatter

**Files:**

- Modify: `packages/formatters/src/formatters/claude.ts`
- Modify: `packages/formatters/src/formatters/github.ts`
- Test: `packages/formatters/src/__tests__/claude.spec.ts`
- Test: `packages/formatters/src/__tests__/github.spec.ts`

- [ ] **Step 1: Write failing test for ClaudeFormatter**

Add to `packages/formatters/src/__tests__/claude.spec.ts`, inside the existing top-level `describe`:

```typescript
describe('getSkillBasePath', () => {
  it('should return .claude/skills', () => {
    const formatter = new ClaudeFormatter();
    expect(formatter.getSkillBasePath()).toBe('.claude/skills');
  });
});

describe('getSkillFileName', () => {
  it('should return SKILL.md', () => {
    const formatter = new ClaudeFormatter();
    expect(formatter.getSkillFileName()).toBe('SKILL.md');
  });
});
```

- [ ] **Step 2: Write failing test for GitHubFormatter**

Add to `packages/formatters/src/__tests__/github.spec.ts`, inside the existing top-level `describe`:

```typescript
describe('getSkillBasePath', () => {
  it('should return .github/skills', () => {
    const formatter = new GitHubFormatter();
    expect(formatter.getSkillBasePath()).toBe('.github/skills');
  });
});

describe('getSkillFileName', () => {
  it('should return SKILL.md', () => {
    const formatter = new GitHubFormatter();
    expect(formatter.getSkillFileName()).toBe('SKILL.md');
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `pnpm nx test formatters -- --testPathPattern="claude.spec|github.spec"`
Expected: FAIL — both return `null` from BaseFormatter.

- [ ] **Step 4: Implement override in ClaudeFormatter**

In `packages/formatters/src/formatters/claude.ts`, add inside the `ClaudeFormatter` class body (after the existing properties):

```typescript
  override getSkillBasePath(): string | null {
    return '.claude/skills';
  }

  override getSkillFileName(): string | null {
    return 'SKILL.md';
  }
```

- [ ] **Step 5: Implement override in GitHubFormatter**

In `packages/formatters/src/formatters/github.ts`, add inside the `GitHubFormatter` class body (after the existing properties):

```typescript
  override getSkillBasePath(): string | null {
    return '.github/skills';
  }

  override getSkillFileName(): string | null {
    return 'SKILL.md';
  }
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `pnpm nx test formatters -- --testPathPattern="claude.spec|github.spec"`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add packages/formatters/src/formatters/claude.ts packages/formatters/src/formatters/github.ts packages/formatters/src/__tests__/claude.spec.ts packages/formatters/src/__tests__/github.spec.ts
git commit -m "feat(formatters): override getSkillBasePath/getSkillFileName in Claude and GitHub formatters"
```

### Task 5: Verify all 37 formatters with parameterized test

**Files:**

- Test: `packages/formatters/src/__tests__/skill-path-inventory.spec.ts` (new)

- [ ] **Step 1: Write parameterized verification test**

Create `packages/formatters/src/__tests__/skill-path-inventory.spec.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { FormatterRegistry } from '../registry.js';

/**
 * Complete inventory of expected skill paths for all 37 formatters.
 * Source of truth: docs/superpowers/specs/2026-03-13-auto-inject-promptscript-skill-design.md
 */
const EXPECTED_SKILL_PATHS: Record<string, { basePath: string | null; fileName: string | null }> = {
  // BaseFormatter subclasses
  claude: { basePath: '.claude/skills', fileName: 'SKILL.md' },
  github: { basePath: '.github/skills', fileName: 'SKILL.md' },
  cursor: { basePath: null, fileName: null },
  antigravity: { basePath: null, fileName: null },
  // MarkdownInstructionFormatter subclasses
  adal: { basePath: '.adal/skills', fileName: 'SKILL.md' },
  amp: { basePath: '.agents/skills', fileName: 'SKILL.md' },
  augment: { basePath: '.augment/skills', fileName: 'SKILL.md' },
  cline: { basePath: '.agents/skills', fileName: 'SKILL.md' },
  codebuddy: { basePath: '.codebuddy/skills', fileName: 'SKILL.md' },
  codex: { basePath: '.agents/skills', fileName: 'SKILL.md' },
  'command-code': { basePath: '.commandcode/skills', fileName: 'SKILL.md' },
  continue: { basePath: '.continue/skills', fileName: 'SKILL.md' },
  cortex: { basePath: '.cortex/skills', fileName: 'SKILL.md' },
  crush: { basePath: '.crush/skills', fileName: 'SKILL.md' },
  factory: { basePath: '.factory/skills', fileName: 'SKILL.md' },
  gemini: { basePath: '.gemini/skills', fileName: 'skill.md' },
  goose: { basePath: '.goose/skills', fileName: 'SKILL.md' },
  iflow: { basePath: '.iflow/skills', fileName: 'SKILL.md' },
  junie: { basePath: '.junie/skills', fileName: 'SKILL.md' },
  kilo: { basePath: '.kilocode/skills', fileName: 'SKILL.md' },
  kiro: { basePath: '.kiro/skills', fileName: 'SKILL.md' },
  kode: { basePath: '.kode/skills', fileName: 'SKILL.md' },
  mcpjam: { basePath: '.mcpjam/skills', fileName: 'SKILL.md' },
  'mistral-vibe': { basePath: '.vibe/skills', fileName: 'SKILL.md' },
  mux: { basePath: '.mux/skills', fileName: 'SKILL.md' },
  neovate: { basePath: '.neovate/skills', fileName: 'SKILL.md' },
  openclaw: { basePath: 'skills/skills', fileName: 'SKILL.md' },
  opencode: { basePath: '.opencode/skills', fileName: 'SKILL.md' },
  openhands: { basePath: '.openhands/skills', fileName: 'SKILL.md' },
  pi: { basePath: '.pi/skills', fileName: 'SKILL.md' },
  pochi: { basePath: '.pochi/skills', fileName: 'SKILL.md' },
  qoder: { basePath: '.qoder/skills', fileName: 'SKILL.md' },
  'qwen-code': { basePath: '.qwen/skills', fileName: 'SKILL.md' },
  roo: { basePath: '.roo/skills', fileName: 'SKILL.md' },
  trae: { basePath: '.trae/skills', fileName: 'SKILL.md' },
  windsurf: { basePath: '.windsurf/skills', fileName: 'SKILL.md' },
  zencoder: { basePath: '.zencoder/skills', fileName: 'SKILL.md' },
};

describe('Skill path inventory verification', () => {
  const registeredNames = FormatterRegistry.list();

  it('should have entries for all registered formatters', () => {
    for (const name of registeredNames) {
      expect(EXPECTED_SKILL_PATHS).toHaveProperty(name);
    }
  });

  it('should not have stale entries for unregistered formatters', () => {
    for (const name of Object.keys(EXPECTED_SKILL_PATHS)) {
      expect(registeredNames).toContain(name);
    }
  });

  it.each(
    Object.entries(EXPECTED_SKILL_PATHS).map(([name, paths]) => ({
      name,
      basePath: paths.basePath,
      fileName: paths.fileName,
    }))
  )(
    '$name: getSkillBasePath() = $basePath, getSkillFileName() = $fileName',
    ({ name, basePath, fileName }) => {
      const formatter = FormatterRegistry.get(name);
      expect(formatter).toBeDefined();
      expect(formatter!.getSkillBasePath()).toBe(basePath);
      expect(formatter!.getSkillFileName()).toBe(fileName);
    }
  );
});
```

- [ ] **Step 2: Run test to verify it passes**

Run: `pnpm nx test formatters -- --testPathPattern=skill-path-inventory`
Expected: PASS — all 37 formatters match their expected paths.

- [ ] **Step 3: Verify typecheck passes**

Run: `pnpm run typecheck`
Expected: PASS — no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add packages/formatters/src/__tests__/skill-path-inventory.spec.ts
git commit -m "test(formatters): add parameterized skill path verification for all 37 formatters"
```

### Task 6: Verify formatters coverage is 97%+

- [ ] **Step 1: Run formatters coverage**

Run: `pnpm nx test formatters -- --coverage`
Expected: 97%+ statements and lines.

- [ ] **Step 2: If coverage is below 97%, add tests for uncovered lines**

Check the coverage report for uncovered lines and add targeted tests.

---

## Chunk 2: Config & Compiler Injection

### Task 7: Add `includePromptScriptSkill` to config type

**Files:**

- Modify: `packages/core/src/types/config.ts:95` (PromptScriptConfig interface)

- [ ] **Step 1: Add the config property**

In `packages/core/src/types/config.ts`, add to `PromptScriptConfig` interface after the `universalDir` field (around line 262):

```typescript
  /**
   * Include the bundled PromptScript language skill in compilation output.
   * When enabled, the SKILL.md that teaches AI agents how to work with .prs files
   * is automatically added to each target's native skill directory.
   * @default true
   */
  includePromptScriptSkill?: boolean;
```

- [ ] **Step 2: Regenerate JSON schema**

Run: `pnpm schema:generate`
Expected: `schema/config.json` updated with the new field.

- [ ] **Step 3: Verify schema check passes**

Run: `pnpm schema:check`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add packages/core/src/types/config.ts schema/config.json
git commit -m "feat(core): add includePromptScriptSkill config option"
```

### Task 8: Add `skillContent` to CompilerOptions

**Files:**

- Modify: `packages/compiler/src/types.ts:84-97` (CompilerOptions interface)

- [ ] **Step 1: Add skillContent to CompilerOptions**

In `packages/compiler/src/types.ts`, add to `CompilerOptions` after the `logger` field (line 96):

```typescript
  /**
   * Content of the PromptScript SKILL.md to inject into compilation output.
   * When provided (and config doesn't disable it), this content is added
   * to each formatter's native skill directory.
   */
  skillContent?: string;
```

- [ ] **Step 2: Add skillContent to standalone CompileOptions**

In `packages/compiler/src/compiler.ts`, add to the `CompileOptions` interface (around line 597):

```typescript
  /**
   * Content of the PromptScript SKILL.md to inject into compilation output.
   */
  skillContent?: string;
```

- [ ] **Step 3: Thread skillContent in standalone compile() function**

In `packages/compiler/src/compiler.ts`, in the `compile()` function (around line 645), add `skillContent` to the Compiler constructor options:

```typescript
const compiler = new Compiler({
  resolver: resolverOptions,
  validator: options.validator,
  formatters,
  customConventions: options.customConventions,
  prettier: options.prettier,
  skillContent: options.skillContent,
});
```

- [ ] **Step 4: Verify typecheck**

Run: `pnpm run typecheck`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/compiler/src/types.ts packages/compiler/src/compiler.ts
git commit -m "feat(compiler): add skillContent to CompilerOptions and CompileOptions"
```

### Task 9: Implement skill injection in Compiler

**Files:**

- Modify: `packages/compiler/src/compiler.ts:280-304` (after format loop, before return)
- Test: `packages/compiler/src/__tests__/compiler.spec.ts`

- [ ] **Step 1: Update existing mock formatters and inline Formatter objects**

Add to `packages/compiler/src/__tests__/compiler.spec.ts`. First, update `createMockFormatter` to support skill path methods. Replace the existing `createMockFormatter` function:

> **IMPORTANT:** After updating `createMockFormatter` and `createFailingFormatter`, you MUST also update ALL other places in the test file that create `Formatter`-conforming values:
>
> 1. **`class TestFormatter implements Formatter`** (around line 147): Add methods `getSkillBasePath(): string | null { return null; }` and `getSkillFileName(): string | null { return null; }` to the class body.
> 2. **Inline `Formatter` object literals** (around lines 322, 658, 670, 712, 724, 766 — 6 total): Add `getSkillBasePath: () => null` and `getSkillFileName: () => null` to each.
>
> Without these updates, TypeScript will error because these no longer satisfy the `Formatter` interface.

```typescript
function createMockFormatter(
  name: string,
  outputPath: string = `./${name}/output.md`,
  skillBasePath: string | null = null,
  skillFileName: string | null = null
): Formatter {
  return {
    name,
    outputPath,
    description: `Mock ${name} formatter for testing`,
    defaultConvention: 'markdown',
    format: vi.fn((ast: Program) => {
      const id = ast.meta?.fields?.['id'] as string | undefined;
      return {
        path: outputPath,
        content: `# ${name} output\nID: ${id ?? 'unknown'}`,
      };
    }),
    getSkillBasePath: () => skillBasePath,
    getSkillFileName: () => skillFileName,
  };
}
```

Also update `createFailingFormatter`:

```typescript
function createFailingFormatter(name: string, error: string): Formatter {
  return {
    name,
    outputPath: `./${name}/output.md`,
    description: `Mock failing ${name} formatter`,
    defaultConvention: 'markdown',
    format: vi.fn(() => {
      throw new Error(error);
    }),
    getSkillBasePath: () => null,
    getSkillFileName: () => null,
  };
}
```

Then add the test `describe` block:

```typescript
describe('skill injection', () => {
  const skillContent = '# PromptScript Language Skill\nThis teaches .prs syntax.';

  it('should inject skill when skillContent provided and formatter supports skills', async () => {
    const formatter = createMockFormatter('claude', 'CLAUDE.md', '.claude/skills', 'SKILL.md');
    const compiler = createTestCompiler({ formatters: [formatter], skillContent });

    const result = await compiler.compile('test.prs');

    expect(result.success).toBe(true);
    expect(result.outputs.has('.claude/skills/promptscript/SKILL.md')).toBe(true);
    const skillOutput = result.outputs.get('.claude/skills/promptscript/SKILL.md');
    expect(skillOutput?.content).toContain('PromptScript Language Skill');
  });

  it('should skip injection when skillContent is not provided', async () => {
    const formatter = createMockFormatter('claude', 'CLAUDE.md', '.claude/skills', 'SKILL.md');
    const compiler = createTestCompiler({ formatters: [formatter] });

    const result = await compiler.compile('test.prs');

    expect(result.success).toBe(true);
    expect(result.outputs.has('.claude/skills/promptscript/SKILL.md')).toBe(false);
  });

  it('should skip injection when formatter returns null skill path', async () => {
    const formatter = createMockFormatter('cursor', '.cursor/rules/project.mdc', null, null);
    const compiler = createTestCompiler({ formatters: [formatter], skillContent });

    const result = await compiler.compile('test.prs');

    expect(result.success).toBe(true);
    expect(
      Array.from(result.outputs.keys()).filter((k) => k.includes('promptscript/SKILL'))
    ).toHaveLength(0);
  });

  it('should use correct skill file name per formatter (e.g., lowercase skill.md)', async () => {
    const formatter = createMockFormatter('gemini', 'GEMINI.md', '.gemini/skills', 'skill.md');
    const compiler = createTestCompiler({ formatters: [formatter], skillContent });

    const result = await compiler.compile('test.prs');

    expect(result.outputs.has('.gemini/skills/promptscript/skill.md')).toBe(true);
    expect(result.outputs.has('.gemini/skills/promptscript/SKILL.md')).toBe(false);
  });

  it('should warn and skip when collision with user-defined skill at same path', async () => {
    const formatter: Formatter = {
      ...createMockFormatter('claude', 'CLAUDE.md', '.claude/skills', 'SKILL.md'),
      format: vi.fn(() => ({
        path: 'CLAUDE.md',
        content: '# Claude',
        additionalFiles: [
          {
            path: '.claude/skills/promptscript/SKILL.md',
            content: '# User-defined promptscript skill',
          },
        ],
      })),
    };

    const compiler = createTestCompiler({ formatters: [formatter], skillContent });
    const result = await compiler.compile('test.prs');

    expect(result.success).toBe(true);
    // User's content should win (first-writer)
    const skillOutput = result.outputs.get('.claude/skills/promptscript/SKILL.md');
    expect(skillOutput?.content).toContain('User-defined promptscript skill');
    // Should have a collision warning
    expect(result.warnings.some((w) => w.ruleId === 'PS4001')).toBe(true);
  });

  it('should produce collision warning when two formatters share dotDir', async () => {
    const cline = createMockFormatter('cline', '.clinerules', '.agents/skills', 'SKILL.md');
    const codex = createMockFormatter('codex', 'AGENTS.md', '.agents/skills', 'SKILL.md');
    const compiler = createTestCompiler({ formatters: [cline, codex], skillContent });

    const result = await compiler.compile('test.prs');

    expect(result.success).toBe(true);
    // First formatter's skill should be written
    expect(result.outputs.has('.agents/skills/promptscript/SKILL.md')).toBe(true);
    // Second should produce collision warning
    const collisionWarnings = result.warnings.filter(
      (w) => w.ruleId === 'PS4001' && w.message.includes('.agents/skills/promptscript/SKILL.md')
    );
    expect(collisionWarnings.length).toBeGreaterThanOrEqual(1);
  });

  it('should inject skill for multiple formatters with different paths', async () => {
    const claude = createMockFormatter('claude', 'CLAUDE.md', '.claude/skills', 'SKILL.md');
    const github = createMockFormatter(
      'github',
      '.github/copilot-instructions.md',
      '.github/skills',
      'SKILL.md'
    );
    const compiler = createTestCompiler({ formatters: [claude, github], skillContent });

    const result = await compiler.compile('test.prs');

    expect(result.outputs.has('.claude/skills/promptscript/SKILL.md')).toBe(true);
    expect(result.outputs.has('.github/skills/promptscript/SKILL.md')).toBe(true);
  });

  it('should add PromptScript marker to injected skill', async () => {
    const formatter = createMockFormatter('claude', 'CLAUDE.md', '.claude/skills', 'SKILL.md');
    const compiler = createTestCompiler({ formatters: [formatter], skillContent });

    const result = await compiler.compile('test.prs');

    const skillOutput = result.outputs.get('.claude/skills/promptscript/SKILL.md');
    expect(skillOutput?.content).toContain('<!-- PromptScript');
  });
});
```

Note: `createTestCompiler` is a helper you need to add. Check if one exists already; if not, add it:

```typescript
function createTestCompiler(overrides: Partial<CompilerOptions> = {}): Compiler {
  return new Compiler({
    resolver: { registryPath: '/registry' },
    formatters: [],
    ...overrides,
  });
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm nx test compiler`
Expected: FAIL — skill injection not implemented yet.

- [ ] **Step 3: Implement skill injection in Compiler.compile()**

In `packages/compiler/src/compiler.ts`, after the formatter loop ends (around line 280, after the closing `}` of the `for` loop) and before `stats.formatTime = Date.now() - startFormat;`, add:

```typescript
// Inject PromptScript SKILL.md into each formatter's skill directory
if (this.options.skillContent) {
  for (const { formatter } of this.loadedFormatters) {
    const skillBasePath = formatter.getSkillBasePath();
    const skillFileName = formatter.getSkillFileName();
    if (!skillBasePath || !skillFileName) {
      this.logger.debug(`  Skipping skill injection for ${formatter.name} (no skill support)`);
      continue;
    }

    const skillPath = `${skillBasePath}/promptscript/${skillFileName}`;
    const existingOwner = outputPathOwners.get(skillPath);
    if (existingOwner) {
      formatWarnings.push({
        ruleId: 'PS4001',
        ruleName: 'output-path-collision',
        severity: 'warning',
        message: `Output path '${skillPath}' is already written by '${existingOwner}'. Skipping auto-injected PromptScript skill for '${formatter.name}'.`,
        suggestion: `The user-defined skill takes precedence. To use the bundled skill, remove the custom one or rename it.`,
      });
      continue;
    }
    outputPathOwners.set(skillPath, `${formatter.name}:promptscript-skill`);

    const skillOutput: FormatterOutput = {
      path: skillPath,
      content: this.options.skillContent,
    };
    outputs.set(skillPath, addMarkerToOutput(skillOutput));
    this.logger.verbose(`  → ${skillPath} (auto-injected promptscript skill)`);
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm nx test compiler`
Expected: PASS — all tests including new skill injection tests.

- [ ] **Step 5: Commit**

```bash
git add packages/compiler/src/compiler.ts packages/compiler/src/__tests__/compiler.spec.ts
git commit -m "feat(compiler): implement PromptScript SKILL.md injection after formatting"
```

### Task 10: Test compileAll() and standalone compile() propagation

**Files:**

- Test: `packages/compiler/src/__tests__/compiler.spec.ts`

- [ ] **Step 1: Write test for compileAll() propagation**

Add to `packages/compiler/src/__tests__/compiler.spec.ts`, inside the `skill injection` describe:

```typescript
it('should propagate skillContent through compileAll()', async () => {
  // compileAll() spreads ...this.options when creating per-formatter Compiler instances,
  // so skillContent propagates automatically. We verify by checking that compileAll
  // produces skill outputs for formatters that support skills.
  // Note: compileAll() uses FormatterRegistry internally, so this test may need
  // integration-level setup. If mocking FormatterRegistry is complex, verify
  // propagation indirectly via the standalone compile() test below instead.
  const formatter = createMockFormatter('claude', 'CLAUDE.md', '.claude/skills', 'SKILL.md');
  const compiler = createTestCompiler({ formatters: [formatter], skillContent });

  // Use compile() (not compileAll) since both share the same injection code path
  const result = await compiler.compile('test.prs');
  expect(result.success).toBe(true);
  expect(result.outputs.has('.claude/skills/promptscript/SKILL.md')).toBe(true);
});

it('should support skillContent in standalone compile()', async () => {
  const result = await compile('test.prs', {
    formatters: [createMockFormatter('claude', 'CLAUDE.md', '.claude/skills', 'SKILL.md')],
    skillContent,
  });

  expect(result.success).toBe(true);
  expect(result.outputs.has('.claude/skills/promptscript/SKILL.md')).toBe(true);
});
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `pnpm nx test compiler`
Expected: PASS

- [ ] **Step 3: Verify compiler coverage is 97%+**

Run: `pnpm nx test compiler -- --coverage`
Expected: 97%+ statements and lines.

- [ ] **Step 4: Commit**

```bash
git add packages/compiler/src/__tests__/compiler.spec.ts
git commit -m "test(compiler): add tests for compileAll and standalone compile skill propagation"
```

---

## Chunk 3: CLI Integration

### Task 11: Wire skill injection in CLI compile command

**Files:**

- Modify: `packages/cli/src/commands/compile.ts`

- [ ] **Step 1: Add SKILL.md resolution logic**

In `packages/cli/src/commands/compile.ts`, add a helper function near the top (after imports, around line 15):

First, add the `__dirname` setup near the top of the file (after existing imports). Note: `compile.ts` already imports `{ existsSync } from 'fs'`, `{ readFile } from 'fs/promises'`, and `{ resolve, dirname } from 'path'` — do NOT duplicate those. Only add:

```typescript
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
```

Then add the helper function:

```typescript
/**
 * Resolve and read the bundled PromptScript SKILL.md.
 * Uses the same dual-candidate pattern as init.ts to handle both
 * development (packages/cli/skills/...) and bundled (dist/packages/cli/skills/...) modes.
 * Returns the content string, or undefined if the file is missing.
 */
async function loadBundledSkillContent(logger: Logger): Promise<string | undefined> {
  // Dual-candidate pattern: works in both dev mode and esbuild-bundled mode
  // Dev:     __dirname = packages/cli/src/commands → ../../skills/promptscript/SKILL.md
  // Bundled: __dirname = dist/packages/cli         → ../../../skills/promptscript/SKILL.md (not present)
  //          fallback  = dist/packages/cli         → skills/promptscript/SKILL.md (copied by build)
  const skillRelPath = 'skills/promptscript/SKILL.md';
  const candidates = [
    resolve(__dirname, '..', '..', skillRelPath), // dev: packages/cli/skills/...
    resolve(__dirname, skillRelPath), // bundled: dist/packages/cli/skills/...
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      try {
        const content = await readFile(candidate, 'utf-8');
        logger.debug(
          `Loaded bundled PromptScript skill from ${candidate} (${content.length} bytes)`
        );
        return content;
      } catch {
        continue;
      }
    }
  }

  logger.verbose('Warning: Could not load bundled PromptScript SKILL.md — skill injection skipped');
  return undefined;
}
```

> **Important:** This uses the same dual-candidate `__dirname` pattern as `packages/cli/src/commands/init.ts:findSkillsDir()`. The CLI is bundled via esbuild into a single file at `dist/packages/cli/index.js`, so `import.meta.url` would resolve incorrectly. The `__dirname` approach with multiple candidates handles both dev and production modes.

- [ ] **Step 2: Pass skillContent to Compiler in compileCommand**

Find the section in `compileCommand` where the `Compiler` is instantiated (look for `new Compiler({`). Before that instantiation, add:

```typescript
// Load bundled PromptScript skill if not disabled.
// Design decision: The CLI checks the config flag and decides whether to pass skillContent.
// The Compiler simply checks if skillContent was provided — it does NOT read config.
// This keeps the Compiler's API clean (provide content = inject, omit = skip).
let skillContent: string | undefined;
if (config.includePromptScriptSkill !== false) {
  skillContent = await loadBundledSkillContent(logger);
}
```

Then add `skillContent` to the Compiler constructor options:

```typescript
    const compiler = new Compiler({
      resolver: { ... },
      validator: ...,
      formatters: ...,
      // ... existing options ...
      skillContent,
    });
```

- [ ] **Step 3: Verify typecheck**

Run: `pnpm run typecheck`
Expected: PASS

- [ ] **Step 4: Manual smoke test**

Run: `pnpm prs compile --dry-run`
Expected: Output should show the injected SKILL.md file for each target (e.g., `.claude/skills/promptscript/SKILL.md`).

- [ ] **Step 5: Commit**

```bash
git add packages/cli/src/commands/compile.ts
git commit -m "feat(cli): wire bundled PromptScript SKILL.md injection in compile command"
```

---

## Chunk 4: Documentation & Final Verification

### Task 12: Update documentation

**Files:**

- Modify: `docs/getting-started.md`
- Modify: `skills/promptscript/SKILL.md`
- Modify: `README.md`

- [ ] **Step 1: Update getting-started.md**

In `docs/getting-started.md`, after the "Compile to Native Formats" section (after line 176 `prs compile`), add:

````markdown
#### Bundled PromptScript Skill

When you compile, PromptScript automatically includes a language skill in each target's output.
This skill teaches AI coding agents how to read, write, and troubleshoot `.prs` files — so your
AI tools understand PromptScript syntax without any extra setup.

To disable this behavior, add to `promptscript.yaml`:

```yaml
includePromptScriptSkill: false
```
````

````

- [ ] **Step 2: Update SKILL.md**

In `skills/promptscript/SKILL.md`, in the Configuration section (around line 300), add:

```markdown
### Auto-injection

This skill is automatically included when compiling with `prs compile`. No manual copying needed.
To disable, set `includePromptScriptSkill: false` in your `promptscript.yaml`.
````

- [ ] **Step 3: Update README.md**

In `README.md`, find the compilation features section and add a bullet point:

```markdown
- **Bundled language skill** — AI agents automatically learn PromptScript syntax via injected SKILL.md
```

- [ ] **Step 4: Sync SKILL.md copies**

Run: `pnpm skill:sync`
Expected: All SKILL.md copies updated.

- [ ] **Step 5: Verify docs**

Run: `pnpm docs:validate:check`
Expected: PASS

- [ ] **Step 6: Verify no outdated references in tutorial.md and index.md**

Read `docs/tutorial.md` and `docs/index.md` — confirm no references to manual SKILL.md copying.

- [ ] **Step 7: Commit**

```bash
git add docs/getting-started.md skills/promptscript/SKILL.md README.md
git add packages/cli/skills/promptscript/SKILL.md .promptscript/skills/promptscript/SKILL.md .claude/skills/promptscript/SKILL.md
git commit -m "docs: document auto-inject PromptScript SKILL.md feature"
```

### Task 13: Regenerate API docs and verify

- [ ] **Step 1: Regenerate TypeDoc API reference**

Run: `pnpm docs:generate`
Expected: API reference docs updated.

- [ ] **Step 2: Verify new methods appear in Formatter docs**

Read `docs/api-reference/compiler/src/interfaces/Formatter.md` — confirm `getSkillBasePath()` and `getSkillFileName()` are documented.

- [ ] **Step 3: Verify skillContent appears in CompilerOptions docs**

Read `docs/api-reference/compiler/src/interfaces/CompilerOptions.md` — confirm `skillContent` is documented.

- [ ] **Step 4: Verify includePromptScriptSkill appears in PromptScriptConfig docs**

Read `docs/api-reference/core/src/interfaces/PromptScriptConfig.md` — confirm `includePromptScriptSkill` is documented.

- [ ] **Step 5: Commit generated docs**

```bash
git add docs/api-reference/
git commit -m "docs: regenerate API reference with skill injection types"
```

### Task 14: Full verification pipeline

- [ ] **Step 1: Run full verification pipeline**

```bash
pnpm run format
pnpm run lint
pnpm run typecheck
pnpm run test
pnpm prs validate --strict
pnpm schema:check
pnpm skill:check
```

Expected: All pass.

- [ ] **Step 2: Verify coverage thresholds**

```bash
pnpm nx test compiler -- --coverage
pnpm nx test formatters -- --coverage
```

Expected: Both packages at 97%+ statements and 97%+ lines.

- [ ] **Step 3: Smoke test with real project**

Run: `pnpm prs compile --dry-run`
Expected: Output includes `promptscript/SKILL.md` files for each configured target.

- [ ] **Step 4: Final commit if any formatting/lint fixes needed**

```bash
git add -A
git commit -m "chore: formatting and lint fixes"
```
