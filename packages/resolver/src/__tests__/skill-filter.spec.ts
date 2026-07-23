import { describe, it, expect } from 'vitest';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { Resolver } from '../resolver.js';
import type { ObjectContent } from '@promptscript/core';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const FIXTURES = resolve(__dirname, '__fixtures__', 'skill-filter');

function createResolver(): Resolver {
  return new Resolver({
    registryPath: resolve(__dirname, '__fixtures__', 'registry'),
    localPath: FIXTURES,
    cache: false,
  });
}

function getSkillNames(ast: {
  blocks: Array<{ name: string; content: { type: string } }>;
}): string[] {
  const skillsBlock = ast.blocks.find((b) => b.name === 'skills');
  if (!skillsBlock || skillsBlock.content.type !== 'ObjectContent') {
    return [];
  }
  return Object.keys((skillsBlock.content as ObjectContent).properties);
}

describe('@use skill filtering integration', () => {
  it('should include only specified skills with includes filter', async () => {
    const resolver = createResolver();
    const result = await resolver.resolve(resolve(FIXTURES, 'project-includes.prs'));

    expect(result.errors).toHaveLength(0);
    expect(result.ast).toBeDefined();

    const skillNames = getSkillNames(result.ast!);
    expect(skillNames).toContain('alpha');
    expect(skillNames).toContain('gamma');
    expect(skillNames).not.toContain('beta');
  });

  it('should exclude specified skills with excludes filter', async () => {
    const resolver = createResolver();
    const result = await resolver.resolve(resolve(FIXTURES, 'project-excludes.prs'));

    expect(result.errors).toHaveLength(0);
    expect(result.ast).toBeDefined();

    const skillNames = getSkillNames(result.ast!);
    expect(skillNames).toContain('alpha');
    expect(skillNames).toContain('gamma');
    expect(skillNames).not.toContain('beta');
  });

  it('should not pass reserved params to bindParams', async () => {
    // source.prs has no @meta params — if includes/excludes leak to
    // bindParams, it throws UnknownParamError.
    const resolver = createResolver();
    const result = await resolver.resolve(resolve(FIXTURES, 'project-includes.prs'));

    expect(result.errors).toHaveLength(0);
  });

  it('should work combined with block-level only filter', async () => {
    const resolver = createResolver();
    const result = await resolver.resolve(resolve(FIXTURES, 'project-combined.prs'));

    expect(result.errors).toHaveLength(0);
    expect(result.ast).toBeDefined();

    // only: ["skills"] should keep only the skills block
    const blockNames = result.ast!.blocks.map((b) => b.name);
    expect(blockNames).toContain('skills');
    // No meta block in output (meta is separate from blocks)
    // source only has skills block, so only filter is redundant but harmless

    // includes: ["alpha"] should keep only alpha skill
    const skillNames = getSkillNames(result.ast!);
    expect(skillNames).toEqual(['alpha']);
  });
});
