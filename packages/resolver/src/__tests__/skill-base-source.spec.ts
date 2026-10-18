import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Resolver } from '../resolver.js';

describe('skill base source', () => {
  let directory: string;

  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), 'promptscript-skill-base-source-'));
  });

  afterEach(async () => {
    await rm(directory, { recursive: true, force: true });
  });

  it('records the defining file and keeps it through @extend', async () => {
    const corePath = join(directory, '@core', 'skills.prs');
    await mkdir(join(directory, '@core'));
    await writeFile(
      corePath,
      `
@meta { id: "@core/skills" syntax: "1.5.0" }
@skills {
  review: {
    description: "Base review"
    __baseSource: "@team/fake.prs"
  }
  notes: "plain text"
}
`
    );
    const projectPath = join(directory, 'project.prs');
    await writeFile(
      projectPath,
      `
@meta { id: "project" syntax: "1.5.0" }
@use @core/skills
@extend skills.review {
  description: "Project review"
  __baseSource: "@project/fake.prs"
}
`
    );

    const resolver = new Resolver({ registryPath: directory, localPath: directory, cache: false });
    const result = await resolver.resolve(projectPath);
    const skills = result.ast?.blocks.find((block) => block.name === 'skills');

    expect(result.errors).toEqual([]);
    expect(skills?.content).toMatchObject({
      properties: {
        review: { description: 'Project review', __baseSource: corePath },
        notes: 'plain text',
      },
    });
  });
});
