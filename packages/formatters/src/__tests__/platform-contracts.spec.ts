import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname, relative, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const FIXTURES_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  'fixtures',
  'platform-contracts'
);

/**
 * Recursively find every INDEX.md under the fixture tree.
 */
function findAllIndexFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    if (statSync(fullPath).isDirectory()) {
      results.push(...findAllIndexFiles(fullPath));
    } else if (entry === 'INDEX.md') {
      results.push(fullPath);
    }
  }
  return results;
}

/**
 * Extract a top-level "Field: value" from markdown content.
 */
function extractField(content: string, field: string): string | null {
  const regex = new RegExp(`^${field}:\\s*(.+)$`, 'mi');
  const match = content.match(regex);
  return match ? match[1].trim() : null;
}

const VALID_SCOPES = ['formatter-scope', 'out-of-scope', 'rejected'];

/**
 * Determine the INDEX.md type:
 * - 'family': has a markdown table with Source/Retrieved/Scope columns
 * - 'target': has ## Scope classification section + ## Expected path section
 * - 'spec': has Source/Retrieved but no Scope or Expected path (spec pages)
 */
function getIndexType(content: string): 'family' | 'target' | 'spec' {
  if (/\|\s*Source/i.test(content) && /\|\s*Scope/i.test(content)) return 'family';
  if (
    /##\s+Scope classification/i.test(content) ||
    /##\s+Expected path/i.test(content) ||
    /##\s+Why rejected/i.test(content)
  )
    return 'target';
  return 'spec';
}

/**
 * Extract scope value from a target INDEX.md by searching the
 * "## Scope classification" section for a valid scope keyword in backticks.
 */
function extractScopeFromSection(content: string): string | null {
  const sectionMatch = content.match(/##\s+Scope classification[\s\S]*?(?=\n##\s|\n$|$)/i);
  if (!sectionMatch) return null;
  for (const scope of VALID_SCOPES) {
    if (new RegExp(`\`${scope}\``, 'i').test(sectionMatch[0])) return scope;
    if (new RegExp(`\\b${scope}\\b`, 'i').test(sectionMatch[0])) return scope;
  }
  return null;
}

const allIndexFiles = findAllIndexFiles(FIXTURES_DIR);

describe('Platform contract fixture integrity', () => {
  it('should find at least one INDEX.md in the fixture tree', () => {
    expect(allIndexFiles.length).toBeGreaterThan(0);
  });

  it('should find INDEX.md for every expected platform directory', () => {
    const expectedDirs = [
      'claude',
      'github',
      'cursor',
      'antigravity',
      'codex',
      'gemini',
      'grok',
      'factory',
      'agents-md-spec',
      'skill-md-spec',
      'agents-md-only',
      'agents-md-only/amazon-q',
      'agents-md-only/warp',
      'agents-md-only/zed',
      'agents-md-only/aider',
      'agents-md-only/jules',
      'agents-md-only/devin',
      'agents-md-only/phoenix',
      'agents-md-only/swe-agent',
      'priority-b',
      'priority-b/kimi',
      'priority-b/mimo',
      'priority-b/deep-agents',
      'priority-b/forgecode',
    ];
    for (const dir of expectedDirs) {
      const indexPath = join(FIXTURES_DIR, dir, 'INDEX.md');
      expect(existsSync(indexPath), `Missing INDEX.md: ${dir}/INDEX.md`).toBe(true);
    }
  });

  describe.each(
    allIndexFiles.map((filePath) => ({
      filePath,
      relPath: relative(FIXTURES_DIR, filePath),
      dirName: basename(dirname(filePath)),
      content: readFileSync(filePath, 'utf-8'),
    }))
  )('$relPath', ({ content, dirName, filePath }) => {
    const indexType = getIndexType(content);
    const isRejectedDir =
      basename(dirname(filePath)) === 'phoenix' || basename(dirname(filePath)) === 'swe-agent';

    it('should contain a Source URL or table column', () => {
      if (indexType === 'family') {
        expect(
          /\|\s*Source/i.test(content),
          `${dirName}/INDEX.md family index must have Source column`
        ).toBe(true);
      } else {
        const source = extractField(content, 'Source');
        expect(source, `${dirName}/INDEX.md must have a Source field`).not.toBeNull();
        // Source must contain a URL, "web search", or "rejected" marker
        expect(source!).toMatch(/https?:\/\/|web search|rejected/i);
      }
    });

    it('should contain a Retrieved date', () => {
      if (indexType === 'family') {
        expect(
          /\|\s*Retrieved/i.test(content),
          `${dirName}/INDEX.md family index must have Retrieved column`
        ).toBe(true);
      } else {
        const retrieved = extractField(content, 'Retrieved');
        expect(retrieved, `${dirName}/INDEX.md must have a Retrieved date`).not.toBeNull();
        expect(retrieved!).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    });

    if (indexType === 'target') {
      it('should contain a valid Scope classification', () => {
        // First try top-level "Scope: value" field
        let scope = extractField(content, 'Scope');
        // Then try extracting from "## Scope classification" section
        if (!scope) scope = extractScopeFromSection(content);
        expect(scope, `${dirName}/INDEX.md must have a valid scope`).not.toBeNull();
        expect(VALID_SCOPES).toContain(scope);
      });

      it('should contain an Expected path or rejected status', () => {
        const hasExpectedPath = /##\s+Expected path/i.test(content);
        const hasRejected = /##\s+Why rejected/i.test(content);
        expect(
          hasExpectedPath || hasRejected,
          `${dirName}/INDEX.md must have "## Expected path" or "## Why rejected"`
        ).toBe(true);
      });
    }

    if (indexType === 'family') {
      it('should have a Scope column in the table', () => {
        expect(
          /\|\s*Scope/i.test(content),
          `${dirName}/INDEX.md family index must have Scope column`
        ).toBe(true);
      });

      it('should have an Expected path column in the table', () => {
        expect(
          /\|\s*Expected path/i.test(content),
          `${dirName}/INDEX.md family index must have Expected path column`
        ).toBe(true);
      });
    }

    // Spec pages (agents-md-spec, skill-md-spec) are not per-target contracts;
    // they document open standards. Only Source + Retrieved are required.
    if (indexType === 'spec') {
      it('should contain a Version field', () => {
        const version = extractField(content, 'Version');
        expect(version, `${dirName}/INDEX.md spec page must have a Version field`).not.toBeNull();
      });
    }

    it('should reference fixture files that exist on disk', () => {
      const dir = dirname(filePath);
      const files = readdirSync(dir).filter(
        (f) => f !== 'INDEX.md' && f !== '.DS_Store' && !statSync(join(dir, f)).isDirectory()
      );
      for (const file of files) {
        expect(existsSync(join(dir, file)), `Fixture file missing: ${file}`).toBe(true);
      }
    });

    if (isRejectedDir) {
      it('should document why it was rejected and reopen conditions', () => {
        expect(content).toMatch(/##\s+Why rejected|##\s+.*Rejected/i);
        expect(content).toMatch(/##\s+What PromptScript must not do|##\s+Reopen condition/i);
      });
    }
  });
});
