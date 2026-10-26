import { chmodSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';

/**
 * Replace a file by writing a sibling temporary file with the given mode and
 * renaming it over the original. The original is never left half-written.
 */
export function writeFileAtomic(filePath: string, content: string, mode: number): void {
  const temporaryPath = `${filePath}.${process.pid}-${randomUUID()}.tmp`;
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
