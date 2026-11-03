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

/** A .prs file with a @meta block and the given body. */
function prs(id: string, body: string): string {
  return `@meta {
  id: "${id}"
  syntax: "1.4.0"
}

${body}
`;
}

/** Write the workspace project file. */
async function putWorkspace(workspace: string, body: string): Promise<void> {
  await put(join(workspace, '.promptscript/project.prs'), prs('workspace', body));
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
    prs('tool', '@skills {\n  check-code: {\n    description: "check-code skill"\n  }\n}')
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

  await putWorkspace(workspace, '@inherit ../tool/.promptscript/project');
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

/** Resolve the workspace project and check that it has no errors. */
async function resolveWorkspace(
  workspace: string,
  skills?: { universalDir: string }
): Promise<{ blocks: Block[]; dependencies: string[] }> {
  const resolver = new Resolver({
    registryPath: join(workspace, 'registry'),
    localPath: join(workspace, '.promptscript'),
    projectRoot: workspace,
    vendorDir: join(workspace, 'vendor'),
    cache: false,
    ...(skills ? { skills } : {}),
  });
  const result = await resolver.resolve(join(workspace, '.promptscript/project.prs'));
  expect(result.errors).toEqual([]);
  return { blocks: result.ast!.blocks, dependencies: result.dependencies ?? [] };
}

function contentOf(blocks: Block[], name: string): string {
  return (skill(blocks, name)['content'] as TextContent).value;
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

    const { blocks } = await resolveWorkspace(workspace);
    expect(contentOf(blocks, 'check-code')).toContain('Tool check.');
    expect(skill(blocks, 'check-code')['resources']).toEqual([
      expect.objectContaining({ relativePath: 'scripts/check.py', content: 'print("ok")\n' }),
    ]);
    expect(contentOf(blocks, 'write-notes')).toContain('Tool notes.');
    expect(Object.keys(properties(blocks, 'shortcuts'))).toContain('/ship');
    expect(Object.keys(properties(blocks, 'agents'))).toContain('helper');
  });

  it('keeps a skill of the workspace over the inherited one', async () => {
    const { workspace } = await createLayout(false);
    await put(
      join(workspace, '.promptscript/skills/check-code/SKILL.md'),
      skillMd('check-code', 'Workspace check.')
    );

    const { blocks } = await resolveWorkspace(workspace);
    expect(contentOf(blocks, 'check-code')).toContain('Workspace check.');
  });

  it.each([
    ['the registry', 'registry/team', '../registry/team/.promptscript/project'],
    ['the Git cache', '.cache/team', '../.cache/team/.promptscript/project'],
    ['the vendor dir', 'vendor/team', '../vendor/team/.promptscript/project'],
    [
      'the own .promptscript dir',
      '.promptscript/vendor/team',
      './vendor/team/.promptscript/project',
    ],
  ])('does not read the sources of a project in %s', async (_kind, directory, inherit) => {
    const { workspace } = await createLayout(false);
    const teamDir = join(workspace, directory, '.promptscript');
    await put(
      join(teamDir, 'project.prs'),
      prs('team', '@identity {\n  """\n  Team rules.\n  """\n}')
    );
    await put(join(teamDir, 'commands/team-only.md'), 'Team only.\n');
    await putWorkspace(workspace, `@inherit ${inherit}`);

    const { blocks } = await resolveWorkspace(workspace);
    expect(Object.keys(properties(blocks, 'shortcuts'))).not.toContain('/team-only');
  });

  it('keeps the inherited skill over a registry skill with the same name', async () => {
    const { workspace } = await createLayout(false);
    await put(
      join(workspace, 'registry/@skills/check-code/SKILL.md'),
      skillMd('check-code', 'Registry check.')
    );

    const { blocks } = await resolveWorkspace(workspace);
    expect(contentOf(blocks, 'check-code')).toContain('Tool check.');
  });

  it('tracks the universal dir of the inherited project as a dependency', async () => {
    const { workspace, tool } = await createLayout(false);

    const { dependencies } = await resolveWorkspace(workspace, { universalDir: '.agents' });
    expect(dependencies).toContain(join(tool, '.agents', 'skills'));
  });

  it('tracks the symlinked and the real universal dir of the inherited project', async () => {
    const { workspace, tool } = await createLayout(true);

    const { dependencies } = await resolveWorkspace(workspace, { universalDir: '.agents' });
    expect(dependencies).toContain(join(workspace, 'tool', '.agents', 'skills'));
    expect(dependencies).toContain(join(tool, '.agents', 'skills'));
  });

  it('adds the workspace shared files to an inherited skill', async () => {
    const { workspace } = await createLayout(false);
    await put(join(workspace, '.promptscript/shared/glossary.md'), '# Glossary\n');

    const { blocks } = await resolveWorkspace(workspace);
    expect(skill(blocks, 'check-code')['resources']).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ relativePath: 'scripts/check.py' }),
        expect.objectContaining({ relativePath: '@shared/glossary.md', content: '# Glossary\n' }),
      ])
    );
  });

  it('interpolates an inherited skill with the arguments of the workspace', async () => {
    const { workspace, tool } = await createLayout(false);
    await put(
      join(tool, '.promptscript/skills/check-code/SKILL.md'),
      `---
name: check-code
description: check-code skill
params:
  language:
    type: string
    default: typescript
---

Check {{language}} code.
`
    );
    await putWorkspace(
      workspace,
      '@inherit ../tool/.promptscript/project\n\n@extend skills.check-code {\n  language: "java"\n}'
    );

    const { blocks } = await resolveWorkspace(workspace);
    expect(contentOf(blocks, 'check-code')).toContain('Check java code.');
  });

  it('keeps the workspace sources for a @use of the same file', async () => {
    const { workspace } = await createLayout(false);
    await putWorkspace(workspace, '@use ../tool/.promptscript/project');

    const { blocks } = await resolveWorkspace(workspace);
    expect(skill(blocks, 'check-code')['content']).toBeUndefined();
    expect(Object.keys(properties(blocks, 'skills'))).not.toContain('write-notes');
    expect(Object.keys(properties(blocks, 'shortcuts'))).not.toContain('/ship');
    expect(Object.keys(properties(blocks, 'agents'))).not.toContain('helper');
  });

  it('keeps the workspace sources for a file inherited from its own .promptscript', async () => {
    const { workspace } = await createLayout(false);
    await put(
      join(workspace, '.promptscript/base.prs'),
      prs('base', '@skills {\n  local-skill: {\n    description: "local-skill skill"\n  }\n}')
    );
    await put(
      join(workspace, '.promptscript/skills/local-skill/SKILL.md'),
      skillMd('local-skill', 'Local body.')
    );
    await putWorkspace(workspace, '@inherit ./base');

    const { blocks } = await resolveWorkspace(workspace);
    expect(contentOf(blocks, 'local-skill')).toContain('Local body.');
    expect(Object.keys(properties(blocks, 'skills'))).not.toContain('check-code');
  });
});
