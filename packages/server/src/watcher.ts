import { watch, type FSWatcher } from 'chokidar';
import { relative } from 'path';

export interface FileWatchEvent {
  type: 'file:changed' | 'file:created' | 'file:deleted';
  path: string;
}

const CONFIG_FILENAMES = new Set(['promptscript.yaml', 'promptscript.yml']);

function isWatchedFile(filePath: string): boolean {
  const base = filePath.split('/').pop() ?? '';
  if (CONFIG_FILENAMES.has(base)) return true;
  return base.endsWith('.prs');
}

export function createFileWatcher(
  workspace: string,
  watchPaths: string[],
  onEvent: (event: FileWatchEvent) => void
): FSWatcher {
  let ready = false;

  const watcher = watch(watchPaths, { ignoreInitial: true });

  watcher.on('ready', () => {
    // Small grace period to let any delayed initial-scan events drain before
    // we start forwarding. This is necessary on macOS where FSEvents can
    // coalesce initial writes with post-ready change events.
    setTimeout(() => {
      ready = true;
    }, 100);
  });

  watcher.on('add', (filePath) => {
    if (!ready || !isWatchedFile(filePath)) return;
    onEvent({ type: 'file:created', path: relative(workspace, filePath) });
  });

  watcher.on('change', (filePath) => {
    if (!ready || !isWatchedFile(filePath)) return;
    onEvent({ type: 'file:changed', path: relative(workspace, filePath) });
  });

  watcher.on('unlink', (filePath) => {
    if (!ready || !isWatchedFile(filePath)) return;
    onEvent({ type: 'file:deleted', path: relative(workspace, filePath) });
  });

  return watcher;
}
