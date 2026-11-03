import { readFile, readdir, access, lstat } from 'node:fs/promises';
import { resolve, basename } from 'node:path';
import { ResolveError } from '@promptscript/core';
import type { Logger, Program, Block, TextContent, Value } from '@promptscript/core';
import { commandValueFromFile, parseMarkdownFrontmatter, parseSkillMd } from './skills.js';
import type { MarkdownFrontmatter } from './skills.js';
import { agentPropsFromFrontmatter } from './markdown-frontmatter.js';
import { collectSkillResources, toSkillResourceValues } from './skill-resources.js';
import { fileLoc, makeBlock, makeObjectContent, makeTextContent } from './ast-factory.js';

/** Context file names to look for when synthesizing a @context block. */
const CONTEXT_FILES = ['CLAUDE.md', '.clinerules', '.cursorrules'] as const;

/**
 * Check if a file exists and is accessible.
 */
async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function addParsedSkillMetadata(
  skillProps: Record<string, Value>,
  parsed: ReturnType<typeof parseSkillMd>
): void {
  if (parsed.params !== undefined) skillProps['params'] = parsed.params as unknown as Value;
  if (parsed.inputs !== undefined) skillProps['inputs'] = parsed.inputs as unknown as Value;
  if (parsed.outputs !== undefined) skillProps['outputs'] = parsed.outputs as unknown as Value;
  if (parsed.references !== undefined) {
    skillProps['references'] = parsed.references as unknown as Value;
  }
  if (parsed.scripts !== undefined) skillProps['scripts'] = parsed.scripts as unknown as Value;
  if (parsed.license !== undefined) skillProps['license'] = parsed.license;
  if (parsed.compatibility !== undefined) skillProps['compatibility'] = parsed.compatibility;
  if (parsed.metadata !== undefined) {
    skillProps['metadata'] = parsed.metadata as unknown as Value;
  }
  if (parsed.allowedTools !== undefined) {
    skillProps['allowedTools'] = parsed.allowedTools as unknown as Value;
  }
  if (parsed.rawFrontmatter !== undefined) {
    skillProps['__rawFrontmatter'] = parsed.rawFrontmatter;
  }
}

/**
 * Build the skill properties for a discovered SKILL.md, including every
 * resource file that travels with the skill directory.
 *
 * Resource errors from `references:` / `scripts:` frontmatter entries are
 * thrown, matching how a locally resolved skill reports them.
 */
async function buildDiscoveredSkill(
  skillMdPath: string,
  logger: Logger | undefined
): Promise<{ name?: string; props: Record<string, Value> }> {
  const raw = await readFile(skillMdPath, 'utf-8');
  const parsed = parseSkillMd(raw, skillMdPath);

  const skillProps: Record<string, Value> = {};
  if (parsed.description) {
    skillProps['description'] = parsed.description;
  }
  if (parsed.content) {
    skillProps['content'] = makeTextContent(parsed.content, skillMdPath);
  }
  addParsedSkillMetadata(skillProps, parsed);

  const collected = await collectSkillResources(skillMdPath, parsed, logger);
  if (collected.errors.length > 0) {
    throw collected.errors[0];
  }
  if (collected.resources.length > 0) {
    skillProps['resources'] = toSkillResourceValues(collected.resources);
  }

  return { ...(parsed.name ? { name: parsed.name } : {}), props: skillProps };
}

/**
 * Discover SKILL.md files in subdirectories of the given path.
 * Returns an ObjectContent mapping skill-name -> skill properties.
 */
async function discoverSkills(dir: string, logger?: Logger): Promise<Record<string, Value> | null> {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return null;
  }

  const properties: Record<string, Value> = {};

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    let skillMdPath = resolve(dir, entry.name, 'SKILL.md');
    if (!(await fileExists(skillMdPath))) {
      const dirnameMdPath = resolve(dir, entry.name, `${entry.name}.md`);
      if (await fileExists(dirnameMdPath)) {
        skillMdPath = dirnameMdPath;
      } else {
        continue;
      }
    }

    try {
      properties[entry.name] = (await buildDiscoveredSkill(skillMdPath, logger)).props;
    } catch (error: unknown) {
      if (error instanceof ResolveError) {
        throw error;
      }
      // Skip unreadable skill files
    }
  }

  return Object.keys(properties).length > 0 ? properties : null;
}

/**
 * Check if the directory itself contains a root-level SKILL.md and, if so,
 * parse it and return a single skill entry keyed by the skill's frontmatter
 * `name` field (falling back to the directory basename).
 */
async function discoverRootSkill(
  dir: string,
  logger?: Logger
): Promise<Record<string, Value> | null> {
  const skillMdPath = resolve(dir, 'SKILL.md');
  if (!(await fileExists(skillMdPath))) return null;

  try {
    const skill = await buildDiscoveredSkill(skillMdPath, logger);
    return { [skill.name || basename(dir)]: skill.props };
  } catch (error: unknown) {
    if (error instanceof ResolveError) {
      throw error;
    }
    return null;
  }
}

interface MarkdownFile {
  name: string;
  path: string;
  raw: string;
  parsed: MarkdownFrontmatter;
}

/**
 * Read the .md files of a directory that have frontmatter. Symlinks and
 * unreadable files are skipped. Frontmatter that can not be read throws.
 */
async function readMarkdownFiles(dir: string, logger?: Logger): Promise<MarkdownFile[] | null> {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return null;
  }

  const markdownEntries = entries.filter((entry) => entry.isFile() && entry.name.endsWith('.md'));
  const contents = await Promise.all(
    markdownEntries.map((entry) => readPlainFile(resolve(dir, entry.name)))
  );

  const files: MarkdownFile[] = [];
  markdownEntries.forEach((entry, index) => {
    const raw = contents[index];
    if (raw === undefined) return;
    const fullPath = resolve(dir, entry.name);
    const parsed = parseMarkdownFrontmatter(raw, fullPath, logger);
    if (parsed) files.push({ name: entry.name.replace(/\.md$/, ''), path: fullPath, raw, parsed });
  });
  return files;
}

/** Read a file that is not a symlink, or undefined when it can not be read. */
async function readPlainFile(path: string): Promise<string | undefined> {
  try {
    if ((await lstat(path)).isSymbolicLink()) return undefined;
    return await readFile(path, 'utf-8');
  } catch {
    return undefined;
  }
}

/**
 * Discover agent .md files (frontmatter contains `tools:` or `model:`).
 * Returns an ObjectContent mapping agent-name -> agent properties.
 */
async function discoverAgents(dir: string, logger?: Logger): Promise<Record<string, Value> | null> {
  const files = await readMarkdownFiles(dir, logger);
  const properties: Record<string, Value> = {};

  for (const file of files ?? []) {
    const fm = file.parsed.fields;
    // An agent file must have tools: or model: in frontmatter
    if (!('tools' in fm) && !('model' in fm)) continue;

    const agentProps = agentPropsFromFrontmatter(fm, file.path);
    if (file.parsed.body) {
      agentProps['content'] = makeTextContent(file.parsed.body, file.path);
    }
    properties[file.name] = agentProps;
  }

  return Object.keys(properties).length > 0 ? properties : null;
}

/**
 * Discover command .md files (frontmatter contains `description:` but NOT `tools:` or `model:`).
 * Returns an ObjectContent mapping /command-name -> command value.
 */
async function discoverCommands(
  dir: string,
  logger?: Logger
): Promise<Record<string, Value> | null> {
  const files = await readMarkdownFiles(dir, logger);
  const properties: Record<string, Value> = {};

  for (const file of files ?? []) {
    // Skip SKILL.md - these are skill files, not commands.
    // Without this guard, discoverRootSkill and discoverCommands both
    // claim the same file, producing a phantom /SKILL command.
    if (file.name === 'SKILL') continue;

    const fm = file.parsed.fields;
    // A command file must have description: but NOT tools: or model:
    if (!('description' in fm)) continue;
    if ('tools' in fm || 'model' in fm) continue;

    properties['/' + file.name] = commandValueFromFile(file.raw, file.path, logger, file.parsed);
  }

  return Object.keys(properties).length > 0 ? properties : null;
}

/**
 * Run a discover function on each wrapper directory that exists, in
 * parallel, and merge the results in wrapper order.
 */
async function discoverInWrappers(
  dir: string,
  wrappers: readonly string[],
  discover: (candidate: string, logger?: Logger) => Promise<Record<string, Value> | null>,
  logger?: Logger
): Promise<Record<string, Value>> {
  const results = await Promise.all(
    wrappers.map(async (name) => {
      const candidate = resolve(dir, name);
      return (await safeIsDirectory(candidate)) ? discover(candidate, logger) : null;
    })
  );
  return Object.assign({}, ...results.filter((found) => found !== null));
}

/**
 * Discover context files (CLAUDE.md, .clinerules, .cursorrules) in the given directory.
 * Returns a TextContent combining the first found context file, or null if none exist.
 */
async function discoverContext(dir: string): Promise<TextContent | null> {
  for (const fileName of CONTEXT_FILES) {
    const fullPath = resolve(dir, fileName);
    if (!(await fileExists(fullPath))) continue;

    try {
      const content = await readFile(fullPath, 'utf-8');
      if (content.trim()) {
        return makeTextContent(content.trim(), fullPath);
      }
    } catch {
      // Skip unreadable files
    }
  }
  return null;
}

/**
 * Synthesize a virtual Program AST from native content discovered in a directory.
 *
 * Scans the given directory for:
 * - Subdirectories containing SKILL.md -> synthesizes `@skills` block
 * - .md files with `tools:` or `model:` frontmatter -> synthesizes `@agents` block
 * - .md files with `description:` (but not `tools:` or `model:`) -> synthesizes `@shortcuts` block
 * - CLAUDE.md, .clinerules, .cursorrules -> synthesizes `@context` block
 *
 * @param dir - Absolute path to the directory to scan
 * @param logger - Optional logger for reporting skipped resource files
 * @returns A synthesized Program AST, or null if nothing was found or directory doesn't exist
 */
/**
 * Wrapper directory names commonly used by skill repositories to group skills,
 * agents and commands one level below the repo root.
 */
const SKILL_WRAPPER_DIRS = ['skills'] as const;
const AGENT_WRAPPER_DIRS = ['agents'] as const;
const COMMAND_WRAPPER_DIRS = ['commands'] as const;

async function safeIsDirectory(dir: string): Promise<boolean> {
  try {
    const stat = await lstat(dir);
    return stat.isDirectory();
  } catch {
    return false;
  }
}

/**
 * @internal
 */
export async function discoverNativeContent(dir: string, logger?: Logger): Promise<Program | null> {
  // Check the directory exists
  if (!(await safeIsDirectory(dir))) return null;

  const blocks: Block[] = [];

  // Check if directory itself is a skill (root-level SKILL.md)
  const rootSkill = await discoverRootSkill(dir, logger);

  // Discover skills in subdirectories
  const subSkills = await discoverSkills(dir, logger);

  // Also walk known wrapper directories (`skills/`) so registry imports against
  // a repository root pick up the standard `skills/<name>/SKILL.md` layout.
  const wrappedSkillResults = await Promise.all(
    SKILL_WRAPPER_DIRS.map(async (name) => {
      const candidate = resolve(dir, name);
      if (!(await safeIsDirectory(candidate))) return null;
      return discoverSkills(candidate, logger);
    })
  );

  const mergedSkills: Record<string, Value> = { ...rootSkill, ...subSkills };
  for (const wrapped of wrappedSkillResults) {
    if (wrapped) {
      for (const [key, value] of Object.entries(wrapped)) {
        if (!Object.hasOwn(mergedSkills, key)) {
          mergedSkills[key] = value;
        }
      }
    }
  }
  if (Object.keys(mergedSkills).length > 0) {
    blocks.push(makeBlock('skills', makeObjectContent(mergedSkills, dir), dir));
  }

  // Discover agents (root + agents/ wrapper)
  const rootAgents = (await discoverAgents(dir, logger)) ?? {};
  const wrappedAgents = await discoverInWrappers(dir, AGENT_WRAPPER_DIRS, discoverAgents, logger);
  const mergedAgents = { ...wrappedAgents, ...rootAgents };
  if (Object.keys(mergedAgents).length > 0) {
    blocks.push(makeBlock('agents', makeObjectContent(mergedAgents, dir), dir));
  }

  // Discover commands -> @shortcuts (root + commands/ wrapper)
  const rootCommands = (await discoverCommands(dir, logger)) ?? {};
  const wrappedCommands = await discoverInWrappers(
    dir,
    COMMAND_WRAPPER_DIRS,
    discoverCommands,
    logger
  );
  const mergedCommands = { ...wrappedCommands, ...rootCommands };
  if (Object.keys(mergedCommands).length > 0) {
    blocks.push(makeBlock('shortcuts', makeObjectContent(mergedCommands, dir), dir));
  }

  // Discover context
  const contextContent = await discoverContext(dir);
  if (contextContent) {
    blocks.push(makeBlock('context', contextContent, contextContent.loc.file));
  }

  if (blocks.length === 0) {
    return null;
  }

  const program: Program = {
    type: 'Program',
    blocks,
    uses: [],
    extends: [],
    loc: fileLoc(dir),
  };

  return program;
}
