import { mkdtemp, rm, writeFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Resolver } from '../resolver.js';

describe('namespaced agent imports', () => {
  let directory: string;

  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), 'promptscript-namespaced-agents-'));
  });

  afterEach(async () => {
    await rm(directory, { recursive: true, force: true });
  });

  it('qualifies agents from aliased imports while preserving unique names', async () => {
    await writeFile(
      join(directory, 'team-a.prs'),
      `
@meta { id: "team-a" syntax: "1.5.0" }
@agents {
  reviewer: {
    description: "Review team A changes"
  }
}
`
    );
    await writeFile(
      join(directory, 'team-b.prs'),
      `
@meta { id: "team-b" syntax: "1.5.0" }
@agents {
  reviewer: {
    description: "Review team B changes"
  }
}
`
    );
    const projectPath = join(directory, 'project.prs');
    await writeFile(
      projectPath,
      `
@meta { id: "project" syntax: "1.5.0" }
@use ./team-a as frontend
@use ./team-b as backend
`
    );

    const resolver = new Resolver({
      registryPath: directory,
      localPath: directory,
      cache: false,
    });
    const result = await resolver.resolve(projectPath);
    const agents = result.ast?.blocks.find((block) => block.name === 'agents');

    expect(result.errors).toEqual([]);
    expect(agents?.content).toMatchObject({
      properties: {
        'frontend.reviewer': { description: 'Review team A changes' },
        'backend.reviewer': { description: 'Review team B changes' },
      },
    });
    expect(result.ast?.agentProvenance).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'frontend.reviewer',
          namespace: 'frontend',
          action: 'qualified',
          importPath: './team-a',
        }),
        expect.objectContaining({
          name: 'backend.reviewer',
          namespace: 'backend',
          action: 'qualified',
          importPath: './team-b',
        }),
      ])
    );
  });

  it('reports conflicting unaliased agent definitions with both imports', async () => {
    await writeFile(
      join(directory, 'first.prs'),
      `
@meta { id: "first" syntax: "1.5.0" }
@agents { reviewer: { description: "First reviewer" } }
`
    );
    await writeFile(
      join(directory, 'second.prs'),
      `
@meta { id: "second" syntax: "1.5.0" }
@agents { reviewer: { description: "Second reviewer" } }
`
    );
    const projectPath = join(directory, 'project.prs');
    await writeFile(
      projectPath,
      `
@meta { id: "project" syntax: "1.5.0" }
@use ./first
@use ./second
`
    );

    const resolver = new Resolver({
      registryPath: directory,
      localPath: directory,
      cache: false,
    });
    const result = await resolver.resolve(projectPath);

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.code).toBe('PS2014');
    expect(result.errors[0]?.message).toContain('reviewer');
    expect(result.errors[0]?.message).toContain('./first');
    expect(result.errors[0]?.message).toContain('./second');
    expect(result.errors[0]?.message).toContain('Use a unique @use alias');
  });
});
