import { createSimpleMarkdownFormatter } from '../create-simple-formatter.js';

export type GitlabDuoVersion = 'simple' | 'multifile' | 'full';

/**
 * GitLab Duo Agent Platform target.
 *
 * Duo reads the root `AGENTS.md` file (GA in GitLab 18.8) and Agent Skills
 * from `skills/<name>/SKILL.md` (GitLab 18.10+). The skills directory sits at
 * the repository root without a dot prefix, so it overrides the default
 * `<dotDir>/skills` layout. Skills are full-mode-only; multifile output keeps
 * the single `AGENTS.md` file.
 */
export const { Formatter: GitlabDuoFormatter, VERSIONS: GITLAB_DUO_VERSIONS } =
  createSimpleMarkdownFormatter({
    name: 'gitlab-duo',
    outputPath: 'AGENTS.md',
    description: 'GitLab Duo instructions (Markdown)',
    mainFileHeader: '# AGENTS.md',
    dotDir: '.gitlab-duo',
    hasSkills: true,
    skillsInMultifile: false,
    skillsDir: 'skills',
  });
