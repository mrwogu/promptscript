import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const SKILLS_DIR = resolve(__dirname, '..', '..', 'skills');

const PROMPTSCRIPT_SKILL = readFileSync(resolve(SKILLS_DIR, 'promptscript', 'SKILL.md'), 'utf-8');

describe('bundled SKILL.md files', () => {
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

    it('should contain migration guidance', () => {
      expect(PROMPTSCRIPT_SKILL).toContain('prs import');
      expect(PROMPTSCRIPT_SKILL).toContain('Manual Migration');
    });

    it('should contain content mapping table for migration', () => {
      expect(PROMPTSCRIPT_SKILL).toContain('Source Pattern');
      expect(PROMPTSCRIPT_SKILL).toContain('PromptScript Block');
    });

    it('should mention file discovery patterns for migration', () => {
      expect(PROMPTSCRIPT_SKILL).toContain('CLAUDE.md');
      expect(PROMPTSCRIPT_SKILL).toContain('.cursorrules');
      expect(PROMPTSCRIPT_SKILL).toContain('copilot-instructions.md');
    });
  });
});
