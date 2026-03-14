import { MarkdownInstructionFormatter } from './markdown-instruction-formatter.js';

/**
 * Version info for a single version entry.
 */
export interface VersionEntry {
  readonly name: string;
  readonly description: string;
  readonly outputPath: string;
}

/**
 * Standard three-version map returned by `getSupportedVersions()`.
 */
export interface SimpleFormatterVersions {
  readonly simple: VersionEntry;
  readonly multifile: VersionEntry;
  readonly full: VersionEntry;
}

/**
 * Options for creating a simple markdown formatter via the factory.
 *
 * These five parameters are the only things that vary across the
 * 31 tier-1/2/3 formatters that have no method overrides.
 */
export interface SimpleFormatterOptions {
  /** Formatter identifier (e.g. 'windsurf', 'kode') */
  name: string;
  /** Default output file path (e.g. '.windsurf/rules/project.md') */
  outputPath: string;
  /** Human-readable description (e.g. 'Windsurf rules (Markdown)') */
  description: string;
  /** Header rendered at top of main file (e.g. '# Project Rules') */
  mainFileHeader: string;
  /** Dot directory for skills/commands/agents (e.g. '.windsurf') */
  dotDir: string;
  /** Whether this formatter supports agents (default: false) */
  hasAgents?: boolean;
  /** Whether this formatter supports commands (default: false) */
  hasCommands?: boolean;
  /** Whether this formatter supports skills (default: true) */
  hasSkills?: boolean;
  /** Skill file name (default: 'SKILL.md') */
  skillFileName?: string;
}

/**
 * Return type from the factory: the class itself (with static
 * `getSupportedVersions()`) plus the pre-built VERSIONS constant.
 */
export interface SimpleFormatterResult {
  /** Concrete formatter class (instantiable via `new`) */
  Formatter: {
    new (): MarkdownInstructionFormatter;
    getSupportedVersions(): SimpleFormatterVersions;
  };
  /** Pre-built version map, exported as `<NAME>_VERSIONS` */
  VERSIONS: SimpleFormatterVersions;
}

/**
 * Build version descriptions from the output path and dot directory.
 */
function buildVersions(outputPath: string, dotDir: string): SimpleFormatterVersions {
  // Determine whether the outputPath looks like a file inside a dotDir
  // (e.g. '.windsurf/rules/project.md') or a standalone file (e.g. 'AGENTS.md').
  const isNested = outputPath.startsWith(dotDir + '/');
  const simpleDesc = isNested ? `Single ${outputPath} file` : `Single ${outputPath} file`;
  const multifileDesc = isNested
    ? `Single ${outputPath} file (skills via full mode)`
    : `${outputPath} + ${dotDir}/skills/<name>/SKILL.md`;
  const fullDesc = isNested
    ? `${outputPath} + ${dotDir}/skills/<name>/SKILL.md`
    : `Multifile + ${dotDir}/skills/<name>/SKILL.md`;

  return {
    simple: { name: 'simple', description: simpleDesc, outputPath },
    multifile: { name: 'multifile', description: multifileDesc, outputPath },
    full: { name: 'full', description: fullDesc, outputPath },
  } as const;
}

/**
 * Factory that creates a concrete `MarkdownInstructionFormatter` subclass
 * and its companion `VERSIONS` constant from a small set of parameters.
 *
 * Every formatter produced by this factory has identical runtime behaviour
 * to the hand-written classes it replaces --- no method overrides, just
 * different constructor config.
 *
 * @example
 * ```ts
 * export const { Formatter: WindsurfFormatter, VERSIONS: WINDSURF_VERSIONS } =
 *   createSimpleMarkdownFormatter({
 *     name: 'windsurf',
 *     outputPath: '.windsurf/rules/project.md',
 *     description: 'Windsurf rules (Markdown)',
 *     mainFileHeader: '# Project Rules',
 *     dotDir: '.windsurf',
 *   });
 * export type WindsurfVersion = 'simple' | 'multifile' | 'full';
 * ```
 */
export function createSimpleMarkdownFormatter(opts: SimpleFormatterOptions): SimpleFormatterResult {
  const {
    name,
    outputPath,
    description,
    mainFileHeader,
    dotDir,
    hasAgents = false,
    hasCommands = false,
    hasSkills = true,
    skillFileName = 'SKILL.md',
  } = opts;

  const versions = buildVersions(outputPath, dotDir);

  // Create a named class so `formatter.constructor.name` is meaningful.
  class SimpleFormatter extends MarkdownInstructionFormatter {
    constructor() {
      super({
        name,
        outputPath,
        description,
        defaultConvention: 'markdown',
        mainFileHeader,
        dotDir,
        skillFileName,
        hasAgents,
        hasCommands,
        hasSkills,
      });
    }

    static getSupportedVersions(): SimpleFormatterVersions {
      return versions;
    }
  }

  // Give the class a meaningful runtime name for debugging / logging.
  Object.defineProperty(SimpleFormatter, 'name', { value: `${name}Formatter` });

  return {
    Formatter: SimpleFormatter,
    VERSIONS: versions,
  };
}
