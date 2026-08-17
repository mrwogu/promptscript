import { describe, it, expect, vi } from 'vitest';
import type { TargetEntry } from '@promptscript/core';
import { resolve } from 'path';
import { existsSync } from 'fs';
import { parseTargetEntries } from '../utils/target-config.js';

describe('parseTargets', () => {
  it('should parse string targets', () => {
    const targets: TargetEntry[] = ['github', 'claude'];
    const result = parseTargetEntries(targets);
    expect(result).toEqual([{ name: 'github' }, { name: 'claude' }]);
  });

  it('should parse object targets with config', () => {
    const targets: TargetEntry[] = [
      { github: { convention: 'xml' } },
      { claude: { output: 'custom/CLAUDE.md' } },
    ];
    const result = parseTargetEntries(targets);
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
    const result = parseTargetEntries(targets);
    expect(result).toEqual([
      { name: 'github', config: { enabled: true } },
      { name: 'cursor', config: { convention: 'markdown' } },
    ]);
  });

  it('should include targets with enabled: true', () => {
    const targets: TargetEntry[] = [{ github: { enabled: true, convention: 'xml' } }];
    const result = parseTargetEntries(targets);
    expect(result).toEqual([{ name: 'github', config: { enabled: true, convention: 'xml' } }]);
  });

  it('should include targets without enabled property (defaults to true)', () => {
    const targets: TargetEntry[] = [
      'github',
      { claude: { output: 'CLAUDE.md' } },
      { cursor: { enabled: false } },
    ];
    const result = parseTargetEntries(targets);
    expect(result).toEqual([
      { name: 'github' },
      { name: 'claude', config: { output: 'CLAUDE.md' } },
    ]);
  });

  it('should throw on empty target configuration', () => {
    const targets: TargetEntry[] = [{}];
    expect(() => parseTargetEntries(targets)).toThrow('Empty target configuration');
  });

  it('should throw on a malformed target configuration', () => {
    const targets = [{ github: [] }] as unknown as TargetEntry[];

    expect(() => parseTargetEntries(targets)).toThrow(
      'Target "github" configuration must be an object'
    );
  });

  it('should throw when targets is not an array', () => {
    expect(() => parseTargetEntries('github')).toThrow('Compilation targets must be an array');
  });

  it.each([null, '', 42, []])('should throw on malformed target entry %j', (entry) => {
    expect(() => parseTargetEntries([entry])).toThrow(
      'Target entries must be non-empty names or configuration objects'
    );
  });

  it('should parse every target from a multi-target object', () => {
    const targets = [{ github: {}, claude: {} }] as unknown as TargetEntry[];

    expect(parseTargetEntries(targets)).toEqual([
      { name: 'github', config: {} },
      { name: 'claude', config: {} },
    ]);
  });

  it('should handle mixed string and object targets', () => {
    const targets: TargetEntry[] = [
      'github',
      { claude: { enabled: false } },
      'cursor',
      { antigravity: { enabled: true } },
    ];
    const result = parseTargetEntries(targets);
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

// Import the real function — tests exercise the actual implementation
import {
  detectBuildOutputCollisions,
  detectOutputConflicts,
  isPathInsideDir,
  resolveOutputPath,
  validateOutputPath,
} from '../utils/conflict-detector.js';

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

  it('should use the custom target name when no default output exists', () => {
    const targets = [
      { name: 'custom-target' },
      { name: 'other-custom-target', config: { output: 'custom-target' } },
    ];

    const conflicts = detectOutputConflicts(targets);

    expect(conflicts.get('custom-target')).toEqual(['custom-target', 'other-custom-target']);
  });
});

describe('validateOutputPath', () => {
  it('should reject an absolute path outside the project root', () => {
    const result = validateOutputPath('/outside/generated.md', '/repo/project');

    expect(result).toBe(
      'Output path "/outside/generated.md" escapes the output directory /repo/project'
    );
  });

  it('should reject a relative path containing traversal', () => {
    const result = validateOutputPath('../generated.md', '/repo/project');

    expect(result).toBe('Output path "../generated.md" escapes the output directory /repo/project');
  });

  it('should reject traversal that only escapes after a subdirectory', () => {
    expect(validateOutputPath('nested/../../generated.md', '/repo/project')).toBeDefined();
  });

  it('should reject the output directory itself', () => {
    expect(validateOutputPath('.', '/repo/project')).toBeDefined();
  });

  it.each([
    '/repo/project/generated.md',
    'generated/output.md',
    'nested/../generated.md',
    'weird..name.md',
  ])('should accept project-local path %s', (outputPath) => {
    expect(validateOutputPath(outputPath, '/repo/project')).toBeUndefined();
  });
});

describe('isPathInsideDir', () => {
  it('should allow a directory equal to the root', () => {
    expect(isPathInsideDir('.', '/repo/project')).toBe(true);
    expect(isPathInsideDir('/repo/project', '/repo/project')).toBe(true);
  });

  it('should reject a directory outside the root', () => {
    expect(isPathInsideDir('../sibling', '/repo/project')).toBe(false);
  });
});

describe('detectBuildOutputCollisions', () => {
  it('should return only paths shared by multiple profiles', () => {
    const profiles = new Map([
      ['AGENTS.md', ['factory', 'codex']],
      ['CLAUDE.md', ['claude']],
    ]);

    expect(detectBuildOutputCollisions(profiles)).toEqual(
      new Map([['AGENTS.md', ['factory', 'codex']]])
    );
  });

  it('should return no collisions for unique profile outputs', () => {
    const profiles = new Map([
      ['AGENTS.md', ['factory']],
      ['CLAUDE.md', ['claude']],
    ]);

    expect(detectBuildOutputCollisions(profiles)).toEqual(new Map());
  });
});

describe('resolveOutputPath', () => {
  it('should preserve an absolute output path', () => {
    expect(resolveOutputPath('/repo/output/AGENTS.md', '/repo/project')).toBe(
      '/repo/output/AGENTS.md'
    );
  });

  it('should resolve a relative output path from the project root', () => {
    expect(resolveOutputPath('dist/AGENTS.md', '/repo/project')).toBe(
      '/repo/project/dist/AGENTS.md'
    );
  });
});
