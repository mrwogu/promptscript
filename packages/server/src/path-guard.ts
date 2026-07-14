import { resolve, relative, isAbsolute, dirname, basename } from 'path';
import { realpath } from 'fs/promises';

export class PathTraversalError extends Error {
  constructor(requestedPath: string) {
    super(`Path traversal rejected: ${requestedPath}`);
    this.name = 'PathTraversalError';
  }
}

export async function resolveSafePath(workspace: string, requestedPath: string): Promise<string> {
  const decoded = decodeURIComponent(requestedPath);

  if (isAbsolute(decoded)) {
    throw new PathTraversalError(requestedPath);
  }

  const resolved = resolve(workspace, decoded);
  const rel = relative(workspace, resolved);

  if (rel.startsWith('..') || isAbsolute(rel)) {
    throw new PathTraversalError(requestedPath);
  }

  // Follow symlinks and verify the real path is still within the workspace.
  // Resolve the workspace realpath too, to handle symlinked directories
  // (e.g., macOS /var -> /private/var).
  let realWorkspace: string;
  try {
    realWorkspace = await realpath(workspace);
  } catch {
    realWorkspace = workspace;
  }

  // If the path doesn't exist yet (e.g., new file being created), resolve
  // the parent directory's real path and rejoin the basename.
  let real: string;
  try {
    real = await realpath(resolved);
  } catch (err: unknown) {
    if (err instanceof Error && 'code' in err && (err as NodeJS.ErrnoException).code === 'ENOENT') {
      try {
        const realParent = await realpath(dirname(resolved));
        real = resolve(realParent, basename(resolved));
      } catch {
        // Parent doesn't exist either - the lexical check above already
        // ensured the path is within workspace, so return as-is.
        return resolved;
      }
    } else {
      throw err;
    }
  }

  const realRel = relative(realWorkspace, real);

  if (realRel.startsWith('..') || isAbsolute(realRel)) {
    throw new PathTraversalError(requestedPath);
  }

  return resolved;
}
