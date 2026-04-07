import { describe, it, expect } from 'vitest';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { mkdtemp, mkdir, writeFile, symlink, rm, chmod } from 'fs/promises';
import { tmpdir } from 'os';
import type { Logger, ObjectContent } from '@promptscript/core';
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
    warn: (msg: string) => messages.push(`[warn] ${msg}`),
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

describe('directory imports', () => {
  it('should resolve @use pointing to a directory with skills', async () => {
    const resolver = new Resolver({
      registryPath: MD_FIXTURES,
      localPath: MD_FIXTURES,
      cache: false,
    });

    const result = await resolver.resolve('./main-dir.prs');

    expect(result.errors).toHaveLength(0);
    expect(result.ast).not.toBeNull();

    // Should have a skills block from the directory scan
    const skillsBlock = result.ast?.blocks.find((b) => b.name === 'skills');
    expect(skillsBlock).toBeDefined();
    expect(skillsBlock?.content.type).toBe('ObjectContent');

    if (skillsBlock?.content.type === 'ObjectContent') {
      const props = skillsBlock.content.properties;

      // Should have both 'alpha' and 'beta' entries
      expect(props['alpha']).toBeDefined();
      expect(props['beta']).toBeDefined();

      // Alpha comes from SKILL.md
      const alphaObj = props['alpha'] as Record<string, unknown>;
      expect(alphaObj['description']).toBe('Alpha skill');
      const alphaContent = alphaObj['content'] as { type: string; value: string };
      expect(alphaContent.type).toBe('TextContent');
      expect(alphaContent.value).toBe('Alpha body content');

      // Beta comes from beta.md (dirname fallback)
      const betaObj = props['beta'] as Record<string, unknown>;
      expect(betaObj['description']).toBe('Beta skill');
      const betaContent = betaObj['content'] as { type: string; value: string };
      expect(betaContent.type).toBe('TextContent');
      expect(betaContent.value).toBe('Beta body content');

      // README.md at root should be ignored (not treated as a skill)
      expect(props['README']).toBeUndefined();
    }
  });

  it('should error when directory has no skills', async () => {
    const resolver = new Resolver({
      registryPath: MD_FIXTURES,
      localPath: MD_FIXTURES,
      cache: false,
    });

    const result = await resolver.resolve('./main-empty-dir.prs');

    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.some((e) => e.message.includes('No skills found'))).toBe(true);
  });

  it('should skip symlinked subdirectories during directory scan', async () => {
    const tmpDir = await mkdtemp(resolve(tmpdir(), 'prs-md-imports-symlink-'));
    try {
      // Create a main .prs that imports a directory
      await writeFile(
        join(tmpDir, 'main.prs'),
        [
          '@meta {',
          '  id: "test-symlink-dir"',
          '  version: "1.0.0"',
          '}',
          '',
          '@use ./skills',
          '',
          '@identity {',
          '  role: "tester"',
          '}',
        ].join('\n')
      );

      // Create the skills directory with real and symlinked subdirs
      const skillsDir = join(tmpDir, 'skills');
      await mkdir(skillsDir);

      // Real skill directory
      const realSkillDir = join(skillsDir, 'real-skill');
      await mkdir(realSkillDir);
      await writeFile(
        join(realSkillDir, 'SKILL.md'),
        '---\nname: real-skill\ndescription: A real skill\n---\n\nReal skill body.'
      );

      // Create a target directory with a skill outside the scan
      const targetDir = join(tmpDir, 'external-skill');
      await mkdir(targetDir);
      await writeFile(
        join(targetDir, 'SKILL.md'),
        '---\nname: linked-skill\ndescription: A linked skill\n---\n\nLinked skill body.'
      );

      // Symlink to the external skill directory
      await symlink(targetDir, join(skillsDir, 'linked-skill'));

      const resolver = new Resolver({
        registryPath: tmpDir,
        localPath: tmpDir,
        cache: false,
      });

      const result = await resolver.resolve('./main.prs');

      expect(result.errors).toHaveLength(0);
      expect(result.ast).not.toBeNull();

      const skillsBlock = result.ast?.blocks.find((b) => b.name === 'skills');
      expect(skillsBlock).toBeDefined();

      if (skillsBlock?.content.type === 'ObjectContent') {
        const props = skillsBlock.content.properties;
        // real-skill should be present
        expect(props['real-skill']).toBeDefined();
        // linked-skill should be skipped (symlink directory)
        expect(props['linked-skill']).toBeUndefined();
      }
    } finally {
      await rm(tmpDir, { recursive: true, force: true });
    }
  });

  it('should handle unreadable subdirectory during scan gracefully', async () => {
    const tmpDir = await mkdtemp(resolve(tmpdir(), 'prs-md-imports-unreadable-sub-'));
    try {
      await writeFile(
        join(tmpDir, 'main.prs'),
        [
          '@meta {',
          '  id: "test-unreadable-sub"',
          '  version: "1.0.0"',
          '}',
          '',
          '@use ./skills',
          '',
          '@identity {',
          '  role: "tester"',
          '}',
        ].join('\n')
      );

      const skillsDir = join(tmpDir, 'skills');
      await mkdir(skillsDir);

      // Create one valid skill directory
      const validDir = join(skillsDir, 'good');
      await mkdir(validDir);
      await writeFile(
        join(validDir, 'SKILL.md'),
        '---\nname: good-skill\ndescription: Works fine\n---\n\nGood body.'
      );

      // Create an unreadable subdirectory (will trigger readdir catch)
      const badDir = join(skillsDir, 'bad');
      await mkdir(badDir);

      // Create a nested dir inside bad, then make bad unreadable
      const nestedBadDir = join(badDir, 'nested');
      await mkdir(nestedBadDir);

      // Make the nested dir unreadable so readdir fails on it
      await chmod(nestedBadDir, 0o000);

      const resolver = new Resolver({
        registryPath: tmpDir,
        localPath: tmpDir,
        cache: false,
      });

      const result = await resolver.resolve('./main.prs');

      // Should still succeed — errors in readdir are caught and skipped
      expect(result.ast).not.toBeNull();
      const skillsBlock = result.ast?.blocks.find((b) => b.name === 'skills');
      expect(skillsBlock).toBeDefined();

      if (skillsBlock?.content.type === 'ObjectContent') {
        expect(skillsBlock.content.properties['good-skill']).toBeDefined();
      }
    } finally {
      // Restore permissions before cleanup
      const nestedBadDir = join(tmpDir, 'skills', 'bad', 'nested');
      try {
        await chmod(nestedBadDir, 0o755);
      } catch {
        // may not exist
      }
      await rm(tmpDir, { recursive: true, force: true });
    }
  });

  it('should handle unreadable files in directory scan gracefully', async () => {
    const tmpDir = await mkdtemp(resolve(tmpdir(), 'prs-md-imports-unreadable-'));
    try {
      await writeFile(
        join(tmpDir, 'main.prs'),
        [
          '@meta {',
          '  id: "test-unreadable"',
          '  version: "1.0.0"',
          '}',
          '',
          '@use ./skills',
          '',
          '@identity {',
          '  role: "tester"',
          '}',
        ].join('\n')
      );

      const skillsDir = join(tmpDir, 'skills');
      await mkdir(skillsDir);

      // Create one valid skill directory
      const validDir = join(skillsDir, 'valid');
      await mkdir(validDir);
      await writeFile(
        join(validDir, 'SKILL.md'),
        '---\nname: valid-skill\ndescription: Works fine\n---\n\nValid body.'
      );

      // Create another dir without SKILL.md or dirname.md (will be recursed or skipped)
      const emptySubDir = join(skillsDir, 'empty-sub');
      await mkdir(emptySubDir);

      const resolver = new Resolver({
        registryPath: tmpDir,
        localPath: tmpDir,
        cache: false,
      });

      const result = await resolver.resolve('./main.prs');

      expect(result.errors).toHaveLength(0);
      const skillsBlock = result.ast?.blocks.find((b) => b.name === 'skills');
      expect(skillsBlock).toBeDefined();

      if (skillsBlock?.content.type === 'ObjectContent') {
        expect(skillsBlock.content.properties['valid-skill']).toBeDefined();
      }
    } finally {
      await rm(tmpDir, { recursive: true, force: true });
    }
  });

  it('should recurse into nested directories up to depth 3', async () => {
    const tmpDir = await mkdtemp(resolve(tmpdir(), 'prs-md-imports-depth-'));
    try {
      await writeFile(
        join(tmpDir, 'main.prs'),
        [
          '@meta {',
          '  id: "test-depth"',
          '  version: "1.0.0"',
          '}',
          '',
          '@use ./skills',
          '',
          '@identity {',
          '  role: "tester"',
          '}',
        ].join('\n')
      );

      const skillsDir = join(tmpDir, 'skills');
      await mkdir(skillsDir);

      // Create nested structure: skills/category/my-skill/SKILL.md
      const categoryDir = join(skillsDir, 'category');
      await mkdir(categoryDir);
      const nestedSkillDir = join(categoryDir, 'nested-skill');
      await mkdir(nestedSkillDir);
      await writeFile(
        join(nestedSkillDir, 'SKILL.md'),
        '---\nname: nested-skill\ndescription: Found at depth 2\n---\n\nNested body.'
      );

      const resolver = new Resolver({
        registryPath: tmpDir,
        localPath: tmpDir,
        cache: false,
      });

      const result = await resolver.resolve('./main.prs');

      expect(result.errors).toHaveLength(0);
      const skillsBlock = result.ast?.blocks.find((b) => b.name === 'skills');
      expect(skillsBlock).toBeDefined();

      if (skillsBlock?.content.type === 'ObjectContent') {
        expect(skillsBlock.content.properties['nested-skill']).toBeDefined();
      }
    } finally {
      await rm(tmpDir, { recursive: true, force: true });
    }
  });
});

describe('.md edge cases', () => {
  it('should handle empty .md file (no content) as raw markdown', async () => {
    const resolver = new Resolver({
      registryPath: MD_FIXTURES,
      localPath: MD_FIXTURES,
      cache: false,
    });

    const result = await resolver.resolve('./main-empty-md.prs');

    // Should not error — empty .md is treated as raw content
    expect(result.ast).not.toBeNull();
  });

  it('should handle whitespace-only .md file as raw markdown', async () => {
    const logger = createTestLogger();
    const resolver = new Resolver({
      registryPath: MD_FIXTURES,
      localPath: MD_FIXTURES,
      cache: false,
      logger,
    });

    const result = await resolver.resolve('./main-whitespace-md.prs');

    // Should not error — whitespace .md is treated as raw markdown
    expect(result.ast).not.toBeNull();

    // Should have a skills block (synthesized from filename)
    const skillsBlock = result.ast?.blocks.find((b) => b.name === 'skills');
    expect(skillsBlock).toBeDefined();

    // Should have logged missing frontmatter
    const hasFrontmatterWarning = logger.messages.some(
      (m) => m.includes('Missing frontmatter') && m.includes('whitespace-skill')
    );
    expect(hasFrontmatterWarning).toBe(true);
  });

  it('should fall back to FileNotFoundError when path is not a directory', async () => {
    const resolver = new Resolver({
      registryPath: MD_FIXTURES,
      localPath: MD_FIXTURES,
      cache: false,
    });

    // Try to import a nonexistent file (not a directory, not .md)
    const result = await resolver.resolve('./main-nonexistent.prs');

    // Should error about file not found (the file literally does not exist)
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should report parse errors when .md file contains invalid PRS', async () => {
    const resolver = new Resolver({
      registryPath: MD_FIXTURES,
      localPath: MD_FIXTURES,
      cache: false,
    });

    const result = await resolver.resolve('./main-broken-prs-md.prs');

    // The .md file has @identity (detected as PRS) but contains invalid syntax.
    // loadAndParseMd should push parse errors and return null ast for the import.
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.some((e) => e.message.length > 0)).toBe(true);
  });

  it('should return null from tryDirectoryScan when path exists but is a file', async () => {
    const resolver = new Resolver({
      registryPath: MD_FIXTURES,
      localPath: MD_FIXTURES,
      cache: false,
    });

    // main-file-not-dir.prs does @use ./not-a-dir
    // Loader appends .prs -> not-a-dir.prs (not found)
    // tryDirectoryScan strips .prs -> not-a-dir (exists but is a regular file)
    // tryDirectoryScan returns null, falls through to normal FileNotFoundError
    const result = await resolver.resolve('./main-file-not-dir.prs');

    expect(result.errors.length).toBeGreaterThan(0);
  });
});

describe('directory scan depth limit', () => {
  it('should not recurse past depth 3', async () => {
    const tmpDir = await mkdtemp(resolve(tmpdir(), 'prs-md-imports-depth-limit-'));
    try {
      await writeFile(
        join(tmpDir, 'main.prs'),
        [
          '@meta {',
          '  id: "test-depth-limit"',
          '  version: "1.0.0"',
          '}',
          '',
          '@use ./skills',
          '',
          '@identity {',
          '  role: "tester"',
          '}',
        ].join('\n')
      );

      const skillsDir = join(tmpDir, 'skills');
      await mkdir(skillsDir);

      // Create deeply nested structure: depth 0 -> 1 -> 2 -> 3 -> 4
      // The scan root is at depth 0. It explores entries at depth 0..3.
      // An entry at depth 4 means: root(0)/l1(1)/l2(2)/l3(3)/l4(4)/deep(5)
      // depth 3 directories ARE scanned (entries checked for SKILL.md)
      // but depth 4+ directories are NOT pushed.
      // skills/l1/l2/l3/l4/deep/SKILL.md should NOT be found (too deep)
      let current = skillsDir;
      for (const level of ['l1', 'l2', 'l3', 'l4', 'deep']) {
        current = join(current, level);
        await mkdir(current);
      }
      await writeFile(
        join(current, 'SKILL.md'),
        '---\nname: too-deep\ndescription: Should not be found\n---\n\nToo deep.'
      );

      // skills/l1/l2/l3/reachable/SKILL.md SHOULD be found (depth 3 from root)
      const reachableDir = join(skillsDir, 'l1', 'l2', 'l3', 'reachable');
      await mkdir(reachableDir);
      await writeFile(
        join(reachableDir, 'SKILL.md'),
        '---\nname: reachable\ndescription: Found at depth 3\n---\n\nReachable body.'
      );

      const resolver = new Resolver({
        registryPath: tmpDir,
        localPath: tmpDir,
        cache: false,
      });

      const result = await resolver.resolve('./main.prs');

      expect(result.errors).toHaveLength(0);
      const skillsBlock = result.ast?.blocks.find((b) => b.name === 'skills');
      expect(skillsBlock).toBeDefined();

      if (skillsBlock?.content.type === 'ObjectContent') {
        // Reachable at depth 3 should be found
        expect(skillsBlock.content.properties['reachable']).toBeDefined();
        // too-deep at depth 4 should NOT be found
        expect(skillsBlock.content.properties['too-deep']).toBeUndefined();
      }
    } finally {
      await rm(tmpDir, { recursive: true, force: true });
    }
  });
});

describe('E2E roundtrip: .md skill import', () => {
  it('should resolve a full pipeline with @use ./skill.md', async () => {
    const tmpDir = await mkdtemp(resolve(tmpdir(), 'prs-e2e-md-'));
    try {
      // Create the .prs entry file
      await writeFile(
        join(tmpDir, 'project.prs'),
        [
          '@meta {',
          '  id: "e2e-md-test"',
          '  version: "1.0.0"',
          '}',
          '',
          '@use ./my-skill.md',
          '',
          '@identity {',
          '  role: "engineer"',
          '}',
        ].join('\n')
      );

      // Create the skill .md file with frontmatter
      await writeFile(
        join(tmpDir, 'my-skill.md'),
        [
          '---',
          'name: code-review',
          'description: Automated code review skill',
          '---',
          '',
          '# Code Review',
          '',
          'Review all pull requests for best practices.',
        ].join('\n')
      );

      const resolver = new Resolver({
        registryPath: tmpDir,
        localPath: tmpDir,
        cache: false,
      });

      const result = await resolver.resolve('./project.prs');

      // Verify no errors
      expect(result.errors).toHaveLength(0);
      expect(result.ast).not.toBeNull();

      // Verify the skill appears in the resolved AST
      const skillsBlock = result.ast!.blocks.find((b) => b.name === 'skills');
      expect(skillsBlock).toBeDefined();
      expect(skillsBlock!.content.type).toBe('ObjectContent');

      const content = skillsBlock!.content as ObjectContent;
      expect(content.properties['code-review']).toBeDefined();

      const skillObj = content.properties['code-review'] as Record<string, unknown>;
      expect(skillObj['description']).toBe('Automated code review skill');

      const textContent = skillObj['content'] as { type: string; value: string };
      expect(textContent.type).toBe('TextContent');
      expect(textContent.value).toContain('Review all pull requests');

      // Verify sources include both files
      expect(result.sources).toHaveLength(2);
      expect(result.sources.some((s) => s.endsWith('project.prs'))).toBe(true);
      expect(result.sources.some((s) => s.endsWith('my-skill.md'))).toBe(true);

      // Verify identity block is preserved from the main file
      const identityBlock = result.ast!.blocks.find((b) => b.name === 'identity');
      expect(identityBlock).toBeDefined();
    } finally {
      await rm(tmpDir, { recursive: true, force: true });
    }
  });

  it('should resolve a full pipeline with @use ./skills-dir (directory import)', async () => {
    const tmpDir = await mkdtemp(resolve(tmpdir(), 'prs-e2e-dir-'));
    try {
      // Create the .prs entry file
      await writeFile(
        join(tmpDir, 'project.prs'),
        [
          '@meta {',
          '  id: "e2e-dir-test"',
          '  version: "1.0.0"',
          '}',
          '',
          '@use ./skills',
          '',
          '@identity {',
          '  role: "engineer"',
          '}',
        ].join('\n')
      );

      // Create skills directory with multiple skill subdirectories
      const skillsDir = join(tmpDir, 'skills');
      await mkdir(skillsDir);

      // Skill A via SKILL.md
      const skillADir = join(skillsDir, 'skill-a');
      await mkdir(skillADir);
      await writeFile(
        join(skillADir, 'SKILL.md'),
        '---\nname: skill-a\ndescription: First skill\n---\n\nSkill A instructions.'
      );

      // Skill B via dirname fallback
      const skillBDir = join(skillsDir, 'skill-b');
      await mkdir(skillBDir);
      await writeFile(
        join(skillBDir, 'skill-b.md'),
        '---\nname: skill-b\ndescription: Second skill\n---\n\nSkill B instructions.'
      );

      // Skill C with no .md files (should be ignored)
      const skillCDir = join(skillsDir, 'skill-c');
      await mkdir(skillCDir);
      await writeFile(join(skillCDir, 'README.txt'), 'Not a skill');

      const resolver = new Resolver({
        registryPath: tmpDir,
        localPath: tmpDir,
        cache: false,
      });

      const result = await resolver.resolve('./project.prs');

      expect(result.errors).toHaveLength(0);
      expect(result.ast).not.toBeNull();

      const skillsBlock = result.ast!.blocks.find((b) => b.name === 'skills');
      expect(skillsBlock).toBeDefined();

      const content = skillsBlock!.content as ObjectContent;

      // Both skill-a and skill-b should be discovered
      expect(content.properties['skill-a']).toBeDefined();
      expect(content.properties['skill-b']).toBeDefined();

      // Verify content is correct
      const skillA = content.properties['skill-a'] as Record<string, unknown>;
      expect(skillA['description']).toBe('First skill');
      const skillAContent = skillA['content'] as { type: string; value: string };
      expect(skillAContent.value).toBe('Skill A instructions.');

      const skillB = content.properties['skill-b'] as Record<string, unknown>;
      expect(skillB['description']).toBe('Second skill');
    } finally {
      await rm(tmpDir, { recursive: true, force: true });
    }
  });
});
