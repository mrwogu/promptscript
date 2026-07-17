import { describe, it, expect } from 'vitest';
import { createSimpleMarkdownFormatter } from '../create-simple-formatter.js';
import type { Program } from '@promptscript/core';

function createLoc() {
  return { file: 'test.prs', line: 1, column: 0 };
}

function createMinimalProgram(): Program {
  return {
    type: 'Program',
    blocks: [],
    uses: [],
    extends: [],
    loc: createLoc(),
  };
}

const programWithIdentity: Program = {
  ...createMinimalProgram(),
  blocks: [
    {
      type: 'Block',
      name: 'identity',
      content: {
        type: 'TextContent',
        value: 'You are a test assistant.',
        loc: createLoc(),
      },
      loc: createLoc(),
    },
  ],
};

describe('Simple formatter skill capability reporting', () => {
  describe.each([
    { hasSkills: true, hasAgents: true, hasCommands: true },
    { hasSkills: true, hasAgents: false, hasCommands: false },
    { hasSkills: false, hasAgents: true, hasCommands: false },
    { hasSkills: false, hasAgents: false, hasCommands: true },
    { hasSkills: false, hasAgents: false, hasCommands: false },
  ])(
    'hasSkills=$hasSkills, hasAgents=$hasAgents, hasCommands=$hasCommands',
    ({ hasSkills, hasAgents, hasCommands }) => {
      const { Formatter } = createSimpleMarkdownFormatter({
        name: 'test-cap',
        outputPath: '.test-cap/rules/project.md',
        description: 'Test capability formatter',
        mainFileHeader: '# Test',
        dotDir: '.test-cap',
        hasSkills,
        hasAgents,
        hasCommands,
      });

      const formatter = new Formatter();

      it('getSkillBasePath() should return null when hasSkills is false', () => {
        if (hasSkills) {
          expect(formatter.getSkillBasePath()).toBe('.test-cap/skills');
        } else {
          expect(formatter.getSkillBasePath()).toBeNull();
        }
      });

      it('getSkillFileName() should return null when hasSkills is false', () => {
        if (hasSkills) {
          expect(formatter.getSkillFileName()).toBe('SKILL.md');
        } else {
          expect(formatter.getSkillFileName()).toBeNull();
        }
      });

      it('referencesMode() should return "none" when hasSkills is false', () => {
        if (hasSkills) {
          expect(formatter.referencesMode()).toBe('directory');
        } else {
          expect(formatter.referencesMode()).toBe('none');
        }
      });

      it('simple version should produce exactly one output file', () => {
        const result = formatter.format(programWithIdentity, { version: 'simple' });
        expect(result.path).toBeTruthy();
        expect(result.additionalFiles ?? []).toHaveLength(0);
      });

      it('full version should not produce skill files when hasSkills is false', () => {
        const result = formatter.format(programWithIdentity, { version: 'full' });
        // The main file should always exist
        expect(result.path).toBeTruthy();
        // When hasSkills is false, no additional skill files should be generated
        if (!hasSkills) {
          const allFiles = [result, ...(result.additionalFiles ?? [])];
          for (const file of allFiles) {
            expect(file.path).not.toMatch(/skills/i);
          }
        }
      });
    }
  );
});
