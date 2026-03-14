import { mkdtemp, writeFile, unlink, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { createFileWatcher, type FileWatchEvent } from '../watcher.js';

describe('createFileWatcher', () => {
  let workspace: string;

  beforeEach(async () => {
    workspace = await mkdtemp(join(tmpdir(), 'prs-watch-'));
    await writeFile(join(workspace, 'test.prs'), 'initial');
  });

  afterEach(async () => {
    await rm(workspace, { recursive: true, force: true });
  });

  it('emits file:changed when a .prs file is modified', async () => {
    const events: FileWatchEvent[] = [];
    const watcher = createFileWatcher(workspace, (event) => events.push(event));

    await new Promise((resolve) => setTimeout(resolve, 500));
    await writeFile(join(workspace, 'test.prs'), 'updated');
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await watcher.close();

    expect(events.some((e) => e.type === 'file:changed' && e.path === 'test.prs')).toBe(true);
  });

  it('emits file:created when a new .prs file is added', async () => {
    const events: FileWatchEvent[] = [];
    const watcher = createFileWatcher(workspace, (event) => events.push(event));

    await new Promise((resolve) => setTimeout(resolve, 500));
    await writeFile(join(workspace, 'new.prs'), 'new file');
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await watcher.close();

    expect(events.some((e) => e.type === 'file:created' && e.path === 'new.prs')).toBe(true);
  });

  it('emits file:deleted when a .prs file is removed', async () => {
    const events: FileWatchEvent[] = [];
    const watcher = createFileWatcher(workspace, (event) => events.push(event));

    await new Promise((resolve) => setTimeout(resolve, 500));
    await unlink(join(workspace, 'test.prs'));
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await watcher.close();

    expect(events.some((e) => e.type === 'file:deleted' && e.path === 'test.prs')).toBe(true);
  });

  it('ignores non-.prs files', async () => {
    const events: FileWatchEvent[] = [];
    const watcher = createFileWatcher(workspace, (event) => events.push(event));

    await new Promise((resolve) => setTimeout(resolve, 500));
    await writeFile(join(workspace, 'readme.md'), 'ignored');
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await watcher.close();

    expect(events).toHaveLength(0);
  });
});
