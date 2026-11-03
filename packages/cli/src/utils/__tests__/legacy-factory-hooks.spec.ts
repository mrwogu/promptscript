import { describe, expect, it } from 'vitest';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { FormatterOutput } from '@promptscript/compiler';
import {
  detectLegacyFactorySettingsHooks,
  getFactoryHooksFile,
  migrateLegacyFactoryHooks,
  planLegacyFactoryHooksMigration,
  prepareLegacyFactoryMigration,
} from '../legacy-factory-hooks.js';

describe('migrateLegacyFactoryHooks', () => {
  it('returns unchanged when no legacy hooks exist', () => {
    expect(migrateLegacyFactoryHooks({}, {})).toEqual({
      canonical: {},
      legacy: {},
      migrated: 0,
      duplicates: 0,
      ambiguous: [],
      changed: false,
    });
  });

  it('drops legacy handlers that @hooks already generates (#745)', () => {
    const generated = {
      hooks: {
        PreToolUse: [
          {
            matcher: 'Execute',
            hooks: [{ type: 'command', command: 'npx lint-staged # promptscript-generated:lint' }],
          },
        ],
        SessionStart: [
          {
            matcher: '.*',
            hooks: [
              {
                type: 'command',
                command:
                  'if [ -z "${FACTORY_PROJECT_DIR:-}" ]; then printf \'%s\\n\' \'PromptScript factory hook requires non-empty FACTORY_PROJECT_DIR.\' >&2; exit 1; fi; cd "$FACTORY_PROJECT_DIR" && ./setup.sh # promptscript-generated:setup',
              },
            ],
          },
        ],
      },
    };
    const result = migrateLegacyFactoryHooks(
      {
        hooks: {
          PreToolUse: [
            {
              matcher: 'Execute',
              hooks: [
                { type: 'command', command: 'npx lint-staged' },
                { type: 'command', command: 'audit.sh' },
              ],
            },
            { matcher: 'Edit', hooks: [{ type: 'command', command: 'npx lint-staged' }] },
          ],
          SessionStart: [
            { hooks: [{ type: 'command', command: 'cd "$FACTORY_PROJECT_DIR" && ./setup.sh' }] },
          ],
        },
      },
      generated
    );

    expect(result.duplicates).toBe(2);
    expect(result.migrated).toBe(2);
    expect(result.changed).toBe(true);
    expect(result.legacy).toEqual({});
    expect(result.canonical).toEqual({
      hooks: {
        PreToolUse: [
          ...generated.hooks.PreToolUse,
          { matcher: 'Execute', hooks: [{ type: 'command', command: 'audit.sh' }] },
          { matcher: 'Edit', hooks: [{ type: 'command', command: 'npx lint-staged' }] },
        ],
        SessionStart: generated.hooks.SessionStart,
      },
    });
  });

  it('is idempotent when the canonical output already carries the migrated hooks', () => {
    const legacy = {
      hooks: { Stop: [{ hooks: [{ type: 'command', command: 'notify.sh' }] }] },
    };
    const first = migrateLegacyFactoryHooks(legacy, {});
    const second = migrateLegacyFactoryHooks(legacy, first.canonical);

    expect(second.canonical).toEqual(first.canonical);
    expect((second.canonical['hooks'] as Record<string, unknown[]>)['Stop']).toHaveLength(1);
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

  it('preserves direct installed command entries for compile migration', () => {
    const installed = { type: 'command', command: 'prs hook pre-edit' };
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
      // The plan holds hooks.json in its on-disk shape, the bare event map.
      const hooks = plan?.migration.canonical as Record<string, unknown[]>;
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

  it('propagates legacy settings read failures', async () => {
    const root = await mkdtemp(join(tmpdir(), 'promptscript-legacy-plan-'));
    await mkdir(join(root, '.factory', 'settings.json'), { recursive: true });

    try {
      await expect(planLegacyFactoryHooksMigration(root)).rejects.toMatchObject({
        code: expect.not.stringMatching(/^ENOENT$/),
      });
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});

describe('prepareLegacyFactoryMigration', () => {
  const generatedHooks = JSON.stringify({
    hooks: {
      PreToolUse: [
        {
          matcher: 'Execute',
          hooks: [{ type: 'command', command: 'audit.sh # promptscript-generated:audit' }],
        },
      ],
    },
  });

  async function withLegacySettings(
    settings: Record<string, unknown>,
    run: (root: string) => Promise<void>
  ): Promise<void> {
    const root = await mkdtemp(join(tmpdir(), 'promptscript-legacy-prepare-'));
    await mkdir(join(root, '.factory'), { recursive: true });
    await writeFile(join(root, '.factory', 'settings.json'), JSON.stringify(settings));
    try {
      await run(root);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  }

  const legacySettings = {
    model: 'user-model',
    hooks: {
      PreToolUse: [{ matcher: 'Execute', hooks: [{ type: 'command', command: 'audit.sh' }] }],
    },
  };

  it('writes each hook once when settings.json repeats a generated hook (#745)', async () => {
    await withLegacySettings(legacySettings, async (root) => {
      const outputs = new Map<string, FormatterOutput>([
        ['.factory/hooks.json', { path: '.factory/hooks.json', content: generatedHooks }],
      ]);

      const plan = await prepareLegacyFactoryMigration(outputs, root);

      expect(plan?.migration.duplicates).toBe(1);
      expect(plan?.migration.legacy).toEqual({ model: 'user-model' });
      expect(JSON.parse(outputs.get('.factory/hooks.json')!.content)).toEqual(
        JSON.parse(generatedHooks).hooks
      );
    });
  });

  it('folds generated settings keys into the migrated settings', async () => {
    await withLegacySettings(legacySettings, async (root) => {
      const outputs = new Map<string, FormatterOutput>([
        ['.factory/hooks.json', { path: '.factory/hooks.json', content: generatedHooks }],
        [
          '.factory/settings.json',
          {
            path: '.factory/settings.json',
            content: JSON.stringify({ enabledPlugins: { 'team@market': true } }),
          },
        ],
      ]);

      const plan = await prepareLegacyFactoryMigration(outputs, root);

      expect(plan?.settingsFolded).toBe(true);
      expect(plan?.migration.legacy).toEqual({
        model: 'user-model',
        enabledPlugins: { 'team@market': true },
      });
      expect(JSON.parse(outputs.get('.factory/settings.json')!.content)).toEqual(
        plan?.migration.legacy
      );
    });
  });

  it('leaves settings.json hooks alone with hooksFile: settings.json', async () => {
    await withLegacySettings(legacySettings, async (root) => {
      const outputs = new Map<string, FormatterOutput>();

      await expect(
        prepareLegacyFactoryMigration(outputs, root, { hooksFile: 'settings.json' })
      ).resolves.toBeUndefined();
      expect(outputs.size).toBe(0);
    });
  });
});

describe('getFactoryHooksFile', () => {
  it('returns settings.json only when a Factory target asks for it', () => {
    expect(getFactoryHooksFile([{ name: 'factory' }])).toBe('hooks.json');
    expect(getFactoryHooksFile([{ name: 'claude', config: { hooksFile: 'settings.json' } }])).toBe(
      'hooks.json'
    );
    expect(
      getFactoryHooksFile([
        { name: 'factory', config: { hooksFile: 'hooks.json' } },
        { name: 'factory', config: { hooksFile: 'settings.json' } },
      ])
    ).toBe('settings.json');
  });
});
