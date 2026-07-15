import { afterEach, describe, expect, it } from 'vitest';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Block, ObjectContent, Value } from '@promptscript/core';
import { ResolveError, SYNTAX_FEATURES } from '@promptscript/core';
import { parseOrThrow } from '@promptscript/parser';
import { applyExtends } from '../extensions.js';
import { Resolver } from '../resolver.js';

const testDirectories: string[] = [];

async function createTestDirectory(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'prs-regular-replace-'));
  testDirectories.push(directory);
  return directory;
}

function getObjectProperties(blocks: Block[], name: string): Record<string, Value> {
  const block = blocks.find((candidate) => candidate.name === name);
  if (block?.content.type !== 'ObjectContent') {
    throw new Error(`Expected @${name} to contain object content`);
  }
  return (block.content as ObjectContent).properties;
}

afterEach(async () => {
  await Promise.all(
    testDirectories.splice(0).map((directory) => rm(directory, { recursive: true }))
  );
});

describe('regular block replace modifier', () => {
  it('should replace marked values, merge unmarked values, set missing keys, and apply the latest overlay', () => {
    const ast = parseOrThrow(`
      @meta { id: "replace" syntax: "1.3.0" }
      @standards {
        testing: ["Use Jest", "Use Mocha"]
        linting: ["Use ESLint"]
      }
      @extend standards {
        testing!: ["Use Vitest"]
        linting: ["Use Biome"]
        deployment!: ["Use Fly"]
      }
      @extend standards {
        testing!: ["Use Node test runner"]
      }
    `);

    const result = applyExtends(ast);
    const properties = getObjectProperties(result.blocks, 'standards');

    expect(properties['testing']).toEqual(['Use Node test runner']);
    expect(properties['linting']).toEqual(['Use ESLint', 'Use Biome']);
    expect(properties['deployment']).toEqual(['Use Fly']);
  });

  it('should preserve unmarked object fields when the extension also contains text', () => {
    const ast = parseOrThrow(`
      @meta { id: "mixed-replace" syntax: "1.3.0" }
      @standards {
        testing: ["Use Jest"]
        linting: ["Use ESLint"]
        security: ["Use OWASP"]
      }
      @extend standards {
        """
        Project-specific standards.
        """
        testing!: ["Use Vitest"]
        linting: ["Use Biome"]
      }
    `);

    const result = applyExtends(ast);
    const standards = result.blocks.find((block) => block.name === 'standards');

    expect(standards?.content.type).toBe('MixedContent');
    if (standards?.content.type !== 'MixedContent') {
      throw new Error('Expected @standards to contain mixed content');
    }
    expect(standards.content.text?.value).toContain('Project-specific standards.');
    expect(standards.content.properties['testing']).toEqual(['Use Vitest']);
    expect(standards.content.properties['linting']).toEqual(['Use ESLint', 'Use Biome']);
    expect(standards.content.properties['security']).toEqual(['Use OWASP']);
  });

  it('should replace inherited regular block values', async () => {
    const directory = await createTestDirectory();
    await writeFile(
      join(directory, 'base.prs'),
      `@meta { id: "base" syntax: "1.0.0" }
@standards {
  testing: ["Use Jest"]
  linting: ["Use ESLint"]
}`
    );
    const projectPath = join(directory, 'project.prs');
    await writeFile(
      projectPath,
      `@meta { id: "project" syntax: "1.3.0" }
@inherit ./base
@extend standards {
  testing!: ["Use Vitest"]
  linting: ["Use Biome"]
}`
    );
    const resolver = new Resolver({
      registryPath: directory,
      localPath: directory,
      cache: false,
    });

    const result = await resolver.resolve(projectPath);
    const properties = getObjectProperties(result.ast!.blocks, 'standards');

    expect(result.errors).toEqual([]);
    expect(properties['testing']).toEqual(['Use Vitest']);
    expect(properties['linting']).toEqual(['Use ESLint', 'Use Biome']);
  });

  it.each([
    ['unaliased', '@use ./base', 'standards.tooling'],
    ['aliased', '@use ./base as shared', 'shared.standards.tooling'],
  ])('should replace values from %s @use at a nested target path', async (_name, use, target) => {
    const directory = await createTestDirectory();
    await writeFile(
      join(directory, 'base.prs'),
      `@meta { id: "base" syntax: "1.0.0" }
@standards {
  tooling: {
    frameworks: ["React", "Angular"]
    runtime: ["Node.js"]
  }
}`
    );
    const projectPath = join(directory, 'project.prs');
    await writeFile(
      projectPath,
      `@meta { id: "project" syntax: "1.3.0" }
${use}
@extend ${target} {
  frameworks!: ["Vue"]
  runtime: ["Bun"]
}`
    );
    const resolver = new Resolver({
      registryPath: directory,
      localPath: directory,
      cache: false,
    });

    const result = await resolver.resolve(projectPath);
    const standards = getObjectProperties(result.ast!.blocks, 'standards');
    const tooling = standards['tooling'] as Record<string, Value>;

    expect(result.errors).toEqual([]);
    expect(tooling['frameworks']).toEqual(['Vue']);
    expect(tooling['runtime']).toEqual(['Node.js', 'Bun']);
  });

  it.each([
    ['inheritance', '@inherit ./base'],
    ['composition', '@use ./base'],
  ])('should retain feature usage from %s after resolution', async (_name, directive) => {
    const directory = await createTestDirectory();
    await writeFile(
      join(directory, 'base.prs'),
      `@meta { id: "base" syntax: "1.3.0" }
@standards { testing: ["Use Jest"] }
@extend standards {
  testing!: ["Use Vitest"]
}`
    );
    const projectPath = join(directory, 'project.prs');
    await writeFile(
      projectPath,
      `@meta { id: "project" syntax: "1.2.0" }
${directive}`
    );
    const resolver = new Resolver({
      registryPath: directory,
      localPath: directory,
      cache: false,
    });

    const result = await resolver.resolve(projectPath);

    expect(result.ast?.extends).toEqual([]);
    expect(result.ast?.syntaxFeatures).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          feature: SYNTAX_FEATURES.REGULAR_BLOCK_REPLACE,
        }),
      ])
    );
  });

  it('should reject the modifier for direct skill targets', () => {
    const ast = parseOrThrow(`
      @meta { id: "skills" syntax: "1.3.0" }
      @skills { review: { description: "Review code" } }
      @extend skills.review {
        description!: "Replacement"
      }
    `);

    expect(() => applyExtends(ast)).toThrowError(ResolveError);
    expect(() => applyExtends(ast)).toThrowError(/only supported for regular block fields/);
  });

  it('should reject the modifier for a missing skill target', () => {
    const ast = parseOrThrow(`
      @meta { id: "skills" syntax: "1.3.0" }
      @extend skills.review {
        description!: "Replacement"
      }
    `);

    expect(() => applyExtends(ast)).toThrowError(/only supported for regular block fields/);
  });

  it('should reject mixed content for whole-skill extensions', () => {
    const ast = parseOrThrow(`
      @meta { id: "skills" syntax: "1.3.0" }
      @skills {
        review: {
          description: "Review code"
          content: "Critical instructions"
          sealed: ["content"]
        }
      }
      @extend skills.review {
        """
        Ambiguous skill text.
        """
        content: "Override attempt"
      }
    `);

    expect(() => applyExtends(ast)).toThrowError(/must use named object fields/);
  });

  it('should reject the modifier for aliased skill targets', async () => {
    const directory = await createTestDirectory();
    await writeFile(
      join(directory, 'base.prs'),
      `@meta { id: "base" syntax: "1.2.0" }
@skills { review: { description: "Review code" } }`
    );
    const projectPath = join(directory, 'project.prs');
    await writeFile(
      projectPath,
      `@meta { id: "project" syntax: "1.3.0" }
@use ./base as shared
@extend shared.skills.review {
  description!: "Replacement"
}`
    );
    const resolver = new Resolver({
      registryPath: directory,
      localPath: directory,
      cache: false,
    });

    await expect(resolver.resolve(projectPath)).rejects.toThrow(
      /only supported for regular block fields/
    );
  });
});
