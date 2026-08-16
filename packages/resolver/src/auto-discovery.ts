import { readFile, readdir, access, lstat } from 'fs/promises';
import { resolve, basename } from 'path';
import { ResolveError } from '@promptscript/core';
import type { Logger, Program, Block, TextContent, Value } from '@promptscript/core';
import { parseSkillMd } from './skills.js';
import { collectSkillResources, toSkillResourceValues } from './skill-resources.js';
import { makeBlock, makeObjectContent, makeTextContent, VIRTUAL_LOC } from './ast-factory.js';

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

/**
 * Parse simple YAML-style frontmatter from a markdown file.
 * Agents and commands intentionally use this legacy scalar parser; skills use
 * parseSkillMd's full YAML parser because their metadata schema is richer.
 * Returns the frontmatter fields as a record, or an empty object if none present.
 */
function parseFrontmatter(content: string): Record<string, string> {
  const lines = content.split('\n');
  if (lines[0]?.trim() !== '---') {
    return {};
  }

  const fields: Record<string, string> = {};
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i] ?? '';
    if (line.trim() === '---') break;
    const match = line.match(/^(\w+):\s*(.*)$/);
    if (match) {
      fields[match[1]!] = match[2]!.trim();
    }
  }
  return fields;
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

/**
 * Discover agent .md files (frontmatter contains `tools:` or `model:`).
 * Returns an ObjectContent mapping agent-name -> agent properties.
 */
async function discoverAgents(dir: string): Promise<Record<string, Value> | null> {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return null;
  }

  const properties: Record<string, Value> = {};

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.md')) continue;

    const fullPath = resolve(dir, entry.name);
    try {
      const stat = await lstat(fullPath);
      if (stat.isSymbolicLink()) continue;

      const raw = await readFile(fullPath, 'utf-8');
      const fm = parseFrontmatter(raw);

      // An agent file must have tools: or model: in frontmatter
      if (!('tools' in fm) && !('model' in fm)) continue;

      const agentName = entry.name.replace(/\.md$/, '');
      const agentProps: Record<string, Value> = {};

      if (fm['description']) agentProps['description'] = fm['description'];
      if (fm['model']) agentProps['model'] = fm['model'];
      if (fm['tools']) agentProps['tools'] = fm['tools'];

      // Body content (after frontmatter)
      const bodyStart = raw.indexOf('\n---\n', 3);
      if (bodyStart !== -1) {
        const body = raw.slice(bodyStart + 5).trim();
        if (body) {
          agentProps['content'] = makeTextContent(body, fullPath);
        }
      }

      properties[agentName] = agentProps;
    } catch {
      // Skip unreadable files
    }
  }

  return Object.keys(properties).length > 0 ? properties : null;
}

/**
 * Discover command .md files (frontmatter contains `description:` but NOT `tools:` or `model:`).
 * Returns an ObjectContent mapping /command-name -> TextContent.
 */
async function discoverCommands(dir: string): Promise<Record<string, Value> | null> {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return null;
  }

  const properties: Record<string, Value> = {};

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.md')) continue;

    // Skip SKILL.md — these are skill files, not commands.
    // Without this guard, discoverRootSkill and discoverCommands both
    // claim the same file, producing a phantom /SKILL command.
    if (entry.name === 'SKILL.md') continue;

    const fullPath = resolve(dir, entry.name);
    try {
      const stat = await lstat(fullPath);
      if (stat.isSymbolicLink()) continue;

      const raw = await readFile(fullPath, 'utf-8');
      const fm = parseFrontmatter(raw);

      // A command file must have description: but NOT tools: or model:
      if (!('description' in fm)) continue;
      if ('tools' in fm || 'model' in fm) continue;

      const cmdName = '/' + entry.name.replace(/\.md$/, '');
      properties[cmdName] = makeTextContent(raw.trim(), fullPath);
    } catch {
      // Skip unreadable files
    }
  }

  return Object.keys(properties).length > 0 ? properties : null;
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
    blocks.push(makeBlock('skills', makeObjectContent(mergedSkills)));
  }

  // Discover agents (root + agents/ wrapper)
  const rootAgents = (await discoverAgents(dir)) ?? {};
  const wrappedAgents: Record<string, Value> = {};
  for (const name of AGENT_WRAPPER_DIRS) {
    const candidate = resolve(dir, name);
    if (await safeIsDirectory(candidate)) {
      const found = await discoverAgents(candidate);
      if (found) Object.assign(wrappedAgents, found);
    }
  }
  const mergedAgents = { ...wrappedAgents, ...rootAgents };
  if (Object.keys(mergedAgents).length > 0) {
    blocks.push(makeBlock('agents', makeObjectContent(mergedAgents)));
  }

  // Discover commands -> @shortcuts (root + commands/ wrapper)
  const rootCommands = (await discoverCommands(dir)) ?? {};
  const wrappedCommands: Record<string, Value> = {};
  for (const name of COMMAND_WRAPPER_DIRS) {
    const candidate = resolve(dir, name);
    if (await safeIsDirectory(candidate)) {
      const found = await discoverCommands(candidate);
      if (found) Object.assign(wrappedCommands, found);
    }
  }
  const mergedCommands = { ...wrappedCommands, ...rootCommands };
  if (Object.keys(mergedCommands).length > 0) {
    blocks.push(makeBlock('shortcuts', makeObjectContent(mergedCommands)));
  }

  // Discover context
  const contextContent = await discoverContext(dir);
  if (contextContent) {
    blocks.push(makeBlock('context', contextContent));
  }

  if (blocks.length === 0) {
    return null;
  }

  const program: Program = {
    type: 'Program',
    blocks,
    uses: [],
    extends: [],
    loc: VIRTUAL_LOC,
  };

  return program;
}
