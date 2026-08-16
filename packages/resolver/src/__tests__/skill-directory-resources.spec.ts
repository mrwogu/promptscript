import { describe, it, expect, afterEach } from 'vitest';
import { mkdtemp, mkdir, rm, writeFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import type { ObjectContent, Program, Value } from '@promptscript/core';
import { Resolver } from '../resolver.js';
import { discoverNativeContent } from '../auto-discovery.js';
import { collectSkillResources, toSkillResourceValues } from '../skill-resources.js';
import { parseSkillMd } from '../skills.js';

const temporaryDirectories: string[] = [];

async function createTempDir(prefix: string): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), prefix));
  temporaryDirectories.push(directory);
  return directory;
}

function skillResources(ast: Program | null, skillName: string): Array<Record<string, Value>> {
  const skillsBlock = ast?.blocks.find((block) => block.name === 'skills');
  const properties = (skillsBlock?.content as ObjectContent | undefined)?.properties ?? {};
  const skill = properties[skillName] as Record<string, Value> | undefined;
  const resources = skill?.['resources'];
  return Array.isArray(resources) ? (resources as Array<Record<string, Value>>) : [];
}

function relativePaths(resources: Array<Record<string, Value>>): string[] {
  return resources.map((resource) => resource['relativePath'] as string).sort();
}

/**
 * Write a skill directory shaped like a published Claude skill: SKILL.md plus
 * reference documents, scripts and data files that the instructions point at.
 */
async function writeSkillDirectory(skillDir: string, name: string): Promise<void> {
  await mkdir(join(skillDir, 'references'), { recursive: true });
  await mkdir(join(skillDir, 'data'), { recursive: true });
  await mkdir(join(skillDir, 'scripts'), { recursive: true });
  await writeFile(
    join(skillDir, 'SKILL.md'),
    [
      '---',
      `name: ${name}`,
      'description: Design guidance',
      '---',
      '',
      'Read references/rules.md.',
    ].join('\n')
  );
  await writeFile(join(skillDir, 'references', 'rules.md'), '# Rules');
  await writeFile(join(skillDir, 'data', 'colors.csv'), 'name,hex\nred,#f00');
  await writeFile(join(skillDir, 'scripts', 'search.py'), 'print("search")');
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true }))
  );
});

describe('directory imports carry skill resources', () => {
  it('keeps resources when the imported directory contains skill subdirectories', async () => {
    const projectDir = await createTempDir('prs-dir-import-');
    await writeSkillDirectory(join(projectDir, 'bundle', 'ui-ux'), 'ui-ux');
    await writeFile(
      join(projectDir, 'main.prs'),
      [
        '@meta { id: "dir-import" syntax: "1.0.0" }',
        '',
        '@use ./bundle',
        '',
        '@identity { """test""" }',
      ].join('\n')
    );

    const resolver = new Resolver({
      registryPath: projectDir,
      projectRoot: projectDir,
      cache: false,
    });
    const result = await resolver.resolve(join(projectDir, 'main.prs'));

    expect(result.errors).toEqual([]);
    expect(relativePaths(skillResources(result.ast, 'ui-ux'))).toEqual([
      'data/colors.csv',
      'references/rules.md',
      'scripts/search.py',
    ]);
  });

  it('resolves a local import of a directory that is itself the skill', async () => {
    const projectDir = await createTempDir('prs-local-root-skill-');
    await writeSkillDirectory(join(projectDir, 'skills', 'ui-ux'), 'ui-ux');
    await writeFile(
      join(projectDir, 'main.prs'),
      [
        '@meta { id: "local-root-skill" syntax: "1.0.0" }',
        '',
        '@use ./skills/ui-ux',
        '',
        '@identity { """test""" }',
      ].join('\n')
    );

    const resolver = new Resolver({
      registryPath: projectDir,
      projectRoot: projectDir,
      cache: false,
    });
    const result = await resolver.resolve(join(projectDir, 'main.prs'));

    expect(result.errors).toEqual([]);
    expect(relativePaths(skillResources(result.ast, 'ui-ux'))).toEqual([
      'data/colors.csv',
      'references/rules.md',
      'scripts/search.py',
    ]);
  });

  it('keeps both the root skill and nested skills when a directory holds both', async () => {
    const projectDir = await createTempDir('prs-root-and-nested-');
    const bundleDir = join(projectDir, 'bundle');
    await writeSkillDirectory(bundleDir, 'bundle-root');
    await writeSkillDirectory(join(bundleDir, 'nested', 'extra'), 'extra');
    await writeFile(
      join(projectDir, 'main.prs'),
      [
        '@meta { id: "root-and-nested" syntax: "1.0.0" }',
        '',
        '@use ./bundle',
        '',
        '@identity { """test""" }',
      ].join('\n')
    );

    const resolver = new Resolver({
      registryPath: projectDir,
      projectRoot: projectDir,
      cache: false,
    });
    const result = await resolver.resolve(join(projectDir, 'main.prs'));

    expect(result.errors).toEqual([]);
    const skillsBlock = result.ast?.blocks.find((block) => block.name === 'skills');
    const properties = (skillsBlock?.content as ObjectContent | undefined)?.properties ?? {};
    expect(Object.keys(properties).sort()).toEqual(['bundle-root', 'extra']);
    expect(relativePaths(skillResources(result.ast, 'extra'))).toEqual([
      'data/colors.csv',
      'references/rules.md',
      'scripts/search.py',
    ]);
  });

  it('keeps resources when the imported directory is itself the skill', async () => {
    const skillDir = await createTempDir('prs-root-skill-');
    await writeSkillDirectory(skillDir, 'ui-ux');

    const ast = await discoverNativeContent(skillDir);

    expect(relativePaths(skillResources(ast, 'ui-ux'))).toEqual([
      'data/colors.csv',
      'references/rules.md',
      'scripts/search.py',
    ]);
  });

  it('keeps resources for skills discovered under a skills/ wrapper directory', async () => {
    const repoDir = await createTempDir('prs-wrapper-skill-');
    await writeSkillDirectory(join(repoDir, 'skills', 'ui-ux'), 'ui-ux');

    const ast = await discoverNativeContent(repoDir);

    expect(relativePaths(skillResources(ast, 'ui-ux'))).toEqual([
      'data/colors.csv',
      'references/rules.md',
      'scripts/search.py',
    ]);
  });

  it('reports a missing frontmatter reference from a discovered skill directory', async () => {
    const skillDir = await createTempDir('prs-root-skill-missing-ref-');
    await writeFile(
      join(skillDir, 'SKILL.md'),
      ['---', 'name: broken', 'description: d', 'references: [missing.md]', '---', '', 'Body'].join(
        '\n'
      )
    );

    await expect(discoverNativeContent(skillDir)).rejects.toThrow(/Reference file not found/);
  });
});

describe('collectSkillResources', () => {
  it('merges discovered files with frontmatter references and scripts', async () => {
    const skillDir = await createTempDir('prs-collect-');
    await mkdir(join(skillDir, 'references'), { recursive: true });
    await writeFile(join(skillDir, 'references', 'rules.md'), '# Rules');
    await writeFile(join(skillDir, 'run.sh'), 'echo hi');
    const skillMdPath = join(skillDir, 'SKILL.md');
    const source = [
      '---',
      'name: collected',
      'description: d',
      'references: [references/rules.md]',
      'scripts: [run.sh]',
      '---',
      '',
      'Body',
    ].join('\n');
    await writeFile(skillMdPath, source);

    const collected = await collectSkillResources(skillMdPath, parseSkillMd(source, skillMdPath));

    expect(collected.errors).toEqual([]);
    // references/rules.md appears once: the explicit entry replaces the discovered copy
    expect(
      relativePaths(toSkillResourceValues(collected.resources) as Array<Record<string, Value>>)
    ).toEqual(['references/rules.md', 'run.sh', 'scripts/run.sh']);
  });

  it('returns errors for unresolvable frontmatter entries instead of throwing', async () => {
    const skillDir = await createTempDir('prs-collect-errors-');
    const skillMdPath = join(skillDir, 'SKILL.md');
    const source = [
      '---',
      'name: collected',
      'description: d',
      'references: [missing.md]',
      'scripts: [missing.sh]',
      '---',
      '',
      'Body',
    ].join('\n');
    await writeFile(skillMdPath, source);

    const collected = await collectSkillResources(skillMdPath, parseSkillMd(source, skillMdPath));

    expect(collected.resources).toEqual([]);
    expect(collected.errors.map((error) => error.message)).toEqual([
      'Reference file not found: missing.md',
      'Script file not found: missing.sh',
    ]);
  });

  it('logs and skips discovery failures for a missing skill directory', async () => {
    const messages: string[] = [];
    const logger = {
      verbose: (message: string) => messages.push(message),
      debug: () => {},
      warn: () => {},
    };
    const skillMdPath = join(await createTempDir('prs-collect-missing-'), 'gone', 'SKILL.md');

    const collected = await collectSkillResources(
      skillMdPath,
      parseSkillMd('---\nname: gone\n---\nBody', skillMdPath),
      logger
    );

    expect(collected.resources).toEqual([]);
    expect(collected.errors).toEqual([]);
    expect(messages.some((message) => message.includes('Failed to discover skill resources'))).toBe(
      true
    );
  });
});
