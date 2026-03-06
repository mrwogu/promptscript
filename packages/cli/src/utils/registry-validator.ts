import { join } from 'path';
import { parse as parseYaml } from 'yaml';
import type { RegistryManifest, CatalogEntry } from '@promptscript/core';
import type { CliServices } from '../services.js';

/**
 * Validation result severity.
 */
export type ValidationSeverity = 'error' | 'warning';

/**
 * A single validation issue.
 */
export interface ValidationIssue {
  severity: ValidationSeverity;
  message: string;
  path?: string;
}

/**
 * Result of validating a registry.
 */
export interface RegistryValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
  stats: {
    namespaces: number;
    catalogEntries: number;
    prsFiles: number;
  };
}

/**
 * Validate a registry directory structure and manifest.
 */
export async function validateRegistry(
  registryPath: string,
  services: CliServices
): Promise<RegistryValidationResult> {
  const { fs } = services;
  const issues: ValidationIssue[] = [];

  // 1. Check manifest exists
  const manifestPath = join(registryPath, 'registry-manifest.yaml');
  if (!fs.existsSync(manifestPath)) {
    return {
      valid: false,
      issues: [
        {
          severity: 'error',
          message: `registry-manifest.yaml not found at ${registryPath}`,
          path: manifestPath,
        },
      ],
      stats: { namespaces: 0, catalogEntries: 0, prsFiles: 0 },
    };
  }

  // 2. Parse manifest
  let manifest: RegistryManifest;
  try {
    const content = await fs.readFile(manifestPath, 'utf-8');
    manifest = parseYaml(content) as RegistryManifest;
  } catch (error) {
    return {
      valid: false,
      issues: [
        {
          severity: 'error',
          message: `Failed to parse manifest: ${error instanceof Error ? error.message : 'Unknown error'}`,
          path: manifestPath,
        },
      ],
      stats: { namespaces: 0, catalogEntries: 0, prsFiles: 0 },
    };
  }

  // 3. Validate manifest schema
  if (!manifest.version) {
    issues.push({ severity: 'error', message: 'Manifest missing required field: version' });
  } else if (manifest.version !== '1') {
    issues.push({
      severity: 'error',
      message: `Unsupported manifest version: ${manifest.version}`,
    });
  }

  if (!manifest.meta) {
    issues.push({ severity: 'error', message: 'Manifest missing required field: meta' });
  } else {
    if (!manifest.meta.name) {
      issues.push({ severity: 'error', message: 'Manifest meta missing required field: name' });
    }
  }

  if (!manifest.namespaces || typeof manifest.namespaces !== 'object') {
    issues.push({
      severity: 'error',
      message: 'Manifest missing or invalid field: namespaces',
    });
  }

  if (!manifest.catalog) {
    issues.push({ severity: 'error', message: 'Manifest missing required field: catalog' });
  } else if (!Array.isArray(manifest.catalog)) {
    issues.push({ severity: 'error', message: 'Manifest catalog must be an array' });
  }

  // If basic schema validation failed, return early
  const hasSchemaErrors = issues.some((i) => i.severity === 'error');
  if (hasSchemaErrors) {
    return {
      valid: false,
      issues,
      stats: {
        namespaces: manifest.namespaces ? Object.keys(manifest.namespaces).length : 0,
        catalogEntries: Array.isArray(manifest.catalog) ? manifest.catalog.length : 0,
        prsFiles: 0,
      },
    };
  }

  const namespaceNames = Object.keys(manifest.namespaces);
  let prsFileCount = 0;

  // 4. Validate catalog entries
  const catalogIds = new Set<string>();
  for (const entry of manifest.catalog) {
    // Check required fields
    if (!entry.id) {
      issues.push({ severity: 'error', message: 'Catalog entry missing required field: id' });
      continue;
    }

    // Check for duplicate IDs
    if (catalogIds.has(entry.id)) {
      issues.push({
        severity: 'error',
        message: `Duplicate catalog entry ID: ${entry.id}`,
      });
    }
    catalogIds.add(entry.id);

    // Check namespace match
    const entryNs = entry.id.split('/')[0];
    if (entryNs && !namespaceNames.includes(entryNs)) {
      issues.push({
        severity: 'error',
        message: `Catalog entry '${entry.id}' references undeclared namespace '${entryNs}'`,
      });
    }

    // Check .prs file exists
    if (entry.path) {
      const prsPath = join(registryPath, entry.path);
      if (!fs.existsSync(prsPath)) {
        issues.push({
          severity: 'error',
          message: `Catalog entry '${entry.id}' references missing file: ${entry.path}`,
          path: prsPath,
        });
      } else {
        prsFileCount++;
      }
    } else {
      issues.push({
        severity: 'error',
        message: `Catalog entry '${entry.id}' missing required field: path`,
      });
    }

    // Check dependencies exist in catalog
    if (entry.dependencies && Array.isArray(entry.dependencies)) {
      for (const dep of entry.dependencies) {
        if (!manifest.catalog.some((e: CatalogEntry) => e.id === dep)) {
          issues.push({
            severity: 'warning',
            message: `Catalog entry '${entry.id}' depends on '${dep}' which is not in the catalog`,
          });
        }
      }
    }
  }

  // 5. Check for circular dependencies
  const circularDeps = detectCircularDependencies(manifest.catalog);
  for (const cycle of circularDeps) {
    issues.push({
      severity: 'error',
      message: `Circular dependency detected: ${cycle.join(' -> ')}`,
    });
  }

  // 6. Check for orphaned .prs files (warning)
  for (const ns of namespaceNames) {
    const nsDir = join(registryPath, ns);
    if (fs.existsSync(nsDir)) {
      try {
        const files = await fs.readdir(nsDir);
        for (const file of files) {
          if (typeof file === 'string' && file.endsWith('.prs')) {
            const relativePath = `${ns}/${file}`;
            const inCatalog = manifest.catalog.some(
              (entry: CatalogEntry) => entry.path === relativePath
            );
            if (!inCatalog) {
              issues.push({
                severity: 'warning',
                message: `Orphaned .prs file not in catalog: ${relativePath}`,
                path: join(nsDir, file),
              });
            }
          }
        }
      } catch {
        // Directory read failed - skip orphan check for this namespace
      }
    }
  }

  const valid = !issues.some((i) => i.severity === 'error');

  return {
    valid,
    issues,
    stats: {
      namespaces: namespaceNames.length,
      catalogEntries: manifest.catalog.length,
      prsFiles: prsFileCount,
    },
  };
}

/**
 * Detect circular dependencies in catalog entries.
 * Returns arrays representing cycles (e.g., ['A', 'B', 'A']).
 */
function detectCircularDependencies(catalog: CatalogEntry[]): string[][] {
  const cycles: string[][] = [];
  const depMap = new Map<string, string[]>();

  for (const entry of catalog) {
    depMap.set(entry.id, entry.dependencies ?? []);
  }

  const visited = new Set<string>();
  const inStack = new Set<string>();

  function dfs(id: string, path: string[]): void {
    if (inStack.has(id)) {
      const cycleStart = path.indexOf(id);
      cycles.push([...path.slice(cycleStart), id]);
      return;
    }
    if (visited.has(id)) return;

    visited.add(id);
    inStack.add(id);

    const deps = depMap.get(id) ?? [];
    for (const dep of deps) {
      dfs(dep, [...path, id]);
    }

    inStack.delete(id);
  }

  for (const id of depMap.keys()) {
    dfs(id, []);
  }

  return cycles;
}
