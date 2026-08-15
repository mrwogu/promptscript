import { chmod, mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { Ajv } from 'ajv';
import type { FormatterOutput } from '@promptscript/compiler';
import {
  buildCompilationDiff,
  createCompilationDiffErrorReport,
  DIFF_SCHEMA_URL,
} from '../diff-report.js';

const MARKER = (timestamp: string, target: string): string =>
  `<!-- PromptScript ${timestamp} | source: .promptscript/project.prs | target: ${target} - do not edit -->`;

async function loadDiffSchema(): Promise<Record<string, unknown>> {
  return JSON.parse(
    await readFile(new URL('../../../../../schema/diff-v1.json', import.meta.url), 'utf8')
  ) as Record<string, unknown>;
}

async function expectValidDiffReport(report: unknown): Promise<void> {
  const schema = await loadDiffSchema();
  const validator = new Ajv({ strict: false }).compile(schema);
  expect(validator(report), JSON.stringify(validator.errors)).toBe(true);
}

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
    expect(JSON.stringify(first, null, 2)).toBe(JSON.stringify(second, null, 2));
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

  it('normalizes provenance, paths, and ownership markers', async () => {
    const projectRoot = await createProject();
    const outsidePath = `../outside-${basename(projectRoot)}.md`;
    const legacyPath = join(projectRoot, 'legacy.md');
    await writeFile(legacyPath, '> Auto-generated by PromptScript\nold\n');

    const report = await buildCompilationDiff({
      projectRoot,
      outputRoot: projectRoot,
      entryPath: join(projectRoot, '.promptscript/project.prs'),
      outputs: new Map([
        [
          'yaml.md',
          {
            path: 'yaml.md',
            content:
              '# promptscript-generated: 2026-01-01T00:00:00.000Z | source: marker.prs | target: cursor\nnew\n',
          },
        ],
        [
          'inside.md',
          createOutput('inside.md', 'inside\n', 'github', join(projectRoot, 'src/entry.prs')),
        ],
        [
          'outside-source.md',
          createOutput('outside-source.md', 'outside\n', 'github', '/outside/entry.prs'),
        ],
        [outsidePath, createOutput(outsidePath, 'outside path\n')],
        ['legacy.md', createOutput('legacy.md', 'new\n')],
      ]),
      warnings: [],
    });

    expect(report.changes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: 'yaml.md',
          target: 'cursor',
          source: 'marker.prs',
        }),
        expect.objectContaining({
          path: 'inside.md',
          source: 'src/entry.prs',
        }),
        expect.objectContaining({
          path: 'outside-source.md',
          source: '/outside/entry.prs',
        }),
        expect.objectContaining({ path: outsidePath }),
        expect.objectContaining({
          path: 'legacy.md',
          kind: 'changed',
          ownership: 'promptscript',
        }),
      ])
    );
  });

  it('treats SKILL.md output with a late marker as PromptScript-owned', async () => {
    const projectRoot = await createProject();
    const marker = '# promptscript-generated: 2026-01-01T00:00:00.000Z';
    const existingContent = [...Array.from({ length: 29 }, () => '---'), marker, 'old\n'].join(
      '\n'
    );
    await writeFile(join(projectRoot, 'SKILL.md'), existingContent);

    const report = await buildCompilationDiff({
      projectRoot,
      outputRoot: projectRoot,
      entryPath: join(projectRoot, '.promptscript/project.prs'),
      outputs: new Map([
        [
          'skill',
          createOutput(
            'SKILL.md',
            [...Array.from({ length: 29 }, () => '---'), marker, 'new\n'].join('\n')
          ),
        ],
      ]),
      warnings: [],
    });

    expect(report.changes).toEqual([
      expect.objectContaining({
        path: 'SKILL.md',
        kind: 'changed',
        ownership: 'promptscript',
      }),
    ]);
  });

  it('reports unreadable existing outputs and deduplicates warnings', async () => {
    const projectRoot = await createProject();
    await mkdir(join(projectRoot, 'directory-output'));
    const warning = {
      ruleId: 'PS4002',
      ruleName: 'unsupported-block',
      severity: 'warning' as const,
      message: 'Unsupported block.',
      suggestion: 'Remove the block.',
    };

    const report = await buildCompilationDiff({
      projectRoot,
      outputRoot: projectRoot,
      entryPath: join(projectRoot, '.promptscript/project.prs'),
      outputs: new Map([
        [
          'directory-output',
          {
            ...createOutput('directory-output', 'generated\n'),
            warnings: [
              {
                code: warning.ruleId,
                message: warning.message,
                suggestion: warning.suggestion,
              },
            ],
          },
        ],
        [
          'dot-output',
          {
            ...createOutput('.', 'root output\n'),
            warnings: [
              {
                code: warning.ruleId,
                message: warning.message,
                suggestion: warning.suggestion,
                location: { file: 'warning.prs', line: 2, column: 1 },
              },
            ],
          },
        ],
      ]),
      warnings: [warning],
    });

    expect(report.changes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: 'directory-output',
          kind: 'user-owned',
          ownership: 'unknown',
          warnings: [
            expect.objectContaining({
              code: 'DIFF0001',
              message: expect.stringContaining("Could not read existing output 'directory-output'"),
            }),
          ],
        }),
        expect.objectContaining({ path: '.', kind: 'user-owned', ownership: 'unknown' }),
      ])
    );
    expect(report.warnings).toHaveLength(2);
    expect(report.warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'PS4002', suggestion: 'Remove the block.' }),
        expect.objectContaining({
          code: 'PS4002',
          location: { file: 'warning.prs', line: 2, column: 1 },
        }),
      ])
    );
  });

  it.skipIf(process.platform === 'win32')('reports a skill script mode-only change', async () => {
    const projectRoot = await createProject();
    const scriptPath = join(projectRoot, 'check.sh');
    await writeFile(scriptPath, '#!/bin/sh\necho check\n');
    await chmod(scriptPath, 0o644);

    const report = await buildCompilationDiff({
      projectRoot,
      outputRoot: projectRoot,
      entryPath: join(projectRoot, '.promptscript/project.prs'),
      outputs: new Map([
        [
          'check.sh',
          {
            ...createOutput('check.sh', '#!/bin/sh\necho check\n'),
            mode: 0o755,
          },
        ],
      ]),
      warnings: [],
    });

    expect(report.changes).toEqual([
      expect.objectContaining({
        path: 'check.sh',
        kind: 'changed',
        ownership: 'user',
        mode: 0o755,
      }),
    ]);
    expect(report.summary).toMatchObject({ changed: 1, unchanged: 0 });
  });

  it('sorts changes and warnings with stable tie breakers', async () => {
    const projectRoot = await createProject();
    const location = (file: string, line: number, column: number) => ({
      file,
      line,
      column,
    });
    const outputWithWarning = (
      key: string,
      warning: { code: string; message: string; location: ReturnType<typeof location> }
    ): [string, FormatterOutput] => [
      key,
      {
        ...createOutput('sort.md', `${key}\n`, 'same'),
        warnings: [warning],
      },
    ];

    const report = await buildCompilationDiff({
      projectRoot,
      outputRoot: projectRoot,
      entryPath: join(projectRoot, '.promptscript/project.prs'),
      outputs: new Map<string, FormatterOutput>([
        ['target-z', createOutput('sort.md', 'target-z\n', 'z-target')],
        ['target-a', createOutput('sort.md', 'target-a\n', 'a-target')],
        outputWithWarning('warning-z', {
          code: 'Z',
          message: 'z-message',
          location: location('z.prs', 2, 2),
        }),
        outputWithWarning('warning-a', {
          code: 'A',
          message: 'z-message',
          location: location('z.prs', 2, 2),
        }),
        outputWithWarning('message-z', {
          code: 'same',
          message: 'z-message',
          location: location('z.prs', 2, 2),
        }),
        outputWithWarning('message-a', {
          code: 'same',
          message: 'a-message',
          location: location('z.prs', 2, 2),
        }),
        outputWithWarning('file-z', {
          code: 'same',
          message: 'same',
          location: location('z.prs', 2, 2),
        }),
        outputWithWarning('file-a', {
          code: 'same',
          message: 'same',
          location: location('a.prs', 2, 2),
        }),
        outputWithWarning('line-z', {
          code: 'same',
          message: 'same',
          location: location('same.prs', 2, 2),
        }),
        outputWithWarning('line-a', {
          code: 'same',
          message: 'same',
          location: location('same.prs', 1, 2),
        }),
        outputWithWarning('column-z', {
          code: 'same',
          message: 'same',
          location: location('same.prs', 1, 2),
        }),
        outputWithWarning('column-a', {
          code: 'same',
          message: 'same',
          location: location('same.prs', 1, 1),
        }),
      ]),
      warnings: [],
    });

    expect(report.changes).toHaveLength(22);
    expect(report.warnings).toHaveLength(9);
    expect(report.warnings[0]).toMatchObject({ code: 'A' });
    expect(report.warnings.at(-1)).toMatchObject({
      code: 'same',
      message: 'z-message',
    });
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

  it('reports mixed PromptScript and user hook rewrites', async () => {
    const projectRoot = await createProject();
    const hookPath = join(projectRoot, '.github/hooks/promptscript.json');
    await mkdir(join(projectRoot, '.github/hooks'), { recursive: true });
    await writeFile(
      hookPath,
      JSON.stringify({
        version: 1,
        hooks: {
          preToolUse: [
            {
              type: 'command',
              command: 'echo user',
            },
            {
              type: 'command',
              command: 'echo generated # promptscript-generated:owned',
            },
          ],
        },
      })
    );

    const report = await buildCompilationDiff({
      projectRoot,
      outputRoot: projectRoot,
      entryPath: join(projectRoot, '.promptscript/project.prs'),
      outputs: new Map([
        [
          'AGENTS.md',
          {
            ...createOutput('AGENTS.md', 'current\n', 'github', 'source.prs'),
            managedOutputFiles: ['.github/hooks/promptscript.json'],
          },
        ],
      ]),
      warnings: [],
      includeContent: true,
    });

    expect(report.changes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: '.github/hooks/promptscript.json',
          target: 'github',
          source: 'source.prs',
          kind: 'changed',
          ownership: 'user',
          content: expect.stringContaining('echo user'),
        }),
      ])
    );
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
    await expectValidDiffReport(fixture);
  });

  it('validates emitted success and resource-error reports against the schema', async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), 'promptscript-diff-schema-'));
    try {
      const successReport = await buildCompilationDiff({
        projectRoot,
        outputRoot: projectRoot,
        entryPath: join(projectRoot, '.promptscript/project.prs'),
        outputs: new Map([['new.md', createOutput('new.md', 'new\n')]]),
        warnings: [],
      });
      const resourceErrorReport = createCompilationDiffErrorReport(
        [
          {
            name: 'ResolveError',
            code: 'PS2025',
            message: 'Script file exceeds the resource size limit.',
            location: {
              file: join(projectRoot, 'skills/reviewer/SKILL.md'),
              line: 1,
              column: 1,
            },
          },
        ],
        [],
        projectRoot
      );

      await expectValidDiffReport(JSON.parse(JSON.stringify(successReport)));
      await expectValidDiffReport(JSON.parse(JSON.stringify(resourceErrorReport)));
    } finally {
      await rm(projectRoot, { recursive: true });
    }
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
        {
          name: 'ValidationError',
          code: 'PS0000',
          message: 'A validation error.',
          location: { file: '/project/other.prs', line: 2, column: 4 },
        },
        {
          name: 'OtherError',
          code: 'PS0000',
          message: 'B validation error.',
        },
      ],
      [
        {
          ruleId: 'PS2000',
          ruleName: 'example',
          severity: 'warning',
          message: 'A warning.',
          location: { file: '/project/warnings.prs', line: 1, column: 2 },
          suggestion: 'Fix it.',
        },
        {
          ruleId: 'PS1000',
          ruleName: 'example',
          severity: 'warning',
          message: 'B warning.',
        },
      ],
      '/project'
    );

    expect(report.success).toBe(false);
    expect(report.hasChanges).toBe(false);
    expect(report.errors).toEqual([
      {
        name: 'ValidationError',
        code: 'PS0000',
        message: 'A validation error.',
        location: { file: 'other.prs', line: 2, column: 4 },
      },
      {
        name: 'OtherError',
        code: 'PS0000',
        message: 'B validation error.',
      },
      {
        name: 'ParseError',
        code: 'PS0001',
        message: 'Expected a block.',
        location: { file: '.promptscript/project.prs', line: 3, column: 1 },
      },
    ]);
    expect(report.warnings).toEqual([
      {
        code: 'PS1000',
        message: 'B warning.',
      },
      {
        code: 'PS2000',
        message: 'A warning.',
        suggestion: 'Fix it.',
        location: { file: 'warnings.prs', line: 1, column: 2 },
      },
    ]);
    expect(report.changes).toEqual([]);
  });

  it('sorts errors by location when code and message match', () => {
    const report = createCompilationDiffErrorReport(
      [
        {
          name: 'ColumnTwo',
          code: 'PS3000',
          message: 'Same message.',
          location: { file: '/project/same.prs', line: 1, column: 2 },
        },
        {
          name: 'FileZ',
          code: 'PS3000',
          message: 'Same message.',
          location: { file: '/project/z.prs', line: 1, column: 1 },
        },
        {
          name: 'LineTwo',
          code: 'PS3000',
          message: 'Same message.',
          location: { file: '/project/same.prs', line: 2, column: 1 },
        },
        {
          name: 'ColumnOne',
          code: 'PS3000',
          message: 'Same message.',
          location: { file: '/project/same.prs', line: 1, column: 1 },
        },
        {
          name: 'FileA',
          code: 'PS3000',
          message: 'Same message.',
          location: { file: '/project/a.prs', line: 1, column: 1 },
        },
      ],
      [],
      '/project'
    );

    expect(report.errors.map((error) => error.name)).toEqual([
      'FileA',
      'ColumnOne',
      'ColumnTwo',
      'LineTwo',
      'FileZ',
    ]);
  });

  it('attributes removed managed files to their formatter', async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), 'promptscript-diff-owner-'));
    try {
      const stalePath = join(projectRoot, 'stale.md');
      const staleContent = '> Auto-generated by PromptScript\nstale\n';
      await writeFile(stalePath, staleContent);

      const report = await buildCompilationDiff({
        projectRoot,
        outputRoot: projectRoot,
        entryPath: join(projectRoot, '.promptscript/project.prs'),
        outputs: new Map([
          [
            'current.md',
            {
              ...createOutput('current.md', 'current\n', 'cursor', 'source.prs'),
              managedOutputFiles: ['stale.md'],
            },
          ],
        ]),
        warnings: [],
        includeContent: true,
      });

      expect(report.changes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: 'stale.md',
            target: 'cursor',
            source: 'source.prs',
            kind: 'removed',
            content: staleContent,
          }),
        ])
      );
    } finally {
      await rm(projectRoot, { recursive: true });
    }
  });

  it('uses marker identity when managed paths use Windows separators', async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), 'promptscript-diff-windows-'));
    try {
      const staleDirectory = join(projectRoot, 'stale');
      const stalePath = join(staleDirectory, 'file.md');
      const staleContent = `${MARKER('2026-01-01T00:00:00.000Z', 'github')}\nstale\n`;
      await mkdir(staleDirectory);
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
              managedOutputFiles: ['stale\\file.md'],
            },
          ],
        ]),
        warnings: [],
      });

      expect(report.changes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: 'stale/file.md',
            target: 'github',
            source: '.promptscript/project.prs',
            kind: 'removed',
            contentHash: expect.stringMatching(/^sha256-[0-9a-f]{64}$/),
          }),
        ])
      );
    } finally {
      await rm(projectRoot, { recursive: true });
    }
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
