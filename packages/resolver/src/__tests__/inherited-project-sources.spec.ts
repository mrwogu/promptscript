import { afterEach, describe, expect, it } from 'vitest';
import { mkdir, mkdtemp, realpath, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import type { Block, ObjectContent, TextContent, Value } from '@promptscript/core';
import { Resolver } from '../resolver.js';

const directories: string[] = [];

async function put(path: string, content: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content);
}

function skillMd(name: string, body: string): string {
  return `---
name: ${name}
description: ${name} skill
---

${body}
`;
}

/** A tool project with native sources, and a workspace that inherits it. */
async function createLayout(linkTool: boolean): Promise<{ workspace: string; tool: string }> {
  const root = await realpath(await mkdtemp(join(tmpdir(), 'prs-inherited-sources-')));
  directories.push(root);
  const workspace = join(root, 'workspace');
  const tool = linkTool ? join(root, 'tool-sources') : join(workspace, 'tool');
  const toolDir = join(tool, '.promptscript');

  await put(
    join(toolDir, 'project.prs'),
    `@meta {
  id: "tool"
  syntax: "1.4.0"
}

@skills {
  check-code: {
    description: "check-code skill"
  }
}
`
  );
  await put(join(toolDir, 'skills/check-code/SKILL.md'), skillMd('check-code', 'Tool check.'));
  await put(join(toolDir, 'skills/check-code/scripts/check.py'), 'print("ok")\n');
  await put(join(toolDir, 'skills/write-notes/SKILL.md'), skillMd('write-notes', 'Tool notes.'));
  await put(join(toolDir, 'commands/ship.md'), 'Ship it.\n');
  await put(
    join(toolDir, 'agents/helper.md'),
    `---
name: helper
description: Helper agent
---

Help.
`
  );

  await put(
    join(workspace, '.promptscript/project.prs'),
    `@meta {
  id: "workspace"
  syntax: "1.4.0"
}

@inherit ../tool/.promptscript/project
`
  );
  if (linkTool) await symlink(tool, join(workspace, 'tool'));

  return { workspace, tool };
}

function properties(blocks: Block[], name: string): Record<string, Value> {
  const block = blocks.find((candidate) => candidate.name === name);
  if (!block || block.content.type !== 'ObjectContent') return {};
  return (block.content as ObjectContent).properties;
}

function skill(blocks: Block[], name: string): Record<string, Value> {
  return properties(blocks, 'skills')[name] as Record<string, Value>;
}

function resolverFor(workspace: string): Resolver {
  return new Resolver({
    registryPath: join(workspace, 'registry'),
    localPath: join(workspace, '.promptscript'),
    projectRoot: workspace,
    cache: false,
  });
}

afterEach(async () => {
  await Promise.all(
    directories.splice(0).map((directory) => rm(directory, { recursive: true, force: true }))
  );
});

describe('native sources of an inherited project', () => {
  it.each([
    ['a directory inside the workspace', false],
    ['a symlinked directory', true],
  ])('reads skills, commands and agents from %s', async (_kind, linkTool) => {
    const { workspace } = await createLayout(linkTool);

    const result = await resolverFor(workspace).resolve(
      join(workspace, '.promptscript/project.prs')
    );

    expect(result.errors).toEqual([]);
    const blocks = result.ast!.blocks;
    const checkCode = skill(blocks, 'check-code');
    expect((checkCode['content'] as TextContent).value).toContain('Tool check.');
    expect(checkCode['resources']).toEqual([
      expect.objectContaining({ relativePath: 'scripts/check.py', content: 'print("ok")\n' }),
    ]);
    expect((skill(blocks, 'write-notes')['content'] as TextContent).value).toContain('Tool notes.');
    expect(Object.keys(properties(blocks, 'shortcuts'))).toContain('/ship');
    expect(Object.keys(properties(blocks, 'agents'))).toContain('helper');
  });

  it('keeps a skill of the workspace over the inherited one', async () => {
    const { workspace } = await createLayout(false);
    await put(
      join(workspace, '.promptscript/skills/check-code/SKILL.md'),
      skillMd('check-code', 'Workspace check.')
    );

    const result = await resolverFor(workspace).resolve(
      join(workspace, '.promptscript/project.prs')
    );

    expect(result.errors).toEqual([]);
    const content = skill(result.ast!.blocks, 'check-code')['content'] as TextContent;
    expect(content.value).toContain('Workspace check.');
  });

  it('keeps the workspace sources for a @use of the same file', async () => {
    const { workspace } = await createLayout(false);
    await put(
      join(workspace, '.promptscript/project.prs'),
      `@meta {
  id: "workspace"
  syntax: "1.4.0"
}

@use ../tool/.promptscript/project
`
    );

    const result = await resolverFor(workspace).resolve(
      join(workspace, '.promptscript/project.prs')
    );

    expect(result.errors).toEqual([]);
    const blocks = result.ast!.blocks;
    expect(skill(blocks, 'check-code')['content']).toBeUndefined();
    expect(Object.keys(properties(blocks, 'skills'))).not.toContain('write-notes');
    expect(Object.keys(properties(blocks, 'shortcuts'))).not.toContain('/ship');
    expect(Object.keys(properties(blocks, 'agents'))).not.toContain('helper');
  });

  it('keeps the workspace sources for a file inherited from its own .promptscript', async () => {
    const { workspace } = await createLayout(false);
    await put(
      join(workspace, '.promptscript/base.prs'),
      `@meta {
  id: "base"
  syntax: "1.4.0"
}

@skills {
  local-skill: {
    description: "local-skill skill"
  }
}
`
    );
    await put(
      join(workspace, '.promptscript/skills/local-skill/SKILL.md'),
      skillMd('local-skill', 'Local body.')
    );
    await put(
      join(workspace, '.promptscript/project.prs'),
      `@meta {
  id: "workspace"
  syntax: "1.4.0"
}

@inherit ./base
`
    );

    const result = await resolverFor(workspace).resolve(
      join(workspace, '.promptscript/project.prs')
    );

    expect(result.errors).toEqual([]);
    const blocks = result.ast!.blocks;
    expect((skill(blocks, 'local-skill')['content'] as TextContent).value).toContain('Local body.');
    expect(Object.keys(properties(blocks, 'skills'))).not.toContain('check-code');
  });
});
