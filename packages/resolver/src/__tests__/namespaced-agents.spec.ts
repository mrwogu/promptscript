import { mkdtemp, rm, writeFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createNativeAgentNameMap } from '@promptscript/core';
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

  it('keeps case-different import namespaces distinct for native output', async () => {
    await writeFile(
      join(directory, 'team-a.prs'),
      `
@meta { id: "team-a" syntax: "1.5.0" }
@agents { reviewer: { description: "Uppercase namespace reviewer" } }
`
    );
    await writeFile(
      join(directory, 'team-b.prs'),
      `
@meta { id: "team-b" syntax: "1.5.0" }
@agents { reviewer: { description: "Lowercase namespace reviewer" } }
`
    );
    const projectPath = join(directory, 'project.prs');
    await writeFile(
      projectPath,
      `
@meta { id: "project" syntax: "1.5.0" }
@use ./team-a as Team
@use ./team-b as team
`
    );

    const resolver = new Resolver({
      registryPath: directory,
      localPath: directory,
      cache: false,
    });
    const result = await resolver.resolve(projectPath);
    const agents = result.ast?.blocks.find((block) => block.name === 'agents');
    const names =
      agents?.content.type === 'ObjectContent' ? Object.keys(agents.content.properties) : [];
    const nativeNames = createNativeAgentNameMap(names);

    expect(result.errors).toEqual([]);
    expect(names).toEqual(expect.arrayContaining(['Team.reviewer', 'team.reviewer']));
    expect(names).toHaveLength(2);
    expect(nativeNames.get('Team.reviewer')).toBe('Team-reviewer');
    expect(nativeNames.get('team.reviewer')).toBe('team-reviewer-2');
    expect(new Set(nativeNames.values())).toHaveLength(2);
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

  it('reports conflicting inherited agent definitions without aborting resolution', async () => {
    await writeFile(
      join(directory, 'parent.prs'),
      `
@meta { id: "parent" syntax: "1.5.0" }
@agents { reviewer: { description: "Parent reviewer" } }
`
    );
    const projectPath = join(directory, 'project.prs');
    await writeFile(
      projectPath,
      `
@meta { id: "project" syntax: "1.5.0" }
@agents { reviewer: { description: "Child reviewer" } }
@inherit ./parent
`
    );

    const resolver = new Resolver({
      registryPath: directory,
      localPath: directory,
      cache: false,
    });
    const result = await resolver.resolve(projectPath);
    const agents = result.ast?.blocks.find((block) => block.name === 'agents');

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.code).toBe('PS2014');
    expect(agents?.content).toMatchObject({
      properties: {
        reviewer: { description: 'Child reviewer' },
      },
    });
  });
});
