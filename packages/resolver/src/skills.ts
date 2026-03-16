import { readFile, readdir, access, lstat, realpath } from 'fs/promises';
import { resolve, dirname, relative, normalize, isAbsolute, sep } from 'path';
import type { Logger } from '@promptscript/core';
import type {
  Program,
  Block,
  ObjectContent,
  Value,
  TextContent,
  ParamDefinition,
  ParamType,
} from '@promptscript/core';

/**
 * A resource file discovered alongside a skill's SKILL.md.
 */
interface SkillResource {
  /** Relative path from the skill directory (e.g. "data/colors.csv") */
  relativePath: string;
  /** File content (utf-8) */
  content: string;
}

/**
 * Result of parsing a native SKILL.md file.
 */
export interface ParsedSkillMd {
  name?: string;
  description?: string;
  content: string;
  params?: ParamDefinition[];
}

/**
 * Parse a SKILL.md file extracting frontmatter and content.
 *
 * @param content - Raw SKILL.md file content
 * @returns Parsed skill metadata and content
 */
export function parseSkillMd(content: string): ParsedSkillMd {
  const lines = content.split('\n');
  let inFrontmatter = false;
  let frontmatterStart = -1;
  let frontmatterEnd = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]?.trim() ?? '';
    if (line === '---') {
      if (!inFrontmatter) {
        inFrontmatter = true;
        frontmatterStart = i;
      } else {
        frontmatterEnd = i;
        break;
      }
    }
  }

  let name: string | undefined;
  let description: string | undefined;
  let params: ParamDefinition[] | undefined;
  let bodyContent: string;

  if (frontmatterStart >= 0 && frontmatterEnd > frontmatterStart) {
    const frontmatterLines = lines.slice(frontmatterStart + 1, frontmatterEnd);
    const parsed = parseFrontmatterFields(frontmatterLines);
    name = parsed.name;
    description = parsed.description;
    params = parsed.params;

    bodyContent = lines
      .slice(frontmatterEnd + 1)
      .join('\n')
      .trim();
  } else {
    bodyContent = content.trim();
  }

  return { name, description, content: bodyContent, params };
}

/**
 * Parse frontmatter fields including nested params blocks.
 */
function parseFrontmatterFields(lines: string[]): {
  name?: string;
  description?: string;
  params?: ParamDefinition[];
} {
  let name: string | undefined;
  let description: string | undefined;
  let params: ParamDefinition[] | undefined;

  let i = 0;
  while (i < lines.length) {
    const line = lines[i] ?? '';

    const nameMatch = line.match(/^name:\s*(?:"([^"]+)"|'([^']+)'|(.+))\s*$/);
    if (nameMatch) {
      name = (nameMatch[1] ?? nameMatch[2] ?? nameMatch[3])?.trim();
      i++;
      continue;
    }

    const descMatch = line.match(/^description:\s*(?:"([^"]+)"|'([^']+)'|(.+))\s*$/);
    if (descMatch) {
      description = (descMatch[1] ?? descMatch[2] ?? descMatch[3])?.trim();
      i++;
      continue;
    }

    if (line.match(/^params:\s*$/)) {
      i++;
      const result = parseParamsBlock(lines, i);
      params = result.params;
      i = result.nextIndex;
      continue;
    }

    i++;
  }

  return { name, description, params };
}

/**
 * Parse a params block from YAML frontmatter lines.
 */
function parseParamsBlock(
  lines: string[],
  startIndex: number
): { params: ParamDefinition[]; nextIndex: number } {
  const params: ParamDefinition[] = [];
  let i = startIndex;

  while (i < lines.length) {
    const line = lines[i] ?? '';

    // A param name line is indented with 2 spaces and ends with ':'
    const paramNameMatch = line.match(/^ {2}(\w+):\s*$/);
    if (!paramNameMatch) break;

    const paramName = paramNameMatch[1]!;
    i++;

    let paramType: ParamType = { kind: 'string' };
    let defaultValue: Value | undefined;

    // Read param properties (indented with 4+ spaces)
    while (i < lines.length) {
      const propLine = lines[i] ?? '';
      if (!propLine.match(/^ {4}/)) break;
      const trimmed = propLine.trim();

      const typeMatch = trimmed.match(/^type:\s*(.+)$/);
      if (typeMatch) {
        paramType = parseParamType(typeMatch[1]!.trim());
        i++;
        continue;
      }

      const defaultMatch = trimmed.match(/^default:\s*(.+)$/);
      if (defaultMatch) {
        defaultValue = parseDefaultValue(defaultMatch[1]!.trim(), paramType);
        i++;
        continue;
      }

      const optionsMatch = trimmed.match(/^options:\s*\[(.+)\]$/);
      if (optionsMatch && paramType.kind === 'enum') {
        paramType = {
          kind: 'enum',
          options: optionsMatch[1]!.split(',').map((o) => o.trim()),
        };
        i++;
        continue;
      }

      i++;
    }

    const hasDefault = defaultValue !== undefined;
    params.push({
      type: 'ParamDefinition',
      name: paramName,
      paramType,
      optional: hasDefault,
      defaultValue,
      loc: { file: '<skill>', line: 0, column: 0, offset: 0 },
    });
  }

  return { params, nextIndex: i };
}

function parseParamType(typeStr: string): ParamType {
  switch (typeStr) {
    case 'string':
      return { kind: 'string' };
    case 'number':
      return { kind: 'number' };
    case 'boolean':
      return { kind: 'boolean' };
    case 'enum':
      return { kind: 'enum', options: [] };
    default:
      return { kind: 'string' };
  }
}

function parseDefaultValue(valueStr: string, paramType: ParamType): Value {
  switch (paramType.kind) {
    case 'boolean':
      return valueStr === 'true';
    case 'number':
      return Number(valueStr);
    default:
      return valueStr;
  }
}

/**
 * Interpolate skill content with parameter values.
 *
 * Binds provided arguments and defaults to {{variable}} placeholders
 * in the skill content string.
 *
 * @param content - Skill content with {{variable}} placeholders
 * @param params - Parameter definitions from SKILL.md frontmatter
 * @param args - Argument values provided at the call site
 * @returns Interpolated content string
 */
export function interpolateSkillContent(
  content: string,
  params: ParamDefinition[] | undefined,
  args: Record<string, Value>
): string {
  if (!params || params.length === 0) {
    return content;
  }

  // Build bound values map: args override defaults
  const bound = new Map<string, Value>();
  for (const param of params) {
    const argValue = args[param.name];
    if (argValue !== undefined) {
      bound.set(param.name, argValue);
    } else if (param.defaultValue !== undefined) {
      bound.set(param.name, param.defaultValue);
    } else if (!param.optional) {
      throw new Error(`Missing required skill parameter: ${param.name}`);
    }
  }

  // Replace {{variable}} patterns
  return content.replace(/\{\{(\w+)\}\}/g, (_match, varName: string) => {
    const value = bound.get(varName);
    if (value === undefined) {
      return _match; // Leave unresolved vars as-is
    }
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    return JSON.stringify(value);
  });
}

/**
 * Extract skill argument values from a .prs skill object.
 * Arguments can be in a nested `params` object or as top-level properties.
 */
function extractSkillArgs(skillObj: Record<string, Value>): Record<string, Value> {
  const args: Record<string, Value> = {};

  // Check for params object (nested arguments)
  const paramsVal = skillObj['params'];
  if (paramsVal && typeof paramsVal === 'object' && !Array.isArray(paramsVal)) {
    const paramsObj = paramsVal as Record<string, Value>;
    for (const [key, value] of Object.entries(paramsObj)) {
      if (key !== 'type' && key !== 'loc') {
        args[key] = value;
      }
    }
  }

  return args;
}

/** Files to skip when discovering skill resources. */
const SKIP_FILES = new Set([
  'SKILL.md',
  '.skillignore',
  '.DS_Store',
  'Thumbs.db',
  '.gitignore',
  '.gitkeep',
  '.npmrc',
  '.npmignore',
  '.env',
  '.env.local',
  '.env.production',
  '.editorconfig',
  '.prettierrc',
  '.prettierrc.json',
  '.prettierrc.yaml',
  '.prettierrc.yml',
  '.prettierignore',
  '.eslintrc',
  '.eslintrc.js',
  '.eslintrc.cjs',
  '.eslintrc.json',
  '.eslintrc.yaml',
  '.eslintrc.yml',
  'eslint.config.js',
  'eslint.config.cjs',
  'eslint.config.mjs',
  'eslint.base.config.cjs',
  '.release-please-manifest.json',
  'release-please-config.json',
  'package-lock.json',
  'pnpm-lock.yaml',
  'pnpm-workspace.yaml',
  'yarn.lock',
  'tsconfig.json',
  'tsconfig.base.json',
  'tsconfig.build.json',
  'tsconfig.spec.json',
  'jest.config.ts',
  'jest.config.js',
  'vitest.config.ts',
  'vitest.config.js',
  'vite.config.ts',
  'vite.config.js',
  'nx.json',
  'project.json',
  'package.json',
  'Makefile',
  'Dockerfile',
  'docker-compose.yml',
  'docker-compose.yaml',
  '.dockerignore',
  'LICENSE',
  'LICENSE.md',
  'CHANGELOG.md',
  'CONTRIBUTING.md',
  'CODE_OF_CONDUCT.md',
  'ROADMAP.md',
]);

/** Directory names to skip entirely. */
const SKIP_DIRS = new Set([
  'node_modules',
  '__pycache__',
  '.git',
  '.svn',
  '.github',
  '.husky',
  '.vscode',
  '.idea',
  '.verdaccio',
  '.nx',
  '.cache',
  '.turbo',
  'dist',
  'build',
  'out',
  'coverage',
  'tmp',
  '.tmp',
  'e2e',
  '__tests__',
  '__mocks__',
  '__fixtures__',
  'test',
  'tests',
  'spec',
  'fixtures',
]);

/**
 * Convert a simple gitignore-style glob pattern to a RegExp.
 *
 * Supports: `*` (any non-slash chars), `**` (any path), `?` (single char),
 * trailing `/` (directory match), and character classes `[abc]`.
 *
 * Patterns without a `/` match against the basename only.
 * Patterns with a `/` match against the full relative path.
 */
function globToRegex(pattern: string): { regex: RegExp; matchPath: boolean } {
  // If pattern ends with /, it matches directories (we match path prefixes)
  const isDirPattern = pattern.endsWith('/');
  const cleanPattern = isDirPattern ? pattern.slice(0, -1) : pattern;

  // Determine if pattern should match against full path or just basename
  const matchPath = cleanPattern.includes('/');

  let regexStr = '';
  let i = 0;
  while (i < cleanPattern.length) {
    const char = cleanPattern[i]!;
    if (char === '*') {
      if (cleanPattern[i + 1] === '*') {
        // ** matches any path segment(s)
        if (cleanPattern[i + 2] === '/') {
          regexStr += '(?:.+/)?';
          i += 3;
        } else {
          regexStr += '.*';
          i += 2;
        }
      } else {
        // * matches anything except /
        regexStr += '[^/]*';
        i++;
      }
    } else if (char === '?') {
      regexStr += '[^/]';
      i++;
    } else if (char === '[') {
      // Character class - pass through until ]
      const closeIdx = cleanPattern.indexOf(']', i + 1);
      if (closeIdx > i) {
        regexStr += cleanPattern.slice(i, closeIdx + 1);
        i = closeIdx + 1;
      } else {
        regexStr += '\\[';
        i++;
      }
    } else if ('.+^${}()|\\'.includes(char)) {
      regexStr += '\\' + char;
      i++;
    } else {
      regexStr += char;
      i++;
    }
  }

  if (isDirPattern) {
    // Directory pattern matches the dir name or anything under it
    return { regex: new RegExp(`^${regexStr}(?:/|$)`), matchPath: true };
  }

  return { regex: new RegExp(`^${regexStr}$`), matchPath };
}

/**
 * A compiled set of .skillignore rules for matching relative paths.
 */
interface SkillIgnoreRules {
  patterns: Array<{ regex: RegExp; matchPath: boolean; negated: boolean }>;
}

/**
 * Parse a .skillignore file content into compiled rules.
 * Format follows gitignore conventions:
 * - Lines starting with # are comments
 * - Empty lines are ignored
 * - Lines starting with ! are negation (re-include)
 * - Trailing / matches directories
 * - Patterns without / match basename; with / match full path
 */
function parseSkillIgnore(content: string): SkillIgnoreRules {
  const patterns: SkillIgnoreRules['patterns'] = [];

  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const negated = line.startsWith('!');
    const pattern = negated ? line.slice(1) : line;
    if (!pattern) continue;

    const { regex, matchPath } = globToRegex(pattern);
    patterns.push({ regex, matchPath, negated });
  }

  return { patterns };
}

/**
 * Check if a relative path is ignored by .skillignore rules.
 * Uses gitignore semantics: last matching pattern wins.
 */
function isIgnoredByRules(relPath: string, rules: SkillIgnoreRules): boolean {
  const basename = relPath.split('/').pop() ?? relPath;
  let ignored = false;

  for (const { regex, matchPath, negated } of rules.patterns) {
    const target = matchPath ? relPath : basename;
    if (regex.test(target)) {
      ignored = !negated;
    }
  }

  return ignored;
}

/**
 * Load and parse a .skillignore file from a skill directory.
 * Returns null if no .skillignore exists.
 */
async function loadSkillIgnore(skillDir: string): Promise<SkillIgnoreRules | null> {
  const ignorePath = resolve(skillDir, '.skillignore');
  try {
    const content = await readFile(ignorePath, 'utf-8');
    return parseSkillIgnore(content);
  } catch {
    return null;
  }
}

/** Maximum size (in bytes) for a single resource file. */
const MAX_RESOURCE_SIZE = 1_048_576; // 1 MB

/** Maximum total size (in bytes) for all resource files in a skill. */
const MAX_TOTAL_RESOURCE_SIZE = 10_485_760; // 10 MB

/** Maximum number of resource files per skill. */
const MAX_RESOURCE_COUNT = 100;

/**
 * Check if a relative path is safe (no path traversal, not absolute).
 */
function isSafeRelativePath(relPath: string): boolean {
  const normalized = normalize(relPath);
  if (isAbsolute(normalized)) return false;
  // Check for traversal using both forward and back slashes (cross-platform)
  const segments = normalized.split(sep);
  return !segments.some((s) => s === '..');
}

/**
 * Check if a skill name is safe (no path traversal characters).
 */
function isSafeSkillName(name: string): boolean {
  return !name.includes('..') && !name.includes('/') && !name.includes('\\');
}

/** No-op logger for when no logger is provided. */
const noopLogger: Logger = {
  verbose: () => {},
  debug: () => {},
};

/**
 * Discover resource files in a skill directory (everything except SKILL.md).
 * Skips symlinks, validates paths against traversal, enforces size/count limits,
 * and rejects binary files.
 *
 * @param skillDir - Absolute path to the skill directory
 * @param logger - Optional logger for reporting skipped files
 * @returns Array of resource files with relative paths and content
 */
async function discoverSkillResources(
  skillDir: string,
  logger: Logger = noopLogger
): Promise<SkillResource[]> {
  // Load .skillignore rules if present
  const ignoreRules = await loadSkillIgnore(skillDir);

  const entries = await readdir(skillDir, { recursive: true, withFileTypes: true });
  const resources: SkillResource[] = [];
  let totalSize = 0;

  // Resolve the real path of the skill directory to compare against
  const realSkillDir = await realpath(skillDir);

  for (const entry of entries) {
    // Enforce aggregate count limit
    if (resources.length >= MAX_RESOURCE_COUNT) {
      logger.verbose(`Skill resource limit reached (${MAX_RESOURCE_COUNT} files) in ${skillDir}`);
      break;
    }

    if (!entry.isFile()) {
      // Skip known junk directories early (won't prevent readdir from listing them,
      // but their children will be filtered by path check below)
      if (entry.isDirectory() && SKIP_DIRS.has(entry.name)) continue;
      continue;
    }
    // Skip symlinks reported by readdir
    if (entry.isSymbolicLink()) continue;

    if (SKIP_FILES.has(entry.name)) continue;

    const fullPath = resolve(entry.parentPath, entry.name);
    const relPath = relative(skillDir, fullPath);

    // Use forward slashes for consistent pattern matching
    const relPathNormalized = relPath.split(sep).join('/');

    // Skip files inside skipped directories
    const pathSegments = relPath.split(sep);
    if (pathSegments.some((s) => SKIP_DIRS.has(s))) continue;

    // Apply .skillignore rules
    if (ignoreRules && isIgnoredByRules(relPathNormalized, ignoreRules)) {
      logger.debug(`Skipping resource ignored by .skillignore: ${relPath}`);
      continue;
    }

    // Validate no path traversal
    if (!isSafeRelativePath(relPath)) {
      logger.verbose(`Skipping resource with unsafe path: ${relPath}`);
      continue;
    }

    try {
      // Use lstat to detect symlinks (stat follows them, lstat does not)
      const fileStat = await lstat(fullPath);
      if (fileStat.isSymbolicLink()) {
        logger.verbose(`Skipping symlink resource: ${relPath}`);
        continue;
      }
      if (fileStat.size > MAX_RESOURCE_SIZE) {
        logger.verbose(`Skipping oversized resource (${fileStat.size} bytes): ${relPath}`);
        continue;
      }

      // Verify the resolved real path is still within the skill directory
      // This catches files inside symlinked directories
      const realFullPath = await realpath(fullPath);
      if (!realFullPath.startsWith(realSkillDir + '/')) {
        logger.verbose(`Skipping resource outside skill directory: ${relPath}`);
        continue;
      }

      // Enforce aggregate size limit
      totalSize += fileStat.size;
      if (totalSize > MAX_TOTAL_RESOURCE_SIZE) {
        logger.verbose(
          `Skill total resource size limit reached (${MAX_TOTAL_RESOURCE_SIZE} bytes)`
        );
        break;
      }

      const content = await readFile(fullPath, 'utf-8');

      // Reject binary files: null bytes are a strong indicator of binary content
      if (content.includes('\0')) {
        logger.verbose(`Skipping binary resource: ${relPath}`);
        totalSize -= fileStat.size; // Don't count rejected files
        continue;
      }

      resources.push({ relativePath: relPath, content });
    } catch {
      // Skip files that can't be read (permissions, I/O errors)
      logger.verbose(`Skipping unreadable resource: ${relPath}`);
    }
  }

  return resources;
}

/**
 * Check if a file exists.
 */
async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * Options for native skill resolution.
 */
export interface NativeSkillOptions {
  /**
   * Path to the universal directory for auto-discovering skills and commands.
   * When set, skills are discovered from `<universalDir>/skills/` and commands from `<universalDir>/commands/`.
   * Defaults to undefined (disabled). Typically set to `.agents`.
   */
  universalDir?: string;
  /** Logger for reporting skipped files and resolution decisions. */
  logger?: Logger;
}

/**
 * Discover skill directories in a given base path.
 * Each subdirectory containing a SKILL.md is considered a skill.
 *
 * @param basePath - Absolute path to the skills directory (e.g. .promptscript/skills/)
 * @returns Array of skill names found
 */
async function discoverSkillDirs(basePath: string): Promise<string[]> {
  try {
    const entries = await readdir(basePath, { withFileTypes: true });
    const skillNames: string[] = [];
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (SKIP_DIRS.has(entry.name)) continue;
      if (!isSafeSkillName(entry.name)) continue;
      const skillMd = resolve(basePath, entry.name, 'SKILL.md');
      if (await fileExists(skillMd)) {
        skillNames.push(entry.name);
      }
    }
    return skillNames;
  } catch {
    return [];
  }
}

/**
 * Resolve native SKILL.md files for skills defined in the AST.
 *
 * For each skill in the @skills block, checks if a corresponding SKILL.md
 * file exists in the local skills directory, optionally in .agents/skills/,
 * or in the registry at @skills/<name>/SKILL.md. If found, the
 * skill's content is replaced with the native file content.
 *
 * @param ast - The resolved AST
 * @param registryPath - Path to the registry
 * @param sourceFile - The source file path (to determine relative skill location)
 * @param localPath - Optional path to local .promptscript directory
 * @param options - Optional skill resolution options
 * @returns Updated AST with native skill content
 */
export async function resolveNativeSkills(
  ast: Program,
  registryPath: string,
  sourceFile: string,
  localPath?: string,
  options?: NativeSkillOptions
): Promise<Program> {
  const logger = options?.logger ?? noopLogger;

  // Find @skills block (may not exist yet if auto-discovery adds skills)
  const skillsBlock = ast.blocks.find((b) => b.name === 'skills');

  const skillsContent: ObjectContent =
    skillsBlock && skillsBlock.content.type === 'ObjectContent'
      ? (skillsBlock.content as ObjectContent)
      : {
          type: 'ObjectContent',
          properties: {},
          loc: { file: sourceFile, line: 1, column: 1 },
        };

  const updatedProperties: Record<string, Value> = { ...skillsContent.properties };
  let hasUpdates = false;

  // Determine base path for skills
  // If source file is in a skills directory, use its parent as base
  const sourceDir = dirname(sourceFile);
  const isSkillsDir = sourceDir.includes('@skills') || sourceDir.endsWith('/skills');

  // Auto-discover skills from local and universal directories
  if (!isSkillsDir && localPath) {
    const discoveryDirs: string[] = [resolve(localPath, 'skills')];
    if (options?.universalDir && localPath) {
      discoveryDirs.push(resolve(localPath, '..', options.universalDir, 'skills'));
    }

    for (const dir of discoveryDirs) {
      const discovered = await discoverSkillDirs(dir);
      for (const skillName of discovered) {
        // Only add if not already declared in @skills block
        if (!(skillName in updatedProperties)) {
          logger.verbose(`Auto-discovered skill: ${skillName} (from ${dir})`);
          updatedProperties[skillName] = {};
          hasUpdates = true;
        }
      }
    }
  }

  // If no skills block existed and no auto-discovered skills, nothing to do
  if (Object.keys(updatedProperties).length === 0) {
    return ast;
  }

  // Resolve each skill's SKILL.md content and resources
  for (const [skillName, skillValue] of Object.entries(updatedProperties)) {
    if (typeof skillValue !== 'object' || skillValue === null || Array.isArray(skillValue)) {
      continue;
    }

    // Validate skill name to prevent path traversal
    if (!isSafeSkillName(skillName)) {
      logger.verbose(`Skipping skill with unsafe name: ${skillName}`);
      continue;
    }

    const skillObj = skillValue as Record<string, Value>;

    // Try to find native SKILL.md
    let skillMdPath: string | null = null;

    if (isSkillsDir) {
      // Source is in skills dir, look for sibling directories
      const basePath = sourceDir;
      skillMdPath = resolve(basePath, skillName, 'SKILL.md');
    } else {
      // Look in local skills/ directory first, then optionally .agents/skills/ (universal),
      // then registry @skills/
      const localCandidate = localPath ? resolve(localPath, 'skills', skillName, 'SKILL.md') : null;
      const universalCandidate =
        options?.universalDir && localPath
          ? resolve(localPath, '..', options.universalDir, 'skills', skillName, 'SKILL.md')
          : null;
      const registryCandidate = resolve(registryPath, '@skills', skillName, 'SKILL.md');

      if (localCandidate && (await fileExists(localCandidate))) {
        skillMdPath = localCandidate;
      } else if (universalCandidate && (await fileExists(universalCandidate))) {
        skillMdPath = universalCandidate;
      } else {
        skillMdPath = registryCandidate;
      }
    }

    if (skillMdPath && (await fileExists(skillMdPath))) {
      try {
        const rawContent = await readFile(skillMdPath, 'utf-8');
        const parsed = parseSkillMd(rawContent);

        // Update skill with native content
        const updatedSkill: Record<string, Value> = { ...skillObj };

        // Extract skill arguments from .prs for interpolation
        const skillArgs = extractSkillArgs(skillObj);

        // Use native content (with interpolation if params defined)
        if (parsed.content) {
          const interpolated = parsed.params
            ? interpolateSkillContent(parsed.content, parsed.params, skillArgs)
            : parsed.content;
          updatedSkill['content'] = {
            type: 'TextContent',
            value: interpolated,
            loc: { file: skillMdPath, line: 1, column: 1, offset: 0 },
          } as TextContent;
        }

        // Use native description only as fallback when not set in .prs
        // Also interpolate description if it has template vars
        if (parsed.description && !skillObj['description']) {
          updatedSkill['description'] = parsed.params
            ? interpolateSkillContent(parsed.description, parsed.params, skillArgs)
            : parsed.description;
        }

        // Discover resource files alongside SKILL.md
        const skillDir = dirname(skillMdPath);
        const resources = await discoverSkillResources(skillDir, logger);
        if (resources.length > 0) {
          // Each resource is { relativePath: string, content: string } which satisfies { [key: string]: Value }
          const resourceValues: Value[] = resources.map((r) => ({
            relativePath: r.relativePath,
            content: r.content,
          }));
          updatedSkill['resources'] = resourceValues;
        }

        updatedProperties[skillName] = updatedSkill;
        hasUpdates = true;
      } catch {
        // Failed to read skill file, keep original
        logger.verbose(`Failed to read skill file: ${skillMdPath}`);
      }
    }
  }

  if (!hasUpdates) {
    return ast;
  }

  // Create updated skills block
  const updatedSkillsBlock: Block = {
    ...(skillsBlock ?? {
      type: 'Block' as const,
      name: 'skills',
      content: skillsContent,
      loc: { file: sourceFile, line: 1, column: 1, offset: 0 },
    }),
    content: {
      ...skillsContent,
      properties: updatedProperties,
    },
  };

  // Replace or add skills block in AST
  const updatedBlocks = skillsBlock
    ? ast.blocks.map((b) => (b.name === 'skills' ? updatedSkillsBlock : b))
    : [...ast.blocks, updatedSkillsBlock];

  return {
    ...ast,
    blocks: updatedBlocks,
  };
}

/**
 * Discover command .md files from a directory.
 * Each .md file becomes a shortcut: filename (without .md) → file content.
 *
 * @param dir - Absolute path to the commands directory
 * @param logger - Optional logger
 * @returns Record of command name → TextContent value
 */
async function discoverCommandFiles(
  dir: string,
  logger: Logger = noopLogger
): Promise<Record<string, Value>> {
  const commands: Record<string, Value> = {};
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith('.md')) continue;
      if (entry.isSymbolicLink()) continue;

      const cmdName = '/' + entry.name.replace(/\.md$/, '');
      const fullPath = resolve(dir, entry.name);

      try {
        const fileStat = await lstat(fullPath);
        if (fileStat.isSymbolicLink()) continue;
        if (fileStat.size > MAX_RESOURCE_SIZE) {
          logger.verbose(`Skipping oversized command file: ${entry.name}`);
          continue;
        }

        const content = await readFile(fullPath, 'utf-8');
        if (content.includes('\0')) {
          logger.verbose(`Skipping binary command file: ${entry.name}`);
          continue;
        }

        commands[cmdName] = {
          type: 'TextContent',
          value: content.trim(),
          loc: { file: fullPath, line: 1, column: 1, offset: 0 },
        } as TextContent;

        logger.verbose(`Auto-discovered command: ${cmdName} (from ${dir})`);
      } catch {
        logger.verbose(`Skipping unreadable command file: ${entry.name}`);
      }
    }
  } catch {
    // Directory doesn't exist or can't be read
  }
  return commands;
}

/**
 * Auto-discover command .md files from local and universal directories
 * and inject them into the @shortcuts block.
 *
 * Scans .promptscript/commands/ and optionally .agents/commands/ for .md files.
 * Each file becomes a shortcut entry with the filename as command name.
 * Explicitly declared shortcuts in .prs files take precedence.
 *
 * @param ast - The resolved AST
 * @param sourceFile - The source file path
 * @param localPath - Path to local .promptscript directory
 * @param options - Skill resolution options (reuses universalDir and logger)
 * @returns Updated AST with discovered commands
 */
export async function resolveNativeCommands(
  ast: Program,
  sourceFile: string,
  localPath?: string,
  options?: NativeSkillOptions
): Promise<Program> {
  if (!localPath) return ast;

  const logger = options?.logger ?? noopLogger;

  // Collect commands from discovery directories
  const allCommands: Record<string, Value> = {};

  // Local commands first
  const localCommands = await discoverCommandFiles(resolve(localPath, 'commands'), logger);
  Object.assign(allCommands, localCommands);

  // Universal commands (don't overwrite local)
  if (options?.universalDir) {
    const universalCommands = await discoverCommandFiles(
      resolve(localPath, '..', options.universalDir, 'commands'),
      logger
    );
    for (const [name, value] of Object.entries(universalCommands)) {
      if (!(name in allCommands)) {
        allCommands[name] = value;
      }
    }
  }

  if (Object.keys(allCommands).length === 0) return ast;

  // Find existing @shortcuts block
  const shortcutsBlock = ast.blocks.find((b) => b.name === 'shortcuts');
  const shortcutsContent: ObjectContent =
    shortcutsBlock && shortcutsBlock.content.type === 'ObjectContent'
      ? (shortcutsBlock.content as ObjectContent)
      : {
          type: 'ObjectContent',
          properties: {},
          loc: { file: sourceFile, line: 1, column: 1 },
        };

  // Merge: existing shortcuts take precedence over discovered ones
  const mergedProperties: Record<string, Value> = { ...allCommands };
  for (const [name, value] of Object.entries(shortcutsContent.properties)) {
    mergedProperties[name] = value; // Explicit declarations win
  }

  // Check if anything actually changed
  const existingKeys = new Set(Object.keys(shortcutsContent.properties));
  const hasNewCommands = Object.keys(allCommands).some((k) => !existingKeys.has(k));
  if (!hasNewCommands) return ast;

  const updatedBlock: Block = {
    ...(shortcutsBlock ?? {
      type: 'Block' as const,
      name: 'shortcuts',
      content: shortcutsContent,
      loc: { file: sourceFile, line: 1, column: 1, offset: 0 },
    }),
    content: {
      ...shortcutsContent,
      properties: mergedProperties,
    },
  };

  const updatedBlocks = shortcutsBlock
    ? ast.blocks.map((b) => (b.name === 'shortcuts' ? updatedBlock : b))
    : [...ast.blocks, updatedBlock];

  return {
    ...ast,
    blocks: updatedBlocks,
  };
}
