import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { ObjectContent } from '@promptscript/core';
import { Resolver } from '../resolver.js';

const META = (id: string): string => `@meta { id: "${id}" syntax: "1.6.0" }\n`;

describe('skills declared in .prs and found in .promptscript/skills', () => {
  let root: string;
  let local: string;
  async function writeSkill(name: string, frontmatter: string): Promise<void> {
    await mkdir(join(local, 'skills', name), { recursive: true });
    await writeFile(
      join(local, 'skills', name, 'SKILL.md'),
      `---\n${frontmatter}\n---\nBody of ${name}.`
    );
  }

  async function resolveProject(
    files: Record<string, string>
  ): Promise<{ errors: string[]; skills: Record<string, Record<string, unknown>> }> {
    for (const [file, content] of Object.entries(files)) {
      await writeFile(join(local, file), content);
    }
    const resolver = new Resolver({ registryPath: root, localPath: local, cache: false });
    const result = await resolver.resolve(join(local, 'project.prs'));
    const block = result.ast?.blocks.find((b) => b.name === 'skills');
    return {
      errors: result.errors.map((error) => error.message),
      skills: ((block?.content as ObjectContent | undefined)?.properties ?? {}) as Record<
        string,
        Record<string, unknown>
      >,
    };
  }

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'prs-skill-merge-'));
    local = join(root, '.promptscript');
    await writeSkill('x', 'name: x\ndescription: X from md');
    await writeSkill('y', 'name: y\ndescription: Y from md');
  });

  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it('should merge @skills from two imported fragments with the found skills', async () => {
    const { errors, skills } = await resolveProject({
      'a.prs': `${META('a')}@skills {\n  x: { description: "X from a" }\n}\n`,
      'b.prs': `${META('b')}@skills {\n  y: { description: "Y from b" }\n}\n`,
      'project.prs': `${META('project')}@use ./a\n@use ./b\n`,
    });

    expect(errors).toEqual([]);
    expect(Object.keys(skills).sort()).toEqual(['x', 'y']);
    expect(skills['x']?.['description']).toBe('X from a');
    expect(skills['y']?.['description']).toBe('Y from b');
    expect((skills['y']?.['content'] as { value: string }).value).toBe('Body of y.');
  });

  it('should still add found skills that no file declares', async () => {
    const { errors, skills } = await resolveProject({
      'skills.prs': `${META('skills')}@skills {\n  x: { description: "X from prs" }\n}\n`,
      'project.prs': `${META('project')}@use ./skills\n`,
    });

    expect(errors).toEqual([]);
    expect(skills['y']?.['description']).toBe('Y from md');
  });
});
