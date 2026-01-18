import { describe, it, expect } from 'vitest';
import type { TargetEntry, TargetConfig } from '@promptscript/core';

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
