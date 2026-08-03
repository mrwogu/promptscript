import { describe, expect, it, vi } from 'vitest';
import { createBlockBody, normalizeProgram, type Program } from '@promptscript/core';
import { validate } from '../index.js';

describe('canonical validator input', () => {
  it('validates canonical programs through a detached compatibility boundary', () => {
    const loc = { file: 'canonical.prs', line: 1, column: 1, offset: 0 };
    const ast = normalizeProgram({
      type: 'Program',
      meta: {
        type: 'MetaBlock',
        fields: {
          id: 'canonical',
          syntax: '1.4.0',
        },
        loc,
      },
      uses: [],
      blocks: [
        {
          type: 'Block',
          name: 'identity',
          content: { type: 'TextContent', value: 'Canonical input', loc },
          loc,
        },
      ],
      extends: [],
      loc,
    });

    const result = validate(ast);

    expect(result.errors).toEqual([]);
    expect(Object.isFrozen(ast)).toBe(true);
  });

  it('projects canonical input before invoking a reused validator', () => {
    const loc = { file: 'canonical.prs', line: 1, column: 1, offset: 0 };
    const ast = normalizeProgram({
      type: 'Program',
      uses: [],
      blocks: [],
      extends: [],
      loc,
    });
    const customValidate = vi.fn((_program: Program) => ({
      valid: true,
      errors: [],
      warnings: [],
      infos: [],
      all: [],
    }));

    validate(ast, {
      validator: { validate: customValidate },
    });

    expect(customValidate).toHaveBeenCalledOnce();
    const projected = customValidate.mock.calls[0]![0];
    expect(projected.type).toBe('Program');
    expect(Object.isFrozen(projected)).toBe(false);
  });

  it('preserves canonical body metadata for validation rules', () => {
    const loc = { file: 'canonical.prs', line: 1, column: 1, offset: 0 };
    const ast = normalizeProgram({
      type: 'Program',
      uses: [],
      blocks: [
        {
          type: 'Block',
          name: 'restrictions',
          content: { type: 'ArrayContent', elements: ['Keep secrets safe'], loc },
          loc,
        },
      ],
      extends: [],
      loc,
    });
    const customValidate = vi.fn((_program: Program) => ({
      valid: true,
      errors: [],
      warnings: [],
      infos: [],
      all: [],
    }));

    validate(ast, {
      validator: { validate: customValidate },
    });

    expect(customValidate.mock.calls[0]![0].blocks[0]?.canonicalBody?.shape).toBe('array');
  });

  it('validates canonical dash lists by body shape instead of object projection', () => {
    const loc = { file: 'canonical.prs', line: 1, column: 1, offset: 0 };
    const ast: Program = {
      type: 'Program',
      meta: {
        type: 'MetaBlock',
        fields: { id: 'canonical', syntax: '1.5.0' },
        loc,
      },
      uses: [],
      blocks: [
        {
          type: 'Block',
          name: 'restrictions',
          content: {
            type: 'ObjectContent',
            properties: { items: ['Keep secrets safe'] },
            loc,
          },
          canonicalBody: createBlockBody(
            [
              {
                type: 'ListEntry',
                value: { type: 'ScalarValueNode', value: 'Keep secrets safe', loc },
                loc,
              },
            ],
            loc
          ),
          loc,
        },
      ],
      extends: [],
      loc,
    };

    const result = validate(ast);

    expect(result.all.filter((message) => message.ruleId === 'PS038')).toEqual([]);
  });
});
