import { afterEach, describe, expect, it, vi } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { link, mkdir, mkdtemp, readdir, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  approvalRecordPath,
  serializeApprovalRecord,
  type ApprovalRecordV1,
} from '@promptscript/core';
import {
  committedApprovalFiles,
  committedRecords,
  approvalFilesOf,
  ensureApprovalAttributes,
  findApprovalRecords,
  gitBlobId,
  gitPathsOf,
  MAX_APPROVAL_DEPTH,
  MAX_APPROVAL_ENTRIES,
  trackedApprovals,
  writeApprovalRecord,
} from './records.js';

const RECORD: ApprovalRecordV1 = {
  $schema: 'https://getpromptscript.dev/schema/approval-record/v1.json',
  prompt: 'acme-support/refund-reply',
  contentHash: `sha256-${'a'.repeat(64)}`,
  role: 'legal',
  approver: { source: 'asserted', value: '@jane' },
  createdAt: '2026-10-22T09:14:03.120Z',
};

const directories: string[] = [];

async function root(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'promptscript-records-'));
  directories.push(directory);
  return directory;
}

afterEach(async () => {
  for (const directory of directories.splice(0)) {
    await rm(directory, { recursive: true, force: true });
  }
}, 60_000);

describe('writeApprovalRecord', () => {
  it('refuses a link or a directory where the record goes', async () => {
    const project = await root();
    const path = join(project, approvalRecordPath(RECORD));
    await mkdir(path, { recursive: true });

    expect(() => writeApprovalRecord(project, RECORD)).toThrow(
      expect.objectContaining({
        code: 'PS5109',
        message: expect.stringContaining('exists and is not a regular file'),
      })
    );
  });

  it('refuses a file where a directory of the path goes', async () => {
    const project = await root();
    await mkdir(join(project, '.promptscript/approvals'), { recursive: true });
    await writeFile(join(project, '.promptscript/approvals/legal'), 'x');

    expect(() => writeApprovalRecord(project, RECORD)).toThrow(
      expect.objectContaining({
        code: 'PS5109',
        message: expect.stringContaining('is a symbolic link or not a directory'),
      })
    );
  });

  it('refuses a symlinked .promptscript directory', async () => {
    const project = await root();
    const outside = await root();
    await symlink(outside, join(project, '.promptscript'));

    expect(() => writeApprovalRecord(project, RECORD)).toThrow(
      expect.objectContaining({ code: 'PS5109' })
    );
    expect(await readdir(outside)).toEqual([]);
  });
});

describe('ensureApprovalAttributes', () => {
  it('warns on a linked .gitattributes and never follows it', async () => {
    const project = await root();
    await mkdir(join(project, '.promptscript/approvals'), { recursive: true });
    await symlink(
      join(project, 'nowhere'),
      join(project, '.promptscript/approvals/.gitattributes')
    );

    const warning = ensureApprovalAttributes(project);

    expect(warning?.message).toContain(
      '.gitattributes is a symbolic link, so its rules do not apply'
    );
    expect(await readdir(project)).toEqual(['.promptscript']);
  });

  it('accepts an existing file with the rule', async () => {
    const project = await root();
    await mkdir(join(project, '.promptscript/approvals'), { recursive: true });
    await writeFile(join(project, '.promptscript/approvals/.gitattributes'), 'a b\r\n* -text\r\n');

    expect(ensureApprovalAttributes(project)).toBeUndefined();
  });
});

describe('findApprovalRecords', () => {
  it('finds nothing without an approvals directory', async () => {
    const project = await root();

    expect(findApprovalRecords(project)).toEqual({ found: [], warnings: [] });
  });

  it('refuses a symlinked approvals directory', async () => {
    const project = await root();
    const outside = await root();
    await mkdir(join(project, '.promptscript'));
    await symlink(outside, join(project, '.promptscript/approvals'));

    expect(() => findApprovalRecords(project)).toThrow(expect.objectContaining({ code: 'PS5109' }));
  });

  it('marks oversized and plain invalid files and skips other names', async () => {
    const project = await root();
    const directory = join(project, '.promptscript/approvals/legal');
    await mkdir(directory, { recursive: true });
    await writeFile(join(directory, 'big.json'), 'x'.repeat(64 * 1024 + 1));
    await writeFile(join(directory, 'empty.json'), '');
    await writeFile(join(directory, 'record.json.tmp'), '');

    const { found } = findApprovalRecords(project);

    expect(found).toEqual([
      { path: '.promptscript/approvals/legal/big.json', problem: 'is larger than 65536 bytes' },
      {
        path: '.promptscript/approvals/legal/empty.json',
        problem: 'is not a v1 approval record in the exact form prs approve writes',
      },
    ]);
  });

  it(`reads ${MAX_APPROVAL_DEPTH} directory levels and no deeper`, async () => {
    const project = await root();
    const levels = Array.from({ length: MAX_APPROVAL_DEPTH + 1 }, (_, i) => `d${i}`);
    const deepest = join(project, '.promptscript/approvals', ...levels);
    await mkdir(deepest, { recursive: true });
    await writeFile(join(deepest, '..', 'last.json'), '');
    await writeFile(join(deepest, 'deeper.json'), '');

    const { found, warnings } = findApprovalRecords(project);

    expect(found.map((entry) => entry.path.split('/').pop())).toEqual(['last.json']);
    expect(warnings.map((warning) => warning.message)).toEqual([
      expect.stringContaining(`is more than ${MAX_APPROVAL_DEPTH} levels below`),
    ]);
  });

  // Writes 10001 entries, which takes seconds on a loaded machine.
  it(`reads at most ${MAX_APPROVAL_ENTRIES} files and directories`, () => {
    const project = mkdtempSync(join(tmpdir(), 'promptscript-records-'));
    directories.push(project);
    const directory = join(project, '.promptscript/approvals/legal');
    mkdirSync(directory, { recursive: true });
    for (let i = 0; i < 5000; i++) mkdirSync(join(directory, `d${String(i).padStart(4, '0')}`));
    for (let i = 0; i <= 5000; i++) {
      writeFileSync(join(directory, `f${String(i).padStart(4, '0')}.json`), '');
    }

    const { found, warnings } = findApprovalRecords(project);

    // The role directory is the first entry, then 5000 directories and 4999 files.
    expect(found).toHaveLength(MAX_APPROVAL_ENTRIES - 5001);
    expect(warnings.map((warning) => warning.message)).toEqual([
      expect.stringContaining(
        `Reading stopped after ${MAX_APPROVAL_ENTRIES} files and directories`
      ),
    ]);
  }, 60_000);
});

describe('Git path identity', () => {
  it('maps a record file to the path Git tracks for the same file', async () => {
    const project = await root();
    const directory = join(project, '.promptscript/approvals/legal');
    await mkdir(directory, { recursive: true });
    await mkdir(join(project, 'other'));
    await writeFile(join(directory, 'a.json'), '{}');
    await writeFile(join(directory, 'b.json'), '{}');
    await link(join(directory, 'a.json'), join(project, 'other/a.json'));
    const found = [
      { path: '.promptscript/approvals/legal/a.json' },
      { path: '.promptscript/approvals/legal/b.json' },
    ];
    const tracked = new Map([
      ['other/a.json', 'blob'],
      ['.promptscript/approvals/legal/gone.json', 'blob'],
    ]);

    const paths = gitPathsOf(project, found, tracked);

    expect([...paths]).toEqual([
      ['.promptscript/approvals/legal/a.json', 'other/a.json'],
      ['.promptscript/approvals/legal/b.json', undefined],
    ]);
  });

  it('lists the tracked record paths with their blob ids and refuses a project outside Git', async () => {
    const project = await root();
    execFileSync('git', ['init', '-q'], { cwd: project });
    await mkdir(join(project, '.promptscript/approvals/legal'), { recursive: true });
    await writeFile(join(project, '.promptscript/approvals/legal/a.json'), '{}');
    await symlink('a.json', join(project, '.promptscript/approvals/legal/link.json'));
    execFileSync('git', ['add', '-A'], { cwd: project });
    const blob = execFileSync('git', ['hash-object', '.promptscript/approvals/legal/a.json'], {
      cwd: project,
      encoding: 'utf-8',
    }).trim();

    const tracked = await trackedApprovals(project);

    expect(tracked).toEqual(new Map([['.promptscript/approvals/legal/a.json', blob]]));
    try {
      vi.stubEnv('GIT_DIR', join(project, 'missing'));
      await expect(trackedApprovals(project)).rejects.toMatchObject({ code: 'PS5108' });
      vi.stubEnv('PATH', '');
      await expect(trackedApprovals(project)).rejects.toMatchObject({
        code: 'PS5108',
        message: expect.not.stringContaining('..'),
      });
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it(`reads every Git path, also past ${MAX_APPROVAL_ENTRIES}`, async () => {
    const project = await root();
    execFileSync('git', ['init', '-q'], { cwd: project });
    const blob = execFileSync('git', ['hash-object', '-w', '--stdin'], {
      cwd: project,
      input: '',
      encoding: 'utf-8',
    }).trim();
    const lines = Array.from(
      { length: MAX_APPROVAL_ENTRIES + 1 },
      (_, i) => `100644 ${blob}\t.promptscript/approvals/legal/${String(i).padStart(5, '0')}.json\n`
    );
    execFileSync('git', ['update-index', '--index-info'], { cwd: project, input: lines.join('') });

    const tracked = await trackedApprovals(project);

    expect(tracked.size).toBe(MAX_APPROVAL_ENTRIES + 1);
  }, 60_000);

  it.each(['sha1', 'sha256'])(
    'computes the blob id Git gives a file in a %s repository',
    async (format) => {
      const project = await root();
      execFileSync('git', ['init', '-q', `--object-format=${format}`], { cwd: project });
      await writeFile(join(project, 'record.json'), '{\n  "a": "ü"\n}\n');
      const expected = execFileSync('git', ['hash-object', 'record.json'], {
        cwd: project,
        encoding: 'utf-8',
      }).trim();

      const id = gitBlobId(Buffer.from('{\n  "a": "ü"\n}\n'), expected.length);

      expect(id).toBe(expected);
    }
  );
});

describe('committedRecords', () => {
  const git = (cwd: string, ...args: string[]): string =>
    execFileSync(
      'git',
      [
        '-c',
        'user.email=t@example.com',
        '-c',
        'user.name=T',
        '-c',
        'commit.gpgsign=false',
        ...args,
      ],
      { cwd, encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'] }
    );

  it('reads the records of one prompt and role as committed, never the disk', async () => {
    const project = await root();
    git(project, 'init', '-q');
    const path = approvalRecordPath(RECORD);
    const other = approvalRecordPath({ ...RECORD, prompt: 'acme-support/other' });
    for (const file of [path, other]) {
      await mkdir(join(project, file, '..'), { recursive: true });
      await writeFile(join(project, file), serializeApprovalRecord(RECORD));
    }
    await symlink('x.json', join(project, path, '..', 'link.json'));
    await writeFile(join(project, path, '..', 'big.json'), 'x'.repeat(64 * 1024 + 1));
    git(project, 'add', '-A');
    git(project, 'commit', '-q', '-m', 'records');
    await writeFile(join(project, path), '{}');

    const files = await committedApprovalFiles(project);
    const found = await committedRecords(
      project,
      approvalFilesOf(files, [RECORD.prompt], ['legal', 'security'])
    );

    expect(found.sort((a, b) => a.path.localeCompare(b.path))).toEqual([
      { path: path.replace(/[^/]+$/, 'big.json') },
      { path, record: RECORD },
    ]);
  });

  it('refuses a record Git cannot read with PS5108, not as a missing approval', async () => {
    const project = await root();
    git(project, 'init', '-q');
    const path = approvalRecordPath(RECORD);
    await mkdir(join(project, path, '..'), { recursive: true });
    await writeFile(join(project, path), serializeApprovalRecord(RECORD));
    git(project, 'add', '-A');
    git(project, 'commit', '-q', '-m', 'records');
    const files = await committedApprovalFiles(project);
    const gone = [{ path, blob: '0'.repeat(40), size: 10 }];

    await expect(committedRecords(project, gone)).rejects.toMatchObject({
      code: 'PS5108',
      message: expect.stringContaining('0000000000'),
    });
    try {
      vi.stubEnv('PATH', '');
      await expect(committedRecords(project, files)).rejects.toMatchObject({
        code: 'PS5108',
        message: expect.stringContaining('git is not installed'),
      });
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it('refuses a project without a commit, or without git, with PS5108', async () => {
    const project = await root();
    git(project, 'init', '-q');

    await expect(committedApprovalFiles(project)).rejects.toMatchObject({ code: 'PS5108' });
    try {
      vi.stubEnv('PATH', '');
      await expect(committedApprovalFiles(project)).rejects.toMatchObject({ code: 'PS5108' });
    } finally {
      vi.unstubAllEnvs();
    }
  });
});
