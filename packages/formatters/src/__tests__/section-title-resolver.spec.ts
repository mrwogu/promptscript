import { describe, expect, it } from 'vitest';
import {
  createBlockBody,
  type Block,
  type PresentationEntry,
  type Program,
  type SourceLocation,
} from '@promptscript/core';
import { resolveSectionTitle } from '../section-title-resolver.js';

const loc: SourceLocation = { file: 'titles.prs', line: 1, column: 1, offset: 0 };

function header(
  title: string,
  sectionId?: string,
  source: PresentationEntry['source'] = 'explicit'
): PresentationEntry {
  return {
    type: 'PresentationEntry',
    ...(sectionId ? { sectionId } : {}),
    title,
    source,
    loc,
    titleLoc: loc,
  };
}

function block(name: string, entries: PresentationEntry[]): Block {
  return {
    type: 'Block',
    name,
    content: { type: 'ObjectContent', properties: {}, loc },
    canonicalBody: createBlockBody(entries, loc),
    loc,
  };
}

function program(blocks: Block[]): Program {
  return {
    type: 'Program',
    blocks,
    uses: [],
    extends: [],
    loc,
  };
}

describe('resolveSectionTitle', () => {
  it('should resolve primary and derived source overrides', () => {
    const ast = program([
      block('standards', [header('Coding Rules'), header('Commit Rules', 'git-commits')]),
    ]);

    expect(resolveSectionTitle(ast, 'code-standards')).toBe('Coding Rules');
    expect(resolveSectionTitle(ast, 'git-commits')).toBe('Commit Rules');
  });

  it('should prefer source overrides over config aliases and target defaults', () => {
    const ast = program([block('standards', [header('Source Rules')])]);

    expect(
      resolveSectionTitle(ast, 'codeStandards', {
        formatterTitles: { codeStandards: 'Configured Rules' },
        defaultTitle: 'Target Rules',
      })
    ).toBe('Source Rules');
    expect(
      resolveSectionTitle(program([]), 'code-standards', {
        formatterTitles: { codeStandards: 'Configured Rules' },
        defaultTitle: 'Target Rules',
      })
    ).toBe('Configured Rules');
  });

  it('should apply owner precedence within the highest presentation rank', () => {
    const explicitFallback = program([
      block('identity', [header('Legacy Project', undefined, 'legacy')]),
      block('context', [header('Explicit Project', 'project')]),
    ]);
    const explicitOwners = program([
      block('identity', [header('Identity Project')]),
      block('context', [header('Context Project', 'project')]),
    ]);

    expect(resolveSectionTitle(explicitFallback, 'project')).toBe('Explicit Project');
    expect(resolveSectionTitle(explicitOwners, 'project')).toBe('Identity Project');
  });

  it('should preserve target and registry defaults when no override exists', () => {
    expect(resolveSectionTitle(program([]), 'restrictions', { defaultTitle: "Don'ts" })).toBe(
      "Don'ts"
    );
    expect(resolveSectionTitle(program([]), 'git-commits')).toBe('Git Commits');
    expect(resolveSectionTitle(program([]), 'unregistered', { defaultTitle: 'Fallback' })).toBe(
      'Fallback'
    );
  });
});
