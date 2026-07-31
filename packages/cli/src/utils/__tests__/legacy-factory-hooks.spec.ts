import { describe, expect, it } from 'vitest';
import { migrateLegacyFactoryHooks } from '../legacy-factory-hooks.js';

describe('migrateLegacyFactoryHooks', () => {
  it('migrates legacy event names and preserves unrelated settings', () => {
    const result = migrateLegacyFactoryHooks(
      {
        permissions: { allow: ['Bash'] },
        hooks: {
          preToolUse: [
            {
              matcher: 'Execute',
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
          { matcher: 'Execute', hooks: [{ type: 'command', command: 'audit' }] },
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

  it.each([
    [{ hooks: 'not-an-object' }, {}, ['hooks']],
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
});
