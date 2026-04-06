import { createHash } from 'crypto';
import { resolve, normalize } from 'path';

/**
 * Compute SHA-256 hash of in-memory content.
 * Returns SRI-format string: "sha256-<hex>"
 */
export function hashContent(content: Buffer): string {
  const hex = createHash('sha256').update(content).digest('hex');
  return `sha256-${hex}`;
}

/**
 * Build a lockfile key for a registry reference file.
 * Format: `<repoUrl>\0<relativePath>\0<version>`
 * Uses null byte separator consistent with MARKER_SEP in loader.ts.
 * This is the sole canonical key builder — used by both lock generation
 * and compile-time verification.
 */
export function buildReferenceKey(repoUrl: string, relativePath: string, version: string): string {
  return `${repoUrl}\0${relativePath}\0${version}`;
}

/**
 * Verify that a resolved file path is contained within the cache directory.
 * Prevents path traversal attacks via symlinks or `../` in reference paths.
 */
export function isInsideCachePath(filePath: string, cachePath: string): boolean {
  const normalizedFile = resolve(normalize(filePath));
  const normalizedCache = resolve(normalize(cachePath));
  return normalizedFile.startsWith(normalizedCache + '/') || normalizedFile === normalizedCache;
}
