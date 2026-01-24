import { readFile, access } from 'fs/promises';
import { resolve, dirname } from 'path';
import type { Program, Block, ObjectContent, Value, TextContent } from '@promptscript/core';

/**
 * Result of parsing a native SKILL.md file.
 */
interface ParsedSkillMd {
  name?: string;
  description?: string;
  content: string;
}

/**
 * Parse a SKILL.md file extracting frontmatter and content.
 *
 * @param content - Raw SKILL.md file content
 * @returns Parsed skill metadata and content
 */
function parseSkillMd(content: string): ParsedSkillMd {
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
  let bodyContent: string;

  if (frontmatterStart >= 0 && frontmatterEnd > frontmatterStart) {
    // Parse frontmatter
    const frontmatterLines = lines.slice(frontmatterStart + 1, frontmatterEnd);
    for (const line of frontmatterLines) {
      const nameMatch = line.match(/^name:\s*["']?([^"'\n]+)["']?\s*$/);
      if (nameMatch) {
        name = nameMatch[1];
      }
      const descMatch = line.match(/^description:\s*["']?([^"'\n]+)["']?\s*$/);
      if (descMatch) {
        description = descMatch[1];
      }
    }
    // Content is everything after frontmatter
    bodyContent = lines.slice(frontmatterEnd + 1).join('\n').trim();
  } else {
    // No frontmatter, entire content is body
    bodyContent = content.trim();
  }

  return { name, description, content: bodyContent };
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
 * Resolve native SKILL.md files for skills defined in the AST.
 *
 * For each skill in the @skills block, checks if a corresponding SKILL.md
 * file exists in the registry at @skills/<name>/SKILL.md. If found, the
 * skill's content is replaced with the native file content.
 *
 * @param ast - The resolved AST
 * @param registryPath - Path to the registry
 * @param sourceFile - The source file path (to determine relative skill location)
 * @returns Updated AST with native skill content
 */
export async function resolveNativeSkills(
  ast: Program,
  registryPath: string,
  sourceFile: string
): Promise<Program> {
  // Find @skills block
  const skillsBlock = ast.blocks.find((b) => b.name === 'skills');
  if (!skillsBlock || skillsBlock.content.type !== 'ObjectContent') {
    return ast;
  }

  const skillsContent = skillsBlock.content as ObjectContent;
  const updatedProperties: Record<string, Value> = { ...skillsContent.properties };
  let hasUpdates = false;

  // Determine base path for skills
  // If source file is in @skills directory, use its parent as base
  const sourceDir = dirname(sourceFile);
  const isSkillsDir = sourceDir.includes('@skills');

  for (const [skillName, skillValue] of Object.entries(skillsContent.properties)) {
    if (typeof skillValue !== 'object' || skillValue === null || Array.isArray(skillValue)) {
      continue;
    }

    const skillObj = skillValue as Record<string, Value>;

    // Try to find native SKILL.md
    let skillMdPath: string | null = null;

    if (isSkillsDir) {
      // Source is in @skills, look for sibling directories
      const basePath = sourceDir;
      skillMdPath = resolve(basePath, skillName, 'SKILL.md');
    } else {
      // Look in registry @skills directory
      skillMdPath = resolve(registryPath, '@skills', skillName, 'SKILL.md');
    }

    if (skillMdPath && (await fileExists(skillMdPath))) {
      try {
        const rawContent = await readFile(skillMdPath, 'utf-8');
        const parsed = parseSkillMd(rawContent);

        // Update skill with native content
        const updatedSkill: Record<string, Value> = { ...skillObj };

        // Use native content
        if (parsed.content) {
          // Create TextContent with synthetic location (loaded from file, not parsed)
          updatedSkill['content'] = {
            type: 'TextContent',
            value: parsed.content,
            loc: { file: skillMdPath, line: 1, column: 1, offset: 0 },
          } as TextContent;
        }

        // Use native description if not already set or if native is more complete
        if (parsed.description && (!skillObj['description'] ||
            (typeof skillObj['description'] === 'string' &&
             parsed.description.length > (skillObj['description'] as string).length))) {
          updatedSkill['description'] = parsed.description;
        }

        updatedProperties[skillName] = updatedSkill;
        hasUpdates = true;
      } catch {
        // Failed to read skill file, keep original
      }
    }
  }

  if (!hasUpdates) {
    return ast;
  }

  // Create updated skills block
  const updatedSkillsBlock: Block = {
    ...skillsBlock,
    content: {
      ...skillsContent,
      properties: updatedProperties,
    },
  };

  // Replace skills block in AST
  const updatedBlocks = ast.blocks.map((b) => (b.name === 'skills' ? updatedSkillsBlock : b));

  return {
    ...ast,
    blocks: updatedBlocks,
  };
}
