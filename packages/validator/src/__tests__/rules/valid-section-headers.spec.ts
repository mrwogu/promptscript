import { describe, expect, it } from 'vitest';
import {
  createBlockBody,
  type PresentationEntry,
  type Program,
  type SourceLocation,
} from '@promptscript/core';
import { validSectionHeaders } from '../../rules/valid-section-headers.js';

const loc: SourceLocation = { file: 'headers.prs', line: 3, column: 3, offset: 42 };

function header(title: string, sectionId?: string): PresentationEntry {
  return {
    type: 'PresentationEntry',
    ...(sectionId ? { sectionId, sectionLoc: loc } : {}),
    title,
    source: 'explicit',
    loc,
    titleLoc: loc,
  };
}

function makeAst(blockName: string, entries: PresentationEntry[]): Program {
  return {
    type: 'Program',
    loc,
    meta: {
      type: 'MetaBlock',
      loc,
      fields: { id: 'test', syntax: '1.5.0' },
    },
    blocks: [
      {
        type: 'Block',
        name: blockName,
        content: { type: 'ObjectContent', properties: {}, loc },
        canonicalBody: createBlockBody(entries, loc),
        loc,
      },
    ],
    extends: [],
    uses: [],
  };
}

function validate(ast: Program): { message: string; location?: SourceLocation }[] {
  const messages: { message: string; location?: SourceLocation }[] = [];
  validSectionHeaders.validate({
    ast,
    report: (message) => messages.push(message),
    config: {},
  });
  return messages;
}

describe('PS037: valid-section-headers', () => {
  it('should accept primary and owned derived section overrides', () => {
    const messages = validate(
      makeAst('standards', [header('Coding Rules'), header('Commit Rules', 'git-commits')])
    );

    expect(messages).toHaveLength(0);
  });

  it('should reject multiline section titles', () => {
    const messages = validate(makeAst('standards', [header('Rules\n## Injected')]));

    expect(messages).toEqual([
      expect.objectContaining({
        message: 'Section header title must fit on one line.',
        location: loc,
      }),
    ]);
  });

  it('should reject invalid titles, keys, owners, and duplicates', () => {
    const messages = validate(
      makeAst('identity', [
        header(''),
        header('Unknown', 'missing'),
        header('Commit Rules', 'git-commits'),
        header('First'),
        header('Second'),
      ])
    );

    expect(messages.map((message) => message.message)).toEqual([
      'Section header title must be a non-empty string.',
      'Unknown section key "missing".',
      'Section "git-commits" is not owned by @identity.',
      'Duplicate section header override for "project".',
      'Duplicate section header override for "project".',
    ]);
    for (const message of messages) {
      expect(message.location).toEqual(loc);
    }
  });

  it('should reject primary overrides in custom blocks and nested extensions', () => {
    const customMessages = validate(makeAst('custom', [header('Custom')]));
    const nested = makeAst('standards', []);
    nested.blocks = [];
    nested.extends = [
      {
        type: 'ExtendBlock',
        targetPath: 'standards.code',
        content: { type: 'ObjectContent', properties: {}, loc },
        canonicalBody: createBlockBody([header('Nested')], loc),
        loc,
      },
    ];

    expect(customMessages[0]?.message).toContain('does not own a primary');
    expect(validate(nested)[0]?.message).toContain('root block extension');
  });

  it('should ignore normalized legacy heading entries', () => {
    const ast = makeAst('identity', [{ ...header('Legacy'), source: 'legacy' }]);

    expect(validate(ast)).toHaveLength(0);
  });
});
