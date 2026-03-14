import { watch, type FSWatcher } from 'chokidar';
import { relative } from 'path';

export interface FileWatchEvent {
  type: 'file:changed' | 'file:created' | 'file:deleted';
  path: string;
}

const WATCHED_EXTENSIONS = new Set(['.prs']);
const WATCHED_FILENAMES = new Set(['promptscript.yaml']);

function isWatchedFile(filePath: string): boolean {
  const base = filePath.split('/').pop() ?? '';
  if (WATCHED_FILENAMES.has(base)) return true;
  const dot = base.lastIndexOf('.');
  if (dot === -1) return false;
  return WATCHED_EXTENSIONS.has(base.slice(dot));
}

export function createFileWatcher(
  workspace: string,
  onEvent: (event: FileWatchEvent) => void
): FSWatcher {
  let ready = false;

  const watcher = watch(workspace, {
    ignoreInitial: true,
    ignored: (filePath: string) => {
      const rel = relative(workspace, filePath);
      if (rel === '') return false; // workspace root itself
      const parts = rel.split('/');
      if (parts.includes('node_modules') || parts.includes('.git')) return true;
      return false;
    },
  });

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
