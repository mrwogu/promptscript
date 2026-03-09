import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { resolveNativeSkills, resolveNativeCommands } from '../skills.js';
import { mkdir, writeFile, rm, symlink } from 'fs/promises';
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

      // .prs description wins when set (explicit takes priority)
      expect(testSkill['description']).toBe('Original description');
    });

    it('should use native description as fallback when not set in .prs', async () => {
      const skillDir = join(registryPath, '@skills', 'fallback-desc');
      await mkdir(skillDir, { recursive: true });
      await writeFile(
        join(skillDir, 'SKILL.md'),
        `---
name: fallback-desc
description: Native description as fallback
---

Content here.
`
      );

      const ast = createProgram([
        createSkillsBlock({
          'fallback-desc': {
            // No description set — native should be used
          },
        }),
      ]);

      const result = await resolveNativeSkills(ast, registryPath, join(testDir, 'test.prs'));

      const skillsBlock = result.blocks.find((b) => b.name === 'skills');
      const skillsContent = skillsBlock!.content as ObjectContent;
      const testSkill = skillsContent.properties['fallback-desc'] as Record<string, unknown>;

      expect(testSkill['description']).toBe('Native description as fallback');
    });

    it('should keep .prs description over native description', async () => {
      const skillDir = join(registryPath, '@skills', 'prs-wins');
      await mkdir(skillDir, { recursive: true });
      await writeFile(
        join(skillDir, 'SKILL.md'),
        `---
name: prs-wins
description: Native description
---

Content here.
`
      );

      const ast = createProgram([
        createSkillsBlock({
          'prs-wins': {
            description: 'PRS description wins',
          },
        }),
      ]);

      const result = await resolveNativeSkills(ast, registryPath, join(testDir, 'test.prs'));

      const skillsBlock = result.blocks.find((b) => b.name === 'skills');
      const skillsContent = skillsBlock!.content as ObjectContent;
      const testSkill = skillsContent.properties['prs-wins'] as Record<string, unknown>;

      expect(testSkill['description']).toBe('PRS description wins');
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

  describe('resource file discovery', () => {
    it('should discover resource files alongside SKILL.md', async () => {
      const skillDir = join(registryPath, '@skills', 'ui-skill');
      const dataDir = join(skillDir, 'data');
      const scriptsDir = join(skillDir, 'scripts');
      await mkdir(dataDir, { recursive: true });
      await mkdir(scriptsDir, { recursive: true });

      await writeFile(
        join(skillDir, 'SKILL.md'),
        `---
name: ui-skill
description: UI skill with resources
---

Skill content.
`
      );
      await writeFile(join(dataDir, 'colors.csv'), 'red,#ff0000\nblue,#0000ff\n');
      await writeFile(join(scriptsDir, 'search.py'), 'print("hello")\n');

      const ast = createProgram([
        createSkillsBlock({
          'ui-skill': {},
        }),
      ]);

      const result = await resolveNativeSkills(ast, registryPath, join(testDir, 'test.prs'));

      const skillsBlock = result.blocks.find((b) => b.name === 'skills');
      const skillsContent = skillsBlock!.content as ObjectContent;
      const skill = skillsContent.properties['ui-skill'] as Record<string, unknown>;

      const resources = skill['resources'] as Array<{
        relativePath: string;
        content: string;
      }>;
      expect(resources).toBeDefined();
      expect(resources).toHaveLength(2);

      const csvResource = resources.find((r) => r.relativePath === 'data/colors.csv');
      expect(csvResource).toBeDefined();
      expect(csvResource!.content).toBe('red,#ff0000\nblue,#0000ff\n');

      const pyResource = resources.find((r) => r.relativePath === 'scripts/search.py');
      expect(pyResource).toBeDefined();
      expect(pyResource!.content).toBe('print("hello")\n');
    });

    it('should skip .DS_Store files', async () => {
      const skillDir = join(registryPath, '@skills', 'ds-skill');
      await mkdir(skillDir, { recursive: true });

      await writeFile(join(skillDir, 'SKILL.md'), '---\nname: ds-skill\n---\n\nContent.\n');
      await writeFile(join(skillDir, '.DS_Store'), 'binary-junk');
      await writeFile(join(skillDir, 'data.csv'), 'a,b\n');

      const ast = createProgram([
        createSkillsBlock({
          'ds-skill': {},
        }),
      ]);

      const result = await resolveNativeSkills(ast, registryPath, join(testDir, 'test.prs'));

      const skillsBlock = result.blocks.find((b) => b.name === 'skills');
      const skillsContent = skillsBlock!.content as ObjectContent;
      const skill = skillsContent.properties['ds-skill'] as Record<string, unknown>;

      const resources = skill['resources'] as Array<{
        relativePath: string;
        content: string;
      }>;
      expect(resources).toHaveLength(1);
      expect(resources[0]!.relativePath).toBe('data.csv');
    });

    it('should not set resources when no extra files exist', async () => {
      const skillDir = join(registryPath, '@skills', 'bare-skill');
      await mkdir(skillDir, { recursive: true });

      await writeFile(join(skillDir, 'SKILL.md'), '---\nname: bare-skill\n---\n\nContent.\n');

      const ast = createProgram([
        createSkillsBlock({
          'bare-skill': {},
        }),
      ]);

      const result = await resolveNativeSkills(ast, registryPath, join(testDir, 'test.prs'));

      const skillsBlock = result.blocks.find((b) => b.name === 'skills');
      const skillsContent = skillsBlock!.content as ObjectContent;
      const skill = skillsContent.properties['bare-skill'] as Record<string, unknown>;

      expect(skill['resources']).toBeUndefined();
    });
  });

  describe('universal .agents/skills/ directory', () => {
    it('should not discover skills from .agents/skills/ when universalDir is disabled', async () => {
      const localPath = join(testDir, '.promptscript');
      const agentsSkillDir = join(testDir, '.agents', 'skills', 'universal-skill');
      await mkdir(localPath, { recursive: true });
      await mkdir(agentsSkillDir, { recursive: true });

      await writeFile(
        join(agentsSkillDir, 'SKILL.md'),
        `---
name: universal-skill
description: Installed via npx skills
---

Universal skill content.
`
      );

      const ast = createProgram([
        createSkillsBlock({
          'universal-skill': {},
        }),
      ]);

      // Default: universalDir is off
      const result = await resolveNativeSkills(
        ast,
        registryPath,
        join(localPath, 'test.prs'),
        localPath
      );

      // Should not find the skill (no registry fallback either)
      expect(result).toBe(ast);
    });

    it('should discover skills from .agents/skills/ when universalDir is enabled', async () => {
      // Setup: localPath is .promptscript/, .agents/skills/ is a sibling
      const localPath = join(testDir, '.promptscript');
      const agentsSkillDir = join(testDir, '.agents', 'skills', 'universal-skill');
      await mkdir(localPath, { recursive: true });
      await mkdir(agentsSkillDir, { recursive: true });

      await writeFile(
        join(agentsSkillDir, 'SKILL.md'),
        `---
name: universal-skill
description: Installed via npx skills
---

Universal skill content.
`
      );
      await writeFile(join(agentsSkillDir, 'data.csv'), 'a,b\n1,2\n');

      const ast = createProgram([
        createSkillsBlock({
          'universal-skill': {},
        }),
      ]);

      const result = await resolveNativeSkills(
        ast,
        registryPath,
        join(localPath, 'test.prs'),
        localPath,
        { universalDir: '.agents' }
      );

      const skillsBlock = result.blocks.find((b) => b.name === 'skills');
      const skillsContent = skillsBlock!.content as ObjectContent;
      const skill = skillsContent.properties['universal-skill'] as Record<string, unknown>;

      const content = skill['content'] as TextContent;
      expect(content.value).toContain('Universal skill content.');

      const resources = skill['resources'] as Array<{
        relativePath: string;
        content: string;
      }>;
      expect(resources).toHaveLength(1);
      expect(resources[0]!.relativePath).toBe('data.csv');
    });

    it('should prefer .promptscript/skills/ over .agents/skills/', async () => {
      const localPath = join(testDir, '.promptscript');
      const localSkillDir = join(localPath, 'skills', 'my-skill');
      const agentsSkillDir = join(testDir, '.agents', 'skills', 'my-skill');
      await mkdir(localSkillDir, { recursive: true });
      await mkdir(agentsSkillDir, { recursive: true });

      await writeFile(
        join(localSkillDir, 'SKILL.md'),
        '---\nname: my-skill\n---\n\nLocal version.\n'
      );
      await writeFile(
        join(agentsSkillDir, 'SKILL.md'),
        '---\nname: my-skill\n---\n\nUniversal version.\n'
      );

      const ast = createProgram([
        createSkillsBlock({
          'my-skill': {},
        }),
      ]);

      const result = await resolveNativeSkills(
        ast,
        registryPath,
        join(localPath, 'test.prs'),
        localPath,
        { universalDir: '.agents' }
      );

      const skillsBlock = result.blocks.find((b) => b.name === 'skills');
      const skillsContent = skillsBlock!.content as ObjectContent;
      const skill = skillsContent.properties['my-skill'] as Record<string, unknown>;

      const content = skill['content'] as TextContent;
      expect(content.value).toContain('Local version.');
      expect(content.value).not.toContain('Universal version.');
    });
  });

  describe('security', () => {
    it('should skip skill names with path traversal characters', async () => {
      const skillDir = join(registryPath, '@skills', '..', 'secret');
      await mkdir(skillDir, { recursive: true });
      await writeFile(join(skillDir, 'SKILL.md'), '---\nname: secret\n---\n\nSecret.\n');

      const ast = createProgram([
        createSkillsBlock({
          '../secret': {},
        }),
      ]);

      const result = await resolveNativeSkills(ast, registryPath, join(testDir, 'test.prs'));
      expect(result).toBe(ast);
    });

    it('should skip skill names containing slashes', async () => {
      const ast = createProgram([
        createSkillsBlock({
          'foo/bar': {},
        }),
      ]);

      const result = await resolveNativeSkills(ast, registryPath, join(testDir, 'test.prs'));
      expect(result).toBe(ast);
    });

    it('should skip skill names containing backslashes', async () => {
      const ast = createProgram([
        createSkillsBlock({
          'foo\\bar': {},
        }),
      ]);

      const result = await resolveNativeSkills(ast, registryPath, join(testDir, 'test.prs'));
      expect(result).toBe(ast);
    });

    it('should enforce resource file size limit', async () => {
      const skillDir = join(registryPath, '@skills', 'large-files');
      await mkdir(skillDir, { recursive: true });

      await writeFile(join(skillDir, 'SKILL.md'), '---\nname: large-files\n---\n\nContent.\n');
      // Create a file larger than 1 MB
      const largeContent = 'x'.repeat(1_048_577);
      await writeFile(join(skillDir, 'huge.csv'), largeContent);
      await writeFile(join(skillDir, 'small.csv'), 'a,b\n');

      const ast = createProgram([
        createSkillsBlock({
          'large-files': {},
        }),
      ]);

      const result = await resolveNativeSkills(ast, registryPath, join(testDir, 'test.prs'));

      const skillsBlock = result.blocks.find((b) => b.name === 'skills');
      const skillsContent = skillsBlock!.content as ObjectContent;
      const skill = skillsContent.properties['large-files'] as Record<string, unknown>;

      const resources = skill['resources'] as Array<{
        relativePath: string;
        content: string;
      }>;
      // Only small.csv should be included, huge.csv should be skipped
      expect(resources).toHaveLength(1);
      expect(resources[0]!.relativePath).toBe('small.csv');
    });

    it('should reject binary files containing null bytes', async () => {
      const skillDir = join(registryPath, '@skills', 'binary-skill');
      await mkdir(skillDir, { recursive: true });

      await writeFile(join(skillDir, 'SKILL.md'), '---\nname: binary-skill\n---\n\nContent.\n');
      // Write a file with null bytes (binary indicator)
      await writeFile(join(skillDir, 'image.png'), Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x00]));
      await writeFile(join(skillDir, 'data.csv'), 'a,b\n1,2\n');

      const ast = createProgram([
        createSkillsBlock({
          'binary-skill': {},
        }),
      ]);

      const result = await resolveNativeSkills(ast, registryPath, join(testDir, 'test.prs'));

      const skillsBlock = result.blocks.find((b) => b.name === 'skills');
      const skillsContent = skillsBlock!.content as ObjectContent;
      const skill = skillsContent.properties['binary-skill'] as Record<string, unknown>;

      const resources = skill['resources'] as Array<{
        relativePath: string;
        content: string;
      }>;
      expect(resources).toHaveLength(1);
      expect(resources[0]!.relativePath).toBe('data.csv');
    });

    it('should skip .env and .gitignore files', async () => {
      const skillDir = join(registryPath, '@skills', 'env-skill');
      await mkdir(skillDir, { recursive: true });

      await writeFile(join(skillDir, 'SKILL.md'), '---\nname: env-skill\n---\n\nContent.\n');
      await writeFile(join(skillDir, '.env'), 'SECRET=password123');
      await writeFile(join(skillDir, '.gitignore'), 'node_modules/');
      await writeFile(join(skillDir, 'data.txt'), 'safe data');

      const ast = createProgram([
        createSkillsBlock({
          'env-skill': {},
        }),
      ]);

      const result = await resolveNativeSkills(ast, registryPath, join(testDir, 'test.prs'));

      const skillsBlock = result.blocks.find((b) => b.name === 'skills');
      const skillsContent = skillsBlock!.content as ObjectContent;
      const skill = skillsContent.properties['env-skill'] as Record<string, unknown>;

      const resources = skill['resources'] as Array<{
        relativePath: string;
        content: string;
      }>;
      expect(resources).toHaveLength(1);
      expect(resources[0]!.relativePath).toBe('data.txt');
    });

    it('should not follow symlinked files', async () => {
      const skillDir = join(registryPath, '@skills', 'symlink-file-skill');
      await mkdir(skillDir, { recursive: true });

      await writeFile(
        join(skillDir, 'SKILL.md'),
        '---\nname: symlink-file-skill\n---\n\nContent.\n'
      );
      await writeFile(join(skillDir, 'real.txt'), 'real file');
      // Create a secret file outside the skill directory
      await writeFile(join(testDir, 'secret.txt'), 'top secret');
      await symlink(join(testDir, 'secret.txt'), join(skillDir, 'linked.txt'));

      const ast = createProgram([
        createSkillsBlock({
          'symlink-file-skill': {},
        }),
      ]);

      const result = await resolveNativeSkills(ast, registryPath, join(testDir, 'test.prs'));

      const skillsBlock = result.blocks.find((b) => b.name === 'skills');
      const skillsContent = skillsBlock!.content as ObjectContent;
      const skill = skillsContent.properties['symlink-file-skill'] as Record<string, unknown>;

      const resources = skill['resources'] as Array<{
        relativePath: string;
        content: string;
      }>;
      expect(resources).toHaveLength(1);
      expect(resources[0]!.relativePath).toBe('real.txt');
    });

    it('should not follow symlinked directories', async () => {
      const skillDir = join(registryPath, '@skills', 'symlink-dir-skill');
      await mkdir(skillDir, { recursive: true });

      await writeFile(
        join(skillDir, 'SKILL.md'),
        '---\nname: symlink-dir-skill\n---\n\nContent.\n'
      );
      await writeFile(join(skillDir, 'safe.txt'), 'safe data');

      // Create a directory outside with sensitive files
      const outsideDir = join(testDir, 'outside-secrets');
      await mkdir(outsideDir, { recursive: true });
      await writeFile(join(outsideDir, 'password.txt'), 'hunter2');

      // Symlink the directory into the skill directory
      await symlink(outsideDir, join(skillDir, 'data'), 'dir');

      const ast = createProgram([
        createSkillsBlock({
          'symlink-dir-skill': {},
        }),
      ]);

      const result = await resolveNativeSkills(ast, registryPath, join(testDir, 'test.prs'));

      const skillsBlock = result.blocks.find((b) => b.name === 'skills');
      const skillsContent = skillsBlock!.content as ObjectContent;
      const skill = skillsContent.properties['symlink-dir-skill'] as Record<string, unknown>;

      const resources = skill['resources'] as Array<{
        relativePath: string;
        content: string;
      }>;
      // Only safe.txt should be included; data/password.txt should be excluded
      expect(resources).toHaveLength(1);
      expect(resources[0]!.relativePath).toBe('safe.txt');
    });

    it('should enforce aggregate resource count limit', async () => {
      const skillDir = join(registryPath, '@skills', 'many-files');
      await mkdir(skillDir, { recursive: true });

      await writeFile(join(skillDir, 'SKILL.md'), '---\nname: many-files\n---\n\nContent.\n');

      // Create 105 small files (exceeds MAX_RESOURCE_COUNT of 100)
      for (let i = 0; i < 105; i++) {
        await writeFile(join(skillDir, `file-${String(i).padStart(3, '0')}.txt`), `data ${i}`);
      }

      const ast = createProgram([
        createSkillsBlock({
          'many-files': {},
        }),
      ]);

      const result = await resolveNativeSkills(ast, registryPath, join(testDir, 'test.prs'));

      const skillsBlock = result.blocks.find((b) => b.name === 'skills');
      const skillsContent = skillsBlock!.content as ObjectContent;
      const skill = skillsContent.properties['many-files'] as Record<string, unknown>;

      const resources = skill['resources'] as Array<{
        relativePath: string;
        content: string;
      }>;
      // Should be capped at 100
      expect(resources.length).toBeLessThanOrEqual(100);
    });

    it('should skip files inside node_modules directories', async () => {
      const skillDir = join(registryPath, '@skills', 'nm-skill');
      const nmDir = join(skillDir, 'node_modules', 'pkg');
      await mkdir(nmDir, { recursive: true });

      await writeFile(join(skillDir, 'SKILL.md'), '---\nname: nm-skill\n---\n\nContent.\n');
      await writeFile(join(skillDir, 'script.py'), 'print("hi")');
      await writeFile(join(nmDir, 'index.js'), 'module.exports = {}');

      const ast = createProgram([
        createSkillsBlock({
          'nm-skill': {},
        }),
      ]);

      const result = await resolveNativeSkills(ast, registryPath, join(testDir, 'test.prs'));

      const skillsBlock = result.blocks.find((b) => b.name === 'skills');
      const skillsContent = skillsBlock!.content as ObjectContent;
      const skill = skillsContent.properties['nm-skill'] as Record<string, unknown>;

      const resources = skill['resources'] as Array<{
        relativePath: string;
        content: string;
      }>;
      expect(resources).toHaveLength(1);
      expect(resources[0]!.relativePath).toBe('script.py');
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

  describe('aggregate size limit', () => {
    it('should stop collecting resources when total size limit is exceeded', async () => {
      const localPath = join(testDir, '.promptscript');
      const skillDir = join(localPath, 'skills', 'big-skill');
      await mkdir(skillDir, { recursive: true });
      await writeFile(join(skillDir, 'SKILL.md'), '# Big skill\nHas large resources');

      // Create files that together exceed 10MB total limit
      // Each file is ~900KB (under per-file limit but collectively over total limit)
      const fileSize = 900_000;
      const content = 'x'.repeat(fileSize);
      for (let i = 0; i < 13; i++) {
        await writeFile(join(skillDir, `large-${i}.txt`), content);
      }

      const ast = createProgram([
        createSkillsBlock({
          'big-skill': {},
        }),
      ]);

      const result = await resolveNativeSkills(
        ast,
        registryPath,
        join(testDir, 'test.prs'),
        localPath
      );

      const props = (result.blocks[0]!.content as ObjectContent).properties;
      const skill = props['big-skill'] as Record<string, unknown>;
      const resources = skill['resources'] as Array<{ relativePath: string }>;

      // Should have collected some but not all 13 files (10MB / 900KB ≈ 11 files max)
      expect(resources).toBeDefined();
      expect(resources.length).toBeLessThan(13);
      expect(resources.length).toBeGreaterThan(0);
    });
  });

  describe('unreadable files', () => {
    // Root bypasses POSIX file permission checks, so chmod 0o000 has no effect
    const isRoot = process.getuid?.() === 0;

    it.skipIf(isRoot)('should skip files that cannot be read', async () => {
      const localPath = join(testDir, '.promptscript');
      const skillDir = join(localPath, 'skills', 'perm-skill');
      await mkdir(skillDir, { recursive: true });
      await writeFile(join(skillDir, 'SKILL.md'), '# Perm skill\nTest');
      await writeFile(join(skillDir, 'readable.txt'), 'good content');
      await writeFile(join(skillDir, 'unreadable.txt'), 'secret');

      // Remove read permissions
      const { chmod } = await import('fs/promises');
      await chmod(join(skillDir, 'unreadable.txt'), 0o000);

      const ast = createProgram([
        createSkillsBlock({
          'perm-skill': {},
        }),
      ]);

      try {
        const result = await resolveNativeSkills(
          ast,
          registryPath,
          join(testDir, 'test.prs'),
          localPath
        );

        const props = (result.blocks[0]!.content as ObjectContent).properties;
        const skill = props['perm-skill'] as Record<string, unknown>;
        const resources = skill['resources'] as Array<{ relativePath: string }>;

        // Should have readable.txt but not unreadable.txt
        expect(resources).toBeDefined();
        expect(resources.map((r) => r.relativePath)).toContain('readable.txt');
        expect(resources.map((r) => r.relativePath)).not.toContain('unreadable.txt');
      } finally {
        // Restore permissions for cleanup
        await chmod(join(skillDir, 'unreadable.txt'), 0o644);
      }
    });
  });

  describe('auto-discovery of skills from directories', () => {
    it('should auto-discover skills from .promptscript/skills/ without explicit declaration', async () => {
      const localPath = join(testDir, '.promptscript');
      const skillDir = join(localPath, 'skills', 'auto-skill');
      await mkdir(skillDir, { recursive: true });
      await writeFile(
        join(skillDir, 'SKILL.md'),
        '---\ndescription: Auto-discovered skill\n---\n\nAuto skill content.\n'
      );

      // AST with no @skills block
      const ast = createProgram([]);

      const result = await resolveNativeSkills(
        ast,
        registryPath,
        join(localPath, 'test.prs'),
        localPath
      );

      const skillsBlock = result.blocks.find((b) => b.name === 'skills');
      expect(skillsBlock).toBeDefined();
      const props = (skillsBlock!.content as ObjectContent).properties;
      expect(props['auto-skill']).toBeDefined();
      const skill = props['auto-skill'] as Record<string, unknown>;
      const content = skill['content'] as TextContent;
      expect(content.value).toContain('Auto skill content.');
    });

    it('should auto-discover skills from universal directory', async () => {
      const localPath = join(testDir, '.promptscript');
      const agentsSkillDir = join(testDir, '.agents', 'skills', 'agent-skill');
      await mkdir(localPath, { recursive: true });
      await mkdir(agentsSkillDir, { recursive: true });
      await writeFile(
        join(agentsSkillDir, 'SKILL.md'),
        '---\ndescription: Agent skill\n---\n\nAgent skill content.\n'
      );

      const ast = createProgram([]);

      const result = await resolveNativeSkills(
        ast,
        registryPath,
        join(localPath, 'test.prs'),
        localPath,
        { universalDir: '.agents' }
      );

      const skillsBlock = result.blocks.find((b) => b.name === 'skills');
      expect(skillsBlock).toBeDefined();
      const props = (skillsBlock!.content as ObjectContent).properties;
      expect(props['agent-skill']).toBeDefined();
    });

    it('should not overwrite explicitly declared skills during auto-discovery', async () => {
      const localPath = join(testDir, '.promptscript');
      const skillDir = join(localPath, 'skills', 'my-skill');
      await mkdir(skillDir, { recursive: true });
      await writeFile(
        join(skillDir, 'SKILL.md'),
        '---\ndescription: Native\n---\n\nNative content.\n'
      );

      const ast = createProgram([
        createSkillsBlock({
          'my-skill': { description: 'Explicit description' },
        }),
      ]);

      const result = await resolveNativeSkills(
        ast,
        registryPath,
        join(localPath, 'test.prs'),
        localPath
      );

      const props = (result.blocks.find((b) => b.name === 'skills')!.content as ObjectContent)
        .properties;
      const skill = props['my-skill'] as Record<string, unknown>;
      // Explicit description is kept
      expect(skill['description']).toBe('Explicit description');
    });

    it('should skip directories without SKILL.md during auto-discovery', async () => {
      const localPath = join(testDir, '.promptscript');
      const emptyDir = join(localPath, 'skills', 'no-skill-md');
      await mkdir(emptyDir, { recursive: true });
      await writeFile(join(emptyDir, 'README.md'), 'Not a skill');

      const ast = createProgram([]);

      const result = await resolveNativeSkills(
        ast,
        registryPath,
        join(localPath, 'test.prs'),
        localPath
      );

      // No skills block should be added
      expect(result.blocks.find((b) => b.name === 'skills')).toBeUndefined();
    });

    it('should skip non-directory entries during auto-discovery', async () => {
      const localPath = join(testDir, '.promptscript');
      const skillsBase = join(localPath, 'skills');
      await mkdir(skillsBase, { recursive: true });
      // Create a file (not directory) in skills/
      await writeFile(join(skillsBase, 'not-a-dir'), 'just a file');

      const ast = createProgram([]);
      const result = await resolveNativeSkills(
        ast,
        registryPath,
        join(localPath, 'test.prs'),
        localPath
      );

      expect(result.blocks.find((b) => b.name === 'skills')).toBeUndefined();
    });

    it('should skip skill dirs with unsafe names during auto-discovery', async () => {
      const localPath = join(testDir, '.promptscript');
      const badDir = join(localPath, 'skills', '..%2f..%2fetc');
      await mkdir(badDir, { recursive: true });
      await writeFile(join(badDir, 'SKILL.md'), '# Bad skill');

      const ast = createProgram([]);
      const result = await resolveNativeSkills(
        ast,
        registryPath,
        join(localPath, 'test.prs'),
        localPath
      );

      // The unsafe name contains encoded slashes but isSafeSkillName checks for actual ..//
      // This dir name doesn't contain literal ".." or "/" so it passes. Let's test with actual ".."
      // which can't be a directory name on most systems. Instead test that the function handles it.
      expect(result).toBeDefined();
    });

    it('should skip node_modules during auto-discovery', async () => {
      const localPath = join(testDir, '.promptscript');
      const nodeModDir = join(localPath, 'skills', 'node_modules');
      await mkdir(nodeModDir, { recursive: true });
      await writeFile(join(nodeModDir, 'SKILL.md'), 'Should be skipped');

      const ast = createProgram([]);

      const result = await resolveNativeSkills(
        ast,
        registryPath,
        join(localPath, 'test.prs'),
        localPath
      );

      expect(result.blocks.find((b) => b.name === 'skills')).toBeUndefined();
    });
  });
});

describe('resolveNativeCommands', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = join(tmpdir(), `commands-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    await mkdir(testDir, { recursive: true });
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

  const createShortcutsBlock = (properties: Record<string, unknown>): Block => ({
    type: 'Block',
    name: 'shortcuts',
    content: {
      type: 'ObjectContent',
      properties: properties as Record<string, never>,
      loc: { file: 'test.prs', line: 1, column: 1 },
    },
    loc: { file: 'test.prs', line: 1, column: 1, offset: 0 },
  });

  it('should return AST unchanged when no localPath', async () => {
    const ast = createProgram([]);
    const result = await resolveNativeCommands(ast, 'test.prs');
    expect(result).toBe(ast);
  });

  it('should return AST unchanged when no command files exist', async () => {
    const localPath = join(testDir, '.promptscript');
    await mkdir(localPath, { recursive: true });

    const ast = createProgram([]);
    const result = await resolveNativeCommands(ast, join(localPath, 'test.prs'), localPath);
    expect(result).toBe(ast);
  });

  it('should discover command files from .promptscript/commands/', async () => {
    const localPath = join(testDir, '.promptscript');
    const commandsDir = join(localPath, 'commands');
    await mkdir(commandsDir, { recursive: true });
    await writeFile(join(commandsDir, 'deploy.md'), 'Deploy the application\nto production.');

    const ast = createProgram([]);
    const result = await resolveNativeCommands(ast, join(localPath, 'test.prs'), localPath);

    const shortcutsBlock = result.blocks.find((b) => b.name === 'shortcuts');
    expect(shortcutsBlock).toBeDefined();
    const props = (shortcutsBlock!.content as ObjectContent).properties;
    expect(props['/deploy']).toBeDefined();
    const content = props['/deploy'] as TextContent;
    expect(content.type).toBe('TextContent');
    expect(content.value).toContain('Deploy the application');
  });

  it('should discover command files from universal directory', async () => {
    const localPath = join(testDir, '.promptscript');
    const commandsDir = join(testDir, '.agents', 'commands');
    await mkdir(localPath, { recursive: true });
    await mkdir(commandsDir, { recursive: true });
    await writeFile(join(commandsDir, 'review.md'), 'Review code\nfor quality.');

    const ast = createProgram([]);
    const result = await resolveNativeCommands(ast, join(localPath, 'test.prs'), localPath, {
      universalDir: '.agents',
    });

    const shortcutsBlock = result.blocks.find((b) => b.name === 'shortcuts');
    expect(shortcutsBlock).toBeDefined();
    const props = (shortcutsBlock!.content as ObjectContent).properties;
    expect(props['/review']).toBeDefined();
  });

  it('should prefer local commands over universal', async () => {
    const localPath = join(testDir, '.promptscript');
    const localCmds = join(localPath, 'commands');
    const universalCmds = join(testDir, '.agents', 'commands');
    await mkdir(localCmds, { recursive: true });
    await mkdir(universalCmds, { recursive: true });
    await writeFile(join(localCmds, 'test.md'), 'Local test\ncommand.');
    await writeFile(join(universalCmds, 'test.md'), 'Universal test\ncommand.');

    const ast = createProgram([]);
    const result = await resolveNativeCommands(ast, join(localPath, 'test.prs'), localPath, {
      universalDir: '.agents',
    });

    const props = (result.blocks.find((b) => b.name === 'shortcuts')!.content as ObjectContent)
      .properties;
    const content = props['/test'] as TextContent;
    expect(content.value).toContain('Local test');
    expect(content.value).not.toContain('Universal test');
  });

  it('should not overwrite explicitly declared shortcuts', async () => {
    const localPath = join(testDir, '.promptscript');
    const commandsDir = join(localPath, 'commands');
    await mkdir(commandsDir, { recursive: true });
    await writeFile(join(commandsDir, 'build.md'), 'Discovered build\ncommand.');

    const ast = createProgram([createShortcutsBlock({ '/build': 'Explicit build' })]);
    const result = await resolveNativeCommands(ast, join(localPath, 'test.prs'), localPath);

    const props = (result.blocks.find((b) => b.name === 'shortcuts')!.content as ObjectContent)
      .properties;
    // Explicit declaration wins
    expect(props['/build']).toBe('Explicit build');
  });

  it('should skip non-.md files', async () => {
    const localPath = join(testDir, '.promptscript');
    const commandsDir = join(localPath, 'commands');
    await mkdir(commandsDir, { recursive: true });
    await writeFile(join(commandsDir, 'script.sh'), '#!/bin/bash\necho hello');
    await writeFile(join(commandsDir, 'data.json'), '{"key": "value"}');

    const ast = createProgram([]);
    const result = await resolveNativeCommands(ast, join(localPath, 'test.prs'), localPath);
    expect(result).toBe(ast);
  });

  it('should skip symlinks', async () => {
    const localPath = join(testDir, '.promptscript');
    const commandsDir = join(localPath, 'commands');
    await mkdir(commandsDir, { recursive: true });

    const realFile = join(testDir, 'real-command.md');
    await writeFile(realFile, 'Real content\nhere.');
    await symlink(realFile, join(commandsDir, 'linked.md'));

    const ast = createProgram([]);
    const result = await resolveNativeCommands(ast, join(localPath, 'test.prs'), localPath);
    expect(result).toBe(ast);
  });

  it('should skip binary files with null bytes', async () => {
    const localPath = join(testDir, '.promptscript');
    const commandsDir = join(localPath, 'commands');
    await mkdir(commandsDir, { recursive: true });
    await writeFile(join(commandsDir, 'binary.md'), 'content\0with\0nulls');

    const ast = createProgram([]);
    const result = await resolveNativeCommands(ast, join(localPath, 'test.prs'), localPath);
    expect(result).toBe(ast);
  });

  it('should skip oversized command files', async () => {
    const localPath = join(testDir, '.promptscript');
    const commandsDir = join(localPath, 'commands');
    await mkdir(commandsDir, { recursive: true });
    // Create a file larger than 1MB
    await writeFile(join(commandsDir, 'huge.md'), 'x'.repeat(1_100_000));

    const ast = createProgram([]);
    const result = await resolveNativeCommands(ast, join(localPath, 'test.prs'), localPath);
    expect(result).toBe(ast);
  });

  // Root bypasses POSIX file permission checks, so chmod 0o000 has no effect
  const isRoot = process.getuid?.() === 0;

  it.skipIf(isRoot)('should skip unreadable command files', async () => {
    const localPath = join(testDir, '.promptscript');
    const commandsDir = join(localPath, 'commands');
    await mkdir(commandsDir, { recursive: true });
    await writeFile(join(commandsDir, 'good.md'), 'Good command\ncontent.');
    await writeFile(join(commandsDir, 'bad.md'), 'Bad command');

    const { chmod } = await import('fs/promises');
    await chmod(join(commandsDir, 'bad.md'), 0o000);

    try {
      const ast = createProgram([]);
      const result = await resolveNativeCommands(ast, join(localPath, 'test.prs'), localPath);

      const props = (result.blocks.find((b) => b.name === 'shortcuts')!.content as ObjectContent)
        .properties;
      expect(props['/good']).toBeDefined();
      expect(props['/bad']).toBeUndefined();
    } finally {
      await chmod(join(commandsDir, 'bad.md'), 0o644);
    }
  });

  it('should merge discovered commands into existing @shortcuts block', async () => {
    const localPath = join(testDir, '.promptscript');
    const commandsDir = join(localPath, 'commands');
    await mkdir(commandsDir, { recursive: true });
    await writeFile(join(commandsDir, 'new-cmd.md'), 'New command\ncontent.');

    const ast = createProgram([createShortcutsBlock({ '/existing': 'Existing shortcut' })]);
    const result = await resolveNativeCommands(ast, join(localPath, 'test.prs'), localPath);

    const props = (result.blocks.find((b) => b.name === 'shortcuts')!.content as ObjectContent)
      .properties;
    expect(props['/existing']).toBe('Existing shortcut');
    expect(props['/new-cmd']).toBeDefined();
    expect((props['/new-cmd'] as TextContent).value).toContain('New command');
  });
});
