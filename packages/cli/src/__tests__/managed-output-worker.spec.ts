import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { lstat, mkdtemp, readFile, rm, stat, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  MANAGED_OUTPUT_WORKER_COMMAND,
  performManagedOutputOperation,
  runManagedOutputWorkerProtocol,
  wasDispatchedAsManagedOutputWorker,
} from '../managed-output-worker.js';

const workerPath = fileURLToPath(new URL('../managed-output-worker.ts', import.meta.url));

// The spawned worker runs the TypeScript source through a bare Node child,
// which only works with native type stripping (Node 22.18+/23.6+). On older
// Node the child exits with ERR_UNKNOWN_FILE_EXTENSION, so skip there.
const canStripTypes = (process.features as { typescript?: string | false }).typescript === 'strip';

interface WorkerResult {
  stdout: string;
  code: number;
}

/**
 * Run the worker protocol in-process exactly the way a spawned worker would:
 * cwd pinned to the directory, content (when needed) supplied instead of
 * fd 0, status word captured from stdout. Child processes escape the
 * coverage instrumenter, so every operation is exercised here in-process.
 */
async function runWorker(
  cwd: string,
  opArgs: string[],
  stdinContent?: string
): Promise<WorkerResult> {
  const originalWrite = process.stdout.write.bind(process.stdout);
  let stdout = '';
  process.stdout.write = ((chunk: string | Uint8Array): boolean => {
    stdout += typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString('utf-8');
    return true;
  }) as typeof process.stdout.write;
  const originalCwd = process.cwd();
  let code: number;
  try {
    process.chdir(cwd);
    code = runManagedOutputWorkerProtocol(
      opArgs,
      stdinContent === undefined ? undefined : Buffer.from(stdinContent, 'utf-8')
    );
  } finally {
    process.chdir(originalCwd);
    process.stdout.write = originalWrite;
  }
  return { stdout, code };
}

function sha256(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

describe('managed output worker protocol', () => {
  const temporaryDirectories: string[] = [];

  afterEach(async () => {
    await Promise.all(
      temporaryDirectories
        .splice(0)
        .map((directory) => rm(directory, { recursive: true, force: true }))
    );
  });

  async function createProject(prefix: string): Promise<string> {
    const project = await mkdtemp(join(tmpdir(), prefix));
    temporaryDirectories.push(project);
    return project;
  }

  it('rejects unknown operations with a non-zero exit', async () => {
    const project = await createProject('worker-unknown-op-');
    const result = await runWorker(project, ['explode', 'x', '1', '2']);
    expect(result.code).toBe(1);
    expect(result.stdout).toBe('');
  });

  it('rejects incomplete arguments with a non-zero exit', async () => {
    const project = await createProject('worker-incomplete-');
    const result = await runWorker(project, ['mkdir']);
    expect(result.code).toBe(1);
  });

  it('reports no operation when called without an operation word', () => {
    expect(runManagedOutputWorkerProtocol([])).toBe(1);
  });

  it('throws on unknown operations when called in-process', () => {
    expect(() => performManagedOutputOperation('explode', ['x', '1', '2'])).toThrow(
      /Unknown managed output worker operation/
    );
  });

  it('creates a directory and tolerates an existing one', async () => {
    const project = await createProject('worker-mkdir-');
    const directory = await stat(project);

    const first = await runWorker(project, [
      'mkdir',
      'hooks',
      String(directory.dev),
      String(directory.ino),
    ]);
    expect(first.stdout).toBe('ready');
    expect(first.code).toBe(0);
    expect((await lstat(join(project, 'hooks'))).isDirectory()).toBe(true);

    const second = await runWorker(project, [
      'mkdir',
      'hooks',
      String(directory.dev),
      String(directory.ino),
    ]);
    expect(second.stdout).toBe('ready');
  });

  it('skips mkdir when the directory identity does not match', async () => {
    const project = await createProject('worker-mkdir-skip-');
    const result = await runWorker(project, ['mkdir', 'hooks', '1', '2']);
    expect(result.stdout).toBe('skipped');
    expect(result.code).toBe(0);
  });

  it('refuses a symlink masquerading as a directory', async () => {
    const project = await createProject('worker-mkdir-symlink-');
    const outside = await createProject('worker-mkdir-outside-');
    await symlink(outside, join(project, 'escaped'));
    const directory = await stat(project);

    const result = await runWorker(project, [
      'mkdir',
      'escaped',
      String(directory.dev),
      String(directory.ino),
    ]);
    expect(result.stdout).toBe('skipped');
  });

  it('creates a file with the requested mode and never clobbers', async () => {
    const project = await createProject('worker-create-');
    const directory = await stat(project);

    const created = await runWorker(
      project,
      ['create', 'run.sh', String(directory.dev), String(directory.ino), '493'],
      'hello'
    );
    expect(created.stdout).toBe('created');
    expect(created.code).toBe(0);
    expect(await readFile(join(project, 'run.sh'), 'utf-8')).toBe('hello');
    expect((await lstat(join(project, 'run.sh'))).mode & 0o777).toBe(0o755);

    const exists = await runWorker(
      project,
      ['create', 'run.sh', String(directory.dev), String(directory.ino), '493'],
      'hello'
    );
    expect(exists.stdout).toBe('skipped');
    expect(await readFile(join(project, 'run.sh'), 'utf-8')).toBe('hello');
  });

  it('rewrites a file only when its content still matches', async () => {
    const project = await createProject('worker-rewrite-');
    const directory = await stat(project);
    await writeFile(join(project, 'hooks.json'), 'old', { mode: 0o644 });
    const file = await lstat(join(project, 'hooks.json'));

    const stale = await runWorker(
      project,
      [
        'rewrite',
        'hooks.json',
        String(directory.dev),
        String(directory.ino),
        String(file.dev),
        String(file.ino),
        sha256('different'),
        '',
      ],
      'new'
    );
    expect(stale.stdout).toBe('skipped');
    expect(await readFile(join(project, 'hooks.json'), 'utf-8')).toBe('old');

    const rewritten = await runWorker(
      project,
      [
        'rewrite',
        'hooks.json',
        String(directory.dev),
        String(directory.ino),
        String(file.dev),
        String(file.ino),
        sha256('old'),
        '420',
      ],
      'new'
    );
    expect(rewritten.stdout).toBe('rewritten');
    expect(await readFile(join(project, 'hooks.json'), 'utf-8')).toBe('new');
    expect((await lstat(join(project, 'hooks.json'))).mode & 0o777).toBe(0o644);
  });

  it('unlinks a file with a verified identity and content hash', async () => {
    const project = await createProject('worker-unlink-');
    const directory = await stat(project);
    await writeFile(join(project, 'stale.md'), 'old');
    const file = await lstat(join(project, 'stale.md'));

    const mismatch = await runWorker(project, [
      'unlink',
      'stale.md',
      String(directory.dev),
      String(directory.ino),
      String(file.dev),
      String(file.ino),
      sha256('different'),
    ]);
    expect(mismatch.stdout).toBe('skipped');

    const removed = await runWorker(project, [
      'unlink',
      'stale.md',
      String(directory.dev),
      String(directory.ino),
      String(file.dev),
      String(file.ino),
      sha256('old'),
    ]);
    expect(removed.stdout).toBe('removed');
    await expect(readFile(join(project, 'stale.md'), 'utf-8')).rejects.toMatchObject({
      code: 'ENOENT',
    });
  });

  it('never follows a symlink during guarded unlink', async () => {
    const project = await createProject('worker-unlink-symlink-');
    const outside = await createProject('worker-unlink-outside-');
    await writeFile(join(outside, 'secret.md'), 'keep');
    await symlink(join(outside, 'secret.md'), join(project, 'link.md'));
    const directory = await stat(project);
    const link = await lstat(join(project, 'link.md'));

    const result = await runWorker(project, [
      'unlink',
      'link.md',
      String(directory.dev),
      String(directory.ino),
      String(link.dev),
      String(link.ino),
    ]);
    expect(result.stdout).toBe('skipped');
    expect(await readFile(join(outside, 'secret.md'), 'utf-8')).toBe('keep');
  });

  it('refuses traversal names', async () => {
    const project = await createProject('worker-traversal-');
    const outside = await createProject('worker-traversal-outside-');
    await writeFile(join(outside, 'keep.md'), 'keep');
    const directory = await stat(project);

    for (const name of ['..', '.', 'a/b', 'a\\b']) {
      const result = await runWorker(project, [
        'unlink',
        name,
        String(directory.dev),
        String(directory.ino),
        '1',
        '2',
      ]);
      expect(result.stdout).toBe('skipped');
    }
    expect(await readFile(join(outside, 'keep.md'), 'utf-8')).toBe('keep');
  });

  it('skips unlink when the file vanished before the operation', async () => {
    const project = await createProject('worker-unlink-missing-');
    const directory = await stat(project);

    const result = await runWorker(project, [
      'unlink',
      'missing.md',
      String(directory.dev),
      String(directory.ino),
      '1',
      '2',
    ]);

    expect(result.stdout).toBe('skipped');
    expect(result.code).toBe(0);
  });

  it('skips rewrite when the directory identity does not match', async () => {
    const project = await createProject('worker-rewrite-unpinned-');
    await writeFile(join(project, 'hooks.json'), 'old');

    const result = await runWorker(
      project,
      ['rewrite', 'hooks.json', '1', '2', '3', '4', sha256('old'), ''],
      'new'
    );

    expect(result.stdout).toBe('skipped');
    expect(await readFile(join(project, 'hooks.json'), 'utf-8')).toBe('old');
  });

  it('skips rewrite when the file vanished before the operation', async () => {
    const project = await createProject('worker-rewrite-missing-');
    const directory = await stat(project);

    const result = await runWorker(
      project,
      [
        'rewrite',
        'missing.json',
        String(directory.dev),
        String(directory.ino),
        '1',
        '2',
        sha256('x'),
        '',
      ],
      'new'
    );

    expect(result.stdout).toBe('skipped');
    expect(result.code).toBe(0);
  });

  it('skips rewrite when the file identity does not match', async () => {
    const project = await createProject('worker-rewrite-identity-');
    const directory = await stat(project);
    await writeFile(join(project, 'hooks.json'), 'old');
    const file = await lstat(join(project, 'hooks.json'));

    const result = await runWorker(
      project,
      [
        'rewrite',
        'hooks.json',
        String(directory.dev),
        String(directory.ino),
        String(file.dev),
        '424242',
        sha256('old'),
        '',
      ],
      'new'
    );

    expect(result.stdout).toBe('skipped');
    expect(await readFile(join(project, 'hooks.json'), 'utf-8')).toBe('old');
  });

  it('skips create when the directory identity does not match', async () => {
    const project = await createProject('worker-create-unpinned-');

    const result = await runWorker(project, ['create', 'run.sh', '1', '2', '493'], 'hello');

    expect(result.stdout).toBe('skipped');
    expect(result.code).toBe(0);
    await expect(readFile(join(project, 'run.sh'), 'utf-8')).rejects.toMatchObject({
      code: 'ENOENT',
    });
  });

  it.skipIf(!canStripTypes)(
    'runs the spawned worker end to end via the hidden command',
    async () => {
      const project = await createProject('worker-spawned-');
      const directory = await stat(project);

      const result = await new Promise<WorkerResult>((resolve, reject) => {
        const child = spawn(
          process.execPath,
          [
            workerPath,
            MANAGED_OUTPUT_WORKER_COMMAND,
            'mkdir',
            'hooks',
            String(directory.dev),
            String(directory.ino),
          ],
          { cwd: project, stdio: ['pipe', 'pipe', 'pipe'] }
        );
        let stdout = '';
        child.stdout.setEncoding('utf-8');
        child.stdout.on('data', (chunk: string) => {
          stdout += chunk;
        });
        child.on('error', reject);
        child.on('close', (code) => {
          resolve({ stdout, code: code ?? 1 });
        });
        child.stdin.end();
      });

      expect(result.code).toBe(0);
      expect(result.stdout).toBe('ready');
      expect((await lstat(join(project, 'hooks'))).isDirectory()).toBe(true);
    }
  );

  it('dispatches the hidden command from argv at import time', async () => {
    const originalArgv = process.argv;
    const originalExitCode = process.exitCode;
    vi.resetModules();
    process.argv = [originalArgv[0]!, originalArgv[1]!, MANAGED_OUTPUT_WORKER_COMMAND, 'mkdir'];
    try {
      const worker = await import('../managed-output-worker.js');
      expect(worker.wasDispatchedAsManagedOutputWorker()).toBe(true);
      expect(process.exitCode).toBe(1);

      // The CLI runner must return without parsing the worker arguments.
      const cli = await import('../cli.js');
      await expect(cli.run()).resolves.toBeUndefined();
    } finally {
      process.argv = originalArgv;
      process.exitCode = originalExitCode;
    }
    expect(wasDispatchedAsManagedOutputWorker()).toBe(false);
  });
});
