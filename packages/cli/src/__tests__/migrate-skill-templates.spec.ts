import { describe, it, expect } from 'vitest';
import {
  MIGRATE_SKILL_CLAUDE,
  MIGRATE_SKILL_GITHUB,
  MIGRATE_SKILL_CURSOR,
  MIGRATE_SKILL_ANTIGRAVITY,
} from '../templates/migrate-skill.js';

describe('migrate-skill templates', () => {
  describe('MIGRATE_SKILL_CLAUDE', () => {
    it('should have valid YAML frontmatter', () => {
      expect(MIGRATE_SKILL_CLAUDE).toMatch(/^---\n/);
      expect(MIGRATE_SKILL_CLAUDE).toMatch(/\n---\n/);
    });

    it('should have required frontmatter fields', () => {
      expect(MIGRATE_SKILL_CLAUDE).toContain("name: 'migrate-to-promptscript'");
      expect(MIGRATE_SKILL_CLAUDE).toContain('description:');
      expect(MIGRATE_SKILL_CLAUDE).toContain('allowed-tools:');
      expect(MIGRATE_SKILL_CLAUDE).toContain('user-invocable: true');
    });

    it('should list Claude-specific tools', () => {
      expect(MIGRATE_SKILL_CLAUDE).toContain('- Read');
      expect(MIGRATE_SKILL_CLAUDE).toContain('- Write');
      expect(MIGRATE_SKILL_CLAUDE).toContain('- Glob');
      expect(MIGRATE_SKILL_CLAUDE).toContain('- Grep');
      expect(MIGRATE_SKILL_CLAUDE).toContain('- Bash');
    });

    it('should contain migration steps', () => {
      expect(MIGRATE_SKILL_CLAUDE).toContain('Step 1: Discovery');
      expect(MIGRATE_SKILL_CLAUDE).toContain('Step 2: Read and Analyze');
      expect(MIGRATE_SKILL_CLAUDE).toContain('Step 3: Content Mapping');
      expect(MIGRATE_SKILL_CLAUDE).toContain('Step 4: Generate PromptScript');
      expect(MIGRATE_SKILL_CLAUDE).toContain('Step 5: File Organization');
      expect(MIGRATE_SKILL_CLAUDE).toContain('Step 6: Configuration');
      expect(MIGRATE_SKILL_CLAUDE).toContain('Step 7: Validation');
    });

    it('should contain content mapping table', () => {
      expect(MIGRATE_SKILL_CLAUDE).toContain('@identity');
      expect(MIGRATE_SKILL_CLAUDE).toContain('@context');
      expect(MIGRATE_SKILL_CLAUDE).toContain('@standards');
      expect(MIGRATE_SKILL_CLAUDE).toContain('@restrictions');
      expect(MIGRATE_SKILL_CLAUDE).toContain('@shortcuts');
    });

    it('should contain quality checklist', () => {
      expect(MIGRATE_SKILL_CLAUDE).toContain('Quality Checklist');
      expect(MIGRATE_SKILL_CLAUDE).toContain('prs validate');
    });

    it('should mention file discovery patterns', () => {
      expect(MIGRATE_SKILL_CLAUDE).toContain('CLAUDE.md');
      expect(MIGRATE_SKILL_CLAUDE).toContain('.cursorrules');
      expect(MIGRATE_SKILL_CLAUDE).toContain('copilot-instructions.md');
    });
  });

  describe('MIGRATE_SKILL_GITHUB', () => {
    it('should have valid YAML frontmatter', () => {
      expect(MIGRATE_SKILL_GITHUB).toMatch(/^---\n/);
      expect(MIGRATE_SKILL_GITHUB).toMatch(/\n---\n/);
    });

    it('should have required frontmatter fields', () => {
      expect(MIGRATE_SKILL_GITHUB).toContain("name: 'migrate-to-promptscript'");
      expect(MIGRATE_SKILL_GITHUB).toContain('description:');
      expect(MIGRATE_SKILL_GITHUB).toContain('allowed-tools:');
      expect(MIGRATE_SKILL_GITHUB).toContain('user-invocable: true');
    });

    it('should list GitHub Copilot-specific tools (lowercase)', () => {
      // GitHub Copilot uses lowercase tool names
      expect(MIGRATE_SKILL_GITHUB).toContain('- read');
      expect(MIGRATE_SKILL_GITHUB).toContain('- write');
      expect(MIGRATE_SKILL_GITHUB).toContain('- glob');
      expect(MIGRATE_SKILL_GITHUB).toContain('- grep');
      expect(MIGRATE_SKILL_GITHUB).toContain('- execute');
    });

    it('should contain migration steps', () => {
      expect(MIGRATE_SKILL_GITHUB).toContain('Step 1: Discovery');
      expect(MIGRATE_SKILL_GITHUB).toContain('Step 2: Read and Analyze');
      expect(MIGRATE_SKILL_GITHUB).toContain('Step 3: Content Mapping');
    });

    it('should contain content mapping table', () => {
      expect(MIGRATE_SKILL_GITHUB).toContain('@identity');
      expect(MIGRATE_SKILL_GITHUB).toContain('@context');
      expect(MIGRATE_SKILL_GITHUB).toContain('@standards');
      expect(MIGRATE_SKILL_GITHUB).toContain('@restrictions');
    });
  });

  describe('MIGRATE_SKILL_CURSOR', () => {
    it('should NOT have YAML frontmatter (plain markdown command)', () => {
      expect(MIGRATE_SKILL_CURSOR).not.toMatch(/^---\n/);
    });

    it('should have a title', () => {
      expect(MIGRATE_SKILL_CURSOR).toContain('# Migrate to PromptScript');
    });

    it('should contain migration steps', () => {
      expect(MIGRATE_SKILL_CURSOR).toContain('Step 1: Discovery');
      expect(MIGRATE_SKILL_CURSOR).toContain('Step 2: Content Mapping');
      expect(MIGRATE_SKILL_CURSOR).toContain('Step 3: Generate PromptScript');
      expect(MIGRATE_SKILL_CURSOR).toContain('Step 4: Validation');
    });

    it('should contain content mapping table', () => {
      expect(MIGRATE_SKILL_CURSOR).toContain('@identity');
      expect(MIGRATE_SKILL_CURSOR).toContain('@context');
      expect(MIGRATE_SKILL_CURSOR).toContain('@standards');
      expect(MIGRATE_SKILL_CURSOR).toContain('@restrictions');
    });

    it('should contain syntax reference', () => {
      expect(MIGRATE_SKILL_CURSOR).toContain('Syntax Quick Reference');
      expect(MIGRATE_SKILL_CURSOR).toContain('triple quotes');
    });

    it('should contain quality checklist', () => {
      expect(MIGRATE_SKILL_CURSOR).toContain('Quality Checklist');
      expect(MIGRATE_SKILL_CURSOR).toContain('prs validate');
    });

    it('should mention file discovery patterns', () => {
      expect(MIGRATE_SKILL_CURSOR).toContain('CLAUDE.md');
      expect(MIGRATE_SKILL_CURSOR).toContain('.cursorrules');
      expect(MIGRATE_SKILL_CURSOR).toContain('copilot-instructions.md');
    });
  });

  describe('MIGRATE_SKILL_ANTIGRAVITY', () => {
    it('should NOT have YAML frontmatter (plain markdown rule)', () => {
      expect(MIGRATE_SKILL_ANTIGRAVITY).not.toMatch(/^---\n/);
    });

    it('should have a title', () => {
      expect(MIGRATE_SKILL_ANTIGRAVITY).toContain('# Migrate to PromptScript');
    });

    it('should contain overview section', () => {
      expect(MIGRATE_SKILL_ANTIGRAVITY).toContain('Overview');
      expect(MIGRATE_SKILL_ANTIGRAVITY).toContain('unified source of truth');
    });

    it('should contain migration steps', () => {
      expect(MIGRATE_SKILL_ANTIGRAVITY).toContain('Step 1: Discovery');
      expect(MIGRATE_SKILL_ANTIGRAVITY).toContain('Step 2: Content Mapping');
      expect(MIGRATE_SKILL_ANTIGRAVITY).toContain('Step 3: Generate PromptScript');
      expect(MIGRATE_SKILL_ANTIGRAVITY).toContain('Step 4: Validation');
    });

    it('should contain content mapping table', () => {
      expect(MIGRATE_SKILL_ANTIGRAVITY).toContain('@identity');
      expect(MIGRATE_SKILL_ANTIGRAVITY).toContain('@context');
      expect(MIGRATE_SKILL_ANTIGRAVITY).toContain('@standards');
      expect(MIGRATE_SKILL_ANTIGRAVITY).toContain('@restrictions');
    });

    it('should contain syntax reference', () => {
      expect(MIGRATE_SKILL_ANTIGRAVITY).toContain('Syntax Reference');
      expect(MIGRATE_SKILL_ANTIGRAVITY).toContain('triple quotes');
    });

    it('should mention Antigravity-specific files', () => {
      expect(MIGRATE_SKILL_ANTIGRAVITY).toContain('.agent/rules');
    });
  });

  describe('template consistency', () => {
    it('all templates should mention prs validate', () => {
      expect(MIGRATE_SKILL_CLAUDE).toContain('prs validate');
      expect(MIGRATE_SKILL_GITHUB).toContain('prs validate');
      expect(MIGRATE_SKILL_CURSOR).toContain('prs validate');
      expect(MIGRATE_SKILL_ANTIGRAVITY).toContain('prs validate');
    });

    it('all templates should mention prs compile', () => {
      expect(MIGRATE_SKILL_CLAUDE).toContain('prs compile');
      expect(MIGRATE_SKILL_GITHUB).toContain('prs compile');
      expect(MIGRATE_SKILL_CURSOR).toContain('prs compile');
      expect(MIGRATE_SKILL_ANTIGRAVITY).toContain('prs compile');
    });

    it('all templates should have content mapping section', () => {
      const contentMappingPattern = /Content Mapping/;
      expect(MIGRATE_SKILL_CLAUDE).toMatch(contentMappingPattern);
      expect(MIGRATE_SKILL_GITHUB).toMatch(contentMappingPattern);
      expect(MIGRATE_SKILL_CURSOR).toMatch(contentMappingPattern);
      expect(MIGRATE_SKILL_ANTIGRAVITY).toMatch(contentMappingPattern);
    });

    it('all templates should have @meta block mentioned', () => {
      expect(MIGRATE_SKILL_CLAUDE).toContain('@meta');
      expect(MIGRATE_SKILL_GITHUB).toContain('@meta');
      expect(MIGRATE_SKILL_CURSOR).toContain('@meta');
      expect(MIGRATE_SKILL_ANTIGRAVITY).toContain('@meta');
    });
  });
});
