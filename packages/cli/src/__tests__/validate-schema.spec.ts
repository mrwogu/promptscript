import { describe, expect, it } from 'vitest';
import { compileSchema } from './prompt-bundle-validators.js';

type Doc = Record<string, unknown>;

const SCHEMA_URL = 'https://getpromptscript.dev/schema/validate-report/v1.json';

describe('validate report schema', () => {
  const validate = compileSchema('validate-report-v1.json');
  const report = (): Doc => ({
    $schema: SCHEMA_URL,
    version: 1,
    success: false,
    errors: [
      {
        code: 'PS001',
        message: 'Something is wrong',
        location: { file: '/work/a.prs', line: 3, column: 5 },
      },
      { message: 'File not found: /work/b.prs' },
    ],
    warnings: [
      {
        ruleId: 'PS008',
        message: 'Block "standards" has no content',
        suggestion: 'Add content to the block or remove it if not needed',
        location: { file: '/work/a.prs', line: 12, column: 1, offset: 71 },
      },
    ],
    summary: { errorCount: 2, warningCount: 1 },
  });

  it('accepts a full report', () => {
    expect(validate(report()), JSON.stringify(validate.errors)).toBe(true);
  });

  it('accepts a clean report', () => {
    expect(
      validate({
        $schema: SCHEMA_URL,
        version: 1,
        success: true,
        errors: [],
        warnings: [],
        summary: { errorCount: 0, warningCount: 0 },
      })
    ).toBe(true);
  });

  it('accepts a cause code and still accepts errors without one', () => {
    const value = report();
    value['errors'] = [
      { code: 'PS2000', cause: 'PS1000', message: 'Unexpected end' },
      { code: 'PS2000', message: 'No cause' },
    ];
    expect(validate(value), JSON.stringify(validate.errors)).toBe(true);
  });

  it('rejects a cause that is not a PS code', () => {
    const value = report();
    value['errors'] = [{ code: 'PS2000', cause: 'parse', message: 'x' }];
    expect(validate(value)).toBe(false);
  });

  it('accepts the -1 position of a parse error', () => {
    const value = report();
    value['errors'] = [
      { message: 'Unexpected end', location: { file: 'a.prs', line: -1, column: -1 } },
    ];
    expect(validate(value), JSON.stringify(validate.errors)).toBe(true);
  });

  it.each([
    ['an extra property', { ...report(), extra: 1 }],
    [
      'another $schema',
      { ...report(), $schema: 'https://getpromptscript.dev/schema/diff/v1.json' },
    ],
    ['no $schema', { ...report(), $schema: undefined }],
    ['version 2', { ...report(), version: 2 }],
    ['no version', { ...report(), version: undefined }],
    ['no summary', { ...report(), summary: undefined }],
    [
      'a non-integer line',
      {
        ...report(),
        errors: [{ message: 'x', location: { line: 1.5 } }],
      },
    ],
    [
      'an extra key in a location',
      {
        ...report(),
        errors: [{ message: 'x', location: { file: 'a.prs', endLine: 4 } }],
      },
    ],
    ['an error without a message', { ...report(), errors: [{ code: 'PS001' }] }],
    ['a warning without a rule id', { ...report(), warnings: [{ message: 'x' }] }],
    [
      'a negative offset',
      {
        ...report(),
        warnings: [{ ruleId: 'PS008', message: 'x', location: { offset: -1 } }],
      },
    ],
  ])('rejects %s', (_name, value) => {
    expect(validate(value)).toBe(false);
  });
});
