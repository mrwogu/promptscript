import { describe, it, expect } from 'vitest';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { Logger } from '@promptscript/core';
import { Resolver } from '../resolver.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const MD_FIXTURES = resolve(__dirname, '__fixtures__', 'md-imports');

/**
 * Create a test logger that captures log messages.
 */
function createTestLogger(): Logger & { messages: string[] } {
  const messages: string[] = [];
  return {
    messages,
    verbose: (msg: string) => messages.push(`[verbose] ${msg}`),
    debug: (msg: string) => messages.push(`[debug] ${msg}`),
  };
}

describe('.md imports', () => {
  it('should resolve @use with .md skill that has frontmatter', async () => {
    const resolver = new Resolver({
      registryPath: MD_FIXTURES,
      localPath: MD_FIXTURES,
      cache: false,
    });

    const result = await resolver.resolve('./main-skill.prs');

    expect(result.errors).toHaveLength(0);
    expect(result.ast).not.toBeNull();

    // Should have a skills block from the .md import
    const skillsBlock = result.ast?.blocks.find((b) => b.name === 'skills');
    expect(skillsBlock).toBeDefined();
    expect(skillsBlock?.content.type).toBe('ObjectContent');

    if (skillsBlock?.content.type === 'ObjectContent') {
      const props = skillsBlock.content.properties;
      // Should have a 'test-skill' entry (name from frontmatter)
      expect(props['test-skill']).toBeDefined();

      const skillObj = props['test-skill'] as Record<string, unknown>;
      expect(skillObj['description']).toBe('A test skill');

      // Content should be a TextContent with the body
      const content = skillObj['content'] as { type: string; value: string };
      expect(content.type).toBe('TextContent');
      expect(content.value).toBe('This is the skill body content.');
    }
  });

  it('should resolve @use with raw .md (no frontmatter)', async () => {
    const logger = createTestLogger();
    const resolver = new Resolver({
      registryPath: MD_FIXTURES,
      localPath: MD_FIXTURES,
      cache: false,
      logger,
    });

    const result = await resolver.resolve('./main-raw.prs');

    expect(result.errors).toHaveLength(0);
    expect(result.ast).not.toBeNull();

    // Should have a skills block
    const skillsBlock = result.ast?.blocks.find((b) => b.name === 'skills');
    expect(skillsBlock).toBeDefined();
    expect(skillsBlock?.content.type).toBe('ObjectContent');

    if (skillsBlock?.content.type === 'ObjectContent') {
      const props = skillsBlock.content.properties;
      // Skill name derived from filename (raw-skill)
      expect(props['raw-skill']).toBeDefined();

      const skillObj = props['raw-skill'] as Record<string, unknown>;

      // Content should be a TextContent
      const content = skillObj['content'] as { type: string; value: string };
      expect(content.type).toBe('TextContent');
      expect(content.value).toContain('# Raw Skill');
    }

    // Should have logged a warning about missing frontmatter
    const hasFrontmatterWarning = logger.messages.some(
      (m) => m.includes('Missing frontmatter') && m.includes('raw-skill')
    );
    expect(hasFrontmatterWarning).toBe(true);
  });

  it('should resolve .md file containing PRS blocks as PRS', async () => {
    const resolver = new Resolver({
      registryPath: MD_FIXTURES,
      localPath: MD_FIXTURES,
      cache: false,
    });

    const result = await resolver.resolve('./main-prs-in-md.prs');

    expect(result.errors).toHaveLength(0);
    expect(result.ast).not.toBeNull();

    // The .md file contains @identity and @standards blocks
    // These should be merged into the target AST (not wrapped as skills)
    const identityBlock = result.ast?.blocks.find((b) => b.name === 'identity');
    expect(identityBlock).toBeDefined();

    // Identity should have content from both the import and the main file
    if (identityBlock?.content.type === 'ObjectContent') {
      // The imported .md has role: "developer", the main has role: "tester"
      // In resolveUses merge, source (import) wins for primitives
      expect(identityBlock.content.properties['role']).toBe('developer');
    }

    // Standards block should come from the imported .md
    const standardsBlock = result.ast?.blocks.find((b) => b.name === 'standards');
    expect(standardsBlock).toBeDefined();

    if (standardsBlock?.content.type === 'ObjectContent') {
      expect(standardsBlock.content.properties['testing']).toBe('Write tests for everything');
    }
  });

  it('should add .md file path to sources', async () => {
    const resolver = new Resolver({
      registryPath: MD_FIXTURES,
      localPath: MD_FIXTURES,
      cache: false,
    });

    const result = await resolver.resolve('./main-skill.prs');

    expect(result.sources).toHaveLength(2);
    expect(result.sources.some((s) => s.endsWith('main-skill.prs'))).toBe(true);
    expect(result.sources.some((s) => s.endsWith('skill-with-frontmatter.md'))).toBe(true);
  });
});
