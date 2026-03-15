import { mkdtemp, writeFile, unlink, mkdir, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { createFileWatcher, type FileWatchEvent } from '../watcher.js';

describe('createFileWatcher', () => {
  let workspace: string;
  let prsDir: string;

  beforeEach(async () => {
    workspace = await mkdtemp(join(tmpdir(), 'prs-watch-'));
    prsDir = join(workspace, '.promptscript');
    await mkdir(prsDir, { recursive: true });
    await writeFile(join(prsDir, 'test.prs'), 'initial');
  });

  afterEach(async () => {
    await rm(workspace, { recursive: true, force: true });
  });

  it('emits file:changed when a .prs file is modified', async () => {
    const events: FileWatchEvent[] = [];
    const watcher = createFileWatcher(workspace, [prsDir], (event) => events.push(event));

    await new Promise((resolve) => setTimeout(resolve, 500));
    await writeFile(join(prsDir, 'test.prs'), 'updated');
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await watcher.close();

    expect(
      events.some((e) => e.type === 'file:changed' && e.path === '.promptscript/test.prs')
    ).toBe(true);
  });

  it('emits file:created when a new .prs file is added', async () => {
    const events: FileWatchEvent[] = [];
    const watcher = createFileWatcher(workspace, [prsDir], (event) => events.push(event));

    await new Promise((resolve) => setTimeout(resolve, 500));
    await writeFile(join(prsDir, 'new.prs'), 'new file');
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await watcher.close();

    expect(
      events.some((e) => e.type === 'file:created' && e.path === '.promptscript/new.prs')
    ).toBe(true);
  });

  it('emits file:deleted when a .prs file is removed', async () => {
    const events: FileWatchEvent[] = [];
    const watcher = createFileWatcher(workspace, [prsDir], (event) => events.push(event));

    await new Promise((resolve) => setTimeout(resolve, 500));
    await unlink(join(prsDir, 'test.prs'));
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await watcher.close();

    expect(
      events.some((e) => e.type === 'file:deleted' && e.path === '.promptscript/test.prs')
    ).toBe(true);
  });

  it('ignores non-.prs files', async () => {
    const events: FileWatchEvent[] = [];
    const watcher = createFileWatcher(workspace, [prsDir], (event) => events.push(event));

    await new Promise((resolve) => setTimeout(resolve, 500));
    await writeFile(join(prsDir, 'readme.md'), 'ignored');
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await watcher.close();

    expect(events).toHaveLength(0);
  });
});
