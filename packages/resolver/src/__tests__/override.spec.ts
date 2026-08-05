import { afterEach, describe, expect, it } from 'vitest';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  SYNTAX_FEATURES,
  type Block,
  type Logger,
  type ObjectContent,
  type Value,
} from '@promptscript/core';
import { Resolver } from '../resolver.js';

const testDirectories: string[] = [];

async function createProject(source: string, files: Record<string, string> = {}): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'prs-override-'));
  testDirectories.push(directory);
  await writeFile(join(directory, 'project.prs'), source);
  await Promise.all(
    Object.entries(files).map(([name, content]) => writeFile(join(directory, name), content))
  );
  return directory;
}

function properties(blocks: Block[], name: string): Record<string, Value> {
  const block = blocks.find((candidate) => candidate.name === name);
  if (block?.content.type !== 'ObjectContent') {
    throw new Error(`Expected @${name} object content`);
  }
  return (block.content as ObjectContent).properties;
}

afterEach(async () => {
  await Promise.all(
    testDirectories.splice(0).map((directory) => rm(directory, { recursive: true }))
  );
});

describe('explicit override resolution', () => {
  it('replaces nested values and lets later extensions merge the replacement', async () => {
    const directory = await createProject(`
      @meta { id: "ordered" syntax: "1.5.0" }
      @standards {
        testing: ["Use Jest"]
        linting: ["Use Biome"]
        config: { runner: "jest" coverage: 80 }
      }
      @override standards.testing { ["Use Vitest"] }
      @extend standards {
        testing: ["Require coverage"]
        linting!: ["Use ESLint"]
      }
      @override standards.config.runner { "vitest" }
    `);
    const resolver = new Resolver({
      registryPath: directory,
      localPath: directory,
      cache: false,
    });

    const result = await resolver.resolve(join(directory, 'project.prs'));
    const standards = properties(result.ast?.blocks ?? [], 'standards');

    expect(result.errors).toEqual([]);
    expect(standards['testing']).toEqual(['Use Vitest', 'Require coverage']);
    expect(standards['linting']).toEqual(['Use ESLint']);
    expect(standards['config']).toEqual({ runner: 'vitest', coverage: 80 });
    expect(result.ast?.overrides).toEqual([]);
    expect(result.ast?.extends).toEqual([]);
  });

  it('replaces inherited and aliased imported targets', async () => {
    const directory = await createProject(
      `
        @meta { id: "child" syntax: "1.5.0" }
        @inherit ./parent
        @use ./shared as shared
        @override context.runtime { "bun" }
        @override shared.standards.testing { ["Use Vitest"] }
      `,
      {
        'parent.prs': `
          @meta { id: "parent" syntax: "1.5.0" }
          @context { runtime: "node" }
        `,
        'shared.prs': `
          @meta { id: "shared" syntax: "1.5.0" }
          @standards { testing: ["Use Jest"] }
        `,
      }
    );
    const resolver = new Resolver({
      registryPath: directory,
      localPath: directory,
      cache: false,
    });

    const result = await resolver.resolve(join(directory, 'project.prs'));

    expect(result.errors).toEqual([]);
    expect(properties(result.ast?.blocks ?? [], 'context')['runtime']).toBe('bun');
    expect(properties(result.ast?.blocks ?? [], 'standards')['testing']).toEqual(['Use Vitest']);
    expect(result.ast?.blocks.some((block) => block.name.startsWith('__import__'))).toBe(false);
  });

  it('uses declaration order when override syntax enables sequential operations', async () => {
    const directory = await createProject(`
      @meta { id: "sequential" syntax: "1.5.0" }
      @standards { testing: ["First"] }
      @override standards.testing { ["Second"] }
      @standards { linting: ["Keep duplicate layer"] }
    `);
    const resolver = new Resolver({
      registryPath: directory,
      localPath: directory,
      cache: false,
    });

    const result = await resolver.resolve(join(directory, 'project.prs'));

    expect(result.errors).toEqual([]);
    expect(result.ast?.blocks).toHaveLength(2);
    expect(properties(result.ast?.blocks ?? [], 'standards')['testing']).toEqual(['Second']);
  });

  it('lets later inherit operations replace earlier block values', async () => {
    const directory = await createProject(
      `
        @meta { id: "sequential-inherit" syntax: "1.5.0" }
        @context { runtime: "local" localOnly: true }
        @inherit ./parent
      `,
      {
        'parent.prs': `
          @meta { id: "parent" syntax: "1.5.0" }
          @context { runtime: "parent" parentOnly: true }
        `,
      }
    );
    const resolver = new Resolver({
      registryPath: directory,
      localPath: directory,
      cache: false,
    });

    const result = await resolver.resolve(join(directory, 'project.prs'));

    expect(result.errors).toEqual([]);
    expect(properties(result.ast?.blocks ?? [], 'context')).toEqual({
      runtime: 'parent',
      localOnly: true,
      parentOnly: true,
    });
  });

  it('imports skills whose names collide with object prototypes', async () => {
    const directory = await createProject(
      `
        @meta { id: "prototype-skill" syntax: "1.5.0" }
        @skills { review: { description: "Review" content: "Review code" } }
        @use ./shared
      `,
      {
        'shared.prs': `
          @meta { id: "shared" syntax: "1.5.0" }
          @skills {
            toString: { description: "Stringify" content: "Stringify output" }
          }
        `,
      }
    );
    const resolver = new Resolver({
      registryPath: directory,
      localPath: directory,
      cache: false,
    });

    const result = await resolver.resolve(join(directory, 'project.prs'));

    expect(result.errors).toEqual([]);
    expect(Object.hasOwn(properties(result.ast?.blocks ?? [], 'skills'), 'toString')).toBe(true);
  });

  it('keeps block aliases in declaration order', async () => {
    const directory = await createProject(`
      @meta { id: "alias-order" syntax: "1.5.0" }
      @shortcuts { test: { description: "Old" } }
      @override shortcuts.test { { description: "New" } }
      @commands { build: { description: "Build" } }
    `);
    const resolver = new Resolver({
      registryPath: directory,
      localPath: directory,
      cache: false,
    });

    const result = await resolver.resolve(join(directory, 'project.prs'));

    expect(result.errors).toEqual([]);
    expect(result.ast?.blocks.map((block) => block.name)).toEqual(['shortcuts', 'shortcuts']);
    expect(properties(result.ast?.blocks ?? [], 'shortcuts')['test']).toEqual({
      description: 'New',
    });
  });

  it('does not let later import aliases reinterpret earlier override targets', async () => {
    const directory = await createProject(
      `
        @meta { id: "future-alias" syntax: "1.5.0" }
        @commands { test: { description: "Old" } }
        @override commands.test { { description: "New" } }
        @use ./shared as commands
      `,
      {
        'shared.prs': `
          @meta { id: "shared" syntax: "1.5.0" }
          @standards { testing: ["Use Vitest"] }
        `,
      }
    );
    const resolver = new Resolver({
      registryPath: directory,
      localPath: directory,
      cache: false,
    });

    const result = await resolver.resolve(join(directory, 'project.prs'));

    expect(result.errors).toEqual([]);
    expect(properties(result.ast?.blocks ?? [], 'shortcuts')['test']).toEqual({
      description: 'New',
    });
  });

  it('keeps legacy phase order before syntax 1.5.0 without overrides', async () => {
    const legacyDirectory = await createProject(`
      @meta { id: "legacy" syntax: "1.4.0" }
      @extend standards { testing: ["Extended first"] }
      @standards { testing: ["Declared later"] }
    `);
    const sequentialDirectory = await createProject(`
      @meta { id: "sequential" syntax: "1.5.0" }
      @extend standards { testing: ["Ignored before target"] }
      @standards { testing: ["Declared later"] }
    `);
    const legacyResolver = new Resolver({
      registryPath: legacyDirectory,
      localPath: legacyDirectory,
      cache: false,
    });
    const sequentialResolver = new Resolver({
      registryPath: sequentialDirectory,
      localPath: sequentialDirectory,
      cache: false,
    });

    const legacy = await legacyResolver.resolve(join(legacyDirectory, 'project.prs'));
    const sequential = await sequentialResolver.resolve(join(sequentialDirectory, 'project.prs'));

    expect(legacy.errors).toEqual([]);
    expect(properties(legacy.ast?.blocks ?? [], 'standards')['testing']).toEqual([
      'Declared later',
      'Extended first',
    ]);
    expect(sequential.errors).toEqual([]);
    expect(properties(sequential.ast?.blocks ?? [], 'standards')['testing']).toEqual([
      'Declared later',
    ]);
  });

  it('requires imports to precede overrides', async () => {
    const directory = await createProject(
      `
        @meta { id: "ordered-import" syntax: "1.5.0" }
        @override standards.testing { ["Too early"] }
        @use ./shared
      `,
      {
        'shared.prs': `
          @meta { id: "shared" syntax: "1.5.0" }
          @standards { testing: ["Imported"] }
        `,
      }
    );
    const resolver = new Resolver({
      registryPath: directory,
      localPath: directory,
      cache: false,
    });

    const result = await resolver.resolve(join(directory, 'project.prs'));

    expect(result.errors).toEqual([
      expect.objectContaining({
        message: expect.stringContaining('@override target "standards.testing" does not exist'),
      }),
    ]);
    expect(properties(result.ast?.blocks ?? [], 'standards')['testing']).toEqual(['Imported']);
  });

  it('supports root bodies, nested primitives, and complete replacement', async () => {
    const directory = await createProject(`
      @meta { id: "shapes" syntax: "1.5.0" }
      @identity { """Old identity""" }
      @restrictions { - "Old restriction" }
      @standards {
        config: { enabled: true retries: 1 optional: "value" }
        old: true
      }
      @override identity { "New identity" }
      @override restrictions { ["New restriction"] }
      @override standards {
        """Required engineering rules."""
        config: { enabled: true retries: 1 optional: "value" }
        - "Document failures"
      }
      @override standards.config.enabled { false }
      @override standards.config.retries { 3 }
      @override standards.config.optional { null }
    `);
    const resolver = new Resolver({
      registryPath: directory,
      localPath: directory,
      cache: false,
    });

    const result = await resolver.resolve(join(directory, 'project.prs'));
    const standardsBlock = result.ast?.blocks.find((block) => block.name === 'standards');

    expect(result.errors).toEqual([]);
    expect(result.ast?.blocks.find((block) => block.name === 'identity')?.content).toMatchObject({
      type: 'TextContent',
      value: 'New identity',
    });
    expect(
      result.ast?.blocks.find((block) => block.name === 'restrictions')?.content
    ).toMatchObject({
      type: 'ArrayContent',
      elements: ['New restriction'],
    });
    expect(standardsBlock?.content).toMatchObject({
      type: 'MixedContent',
      text: expect.objectContaining({ value: 'Required engineering rules.' }),
      properties: {
        config: { enabled: false, retries: 3, optional: null },
        items: ['Document failures'],
      },
    });
  });

  it('composes each replacement before later ordered operations', async () => {
    const directory = await createProject(
      `
        @meta { id: "composition" syntax: "1.5.0" }
        @skills {
          workflow: { description: "Old" content: "Old workflow" }
          @use ./old-phase
        }
        @override skills {
          workflow: { description: "New" content: "New workflow" }
          @use ./phase
        }
      `,
      {
        'old-phase.prs': `
          @meta { id: "old-phase" syntax: "1.5.0" }
          @skills {
            old-phase: { description: "Old phase" content: "Run old phase" }
          }
        `,
        'phase.prs': `
          @meta { id: "phase" syntax: "1.5.0" }
          @skills {
            phase: { description: "Phase" content: "Run phase" }
          }
        `,
      }
    );
    const resolver = new Resolver({
      registryPath: directory,
      localPath: directory,
      cache: false,
    });

    const result = await resolver.resolve(join(directory, 'project.prs'));
    const workflow = properties(result.ast?.blocks ?? [], 'skills')['workflow'] as Record<
      string,
      Value
    >;

    expect(result.errors).toEqual([]);
    expect(workflow['description']).toBe('New');
    expect(workflow['__composedFrom']).toEqual([expect.objectContaining({ name: 'phase' })]);
    expect(
      (result.ast?.blocks.find((block) => block.name === 'skills')?.content as ObjectContent)
        .inlineUses
    ).toBeUndefined();
  });

  it('lets later overrides replace composed skill content', async () => {
    const directory = await createProject(
      `
        @meta { id: "composition-override" syntax: "1.5.0" }
        @skills {
          workflow: { description: "Workflow" content: "Parent workflow" }
          @use ./phase
        }
        @override skills.workflow.content { "Final workflow" }
      `,
      {
        'phase.prs': `
          @meta { id: "phase" syntax: "1.5.0" }
          @skills {
            phase: { description: "Phase" content: "Run phase" }
          }
        `,
      }
    );
    const resolver = new Resolver({
      registryPath: directory,
      localPath: directory,
      cache: false,
    });

    const result = await resolver.resolve(join(directory, 'project.prs'));
    const workflow = properties(result.ast?.blocks ?? [], 'skills')['workflow'] as Record<
      string,
      Value
    >;

    expect(result.errors).toEqual([]);
    expect(workflow['content']).toBe('Final workflow');
    expect(workflow['__composedFrom']).toEqual([expect.objectContaining({ name: 'phase' })]);
  });

  it('does not retry failed inline composition after later operations', async () => {
    const directory = await createProject(`
      @meta { id: "failed-composition" syntax: "1.5.0" }
      @skills {
        workflow: { description: "Workflow" content: "Parent workflow" }
        @use ./missing
      }
      @standards { testing: ["Use Vitest"] }
      @override standards.testing { ["Use Node test"] }
    `);
    const resolver = new Resolver({
      registryPath: directory,
      localPath: directory,
      cache: false,
    });

    const result = await resolver.resolve(join(directory, 'project.prs'));
    const skills = result.ast?.blocks.find((block) => block.name === 'skills');

    expect(result.errors).toHaveLength(2);
    expect(result.errors.map((error) => error.message).join(' ')).toContain('missing');
    expect((skills?.content as ObjectContent).inlineUses).toBeUndefined();
  });

  it('normalizes unexpected ordered extension failures', async () => {
    const directory = await createProject(`
      @meta { id: "extension-error" syntax: "1.5.0" }
      @extend missing { enabled: true }
    `);
    const logger: Logger = {
      verbose: () => {},
      debug: () => {},
      warn: () => {
        throw new Error('logger failure');
      },
    };
    const resolver = new Resolver({
      registryPath: directory,
      localPath: directory,
      logger,
      cache: false,
    });

    const result = await resolver.resolve(join(directory, 'project.prs'));

    expect(result.errors).toEqual([
      expect.objectContaining({
        message: 'Extension resolution failed: logger failure',
      }),
    ]);
  });

  it('returns actionable errors without partially applying invalid overrides', async () => {
    const directory = await createProject(`
      @meta { id: "invalid" syntax: "1.5.0" }
      @standards { testing: { runner: "jest" } }
      @override standards.missing { true }
      @override standards.testing.runner.name { "invalid" }
      @override standards { false }
    `);
    const resolver = new Resolver({
      registryPath: directory,
      localPath: directory,
      cache: false,
    });

    const result = await resolver.resolve(join(directory, 'project.prs'));

    expect(result.errors.map((error) => error.message)).toEqual([
      expect.stringContaining('does not exist at segment "missing"'),
      expect.stringContaining('through non-object segment "name"'),
      expect.stringContaining('Cannot replace block "@standards" with boolean content'),
    ]);
    expect(properties(result.ast?.blocks ?? [], 'standards')['testing']).toEqual({
      runner: 'jest',
    });
    expect(result.ast?.syntaxFeatures).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ feature: SYNTAX_FEATURES.EXPLICIT_OVERRIDE }),
      ])
    );
  });

  it('cannot bypass sealed skill properties', async () => {
    const directory = await createProject(`
      @meta { id: "sealed" syntax: "1.5.0" }
      @skills {
        review: {
          description: "Review code"
          content: "Critical instructions"
          sealed: ["content"]
        }
      }
      @override skills.review.content { "Changed" }
    `);
    const resolver = new Resolver({
      registryPath: directory,
      localPath: directory,
      cache: false,
    });

    const result = await resolver.resolve(join(directory, 'project.prs'));

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.message).toContain("Cannot override sealed property 'content'");
    expect(
      (properties(result.ast?.blocks ?? [], 'skills')['review'] as Record<string, Value>)['content']
    ).toBe('Critical instructions');
  });

  it('rejects complete skill replacement that changes sealed contracts', async () => {
    const directory = await createProject(`
      @meta { id: "sealed-root" syntax: "1.5.0" }
      @skills {
        review: {
          description: "Review code"
          content: "Critical instructions"
          sealed: ["content"]
        }
      }
      @override skills {
        review: {
          description: "Review code"
          content: "Changed"
          sealed: ["content"]
        }
      }
    `);
    const resolver = new Resolver({
      registryPath: directory,
      localPath: directory,
      cache: false,
    });

    const result = await resolver.resolve(join(directory, 'project.prs'));

    expect(result.errors).toEqual([
      expect.objectContaining({
        message: expect.stringContaining("Cannot change sealed property 'content'"),
      }),
    ]);
    expect(
      (properties(result.ast?.blocks ?? [], 'skills')['review'] as Record<string, Value>)['content']
    ).toBe('Critical instructions');
  });
});
