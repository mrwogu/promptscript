import {
  chmodSync,
  closeSync,
  fchmodSync,
  fsyncSync,
  linkSync,
  openSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { randomUUID } from 'node:crypto';

function temporaryPathFor(filePath: string): string {
  return `${filePath}.${process.pid}-${randomUUID()}.tmp`;
}

/**
 * Replace a file by writing a sibling temporary file with the given mode and
 * renaming it over the original. The original is never left half-written.
 */
export function writeFileAtomic(filePath: string, content: string, mode: number): void {
  const temporaryPath = temporaryPathFor(filePath);
  try {
    writeFileSync(temporaryPath, content, { encoding: 'utf-8', mode, flag: 'wx' });
    chmodSync(temporaryPath, mode);
    renameSync(temporaryPath, filePath);
  } catch (error) {
    try {
      unlinkSync(temporaryPath);
    } catch {
      // The temporary file may not have been created.
    }
    throw error;
  }
}

/**
 * Create a file that must not exist yet: write and fsync a sibling temporary file
 * created with `wx`, then link it to the final name. `link` fails with EEXIST when
 * the name exists, even as a link, so nothing is ever replaced and no reader sees
 * a half-written file.
 */
export function createFileExclusive(filePath: string, content: string, mode: number): void {
  const temporaryPath = temporaryPathFor(filePath);
  const descriptor = openSync(temporaryPath, 'wx', mode);
  try {
    try {
      writeFileSync(descriptor, content, 'utf-8');
      fchmodSync(descriptor, mode);
      fsyncSync(descriptor);
    } finally {
      closeSync(descriptor);
    }
    linkSync(temporaryPath, filePath);
  } finally {
    try {
      unlinkSync(temporaryPath);
    } catch {
      // A leftover temporary file must not hide the result of the link.
    }
  }
}
