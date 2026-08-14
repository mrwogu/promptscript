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

function objectBlockNames(blocks: Block[], blockName: string): string[] {
  const block = blocks.find((candidate) => candidate.name === blockName);
  if (!block || block.content.type !== 'ObjectContent') return [];
  return Object.keys((block.content as ObjectContent).properties);
}

async function writeCommand(baseDir: string, name: string): Promise<void> {
  const commandDir = join(baseDir, 'commands');
  await mkdir(commandDir, { recursive: true });
  await writeFile(join(commandDir, `${name}.md`), `Run ${name}.`);
}

async function writeAgent(baseDir: string, name: string): Promise<void> {
  const agentDir = join(baseDir, 'agents');
  await mkdir(agentDir, { recursive: true });
  await writeFile(
    join(agentDir, `${name}.md`),
    `---
name: ${name}
description: Agent fixture
---

Use ${name}.
`
  );
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

  it('should discover commands and agents from the scoped universal directory', async () => {
    const { workspace, projectRoot } = await createWorkspace();
    await writeCommand(join(projectRoot, '.agents'), 'in-project-command');
    await writeAgent(join(projectRoot, '.agents'), 'in-project-agent');
    await writeCommand(join(workspace, '.agents'), 'outside-command');
    await writeAgent(join(workspace, '.agents'), 'outside-agent');

    const resolver = new Resolver({
      registryPath: projectRoot,
      projectRoot,
      cache: false,
      skills: { universalDir: '.agents' },
    });

    const result = await resolver.resolve(join(projectRoot, 'project.prs'));

    expect(result.errors).toEqual([]);
    expect(objectBlockNames(result.ast!.blocks, 'shortcuts')).toEqual(['/in-project-command']);
    expect(objectBlockNames(result.ast!.blocks, 'agents')).toEqual(['in-project-agent']);
  });

  it('should preserve the parent fallback for a custom local path', async () => {
    const { projectRoot } = await createWorkspace();
    const localPath = join(projectRoot, 'custom');
    await mkdir(localPath, { recursive: true });
    await writeFile(join(localPath, 'project.prs'), PROJECT_SOURCE);
    await writeSkill(join(projectRoot, '.agents'), 'custom-local-skill');

    const resolver = new Resolver({
      registryPath: projectRoot,
      localPath,
      cache: false,
      skills: { universalDir: '.agents' },
    });

    const result = await resolver.resolve(join(localPath, 'project.prs'));

    expect(result.errors).toEqual([]);
    expect(skillNames(result.ast!.blocks)).toEqual(['custom-local-skill']);
  });
});
