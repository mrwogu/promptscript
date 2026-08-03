import { describe, expect, it } from 'vitest';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  detectLegacyFactorySettingsHooks,
  migrateLegacyFactoryHooks,
  planLegacyFactoryHooksMigration,
} from '../legacy-factory-hooks.js';

describe('migrateLegacyFactoryHooks', () => {
  it('returns unchanged when no legacy hooks exist', () => {
    expect(migrateLegacyFactoryHooks({}, {})).toEqual({
      canonical: {},
      legacy: {},
      migrated: 0,
      ambiguous: [],
      changed: false,
    });
  });

  it('migrates legacy event names and preserves unrelated settings', () => {
    const result = migrateLegacyFactoryHooks(
      {
        permissions: { allow: ['Bash'] },
        hooks: {
          preToolUse: [
            {
              matcher: 'Execute',
              commandRegex: '^git ',
              hooks: [{ type: 'command', command: 'audit' }],
            },
          ],
        },
      },
      { hooks: { PreToolUse: [{ matcher: 'Read', hooks: [] }] } }
    );

    expect(result.migrated).toBe(1);
    expect(result.ambiguous).toEqual([]);
    expect(result.legacy).toEqual({ permissions: { allow: ['Bash'] } });
    expect(result.canonical).toEqual({
      hooks: {
        PreToolUse: [
          { matcher: 'Read', hooks: [] },
          {
            matcher: 'Execute',
            commandRegex: '^git ',
            hooks: [{ type: 'command', command: 'audit' }],
          },
        ],
      },
    });
  });

  it('deduplicates entries when canonical hooks already contain the legacy hook', () => {
    const hook = { matcher: 'Execute', hooks: [{ type: 'command', command: 'audit' }] };
    const result = migrateLegacyFactoryHooks(
      { hooks: { PreToolUse: [hook] } },
      { hooks: { PreToolUse: [hook] } }
    );

    expect(result.migrated).toBe(1);
    expect(result.canonical).toEqual({ hooks: { PreToolUse: [hook] } });
  });

  it('deduplicates equivalent entries with different property order', () => {
    const result = migrateLegacyFactoryHooks(
      {
        hooks: {
          PreToolUse: [
            {
              matcher: 'Execute',
              hooks: [{ type: 'command', command: 'audit' }],
            },
          ],
        },
      },
      {
        hooks: {
          PreToolUse: [
            {
              hooks: [{ command: 'audit', type: 'command' }],
              matcher: 'Execute',
            },
          ],
        },
      }
    );

    const hooks = result.canonical['hooks'] as Record<string, unknown[]>;
    expect(hooks['PreToolUse']).toHaveLength(1);
  });

  it('refuses partial migration when an event or entry is ambiguous', () => {
    const result = migrateLegacyFactoryHooks(
      {
        hooks: {
          customEvent: [{ hooks: [{ type: 'command', command: 'custom' }] }],
          PreToolUse: [{ unexpected: true }],
        },
      },
      {}
    );

    expect(result.migrated).toBe(0);
    expect(result.changed).toBe(false);
    expect(result.ambiguous).toEqual(['hooks.customEvent', 'hooks.PreToolUse[0]']);
  });

  it('drops previously owned entries without copying them to the canonical file', () => {
    const result = migrateLegacyFactoryHooks(
      {
        hooks: {
          PreToolUse: [
            {
              hooks: [
                {
                  type: 'command',
                  command: 'prs hook pre-edit # promptscript-generated:old',
                },
              ],
            },
          ],
        },
      },
      {}
    );

    expect(result.migrated).toBe(0);
    expect(result.legacy).toEqual({});
    expect(result.canonical).toEqual({ hooks: {} });
  });

  it('recognizes legacy CLI-installed hooks without a generated marker', () => {
    const result = migrateLegacyFactoryHooks(
      {
        hooks: {
          PreToolUse: [
            {
              hooks: [{ type: 'command', command: 'prs hook pre-edit' }],
            },
          ],
        },
      },
      {}
    );

    expect(result).toMatchObject({ migrated: 0, ambiguous: [], changed: true });
    expect(result.legacy).toEqual({});
    expect(result.canonical).toEqual({ hooks: {} });
  });

  it('preserves installed hooks when compile migration requests it', () => {
    const installed = {
      hooks: [{ type: 'command', command: 'prs hook pre-edit' }],
    };
    const result = migrateLegacyFactoryHooks(
      { hooks: { PreToolUse: [installed] } },
      {},
      { preserveInstalledHooks: true, rejectMixedOwnership: true }
    );

    expect(result.ambiguous).toEqual([]);
    expect(result.legacy).toEqual({});
    expect(result.canonical).toEqual({ hooks: { PreToolUse: [installed] } });
  });

  it('rejects mixed ownership for compile migration', () => {
    const result = migrateLegacyFactoryHooks(
      {
        hooks: {
          PreToolUse: [
            {
              hooks: [
                { type: 'command', command: 'prs hook pre-edit' },
                { type: 'command', command: 'audit' },
              ],
            },
          ],
        },
      },
      {},
      { preserveInstalledHooks: true, rejectMixedOwnership: true }
    );

    expect(result.changed).toBe(false);
    expect(result.ambiguous).toEqual(['hooks.PreToolUse[0]']);
  });

  it.each([
    [{ hooks: 'not-an-object' }, {}, ['hooks']],
    [{ hooks: {} }, { hooks: [] }, ['canonical.hooks']],
    [
      { hooks: { PreToolUse: [] } },
      { hooks: { PreToolUse: 'not-an-array' } },
      ['canonical.hooks.PreToolUse'],
    ],
  ])('refuses malformed hook containers', (legacy, canonical, ambiguous) => {
    const result = migrateLegacyFactoryHooks(legacy, canonical);

    expect(result.migrated).toBe(0);
    expect(result.changed).toBe(false);
    expect(result.ambiguous).toEqual(ambiguous);
  });

  it('refuses null and malformed nested handlers', () => {
    const result = migrateLegacyFactoryHooks(
      {
        hooks: {
          PreToolUse: [
            null,
            {
              hooks: [{ type: 'prompt', command: 'custom' }, { type: 'prompt' }],
            },
          ],
        },
      },
      {}
    );

    expect(result.changed).toBe(false);
    expect(result.ambiguous).toEqual(['hooks.PreToolUse[0]', 'hooks.PreToolUse[1]']);
  });

  it('does not treat an unrelated command mentioning prs hook as owned', () => {
    const result = migrateLegacyFactoryHooks(
      {
        hooks: {
          PreToolUse: [
            {
              hooks: [{ type: 'command', command: 'echo "prs hook pre-edit"' }],
            },
          ],
        },
      },
      {}
    );

    expect(result.ambiguous).toEqual([]);
    expect(result.migrated).toBe(1);
    expect(result.canonical['hooks']).toEqual({
      PreToolUse: [
        {
          hooks: [{ type: 'command', command: 'echo "prs hook pre-edit"' }],
        },
      ],
    });
  });

  it('refuses to migrate entries with empty handler arrays', () => {
    const result = migrateLegacyFactoryHooks(
      { hooks: { PreToolUse: [{ matcher: 'Execute', hooks: [] }] } },
      {}
    );

    expect(result.migrated).toBe(0);
    expect(result.changed).toBe(false);
    expect(result.ambiguous).toEqual(['hooks.PreToolUse[0]']);
  });

  it('refuses entries with unsupported fields', () => {
    const result = migrateLegacyFactoryHooks(
      {
        hooks: {
          PreToolUse: [
            {
              matcher: 'Execute',
              hooks: [{ type: 'command', command: 'echo custom' }],
              metadata: 'user-defined',
            },
          ],
        },
      },
      {}
    );

    expect(result.changed).toBe(false);
    expect(result.ambiguous).toEqual(['hooks.PreToolUse[0]']);
  });

  it.each([
    { type: 'prompt', command: 'audit' },
    { type: 'command', command: 'audit', metadata: true },
    { type: 'command', command: '' },
    { type: 'command', command: 'audit', timeout: 'fast' },
    { type: 'command', command: 'audit', statusMessage: 42 },
  ])('refuses malformed command handlers: %j', (handler) => {
    const result = migrateLegacyFactoryHooks({ hooks: { PreToolUse: [{ hooks: [handler] }] } }, {});

    expect(result.changed).toBe(false);
    expect(result.ambiguous).toEqual(['hooks.PreToolUse[0]']);
  });

  it('refuses a non-string matcher', () => {
    const result = migrateLegacyFactoryHooks(
      {
        hooks: {
          PreToolUse: [
            {
              matcher: 42,
              hooks: [{ type: 'command', command: 'audit' }],
            },
          ],
        },
      },
      {}
    );

    expect(result.changed).toBe(false);
    expect(result.ambiguous).toEqual(['hooks.PreToolUse[0]']);
  });

  it('refuses a non-string command regex', () => {
    const result = migrateLegacyFactoryHooks(
      {
        hooks: {
          PreToolUse: [
            {
              commandRegex: 42,
              hooks: [{ type: 'command', command: 'audit' }],
            },
          ],
        },
      },
      {}
    );

    expect(result.changed).toBe(false);
    expect(result.ambiguous).toEqual(['hooks.PreToolUse[0]']);
  });
});

describe('detectLegacyFactorySettingsHooks', () => {
  it('ignores malformed and fully owned legacy settings', async () => {
    const root = await mkdtemp(join(tmpdir(), 'promptscript-legacy-detect-'));
    const settingsPath = join(root, '.factory', 'settings.json');
    const hooksPath = join(root, '.factory', 'hooks.json');
    await mkdir(join(root, '.factory'), { recursive: true });

    try {
      await writeFile(settingsPath, '{');
      await expect(detectLegacyFactorySettingsHooks(root)).resolves.toBeUndefined();

      await writeFile(settingsPath, '[]');
      await expect(detectLegacyFactorySettingsHooks(root)).resolves.toBeUndefined();

      await writeFile(settingsPath, JSON.stringify({ hooks: { PreToolUse: [null] } }));
      await expect(detectLegacyFactorySettingsHooks(root)).resolves.toBe(settingsPath);

      await writeFile(
        settingsPath,
        JSON.stringify({
          hooks: {
            PreToolUse: [
              {
                hooks: [{ type: 'command', command: 'prs hook pre-edit' }],
              },
            ],
          },
        })
      );
      await expect(detectLegacyFactorySettingsHooks(root)).resolves.toBeUndefined();
      await expect(detectLegacyFactorySettingsHooks(root, true)).resolves.toBe(settingsPath);

      await writeFile(
        settingsPath,
        JSON.stringify({
          hooks: {
            PreToolUse: [
              {
                hooks: [
                  { type: 'command', command: 'prs hook pre-edit' },
                  { type: 'command', command: 'audit' },
                ],
              },
            ],
          },
        })
      );
      await expect(detectLegacyFactorySettingsHooks(root)).resolves.toBe(settingsPath);

      await writeFile(hooksPath, '{}');
      await expect(detectLegacyFactorySettingsHooks(root)).resolves.toBeUndefined();
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});

describe('planLegacyFactoryHooksMigration', () => {
  it('merges legacy hooks with generated canonical hooks', async () => {
    const root = await mkdtemp(join(tmpdir(), 'promptscript-legacy-plan-'));
    const settingsPath = join(root, '.factory', 'settings.json');
    await mkdir(join(root, '.factory'), { recursive: true });
    await writeFile(
      settingsPath,
      JSON.stringify({
        permissions: { allow: ['Read'] },
        hooks: {
          PreToolUse: [
            {
              matcher: 'Execute',
              hooks: [{ type: 'command', command: 'audit' }],
            },
          ],
        },
      })
    );

    try {
      const plan = await planLegacyFactoryHooksMigration(
        root,
        JSON.stringify({
          hooks: {
            PreToolUse: [
              {
                hooks: [
                  {
                    type: 'command',
                    command: 'node check.mjs # promptscript-generated:check',
                  },
                ],
              },
            ],
          },
        })
      );

      expect(plan?.migration).toMatchObject({
        migrated: 1,
        ambiguous: [],
        legacy: { permissions: { allow: ['Read'] } },
      });
      const hooks = plan?.migration.canonical['hooks'] as Record<string, unknown[]>;
      expect(hooks['PreToolUse']).toHaveLength(2);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('does not plan migration when canonical hooks already exist', async () => {
    const root = await mkdtemp(join(tmpdir(), 'promptscript-legacy-plan-'));
    await mkdir(join(root, '.factory'), { recursive: true });
    await writeFile(
      join(root, '.factory', 'settings.json'),
      JSON.stringify({ hooks: { PreToolUse: [] } })
    );
    await writeFile(join(root, '.factory', 'hooks.json'), '{}');

    try {
      await expect(planLegacyFactoryHooksMigration(root)).resolves.toBeUndefined();
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('rejects malformed legacy settings JSON', async () => {
    const root = await mkdtemp(join(tmpdir(), 'promptscript-legacy-plan-'));
    await mkdir(join(root, '.factory'), { recursive: true });
    await writeFile(join(root, '.factory', 'settings.json'), '{');

    try {
      await expect(planLegacyFactoryHooksMigration(root)).rejects.toThrow(
        'Failed to parse Factory hooks file'
      );
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
