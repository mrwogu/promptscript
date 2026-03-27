import { describe, it, expect } from 'vitest';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { Resolver } from '../resolver.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const FIXTURES = resolve(__dirname, '__fixtures__', 'block-filter');

function createResolver(): Resolver {
  return new Resolver({
    registryPath: resolve(__dirname, '__fixtures__', 'registry'),
    localPath: FIXTURES,
    cache: false,
  });
}

describe('@use block filtering integration', () => {
  it('should include only specified blocks with only filter', async () => {
    const resolver = createResolver();
    const result = await resolver.resolve(resolve(FIXTURES, 'project.prs'));

    expect(result.errors).toHaveLength(0);
    expect(result.ast).toBeDefined();

    const blockNames = result.ast!.blocks.map((b) => b.name);
    expect(blockNames).toContain('skills');
    expect(blockNames).toContain('context');
    expect(blockNames).not.toContain('knowledge');
  });

  it('should exclude specified blocks with exclude filter', async () => {
    const resolver = createResolver();
    const result = await resolver.resolve(resolve(FIXTURES, 'project-exclude.prs'));

    expect(result.errors).toHaveLength(0);
    expect(result.ast).toBeDefined();

    const blockNames = result.ast!.blocks.map((b) => b.name);
    expect(blockNames).toContain('skills');
    expect(blockNames).toContain('context');
    expect(blockNames).not.toContain('knowledge');
  });

  it('should not pass reserved params to bindParams', async () => {
    // source.prs has no @meta params — if only/exclude leak to bindParams,
    // it throws UnknownParamError. This verifies they're stripped.
    const resolver = createResolver();
    const result = await resolver.resolve(resolve(FIXTURES, 'project.prs'));

    expect(result.errors).toHaveLength(0);
  });

  it('should work with alias on filtered blocks', async () => {
    const resolver = createResolver();
    const result = await resolver.resolve(resolve(FIXTURES, 'project-alias.prs'));

    expect(result.errors).toHaveLength(0);
    expect(result.ast).toBeDefined();

    const blockNames = result.ast!.blocks.map((b) => b.name);
    // Should have skills (from only filter)
    expect(blockNames).toContain('skills');
    // Should NOT have knowledge or context (filtered out)
    expect(blockNames).not.toContain('knowledge');
    expect(blockNames).not.toContain('context');
    // Import markers are stripped by applyExtends after resolution
  });
});
