import { afterEach, describe, expect, it } from 'vitest';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { SYNTAX_FEATURES, type Block, type PresentationEntry } from '@promptscript/core';
import { parseOrThrow } from '@promptscript/parser';
import { applyExtends } from '../extensions.js';
import { Resolver } from '../resolver.js';

const testDirectories: string[] = [];

async function createTestDirectory(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'prs-section-headers-'));
  testDirectories.push(directory);
  return directory;
}

function headers(blocks: Block[], blockName: string): PresentationEntry[] {
  const block = blocks.find((candidate) => candidate.name === blockName);
  return (block?.canonicalBody?.entries ?? []).filter(
    (entry): entry is PresentationEntry => entry.type === 'PresentationEntry'
  );
}

afterEach(async () => {
  await Promise.all(
    testDirectories.splice(0).map((directory) => rm(directory, { recursive: true }))
  );
});

describe('section header override resolution', () => {
  it('should let inherited child headers override parent headers', async () => {
    const directory = await createTestDirectory();
    const basePath = join(directory, 'base.prs');
    const projectPath = join(directory, 'project.prs');
    await writeFile(
      basePath,
      `@meta { id: "base" syntax: "1.5.0" }
@standards {
  @header "Base Rules"
  code: ["Base content"]
}`
    );
    await writeFile(
      projectPath,
      `@meta { id: "project" syntax: "1.5.0" }
@inherit ./base
@standards {
  @header "Project Rules"
  testing: ["Project content"]
}`
    );
    const resolver = new Resolver({
      registryPath: directory,
      localPath: directory,
      cache: false,
    });

    const result = await resolver.resolve(projectPath);

    expect(result.errors).toEqual([]);
    expect(headers(result.ast!.blocks, 'standards')).toMatchObject([
      { title: 'Project Rules', source: 'explicit' },
    ]);
  });

  it('should preserve imported source precedence for section headers', async () => {
    const directory = await createTestDirectory();
    const sourcePath = join(directory, 'source.prs');
    const projectPath = join(directory, 'project.prs');
    await writeFile(
      sourcePath,
      `@meta { id: "source" syntax: "1.5.0" }
@standards {
  @header "Imported Rules"
  code: ["Imported content"]
}`
    );
    await writeFile(
      projectPath,
      `@meta { id: "project" syntax: "1.5.0" }
@standards {
  @header "Local Rules"
  testing: ["Local content"]
}
@use ./source`
    );
    const resolver = new Resolver({
      registryPath: directory,
      localPath: directory,
      cache: false,
    });

    const result = await resolver.resolve(projectPath);

    expect(result.errors).toEqual([]);
    expect(headers(result.ast!.blocks, 'standards')).toMatchObject([
      { title: 'Imported Rules', source: 'explicit' },
    ]);
  });

  it('should apply the latest root extension header independently per section', () => {
    const ast = parseOrThrow(`
      @meta { id: "extend" syntax: "1.5.0" }
      @standards {
        @header code-standards "Base Rules"
        @header git-commits "Base Commits"
        code: ["Base content"]
      }
      @extend standards {
        @header "First Rules"
      }
      @extend standards {
        @header code-standards "Final Rules"
        @header git-commits "Final Commits"
      }
    `);

    const result = applyExtends(ast);

    expect(headers(result.blocks, 'standards')).toMatchObject([
      { sectionId: 'code-standards', title: 'Final Rules' },
      { sectionId: 'git-commits', title: 'Final Commits' },
    ]);
  });

  it('should normalize legacy headings in root extensions', () => {
    const ast = parseOrThrow(`
      @meta { id: "extend-legacy" syntax: "1.5.0" }
      @standards {
        """## Base Rules
        Base content"""
      }
      @extend standards {
        """## Extended Rules
        Extended content"""
      }
    `);

    const result = applyExtends(ast);
    const standards = result.blocks.find((block) => block.name === 'standards');

    expect(headers(result.blocks, 'standards')).toMatchObject([
      { title: 'Extended Rules', source: 'legacy' },
    ]);
    expect(standards?.content).toMatchObject({
      type: 'TextContent',
      value: expect.stringContaining('Base content'),
    });
    expect(standards?.content).toMatchObject({
      value: expect.stringContaining('Extended content'),
    });
  });

  it('should retain transitive syntax feature usage', async () => {
    const directory = await createTestDirectory();
    const sourcePath = join(directory, 'source.prs');
    const projectPath = join(directory, 'project.prs');
    await writeFile(
      sourcePath,
      `@meta { id: "source" syntax: "1.4.0" }
@standards {
  @header "Imported Rules"
  code: ["Imported content"]
}`
    );
    await writeFile(
      projectPath,
      `@meta { id: "project" syntax: "1.4.0" }
@use ./source`
    );
    const resolver = new Resolver({
      registryPath: directory,
      localPath: directory,
      cache: false,
    });

    const result = await resolver.resolve(projectPath);

    expect(result.errors).toEqual([]);
    expect(result.ast?.syntaxFeatures).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          feature: SYNTAX_FEATURES.SECTION_HEADER_OVERRIDE,
          location: expect.objectContaining({ file: sourcePath }),
        }),
      ])
    );
  });
});
