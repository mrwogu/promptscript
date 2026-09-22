/**
 * Static CLI version.
 *
 * esbuild inlines package.json at build time, so the version is available
 * without a filesystem read. A runtime read cannot work everywhere the CLI
 * runs today: `deno compile` binaries have no package directory, and
 * guessing paths from import.meta.url breaks under embedded modules.
 */
import packageJson from '../package.json' with { type: 'json' };

/** Version of the @promptscript/cli package, resolved at build time. */
export const CLI_VERSION: string = packageJson.version;
