import { describe, it, expect } from 'vitest';
import { FormatterRegistry } from '../index.js';
import { KNOWN_TARGETS } from '@promptscript/core';
import type { Program } from '@promptscript/core';

const AGENTS_MD_TARGETS = ['aider', 'amazon-q', 'warp', 'zed', 'jules', 'devin'] as const;

function createLoc() {
  return { file: 'test.prs', line: 1, column: 0 };
}

function createProgramWithIdentity(): Program {
  return {
    type: 'Program',
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
    uses: [],
    extends: [],
    loc: createLoc(),
  };
}

describe('AGENTS.md-only target family', () => {
  describe.each(AGENTS_MD_TARGETS)('%s', (target) => {
    const formatter = FormatterRegistry.get(target);

    it('should be registered', () => {
      expect(formatter).toBeDefined();
    });

    it('should have outputPath as AGENTS.md', () => {
      expect(formatter!.outputPath).toBe('AGENTS.md');
    });

    it('should have hasSkills returning null basePath', () => {
      expect(formatter!.getSkillBasePath()).toBeNull();
    });

    it('should have hasSkills returning null fileName', () => {
      expect(formatter!.getSkillFileName()).toBeNull();
    });

    it('should have referencesMode as none', () => {
      expect(formatter!.referencesMode()).toBe('none');
    });

    it.each(['simple', 'multifile', 'full'])(
      'version %s should emit exactly one AGENTS.md file',
      (version) => {
        const result = formatter!.format(createProgramWithIdentity(), { version });
        expect(result.path).toBe('AGENTS.md');
        expect(result.additionalFiles ?? []).toHaveLength(0);
      }
    );

    it('should not contain target branding in output content', () => {
      const result = formatter!.format(createProgramWithIdentity());
      const content = result.content.toLowerCase();
      // Content should not mention the target name as a header
      expect(content).not.toMatch(new RegExp(`#\\s+${target}`, 'i'));
    });

    it('should support custom output path override', () => {
      const result = formatter!.format(createProgramWithIdentity(), {
        outputPath: 'CUSTOM.md',
      });
      expect(result.path).toBe('CUSTOM.md');
    });
  });

  it('should have all AGENTS.md-only targets in KNOWN_TARGETS', () => {
    for (const target of AGENTS_MD_TARGETS) {
      expect(KNOWN_TARGETS).toContain(target);
    }
  });

  it('should all produce identical output for the same AST', () => {
    const ast = createProgramWithIdentity();
    const outputs = AGENTS_MD_TARGETS.map((t) => FormatterRegistry.get(t)!.format(ast).content);
    const first = outputs[0];
    for (let i = 1; i < outputs.length; i++) {
      expect(
        outputs[i],
        `${AGENTS_MD_TARGETS[i]} output differs from ${AGENTS_MD_TARGETS[0]}`
      ).toBe(first);
    }
  });
});
