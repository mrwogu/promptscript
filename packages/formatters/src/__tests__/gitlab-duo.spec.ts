import { describe, expect, it } from 'vitest';
import { GITLAB_DUO_VERSIONS, GitlabDuoFormatter } from '../formatters/gitlab-duo.js';
import { createAstBuilders } from './ast-builders.js';

const { createLoc, createBlock, createProgram } = createAstBuilders('gitlab-duo.prs');

describe('GitLab Duo formatter', () => {
  it('emits a single AGENTS.md file for simple and multifile versions', () => {
    const formatter = new GitlabDuoFormatter();
    const ast = createProgram([
      createBlock(
        'identity',
        { type: 'TextContent', value: 'GitLab Duo project instructions.', loc: createLoc(2) },
        2
      ),
    ]);

    for (const version of ['simple', 'multifile'] as const) {
      const output = formatter.format(ast, { version });
      expect(output.path).toBe('AGENTS.md');
      expect(output.additionalFiles ?? []).toHaveLength(0);
    }

    expect(GITLAB_DUO_VERSIONS.simple).toEqual({
      name: 'simple',
      description: 'Single AGENTS.md file',
      outputPath: 'AGENTS.md',
    });
    expect(GITLAB_DUO_VERSIONS.multifile).toEqual({
      name: 'multifile',
      description: 'AGENTS.md + skills/<name>/SKILL.md',
      outputPath: 'AGENTS.md',
    });
    expect(GITLAB_DUO_VERSIONS.full).toEqual({
      name: 'full',
      description: 'Multifile + skills/<name>/SKILL.md',
      outputPath: 'AGENTS.md',
    });
  });

  it.each([
    [undefined, 'skills/audit/SKILL.md'],
    ['skills/marketing/audit', 'skills/marketing/audit/SKILL.md'],
    ['../..', 'skills/audit/SKILL.md'],
  ] as const)('emits a full-mode skill for output directory %s', (outputDir, expectedPath) => {
    const formatter = new GitlabDuoFormatter();
    const ast = createProgram([
      createBlock(
        'skills',
        {
          type: 'ObjectContent',
          properties: {
            audit: {
              description: 'Marketing audit',
              content: 'Audit the marketing setup.',
              ...(outputDir ? { __outputDir: outputDir } : {}),
            },
          },
          loc: createLoc(2),
        },
        2
      ),
    ]);

    const output = formatter.format(ast, { version: 'full' });
    const skillFile = output.additionalFiles?.find((file) => file.path.endsWith('SKILL.md'));

    expect(output.path).toBe('AGENTS.md');
    expect(skillFile?.path).toBe(expectedPath);
    expect(skillFile?.content).toContain('name: audit');
    expect(skillFile?.content).toContain('description: Marketing audit');
    expect(skillFile?.content).toContain('Audit the marketing setup.');
  });

  it('reports the Duo skill path and file name', () => {
    const formatter = new GitlabDuoFormatter();

    expect(formatter.getSkillBasePath()).toBe('skills');
    expect(formatter.getSkillFileName()).toBe('SKILL.md');
  });
});
