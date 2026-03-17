import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { resolveNativeSkills } from '../skills.js';
import { mkdir, writeFile, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import type { Program, Block, ObjectContent, TextContent } from '@promptscript/core';

describe('shared resources discovery', () => {
  let testDir: string;
  let registryPath: string;
  let localPath: string;

  beforeEach(async () => {
    testDir = join(
      tmpdir(),
      `shared-res-test-${Date.now()}-${Math.random().toString(36).slice(2)}`
    );
    registryPath = join(testDir, 'registry');
    localPath = join(testDir, '.promptscript');
    await mkdir(registryPath, { recursive: true });
    await mkdir(localPath, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  const createProgram = (blocks: Block[]): Program => ({
    type: 'Program',
    loc: { file: 'test.prs', line: 1, column: 1, offset: 0 },
    blocks,
    uses: [],
    extends: [],
  });

  const createSkillsBlock = (properties: Record<string, unknown>): Block => ({
    type: 'Block',
    name: 'skills',
    content: {
      type: 'ObjectContent',
      properties,
      loc: { file: 'test.prs', line: 1, column: 1, offset: 0 },
    } as ObjectContent,
    loc: { file: 'test.prs', line: 1, column: 1, offset: 0 },
  });

  it('should discover shared/ directory and include resources with @shared/ prefix', async () => {
    // Create skill
    const skillDir = join(localPath, 'skills', 'review');
    await mkdir(skillDir, { recursive: true });
    await writeFile(
      join(skillDir, 'SKILL.md'),
      '---\nname: review\ndescription: Review code\n---\n\nReview code.'
    );

    // Create shared directory with resources
    const sharedDir = join(localPath, 'shared');
    await mkdir(join(sharedDir, 'templates'), { recursive: true });
    await writeFile(join(sharedDir, 'templates', 'template.md'), '# Template content');
    await writeFile(join(sharedDir, 'config.json'), '{"key": "value"}');

    const ast = createProgram([
      createSkillsBlock({
        review: { description: 'Review code' },
      }),
    ]);

    const result = await resolveNativeSkills(
      ast,
      registryPath,
      join(localPath, 'test.prs'),
      localPath
    );

    const skillsBlock = result.blocks.find((b) => b.name === 'skills');
    const skillsContent = skillsBlock!.content as ObjectContent;
    const skill = skillsContent.properties['review'] as Record<string, unknown>;
    const resources = skill['resources'] as Array<{ relativePath: string; content: string }>;

    const sharedResources = resources.filter((r) => r.relativePath.startsWith('@shared/'));
    expect(sharedResources).toHaveLength(2);

    const paths = sharedResources.map((r) => r.relativePath).sort();
    expect(paths).toContain('@shared/config.json');
    expect(paths).toContain('@shared/templates/template.md');
  });

  it('should merge shared resources with skill-specific resources', async () => {
    // Create skill with its own resource
    const skillDir = join(localPath, 'skills', 'review');
    await mkdir(skillDir, { recursive: true });
    await writeFile(
      join(skillDir, 'SKILL.md'),
      '---\nname: review\ndescription: Review\n---\n\nContent.'
    );
    await writeFile(join(skillDir, 'local-data.txt'), 'skill-specific data');

    // Create shared directory
    const sharedDir = join(localPath, 'shared');
    await mkdir(sharedDir, { recursive: true });
    await writeFile(join(sharedDir, 'global-data.txt'), 'shared data');

    const ast = createProgram([
      createSkillsBlock({
        review: { description: 'Review' },
      }),
    ]);

    const result = await resolveNativeSkills(
      ast,
      registryPath,
      join(localPath, 'test.prs'),
      localPath
    );

    const skillsBlock = result.blocks.find((b) => b.name === 'skills');
    const skillsContent = skillsBlock!.content as ObjectContent;
    const skill = skillsContent.properties['review'] as Record<string, unknown>;
    const resources = skill['resources'] as Array<{ relativePath: string; content: string }>;

    const paths = resources.map((r) => r.relativePath);
    expect(paths).toContain('local-data.txt');
    expect(paths).toContain('@shared/global-data.txt');
  });

  it('should not error when shared/ directory is missing', async () => {
    // Create skill without shared dir
    const skillDir = join(localPath, 'skills', 'review');
    await mkdir(skillDir, { recursive: true });
    await writeFile(
      join(skillDir, 'SKILL.md'),
      '---\nname: review\ndescription: Review\n---\n\nContent.'
    );

    const ast = createProgram([
      createSkillsBlock({
        review: { description: 'Review' },
      }),
    ]);

    const result = await resolveNativeSkills(
      ast,
      registryPath,
      join(localPath, 'test.prs'),
      localPath
    );

    const skillsBlock = result.blocks.find((b) => b.name === 'skills');
    const skillsContent = skillsBlock!.content as ObjectContent;
    const skill = skillsContent.properties['review'] as Record<string, unknown>;

    // Should still have content from SKILL.md
    const content = skill['content'] as TextContent;
    expect(content.value).toContain('Content.');
  });

  it('should include shared resources in every skill', async () => {
    // Create two skills
    const skillDir1 = join(localPath, 'skills', 'skill-a');
    const skillDir2 = join(localPath, 'skills', 'skill-b');
    await mkdir(skillDir1, { recursive: true });
    await mkdir(skillDir2, { recursive: true });
    await writeFile(join(skillDir1, 'SKILL.md'), '---\nname: skill-a\n---\n\nSkill A.');
    await writeFile(join(skillDir2, 'SKILL.md'), '---\nname: skill-b\n---\n\nSkill B.');

    // Create shared directory
    const sharedDir = join(localPath, 'shared');
    await mkdir(sharedDir, { recursive: true });
    await writeFile(join(sharedDir, 'common.txt'), 'common resource');

    const ast = createProgram([
      createSkillsBlock({
        'skill-a': { description: 'A' },
        'skill-b': { description: 'B' },
      }),
    ]);

    const result = await resolveNativeSkills(
      ast,
      registryPath,
      join(localPath, 'test.prs'),
      localPath
    );

    const skillsBlock = result.blocks.find((b) => b.name === 'skills');
    const skillsContent = skillsBlock!.content as ObjectContent;

    for (const name of ['skill-a', 'skill-b']) {
      const skill = skillsContent.properties[name] as Record<string, unknown>;
      const resources = skill['resources'] as Array<{ relativePath: string; content: string }>;
      const sharedPaths = resources.filter((r) => r.relativePath.startsWith('@shared/'));
      expect(sharedPaths).toHaveLength(1);
      expect(sharedPaths[0]!.relativePath).toBe('@shared/common.txt');
    }
  });

  it('should apply size limits to shared resources', async () => {
    // Create skill
    const skillDir = join(localPath, 'skills', 'review');
    await mkdir(skillDir, { recursive: true });
    await writeFile(
      join(skillDir, 'SKILL.md'),
      '---\nname: review\ndescription: Review\n---\n\nContent.'
    );

    // Create shared directory with empty file (should be discovered)
    const sharedDir = join(localPath, 'shared');
    await mkdir(sharedDir, { recursive: true });
    await writeFile(join(sharedDir, 'small.txt'), 'small');

    const ast = createProgram([
      createSkillsBlock({
        review: { description: 'Review' },
      }),
    ]);

    const result = await resolveNativeSkills(
      ast,
      registryPath,
      join(localPath, 'test.prs'),
      localPath
    );

    const skillsBlock = result.blocks.find((b) => b.name === 'skills');
    const skillsContent = skillsBlock!.content as ObjectContent;
    const skill = skillsContent.properties['review'] as Record<string, unknown>;
    const resources = skill['resources'] as Array<{ relativePath: string; content: string }>;

    const sharedPaths = resources.filter((r) => r.relativePath.startsWith('@shared/'));
    expect(sharedPaths).toHaveLength(1);
    expect(sharedPaths[0]!.content).toBe('small');
  });
});
