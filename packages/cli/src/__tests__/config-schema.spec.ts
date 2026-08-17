import { readFile } from 'node:fs/promises';
import { Ajv, type ValidateFunction } from 'ajv';
import { beforeAll, describe, expect, it } from 'vitest';

async function loadConfigSchema(): Promise<Record<string, unknown>> {
  return JSON.parse(
    await readFile(new URL('../../../../schema/config.json', import.meta.url), 'utf8')
  ) as Record<string, unknown>;
}

describe('config schema target sources', () => {
  let validate: ValidateFunction;

  beforeAll(async () => {
    validate = new Ajv({ strict: false }).compile(await loadConfigSchema());
  });

  it.each([
    ['top-level targets', { id: 'test', syntax: '1.5.0', targets: ['claude'] }],
    [
      'build profile targets',
      {
        id: 'test',
        syntax: '1.5.0',
        builds: { docs: { targets: ['claude'] } },
      },
    ],
    [
      'build profile targets with an empty top-level list',
      {
        id: 'test',
        syntax: '1.5.0',
        targets: [],
        builds: { docs: { targets: ['claude'] } },
      },
    ],
  ])('accepts %s', (_case, config) => {
    expect(validate(config), JSON.stringify(validate.errors)).toBe(true);
  });

  it.each([
    ['no target source', { id: 'test', syntax: '1.5.0' }],
    ['empty top-level targets', { id: 'test', syntax: '1.5.0', targets: [] }],
    ['targetless build profile', { id: 'test', syntax: '1.5.0', builds: { docs: {} } }],
    [
      'empty build profile targets',
      { id: 'test', syntax: '1.5.0', builds: { docs: { targets: [] } } },
    ],
    [
      'empty build profile targets with top-level fallback',
      {
        id: 'test',
        syntax: '1.5.0',
        targets: ['claude'],
        builds: { docs: { targets: [] } },
      },
    ],
  ])('rejects %s', (_case, config) => {
    expect(validate(config)).toBe(false);
  });
});
