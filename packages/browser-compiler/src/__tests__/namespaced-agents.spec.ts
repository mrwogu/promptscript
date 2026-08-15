import { describe, expect, it } from 'vitest';
import { BrowserResolver, type ResolvedAST } from '../resolver.js';
import { VirtualFileSystem } from '../virtual-fs.js';

describe('BrowserResolver namespaced agents', () => {
  it('resolves qualified imports and applies aliased agent overrides', async () => {
    const fs = new VirtualFileSystem({
      'project.prs': `@meta { id: "project" syntax: "1.5.0" }
@use ./team as frontend
@override frontend.agents.reviewer.description { "Updated frontend reviewer" }
`,
      'team.prs': `@meta { id: "team" syntax: "1.5.0" }
@agents { reviewer: { description: "Team reviewer" } }
`,
    });
    const resolver = new BrowserResolver({ fs });

    const result = await resolver.resolve('project.prs');
    const agents = result.ast?.blocks.find((block) => block.name === 'agents');

    expect(result.errors).toEqual([]);
    expect(agents?.content).toMatchObject({
      properties: {
        'frontend.reviewer': { description: 'Updated frontend reviewer' },
      },
    });
    expect(result.ast?.agentProvenance).toEqual([
      expect.objectContaining({
        name: 'frontend.reviewer',
        namespace: 'frontend',
        action: 'qualified',
        importPath: './team',
      }),
    ]);
  });

  it('resolves direct qualified agent overrides', async () => {
    const fs = new VirtualFileSystem({
      'project.prs': `@meta { id: "project" syntax: "1.5.0" }
@agents { "team.reviewer": { description: "Original reviewer" } }
@override agents.team.reviewer { { description: "Updated reviewer" } }
`,
    });

    const resolver = new BrowserResolver({ fs });
    const result = await resolver.resolve('project.prs');
    const agents = result.ast?.blocks.find((block) => block.name === 'agents');

    expect(result.errors).toEqual([]);
    expect(agents?.content).toMatchObject({
      properties: {
        'team.reviewer': { description: 'Updated reviewer' },
      },
    });
  });

  it('resolves overrides on multi-segment namespaced agents', async () => {
    const fs = new VirtualFileSystem({
      'project.prs': `@meta { id: "project" syntax: "1.5.0" }
@use ./team as outer
@override outer.agents.inner.reviewer.description { "Updated reviewer" }
`,
      'team.prs': `@meta { id: "team" syntax: "1.5.0" }
@agents { "inner.reviewer": { description: "Original reviewer" } }
`,
    });

    const resolver = new BrowserResolver({ fs });
    const result = await resolver.resolve('project.prs');
    const agents = result.ast?.blocks.find((block) => block.name === 'agents');

    expect(result.errors).toEqual([]);
    expect(agents?.content).toMatchObject({
      properties: {
        'outer.inner.reviewer': { description: 'Updated reviewer' },
      },
    });
  });

  it('extends direct and aliased qualified agents', async () => {
    const fs = new VirtualFileSystem({
      'project.prs': `@meta { id: "project" syntax: "1.5.0" }
@use ./team as frontend
@agents { "local.reviewer": { description: "Local reviewer" } }
@extend agents.local.reviewer { description: "Updated local reviewer" }
@extend frontend.agents.reviewer { description: "Updated frontend reviewer" }
`,
      'team.prs': `@meta { id: "team" syntax: "1.5.0" }
@agents { reviewer: { description: "Team reviewer" } }
`,
    });
    const resolver = new BrowserResolver({ fs });

    const result = await resolver.resolve('project.prs');
    const agents = result.ast?.blocks.find((block) => block.name === 'agents');

    expect(result.errors).toEqual([]);
    expect(agents?.content).toMatchObject({
      properties: {
        'local.reviewer': { description: 'Updated local reviewer' },
        'frontend.reviewer': { description: 'Updated frontend reviewer' },
      },
    });
  });

  it('extends multi-segment namespaced agents', async () => {
    const fs = new VirtualFileSystem({
      'project.prs': `@meta { id: "project" syntax: "1.5.0" }
@use ./team as outer
@extend outer.agents.inner.reviewer { description: "Updated reviewer" }
`,
      'team.prs': `@meta { id: "team" syntax: "1.5.0" }
@agents { "inner.reviewer": { description: "Original reviewer" } }
`,
    });

    const resolver = new BrowserResolver({ fs });
    const result = await resolver.resolve('project.prs');
    const agents = result.ast?.blocks.find((block) => block.name === 'agents');

    expect(result.errors).toEqual([]);
    expect(agents?.content).toMatchObject({
      properties: {
        'outer.inner.reviewer': { description: 'Updated reviewer' },
      },
    });
  });

  it('reports conflicting unaliased imports and preserves the browser AST', async () => {
    const fs = new VirtualFileSystem({
      'project.prs': `@meta { id: "project" syntax: "1.5.0" }
@use ./first
@use ./second
`,
      'first.prs': `@meta { id: "first" syntax: "1.5.0" }
@agents { reviewer: { description: "First reviewer" } }
`,
      'second.prs': `@meta { id: "second" syntax: "1.5.0" }
@agents { reviewer: { description: "Second reviewer" } }
`,
    });
    const resolver = new BrowserResolver({ fs });

    const result = await resolver.resolve('project.prs');

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.code).toBe('PS2014');
    expect(result.errors[0]?.message).toContain('./first');
    expect(result.errors[0]?.message).toContain('./second');
    expect(result.ast?.blocks.find((block) => block.name === 'agents')).toMatchObject({
      content: {
        properties: {
          reviewer: { description: 'First reviewer' },
        },
      },
    });
  });

  it('reports conflicting inherited agents and keeps child definitions', async () => {
    const fs = new VirtualFileSystem({
      'project.prs': `@meta { id: "project" syntax: "1.5.0" }
@agents { reviewer: { description: "Child reviewer" } }
@inherit ./parent
`,
      'parent.prs': `@meta { id: "parent" syntax: "1.5.0" }
@agents { reviewer: { description: "Parent reviewer" } }
`,
    });
    const resolver = new BrowserResolver({ fs });

    const result = await resolver.resolve('project.prs');

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.code).toBe('PS2014');
    expect(result.ast?.blocks.find((block) => block.name === 'agents')).toMatchObject({
      content: {
        properties: {
          reviewer: { description: 'Child reviewer' },
        },
      },
    });
  });

  it('retains parent and child agent provenance during inheritance', async () => {
    const fs = new VirtualFileSystem({
      'project.prs': `@meta { id: "project" syntax: "1.5.0" }
@inherit ./parent
@agents { planner: { description: "Child planner" } }
`,
      'parent.prs': `@meta { id: "parent" syntax: "1.5.0" }
@agents { reviewer: { description: "Parent reviewer" } }
`,
    });
    const resolver = new BrowserResolver({ fs });

    const result = await resolver.resolve('project.prs');

    expect(result.errors).toEqual([]);
    expect(result.ast?.agentProvenance).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'reviewer', action: 'local' }),
        expect.objectContaining({ name: 'planner', action: 'local' }),
      ])
    );
  });

  it('retains parent provenance when child declares no agents', async () => {
    const fs = new VirtualFileSystem({
      'project.prs': `@meta { id: "project" syntax: "1.5.0" }
@inherit ./parent
`,
      'parent.prs': `@meta { id: "parent" syntax: "1.5.0" }
@agents { reviewer: { description: "Parent reviewer" } }
`,
    });
    const resolver = new BrowserResolver({ fs });

    const result = await resolver.resolve('project.prs');

    expect(result.errors).toEqual([]);
    expect(result.ast?.agentProvenance).toEqual([
      expect.objectContaining({ name: 'reviewer', action: 'local' }),
    ]);
  });

  it('retains child provenance when parent declares no agents', async () => {
    const fs = new VirtualFileSystem({
      'project.prs': `@meta { id: "project" syntax: "1.5.0" }
@inherit ./parent
@agents { planner: { description: "Child planner" } }
`,
      'parent.prs': '@meta { id: "parent" syntax: "1.5.0" }',
    });
    const resolver = new BrowserResolver({ fs });

    const result = await resolver.resolve('project.prs');

    expect(result.errors).toEqual([]);
    expect(result.ast?.agentProvenance).toEqual([
      expect.objectContaining({ name: 'planner', action: 'local' }),
    ]);
  });

  it('normalizes unexpected inheritance errors', async () => {
    class ThrowingResolver extends BrowserResolver {
      override async resolve(entryPath: string): Promise<ResolvedAST> {
        if (entryPath === 'parent.prs') {
          throw new Error('synthetic parent failure');
        }
        return super.resolve(entryPath);
      }
    }

    const fs = new VirtualFileSystem({
      'project.prs': `@meta { id: "project" syntax: "1.5.0" }
@inherit ./parent
`,
    });
    const resolver = new ThrowingResolver({ fs });

    const result = await resolver.resolve('project.prs');

    expect(result.ast).not.toBeNull();
    expect(result.errors).toEqual([
      expect.objectContaining({
        message: 'Failed to resolve parent: synthetic parent failure',
      }),
    ]);
  });
});
