import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { parse } from '@promptscript/parser';
import { detectContentType, FileLoader, parseRegistryMarker } from '@promptscript/resolver';
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
  /** Source file containing this import when location collection is enabled */
  sourceFile?: string;
  /** Source line containing this import when location collection is enabled */
  sourceLine?: number;
  /** Original @use source text when location collection is enabled */
  rawSource?: string;
}

/**
 * Options for the lock scanner.
 */
export interface ScanOptions {
  /** Base path for local/relative file resolution */
  localPath: string;
  /** Base path for unaliased registry references */
  registryPath?: string;
  /** Registry alias configuration (from promptscript.yaml) */
  registries?: RegistriesConfig;
  /** Throw when imports cannot be read, parsed, or resolved */
  strict?: boolean;
  /** Return repeated remote imports instead of deduplicating them */
  deduplicate?: boolean;
  /** Include source file and line metadata in results */
  includeLocations?: boolean;
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
    if (options.strict) {
      throw new Error(`PromptScript entry file not found: ${entryPath}`);
    }
    return [];
  }

  const loader = new FileLoader({
    registryPath: options.registryPath ?? options.localPath,
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
    } catch (error) {
      if (options.strict) {
        throw new Error(`Cannot read PromptScript file: ${filePath}`, { cause: error });
      }
      return;
    }
    if (filePath.endsWith('.md') && detectContentType(source) !== 'prs') {
      return;
    }

    const { ast, errors } = parse(source, { filename: filePath, tolerant: true });
    if (options.strict && errors.length > 0) {
      throw new Error(`Cannot scan invalid PromptScript file: ${filePath}: ${errors[0]!.message}`);
    }
    if (!ast) return;

    for (const use of ast.uses) {
      let resolved: string;
      try {
        resolved = loader.resolveRef(use.path, filePath);
      } catch (error) {
        if (options.strict) {
          throw new Error(`Cannot resolve import '${use.path.raw}' in ${filePath}`, {
            cause: error,
          });
        }
        continue;
      }
      const marker = parseRegistryMarker(resolved);

      if (marker) {
        const key = `${marker.repoUrl}\0${marker.path}\0${marker.version}`;
        if (options.deduplicate === false || !seen.has(key)) {
          seen.add(key);
          results.push({
            ...marker,
            ...(options.includeLocations
              ? {
                  sourceFile: filePath,
                  sourceLine: use.path.loc.line,
                  rawSource: use.path.raw,
                }
              : {}),
          });
        }
      } else {
        // Local file — recurse into it
        if (!resolved.endsWith('.prs') && !resolved.endsWith('.md')) {
          continue;
        }
        if (existsSync(resolved)) {
          await scan(resolved);
          continue;
        }
        if (resolved.endsWith('.prs')) {
          const skillDirectory = resolved.slice(0, -'.prs'.length);
          if (existsSync(skillDirectory)) {
            const skillFile = join(skillDirectory, 'SKILL.md');
            if (existsSync(skillFile)) {
              await scan(skillFile);
            }
            continue;
          }
        }
        if (options.strict) {
          throw new Error(`Imported PromptScript file not found: ${resolved}`);
        }
      }
    }
  }

  await scan(entryPath);

  return results;
}
