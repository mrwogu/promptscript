import { describe, it, expect, vi } from 'vitest';
import type { TargetEntry, TargetConfig } from '@promptscript/core';
import { resolve } from 'path';
import { existsSync } from 'fs';

/**
 * Parse target entries into compiler format.
 * Filters out targets with enabled: false.
 *
 * Note: This is a copy of the function from compile.ts for testing purposes.
 * The actual function is private to the module.
 */
function parseTargets(targets: TargetEntry[]): { name: string; config?: TargetConfig }[] {
  return targets
    .map((entry) => {
      if (typeof entry === 'string') {
        return { name: entry };
      }
      // Object format: { github: { convention: 'xml' } }
      const entries = Object.entries(entry);
      if (entries.length === 0) {
        throw new Error('Empty target configuration');
      }
      const [name, config] = entries[0] as [string, TargetConfig | undefined];
      return { name, config };
    })
    .filter((target) => target.config?.enabled !== false);
}

describe('parseTargets', () => {
  it('should parse string targets', () => {
    const targets: TargetEntry[] = ['github', 'claude'];
    const result = parseTargets(targets);
    expect(result).toEqual([{ name: 'github' }, { name: 'claude' }]);
  });

  it('should parse object targets with config', () => {
    const targets: TargetEntry[] = [
      { github: { convention: 'xml' } },
      { claude: { output: 'custom/CLAUDE.md' } },
    ];
    const result = parseTargets(targets);
    expect(result).toEqual([
      { name: 'github', config: { convention: 'xml' } },
      { name: 'claude', config: { output: 'custom/CLAUDE.md' } },
    ]);
  });

  it('should filter out targets with enabled: false', () => {
    const targets: TargetEntry[] = [
      { github: { enabled: true } },
      { claude: { enabled: false } },
      { cursor: { convention: 'markdown' } },
    ];
    const result = parseTargets(targets);
    expect(result).toEqual([
      { name: 'github', config: { enabled: true } },
      { name: 'cursor', config: { convention: 'markdown' } },
    ]);
  });

  it('should include targets with enabled: true', () => {
    const targets: TargetEntry[] = [{ github: { enabled: true, convention: 'xml' } }];
    const result = parseTargets(targets);
    expect(result).toEqual([{ name: 'github', config: { enabled: true, convention: 'xml' } }]);
  });

  it('should include targets without enabled property (defaults to true)', () => {
    const targets: TargetEntry[] = [
      'github',
      { claude: { output: 'CLAUDE.md' } },
      { cursor: { enabled: false } },
    ];
    const result = parseTargets(targets);
    expect(result).toEqual([
      { name: 'github' },
      { name: 'claude', config: { output: 'CLAUDE.md' } },
    ]);
  });

  it('should throw on empty target configuration', () => {
    const targets: TargetEntry[] = [{}];
    expect(() => parseTargets(targets)).toThrow('Empty target configuration');
  });

  it('should handle mixed string and object targets', () => {
    const targets: TargetEntry[] = [
      'github',
      { claude: { enabled: false } },
      'cursor',
      { antigravity: { enabled: true } },
    ];
    const result = parseTargets(targets);
    expect(result).toEqual([
      { name: 'github' },
      { name: 'cursor' },
      { name: 'antigravity', config: { enabled: true } },
    ]);
  });
});

/**
 * Find a config file in the given directory by checking all known config file names.
 *
 * Note: This is a copy of the function from compile.ts for testing purposes.
 * The actual function is private to the module.
 */
const CONFIG_FILES = [
  'promptscript.yaml',
  'promptscript.yml',
  '.promptscriptrc.yaml',
  '.promptscriptrc.yml',
];

function findConfigInDir(dir: string): string | undefined {
  for (const file of CONFIG_FILES) {
    const fullPath = resolve(dir, file);
    if (existsSync(fullPath)) {
      return fullPath;
    }
  }
  return undefined;
}

vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>();
  return {
    ...actual,
    existsSync: vi.fn(actual.existsSync),
  };
});

describe('findConfigInDir', () => {
  it('should return path when promptscript.yaml exists', () => {
    const mockExistsSync = vi.mocked(existsSync);
    mockExistsSync.mockImplementation((path) => {
      return String(path).endsWith('promptscript.yaml');
    });

    const result = findConfigInDir('/my/project');
    expect(result).toBe(resolve('/my/project', 'promptscript.yaml'));
  });

  it('should try all config file names', () => {
    const mockExistsSync = vi.mocked(existsSync);
    mockExistsSync.mockImplementation((path) => {
      return String(path).endsWith('.promptscriptrc.yml');
    });

    const result = findConfigInDir('/my/project');
    expect(result).toBe(resolve('/my/project', '.promptscriptrc.yml'));
  });

  it('should return undefined when no config files found', () => {
    const mockExistsSync = vi.mocked(existsSync);
    mockExistsSync.mockReturnValue(false);

    const result = findConfigInDir('/empty/project');
    expect(result).toBeUndefined();
  });

  it('should return the first matching config file', () => {
    const mockExistsSync = vi.mocked(existsSync);
    mockExistsSync.mockReturnValue(true);

    const result = findConfigInDir('/my/project');
    // Should return the first one (promptscript.yaml), not later matches
    expect(result).toBe(resolve('/my/project', 'promptscript.yaml'));
  });
});

/**
 * Copy of detectOutputConflicts from compile.ts for testing.
 */
function detectOutputConflicts(
  targets: { name: string; config?: TargetConfig }[]
): Map<string, string[]> {
  // Inline DEFAULT_OUTPUT_PATHS for test isolation
  const DEFAULT_PATHS: Record<string, string> = {
    github: '.github/copilot-instructions.md',
    claude: 'CLAUDE.md',
    cursor: '.cursor/rules/project.mdc',
    factory: 'AGENTS.md',
    codex: 'AGENTS.md',
    amp: 'AGENTS.md',
    opencode: 'OPENCODE.md',
    gemini: 'GEMINI.md',
    windsurf: '.windsurf/rules/project.md',
    cline: '.clinerules',
  };

  const pathMap = new Map<string, string[]>();
  for (const target of targets) {
    const outputPath = target.config?.output ?? DEFAULT_PATHS[target.name] ?? target.name;
    const existing = pathMap.get(outputPath) ?? [];
    existing.push(target.name);
    pathMap.set(outputPath, existing);
  }

  const conflicts = new Map<string, string[]>();
  for (const [path, names] of pathMap) {
    if (names.length > 1) {
      conflicts.set(path, names);
    }
  }
  return conflicts;
}

describe('detectOutputConflicts', () => {
  it('should detect factory and codex conflicting on AGENTS.md', () => {
    const targets = [{ name: 'factory' }, { name: 'codex' }];
    const conflicts = detectOutputConflicts(targets);
    expect(conflicts.size).toBe(1);
    expect(conflicts.get('AGENTS.md')).toEqual(['factory', 'codex']);
  });

  it('should detect three-way conflict on AGENTS.md', () => {
    const targets = [{ name: 'factory' }, { name: 'codex' }, { name: 'amp' }];
    const conflicts = detectOutputConflicts(targets);
    expect(conflicts.get('AGENTS.md')).toEqual(['factory', 'codex', 'amp']);
  });

  it('should report no conflicts for unique paths', () => {
    const targets = [{ name: 'claude' }, { name: 'github' }, { name: 'cursor' }];
    const conflicts = detectOutputConflicts(targets);
    expect(conflicts.size).toBe(0);
  });

  it('should respect custom output overrides', () => {
    const targets = [{ name: 'factory' }, { name: 'codex', config: { output: 'CODEX-AGENTS.md' } }];
    const conflicts = detectOutputConflicts(targets);
    expect(conflicts.size).toBe(0);
  });

  it('should detect conflict when custom output matches another target', () => {
    const targets = [{ name: 'claude' }, { name: 'opencode', config: { output: 'CLAUDE.md' } }];
    const conflicts = detectOutputConflicts(targets);
    expect(conflicts.size).toBe(1);
    expect(conflicts.get('CLAUDE.md')).toEqual(['claude', 'opencode']);
  });
});
