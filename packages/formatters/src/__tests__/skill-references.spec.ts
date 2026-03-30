import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ClaudeFormatter } from '../formatters/claude.js';
import { GitHubFormatter } from '../formatters/github.js';
import { CursorFormatter } from '../formatters/cursor.js';
import { FactoryFormatter } from '../formatters/factory.js';
import { AntigravityFormatter } from '../formatters/antigravity.js';
import type { Program, SourceLocation, Value } from '@promptscript/core';

const loc: SourceLocation = { file: 'test.prs', line: 1, column: 1 };

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));
});
afterEach(() => {
  vi.useRealTimers();
});

function makeAst(skills: Record<string, unknown>): Program {
  return {
    type: 'Program',
    loc,
    uses: [],
    extends: [],
    blocks: [
      {
        type: 'Block',
        name: 'skills',
        content: {
          type: 'ObjectContent',
          properties: skills as Record<string, Value>,
          loc,
        },
        loc,
      },
    ],
  };
}

function collectAllFiles(output: {
  path: string;
  content: string;
  additionalFiles?: unknown[];
}): Array<{ path: string; content: string }> {
  const files = [{ path: output.path, content: output.content }];
  for (const af of (output.additionalFiles ?? []) as Array<typeof output>) {
    files.push(...collectAllFiles(af));
  }
  return files;
}

const skillWithRefs = {
  expert: {
    description: 'Expert skill',
    content: 'Help users.',
    resources: [{ relativePath: 'references/arch.md', content: '# Architecture\nMicroservices.' }],
  },
};

describe('formatter skill references', () => {
  // Directory mode formatters
  for (const [name, FormatterClass, mode] of [
    ['Claude', ClaudeFormatter, 'directory'],
    ['GitHub', GitHubFormatter, 'directory'],
    ['Factory', FactoryFormatter, 'directory'],
  ] as const) {
    describe(`${name} formatter (directory mode)`, () => {
      it(`should return '${mode}' referencesMode`, () => {
        expect(new FormatterClass().referencesMode()).toBe(mode);
      });

      it('should emit reference files with provenance', () => {
        const result = new FormatterClass().format(makeAst(skillWithRefs), { version: 'full' });
        const allFiles = collectAllFiles(result);
        const refFile = allFiles.find((f) => f.path.includes('references/arch.md'));
        expect(refFile).toBeDefined();
        expect(refFile!.content).toMatch(/<!-- from:.*arch\.md -->/);
      });
    });
  }

  // Inline mode formatters
  for (const [name, FormatterClass] of [
    ['Cursor', CursorFormatter],
    ['Antigravity', AntigravityFormatter],
  ] as const) {
    describe(`${name} formatter (inline mode)`, () => {
      it("should return 'inline' referencesMode", () => {
        expect(new FormatterClass().referencesMode()).toBe('inline');
      });

      it('should inline references in main output', () => {
        const result = new FormatterClass().format(makeAst(skillWithRefs));
        expect(result.content).toContain('## References');
        expect(result.content).toContain('arch.md');
        expect(result.content).toContain('Microservices.');
      });
    });
  }
});
