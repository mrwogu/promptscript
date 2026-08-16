import { afterEach, describe, expect, it, vi } from 'vitest';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import * as parser from '@promptscript/parser';
import { Resolver } from '../resolver.js';

const testDirectories: string[] = [];

async function createProject(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'prs-operation-mode-'));
  testDirectories.push(directory);
  return directory;
}

afterEach(async () => {
  await Promise.all(
    testDirectories.splice(0).map((directory) => rm(directory, { recursive: true }))
  );
});

describe('operation mode inspection', () => {
  it('parses each local source once during a diamond-shaped inspection', async () => {
    const directory = await createProject();
    const files = {
      root: join(directory, 'root.prs'),
      left: join(directory, 'left.prs'),
      right: join(directory, 'right.prs'),
      shared: join(directory, 'shared.prs'),
    };

    await Promise.all([
      writeFile(
        files.root,
        `
          @meta { id: "root" syntax: "1.4.0" }
          @use ./left
          @use ./right
          @identity { """root""" }
        `
      ),
      writeFile(
        files.left,
        `
          @meta { id: "left" syntax: "1.4.0" }
          @use ./shared
          @identity { """left""" }
        `
      ),
      writeFile(
        files.right,
        `
          @meta { id: "right" syntax: "1.4.0" }
          @use ./shared
          @identity { """right""" }
        `
      ),
      writeFile(
        files.shared,
        `
          @meta { id: "shared" syntax: "1.4.0" }
          @identity { """shared""" }
        `
      ),
    ]);

    const parseSpy = vi.spyOn(parser, 'parse');
    const resolver = new Resolver({
      registryPath: directory,
      localPath: directory,
      cache: true,
    });

    const result = await resolver.resolve(files.root);

    expect(result.errors).toEqual([]);
    expect(result.ast).not.toBeNull();

    const parseCounts = new Map<string, number>();
    for (const [, options] of parseSpy.mock.calls) {
      const filename = options?.filename;
      if (filename) {
        parseCounts.set(filename, (parseCounts.get(filename) ?? 0) + 1);
      }
    }

    expect(parseCounts.get(files.root)).toBe(1);
    expect(parseCounts.get(files.left)).toBe(1);
    expect(parseCounts.get(files.right)).toBe(1);
    expect(parseCounts.get(files.shared)).toBe(1);

    parseSpy.mockRestore();
  });

  it('uses ordered semantics when an inline skill use declares syntax 1.5', async () => {
    const directory = await createProject();
    const projectPath = join(directory, 'project.prs');
    const phasePath = join(directory, 'phase.prs');

    await writeFile(
      projectPath,
      `
        @meta { id: "project" syntax: "1.4.0" }
        @extend standards { testing: ["Extended first"] }
        @skills {
          project: { content: "Project instructions" }
          @use ./phase
        }
        @standards { testing: ["Declared later"] }
      `
    );
    await writeFile(
      phasePath,
      `
        @meta { id: "phase" syntax: "1.5.0" }
        @skills { phase: { content: "Phase instructions" } }
      `
    );

    const resolver = new Resolver({
      registryPath: directory,
      localPath: directory,
      cache: false,
    });

    const result = await resolver.resolve(projectPath);

    expect(result.errors).toEqual([]);
    expect(result.ast?.blocks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'standards',
          content: expect.objectContaining({
            type: 'ObjectContent',
            properties: { testing: ['Declared later'] },
          }),
        }),
        expect.objectContaining({
          name: 'skills',
          content: expect.objectContaining({
            properties: {
              project: expect.objectContaining({
                content: expect.objectContaining({
                  value: expect.stringContaining('## Phase 1: phase'),
                }),
              }),
            },
          }),
        }),
      ])
    );
  });

  it('uses ordered semantics for inline uses carried by an extension', async () => {
    const directory = await createProject();
    const projectPath = join(directory, 'project.prs');
    const phasePath = join(directory, 'phase.prs');

    await writeFile(
      projectPath,
      `
        @meta { id: "project" syntax: "1.4.0" }
        @skills {
          deploy: { content: "Base deploy instructions" }
        }
        @extend skills {
          @use ./phase
        }
      `
    );
    await writeFile(
      phasePath,
      `
        @meta { id: "phase" syntax: "1.5.0" }
        @skills { phase: { content: "Phase instructions" } }
      `
    );

    const resolver = new Resolver({
      registryPath: directory,
      localPath: directory,
      cache: false,
    });

    const result = await resolver.resolve(projectPath);

    expect(result.errors).toEqual([]);
    expect(result.ast?.blocks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'skills',
          content: expect.objectContaining({
            properties: {
              deploy: expect.objectContaining({
                content: expect.objectContaining({
                  value: expect.stringContaining('Phase instructions'),
                }),
              }),
            },
            inlineUses: undefined,
          }),
        }),
      ])
    );
  });

  it('isolates operation inspection state across concurrent resolves', async () => {
    const directory = await createProject();
    const files = {
      orderedRoot: join(directory, 'ordered-root.prs'),
      project: join(directory, 'project.prs'),
      phase: join(directory, 'phase.prs'),
    };

    await Promise.all([
      writeFile(
        files.orderedRoot,
        `
          @meta { id: "ordered-root" syntax: "1.5.0" }
          @identity { """Ordered root""" }
        `
      ),
      writeFile(
        files.project,
        `
          @meta { id: "project" syntax: "1.4.0" }
          @skills {
            deploy: { content: "Base deploy instructions" }
          }
          @extend skills {
            @use ./phase
          }
        `
      ),
      writeFile(
        files.phase,
        `
          @meta { id: "phase" syntax: "1.4.0" }
          @skills { phase: { content: "Initial phase instructions" } }
        `
      ),
    ]);

    const resolver = new Resolver({
      registryPath: directory,
      localPath: directory,
      cache: false,
    });
    const loader = resolver.getLoader();
    const originalLoad = loader.load.bind(loader);
    let releaseProjectLoad!: () => void;
    const projectLoadReleased = new Promise<void>((resolve) => {
      releaseProjectLoad = resolve;
    });
    let projectLoadStarted!: () => void;
    const projectLoadStartedPromise = new Promise<void>((resolve) => {
      projectLoadStarted = resolve;
    });
    const loadSpy = vi.spyOn(loader, 'load').mockImplementation(async (path) => {
      const content = await originalLoad(path);
      if (path === files.project) {
        projectLoadStarted();
        await projectLoadReleased;
      }
      return content;
    });

    const orderedRootPromise = resolver.resolve(files.orderedRoot);
    const projectPromise = resolver.resolve(files.project);
    await projectLoadStartedPromise;
    await orderedRootPromise;
    releaseProjectLoad();
    const [, projectResult] = await Promise.all([orderedRootPromise, projectPromise]);
    loadSpy.mockRestore();

    expect(projectResult.errors).toEqual([]);

    await writeFile(
      files.phase,
      `
        @meta { id: "phase" syntax: "1.5.0" }
        @skills { phase: { content: "Updated phase instructions" } }
      `
    );

    const result = await resolver.resolve(files.project);
    const skills = result.ast?.blocks.find((block) => block.name === 'skills');

    expect(result.errors).toEqual([]);
    expect(skills?.content).toEqual(
      expect.objectContaining({
        inlineUses: undefined,
        properties: expect.objectContaining({
          deploy: expect.objectContaining({
            content: expect.objectContaining({
              value: expect.stringContaining('Updated phase instructions'),
            }),
          }),
        }),
      })
    );
  });
});
