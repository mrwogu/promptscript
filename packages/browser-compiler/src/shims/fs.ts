/**
 * Browser shim for Node.js fs module.
 * Provides no-op implementations that will throw if called.
 */

export function readFileSync(): never {
  throw new Error('fs.readFileSync is not available in browser environment');
}

export function readFile(): never {
  throw new Error('fs.readFile is not available in browser environment');
}

export function writeFile(): never {
  throw new Error('fs.writeFile is not available in browser environment');
}

export function existsSync(): boolean {
  return false;
}

export default {
  readFileSync,
  readFile,
  writeFile,
  existsSync,
};
