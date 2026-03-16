import { resolve, relative, isAbsolute } from 'path';

export class PathTraversalError extends Error {
  constructor(requestedPath: string) {
    super(`Path traversal rejected: ${requestedPath}`);
    this.name = 'PathTraversalError';
  }
}

export function resolveSafePath(workspace: string, requestedPath: string): string {
  const decoded = decodeURIComponent(requestedPath);

  if (isAbsolute(decoded)) {
    throw new PathTraversalError(requestedPath);
  }

  const resolved = resolve(workspace, decoded);
  const rel = relative(workspace, resolved);

  if (rel.startsWith('..') || isAbsolute(rel)) {
    throw new PathTraversalError(requestedPath);
  }

  return resolved;
}
