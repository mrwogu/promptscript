import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { parse } from '@promptscript/parser';
import { FileLoader, parseRegistryMarker } from '@promptscript/resolver';
import type { RegistriesConfig } from '@promptscript/core';

/**
 * A remote import discovered by scanning `.prs` files.
 */
export interface RemoteImport {
  /** Full repository URL (e.g. `https://github.com/org/repo`) */
  repoUrl: string;
  /** Path within the repository */
  path: string;
  /** Pinned version tag, or empty string for latest */
  version: string;
}

/**
 * Options for the lock scanner.
 */
export interface ScanOptions {
  /** Base path for local/relative file resolution */
  localPath: string;
  /** Registry alias configuration (from promptscript.yaml) */
  registries?: RegistriesConfig;
}

/**
 * Scan `.prs` files starting from an entry point, recursively follow local
 * `@use` imports, and collect all remote `@use` references.
 *
 * Remote references are those that resolve to registry markers — either direct
 * URL-style imports (e.g. `github.com/org/repo/path`) or registry alias
 * imports (e.g. `@company/guards` when a registries config is provided).
 *
 * The scanner does NOT recurse into remote imports — only local files are
 * followed.
 *
 * @param entryPath - Absolute path to the entry `.prs` file
 * @param options - Scan options (localPath, registries)
 * @returns Deduplicated list of remote imports found
 */
export async function collectRemoteImports(
  entryPath: string,
  options: ScanOptions
): Promise<RemoteImport[]> {
  if (!existsSync(entryPath)) {
    return [];
  }

  const loader = new FileLoader({
    registryPath: options.localPath,
    localPath: options.localPath,
    registries: options.registries,
  });

  const visited = new Set<string>();
  const seen = new Set<string>();
  const results: RemoteImport[] = [];

  async function scan(filePath: string): Promise<void> {
    if (visited.has(filePath)) return;
    visited.add(filePath);

    let source: string;
    try {
      source = await readFile(filePath, 'utf-8');
    } catch {
      return;
    }

    const { ast } = parse(source, { filename: filePath, tolerant: true });
    if (!ast) return;

    for (const use of ast.uses) {
      let resolved: string;
      try {
        resolved = loader.resolveRef(use.path, filePath);
      } catch {
        continue;
      }
      const marker = parseRegistryMarker(resolved);

      if (marker) {
        const key = `${marker.repoUrl}\0${marker.path}\0${marker.version}`;
        if (!seen.has(key)) {
          seen.add(key);
          results.push(marker);
        }
      } else {
        // Local file — recurse into it
        if (existsSync(resolved)) {
          await scan(resolved);
        }
      }
    }
  }

  await scan(entryPath);

  return results;
}
