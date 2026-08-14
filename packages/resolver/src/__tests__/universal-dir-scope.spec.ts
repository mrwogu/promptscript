import { afterEach, describe, expect, it } from 'vitest';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Block, ObjectContent } from '@promptscript/core';
import { Resolver } from '../resolver.js';

const testDirectories: string[] = [];

const PROJECT_SOURCE = `@identity {
  role: "Probe"
}
`;

function skillFile(name: string): string {
  return `---
name: ${name}
description: Discovered from a universal directory
---

Body of ${name}.
`;
}

async function writeSkill(baseDir: string, name: string): Promise<void> {
  const skillDir = join(baseDir, 'skills', name);
  await mkdir(skillDir, { recursive: true });
  await writeFile(join(skillDir, 'SKILL.md'), skillFile(name));
}

async function createWorkspace(): Promise<{ workspace: string; projectRoot: string }> {
  const workspace = await mkdtemp(join(tmpdir(), 'prs-universal-'));
  testDirectories.push(workspace);
  const projectRoot = join(workspace, 'project');
  await mkdir(projectRoot, { recursive: true });
  await writeFile(join(projectRoot, 'project.prs'), PROJECT_SOURCE);
  return { workspace, projectRoot };
}

function skillNames(blocks: Block[]): string[] {
  const block = blocks.find((candidate) => candidate.name === 'skills');
  if (!block || block.content.type !== 'ObjectContent') return [];
  return Object.keys((block.content as ObjectContent).properties);
}

afterEach(async () => {
  await Promise.all(
    testDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true }))
  );
});

describe('universal directory scope', () => {
  it('should discover skills from the universal directory inside the project root', async () => {
    const { projectRoot } = await createWorkspace();
    await writeSkill(join(projectRoot, '.agents'), 'in-project-skill');

    const resolver = new Resolver({
      registryPath: projectRoot,
      projectRoot,
      cache: false,
      skills: { universalDir: '.agents' },
    });

    const result = await resolver.resolve(join(projectRoot, 'project.prs'));

    expect(result.errors).toEqual([]);
    expect(skillNames(result.ast!.blocks)).toEqual(['in-project-skill']);
  });

  it('should not discover skills from a universal directory above the project root', async () => {
    const { workspace, projectRoot } = await createWorkspace();
    await writeSkill(join(workspace, '.agents'), 'outside-skill');

    const resolver = new Resolver({
      registryPath: projectRoot,
      projectRoot,
      cache: false,
      skills: { universalDir: '.agents' },
    });

    const result = await resolver.resolve(join(projectRoot, 'project.prs'));

    expect(result.errors).toEqual([]);
    expect(skillNames(result.ast!.blocks)).toEqual([]);
  });

  it('should still treat the universal directory as a sibling of .promptscript', async () => {
    const { projectRoot } = await createWorkspace();
    const localPath = join(projectRoot, '.promptscript');
    await mkdir(localPath, { recursive: true });
    await writeFile(join(localPath, 'project.prs'), PROJECT_SOURCE);
    await writeSkill(join(projectRoot, '.agents'), 'sibling-skill');

    const resolver = new Resolver({
      registryPath: projectRoot,
      localPath,
      cache: false,
      skills: { universalDir: '.agents' },
    });

    const result = await resolver.resolve(join(localPath, 'project.prs'));

    expect(result.errors).toEqual([]);
    expect(skillNames(result.ast!.blocks)).toEqual(['sibling-skill']);
  });
});
