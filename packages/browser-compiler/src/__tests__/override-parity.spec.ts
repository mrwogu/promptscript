import { describe, expect, it } from 'vitest';
import { compile } from '../index.js';
import { BrowserResolver } from '../resolver.js';
import { VirtualFileSystem } from '../virtual-fs.js';

describe('explicit override browser parity regressions', () => {
  it('compiles ordered replacements into formatter output', async () => {
    const files = {
      'project.prs': `@meta { id: "parity" syntax: "1.5.0" }
@inherit ./parent
@use ./shared as shared
@override context.runtime { "bun" }
@override shared.standards.testing { ["Use Vitest"] }
@extend standards {
  testing: ["Require coverage"]
  linting!: ["Use ESLint"]
}
`,
      'parent.prs': `@meta { id: "parent" syntax: "1.5.0" }
@context { runtime: "node" }
`,
      'shared.prs': `@meta { id: "shared" syntax: "1.5.0" }
@standards {
  testing: ["Use Jest"]
  linting: ["Use Biome"]
}
`,
    };

    const result = await compile(files, 'project.prs', {
      projectRoot: '.',
      formatters: [{ name: 'claude', config: { version: 'full' } }],
    });

    expect(result.errors).toEqual([]);
    expect(result.outputs.get('CLAUDE.md')?.content).toContain('bun');
    expect(result.outputs.get('CLAUDE.md')?.content).toContain('Use Vitest');
    expect(result.outputs.get('CLAUDE.md')?.content).toContain('Require coverage');
    expect(result.outputs.get('CLAUDE.md')?.content).toContain('Use ESLint');
    expect(result.outputs.get('CLAUDE.md')?.content).not.toContain('Use Jest');
    expect(result.outputs.get('CLAUDE.md')?.content).not.toContain('Use Biome');
  });

  it('lets later inherit operations replace earlier block values', async () => {
    const resolver = new BrowserResolver({
      fs: new VirtualFileSystem({
        'project.prs': `@meta { id: "sequential-inherit" syntax: "1.5.0" }
@context { runtime: "local" localOnly: true }
@inherit ./parent
`,
        'parent.prs': `@meta { id: "parent" syntax: "1.5.0" }
@context { runtime: "parent" parentOnly: true }
`,
      }),
    });

    const result = await resolver.resolve('project.prs');
    const context = result.ast?.blocks.find((block) => block.name === 'context');

    expect(result.errors).toEqual([]);
    expect(context?.content).toMatchObject({
      properties: { runtime: 'parent', localOnly: true, parentOnly: true },
    });
  });

  it('uses ordered semantics from an imported 1.5 source for a lower root', async () => {
    const resolver = new BrowserResolver({
      fs: new VirtualFileSystem({
        'project.prs': `@meta { id: "lower-root" syntax: "1.4.0" }
@use ./ordered-source
@standards { testing: "Local value" }
`,
        'ordered-source.prs': `@meta { id: "ordered-source" syntax: "1.5.0" }
@standards { testing: "Imported value" }
`,
      }),
    });

    const result = await resolver.resolve('project.prs');
    const standards = result.ast?.blocks.find((block) => block.name === 'standards');

    expect(result.errors).toEqual([]);
    expect(standards?.content).toMatchObject({
      properties: { testing: 'Local value' },
    });
  });

  it('uses ordered semantics from an inherited 1.5 source with override', async () => {
    const resolver = new BrowserResolver({
      fs: new VirtualFileSystem({
        'project.prs': `@meta { id: "lower-root" syntax: "1.4.0" }
@standards { testing: "Local value" }
@inherit ./ordered-parent
`,
        'ordered-parent.prs': `@meta { id: "ordered-parent" syntax: "1.5.0" }
@standards { testing: "Inherited value" }
@override standards.testing { "Parent replacement" }
`,
      }),
    });

    const result = await resolver.resolve('project.prs');
    const standards = result.ast?.blocks.find((block) => block.name === 'standards');

    expect(result.errors).toEqual([]);
    expect(standards?.content).toMatchObject({
      properties: { testing: 'Parent replacement' },
    });
  });

  it('reports semantic errors at the override directive', async () => {
    const resolver = new BrowserResolver({
      fs: new VirtualFileSystem({
        'project.prs': `@meta { id: "invalid-parity" syntax: "1.5.0" }
@standards { testing: { runner: "jest" } }
@override standards.testing.runner.name { "vitest" }
`,
      }),
    });

    const result = await resolver.resolve('project.prs');

    expect(result.errors).toEqual([
      expect.objectContaining({
        message: expect.stringContaining('non-object segment "name"'),
        location: expect.objectContaining({ file: 'project.prs', line: 3, column: 1 }),
      }),
    ]);
  });

  it('preserves duplicate skill errors before later overrides', async () => {
    const resolver = new BrowserResolver({
      fs: new VirtualFileSystem({
        'project.prs': `@meta { id: "duplicate-skill" syntax: "1.5.0" }
@skills { review: { description: "Local" content: "Local review" } }
@use ./shared
@override skills.review.description { "Updated local review" }
`,
        'shared.prs': `@meta { id: "shared" syntax: "1.5.0" }
@skills { review: { description: "Imported" content: "Imported review" } }
`,
      }),
    });

    const result = await resolver.resolve('project.prs');
    const skills = result.ast?.blocks.find((block) => block.name === 'skills');

    expect(result.errors).toEqual([
      expect.objectContaining({
        message: expect.stringContaining('Duplicate skill name(s) detected'),
      }),
    ]);
    expect(skills?.content).toMatchObject({
      properties: { review: { description: 'Updated local review', content: 'Local review' } },
    });
  });

  it('preserves imported skill output directories through overrides', async () => {
    const resolver = new BrowserResolver({
      fs: new VirtualFileSystem({
        'project.prs': `@meta { id: "output-dir" syntax: "1.5.0" }
@use ./shared as shared into "skills/team"
@override shared.skills.review.description { "Updated review" }
`,
        'shared.prs': `@meta { id: "shared" syntax: "1.5.0" }
@skills { review: { description: "Imported" content: "Imported review" } }
`,
      }),
    });

    const result = await resolver.resolve('project.prs');
    const skills = result.ast?.blocks.find((block) => block.name === 'skills');

    expect(result.errors).toEqual([]);
    expect(skills?.content).toMatchObject({
      properties: {
        review: {
          description: 'Updated review',
          content: 'Imported review',
          __outputDir: 'skills/team',
        },
      },
    });
  });

  it('applies later overrides after inline composition', async () => {
    const resolver = new BrowserResolver({
      fs: new VirtualFileSystem({
        'project.prs': `@meta { id: "composition" syntax: "1.5.0" }
@skills {
  workflow: { description: "Workflow" content: "Parent workflow" }
  @use ./phase
}
@override skills.workflow.content { "Final workflow" }
`,
        'phase.prs': `@meta { id: "phase" syntax: "1.5.0" }
@skills { phase: { description: "Phase" content: "Run phase" } }
`,
      }),
    });

    const result = await resolver.resolve('project.prs');
    const skills = result.ast?.blocks.find((block) => block.name === 'skills');

    expect(result.errors).toEqual([]);
    expect(skills?.content).toMatchObject({
      properties: {
        workflow: {
          content: 'Final workflow',
          __composedFrom: [expect.objectContaining({ name: 'phase' })],
        },
      },
    });
  });

  it('does not retry failed inline composition after later operations', async () => {
    const resolver = new BrowserResolver({
      fs: new VirtualFileSystem({
        'project.prs': `@meta { id: "failed-composition" syntax: "1.5.0" }
@skills {
  workflow: { description: "Workflow" content: "Parent workflow" }
  @use ./missing
}
@standards { testing: ["Use Vitest"] }
@override standards.testing { ["Use browser tests"] }
`,
      }),
    });

    const result = await resolver.resolve('project.prs');
    const skills = result.ast?.blocks.find((block) => block.name === 'skills');

    expect(result.errors).toHaveLength(2);
    expect(result.errors.map((error) => error.message).join(' ')).toContain('missing');
    expect((skills?.content as { inlineUses?: unknown }).inlineUses).toBeUndefined();
  });

  it('normalizes unexpected ordered extension failures', async () => {
    const resolver = new BrowserResolver({
      fs: new VirtualFileSystem({
        'project.prs': `@meta { id: "extension-error" syntax: "1.5.0" }
@extend missing { enabled: true }
`,
      }),
    });
    (
      resolver as unknown as {
        applyExtend: () => never;
      }
    ).applyExtend = () => {
      throw new Error('unexpected failure');
    };

    const result = await resolver.resolve('project.prs');

    expect(result.errors).toEqual([
      expect.objectContaining({
        message: 'Extension resolution failed: unexpected failure',
      }),
    ]);
  });
});
