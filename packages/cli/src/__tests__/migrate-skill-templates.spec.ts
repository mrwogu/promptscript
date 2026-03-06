import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const SKILLS_DIR = resolve(__dirname, '..', '..', 'skills');

const MIGRATE_SKILL = readFileSync(
  resolve(SKILLS_DIR, 'migrate-to-promptscript', 'SKILL.md'),
  'utf-8'
);

const PROMPTSCRIPT_SKILL = readFileSync(resolve(SKILLS_DIR, 'promptscript', 'SKILL.md'), 'utf-8');

describe('bundled SKILL.md files', () => {
  describe('migrate-to-promptscript', () => {
    it('should have valid YAML frontmatter', () => {
      expect(MIGRATE_SKILL).toMatch(/^---\n/);
      expect(MIGRATE_SKILL).toMatch(/\n---\n/);
    });

    it('should have required OpenSkill frontmatter fields', () => {
      expect(MIGRATE_SKILL).toContain('name: migrate-to-promptscript');
      expect(MIGRATE_SKILL).toContain('description:');
    });

    it('should contain migration steps', () => {
      expect(MIGRATE_SKILL).toContain('Step 1: Discovery');
      expect(MIGRATE_SKILL).toContain('Step 2: Read and Analyze');
      expect(MIGRATE_SKILL).toContain('Step 3: Content Mapping');
      expect(MIGRATE_SKILL).toContain('Step 4: Generate PromptScript');
      expect(MIGRATE_SKILL).toContain('Step 5: File Organization');
      expect(MIGRATE_SKILL).toContain('Step 6: Configuration');
      expect(MIGRATE_SKILL).toContain('Step 7: Validation');
    });

    it('should contain content mapping table', () => {
      expect(MIGRATE_SKILL).toContain('@identity');
      expect(MIGRATE_SKILL).toContain('@context');
      expect(MIGRATE_SKILL).toContain('@standards');
      expect(MIGRATE_SKILL).toContain('@restrictions');
      expect(MIGRATE_SKILL).toContain('@shortcuts');
    });

    it('should contain quality checklist', () => {
      expect(MIGRATE_SKILL).toContain('Quality Checklist');
      expect(MIGRATE_SKILL).toContain('prs validate');
    });

    it('should mention file discovery patterns', () => {
      expect(MIGRATE_SKILL).toContain('CLAUDE.md');
      expect(MIGRATE_SKILL).toContain('.cursorrules');
      expect(MIGRATE_SKILL).toContain('copilot-instructions.md');
    });

    it('should mention prs compile', () => {
      expect(MIGRATE_SKILL).toContain('prs compile');
    });
  });

  describe('promptscript', () => {
    it('should have valid YAML frontmatter', () => {
      expect(PROMPTSCRIPT_SKILL).toMatch(/^---\n/);
      expect(PROMPTSCRIPT_SKILL).toMatch(/\n---\n/);
    });

    it('should have required OpenSkill frontmatter fields', () => {
      expect(PROMPTSCRIPT_SKILL).toContain('name: promptscript');
      expect(PROMPTSCRIPT_SKILL).toContain('description:');
    });

    it('should contain block reference', () => {
      expect(PROMPTSCRIPT_SKILL).toContain('@meta');
      expect(PROMPTSCRIPT_SKILL).toContain('@identity');
      expect(PROMPTSCRIPT_SKILL).toContain('@context');
      expect(PROMPTSCRIPT_SKILL).toContain('@standards');
      expect(PROMPTSCRIPT_SKILL).toContain('@restrictions');
      expect(PROMPTSCRIPT_SKILL).toContain('@shortcuts');
      expect(PROMPTSCRIPT_SKILL).toContain('@skills');
      expect(PROMPTSCRIPT_SKILL).toContain('@agents');
    });

    it('should contain inheritance and composition docs', () => {
      expect(PROMPTSCRIPT_SKILL).toContain('@inherit');
      expect(PROMPTSCRIPT_SKILL).toContain('@use');
      expect(PROMPTSCRIPT_SKILL).toContain('@extend');
    });

    it('should contain CLI commands', () => {
      expect(PROMPTSCRIPT_SKILL).toContain('prs init');
      expect(PROMPTSCRIPT_SKILL).toContain('prs compile');
      expect(PROMPTSCRIPT_SKILL).toContain('prs validate');
    });

    it('should contain output targets', () => {
      expect(PROMPTSCRIPT_SKILL).toContain('GitHub');
      expect(PROMPTSCRIPT_SKILL).toContain('Claude');
      expect(PROMPTSCRIPT_SKILL).toContain('Cursor');
    });

    it('should contain configuration reference', () => {
      expect(PROMPTSCRIPT_SKILL).toContain('promptscript.yaml');
    });
  });
});
