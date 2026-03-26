import { readFile, readdir, access, lstat } from 'fs/promises';
import { resolve } from 'path';
import type { Program, Block, TextContent, Value } from '@promptscript/core';
import { parseSkillMd } from './skills.js';
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

/**
 * Discover SKILL.md files in subdirectories of the given path.
 * Returns an ObjectContent mapping skill-name -> skill properties.
 */
async function discoverSkills(dir: string): Promise<Record<string, Value> | null> {
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
      const raw = await readFile(skillMdPath, 'utf-8');
      const parsed = parseSkillMd(raw);

      const skillProps: Record<string, Value> = {};
      if (parsed.description) {
        skillProps['description'] = parsed.description;
      }
      if (parsed.content) {
        skillProps['content'] = makeTextContent(parsed.content, skillMdPath);
      }

      properties[entry.name] = skillProps;
    } catch {
      // Skip unreadable skill files
    }
  }

  return Object.keys(properties).length > 0 ? properties : null;
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
 * @returns A synthesized Program AST, or null if nothing was found or directory doesn't exist
 */
export async function discoverNativeContent(dir: string): Promise<Program | null> {
  // Check the directory exists
  try {
    const stat = await lstat(dir);
    if (!stat.isDirectory()) return null;
  } catch {
    return null;
  }

  const blocks: Block[] = [];

  // Discover skills
  const skillProperties = await discoverSkills(dir);
  if (skillProperties) {
    blocks.push(makeBlock('skills', makeObjectContent(skillProperties)));
  }

  // Discover agents
  const agentProperties = await discoverAgents(dir);
  if (agentProperties) {
    blocks.push(makeBlock('agents', makeObjectContent(agentProperties)));
  }

  // Discover commands -> @shortcuts
  const commandProperties = await discoverCommands(dir);
  if (commandProperties) {
    blocks.push(makeBlock('shortcuts', makeObjectContent(commandProperties)));
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
