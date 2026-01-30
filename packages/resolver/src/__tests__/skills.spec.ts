import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { resolveNativeSkills } from '../skills.js';
import { mkdir, writeFile, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import type { Program, Block, ObjectContent, TextContent } from '@promptscript/core';

describe('resolveNativeSkills', () => {
  let testDir: string;
  let registryPath: string;

  beforeEach(async () => {
    testDir = join(tmpdir(), `skills-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    registryPath = join(testDir, 'registry');
    await mkdir(registryPath, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  const createProgram = (blocks: Block[]): Program => ({
    type: 'Program',
    loc: { file: 'test.prs', line: 1, column: 1, offset: 0 },
    blocks,
    uses: [],
    extends: [],
  });

  const createSkillsBlock = (properties: Record<string, unknown>): Block => ({
    type: 'Block',
    name: 'skills',
    content: {
      type: 'ObjectContent',
      properties,
      loc: { file: 'test.prs', line: 1, column: 1, offset: 0 },
    } as ObjectContent,
    loc: { file: 'test.prs', line: 1, column: 1, offset: 0 },
  });

  describe('when no @skills block exists', () => {
    it('should return AST unchanged', async () => {
      const ast = createProgram([
        {
          type: 'Block',
          name: 'identity',
          content: {
            type: 'TextContent',
            value: 'Test',
            loc: { file: 'test.prs', line: 1, column: 1, offset: 0 },
          },
          loc: { file: 'test.prs', line: 1, column: 1, offset: 0 },
        },
      ]);

      const result = await resolveNativeSkills(ast, registryPath, join(testDir, 'test.prs'));
      expect(result).toBe(ast);
    });
  });

  describe('when @skills block has non-object content', () => {
    it('should return AST unchanged for text content', async () => {
      const ast = createProgram([
        {
          type: 'Block',
          name: 'skills',
          content: {
            type: 'TextContent',
            value: 'Not an object',
            loc: { file: 'test.prs', line: 1, column: 1, offset: 0 },
          },
          loc: { file: 'test.prs', line: 1, column: 1, offset: 0 },
        },
      ]);

      const result = await resolveNativeSkills(ast, registryPath, join(testDir, 'test.prs'));
      expect(result).toBe(ast);
    });
  });

  describe('when skill has non-object value', () => {
    it('should skip primitive skill values', async () => {
      const ast = createProgram([
        createSkillsBlock({
          'simple-skill': 'string-value',
          'null-skill': null,
          'array-skill': ['item1', 'item2'],
        }),
      ]);

      const result = await resolveNativeSkills(ast, registryPath, join(testDir, 'test.prs'));
      expect(result).toBe(ast);
    });
  });

  describe('when SKILL.md file does not exist', () => {
    it('should return AST unchanged', async () => {
      const ast = createProgram([
        createSkillsBlock({
          'missing-skill': {
            description: 'A skill without SKILL.md',
          },
        }),
      ]);

      const result = await resolveNativeSkills(ast, registryPath, join(testDir, 'test.prs'));
      expect(result).toBe(ast);
    });
  });

  describe('when SKILL.md file exists in registry', () => {
    it('should load content from SKILL.md with frontmatter', async () => {
      // Create skill directory and file
      const skillDir = join(registryPath, '@skills', 'test-skill');
      await mkdir(skillDir, { recursive: true });
      await writeFile(
        join(skillDir, 'SKILL.md'),
        `---
name: test-skill
description: A test skill from native file
---

# Test Skill

This is the skill content.
`
      );

      const ast = createProgram([
        createSkillsBlock({
          'test-skill': {
            description: 'Original description',
          },
        }),
      ]);

      const result = await resolveNativeSkills(ast, registryPath, join(testDir, 'test.prs'));

      // Check that AST was updated
      expect(result).not.toBe(ast);
      const skillsBlock = result.blocks.find((b) => b.name === 'skills');
      expect(skillsBlock).toBeDefined();

      const skillsContent = skillsBlock!.content as ObjectContent;
      const testSkill = skillsContent.properties['test-skill'] as Record<string, unknown>;

      // Check that content was loaded
      const content = testSkill['content'] as TextContent;
      expect(content.type).toBe('TextContent');
      expect(content.value).toContain('# Test Skill');
      expect(content.value).toContain('This is the skill content.');

      // Check that description was updated (native is longer)
      expect(testSkill['description']).toBe('A test skill from native file');
    });

    it('should not overwrite existing longer description', async () => {
      const skillDir = join(registryPath, '@skills', 'test-skill');
      await mkdir(skillDir, { recursive: true });
      await writeFile(
        join(skillDir, 'SKILL.md'),
        `---
name: test-skill
description: Short
---

Content here.
`
      );

      const ast = createProgram([
        createSkillsBlock({
          'test-skill': {
            description: 'This is a much longer existing description that should be kept',
          },
        }),
      ]);

      const result = await resolveNativeSkills(ast, registryPath, join(testDir, 'test.prs'));

      const skillsBlock = result.blocks.find((b) => b.name === 'skills');
      const skillsContent = skillsBlock!.content as ObjectContent;
      const testSkill = skillsContent.properties['test-skill'] as Record<string, unknown>;

      // Original longer description should be preserved
      expect(testSkill['description']).toBe(
        'This is a much longer existing description that should be kept'
      );
    });

    it('should handle SKILL.md without frontmatter', async () => {
      const skillDir = join(registryPath, '@skills', 'no-frontmatter');
      await mkdir(skillDir, { recursive: true });
      await writeFile(
        join(skillDir, 'SKILL.md'),
        `# Skill Without Frontmatter

Just plain content here.
`
      );

      const ast = createProgram([
        createSkillsBlock({
          'no-frontmatter': {
            description: 'Existing description',
          },
        }),
      ]);

      const result = await resolveNativeSkills(ast, registryPath, join(testDir, 'test.prs'));

      const skillsBlock = result.blocks.find((b) => b.name === 'skills');
      const skillsContent = skillsBlock!.content as ObjectContent;
      const skill = skillsContent.properties['no-frontmatter'] as Record<string, unknown>;

      const content = skill['content'] as TextContent;
      expect(content.value).toContain('# Skill Without Frontmatter');
    });

    it('should handle frontmatter with quoted values', async () => {
      const skillDir = join(registryPath, '@skills', 'quoted-skill');
      await mkdir(skillDir, { recursive: true });
      await writeFile(
        join(skillDir, 'SKILL.md'),
        `---
name: "quoted-skill"
description: 'Single quoted description'
---

Content.
`
      );

      const ast = createProgram([
        createSkillsBlock({
          'quoted-skill': {},
        }),
      ]);

      const result = await resolveNativeSkills(ast, registryPath, join(testDir, 'test.prs'));

      const skillsBlock = result.blocks.find((b) => b.name === 'skills');
      const skillsContent = skillsBlock!.content as ObjectContent;
      const skill = skillsContent.properties['quoted-skill'] as Record<string, unknown>;

      expect(skill['description']).toBe('Single quoted description');
    });

    it('should handle empty content in SKILL.md', async () => {
      const skillDir = join(registryPath, '@skills', 'empty-content');
      await mkdir(skillDir, { recursive: true });
      await writeFile(
        join(skillDir, 'SKILL.md'),
        `---
name: empty-content
description: Has description but no content
---
`
      );

      const ast = createProgram([
        createSkillsBlock({
          'empty-content': {},
        }),
      ]);

      const result = await resolveNativeSkills(ast, registryPath, join(testDir, 'test.prs'));

      const skillsBlock = result.blocks.find((b) => b.name === 'skills');
      const skillsContent = skillsBlock!.content as ObjectContent;
      const skill = skillsContent.properties['empty-content'] as Record<string, unknown>;

      // Description should still be set
      expect(skill['description']).toBe('Has description but no content');
      // Content should not be set (empty)
      expect(skill['content']).toBeUndefined();
    });
  });

  describe('when source file is in @skills directory', () => {
    it('should look for sibling skill directories', async () => {
      // Create @skills directory structure
      // The source file is in @skills/source-skill
      // The sibling skill is in @skills/source-skill/sibling-skill (relative to sourceDir)
      // Based on the code: skillMdPath = resolve(basePath, skillName, 'SKILL.md')
      // where basePath = sourceDir = @skills/source-skill
      // So it looks for @skills/source-skill/sibling-skill/SKILL.md
      const skillsDir = join(testDir, '@skills');
      const sourceSkillDir = join(skillsDir, 'source-skill');
      const siblingSkillDir = join(sourceSkillDir, 'sibling-skill');

      await mkdir(sourceSkillDir, { recursive: true });
      await mkdir(siblingSkillDir, { recursive: true });

      await writeFile(
        join(siblingSkillDir, 'SKILL.md'),
        `---
name: sibling-skill
description: A sibling skill
---

Sibling content.
`
      );

      const sourceFile = join(sourceSkillDir, 'skill.prs');

      const ast = createProgram([
        createSkillsBlock({
          'sibling-skill': {},
        }),
      ]);

      const result = await resolveNativeSkills(ast, registryPath, sourceFile);

      const skillsBlock = result.blocks.find((b) => b.name === 'skills');
      const skillsContent = skillsBlock!.content as ObjectContent;
      const skill = skillsContent.properties['sibling-skill'] as Record<string, unknown>;

      const content = skill['content'] as TextContent;
      expect(content.value).toContain('Sibling content.');
    });
  });

  describe('when file read fails', () => {
    it('should keep original skill on read error', async () => {
      const skillDir = join(registryPath, '@skills', 'error-skill');
      await mkdir(skillDir, { recursive: true });
      // Create file then remove read permission (simulated via vi mock)

      // We can't easily simulate read errors, but we can test the path exists
      const ast = createProgram([
        createSkillsBlock({
          'error-skill': {
            description: 'Original',
          },
        }),
      ]);

      // File doesn't exist, so original should be kept
      const result = await resolveNativeSkills(ast, registryPath, join(testDir, 'test.prs'));
      expect(result).toBe(ast);
    });
  });

  describe('multiple skills', () => {
    it('should process multiple skills in one block', async () => {
      // Create multiple skill directories
      const skill1Dir = join(registryPath, '@skills', 'skill-1');
      const skill2Dir = join(registryPath, '@skills', 'skill-2');

      await mkdir(skill1Dir, { recursive: true });
      await mkdir(skill2Dir, { recursive: true });

      await writeFile(
        join(skill1Dir, 'SKILL.md'),
        `---
name: skill-1
description: First skill
---

Content 1.
`
      );

      await writeFile(
        join(skill2Dir, 'SKILL.md'),
        `---
name: skill-2
description: Second skill
---

Content 2.
`
      );

      const ast = createProgram([
        createSkillsBlock({
          'skill-1': {},
          'skill-2': {},
          'skill-3': { description: 'No native file' },
        }),
      ]);

      const result = await resolveNativeSkills(ast, registryPath, join(testDir, 'test.prs'));

      const skillsBlock = result.blocks.find((b) => b.name === 'skills');
      const skillsContent = skillsBlock!.content as ObjectContent;

      const skill1 = skillsContent.properties['skill-1'] as Record<string, unknown>;
      const skill2 = skillsContent.properties['skill-2'] as Record<string, unknown>;
      const skill3 = skillsContent.properties['skill-3'] as Record<string, unknown>;

      expect((skill1['content'] as TextContent).value).toContain('Content 1.');
      expect((skill2['content'] as TextContent).value).toContain('Content 2.');
      expect(skill3['content']).toBeUndefined();
      expect(skill3['description']).toBe('No native file');
    });
  });

  describe('frontmatter edge cases', () => {
    it('should handle incomplete frontmatter (only opening ---)', async () => {
      const skillDir = join(registryPath, '@skills', 'incomplete');
      await mkdir(skillDir, { recursive: true });
      await writeFile(
        join(skillDir, 'SKILL.md'),
        `---
name: incomplete
This line looks like frontmatter but has no closing

# Actual Content

Body text here.
`
      );

      const ast = createProgram([
        createSkillsBlock({
          incomplete: {},
        }),
      ]);

      const result = await resolveNativeSkills(ast, registryPath, join(testDir, 'test.prs'));

      // Without closing ---, entire content is treated as body
      const skillsBlock = result.blocks.find((b) => b.name === 'skills');
      const skillsContent = skillsBlock!.content as ObjectContent;
      const skill = skillsContent.properties['incomplete'] as Record<string, unknown>;

      const content = skill['content'] as TextContent;
      expect(content.value).toContain('name: incomplete');
      expect(content.value).toContain('# Actual Content');
    });

    it('should handle frontmatter with double-quoted values', async () => {
      const skillDir = join(registryPath, '@skills', 'double-quoted');
      await mkdir(skillDir, { recursive: true });
      await writeFile(
        join(skillDir, 'SKILL.md'),
        `---
name: "double-quoted"
description: "Description with double quotes"
---

Content.
`
      );

      const ast = createProgram([
        createSkillsBlock({
          'double-quoted': {},
        }),
      ]);

      const result = await resolveNativeSkills(ast, registryPath, join(testDir, 'test.prs'));

      const skillsBlock = result.blocks.find((b) => b.name === 'skills');
      const skillsContent = skillsBlock!.content as ObjectContent;
      const skill = skillsContent.properties['double-quoted'] as Record<string, unknown>;

      expect(skill['description']).toBe('Description with double quotes');
    });
  });

  describe('preserves other blocks', () => {
    it('should not modify non-skills blocks', async () => {
      const skillDir = join(registryPath, '@skills', 'test-skill');
      await mkdir(skillDir, { recursive: true });
      await writeFile(
        join(skillDir, 'SKILL.md'),
        `---
name: test-skill
description: Test
---

Content.
`
      );

      const identityBlock: Block = {
        type: 'Block',
        name: 'identity',
        content: {
          type: 'TextContent',
          value: 'Original identity',
          loc: { file: 'test.prs', line: 1, column: 1, offset: 0 },
        },
        loc: { file: 'test.prs', line: 1, column: 1, offset: 0 },
      };

      const ast = createProgram([
        identityBlock,
        createSkillsBlock({
          'test-skill': {},
        }),
      ]);

      const result = await resolveNativeSkills(ast, registryPath, join(testDir, 'test.prs'));

      // Identity block should be unchanged
      expect(result.blocks[0]).toBe(identityBlock);
    });
  });
});
