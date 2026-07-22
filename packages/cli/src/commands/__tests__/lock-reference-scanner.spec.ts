import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { collectRegistryReferences } from '../lock-reference-scanner.js';
import type { Program, SourceLocation, Block, Value } from '@promptscript/core';
import { buildReferenceKey } from '@promptscript/resolver';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const loc: SourceLocation = { file: 'test.prs', line: 1, column: 1 };

function makeSkillsBlock(
  skills: Record<string, { references?: string[] }>,
  sourceFile: string = loc.file
): Block {
  const properties: Record<string, Value> = {};
  for (const [name, skill] of Object.entries(skills)) {
    properties[name] = {
      description: `${name} skill`,
      ...(skill.references ? { references: skill.references } : {}),
    };
  }
  return {
    type: 'Block',
    name: 'skills',
    loc: { ...loc, file: sourceFile },
    content: { type: 'ObjectContent', properties, loc: { ...loc, file: sourceFile } },
  };
}

function makeAst(blocks: Block[] = []): Program {
  return {
    type: 'Program',
    loc,
    meta: { type: 'MetaBlock', loc, fields: { id: 'test', version: '1.0.0' } },
    uses: [],
    blocks,
    extends: [],
  };
}

describe('collectRegistryReferences', () => {
  let cachePath: string;
  let sourceFile: string;
  const repoUrl = 'https://github.com/org/repo';
  const version = 'v1.0.0';

  beforeEach(() => {
    cachePath = mkdtempSync(join(tmpdir(), 'prs-lock-refs-'));
    sourceFile = join(cachePath, 'rules', 'main.prs');
    mkdirSync(join(cachePath, 'rules', 'references'), { recursive: true });
    writeFileSync(sourceFile, 'source');
  });

  afterEach(() => {
    rmSync(cachePath, { recursive: true, force: true });
  });

  function roots(): Array<{ repoUrl: string; version: string; cachePath: string }> {
    return [{ repoUrl, version, cachePath }];
  }

  it('should return an empty object when no skills blocks exist', async () => {
    const result = await collectRegistryReferences(makeAst(), roots());
    expect(result).toEqual({});
  });

  it('should return an empty object when skills have no references', async () => {
    const ast = makeAst([makeSkillsBlock({ mySkill: {} })]);
    const result = await collectRegistryReferences(ast, roots());
    expect(result).toEqual({});
  });

  it('should hash references relative to their registry source file', async () => {
    const referencePath = join(cachePath, 'rules', 'references', 'guide.md');
    writeFileSync(referencePath, 'guide');
    const ast = makeAst([
      makeSkillsBlock(
        {
          mySkill: { references: ['./references/guide.md', '../../../local.md'] },
        },
        sourceFile
      ),
    ]);

    const result = await collectRegistryReferences(ast, roots(), {}, '2026-01-01T00:00:00.000Z');
    const key = buildReferenceKey(repoUrl, 'rules/references/guide.md', version);

    expect(Object.keys(result)).toEqual([key]);
    expect(result[key]).toEqual({
      hash: expect.stringMatching(/^sha256-[0-9a-f]{64}$/),
      lockedAt: '2026-01-01T00:00:00.000Z',
    });
  });

  it('should deduplicate references', async () => {
    const refPath = join(cachePath, 'rules', 'references', 'guide.md');
    writeFileSync(refPath, 'guide');
    const ast = makeAst([
      makeSkillsBlock(
        {
          skillA: { references: [refPath] },
          skillB: { references: [refPath] },
        },
        sourceFile
      ),
    ]);

    const result = await collectRegistryReferences(ast, roots());

    expect(Object.keys(result)).toHaveLength(1);
  });

  it('should preserve lockedAt when the hash is unchanged', async () => {
    const refPath = join(cachePath, 'rules', 'references', 'guide.md');
    writeFileSync(refPath, 'guide');
    const ast = makeAst([makeSkillsBlock({ mySkill: { references: [refPath] } }, sourceFile)]);
    const first = await collectRegistryReferences(ast, roots(), {}, '2026-01-01T00:00:00.000Z');

    const second = await collectRegistryReferences(ast, roots(), first, '2026-02-01T00:00:00.000Z');

    expect(second).toEqual(first);
  });

  it('should skip non-string reference entries', async () => {
    const refPath = join(cachePath, 'references', 'guide.md');
    mkdirSync(join(cachePath, 'references'), { recursive: true });
    writeFileSync(refPath, 'guide');
    const block: Block = {
      type: 'Block',
      name: 'skills',
      loc: { ...loc, file: sourceFile },
      content: {
        type: 'ObjectContent',
        properties: {
          mySkill: { description: 'test', references: [123, null, refPath] } as Value,
        },
        loc: { ...loc, file: sourceFile },
      },
    };
    const ast = makeAst([block]);

    const result = await collectRegistryReferences(ast, roots());

    expect(Object.keys(result)).toHaveLength(1);
  });

  it('should reject missing or escaping registry references', async () => {
    const ast = makeAst([
      makeSkillsBlock({ mySkill: { references: ['./references/missing.md'] } }, sourceFile),
    ]);

    await expect(collectRegistryReferences(ast, roots())).rejects.toThrow(
      'missing or escapes its repository'
    );
  });

  it('should skip non-skills blocks', async () => {
    const ast = makeAst([
      {
        type: 'Block',
        name: 'identity',
        loc,
        content: { type: 'TextContent', value: 'test', loc },
      },
    ]);

    const result = await collectRegistryReferences(ast, roots());

    expect(result).toEqual({});
  });
});
