import { describe, it, expect } from 'vitest';
import { interpolateSkillContent } from '../skills.js';
import type { ParamDefinition, Value } from '@promptscript/core';

describe('interpolateSkillContent', () => {
  const makeParam = (
    name: string,
    kind: 'string' | 'number' | 'boolean' | 'enum',
    defaultValue?: Value,
    options?: string[]
  ): ParamDefinition => ({
    type: 'ParamDefinition',
    name,
    paramType: kind === 'enum' ? { kind, options: options ?? [] } : { kind },
    optional: defaultValue !== undefined,
    defaultValue,
    loc: { file: '<test>', line: 0, column: 0, offset: 0 },
  });

  it('interpolates {{var}} in content with provided args', () => {
    const result = interpolateSkillContent(
      'Review {{language}} code with {{mode}} mode.',
      [makeParam('language', 'string'), makeParam('mode', 'string', 'standard')],
      { language: 'typescript' }
    );
    expect(result).toBe('Review typescript code with standard mode.');
  });

  it('applies default values when args not provided', () => {
    const result = interpolateSkillContent(
      'Use {{framework}} framework.',
      [makeParam('framework', 'string', 'react')],
      {}
    );
    expect(result).toBe('Use react framework.');
  });

  it('returns content unchanged when no params defined', () => {
    const result = interpolateSkillContent('Plain content.', undefined, {});
    expect(result).toBe('Plain content.');
  });

  it('returns content unchanged when params is empty', () => {
    const result = interpolateSkillContent('Plain content.', [], {});
    expect(result).toBe('Plain content.');
  });

  it('throws on missing required param', () => {
    expect(() =>
      interpolateSkillContent('Use {{lang}}.', [makeParam('lang', 'string')], {})
    ).toThrow();
  });

  it('handles number interpolation', () => {
    const result = interpolateSkillContent(
      'Max {{count}} files.',
      [makeParam('count', 'number', 10)],
      {}
    );
    expect(result).toBe('Max 10 files.');
  });

  it('handles boolean interpolation', () => {
    const result = interpolateSkillContent(
      'Strict: {{strict}}.',
      [makeParam('strict', 'boolean', true)],
      {}
    );
    expect(result).toBe('Strict: true.');
  });
});
