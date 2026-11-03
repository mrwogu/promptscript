import { afterEach, describe, expect, it, vi } from 'vitest';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const { spawnCalls } = vi.hoisted(() => ({ spawnCalls: { count: 0 } }));

// Count worker processes while still running the real worker.
vi.mock('node:child_process', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:child_process')>();
  return {
    ...actual,
    spawn: ((...args: Parameters<typeof actual.spawn>) => {
      spawnCalls.count++;
      return actual.spawn(...args);
    }) as typeof actual.spawn,
  };
});

const { createHookOutputSafely } = await import('../managed-output-cleanup.js');

const canStripTypes = (process.features as { typescript?: string | false }).typescript === 'strip';

describe('guarded creates share one worker process', () => {
  const directories: string[] = [];

  afterEach(async () => {
    for (const directory of directories.splice(0)) {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it.skipIf(!canStripTypes)(
    'creates many files in nested directories with one worker process',
    async () => {
      const project = await mkdtemp(join(tmpdir(), 'worker-session-'));
      directories.push(project);
      const files = Array.from({ length: 60 }, (_, index) =>
        join(project, '.claude', 'skills', `skill-${index % 12}`, 'templates', `file-${index}.md`)
      );
      spawnCalls.count = 0;
      const started = Date.now();

      for (const file of files) {
        expect(await createHookOutputSafely(file, project, `content ${file}\n`)).toBe(true);
      }

      // 60 files and 26 directories took one process each before, about a
      // second apiece. Now one worker serves them all.
      expect(spawnCalls.count).toBe(1);
      expect(Date.now() - started).toBeLessThan(20_000);
      expect(await readFile(files[59]!, 'utf-8')).toBe(`content ${files[59]}\n`);
    },
    60_000
  );
});
