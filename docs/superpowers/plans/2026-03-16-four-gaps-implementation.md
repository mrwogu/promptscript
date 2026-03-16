# Four Gaps Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement 4 features identified by FactoryAI analysis: `prs import` (reverse parser), parameterized skills, skill folders with shared resources, and skill contracts (inputs/outputs).

**Architecture:** Each gap is an independent chunk with its own feature branch. Gaps build on each other sequentially: Luka 1 is standalone, Luka 3 introduces `SkillDefinition` type used by Lukas 2 and 4. All changes are additive (no breaking changes).

**Tech Stack:** TypeScript, Vitest, Nx, pnpm, Chevrotain (parser), Commander.js (CLI)

**Spec:** `docs/superpowers/specs/2026-03-16-four-gaps-design.md`

---

## Chunk 1: `prs import` — Reverse Parser (Luka 1)

Branch: `feat/prs-import`

### Task 1.1: Scaffold `packages/importer` package

**Files:**

- Create: `packages/importer/package.json`
- Create: `packages/importer/tsconfig.json`
- Create: `packages/importer/tsconfig.spec.json`
- Create: `packages/importer/project.json`
- Create: `packages/importer/vite.config.ts`
- Create: `packages/importer/eslint.config.cjs`
- Create: `packages/importer/src/index.ts`

- [ ] **Step 1: Generate package with Nx**

```bash
pnpm nx g @nx/js:lib packages/importer --bundler=vite --unitTestRunner=vitest --importPath=@promptscript/importer
```

- [ ] **Step 2: Add dependency on `@promptscript/core`**

Edit `packages/importer/package.json` — add to dependencies:

```json
"dependencies": {
  "@promptscript/core": "workspace:*"
}
```

- [ ] **Step 3: Create empty public API**

```typescript
// packages/importer/src/index.ts
export { importFile, type ImportResult, type ImportOptions } from './importer.js';
```

- [ ] **Step 4: Verify build**

```bash
pnpm nx build importer
```

- [ ] **Step 5: Commit**

```bash
git add packages/importer/
git commit -m "chore(importer): scaffold importer package"
```

### Task 1.2: Confidence scoring system

**Files:**

- Create: `packages/importer/src/confidence.ts`
- Create: `packages/importer/src/__tests__/confidence.spec.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// packages/importer/src/__tests__/confidence.spec.ts
import { describe, it, expect } from 'vitest';
import { ConfidenceLevel, classifyConfidence, type ScoredSection } from '../confidence.js';

describe('confidence', () => {
  describe('classifyConfidence', () => {
    it('returns HIGH for scores above 0.8', () => {
      expect(classifyConfidence(0.9)).toBe(ConfidenceLevel.HIGH);
      expect(classifyConfidence(0.81)).toBe(ConfidenceLevel.HIGH);
    });

    it('returns MEDIUM for scores between 0.5 and 0.8', () => {
      expect(classifyConfidence(0.7)).toBe(ConfidenceLevel.MEDIUM);
      expect(classifyConfidence(0.5)).toBe(ConfidenceLevel.MEDIUM);
    });

    it('returns LOW for scores below 0.5', () => {
      expect(classifyConfidence(0.3)).toBe(ConfidenceLevel.LOW);
      expect(classifyConfidence(0)).toBe(ConfidenceLevel.LOW);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm nx test importer -- --run
```

- [ ] **Step 3: Write implementation**

```typescript
// packages/importer/src/confidence.ts
export enum ConfidenceLevel {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

export interface ScoredSection {
  heading: string;
  content: string;
  targetBlock: string;
  confidence: number;
  level: ConfidenceLevel;
}

export function classifyConfidence(score: number): ConfidenceLevel {
  if (score > 0.8) return ConfidenceLevel.HIGH;
  if (score >= 0.5) return ConfidenceLevel.MEDIUM;
  return ConfidenceLevel.LOW;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm nx test importer -- --run
```

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(importer): add confidence scoring system"
```

### Task 1.3: Markdown parser — section extraction

**Files:**

- Create: `packages/importer/src/parsers/markdown.ts`
- Create: `packages/importer/src/__tests__/parsers/markdown.spec.ts`

- [ ] **Step 1: Write failing tests**

Tests should cover:

- Extracting H1/H2 sections from markdown
- Preserving code blocks, tables, lists
- Handling empty files, files with no headings
- Handling files with only code blocks

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm nx test importer -- --run
```

- [ ] **Step 3: Implement markdown section parser**

Parse markdown into `MarkdownSection[]`:

```typescript
export interface MarkdownSection {
  heading: string;
  level: number; // 1 for H1, 2 for H2, etc.
  content: string;
  rawLines: string[];
}

export function parseMarkdownSections(content: string): MarkdownSection[];
```

- [ ] **Step 4: Run test to verify it passes**

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(importer): add markdown section parser"
```

### Task 1.4: Section mapper — heuristic classification

**Files:**

- Create: `packages/importer/src/mapper.ts`
- Create: `packages/importer/src/__tests__/mapper.spec.ts`

- [ ] **Step 1: Write failing tests**

Tests for each heuristic:

- "You are..." text -> `@identity` with HIGH confidence
- "Never/Don't/Always" lists -> `@restrictions` with HIGH confidence
- "Use/Prefer/Follow" lists -> `@standards` with HIGH confidence
- Code blocks -> preserve as text
- Tables -> properties
- Unrecognized sections -> `@context` with LOW confidence
- Mixed content sections -> MEDIUM confidence

- [ ] **Step 2: Run test to verify it fails**

- [ ] **Step 3: Implement mapper**

```typescript
import type { ScoredSection } from './confidence.js';
import type { MarkdownSection } from './parsers/markdown.js';

export function mapSections(sections: MarkdownSection[]): ScoredSection[];
```

Heuristics:

- Check first line for "You are" pattern -> identity
- Check list items for "Never/Don't/Always" keywords -> restrictions
- Check list items for "Use/Prefer/Follow" keywords -> standards
- Check for "## Testing" / "## Commands" / "## CLI" headings -> knowledge
- Everything else -> context

- [ ] **Step 4: Run test to verify it passes**

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(importer): add heuristic section mapper"
```

### Task 1.5: PRS emitter — AST to .prs text

**Files:**

- Create: `packages/importer/src/emitter.ts`
- Create: `packages/importer/src/__tests__/emitter.spec.ts`

- [ ] **Step 1: Write failing tests**

Tests:

- Emit @meta block with id and syntax
- Emit @identity with text content
- Emit @standards with object/array content
- Emit @restrictions with array content
- Emit @context with text content
- Emit # REVIEW: comments for MEDIUM confidence sections
- Full file emission with all blocks

- [ ] **Step 2: Run test to verify it fails**

- [ ] **Step 3: Implement emitter**

```typescript
import type { ScoredSection } from './confidence.js';
import { ConfidenceLevel } from './confidence.js';

export interface EmitOptions {
  projectName: string;
}

export function emitPrs(sections: ScoredSection[], options: EmitOptions): string;
```

- [ ] **Step 4: Run test to verify it passes**

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(importer): add PRS emitter (AST to .prs text)"
```

### Task 1.6: Format-specific parsers (Tier 1)

**Files:**

- Create: `packages/importer/src/parsers/claude.ts`
- Create: `packages/importer/src/parsers/github.ts`
- Create: `packages/importer/src/parsers/cursor.ts`
- Create: `packages/importer/src/parsers/generic.ts`
- Create: `packages/importer/src/__tests__/parsers/claude.spec.ts`
- Create: `packages/importer/src/__tests__/parsers/github.spec.ts`
- Create: `packages/importer/src/__tests__/parsers/cursor.spec.ts`
- Create: `packages/importer/src/__tests__/parsers/generic.spec.ts`
- Create: `packages/importer/src/__tests__/fixtures/` (sample files)

- [ ] **Step 1: Create fixture files**

Create sample CLAUDE.md, copilot-instructions.md, .cursorrules in fixtures/

- [ ] **Step 2: Write failing tests for each parser**

Each parser test should:

- Parse the fixture file
- Assert correct section extraction
- Assert correct block classification

- [ ] **Step 3: Implement format parsers**

Each parser extends the base markdown parser with format-specific heuristics:

- `claude.ts`: CLAUDE.md specific patterns (sections like "## Don'ts", "## Commands")
- `github.ts`: copilot-instructions.md (typically simpler structure)
- `cursor.ts`: .cursorrules with YAML frontmatter + markdown body
- `generic.ts`: Fallback — pure markdown section parser

```typescript
export interface FormatParser {
  name: string;
  canParse(filename: string, content: string): boolean;
  parse(content: string): MarkdownSection[];
}
```

- [ ] **Step 4: Run all tests**

```bash
pnpm nx test importer -- --run
```

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(importer): add Tier 1 format parsers (Claude, GitHub, Cursor)"
```

### Task 1.7: Format detector

**Files:**

- Create: `packages/importer/src/detector.ts`
- Create: `packages/importer/src/__tests__/detector.spec.ts`

- [ ] **Step 1: Write failing tests**

Tests:

- Detect CLAUDE.md by filename
- Detect .github/copilot-instructions.md by path
- Detect .cursorrules by filename
- Detect AGENTS.md by filename
- Detect unknown format -> generic parser
- Auto-detect from directory scan

- [ ] **Step 2: Run test to verify it fails**

- [ ] **Step 3: Implement detector**

```typescript
import type { FormatParser } from './parsers/generic.js';

export type DetectedFormat = 'claude' | 'github' | 'cursor' | 'agents' | 'generic';

export function detectFormat(filepath: string, content?: string): DetectedFormat;
export function getParser(format: DetectedFormat): FormatParser;
export function findImportCandidates(dir: string): Promise<string[]>;
```

Logic from `packages/cli/src/utils/ai-tools-detector.ts` should be referenced for known file patterns.

- [ ] **Step 4: Run test to verify it passes**

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(importer): add format detector"
```

### Task 1.8: Main import orchestrator

**Files:**

- Create: `packages/importer/src/importer.ts`
- Create: `packages/importer/src/__tests__/importer.spec.ts`

- [ ] **Step 1: Write failing tests**

Tests:

- Import single CLAUDE.md -> .prs output
- Import with --dry-run -> returns result without writing
- Import empty file -> error
- Import binary file -> error
- Import file > 1MB -> warning + truncation

- [ ] **Step 2: Run test to verify it fails**

- [ ] **Step 3: Implement orchestrator**

```typescript
export interface ImportOptions {
  format?: DetectedFormat;
  dryRun?: boolean;
  outputDir?: string;
}

export interface ImportResult {
  prsContent: string;
  yamlConfig: string;
  sections: ScoredSection[];
  totalConfidence: number;
  warnings: string[];
}

export async function importFile(filepath: string, options?: ImportOptions): Promise<ImportResult>;
```

Pipeline: detect format -> parse -> map sections -> score -> emit .prs + yaml

- [ ] **Step 4: Run test to verify it passes**

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(importer): add main import orchestrator"
```

### Task 1.8b: Roundtrip validation

**Files:**

- Create: `packages/importer/src/roundtrip.ts`
- Create: `packages/importer/src/__tests__/roundtrip.spec.ts`

- [ ] **Step 1: Write failing tests**

Tests:

- Import CLAUDE.md -> .prs -> parse with `@promptscript/parser` -> valid AST
- Import .cursorrules -> .prs -> parse -> valid AST
- Import copilot-instructions.md -> .prs -> parse -> valid AST
- Roundtrip preserves all sections (no content loss)
- Roundtrip generates valid `@meta` block
- LOW confidence sections get `# REVIEW:` comments (not lost)

- [ ] **Step 2: Run test to verify it fails**

- [ ] **Step 3: Implement roundtrip validator**

```typescript
import { importFile, type ImportResult } from './importer.js';

export interface RoundtripResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  sectionCount: { imported: number; parsed: number };
}

export async function validateRoundtrip(filepath: string): Promise<RoundtripResult>;
```

Uses `@promptscript/parser` to parse the emitted `.prs` output and validates
the resulting AST is well-formed and contains all expected blocks.

- [ ] **Step 4: Run test to verify it passes**

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(importer): add roundtrip validation"
```

- [ ] **Step 6: Export from index.ts**

Update `packages/importer/src/index.ts`:

```typescript
export { importFile, type ImportResult, type ImportOptions } from './importer.js';
export { validateRoundtrip, type RoundtripResult } from './roundtrip.js';
```

Add `@promptscript/parser` as dependency in `packages/importer/package.json`.

### Task 1.9: CLI command `prs import`

**Files:**

- Create: `packages/cli/src/commands/import.ts`
- Create: `packages/cli/src/types.ts` (add `ImportOptions` interface, or append to existing)
- Modify: `packages/cli/src/cli.ts` (register command)
- Modify: `packages/cli/package.json` (add @promptscript/importer dep)
- Create: `packages/cli/src/__tests__/import-command.spec.ts`

- [ ] **Step 1: Add importer dependency to CLI**

```bash
cd packages/cli && pnpm add @promptscript/importer@workspace:*
```

- [ ] **Step 2: Write failing tests for CLI command**

Tests:

- `prs import CLAUDE.md` -> success output
- `prs import --dry-run CLAUDE.md` -> preview without writing
- `prs import --format cursor .cursorrules` -> explicit format
- `prs import nonexistent.md` -> error
- `prs import` (no args) -> auto-detect in current directory

- [ ] **Step 3: Implement CLI command**

Follow the CLI pattern used by ALL existing commands (see `init.ts`, `compile.ts`, `validate.ts`).
Commands are exported as async functions, NOT as Commander Command objects.
Commander registration happens in `cli.ts`.

```typescript
// packages/cli/src/commands/import.ts
import { importFile, validateRoundtrip } from '@promptscript/importer';
import { createSpinner, ConsoleOutput } from '../output/console.js';

export interface ImportCommandOptions {
  file?: string;
  format?: string;
  dryRun?: boolean;
  recursive?: boolean;
}

export async function importCommand(options: ImportCommandOptions): Promise<void> {
  const output = new ConsoleOutput();
  const spinner = createSpinner();
  // ... implementation using importFile() and spinner
}
```

- [ ] **Step 4: Register in CLI**

In `packages/cli/src/cli.ts`, add the import and command registration
following the existing pattern (see how `init`, `compile`, `validate` are done):

```typescript
import { importCommand } from './commands/import.js';

program
  .command('import')
  .description('Import existing AI instruction files to PromptScript')
  .argument('[file]', 'file to import (auto-detect if omitted)')
  .option('--format <format>', 'force format (claude, github, cursor, agents, generic)')
  .option('--dry-run', 'preview without writing files')
  .option('--recursive', 'recursively import from subdirectories')
  .action((file, opts) => importCommand({ ...opts, file }));
```

- [ ] **Step 5: Run tests**

```bash
pnpm nx test cli -- --run
```

- [ ] **Step 6: Commit**

```bash
git commit -m "feat(cli): add prs import command"
```

### Task 1.10: Documentation, SKILL.md, and README updates

**Files:**

- Create: `docs/guides/import.md`
- Create: `docs/guides/migration-from-claude.md`
- Create: `docs/guides/migration-from-cursor.md`
- Create: `docs/guides/migration-from-github-copilot.md`
- Modify: `skills/promptscript/SKILL.md`
- Modify: `ROADMAP.md`
- Modify: `packages/importer/README.md`
- Modify: `packages/cli/README.md` (add `prs import` to command list)
- Modify: `CHANGELOG.md` (add entry for `prs import`)

- [ ] **Step 1: Write main import guide**

Create `docs/guides/import.md` with:

- Overview of `prs import`
- Supported formats (Tier 1/2/3)
- Examples for each format
- CLI options reference
- Confidence scoring explanation
- Troubleshooting section

- [ ] **Step 2: Write format-specific migration guides**

Create migration guides for each Tier 1 format:

- `docs/guides/migration-from-claude.md` — CLAUDE.md specifics, section mapping
- `docs/guides/migration-from-cursor.md` — .cursorrules specifics, YAML frontmatter handling
- `docs/guides/migration-from-github-copilot.md` — copilot-instructions.md specifics

Each guide: before/after examples, what maps to what, common issues.

- [ ] **Step 3: Write importer package README**

Create `packages/importer/README.md` with:

- Package overview, API reference
- Programmatic usage examples
- Supported format list
- Architecture diagram (ASCII art, not Mermaid — npm doesn't render Mermaid)

- [ ] **Step 4: Update SKILL.md**

Add to `skills/promptscript/SKILL.md`:

- Section "## Importing Existing Instructions"
- Update CLI Commands section with `prs import`
- Update frontmatter description

- [ ] **Step 5: Sync SKILL.md copies**

```bash
pnpm skill:check
```

- [ ] **Step 6: Update ROADMAP.md and CHANGELOG.md**

- ROADMAP.md: Move `prs migrate` from TODO to completed, note renamed to `prs import`
- CHANGELOG.md: Add entry for `prs import` feature
- CLI README: Add `prs import` to command table

- [ ] **Step 7: Full verification pipeline**

```bash
pnpm run format
pnpm run lint
pnpm run typecheck
pnpm run test
pnpm prs validate --strict
pnpm schema:check
pnpm skill:check
```

- [ ] **Step 8: Commit**

```bash
git commit -m "docs(importer): add import guide, migration guides, and update SKILL.md"
```

---

## Chunk 2: Parameterized Skills (Luka 3)

Branch: `feat/parameterized-skills`

**Parser note:** The Chevrotain parser already handles `params:`, `inputs:`, `outputs:` inside `@skills` objects — they are parsed as generic nested objects (`object → { (field ','?)* }`). No parser grammar changes are needed. The new functionality is in:

1. **AST types** — typed `SkillDefinition` interface to interpret the generic `Record<string, Value>`
2. **Resolver** — `parseSkillMd()` extended to parse YAML frontmatter `params:` blocks
3. **Validator** — new rules to validate param types, name collisions, etc.

### Task 2.1: Add `SkillDefinition` interface to AST types

**Files:**

- Modify: `packages/core/src/types/ast.ts`
- Create: `packages/core/src/__tests__/skill-definition.spec.ts`

- [ ] **Step 1: Write failing test**

```typescript
// packages/core/src/__tests__/skill-definition.spec.ts
import { describe, it, expect } from 'vitest';
import type { SkillDefinition } from '../types/ast.js';

describe('SkillDefinition', () => {
  it('can represent a skill with params', () => {
    const skill: SkillDefinition = {
      description: 'Review code',
      content: 'Review {{language}} code',
      params: [
        {
          type: 'ParamDefinition',
          name: 'language',
          paramType: { kind: 'string' },
          optional: false,
          defaultValue: 'typescript',
          loc: { file: 'test.prs', line: 1, column: 1, offset: 0 },
        },
      ],
    };
    expect(skill.params).toHaveLength(1);
    expect(skill.params![0]!.name).toBe('language');
  });

  it('works without params (backward compat)', () => {
    const skill: SkillDefinition = {
      description: 'Simple skill',
      content: 'Do something',
    };
    expect(skill.params).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm nx test core -- --run
```

- [ ] **Step 3: Add SkillDefinition to ast.ts**

Add before the closing section in `packages/core/src/types/ast.ts`:

```typescript
// ============================================================
// Skill Definition
// ============================================================

/**
 * Typed representation of a skill in the @skills block.
 *
 * Currently skills are stored as Record<string, Value> in ObjectContent.
 * This interface provides typed access for skill-specific properties.
 */
export interface SkillDefinition {
  /** Skill description (required) */
  description: string;
  /** Skill content/instructions */
  content?: string | TextContent;
  /** Template parameters for parameterization */
  params?: ParamDefinition[];
  /** Trigger phrases */
  trigger?: string;
  /** Whether user can invoke directly */
  userInvocable?: boolean;
  /** Allowed tools */
  allowedTools?: string[];
  /** Disable model invocation */
  disableModelInvocation?: boolean;
  /** Context mode */
  context?: string;
  /** Agent to use */
  agent?: string;
}
```

Export from `packages/core/src/types/index.ts`.

- [ ] **Step 4: Run test to verify it passes**

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(core): add SkillDefinition interface to AST types"
```

### Task 2.2: Export and extend SKILL.md frontmatter parser for `params`

**Files:**

- Modify: `packages/resolver/src/skills.ts` (export `parseSkillMd`, extend for `params`)
- Modify: `packages/resolver/src/index.ts` (re-export `parseSkillMd`)
- Create: `packages/resolver/src/__tests__/skill-params.spec.ts`

**Important:** `parseSkillMd()` is currently a private function. It must be exported
for testability and for use by the importer package.

- [ ] **Step 1: Export `parseSkillMd` from skills.ts**

Change `function parseSkillMd(content: string)` to `export function parseSkillMd(content: string)`.
Add re-export in `packages/resolver/src/index.ts`:

```typescript
export { parseSkillMd, type ParsedSkillMd } from './skills.js';
```

- [ ] **Step 2: Write failing tests**

```typescript
// packages/resolver/src/__tests__/skill-params.spec.ts
import { describe, it, expect } from 'vitest';
import { parseSkillMd } from '../skills.js';

describe('parseSkillMd with params', () => {
  it('parses params from YAML frontmatter', () => {
    const content = `---
name: code-review
description: Review {{language}} code
params:
  language:
    type: string
    default: typescript
  strictness:
    type: enum
    options: [relaxed, standard, strict]
    default: standard
---

Review {{language}} code.`;

    const result = parseSkillMd(content);
    expect(result.name).toBe('code-review');
    expect(result.params).toHaveLength(2);
    expect(result.params![0]!.name).toBe('language');
    expect(result.params![0]!.paramType).toEqual({ kind: 'string' });
    expect(result.params![0]!.defaultValue).toBe('typescript');
  });

  it('works without params (backward compat)', () => {
    const content = `---
name: simple-skill
description: A simple skill
---

Do something.`;

    const result = parseSkillMd(content);
    expect(result.params).toBeUndefined();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

```bash
pnpm nx test resolver -- --run
```

- [ ] **Step 4: Extend parseSkillMd()**

Expand the frontmatter parser from simple regex to handle `params:` blocks.
Use a lightweight YAML parser approach (or add `yaml` package as dependency).

Update `ParsedSkillMd` interface (ensure `export` keyword):

```typescript
export interface ParsedSkillMd {
  name?: string;
  description?: string;
  content: string;
  params?: ParamDefinition[]; // NEW
}
```

- [ ] **Step 5: Run test to verify it passes**

- [ ] **Step 6: Commit**

```bash
git commit -m "feat(resolver): parse params from SKILL.md frontmatter"
```

### Task 2.3: Skill parameter interpolation in resolver

**Files:**

- Modify: `packages/resolver/src/skills.ts`
- Create: `packages/resolver/src/__tests__/skill-interpolation.spec.ts`

- [ ] **Step 1: Write failing tests**

Tests:

- Skill with `params` + `{{var}}` in content -> interpolated on resolution
- Skill with default values -> defaults applied
- Skill with missing required param -> error
- Skill with wrong type param -> error
- Skill without params -> unchanged (backward compat)

- [ ] **Step 2: Run test to verify it fails**

- [ ] **Step 3: Add interpolation phase to resolveNativeSkills()**

After loading SKILL.md content, if the skill has params defined:

1. Extract param definitions from the skill
2. Match with param arguments from the call site
3. Call `bindParams()` from `@promptscript/core`
4. Call `interpolateText()` on skill content and description

- [ ] **Step 4: Run test to verify it passes**

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(resolver): add skill parameter interpolation"
```

### Task 2.3b: Skill parameter validation rules

**Files:**

- Create: `packages/validator/src/rules/skill-params.ts`
- Create: `packages/validator/src/__tests__/skill-params.spec.ts`
- Modify: `packages/validator/src/index.ts` (register rule)

- [ ] **Step 1: Write failing tests**

Tests:

- Valid param definition -> passes
- Param with unknown type -> error
- Param default value doesn't match type -> error
- Duplicate param names -> error
- Param name shadows built-in variable -> warning
- Skill without params -> passes (backward compat)

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm nx test validator -- --run
```

- [ ] **Step 3: Implement validation rule**

Follow existing validator rule patterns in `packages/validator/src/rules/`.
Validate:

1. Param type is a known type (`string`, `number`, `boolean`, `enum`, `range`)
2. Default value matches declared type
3. No duplicate param names within a skill
4. Enum params have `options` array defined

- [ ] **Step 4: Run test to verify it passes**

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(validator): add skill parameter validation rules"
```

### Task 2.4: Integration test — full parameterized skill pipeline

**Files:**

- Create: `packages/compiler/src/__tests__/parameterized-skills.spec.ts`
- Create: `packages/compiler/src/__tests__/fixtures/param-skill.prs`
- Create: `packages/compiler/src/__tests__/fixtures/skills/code-review/SKILL.md`

- [ ] **Step 1: Create fixture .prs with parameterized skill**

```text
@meta {
  id: "test-params"
  syntax: "1.0.0"
}

@skills {
  code-review: {
    description: "Review {{language}} code"
    params: {
      language: string = "typescript"
    }
    content: """
      Review {{language}} code with best practices.
    """
  }
}
```

- [ ] **Step 2: Write integration test**

Test: parse -> resolve -> compile -> verify output contains interpolated values

- [ ] **Step 3: Run test**

```bash
pnpm nx test compiler -- --run
```

- [ ] **Step 4: Commit**

```bash
git commit -m "test(compiler): add parameterized skills integration test"
```

### Task 2.5: Documentation, SKILL.md, and reference updates

**Files:**

- Create: `docs/guides/parameterized-skills.md`
- Create: `docs/reference/skill-params.md`
- Modify: `skills/promptscript/SKILL.md`
- Modify: `CHANGELOG.md`
- Modify: `ROADMAP.md`

- [ ] **Step 1: Write parameterized skills guide**

Include:

- Motivation and use cases
- Syntax examples (params in @skills blocks and in SKILL.md frontmatter)
- Type system reference (string, number, boolean, enum, range)
- Default values
- Before/after comparison
- Enterprise usage patterns (team-wide parameterized skills)

- [ ] **Step 2: Write params reference doc**

Create `docs/reference/skill-params.md` with:

- Complete type reference table
- YAML frontmatter format for SKILL.md params
- PRS syntax format for inline params
- Error messages reference

- [ ] **Step 3: Update SKILL.md** with params syntax in @skills section

- [ ] **Step 4: Sync copies and verify**

```bash
pnpm skill:check
pnpm run format && pnpm run lint && pnpm run typecheck && pnpm run test
pnpm prs validate --strict && pnpm schema:check && pnpm skill:check
```

- [ ] **Step 5: Update CHANGELOG.md and ROADMAP.md**

- [ ] **Step 6: Commit**

```bash
git commit -m "docs(skills): add parameterized skills guide, reference, and update SKILL.md"
```

---

## Chunk 3: Skill Folders + Shared Resources (Luka 2)

Branch: `feat/skill-folders-shared`

### Task 3.1: Add `requires` to SkillDefinition

**Files:**

- Modify: `packages/core/src/types/ast.ts`
- Modify: `packages/core/src/__tests__/skill-definition.spec.ts`

- [ ] **Step 1: Write failing test**

```typescript
it('can represent a skill with requires', () => {
  const skill: SkillDefinition = {
    description: 'Full review',
    content: 'Run all checks',
    requires: ['lint-check', 'security-scan'],
  };
  expect(skill.requires).toEqual(['lint-check', 'security-scan']);
});
```

- [ ] **Step 2: Run test to verify it fails**

- [ ] **Step 3: Add `requires` to SkillDefinition**

```typescript
export interface SkillDefinition {
  // ... existing fields
  /** Skills that must exist for this skill to work */
  requires?: string[];
}
```

- [ ] **Step 4: Run test to verify it passes**

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(core): add requires to SkillDefinition"
```

### Task 3.2: Shared resources discovery

**Files:**

- Modify: `packages/resolver/src/skills.ts`
- Create: `packages/resolver/src/__tests__/shared-resources.spec.ts`

- [ ] **Step 1: Write failing tests**

Tests:

- Discover `shared/` directory alongside `skills/`
- Resources from shared/ get `@shared/` prefix
- Shared resources available in every skill's resources
- Missing shared/ directory -> no error, empty list
- Path traversal protection on shared/ directory
- Size limits apply to shared resources
- .skillignore patterns work in shared/

- [ ] **Step 2: Run test to verify it fails**

- [ ] **Step 3: Modify resolveNativeSkills()**

Add `sharedDir` discovery: when processing skills, also look for
`.promptscript/shared/` directory and include its contents with `@shared/` prefix.

Key change in `resolveNativeSkills()`:

```typescript
// After determining localPath
const sharedDir = localPath ? resolve(localPath, 'shared') : undefined;
// Pass sharedDir to discoverSkillResources() calls
```

- [ ] **Step 4: Run test to verify it passes**

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(resolver): add shared resources discovery"
```

### Task 3.3: Skill dependency validation (`requires`)

**Files:**

- Create: `packages/validator/src/rules/skill-dependencies.ts`
- Create: `packages/validator/src/__tests__/skill-dependencies.spec.ts`
- Modify: `packages/validator/src/index.ts` (register rule)

- [ ] **Step 1: Write failing tests**

Tests:

- Valid requires -> passes
- Requires nonexistent skill -> error
- Circular dependency detection -> error
- Self-referencing requires -> error
- No requires -> passes (backward compat)

- [ ] **Step 2: Run test to verify it fails**

- [ ] **Step 3: Implement validation rule**

Follow existing validator rule patterns. Check that every skill name
in `requires` array exists as a key in the `@skills` block.

- [ ] **Step 4: Run test to verify it passes**

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(validator): add skill dependency validation"
```

### Task 3.4: Integration test — skill folders + shared resources

**Files:**

- Create: `packages/compiler/src/__tests__/skill-folders.spec.ts`
- Create: test fixtures with skill folder structure

- [ ] **Step 1: Create fixture directory structure**

```
fixtures/skill-folders/
  .promptscript/
    project.prs
    skills/
      review/
        SKILL.md
        scripts/
          check.sh
        references/
          guide.md
    shared/
      templates/
        template.md
      data/
        config.json
```

- [ ] **Step 2: Write integration test**

Test: compile fixture -> verify shared resources included in output,
verify skill folder resources included, verify requires validation works.

- [ ] **Step 3: Run test**

- [ ] **Step 4: Commit**

```bash
git commit -m "test(compiler): add skill folders integration test"
```

### Task 3.5: Documentation and SKILL.md update

**Files:**

- Create: `docs/guides/skill-folders.md`
- Create: `docs/guides/shared-resources.md`
- Modify: `skills/promptscript/SKILL.md`

- [ ] **Step 1: Write skill folders guide**

- [ ] **Step 2: Write shared resources guide**

- [ ] **Step 3: Update SKILL.md** with Skill Folders and Shared Resources sections

- [ ] **Step 4: Full verification pipeline**

```bash
pnpm run format && pnpm run lint && pnpm run typecheck && pnpm run test
pnpm prs validate --strict && pnpm schema:check && pnpm skill:check
```

- [ ] **Step 5: Commit**

```bash
git commit -m "docs(skills): add skill folders and shared resources guides"
```

---

## Chunk 4: Skill Contracts — inputs/outputs (Luka 4)

Branch: `feat/skill-contracts`

### Task 4.1: Add `inputs` and `outputs` to SkillDefinition

**Files:**

- Modify: `packages/core/src/types/ast.ts`
- Modify: `packages/core/src/__tests__/skill-definition.spec.ts`

- [ ] **Step 1: Write failing tests**

```typescript
it('can represent a skill with inputs and outputs', () => {
  const skill: SkillDefinition = {
    description: 'Security scan',
    content: 'Scan files',
    inputs: {
      files: { description: 'List of file paths', type: 'string' },
      severity: {
        description: 'Minimum severity',
        type: 'enum',
        options: ['low', 'medium', 'high'],
        default: 'medium',
      },
    },
    outputs: {
      report: { description: 'Scan report', type: 'string' },
      passed: { description: 'Whether scan passed', type: 'boolean' },
    },
  };
  expect(Object.keys(skill.inputs!)).toEqual(['files', 'severity']);
  expect(Object.keys(skill.outputs!)).toEqual(['report', 'passed']);
});
```

- [ ] **Step 2: Run test to verify it fails**

- [ ] **Step 3: Add types**

```typescript
export interface SkillContractField {
  description: string;
  type: 'string' | 'number' | 'boolean' | 'enum';
  options?: string[];
  default?: Value;
}

export interface SkillDefinition {
  // ... existing fields from Lukas 2 and 3
  /** Runtime inputs the skill expects */
  inputs?: Record<string, SkillContractField>;
  /** Outputs the skill produces */
  outputs?: Record<string, SkillContractField>;
}
```

- [ ] **Step 4: Run test to verify it passes**

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(core): add inputs/outputs to SkillDefinition"
```

### Task 4.2: Parse inputs/outputs from SKILL.md frontmatter

**Files:**

- Modify: `packages/resolver/src/skills.ts`
- Create: `packages/resolver/src/__tests__/skill-contracts.spec.ts`

- [ ] **Step 1: Write failing tests**

Tests:

- Parse inputs from SKILL.md frontmatter
- Parse outputs from SKILL.md frontmatter
- Parse skill with both inputs, outputs, and params
- No inputs/outputs -> backward compat

- [ ] **Step 2: Run test to verify it fails**

- [ ] **Step 3: Extend parseSkillMd()**

Add `inputs` and `outputs` to `ParsedSkillMd` and parsing logic.

- [ ] **Step 4: Run test to verify it passes**

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(resolver): parse inputs/outputs from SKILL.md frontmatter"
```

### Task 4.3: Contract validation rules

**Files:**

- Create: `packages/validator/src/rules/skill-contracts.ts`
- Create: `packages/validator/src/__tests__/skill-contracts.spec.ts`
- Modify: `packages/validator/src/index.ts` (register rules)

- [ ] **Step 1: Write failing tests**

Tests:

- Valid contract -> passes
- params/inputs name collision -> error
- Input with invalid type -> error
- Warning when content doesn't reference outputs
- No contract -> passes (backward compat)

- [ ] **Step 2: Run test to verify it fails**

- [ ] **Step 3: Implement validation rules**

Rules:

1. Type validation for inputs and outputs fields
2. Name collision detection between params and inputs
3. Warning (not error) when outputs names not found in content

- [ ] **Step 4: Run test to verify it passes**

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(validator): add skill contract validation rules"
```

### Task 4.4: Auto-generated skill documentation in formatters

**Files:**

- Modify: formatters that emit @skills (start with claude formatter as reference)
- Create: `packages/formatters/src/__tests__/skill-docs.spec.ts`
- Create: `packages/formatters/src/__tests__/skill-params-format.spec.ts`

- [ ] **Step 1: Write failing tests for contract documentation**

Test: skill with inputs/outputs generates documentation tables in output.

Expected output section:

```markdown
**Inputs:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| files | string | (required) | List of file paths |

**Outputs:**
| Name | Type | Description |
|------|------|-------------|
| report | string | Scan report |
```

- [ ] **Step 2: Write failing tests for parameterized skill formatting**

Test: skill with params + interpolated content renders correctly in each major formatter.

Tests:

- Claude formatter: params rendered with defaults in skill section
- GitHub Copilot formatter: params rendered correctly
- Cursor formatter: params rendered correctly
- Skill with params + requires + inputs/outputs: all sections rendered
- Skill without any contract: backward compat (no empty tables)

- [ ] **Step 3: Run tests to verify they fail**

```bash
pnpm nx test formatters -- --run
```

- [ ] **Step 4: Implement documentation generation**

In the skill emission section of formatters, when a skill has inputs/outputs/params,
generate a markdown documentation block. When no contract fields exist, emit nothing extra.

- [ ] **Step 5: Run tests to verify they pass**

- [ ] **Step 6: Commit**

```bash
git commit -m "feat(formatters): auto-generate skill documentation from contracts and params"
```

### Task 4.5: Integration test — full contract pipeline

**Files:**

- Create: `packages/compiler/src/__tests__/skill-contracts.spec.ts`
- Create: fixture .prs with full contract

- [ ] **Step 1: Create fixture with skill contracts**

```text
@meta {
  id: "test-contracts"
  syntax: "1.0.0"
}

@skills {
  security-scan: {
    description: "Scan for vulnerabilities"
    inputs: {
      files: "File paths to scan"
    }
    outputs: {
      report: "Scan report"
      passed: boolean
    }
    params: {
      compliance: enum("SOC2", "HIPAA") = "SOC2"
    }
    requires: ["lint-check"]
    content: """
      Scan files for {{compliance}} compliance.
    """
  }
  lint-check: {
    description: "Run linting"
    outputs: {
      issues: "Lint issues"
    }
    content: """
      Run linting checks.
    """
  }
}
```

- [ ] **Step 2: Write integration test**

Test: parse -> resolve -> validate -> compile -> verify:

- Output contains auto-generated documentation
- Contract fields preserved in output
- Params interpolated correctly
- Requires validated

- [ ] **Step 3: Run test**

- [ ] **Step 4: Commit**

```bash
git commit -m "test(compiler): add skill contracts integration test"
```

### Task 4.6: Documentation and final SKILL.md update

**Files:**

- Create: `docs/guides/skill-contracts.md`
- Create: `docs/guides/skill-composition.md`
- Modify: `skills/promptscript/SKILL.md` (final update with all 4 gaps)

- [ ] **Step 1: Write skill contracts guide**

- [ ] **Step 2: Write skill composition guide**

- [ ] **Step 3: Final SKILL.md update**

Apply all changes from spec:

- Update frontmatter description with all new keywords
- Add all new sections (import, params, folders, shared, contracts, composition)
- Update properties lists

- [ ] **Step 4: Sync all SKILL.md copies**

```bash
pnpm skill:check
```

- [ ] **Step 5: Full verification pipeline**

```bash
pnpm run format
pnpm run lint
pnpm run typecheck
pnpm run test
pnpm prs validate --strict
pnpm schema:check
pnpm skill:check
```

- [ ] **Step 6: Commit**

```bash
git commit -m "docs(skills): add contracts and composition guides, final SKILL.md update"
```

---

## Summary

| Chunk                   | Tasks             | Branch                      | Depends On                              |
| ----------------------- | ----------------- | --------------------------- | --------------------------------------- |
| 1. prs import           | 1.1-1.10 (+ 1.8b) | `feat/prs-import`           | None                                    |
| 2. Parameterized Skills | 2.1-2.5 (+ 2.3b)  | `feat/parameterized-skills` | None                                    |
| 3. Skill Folders        | 3.1-3.5           | `feat/skill-folders-shared` | Chunk 2 (SkillDefinition)               |
| 4. Skill Contracts      | 4.1-4.6           | `feat/skill-contracts`      | Chunks 2+3 (SkillDefinition + requires) |

**Parallelizable:** Chunks 1 and 2 can run in parallel (independent).
Chunk 3 starts after Chunk 2 merges. Chunk 4 starts after Chunk 3 merges.

**Each chunk ends with:** full verification pipeline (`format -> lint -> typecheck -> test -> validate -> schema:check -> skill:check`).

**Key design decisions:**

- **No Chevrotain parser changes needed.** The grammar already handles arbitrary nested objects. `params:`, `inputs:`, `outputs:` are just object fields.
- **CLI command pattern:** `export async function xxxCommand(options): Promise<void>` — NOT Commander Command objects.
- **`parseSkillMd` must be exported** from resolver for testability and importer reuse.
- **Roundtrip validation** (`roundtrip.ts`) validates imported .prs parses back correctly.
