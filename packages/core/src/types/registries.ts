/**
 * Extended registry alias entry for monorepos or custom roots.
 */
export interface RegistryAliasEntry {
  /** Git repository URL (HTTPS or SSH) */
  url: string;
  /** Base path within the repository */
  root?: string;
}

/**
 * Registry alias configuration.
 * Maps alias names (e.g., '@acme') to Git URLs or extended entries.
 *
 * @example
 * registries:
 *   '@company': 'github.com/company/promptscript-base'
 *   '@internal':
 *     url: 'git@gitlab.internal.com:company/monorepo'
 *     root: 'packages/promptscript'
 */
export type RegistriesConfig = Record<string, string | RegistryAliasEntry>;
