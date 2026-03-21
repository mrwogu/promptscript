# Intelligent `prs init` Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign `prs init` to auto-detect existing AI instruction files and offer inline migration (static import or AI-assisted), producing modular .prs output.

**Architecture:** Two parallel foundation tracks (CLI utilities + importer multi-file support) converge into the enhanced init command. The init command gains a gateway prompt (migrate vs fresh start), the importer gains multi-file merge capabilities, and a thin `prs migrate` alias wraps the init migration path.

**Tech Stack:** TypeScript, Commander.js, Inquirer.js (`@inquirer/prompts`), Vitest, `@promptscript/importer`, `@promptscript/formatters`

**Spec:** `docs/design/2026-03-20-intelligent-init-design.md`

---

## File Map

### New files

| File | Responsibility |
|------|---------------|
| `packages/cli/src/utils/clipboard.ts` | Cross-platform clipboard write (pbcopy/xclip/clip) |
| `packages/cli/src/utils/backup.ts` | `.prs-backup/<timestamp>/` creation, git repo detection |
| `packages/cli/src/utils/migration-prompt.ts` | Kick-start prompt generation from MigrationCandidate[] |
| `packages/importer/src/merger.ts` | Merge ScoredSection[] from multiple files: dedup, group by block |
| `packages/importer/src/multi-importer.ts` | Batch importFile() + merger -> modular .prs file map |
| `packages/cli/src/commands/migrate.ts` | Thin wrapper: delegates to initCommand with migrate flags |

### New test files

| File | Tests |
|------|-------|
| `packages/cli/src/utils/__tests__/clipboard.spec.ts` | Clipboard write, fallback on missing binary |
| `packages/cli/src/utils/__tests__/backup.spec.ts` | Backup creation, git detection, timestamp dirs |
| `packages/cli/src/utils/__tests__/migration-prompt.spec.ts` | Prompt generation from candidates |
| `packages/importer/src/__tests__/merger.spec.ts` | Section merge, dedup, conflict resolution per block type |
| `packages/importer/src/__tests__/multi-importer.spec.ts` | Multi-file import, modular output, confidence report |
| `packages/cli/src/__tests__/init-migrate.spec.ts` | Init gateway, static migration, AI-assisted flow |
| `packages/cli/src/__tests__/migrate-command.spec.ts` | `prs migrate` delegation, --static, --llm, --files |

### Modified files

| File | Changes |
|------|---------|
| `packages/cli/src/utils/ai-tools-detector.ts` | `migrationCandidates: string[]` -> `MigrationCandidate[]` with size/format/toolName |
| `packages/cli/src/types.ts` | Add `autoImport`, `backup` to `InitOptions`; add `MigrateOptions` interface |
| `packages/cli/src/commands/init.ts` | Gateway prompt, migrate flow, skill install on fresh start, exit code 2 |
| `packages/cli/src/cli.ts` | Register `prs migrate`, add `--auto-import`/`--backup` to init, deprecate `--migrate` |
| `packages/importer/src/emitter.ts` | Add `emitModularFiles()` for multi-file output |
| `packages/importer/src/index.ts` | Export merger, multi-importer |
| `packages/cli/skills/promptscript/SKILL.md` | Update CLI commands section with `prs migrate` |

---

## Chunk 1: Foundation Utilities (Phase 1)

### Task 1: Clipboard Utility

**Files:**
- Create: `packages/cli/src/utils/clipboard.ts`
- Test: `packages/cli/src/utils/__tests__/clipboard.spec.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// packages/cli/src/utils/__tests__/clipboard.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { copyToClipboard } from '../clipboard.js';
import { execFileSync } from 'child_process';

vi.mock('child_process', () => ({
  execFileSync: vi.fn(),
}));

describe('copyToClipboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns true on success', () => {
    vi.mocked(execFileSync).mockReturnValue(Buffer.from(''));
    const result = copyToClipboard('hello');
    expect(result).toBe(true);
    expect(execFileSync).toHaveBeenCalled();
  });

  it('returns false when clipboard command fails', () => {
    vi.mocked(execFileSync).mockImplementation(() => {
      throw new Error('command not found');
    });
    const result = copyToClipboard('hello');
    expect(result).toBe(false);
  });

  it('passes text via stdin to the clipboard command', () => {
    vi.mocked(execFileSync).mockReturnValue(Buffer.from(''));
    copyToClipboard('test content');
    expect(execFileSync).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Array),
      expect.objectContaining({ input: 'test content' })
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm nx test cli -- --testPathPattern clipboard`
Expected: FAIL -- module not found

- [ ] **Step 3: Write implementation**

```typescript
// packages/cli/src/utils/clipboard.ts
import { execFileSync } from 'child_process';

/**
 * Platform-specific clipboard commands.
 * Each entry is [binary, ...args].
 * Tried in order; first successful one wins.
 */
const CLIPBOARD_COMMANDS: Record<string, [string, string[]][]> = {
  darwin: [['pbcopy', []]],
  linux: [
    ['xclip', ['-selection', 'clipboard']],
    ['xsel', ['--clipboard', '--input']],
  ],
  win32: [['clip', []]],
};

/**
 * Copy text to the system clipboard.
 * Returns true on success, false if clipboard is unavailable.
 */
export function copyToClipboard(text: string): boolean {
  const commands = CLIPBOARD_COMMANDS[process.platform] ?? [];

  for (const [binary, args] of commands) {
    try {
      execFileSync(binary, args, { input: text, stdio: ['pipe', 'ignore', 'ignore'] });
      return true;
    } catch {
      // Try next command
    }
  }

  return false;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm nx test cli -- --testPathPattern clipboard`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add packages/cli/src/utils/clipboard.ts packages/cli/src/utils/__tests__/clipboard.spec.ts
git commit -m "feat(cli): add cross-platform clipboard utility"
```

---

### Task 2: Backup Utility

**Files:**
- Create: `packages/cli/src/utils/backup.ts`
- Test: `packages/cli/src/utils/__tests__/backup.spec.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// packages/cli/src/utils/__tests__/backup.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createBackup, isGitRepo } from '../backup.js';
import type { CliServices } from '../../services.js';

describe('isGitRepo', () => {
  it('returns true when .git exists', () => {
    const services = {
      fs: { existsSync: vi.fn().mockReturnValue(true) },
    } as unknown as CliServices;
    expect(isGitRepo(services)).toBe(true);
    expect(services.fs.existsSync).toHaveBeenCalledWith('.git');
  });

  it('returns false when .git does not exist', () => {
    const services = {
      fs: { existsSync: vi.fn().mockReturnValue(false) },
    } as unknown as CliServices;
    expect(isGitRepo(services)).toBe(false);
  });
});

describe('createBackup', () => {
  let mockServices: CliServices;

  beforeEach(() => {
    mockServices = {
      fs: {
        existsSync: vi.fn().mockReturnValue(true),
        readFileSync: vi.fn().mockReturnValue('file content'),
        writeFile: vi.fn().mockResolvedValue(undefined),
        mkdir: vi.fn().mockResolvedValue(undefined),
        readFile: vi.fn().mockResolvedValue('file content'),
        readdir: vi.fn().mockResolvedValue([]),
      },
      prompts: {} as CliServices['prompts'],
      cwd: '/mock',
    } as unknown as CliServices;
  });

  it('creates timestamped backup directory', async () => {
    const result = await createBackup(['CLAUDE.md'], mockServices);

    expect(mockServices.fs.mkdir).toHaveBeenCalledWith(
      expect.stringMatching(/^\.prs-backup\/\d{4}-\d{2}-\d{2}T/),
      { recursive: true }
    );
    expect(result.dir).toMatch(/^\.prs-backup\/\d{4}-\d{2}-\d{2}T/);
  });

  it('copies listed files to backup directory', async () => {
    await createBackup(['CLAUDE.md', '.cursorrules'], mockServices);

    expect(mockServices.fs.writeFile).toHaveBeenCalledTimes(2);
    expect(mockServices.fs.writeFile).toHaveBeenCalledWith(
      expect.stringContaining('CLAUDE.md'),
      'file content',
      'utf-8'
    );
  });

  it('skips files that do not exist', async () => {
    vi.mocked(mockServices.fs.existsSync).mockImplementation(
      (p: string) => p !== '.cursorrules'
    );
    await createBackup(['CLAUDE.md', '.cursorrules'], mockServices);

    expect(mockServices.fs.writeFile).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm nx test cli -- --testPathPattern backup`
Expected: FAIL -- module not found

- [ ] **Step 3: Write implementation**

```typescript
// packages/cli/src/utils/backup.ts
import { basename } from 'path';
import type { CliServices } from '../services.js';

export interface BackupResult {
  dir: string;
  files: string[];
}

/**
 * Check if current directory is a git repository.
 */
export function isGitRepo(services: CliServices): boolean {
  return services.fs.existsSync('.git');
}

/**
 * Create a timestamped backup of the given files.
 * Only backs up files that exist on disk.
 */
export async function createBackup(
  filePaths: string[],
  services: CliServices
): Promise<BackupResult> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const dir = `.prs-backup/${timestamp}`;

  await services.fs.mkdir(dir, { recursive: true });

  const backedUp: string[] = [];
  for (const filePath of filePaths) {
    if (!services.fs.existsSync(filePath)) continue;

    const content = services.fs.readFileSync(filePath, 'utf-8');
    const dest = `${dir}/${basename(filePath)}`;
    await services.fs.writeFile(dest, content, 'utf-8');
    backedUp.push(filePath);
  }

  return { dir, files: backedUp };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm nx test cli -- --testPathPattern backup`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add packages/cli/src/utils/backup.ts packages/cli/src/utils/__tests__/backup.spec.ts
git commit -m "feat(cli): add backup utility with git repo detection"
```

---

### Task 3: Migration Prompt Generator

**Files:**
- Create: `packages/cli/src/utils/migration-prompt.ts`
- Test: `packages/cli/src/utils/__tests__/migration-prompt.spec.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// packages/cli/src/utils/__tests__/migration-prompt.spec.ts
import { describe, it, expect } from 'vitest';
import { generateMigrationPrompt, type MigrationPromptInput } from '../migration-prompt.js';

describe('generateMigrationPrompt', () => {
  const candidates: MigrationPromptInput[] = [
    { path: 'CLAUDE.md', sizeHuman: '3.4 KB', toolName: 'Claude Code' },
    { path: '.cursorrules', sizeHuman: '1.8 KB', toolName: 'Cursor' },
  ];

  it('includes all candidate files in the prompt', () => {
    const prompt = generateMigrationPrompt(candidates);
    expect(prompt).toContain('CLAUDE.md');
    expect(prompt).toContain('.cursorrules');
  });

  it('includes file sizes and tool names', () => {
    const prompt = generateMigrationPrompt(candidates);
    expect(prompt).toContain('3.4 KB');
    expect(prompt).toContain('Claude Code');
  });

  it('includes /promptscript skill reference', () => {
    const prompt = generateMigrationPrompt(candidates);
    expect(prompt).toContain('/promptscript');
  });

  it('includes modular .prs structure instructions', () => {
    const prompt = generateMigrationPrompt(candidates);
    expect(prompt).toContain('project.prs');
    expect(prompt).toContain('context.prs');
    expect(prompt).toContain('standards.prs');
    expect(prompt).toContain('restrictions.prs');
  });

  it('includes validation steps', () => {
    const prompt = generateMigrationPrompt(candidates);
    expect(prompt).toContain('prs validate');
    expect(prompt).toContain('prs compile');
  });

  it('handles single candidate', () => {
    const prompt = generateMigrationPrompt([candidates[0]!]);
    expect(prompt).toContain('CLAUDE.md');
    expect(prompt).not.toContain('.cursorrules');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm nx test cli -- --testPathPattern migration-prompt`
Expected: FAIL -- module not found

- [ ] **Step 3: Write implementation**

```typescript
// packages/cli/src/utils/migration-prompt.ts

export interface MigrationPromptInput {
  path: string;
  sizeHuman: string;
  toolName: string;
}

/**
 * Generate a kick-start prompt for AI-assisted migration.
 * The prompt tells the AI what files to read and how to produce .prs output.
 * It does NOT include file contents -- the AI reads them from disk.
 */
export function generateMigrationPrompt(candidates: MigrationPromptInput[]): string {
  const fileList = candidates
    .map((c) => `- ${c.path} (${c.sizeHuman}, ${c.toolName})`)
    .join('\n');

  return `Migrate my existing AI instructions to PromptScript.

I've just initialized PromptScript in this project. The following
instruction files need to be migrated to .prs format:

${fileList}

Use the /promptscript skill for the PromptScript language reference.

Steps:
1. Read each file listed above
2. Analyze the content and map to PromptScript blocks
3. Generate a modular .prs structure in .promptscript/:
   - project.prs (entry: @meta, @identity, @use directives)
   - context.prs (@context)
   - standards.prs (@standards)
   - restrictions.prs (@restrictions)
   - commands.prs (@shortcuts, @knowledge -- only if relevant content found)
4. Deduplicate overlapping content across files
5. Run: prs validate --strict
6. Run: prs compile --dry-run
`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm nx test cli -- --testPathPattern migration-prompt`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add packages/cli/src/utils/migration-prompt.ts packages/cli/src/utils/__tests__/migration-prompt.spec.ts
git commit -m "feat(cli): add migration prompt generator for AI-assisted migration"
```

---

## Chunk 2: Multi-file Import (Phase 2)

### Task 4: Section Merger

**Files:**
- Create: `packages/importer/src/merger.ts`
- Test: `packages/importer/src/__tests__/merger.spec.ts`

**Context:** Works with `ScoredSection` from `confidence.ts`. Each section has `heading`, `content`, `targetBlock`, `confidence`, `level`. The merger groups sections from multiple files by `targetBlock` and applies merge rules per block type.

- [ ] **Step 1: Write failing tests**

```typescript
// packages/importer/src/__tests__/merger.spec.ts
import { describe, it, expect } from 'vitest';
import { mergeSections, type SourcedSection } from '../merger.js';
import { classifyConfidence } from '../confidence.js';

function section(
  targetBlock: string,
  content: string,
  source: string,
  confidence = 0.85
): SourcedSection {
  return {
    heading: targetBlock,
    content,
    targetBlock,
    confidence,
    level: classifyConfidence(confidence),
    source,
  };
}

describe('mergeSections', () => {
  it('groups sections by targetBlock', () => {
    const sections = [
      section('identity', 'You are a TS expert', 'CLAUDE.md'),
      section('standards', 'Use strict mode', 'CLAUDE.md'),
      section('identity', 'You are helpful', '.cursorrules'),
    ];

    const result = mergeSections(sections);

    expect(result.merged.has('identity')).toBe(true);
    expect(result.merged.has('standards')).toBe(true);
  });

  it('picks longest identity by character count', () => {
    const sections = [
      section('identity', 'You are a TypeScript expert working on complex systems', 'CLAUDE.md'),
      section('identity', 'You are helpful', '.cursorrules'),
    ];

    const result = mergeSections(sections);
    const identity = result.merged.get('identity')!;

    expect(identity.content).toContain('TypeScript expert');
    expect(identity.reviewComments).toHaveLength(1);
    expect(identity.reviewComments[0]).toContain('.cursorrules');
  });

  it('unions restrictions from all sources', () => {
    const sections = [
      section('restrictions', '- "Never use any"', 'CLAUDE.md'),
      section('restrictions', '- "Never commit secrets"', '.cursorrules'),
    ];

    const result = mergeSections(sections);
    const restrictions = result.merged.get('restrictions')!;

    expect(restrictions.content).toContain('Never use any');
    expect(restrictions.content).toContain('Never commit secrets');
  });

  it('deduplicates exact-match lines after whitespace normalization', () => {
    const sections = [
      section('restrictions', '- "Never use any"', 'CLAUDE.md'),
      section('restrictions', '-  "Never use any"', '.cursorrules'),
      section('restrictions', '- "Never commit secrets"', '.cursorrules'),
    ];

    const result = mergeSections(sections);
    const restrictions = result.merged.get('restrictions')!;

    const lines = restrictions.content.split('\n').filter((l) => l.trim().length > 0);
    expect(lines).toHaveLength(2);
    expect(result.deduplicatedCount).toBeGreaterThan(0);
  });

  it('concatenates knowledge with source attribution', () => {
    const sections = [
      section('knowledge', 'API docs here', 'CLAUDE.md'),
      section('knowledge', 'CLI reference', '.cursorrules'),
    ];

    const result = mergeSections(sections);
    const knowledge = result.merged.get('knowledge')!;

    expect(knowledge.content).toContain('# Source: CLAUDE.md');
    expect(knowledge.content).toContain('# Source: .cursorrules');
  });

  it('merges standards by concatenating with dedup', () => {
    const sections = [
      section('standards', 'typescript: ["Strict mode"]', 'CLAUDE.md'),
      section('standards', 'naming: ["kebab-case"]', '.cursorrules'),
    ];

    const result = mergeSections(sections);
    const standards = result.merged.get('standards')!;

    expect(standards.content).toContain('Strict mode');
    expect(standards.content).toContain('kebab-case');
  });

  it('reports overall confidence', () => {
    const sections = [
      section('identity', 'You are expert', 'CLAUDE.md', 0.9),
      section('standards', 'Use strict', 'CLAUDE.md', 0.7),
    ];

    const result = mergeSections(sections);
    expect(result.overallConfidence).toBeCloseTo(0.8, 1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm nx test importer -- --testPathPattern merger`
Expected: FAIL -- module not found

- [ ] **Step 3: Write implementation**

```typescript
// packages/importer/src/merger.ts
import type { ScoredSection } from './confidence.js';

/**
 * A ScoredSection with source file attribution.
 */
export interface SourcedSection extends ScoredSection {
  source: string;
}

/**
 * A merged block ready for emission.
 */
export interface MergedBlock {
  targetBlock: string;
  content: string;
  sources: string[];
  confidence: number;
  reviewComments: string[];
}

export interface MergeResult {
  merged: Map<string, MergedBlock>;
  deduplicatedCount: number;
  overallConfidence: number;
}

/**
 * Merge sections from multiple files by targetBlock.
 *
 * Merge rules per block type (from spec):
 * - identity: pick longest (char count after trim), others -> review comments
 * - restrictions: full union, dedup exact-match lines
 * - knowledge: concatenate with source attribution headers
 * - standards, context, shortcuts: concatenate with dedup
 */
export function mergeSections(sections: SourcedSection[]): MergeResult {
  const grouped = new Map<string, SourcedSection[]>();
  for (const s of sections) {
    const existing = grouped.get(s.targetBlock);
    if (existing) {
      existing.push(s);
    } else {
      grouped.set(s.targetBlock, [s]);
    }
  }

  const merged = new Map<string, MergedBlock>();
  let totalDeduped = 0;

  for (const [block, blockSections] of grouped) {
    if (block === 'identity') {
      merged.set(block, mergeIdentity(blockSections));
    } else if (block === 'knowledge') {
      merged.set(block, mergeWithAttribution(blockSections));
    } else {
      const result = mergeUnion(blockSections);
      totalDeduped += result.deduped;
      merged.set(block, result.block);
    }
  }

  const allConfidences = sections.map((s) => s.confidence);
  const overallConfidence =
    allConfidences.length > 0
      ? allConfidences.reduce((a, b) => a + b, 0) / allConfidences.length
      : 0;

  return { merged, deduplicatedCount: totalDeduped, overallConfidence };
}

function mergeIdentity(sections: SourcedSection[]): MergedBlock {
  const sorted = [...sections].sort(
    (a, b) => b.content.trim().length - a.content.trim().length
  );
  const winner = sorted[0]!;
  const others = sorted.slice(1);

  const reviewComments = others.map(
    (s) => `# REVIEW: alt from ${s.source}: "${s.content.trim().slice(0, 60)}..."`
  );

  return {
    targetBlock: 'identity',
    content: winner.content,
    sources: sections.map((s) => s.source),
    confidence: winner.confidence,
    reviewComments,
  };
}

function mergeWithAttribution(sections: SourcedSection[]): MergedBlock {
  const parts = sections.map((s) => `# Source: ${s.source}\n${s.content}`);
  const avgConfidence =
    sections.reduce((sum, s) => sum + s.confidence, 0) / sections.length;

  return {
    targetBlock: sections[0]!.targetBlock,
    content: parts.join('\n\n'),
    sources: sections.map((s) => s.source),
    confidence: avgConfidence,
    reviewComments: [],
  };
}

function mergeUnion(sections: SourcedSection[]): { block: MergedBlock; deduped: number } {
  const seenLines = new Set<string>();
  const uniqueLines: string[] = [];
  let deduped = 0;

  for (const s of sections) {
    const lines = s.content.split('\n');
    for (const line of lines) {
      const normalized = line.trim().replace(/\s+/g, ' ');
      if (normalized.length === 0) continue;
      if (seenLines.has(normalized)) {
        deduped++;
        continue;
      }
      seenLines.add(normalized);
      uniqueLines.push(line);
    }
  }

  const avgConfidence =
    sections.reduce((sum, s) => sum + s.confidence, 0) / sections.length;

  return {
    block: {
      targetBlock: sections[0]!.targetBlock,
      content: uniqueLines.join('\n'),
      sources: sections.map((s) => s.source),
      confidence: avgConfidence,
      reviewComments: [],
    },
    deduped,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm nx test importer -- --testPathPattern merger`
Expected: PASS (7 tests)

- [ ] **Step 5: Commit**

```bash
git add packages/importer/src/merger.ts packages/importer/src/__tests__/merger.spec.ts
git commit -m "feat(importer): add section merger with per-block merge strategies"
```

---

### Task 5: Multi-file Importer & Modular Emitter

**Files:**
- Create: `packages/importer/src/multi-importer.ts`
- Modify: `packages/importer/src/emitter.ts` (add `emitModularFiles()`)
- Modify: `packages/importer/src/index.ts` (export new modules)
- Test: `packages/importer/src/__tests__/multi-importer.spec.ts`

**Context:** Calls `importFile()` per file, attaches source attribution, passes to `mergeSections()`, then emits modular .prs files. Uses existing test fixtures in `packages/importer/src/__tests__/fixtures/`.

- [ ] **Step 1: Write failing tests**

```typescript
// packages/importer/src/__tests__/multi-importer.spec.ts
import { describe, it, expect } from 'vitest';
import { resolve } from 'path';
import { importMultipleFiles } from '../multi-importer.js';

const fixturesDir = resolve(__dirname, 'fixtures');

describe('importMultipleFiles', () => {
  it('imports multiple files and returns modular output', async () => {
    const result = await importMultipleFiles([
      resolve(fixturesDir, 'sample-claude.md'),
      resolve(fixturesDir, 'sample-copilot.md'),
    ], { projectName: 'test-project' });

    expect(result.files.has('project.prs')).toBe(true);
    expect(result.files.get('project.prs')).toContain('@meta {');
    expect(result.files.get('project.prs')).toContain('@use ./');
    expect(result.overallConfidence).toBeGreaterThan(0);
  });

  it('project.prs contains @identity block', async () => {
    const result = await importMultipleFiles([
      resolve(fixturesDir, 'sample-claude.md'),
    ], { projectName: 'my-proj' });

    expect(result.files.get('project.prs')).toContain('@identity');
  });

  it('only emits files with content', async () => {
    const result = await importMultipleFiles([
      resolve(fixturesDir, 'sample-claude.md'),
    ], { projectName: 'test' });

    for (const [, content] of result.files) {
      expect(content.trim().length).toBeGreaterThan(0);
    }
  });

  it('returns per-file confidence reports', async () => {
    const result = await importMultipleFiles([
      resolve(fixturesDir, 'sample-claude.md'),
      resolve(fixturesDir, 'sample-copilot.md'),
    ], { projectName: 'test' });

    expect(result.perFileReports).toHaveLength(2);
    expect(result.perFileReports[0]!.file).toContain('sample-claude.md');
    expect(result.perFileReports[0]!.sectionCount).toBeGreaterThan(0);
  });

  it('reports deduplication count', async () => {
    const result = await importMultipleFiles([
      resolve(fixturesDir, 'sample-claude.md'),
      resolve(fixturesDir, 'sample-copilot.md'),
    ], { projectName: 'test' });

    expect(typeof result.deduplicatedCount).toBe('number');
  });

  it('skips files that fail to import with warnings', async () => {
    const result = await importMultipleFiles([
      resolve(fixturesDir, 'sample-claude.md'),
      '/nonexistent/file.md',
    ], { projectName: 'test' });

    expect(result.files.has('project.prs')).toBe(true);
    expect(result.warnings.some((w) => w.includes('/nonexistent/file.md'))).toBe(true);
  });

  it('handles single file input', async () => {
    const result = await importMultipleFiles([
      resolve(fixturesDir, 'sample-claude.md'),
    ], { projectName: 'single' });

    expect(result.files.has('project.prs')).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm nx test importer -- --testPathPattern multi-importer`
Expected: FAIL -- module not found

- [ ] **Step 3: Add `emitModularFiles()` to emitter.ts**

Add to `packages/importer/src/emitter.ts` (after existing code):

```typescript
import type { MergedBlock } from './merger.js';

export interface ModularEmitOptions {
  projectName: string;
  syntaxVersion?: string;
}

/**
 * Emit merged blocks as modular .prs files.
 * Returns a Map<filename, content> where filenames are relative to .promptscript/.
 *
 * Layout:
 * - project.prs: @meta + @identity + @use directives
 * - context.prs: @context (if exists)
 * - standards.prs: @standards (if exists)
 * - restrictions.prs: @restrictions (if exists)
 * - commands.prs: @shortcuts + @knowledge (if exist)
 */
export function emitModularFiles(
  blocks: Map<string, MergedBlock>,
  options: ModularEmitOptions
): Map<string, string> {
  const files = new Map<string, string>();
  const syntaxVersion = options.syntaxVersion ?? '1.0.0';

  const useDirectives: string[] = [];
  const fileBlockMapping: Record<string, string[]> = {
    'context.prs': ['context'],
    'standards.prs': ['standards'],
    'restrictions.prs': ['restrictions'],
    'commands.prs': ['shortcuts', 'knowledge'],
  };

  for (const [filename, blockNames] of Object.entries(fileBlockMapping)) {
    const relevantBlocks = blockNames
      .map((name) => blocks.get(name))
      .filter((b): b is MergedBlock => b !== undefined);

    if (relevantBlocks.length === 0) continue;

    const lines: string[] = [];
    for (const block of relevantBlocks) {
      for (const comment of block.reviewComments) {
        lines.push(comment);
      }
      if (block.confidence < 0.5) {
        lines.push('# REVIEW: low confidence -- verify this mapping');
      }
      lines.push(`@${block.targetBlock} {`);
      lines.push('  """');
      for (const contentLine of block.content.split('\n')) {
        lines.push(`    ${contentLine}`);
      }
      lines.push('  """');
      lines.push('}');
      lines.push('');
    }

    const useName = filename.replace('.prs', '');
    useDirectives.push(`@use ./${useName}`);
    files.set(filename, lines.join('\n'));
  }

  // Emit project.prs
  const projectLines: string[] = [];
  projectLines.push('@meta {');
  projectLines.push(`  id: "${options.projectName}"`);
  projectLines.push(`  syntax: "${syntaxVersion}"`);
  projectLines.push('}');
  projectLines.push('');

  for (const dir of useDirectives) {
    projectLines.push(dir);
  }

  const identity = blocks.get('identity');
  if (identity) {
    projectLines.push('');
    for (const comment of identity.reviewComments) {
      projectLines.push(comment);
    }
    projectLines.push('@identity {');
    projectLines.push('  """');
    for (const line of identity.content.split('\n')) {
      projectLines.push(`    ${line}`);
    }
    projectLines.push('  """');
    projectLines.push('}');
  }

  projectLines.push('');
  files.set('project.prs', projectLines.join('\n'));

  return files;
}
```

- [ ] **Step 4: Write multi-importer implementation**

```typescript
// packages/importer/src/multi-importer.ts
import { basename } from 'path';
import { importFile } from './importer.js';
import { mergeSections, type SourcedSection } from './merger.js';
import { emitModularFiles, type ModularEmitOptions } from './emitter.js';

export interface MultiImportOptions extends ModularEmitOptions {}

export interface FileReport {
  file: string;
  sectionCount: number;
  confidence: number;
}

export interface MultiImportResult {
  /** Map of filename -> .prs content (relative to .promptscript/) */
  files: Map<string, string>;
  perFileReports: FileReport[];
  deduplicatedCount: number;
  overallConfidence: number;
  warnings: string[];
}

/**
 * Import multiple instruction files and produce modular .prs output.
 * Files that fail to import are skipped with warnings.
 */
export async function importMultipleFiles(
  filePaths: string[],
  options: MultiImportOptions
): Promise<MultiImportResult> {
  const allSections: SourcedSection[] = [];
  const perFileReports: FileReport[] = [];
  const warnings: string[] = [];

  for (const filePath of filePaths) {
    try {
      const result = await importFile(filePath);
      const source = basename(filePath);

      for (const section of result.sections) {
        allSections.push({ ...section, source });
      }

      perFileReports.push({
        file: filePath,
        sectionCount: result.sections.length,
        confidence: result.totalConfidence,
      });

      warnings.push(...result.warnings);
    } catch (error) {
      warnings.push(
        `Could not import ${filePath}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  if (allSections.length === 0) {
    return {
      files: new Map([['project.prs', emitEmptyProject(options)]]),
      perFileReports,
      deduplicatedCount: 0,
      overallConfidence: 0,
      warnings,
    };
  }

  const mergeResult = mergeSections(allSections);
  const files = emitModularFiles(mergeResult.merged, options);

  return {
    files,
    perFileReports,
    deduplicatedCount: mergeResult.deduplicatedCount,
    overallConfidence: mergeResult.overallConfidence,
    warnings,
  };
}

function emitEmptyProject(options: MultiImportOptions): string {
  return `@meta {
  id: "${options.projectName}"
  syntax: "${options.syntaxVersion ?? '1.0.0'}"
}

@identity {
  """
  [No content could be imported. Edit this file manually.]
  """
}
`;
}
```

- [ ] **Step 5: Update `packages/importer/src/index.ts` with new exports**

Add after existing exports:

```typescript
export { mergeSections } from './merger.js';
export type { SourcedSection, MergedBlock, MergeResult } from './merger.js';
export { importMultipleFiles } from './multi-importer.js';
export type { MultiImportOptions, MultiImportResult, FileReport } from './multi-importer.js';
export { emitModularFiles } from './emitter.js';
export type { ModularEmitOptions } from './emitter.js';
```

- [ ] **Step 6: Run test to verify it passes**

Run: `pnpm nx test importer -- --testPathPattern multi-importer`
Expected: PASS (7 tests)

- [ ] **Step 7: Run all importer tests to ensure no regressions**

Run: `pnpm nx test importer`
Expected: All existing tests pass

- [ ] **Step 8: Commit**

```bash
git add packages/importer/src/multi-importer.ts packages/importer/src/emitter.ts packages/importer/src/merger.ts packages/importer/src/index.ts packages/importer/src/__tests__/multi-importer.spec.ts
git commit -m "feat(importer): add multi-file import with modular .prs output"
```

---

## Chunk 3: Enhanced Detection & Init Types (Phase 3a)

### Task 6: Enrich MigrationCandidate in ai-tools-detector

**Files:**
- Modify: `packages/cli/src/utils/ai-tools-detector.ts`
- Modify: `packages/cli/src/types.ts`
- Test: `packages/cli/src/utils/__tests__/ai-tools-detector.spec.ts` (new)

**Context:** Currently `migrationCandidates` is `string[]`. We change it to `MigrationCandidate[]` with `path`, `format`, `sizeBytes`, `sizeHuman`, `toolName`. This impacts consumers in `init.ts`.

- [ ] **Step 1: Write failing tests for enriched candidates**

```typescript
// packages/cli/src/utils/__tests__/ai-tools-detector.spec.ts
import { describe, it, expect, vi } from 'vitest';
import { detectAITools, hasMigrationCandidates, type AIToolsDetection } from '../ai-tools-detector.js';
import type { CliServices } from '../../services.js';

vi.mock('@promptscript/importer', () => ({
  detectFormat: vi.fn().mockReturnValue('claude'),
}));

describe('detectAITools -- enriched migration candidates', () => {
  it('returns MigrationCandidate objects with metadata', async () => {
    const mockServices = {
      fs: {
        existsSync: vi.fn().mockImplementation((p: string) =>
          p === 'CLAUDE.md' || p === '.git'
        ),
        readFile: vi.fn().mockResolvedValue('# My instructions\nYou are a helpful assistant'),
        readdir: vi.fn().mockResolvedValue([]),
        readFileSync: vi.fn().mockReturnValue('# My instructions\nYou are a helpful assistant'),
      },
      prompts: {} as CliServices['prompts'],
      cwd: '/mock',
    } as unknown as CliServices;

    const result = await detectAITools(mockServices);

    const candidate = result.migrationCandidates.find((c) => c.path === 'CLAUDE.md');
    expect(candidate).toBeDefined();
    expect(candidate!.path).toBe('CLAUDE.md');
    expect(candidate!.toolName).toBe('Claude Code');
    expect(typeof candidate!.sizeBytes).toBe('number');
    expect(typeof candidate!.sizeHuman).toBe('string');
  });

  it('hasMigrationCandidates works with enriched type', () => {
    const detection: AIToolsDetection = {
      detected: ['claude'],
      details: { claude: ['CLAUDE.md'] },
      migrationCandidates: [
        { path: 'CLAUDE.md', format: 'claude', sizeBytes: 1024, sizeHuman: '1.0 KB', toolName: 'Claude Code' },
      ],
    };
    expect(hasMigrationCandidates(detection)).toBe(true);
  });

  it('hasMigrationCandidates returns false when empty', () => {
    const detection: AIToolsDetection = {
      detected: [],
      details: {},
      migrationCandidates: [],
    };
    expect(hasMigrationCandidates(detection)).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm nx test cli -- --testPathPattern ai-tools-detector`
Expected: FAIL -- type mismatch (string[] vs MigrationCandidate[])

- [ ] **Step 3: Update `ai-tools-detector.ts`**

Key changes:

1. Add import at top: `import { detectFormat, type DetectedFormat } from '@promptscript/importer';`

2. Add `MigrationCandidate` interface and export it:
```typescript
export interface MigrationCandidate {
  path: string;
  format: DetectedFormat;
  sizeBytes: number;
  sizeHuman: string;
  toolName: string;
}
```

3. Change `AIToolsDetection.migrationCandidates` type from `string[]` to `MigrationCandidate[]`

4. Expand `INSTRUCTION_FILES` to include:
```typescript
'.windsurfrules', '.clinerules', '.goosehints',
'augment-guidelines.md', 'codex.md',
```

5. In `detectAITools()`, replace the string push with enriched object (use async readFile to match existing pattern):
```typescript
const content = await services.fs.readFile(file, 'utf-8');
const sizeBytes = Buffer.byteLength(content, 'utf-8');
migrationCandidates.push({
  path: file,
  format: detectFormat(file),
  sizeBytes,
  sizeHuman: formatFileSize(sizeBytes),
  toolName: toolNameForFile(file),
});
```

6. Add helper functions:
```typescript
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

const FILE_TOOL_NAMES: Record<string, string> = {
  'CLAUDE.md': 'Claude Code', 'claude.md': 'Claude Code',
  '.cursorrules': 'Cursor',
  '.github/copilot-instructions.md': 'GitHub Copilot',
  'AGENTS.md': 'Factory AI / Codex',
  'OPENCODE.md': 'OpenCode', 'GEMINI.md': 'Gemini CLI',
  '.windsurfrules': 'Windsurf', '.clinerules': 'Cline',
  '.goosehints': 'Goose',
  'augment-guidelines.md': 'Augment', 'codex.md': 'Codex',
  'AI_INSTRUCTIONS.md': 'Generic', 'AI.md': 'Generic',
};

function toolNameForFile(file: string): string {
  return FILE_TOOL_NAMES[file] ?? 'Unknown';
}
```

7. Update `formatMigrationHint()` to use enriched type. Complete replacement:

```typescript
export function formatMigrationHint(detection: AIToolsDetection): string[] {
  if (detection.migrationCandidates.length === 0) {
    return [];
  }

  const lines: string[] = [];
  lines.push('');
  lines.push('Existing instruction files detected:');
  for (const c of detection.migrationCandidates) {
    lines.push(`   - ${c.path} (${c.sizeHuman}, ${c.toolName})`);
  }
  lines.push('');
  lines.push('   These can be migrated to PromptScript for unified management.');
  lines.push('   Run: prs init --migrate');
  lines.push('   See: https://getpromptscript.dev/latest/guides/ai-migration-best-practices');

  return lines;
}
```

- [ ] **Step 4: Update `types.ts`**

Add to `InitOptions` (note: `import` is a reserved keyword, use `autoImport`):
```typescript
/** Non-interactive static import of detected files (--auto-import) */
autoImport?: boolean;
/** Create backup before migration */
backup?: boolean;
/** Internal: force migrate flow (used by prs migrate) */
_forceMigrate?: boolean;
/** Internal: force LLM flow (used by prs migrate --llm) */
_forceLlm?: boolean;
/** Internal: specific files to migrate (used by prs migrate --files) */
_migrateFiles?: string[];
```

Add new interface:
```typescript
export interface MigrateOptions {
  static?: boolean;
  llm?: boolean;
  files?: string[];
}
```

- [ ] **Step 5: Run tests**

Run: `pnpm nx test cli -- --testPathPattern ai-tools-detector`
Expected: PASS

- [ ] **Step 6: Run all CLI tests to check for regressions**

Run: `pnpm nx test cli`
Expected: All existing tests pass (consumers of `migrationCandidates` use `hasMigrationCandidates()` which checks `.length`)

- [ ] **Step 7: Commit**

```bash
git add packages/cli/src/utils/ai-tools-detector.ts packages/cli/src/types.ts packages/cli/src/utils/__tests__/ai-tools-detector.spec.ts
git commit -m "feat(cli): enrich migration candidates with size, format, and tool name"
```

---

## Chunk 4: Enhanced Init Command (Phase 3b)

### Task 7: Gateway Prompt & Migration Flow in init.ts

**Files:**
- Modify: `packages/cli/src/commands/init.ts`
- Test: `packages/cli/src/__tests__/init-migrate.spec.ts` (new)
- Modify: `packages/cli/src/__tests__/init-command.spec.ts` (update exit code test)

**Context:** This is the largest task. It modifies `initCommand()` to add:
1. Exit code 2 for "already initialized"
2. Gateway prompt when migration candidates detected
3. Static migration flow (calls `importMultipleFiles`)
4. AI-assisted flow (installs skill + generates prompt + clipboard)
5. Fresh start skill installation
6. `--auto-import` flag support for non-interactive mode

- [ ] **Step 1: Write failing tests for the gateway + migration flows**

```typescript
// packages/cli/src/__tests__/init-migrate.spec.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { initCommand } from '../commands/init.js';
import type { CliServices } from '../services.js';

// Same mock setup as init-command.spec.ts
const mockFindPrettierConfig = vi.fn().mockReturnValue(null);
vi.mock('../prettier/loader.js', () => ({
  findPrettierConfig: () => mockFindPrettierConfig(),
}));
vi.mock('../utils/manifest-loader.js', async (importOriginal) => {
  const original = (await importOriginal()) as Record<string, unknown>;
  return { ...original, loadManifestFromUrl: vi.fn().mockRejectedValue(new Error('n/a')) };
});
vi.mock('../config/user-config.js', () => ({
  loadUserConfig: vi.fn().mockResolvedValue({ version: '1' }),
}));
vi.mock('ora', () => ({
  default: vi.fn().mockReturnValue({
    start: vi.fn().mockReturnThis(), succeed: vi.fn().mockReturnThis(),
    fail: vi.fn().mockReturnThis(), warn: vi.fn().mockReturnThis(), text: '',
  }),
}));
vi.mock('chalk', () => ({
  default: {
    green: (s: string) => s, red: (s: string) => s,
    yellow: (s: string) => s, blue: (s: string) => s, gray: (s: string) => s,
  },
}));

const mockImportMultipleFiles = vi.fn();
vi.mock('@promptscript/importer', () => ({
  importMultipleFiles: (...args: unknown[]) => mockImportMultipleFiles(...args),
  detectFormat: vi.fn().mockReturnValue('generic'),
}));

const mockCopyToClipboard = vi.fn().mockReturnValue(true);
vi.mock('../utils/clipboard.js', () => ({
  copyToClipboard: (...args: unknown[]) => mockCopyToClipboard(...args),
}));

const mockIsGitRepo = vi.fn().mockReturnValue(true);
const mockCreateBackup = vi.fn().mockResolvedValue({ dir: '.prs-backup/2026', files: [] });
vi.mock('../utils/backup.js', () => ({
  isGitRepo: (...args: unknown[]) => mockIsGitRepo(...args),
  createBackup: (...args: unknown[]) => mockCreateBackup(...args),
}));

vi.spyOn(process, 'cwd').mockReturnValue('/mock/project');

describe('init -- migration flow', () => {
  let mockServices: CliServices;
  let mockFs: Record<string, ReturnType<typeof vi.fn>>;
  let mockPrompts: Record<string, ReturnType<typeof vi.fn>>;
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    process.exitCode = undefined;
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    // Default: CLAUDE.md exists as migration candidate, promptscript.yaml does NOT
    mockFs = {
      existsSync: vi.fn().mockImplementation((p: string) => p === 'CLAUDE.md'),
      writeFile: vi.fn().mockResolvedValue(undefined),
      mkdir: vi.fn().mockResolvedValue(undefined),
      readFile: vi.fn().mockResolvedValue('# Project\nYou are a helpful assistant'),
      readdir: vi.fn().mockResolvedValue([]),
      readFileSync: vi.fn().mockReturnValue('# Project\nYou are a helpful assistant'),
    };

    mockPrompts = {
      input: vi.fn().mockResolvedValue('test-project'),
      confirm: vi.fn().mockResolvedValue(false),
      checkbox: vi.fn().mockResolvedValue(['github', 'claude']),
      select: vi.fn(),
    };

    mockServices = {
      fs: mockFs as unknown as CliServices['fs'],
      prompts: mockPrompts as unknown as CliServices['prompts'],
      cwd: '/mock/project',
    };
  });

  afterEach(() => { consoleSpy.mockRestore(); });

  it('sets exit code 2 when already initialized', async () => {
    mockFs.existsSync = vi.fn().mockImplementation(
      (p: string) => p === 'promptscript.yaml'
    );
    await initCommand({}, mockServices);
    expect(process.exitCode).toBe(2);
  });

  it('shows gateway prompt when migration candidates detected (interactive)', async () => {
    // Gateway: fresh-start (no second select for strategy needed)
    // Then: registry skip, targets checkbox
    mockPrompts.select = vi.fn()
      .mockResolvedValueOnce('fresh-start')  // gateway
      .mockResolvedValueOnce('skip');         // registry

    await initCommand({ interactive: true }, mockServices);

    // First select call should be the gateway
    expect(mockPrompts.select).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('How would you like to start'),
      })
    );
  });

  it('shows strategy prompt when user picks migrate', async () => {
    mockPrompts.select = vi.fn()
      .mockResolvedValueOnce('migrate')   // gateway: migrate
      .mockResolvedValueOnce('llm')       // strategy: AI-assisted
      .mockResolvedValueOnce('skip');      // registry

    await initCommand({ interactive: true }, mockServices);

    // Second select should be the strategy prompt
    expect(mockPrompts.select).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('How do you want to migrate'),
      })
    );
  });

  it('--auto-import flag triggers static import in non-interactive mode', async () => {
    mockImportMultipleFiles.mockResolvedValue({
      files: new Map([['project.prs', '@meta { id: "test" syntax: "1.0.0" }']]),
      perFileReports: [{ file: 'CLAUDE.md', sectionCount: 3, confidence: 0.85 }],
      deduplicatedCount: 0,
      overallConfidence: 0.85,
      warnings: [],
    });

    await initCommand({ yes: true, autoImport: true }, mockServices);

    expect(mockImportMultipleFiles).toHaveBeenCalled();
    expect(mockFs.writeFile).toHaveBeenCalledWith(
      '.promptscript/project.prs',
      expect.stringContaining('@meta'),
      'utf-8'
    );
  });

  it('-y without --auto-import skips migration and shows hint', async () => {
    await initCommand({ yes: true }, mockServices);

    expect(mockImportMultipleFiles).not.toHaveBeenCalled();
    expect(mockFs.writeFile).toHaveBeenCalledWith(
      '.promptscript/project.prs',
      expect.any(String),
      'utf-8'
    );
  });

  it('LLM flow installs skill and generates prompt', async () => {
    await initCommand({ yes: true, _forceMigrate: true, _forceLlm: true }, mockServices);

    // Should copy to clipboard
    expect(mockCopyToClipboard).toHaveBeenCalled();
    // Should save migration prompt file
    expect(mockFs.writeFile).toHaveBeenCalledWith(
      '.promptscript/migration-prompt.md',
      expect.stringContaining('/promptscript'),
      'utf-8'
    );
  });

  it('backup is created when --backup flag is set', async () => {
    mockImportMultipleFiles.mockResolvedValue({
      files: new Map([['project.prs', '@meta { id: "test" syntax: "1.0.0" }']]),
      perFileReports: [],
      deduplicatedCount: 0,
      overallConfidence: 0.85,
      warnings: [],
    });

    await initCommand({ yes: true, autoImport: true, backup: true }, mockServices);

    expect(mockCreateBackup).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm nx test cli -- --testPathPattern init-migrate`
Expected: FAIL -- gateway prompt not implemented

- [ ] **Step 3: Implement changes to init.ts**

This is the most complex change. Key modifications:

**3a.** Change "already initialized" from `return` to `process.exitCode = 2; return;`

**3b.** Add new imports at top of init.ts:
```typescript
import { importMultipleFiles } from '@promptscript/importer';
import { copyToClipboard } from '../utils/clipboard.js';
import { isGitRepo, createBackup } from '../utils/backup.js';
import { generateMigrationPrompt } from '../utils/migration-prompt.js';
import type { MigrationCandidate } from '../utils/ai-tools-detector.js';
```

**3c.** After `detectAITools()`, add migration mode determination:
```typescript
let migrationMode: 'static' | 'llm' | 'skip' | 'none' = 'none';

if (hasMigrationCandidates(aiToolsDetection)) {
  if (options.yes && options.autoImport) {
    migrationMode = 'static';
  } else if (options.yes) {
    migrationMode = 'skip';
  } else if (options._forceMigrate) {
    migrationMode = options._forceLlm ? 'llm' : 'static';
  } else {
    migrationMode = await showGatewayPrompt(aiToolsDetection, services);
  }
}
```

**3d.** Add `showGatewayPrompt()` function:
```typescript
async function showGatewayPrompt(
  detection: Awaited<ReturnType<typeof detectAITools>>,
  services: CliServices
): Promise<'static' | 'llm' | 'skip'> {
  ConsoleOutput.newline();
  console.log('Found existing instruction files:');
  for (const c of detection.migrationCandidates) {
    ConsoleOutput.muted(`  ${c.path} (${c.sizeHuman}, ${c.toolName})`);
  }
  ConsoleOutput.newline();

  const gateway = await services.prompts.select({
    message: 'How would you like to start?',
    choices: [
      { name: 'Migrate existing instructions to PromptScript', value: 'migrate' },
      { name: 'Fresh start (ignore existing files)', value: 'fresh-start' },
    ],
  });

  if (gateway === 'fresh-start') return 'skip';

  const strategy = await services.prompts.select({
    message: 'How do you want to migrate?',
    choices: [
      { name: 'Static import (fast, deterministic)', value: 'static' },
      { name: 'AI-assisted migration (installs skill + generates prompt)', value: 'llm' },
    ],
  });

  return strategy as 'static' | 'llm';
}
```

**3e.** Add `handleMigrationBackup()` helper (shared by static and LLM flows):
```typescript
async function handleMigrationBackup(
  candidates: MigrationCandidate[],
  options: InitOptions,
  services: CliServices
): Promise<void> {
  const gitRepo = isGitRepo(services);
  if (!gitRepo) {
    ConsoleOutput.warn('Not a git repository. Files are not version-controlled.');
  }

  const shouldBackup = options.backup ?? (
    options.yes ? false : await services.prompts.confirm({
      message: 'Create backup to .prs-backup/?',
      default: !gitRepo,
    })
  );

  if (shouldBackup) {
    const backupResult = await createBackup(
      candidates.map((c) => c.path), services
    );
    ConsoleOutput.info(`Backup created: ${backupResult.dir}`);
  }
}
```

**3f.** Add `handleStaticMigration()` — full implementation:
```typescript
async function handleStaticMigration(
  candidates: MigrationCandidate[],
  config: ResolvedConfig,
  options: InitOptions,
  services: CliServices
): Promise<Map<string, string>> {
  await handleMigrationBackup(candidates, options, services);

  // File selection (interactive only)
  let selectedPaths = candidates.map((c) => c.path);
  if (!options.yes) {
    selectedPaths = await services.prompts.checkbox({
      message: 'Select files to import:',
      choices: candidates.map((c) => ({
        name: `${c.path} (${c.sizeHuman}, ${c.toolName})`,
        value: c.path,
        checked: true,
      })),
    });
  }

  const spinner = createSpinner('Importing instruction files...').start();

  const result = await importMultipleFiles(
    selectedPaths.map((f) => resolve(process.cwd(), f)),
    { projectName: config.projectId }
  );

  spinner.succeed(`Imported ${result.perFileReports.length} files`);

  // Show confidence report
  ConsoleOutput.newline();
  console.log('Import Summary:');
  for (const report of result.perFileReports) {
    const pct = Math.round(report.confidence * 100);
    ConsoleOutput.muted(`  ${basename(report.file)} -> ${report.sectionCount} sections (${pct}%)`);
  }
  ConsoleOutput.muted(`  Overall confidence: ${Math.round(result.overallConfidence * 100)}%`);
  if (result.deduplicatedCount > 0) {
    ConsoleOutput.muted(`  Deduplicated: ${result.deduplicatedCount} lines`);
  }
  for (const w of result.warnings) {
    ConsoleOutput.warn(w);
  }

  return result.files;
}
```

Add `import { basename, resolve } from 'path';` (resolve is already imported, basename may need adding).

**3g.** Add `handleLlmMigration()` — full implementation:
```typescript
async function handleLlmMigration(
  candidates: MigrationCandidate[],
  options: InitOptions,
  services: CliServices
): Promise<void> {
  await handleMigrationBackup(candidates, options, services);

  const prompt = generateMigrationPrompt(
    candidates.map((c) => ({
      path: c.path,
      sizeHuman: c.sizeHuman,
      toolName: c.toolName,
    }))
  );

  // Save prompt to file
  await services.fs.writeFile('.promptscript/migration-prompt.md', prompt, 'utf-8');

  // Copy to clipboard
  const copied = copyToClipboard(prompt);
  if (copied) {
    ConsoleOutput.success('Migration prompt copied to clipboard!');
  } else {
    ConsoleOutput.newline();
    console.log(prompt);
  }

  ConsoleOutput.info('Saved to .promptscript/migration-prompt.md');
}
```

**3h.** Extract existing skill install logic (lines 146-181 of current init.ts) into `installSkillToTargets()`:
```typescript
function installSkillToTargets(
  targets: AIToolTarget[],
  services: CliServices
): string[] {
  const skillName = 'promptscript';
  const skillSource = resolve(BUNDLED_SKILLS_DIR, skillName, 'SKILL.md');
  const installedPaths: string[] = [];

  try {
    const rawSkillContent = readFileSync(skillSource, 'utf-8');
    let skillContent = rawSkillContent;
    const hasMarker =
      rawSkillContent.includes('<!-- PromptScript') ||
      rawSkillContent.includes('# promptscript-generated:');
    if (!hasMarker && rawSkillContent.startsWith('---')) {
      const yamlMarker = `# promptscript-generated: ${new Date().toISOString()}`;
      skillContent = `---\n${yamlMarker}${rawSkillContent.slice(3)}`;
    }

    for (const target of targets) {
      const targetSkillDir = getTargetSkillDir(target, skillName);
      if (targetSkillDir) {
        // Use sync mkdir+write since this is a best-effort install
        services.fs.mkdir(targetSkillDir.dir, { recursive: true }).then(() => {
          services.fs.writeFile(targetSkillDir.path, skillContent, 'utf-8');
        });
        installedPaths.push(targetSkillDir.path);
      }
    }
  } catch {
    ConsoleOutput.warn(`Could not install PromptScript skill from ${skillSource}`);
  }

  return installedPaths;
}
```

**3i.** In the file creation section, branch on `migrationMode`:
- If `migrationMode === 'static'`: call `handleStaticMigration()`, write returned files to `.promptscript/` instead of scaffold `project.prs`
- If `migrationMode === 'llm'`: write scaffold `project.prs`, then call `handleLlmMigration()`
- If `migrationMode === 'skip'` or `'none'`: existing scaffold behavior

**3j.** Always call `installSkillToTargets()` after file creation (for all modes). The existing `--migrate` code block that installs skills should be replaced by this call. For LLM mode, skill installation happens here too (before compile, so AI can discover it).

- [ ] **Step 4: Update existing test in init-command.spec.ts**

Change the "should warn when already initialized" test:
```typescript
it('should set exit code 2 when already initialized', async () => {
  mockFs.existsSync.mockImplementation((path: string) => path === 'promptscript.yaml');
  await initCommand({}, mockServices);
  expect(process.exitCode).toBe(2);
});
```

- [ ] **Step 5: Run tests**

Run: `pnpm nx test cli -- --testPathPattern "init-migrate|init-command"`
Expected: PASS

- [ ] **Step 6: Run full CLI test suite**

Run: `pnpm nx test cli`
Expected: All tests pass

- [ ] **Step 7: Commit**

```bash
git add packages/cli/src/commands/init.ts packages/cli/src/__tests__/init-migrate.spec.ts packages/cli/src/__tests__/init-command.spec.ts
git commit -m "feat(cli): add gateway prompt and migration flow to prs init"
```

---

## Chunk 5: Migrate Command & CLI Registration (Phase 4)

### Task 8: `prs migrate` Command

**Files:**
- Create: `packages/cli/src/commands/migrate.ts`
- Modify: `packages/cli/src/cli.ts`
- Test: `packages/cli/src/__tests__/migrate-command.spec.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// packages/cli/src/__tests__/migrate-command.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { migrateCommand } from '../commands/migrate.js';

const mockInitCommand = vi.fn().mockResolvedValue(undefined);
vi.mock('../commands/init.js', () => ({
  initCommand: (...args: unknown[]) => mockInitCommand(...args),
}));

describe('migrateCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('delegates to initCommand with _forceMigrate flag', async () => {
    await migrateCommand({});
    expect(mockInitCommand).toHaveBeenCalledWith(
      expect.objectContaining({ _forceMigrate: true }),
      expect.anything()
    );
  });

  it('--static maps to yes + autoImport flags', async () => {
    await migrateCommand({ static: true });
    expect(mockInitCommand).toHaveBeenCalledWith(
      expect.objectContaining({ yes: true, autoImport: true, _forceMigrate: true }),
      expect.anything()
    );
  });

  it('--llm maps to _forceLlm flag', async () => {
    await migrateCommand({ llm: true });
    expect(mockInitCommand).toHaveBeenCalledWith(
      expect.objectContaining({ _forceMigrate: true, _forceLlm: true }),
      expect.anything()
    );
  });

  it('--files are passed through to initCommand', async () => {
    await migrateCommand({ files: ['CLAUDE.md', '.cursorrules'] });
    expect(mockInitCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        _forceMigrate: true,
        _migrateFiles: ['CLAUDE.md', '.cursorrules'],
      }),
      expect.anything()
    );
  });

  it('always sets force: true to allow running on initialized projects', async () => {
    await migrateCommand({});
    expect(mockInitCommand).toHaveBeenCalledWith(
      expect.objectContaining({ force: true }),
      expect.anything()
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm nx test cli -- --testPathPattern migrate-command`
Expected: FAIL -- module not found

- [ ] **Step 3: Write implementation**

```typescript
// packages/cli/src/commands/migrate.ts
import { initCommand } from './init.js';
import type { MigrateOptions } from '../types.js';
import { type CliServices, createDefaultServices } from '../services.js';

/**
 * prs migrate -- alias/shortcut to init migration path.
 * Delegates to initCommand with appropriate flags.
 *
 * When promptscript.yaml already exists, force: true allows
 * initCommand to re-enter and run migration-only flow
 * (skipping re-init prompts since config exists).
 */
export async function migrateCommand(
  options: MigrateOptions,
  services: CliServices = createDefaultServices()
): Promise<void> {
  const initOptions = {
    _forceMigrate: true,
    _forceLlm: options.llm ?? false,
    _migrateFiles: options.files,
    yes: options.static ?? false,
    autoImport: options.static ?? false,
    force: true, // Allow running on already-initialized projects
  };

  await initCommand(initOptions, services);
}
```

- [ ] **Step 4: Update `cli.ts`**

Add `--auto-import` and `--backup` to init command registration:
```typescript
.option('--auto-import', 'Automatically import existing instruction files (static)')
.option('--backup', 'Create .prs-backup/ before migration')
```

In the action handler, map Commander's camelCase to our option:
```typescript
.action((opts) => initCommand({ ...opts, autoImport: opts.autoImport }, services));
```

Add deprecation warning for `--migrate` in init action handler. Import `ConsoleOutput` at top of `cli.ts`:
```typescript
import { ConsoleOutput } from './output/console.js';
```
Then in the init action:
```typescript
if (opts.migrate) {
  ConsoleOutput.warn('--migrate is deprecated. The migration flow is now built into prs init.');
}
```

Register new `migrate` command:
```typescript
program
  .command('migrate')
  .description('Migrate existing AI instructions to PromptScript')
  .option('--static', 'Non-interactive static import of all detected files')
  .option('--llm', 'Generate AI-assisted migration prompt')
  .option('--files <files...>', 'Specific files to import')
  .action(async (opts) => {
    const { migrateCommand } = await import('./commands/migrate.js');
    await migrateCommand(opts);
  });
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm nx test cli -- --testPathPattern migrate-command`
Expected: PASS (3 tests)

- [ ] **Step 6: Run full CLI tests**

Run: `pnpm nx test cli`
Expected: All pass

- [ ] **Step 7: Commit**

```bash
git add packages/cli/src/commands/migrate.ts packages/cli/src/cli.ts packages/cli/src/__tests__/migrate-command.spec.ts
git commit -m "feat(cli): add prs migrate command as alias to init migration flow"
```

---

## Chunk 6: Documentation & Final Verification (Phase 5)

### Task 9: Update SKILL.md

**Files:**
- Modify: `packages/cli/skills/promptscript/SKILL.md`

- [ ] **Step 1: Update CLI Commands section**

In the `## CLI Commands` section, add `prs migrate` entries after existing commands:

```markdown
prs migrate                 # Interactive migration flow
prs migrate --static        # Non-interactive static import
prs migrate --llm           # Generate AI-assisted migration prompt
```

- [ ] **Step 2: Commit**

```bash
git add packages/cli/skills/promptscript/SKILL.md
git commit -m "docs(cli): add prs migrate to SKILL.md CLI commands"
```

---

### Task 10: Full Verification Pipeline

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

- [ ] **Step 8: Fix any issues found in steps 1-7**

Iterate until all checks pass.

- [ ] **Step 9: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "chore: fix lint/type/test issues from verification pipeline"
```
