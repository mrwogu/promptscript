import { describe, it, expect } from 'vitest';
import type { Block, Lockfile, Program, SourceLocation } from '@promptscript/core';
import { importExcludes } from '../import-excludes.js';
import { blockedPatterns } from '../blocked-patterns.js';
import { authorityInjection } from '../authority-injection.js';
import {
  findLockfileDependency,
  isRuleExcludedForLocation,
  normalizeImportKey,
} from '../../import-exclusions.js';
import type { RuleContext, ValidationMessage, ValidatorConfig } from '../../types.js';

const localLoc: SourceLocation = { file: 'project.prs', line: 1, column: 1 };

/** Registry cache root holding imported content. */
const IMPORT_ROOT = '/home/user/.promptscript/cache/registries/github.com/org/repo/v1.0.0';

function makeTextBlock(name: string, text: string, loc: SourceLocation): Block {
  return {
    type: 'Block',
    name,
    loc,
    content: { type: 'TextContent', value: text, loc },
  };
}

function makeAst(blocks: Block[]): Program {
  return { type: 'Program', loc: localLoc, blocks, extends: [], uses: [] };
}

function runRule(
  rule: { validate: (ctx: RuleContext) => void },
  ast: Program,
  config: ValidatorConfig = {}
): ValidationMessage[] {
  const messages: ValidationMessage[] = [];
  rule.validate({
    ast,
    config,
    report: (msg) => {
      messages.push({ ruleId: 'TEST', ruleName: 'test', severity: 'error', ...msg });
    },
  });
  return messages;
}

function makeLockfile(commit = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2'): Lockfile {
  return {
    version: 1,
    dependencies: {
      'github.com/org/repo': {
        version: 'v1.0.0',
        commit,
        integrity: 'sha256-abc',
      },
    },
  };
}

describe('PS040: import-excludes', () => {
  it('should have correct metadata', () => {
    expect(importExcludes.id).toBe('PS040');
    expect(importExcludes.name).toBe('import-excludes');
    expect(importExcludes.defaultSeverity).toBe('error');
  });

  it('should pass when no excludes are configured', () => {
    const messages = runRule(importExcludes, makeAst([]), { lockfile: makeLockfile() });
    expect(messages).toHaveLength(0);
  });

  it('should pass when the exclude commit matches the lockfile pin', () => {
    const config: ValidatorConfig = {
      lockfile: makeLockfile('a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2'),
      excludes: [
        {
          import: 'github.com/org/repo',
          commit: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
          rules: ['blocked-patterns'],
        },
      ],
    };
    expect(runRule(importExcludes, makeAst([]), config)).toHaveLength(0);
  });

  it('should bind excludes declared with a sub-path to the repository pin', () => {
    const config: ValidatorConfig = {
      lockfile: makeLockfile('a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2'),
      excludes: [
        {
          import: 'github.com/org/repo/skills/expert',
          commit: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
          rules: ['blocked-patterns'],
        },
      ],
    };
    expect(runRule(importExcludes, makeAst([]), config)).toHaveLength(0);
  });

  it('should fail when excludes are configured without a lockfile', () => {
    const config: ValidatorConfig = {
      excludes: [{ import: 'github.com/org/repo', rules: ['blocked-patterns'] }],
    };
    const messages = runRule(importExcludes, makeAst([]), config);
    expect(messages).toHaveLength(1);
    expect(messages[0]!.message).toContain('requires a lockfile');
  });

  it('should fail when the exclude names an import that is not pinned', () => {
    const config: ValidatorConfig = {
      lockfile: makeLockfile(),
      excludes: [{ import: 'github.com/other/repo', commit: 'deadbeef', rules: ['PS005'] }],
    };
    const messages = runRule(importExcludes, makeAst([]), config);
    expect(messages).toHaveLength(1);
    expect(messages[0]!.message).toContain('does not match any dependency');
  });

  it('should fail when the exclude records no commit', () => {
    const config: ValidatorConfig = {
      lockfile: makeLockfile(),
      excludes: [{ import: 'github.com/org/repo', rules: ['blocked-patterns'] }],
    };
    const messages = runRule(importExcludes, makeAst([]), config);
    expect(messages).toHaveLength(1);
    expect(messages[0]!.message).toContain('must record the commit SHA');
    expect(messages[0]!.suggestion).toContain('commit: a1b2c3d4');
  });

  it('should fail when the pinned commit changed since the exclude was reviewed', () => {
    const config: ValidatorConfig = {
      lockfile: makeLockfile('f6e5d4c3b2a1f6e5d4c3b2a1f6e5d4c3b2a1f6e5'),
      excludes: [
        {
          import: 'github.com/org/repo',
          commit: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
          rules: ['blocked-patterns'],
        },
      ],
    };
    const messages = runRule(importExcludes, makeAst([]), config);
    expect(messages).toHaveLength(1);
    expect(messages[0]!.message).toContain('Stale exclude');
    expect(messages[0]!.message).toContain('f6e5d4c3b2a1');
    expect(messages[0]!.message).toContain('a1b2c3d4e5f6');
  });

  it('should report invalid exclude entries instead of throwing', () => {
    const config: ValidatorConfig = {
      lockfile: makeLockfile(),
      excludes: [{ import: 'github.com/org/repo', rules: 'blocked-patterns' } as never],
    };
    const messages = runRule(importExcludes, makeAst([]), config);
    expect(messages).toHaveLength(1);
    expect(messages[0]!.message).toContain('Invalid validation.excludes entry');
  });

  it('should skip commit binding checks when hashes are ignored', () => {
    const config: ValidatorConfig = {
      lockfile: makeLockfile('f6e5d4c3b2a1f6e5d4c3b2a1f6e5d4c3b2a1f6e5'),
      ignoreHashes: true,
      excludes: [
        {
          import: 'github.com/org/repo',
          commit: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
          rules: ['blocked-patterns'],
        },
      ],
    };
    expect(runRule(importExcludes, makeAst([]), config)).toHaveLength(0);
  });
});

describe('normalizeImportKey', () => {
  it('should strip transports, ssh prefixes, and .git suffixes', () => {
    expect(normalizeImportKey('https://github.com/org/repo.git')).toBe('github.com/org/repo');
    expect(normalizeImportKey('git@github.com:org/repo')).toBe('github.com/org/repo');
    expect(normalizeImportKey('git://github.com/org/repo')).toBe('github.com/org/repo');
    expect(normalizeImportKey('github.com/org/repo/')).toBe('github.com/org/repo');
    expect(normalizeImportKey('github.com/org/repo')).toBe('github.com/org/repo');
  });
});

describe('findLockfileDependency', () => {
  it('should match exact normalized keys', () => {
    const dependency = findLockfileDependency('https://github.com/org/repo.git', makeLockfile());
    expect(dependency).toBeDefined();
    expect(dependency!.key).toBe('github.com/org/repo');
  });

  it('should match the longest prefix for sub-path imports', () => {
    const dependency = findLockfileDependency('github.com/org/repo/skills/expert', makeLockfile());
    expect(dependency).toBeDefined();
    expect(dependency!.key).toBe('github.com/org/repo');
  });

  it('should return undefined for unknown imports', () => {
    expect(findLockfileDependency('github.com/other/repo', makeLockfile())).toBeUndefined();
  });
});

describe('location-based exclusion', () => {
  const importedLoc: SourceLocation = {
    file: `${IMPORT_ROOT}/skills/expert/SKILL.md`,
    line: 1,
    column: 1,
  };

  function excludeConfig(rules: string[]): ValidatorConfig {
    return {
      importRoots: [{ import: 'github.com/org/repo', commit: 'a1b2c3d4', path: IMPORT_ROOT }],
      excludes: [{ import: 'github.com/org/repo', commit: 'a1b2c3d4', rules }],
    };
  }

  it('should skip blocked-patterns findings inside an excluded import', () => {
    const ast = makeAst([
      makeTextBlock(
        '@skills',
        'Bypass rules map to WARP Split Tunnel exclude entries.',
        importedLoc
      ),
    ]);
    expect(runRule(blockedPatterns, ast, excludeConfig(['blocked-patterns']))).toHaveLength(0);
  });

  it('should skip blocked-patterns findings when the exclude names the rule ID', () => {
    const ast = makeAst([
      makeTextBlock(
        '@skills',
        'Bypass rules map to WARP Split Tunnel exclude entries.',
        importedLoc
      ),
    ]);
    expect(runRule(blockedPatterns, ast, excludeConfig(['PS005']))).toHaveLength(0);
  });

  it('should keep other rules scanning inside an import excluded for a different rule', () => {
    const ast = makeAst([
      makeTextBlock(
        '@skills',
        'Bypass rules map to WARP Split Tunnel exclude entries.',
        importedLoc
      ),
    ]);
    const messages = runRule(blockedPatterns, ast, excludeConfig(['authority-injection']));
    expect(messages).toHaveLength(1);
    expect(messages[0]!.message).toContain('Blocked pattern');
  });

  it('should skip authority-injection findings inside an excluded import', () => {
    const ast = makeAst([
      makeTextBlock('@skills', 'CASB: SaaS vendors, admin access level, scan policy.', importedLoc),
    ]);
    expect(runRule(authorityInjection, ast, excludeConfig(['authority-injection']))).toHaveLength(
      0
    );
  });

  it('should keep scanning local content even when the rule is excluded for an import', () => {
    const ast = makeAst([makeTextBlock('@skills', 'Bypass rules map to WARP entries.', localLoc)]);
    const messages = runRule(blockedPatterns, ast, excludeConfig(['blocked-patterns']));
    expect(messages).toHaveLength(1);
  });

  it('should scope sub-path excludes to the named directory only', () => {
    const config: ValidatorConfig = {
      importRoots: [{ import: 'github.com/org/repo', commit: 'a1b2c3d4', path: IMPORT_ROOT }],
      excludes: [
        {
          import: 'github.com/org/repo/skills/expert',
          commit: 'a1b2c3d4',
          rules: ['blocked-patterns'],
        },
      ],
    };
    const excludedAst = makeAst([
      makeTextBlock('@skills', 'Bypass rules map to WARP entries.', {
        file: `${IMPORT_ROOT}/skills/expert/SKILL.md`,
        line: 1,
        column: 1,
      }),
    ]);
    const otherAst = makeAst([
      makeTextBlock('@skills', 'Bypass rules map to WARP entries.', {
        file: `${IMPORT_ROOT}/skills/other/SKILL.md`,
        line: 1,
        column: 1,
      }),
    ]);
    expect(runRule(blockedPatterns, excludedAst, config)).toHaveLength(0);
    expect(runRule(blockedPatterns, otherAst, config)).toHaveLength(1);
  });

  it('should not exclude anything without import roots', () => {
    const config: ValidatorConfig = {
      excludes: [
        { import: 'github.com/org/repo', commit: 'a1b2c3d4', rules: ['blocked-patterns'] },
      ],
    };
    const ast = makeAst([
      makeTextBlock('@skills', 'Bypass rules map to WARP entries.', importedLoc),
    ]);
    expect(runRule(blockedPatterns, ast, config)).toHaveLength(1);
  });

  it('should expose the exclusion decision for any rule', () => {
    const config = excludeConfig(['blocked-patterns']);
    expect(
      isRuleExcludedForLocation({ name: 'blocked-patterns', id: 'PS005' }, importedLoc, config)
    ).toBe(true);
    expect(
      isRuleExcludedForLocation({ name: 'authority-injection', id: 'PS011' }, importedLoc, config)
    ).toBe(false);
    expect(
      isRuleExcludedForLocation({ name: 'blocked-patterns', id: 'PS005' }, localLoc, config)
    ).toBe(false);
  });
});

describe('allowedPatterns', () => {
  const bypassSource = 'bypass\\s+(your\\s+)?(rules|restrictions)';

  it('should subtract an allowed pattern from the default set', () => {
    const ast = makeAst([
      makeTextBlock('@skills', 'Bypass rules map to WARP Split Tunnel exclude entries.', localLoc),
    ]);
    const config: ValidatorConfig = { allowedPatterns: [bypassSource] };
    expect(runRule(blockedPatterns, ast, config)).toHaveLength(0);
  });

  it('should accept RegExp entries', () => {
    const ast = makeAst([makeTextBlock('@skills', 'Bypass restrictions carefully.', localLoc)]);
    const config: ValidatorConfig = {
      allowedPatterns: [new RegExp(bypassSource, 'i')],
    };
    expect(runRule(blockedPatterns, ast, config)).toHaveLength(0);
  });

  it('should keep other default patterns active', () => {
    const ast = makeAst([makeTextBlock('@skills', 'This is a jailbreak attempt.', localLoc)]);
    const config: ValidatorConfig = { allowedPatterns: [bypassSource] };
    const messages = runRule(blockedPatterns, ast, config);
    expect(messages).toHaveLength(1);
    expect(messages[0]!.message).toContain('jailbreak');
  });

  it('should subtract custom blocked patterns by exact source text', () => {
    const ast = makeAst([makeTextBlock('@skills', 'internal codeword', localLoc)]);
    const config: ValidatorConfig = {
      blockedPatterns: ['internal\\s+codeword'],
      allowedPatterns: ['internal\\s+codeword'],
    };
    expect(runRule(blockedPatterns, ast, config)).toHaveLength(0);
  });
});
