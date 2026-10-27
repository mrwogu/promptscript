import { readFileSync } from 'node:fs';
import { Ajv } from 'ajv';
import { describe, expect, it } from 'vitest';
import {
  createReleaseReport,
  RELEASE_REPORT_SCHEMA_URL,
  RELEASE_REPORT_VERSION,
  toReleaseLocation,
} from '../utils/release-report.js';
import { validateLabel, validateReleaseReport } from './prompt-bundle-validators.js';

const readSchema = (name: string): object =>
  JSON.parse(
    readFileSync(new URL(`../../../../schema/${name}`, import.meta.url), 'utf8')
  ) as object;

describe('config schema releases key', () => {
  const validate = new Ajv({ strict: false }).compile(readSchema('config.json'));
  const config = (environments: unknown): object => ({
    id: 'test',
    syntax: '1.5.0',
    targets: ['claude'],
    releases: { environments },
  });

  it('accepts a list of environments', () => {
    expect(validate(config(['staging', 'prod'])), JSON.stringify(validate.errors)).toBe(true);
  });

  it('accepts a config without releases', () => {
    expect(validate({ id: 'test', syntax: '1.5.0', targets: ['claude'] })).toBe(true);
  });

  it.each([
    ['an empty list', []],
    ['a duplicate', ['prod', 'prod']],
    ['an uppercase name', ['Staging']],
    ['a name that starts with a digit', ['1st']],
    ['a name with an underscore', ['pre_prod']],
    ['a name of 33 characters', ['a'.repeat(33)]],
    ['17 environments', Array.from({ length: 17 }, (_, i) => `env-${i}`)],
    ['a non-string name', [1]],
  ])('rejects %s', (_name, environments) => {
    expect(validate(config(environments))).toBe(false);
  });

  it('accepts 16 environments', () => {
    const sixteen = Array.from({ length: 16 }, (_, i) => `env-${i}`);

    expect(validate(config(sixteen))).toBe(true);
  });

  it('accepts a name of 32 characters', () => {
    expect(validate(config(['a'.repeat(32)]))).toBe(true);
  });

  it('rejects an unknown key under releases', () => {
    expect(
      validate({
        id: 'test',
        syntax: '1.5.0',
        targets: ['claude'],
        releases: { environments: ['prod'], x: 1 },
      })
    ).toBe(false);
  });
});

describe('prompt release label schema', () => {
  const validate = validateLabel;
  const hash = `sha256-${'0123456789abcdef'.repeat(4)}`;
  const label = (): Record<string, unknown> => ({
    $schema: 'https://getpromptscript.dev/schema/prompt-release-label/v1.json',
    environment: 'prod',
    prompts: [{ id: 'acme-support/refund-reply', contentHash: hash }],
  });

  it('accepts the example label', () => {
    expect(validate(label()), JSON.stringify(validate.errors)).toBe(true);
  });

  it('accepts a label without prompts', () => {
    expect(validate({ ...label(), prompts: [] })).toBe(true);
  });

  it.each([
    ['an extra property', { ...label(), extra: 1 }],
    [
      'an extra entry property',
      { ...label(), prompts: [{ ...(label()['prompts'] as object[])[0], x: 1 }] },
    ],
    ['another $schema', { ...label(), $schema: 'https://example.com/label.json' }],
    ['an uppercase environment', { ...label(), environment: 'Prod' }],
    ['no environment', { ...label(), environment: undefined }],
    [
      'an uppercase hash',
      {
        ...label(),
        prompts: [{ id: 'a/b', contentHash: `sha256-${'0123456789ABCDEF'.repeat(4)}` }],
      },
    ],
    ['a short hash', { ...label(), prompts: [{ id: 'a/b', contentHash: 'sha256-abc' }] }],
    [
      'a hash without the prefix',
      { ...label(), prompts: [{ id: 'a/b', contentHash: '0'.repeat(64) }] },
    ],
  ])('rejects %s', (_name, value) => {
    expect(validate(value)).toBe(false);
  });
});

describe('release report schema', () => {
  const validate = validateReleaseReport;
  const hash = `sha256-${'0123456789abcdef'.repeat(4)}`;

  it('leaves out the -1 line and column of an error at the end of a file', () => {
    const report = createReleaseReport('build', {
      errors: [
        {
          message: 'Unexpected end of input',
          ...toReleaseLocation({ file: 'project.prs', line: -1, column: -1 }),
        },
      ],
    });

    expect(report.errors[0]?.location).toEqual({ file: 'project.prs' });
    expect(validate(report), JSON.stringify(validate.errors)).toBe(true);
  });

  it('accepts an empty report of every command', () => {
    for (const command of ['build', 'promote', 'rollback', 'status'] as const) {
      const report = createReleaseReport(command);

      expect(validate(report), JSON.stringify(validate.errors)).toBe(true);
    }
  });

  it('accepts a status report with history', () => {
    const report = createReleaseReport('status', {
      environments: [
        {
          name: 'prod',
          path: '.promptscript/releases/prod.json',
          exists: true,
          prompts: [
            {
              id: 'acme-support/refund-reply',
              contentHash: hash,
              file: `.promptscript/releases/bundles/${hash}.json`,
              exists: true,
              verified: true,
              inBuild: false,
            },
          ],
        },
      ],
      history: [
        {
          environment: 'prod',
          commits: [{ commit: 'a'.repeat(40), date: '2026-10-22T10:00:00+02:00', subject: 'x' }],
        },
      ],
      errors: [{ code: 'PS5004', message: 'm', location: { file: 'f', line: 1, column: 1 } }],
    });

    expect(validate(report), JSON.stringify(validate.errors)).toBe(true);
    expect(report.success).toBe(false);
  });

  it('pins the schema URL and version the cli writes', () => {
    const schema = readSchema('release-report-v1.json') as { $id: string };

    expect(schema.$id).toBe(RELEASE_REPORT_SCHEMA_URL);
    expect(createReleaseReport('build').version).toBe(RELEASE_REPORT_VERSION);
  });

  it.each([
    ['an unknown command', { ...createReleaseReport('build'), command: 'deploy' }],
    ['an extra property', { ...createReleaseReport('build'), extra: 1 }],
    [
      'a short change hash',
      {
        ...createReleaseReport('promote'),
        changes: [{ path: 'p', action: 'created', contentHash: 'sha256-abc' }],
      },
    ],
    [
      'an unknown change action',
      { ...createReleaseReport('build'), changes: [{ path: 'p', action: 'deleted' }] },
    ],
    ['no errors list', { ...createReleaseReport('build'), errors: undefined }],
  ])('rejects %s', (_name, value) => {
    expect(validate(value)).toBe(false);
  });
});
