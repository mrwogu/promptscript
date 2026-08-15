import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import type { FormatterOutput } from '@promptscript/compiler';
import {
  buildCompilationDiff,
  createCompilationDiffErrorReport,
  DIFF_SCHEMA_URL,
} from '../diff-report.js';

const MARKER = (timestamp: string, target: string): string =>
  `<!-- PromptScript ${timestamp} | source: .promptscript/project.prs | target: ${target} - do not edit -->`;

function createOutput(
  path: string,
  content: string,
  target = 'github',
  source = '.promptscript/project.prs'
): FormatterOutput {
  return { path, content, target, source };
}

describe('buildCompilationDiff', () => {
  const temporaryDirectories: string[] = [];

  afterEach(async () => {
    await Promise.all(
      temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true }))
    );
  });

  async function createProject(): Promise<string> {
    const projectRoot = await mkdtemp(join(tmpdir(), 'promptscript-diff-'));
    temporaryDirectories.push(projectRoot);
    return projectRoot;
  }

  it('reports deterministic semantic changes and optional canonical content', async () => {
    const projectRoot = await createProject();
    await writeFile(
      join(projectRoot, 'changed.md'),
      `${MARKER('2026-01-01T00:00:00.000Z', 'github')}\nold\n`
    );
    await writeFile(join(projectRoot, 'user.md'), 'user-owned\n');
    await writeFile(
      join(projectRoot, 'same.md'),
      `${MARKER('2026-01-01T00:00:00.000Z', 'github')}\nsame\n`
    );

    const outputs = new Map<string, FormatterOutput>([
      [
        'changed.md',
        createOutput('changed.md', `${MARKER('2026-02-01T00:00:00.000Z', 'github')}\nnew\n`),
      ],
      [
        'added.md',
        createOutput('added.md', `${MARKER('2026-02-01T00:00:00.000Z', 'github')}\nadded\n`),
      ],
      [
        'user.md',
        createOutput('user.md', `${MARKER('2026-02-01T00:00:00.000Z', 'github')}\nreplacement\n`),
      ],
      [
        'same.md',
        createOutput('same.md', `${MARKER('2026-02-01T00:00:00.000Z', 'github')}\nsame\n`),
      ],
    ]);

    const first = await buildCompilationDiff({
      projectRoot,
      outputRoot: projectRoot,
      entryPath: join(projectRoot, '.promptscript/project.prs'),
      outputs,
      warnings: [],
      includeContent: true,
    });
    const second = await buildCompilationDiff({
      projectRoot,
      outputRoot: projectRoot,
      entryPath: join(projectRoot, '.promptscript/project.prs'),
      outputs,
      warnings: [],
      includeContent: true,
    });

    expect(first).toEqual(second);
    expect(first.$schema).toBe(DIFF_SCHEMA_URL);
    expect(first.contentIncluded).toBe(true);
    expect(first.changes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: 'added.md', kind: 'added', ownership: 'promptscript' }),
        expect.objectContaining({ path: 'changed.md', kind: 'changed', ownership: 'promptscript' }),
        expect.objectContaining({ path: 'user.md', kind: 'user-owned', ownership: 'user' }),
      ])
    );
    expect(first.changes.find((change) => change.path === 'added.md')?.content).toBe('added\n');
    expect(first.changes.find((change) => change.path === 'added.md')?.contentHash).toMatch(
      /^sha256-[0-9a-f]{64}$/
    );
    expect(first.summary).toMatchObject({
      total: 3,
      added: 1,
      changed: 1,
      userOwned: 1,
      unchanged: 1,
    });
  });

  it('reports unsupported formatter warnings as structured changes', async () => {
    const projectRoot = await createProject();
    const report = await buildCompilationDiff({
      projectRoot,
      outputRoot: projectRoot,
      entryPath: join(projectRoot, '.promptscript/project.prs'),
      outputs: new Map([
        [
          'AGENTS.md',
          {
            ...createOutput('AGENTS.md', 'generated\n', 'hermes'),
            warnings: [
              {
                code: 'PS4002',
                message: 'Hermes cannot emit @agents.',
                location: {
                  file: join(projectRoot, '.promptscript/project.prs'),
                  line: 4,
                  column: 2,
                },
              },
            ],
          },
        ],
      ]),
      warnings: [],
    });

    expect(report.unsupported).toHaveLength(1);
    expect(report.unsupported[0]).toMatchObject({
      target: 'hermes',
      path: 'AGENTS.md',
      kind: 'unsupported',
      source: '.promptscript/project.prs',
      location: { file: '.promptscript/project.prs', line: 4, column: 2 },
    });
    expect(report.summary.unsupported).toBe(1);
  });

  it('reports obsolete managed outputs without deleting them', async () => {
    const projectRoot = await createProject();
    const managedDirectory = join(projectRoot, '.managed');
    const stalePath = join(managedDirectory, 'stale.md');
    await mkdir(managedDirectory);
    const staleContent = `${MARKER('2026-01-01T00:00:00.000Z', 'github')}\nstale\n`;
    await writeFile(stalePath, staleContent);

    const report = await buildCompilationDiff({
      projectRoot,
      outputRoot: projectRoot,
      entryPath: join(projectRoot, '.promptscript/project.prs'),
      outputs: new Map([
        [
          'current.md',
          {
            ...createOutput('current.md', 'current\n'),
            managedOutputDirectories: ['.managed'],
          },
        ],
      ]),
      warnings: [],
      includeContent: true,
    });

    expect(report.changes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: '.managed/stale.md',
          kind: 'removed',
          ownership: 'promptscript',
          content: 'stale\n',
        }),
      ])
    );
    await expect(readFile(stalePath, 'utf8')).resolves.toBe(staleContent);
  });
});

describe('createCompilationDiffErrorReport', () => {
  it('keeps a versioned JSON fixture aligned with the report contract', async () => {
    const fixture = JSON.parse(
      await readFile(new URL('./fixtures/diff-report-v1.json', import.meta.url), 'utf8')
    ) as Record<string, unknown>;

    expect(fixture).toMatchObject({
      $schema: DIFF_SCHEMA_URL,
      version: 1,
      contentIncluded: false,
      success: true,
      changes: expect.any(Array),
      unsupported: expect.any(Array),
      warnings: expect.any(Array),
      errors: expect.any(Array),
      summary: expect.any(Object),
    });
  });

  it('keeps compilation errors separate from a valid change report', () => {
    const report = createCompilationDiffErrorReport(
      [
        {
          name: 'ParseError',
          code: 'PS0001',
          message: 'Expected a block.',
          location: { file: '/project/.promptscript/project.prs', line: 3, column: 1 },
        },
      ],
      [],
      '/project'
    );

    expect(report.success).toBe(false);
    expect(report.hasChanges).toBe(false);
    expect(report.errors).toEqual([
      {
        name: 'ParseError',
        code: 'PS0001',
        message: 'Expected a block.',
        location: { file: '.promptscript/project.prs', line: 3, column: 1 },
      },
    ]);
    expect(report.changes).toEqual([]);
  });

  it('does not write while building a report', async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), 'promptscript-diff-readonly-'));
    try {
      const before = await readdir(projectRoot);
      const report = await buildCompilationDiff({
        projectRoot,
        outputRoot: projectRoot,
        entryPath: join(projectRoot, '.promptscript/project.prs'),
        outputs: new Map([['new.md', createOutput('new.md', 'new\n')]]),
        warnings: [],
      });

      expect(report.success).toBe(true);
      await expect(readdir(projectRoot)).resolves.toEqual(before);
    } finally {
      await rm(projectRoot, { recursive: true });
    }
  });
});
