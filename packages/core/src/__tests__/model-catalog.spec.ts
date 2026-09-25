import { describe, expect, it } from 'vitest';
import {
  FLOATING_MODEL_ALIASES,
  compareModelReleases,
  createModelCatalog,
  getModelCatalog,
  getModelTargetScheme,
  isInModelSet,
  mapModelToTarget,
  normalizeModelName,
  resolveModelSet,
  validateModelCatalog,
} from '../model-catalog.js';
import { MODEL_PROFILES } from '../model-profiles.js';
import type { ModelProfile, ModelsConfig } from '../types/models.js';

function fixture(profile: Partial<ModelProfile> & Pick<ModelProfile, 'id'>): ModelProfile {
  return {
    provider: 'anthropic',
    family: 'claude-opus',
    version: '1',
    displayName: profile.id,
    apiId: profile.id,
    aliases: [],
    status: 'current',
    targets: {},
    ...profile,
  };
}

const OPUS_1 = fixture({
  id: 'claude-opus-1',
  version: '1',
  displayName: 'Claude Opus 1',
  apiId: 'claude-opus-1-20240101',
  aliases: ['opus-1'],
  status: 'retired',
  successor: 'claude-opus-2',
  releaseDate: '2024-01-01',
});
const OPUS_2 = fixture({
  id: 'claude-opus-2',
  version: '2',
  displayName: 'Claude Opus 2',
  status: 'legacy',
  successor: 'claude-opus-2-5',
  releaseDate: '2025-01-01',
});
const OPUS_2_5 = fixture({
  id: 'claude-opus-2-5',
  version: '2.5',
  displayName: 'Claude Opus 2.5',
  releaseDate: '2025-06-01',
});
const SONNET_2 = fixture({
  id: 'claude-sonnet-2',
  family: 'claude-sonnet',
  version: '2',
  displayName: 'Claude Sonnet 2',
});
const HAIKU_2 = fixture({
  id: 'claude-haiku-2',
  family: 'claude-haiku',
  version: '2',
  displayName: 'Claude Haiku 2',
});
const FABLE_2 = fixture({
  id: 'claude-fable-2',
  family: 'claude-fable',
  version: '2',
  displayName: 'Claude Fable 2',
});
const GPT_9 = fixture({
  id: 'gpt-9',
  provider: 'openai',
  family: 'gpt',
  version: '9',
  displayName: 'GPT-9',
});

const PROFILES: readonly ModelProfile[] = [
  OPUS_1,
  OPUS_2,
  OPUS_2_5,
  SONNET_2,
  HAIKU_2,
  FABLE_2,
  GPT_9,
];

function catalog(config?: ModelsConfig) {
  return createModelCatalog(config, PROFILES);
}

describe('normalizeModelName', () => {
  it('trims and lower-cases names', () => {
    expect(normalizeModelName('  Claude Opus 2 ')).toBe('claude opus 2');
  });
});

describe('compareModelReleases', () => {
  it('orders by numeric version, not string order', () => {
    const v10 = fixture({ id: 'a', version: '10' });
    const v9 = fixture({ id: 'b', version: '9' });

    expect(compareModelReleases(v10, v9)).toBeGreaterThan(0);
  });

  it('treats a missing version part as zero', () => {
    const short = fixture({ id: 'a', version: '2' });
    const long = fixture({ id: 'b', version: '2.0' });

    expect(compareModelReleases(short, long)).toBe(0);
    expect(compareModelReleases(OPUS_2_5, OPUS_2)).toBeGreaterThan(0);
  });

  it('breaks version ties with the release date', () => {
    const early = fixture({ id: 'a', version: '3', releaseDate: '2025-01-01' });
    const late = fixture({ id: 'b', version: '3', releaseDate: '2025-02-01' });

    expect(compareModelReleases(late, early)).toBeGreaterThan(0);
  });

  it('compares non-numeric version parts as text', () => {
    const preview = fixture({ id: 'a', version: '3.preview' });
    const stable = fixture({ id: 'b', version: '3.stable' });

    expect(compareModelReleases(stable, preview)).toBeGreaterThan(0);
  });

  it('orders a numeric prefix ahead of a text suffix', () => {
    const preview = fixture({ id: 'a', version: '9-preview' });
    const major = fixture({ id: 'b', version: '10' });

    expect(compareModelReleases(preview, major)).toBeLessThan(0);
  });

  it('ranks a bare version part above its tagged variants', () => {
    const preview = fixture({ id: 'a', version: '5.5-preview' });
    const stable = fixture({ id: 'b', version: '5.5' });

    expect(compareModelReleases(preview, stable)).toBeLessThan(0);
  });
});

describe('createModelCatalog', () => {
  describe('resolve', () => {
    it('resolves inherit', () => {
      expect(catalog().resolve('Inherit')).toEqual({ kind: 'inherit' });
    });

    it('resolves a profile id case-insensitively', () => {
      expect(catalog().resolve(' CLAUDE-OPUS-2 ')).toEqual({ kind: 'profile', profile: OPUS_2 });
    });

    it('resolves API ids, display names, and aliases', () => {
      const models = catalog();

      expect(models.resolve('claude-opus-1-20240101')?.kind).toBe('profile');
      expect(models.resolve('Claude Opus 2.5')).toEqual({ kind: 'profile', profile: OPUS_2_5 });
      expect(models.resolve('opus-1')).toEqual({ kind: 'profile', profile: OPUS_1 });
    });

    it('resolves floating aliases to the newest served release', () => {
      expect(catalog().resolve('opus')).toEqual({
        kind: 'floating',
        alias: 'opus',
        profile: OPUS_2_5,
      });
    });

    it('returns undefined for unknown and empty names', () => {
      const models = catalog();

      expect(models.resolve('claude-opus-99')).toBeUndefined();
      expect(models.resolve('   ')).toBeUndefined();
      expect(models.resolve('constructor')).toBeUndefined();
    });

    it('returns undefined for a floating alias without releases', () => {
      const models = createModelCatalog(undefined, [GPT_9]);

      expect(models.resolve('sonnet')).toBeUndefined();
    });
  });

  describe('getLatest', () => {
    it('skips retired releases while a served one exists', () => {
      const newerRetired = fixture({ id: 'claude-opus-3', version: '3', status: 'retired' });
      const models = createModelCatalog(undefined, [...PROFILES, newerRetired]);

      expect(models.getLatest('claude-opus')?.id).toBe('claude-opus-2-5');
    });

    it('falls back to retired releases when nothing else is served', () => {
      const models = createModelCatalog(undefined, [OPUS_1]);

      expect(models.getLatest('claude-opus')?.id).toBe('claude-opus-1');
    });

    it('returns undefined for an unknown family', () => {
      expect(catalog().getLatest('nope')).toBeUndefined();
    });
  });

  describe('getReplacement', () => {
    it('follows successors until a current release', () => {
      expect(catalog().getReplacement('claude-opus-1')?.id).toBe('claude-opus-2-5');
    });

    it('returns undefined without a successor', () => {
      expect(catalog().getReplacement('claude-opus-2-5')).toBeUndefined();
      expect(catalog().getReplacement('unknown')).toBeUndefined();
    });

    it('stops at a missing successor', () => {
      const orphan = fixture({ id: 'orphan', family: 'x', successor: 'missing' });

      expect(createModelCatalog(undefined, [orphan]).getReplacement('orphan')).toBeUndefined();
    });

    it('returns undefined when the chain ends at a retired release', () => {
      const retired = fixture({ id: 'old', family: 'x', status: 'retired' });
      const legacy = fixture({ id: 'legacy', family: 'x', status: 'legacy', successor: 'old' });

      expect(
        createModelCatalog(undefined, [legacy, retired]).getReplacement('legacy')
      ).toBeUndefined();
    });

    it('returns undefined on successor loops instead of the entry itself', () => {
      const a = fixture({ id: 'a', family: 'x', status: 'legacy', successor: 'b' });
      const b = fixture({ id: 'b', family: 'x', status: 'legacy', successor: 'a' });

      expect(createModelCatalog(undefined, [a, b]).getReplacement('a')).toBeUndefined();
      expect(createModelCatalog(undefined, [a, b]).getReplacement('b')).toBeUndefined();
    });
  });

  describe('models.profiles', () => {
    it('overrides only the fields a built-in override sets', () => {
      const models = catalog({
        profiles: {
          'claude-opus-2-5': { status: 'deprecated', targets: { github: 'Claude Opus 2.5 (new)' } },
        },
      });

      expect(models.getProfile('claude-opus-2-5')).toEqual({
        ...OPUS_2_5,
        status: 'deprecated',
        targets: { github: 'Claude Opus 2.5 (new)' },
      });
    });

    it('merges per-target names with the built-in ones', () => {
      const withTargets = fixture({ id: 'claude-opus-3', targets: { github: 'A', cursor: 'B' } });
      const models = createModelCatalog(
        { profiles: { 'claude-opus-3': { targets: { cursor: 'C' } } } },
        [withTargets]
      );

      expect(models.getProfile('claude-opus-3')?.targets).toEqual({ github: 'A', cursor: 'C' });
    });

    it('matches per-target names case-insensitively', () => {
      const withTargets = fixture({ id: 'claude-opus-3', targets: { github: 'A' } });
      const models = createModelCatalog(
        { profiles: { 'claude-opus-3': { targets: { ' GitHub ': 'B', Cursor: 'C' } } } },
        [withTargets]
      );

      expect(models.getProfile('claude-opus-3')?.targets).toEqual({ github: 'B', cursor: 'C' });
      expect(mapModelToTarget('claude-opus-3', 'github', models).value).toBe('B');
    });

    it('matches built-in ids case-insensitively', () => {
      const models = catalog({ profiles: { 'Claude-Opus-2': { retirementDate: '2026-01-31' } } });

      expect(models.getProfile('claude-opus-2')?.retirementDate).toBe('2026-01-31');
      expect(models.profiles).toHaveLength(PROFILES.length);
    });

    it('adds custom profiles with defaults', () => {
      const models = catalog({ profiles: { 'in-house-7b': {} } });

      expect(models.getProfile('in-house-7b')).toEqual({
        id: 'in-house-7b',
        provider: 'custom',
        family: 'in-house-7b',
        version: '',
        displayName: 'in-house-7b',
        apiId: 'in-house-7b',
        aliases: [],
        status: 'current',
        targets: {},
      });
    });

    it('lets custom releases back floating aliases', () => {
      const models = catalog({
        profiles: {
          'claude-opus-9': { provider: 'anthropic', family: 'claude-opus', version: '9' },
        },
      });

      expect(models.resolve('opus')).toMatchObject({
        kind: 'floating',
        profile: { id: 'claude-opus-9' },
      });
    });

    it('gives custom names priority over colliding built-in names', () => {
      const models = catalog({ profiles: { mine: { aliases: ['opus-1'] } } });

      expect(models.resolve('opus-1')).toMatchObject({ profile: { id: 'mine' } });
    });

    it('ignores malformed config values', () => {
      const profiles = {
        '  ': {},
        broken: 'not an object',
        list: ['nope'],
        odd: {
          provider: 42,
          aliases: ['ok', 7, ' '],
          status: 'gone',
          retirementDate: 20260131,
          targets: { github: 'Odd', cursor: 3 },
        },
      } as unknown as ModelsConfig['profiles'];
      const models = catalog({ profiles });

      expect(models.profiles.map((profile) => profile.id)).toEqual([
        ...PROFILES.map((profile) => profile.id),
        'odd',
      ]);
      expect(models.getProfile('odd')).toMatchObject({
        provider: 'custom',
        aliases: ['ok'],
        status: 'current',
        targets: { github: 'Odd' },
      });
      expect(models.getProfile('odd')?.retirementDate).toBeUndefined();
    });

    it('ignores a non-object profiles value', () => {
      const models = catalog({ profiles: 'nope' as unknown as ModelsConfig['profiles'] });

      expect(models.profiles).toEqual(PROFILES);
    });
  });
});

describe('getModelCatalog', () => {
  it('shares the default catalog when no profiles are configured', () => {
    expect(getModelCatalog()).toBe(getModelCatalog({ supported: ['opus'] }));
  });

  it('caches catalogs per config object', () => {
    const config: ModelsConfig = { profiles: { 'in-house-7b': {} } };

    expect(getModelCatalog(config)).toBe(getModelCatalog(config));
    expect(getModelCatalog(config).getProfile('in-house-7b')).toBeDefined();
    expect(getModelCatalog({ profiles: {} })).not.toBe(getModelCatalog(config));
  });
});

describe('validateModelCatalog', () => {
  it('accepts a consistent fixture', () => {
    expect(validateModelCatalog(PROFILES)).toEqual([]);
  });

  it('reports duplicate ids and shared names', () => {
    const issues = validateModelCatalog([
      ...PROFILES,
      fixture({ id: 'claude-opus-2', family: 'x' }),
      fixture({ id: 'copy', family: 'x', aliases: ['Opus-1'] }),
    ]);

    expect(issues).toContain('duplicate model id "claude-opus-2"');
    expect(issues).toContain('model name "opus-1" is used by "claude-opus-1" and "copy"');
  });

  it('reports reserved names', () => {
    const issues = validateModelCatalog([
      ...PROFILES,
      fixture({ id: 'x', family: 'x', aliases: ['sonnet', 'inherit'] }),
    ]);

    expect(issues).toEqual([
      'model "x" uses reserved name "sonnet"',
      'model "x" uses reserved name "inherit"',
    ]);
  });

  it('reports broken successors and dates', () => {
    const issues = validateModelCatalog([
      ...PROFILES,
      fixture({ id: 'self', family: 'x', successor: 'self' }),
      fixture({
        id: 'lost',
        family: 'x',
        successor: 'nowhere',
        releaseDate: '2025/01/01',
        retirementDate: 'soon',
      }),
    ]);

    expect(issues).toEqual([
      'model "self" names itself as successor',
      'model "lost" names unknown successor "nowhere"',
      'model "lost" has invalid release date "2025/01/01", expected YYYY-MM-DD',
      'model "lost" has invalid retirement date "soon", expected YYYY-MM-DD',
      'successor chain of "self" loops',
    ]);
  });

  it('reports per-target names for targets that write no model names', () => {
    const issues = validateModelCatalog([
      ...PROFILES,
      fixture({ id: 'x', family: 'x', targets: { github: 'X', githb: 'X', opencode: 'X' } }),
    ]);

    const writers = 'claude, grok, github, factory, codex, cursor';
    expect(issues).toEqual([
      `model "x" sets a name for "githb", which is not a target that writes model names (${writers})`,
      `model "x" sets a name for "opencode", which is not a target that writes model names (${writers})`,
    ]);
  });

  it('reports successor loops', () => {
    const issues = validateModelCatalog([
      ...PROFILES,
      fixture({ id: 'a', family: 'x', successor: 'b' }),
      fixture({ id: 'b', family: 'x', successor: 'a' }),
    ]);

    expect(issues).toEqual(['successor chain of "a" loops', 'successor chain of "b" loops']);
  });

  it('reports floating aliases without a family', () => {
    expect(validateModelCatalog([OPUS_2_5, SONNET_2, FABLE_2])).toEqual([
      'floating alias "haiku" names unknown family "claude-haiku"',
    ]);
  });
});

describe('built-in model profiles', () => {
  const models = createModelCatalog();

  it('are consistent', () => {
    expect(validateModelCatalog()).toEqual([]);
    expect(models.profiles).toBe(MODEL_PROFILES);
  });

  it('back floating aliases with the releases Claude Code documents', () => {
    const latest = Object.fromEntries(
      Object.keys(FLOATING_MODEL_ALIASES).map((alias) => {
        const resolution = models.resolve(alias);
        return [alias, resolution?.kind === 'floating' ? resolution.profile.id : undefined];
      })
    );

    expect(latest).toEqual({
      opus: 'claude-opus-5-5',
      sonnet: 'claude-sonnet-5',
      haiku: 'claude-haiku-4-5',
      fable: 'claude-fable-5-1',
    });
  });

  it('give every superseded model a current replacement', () => {
    const superseded = MODEL_PROFILES.filter((profile) => profile.status !== 'current');

    for (const profile of superseded) {
      expect(models.getReplacement(profile.id)?.status, profile.id).toBe('current');
    }
    expect(models.getReplacement('claude-opus-4')?.id).toBe('claude-opus-5-5');
  });

  it('keep the model names older GitHub output used', () => {
    const names = ['sonnet-4', 'sonnet-4.5', 'opus-4', 'opus-4.5', 'haiku-4.5'].concat(
      'gpt-4o',
      'gpt-4.1',
      'gpt-5',
      'gpt-5-mini'
    );

    expect(names.map((name) => mapModelToTarget(name, 'github', models).value)).toEqual([
      'Claude Sonnet 4',
      'Claude Sonnet 4.5',
      'Claude Opus 4',
      'Claude Opus 4.5',
      'Claude Haiku 4.5',
      'GPT-4o',
      'GPT-4.1',
      'GPT-5',
      'GPT-5 mini',
    ]);
  });

  it('keep the model names the Claude 3.x era used', () => {
    const names = ['claude-3-5-sonnet', 'claude-3-7-sonnet', 'claude-3-5-haiku'];

    expect(names.map((name) => mapModelToTarget(name, 'github', models).value)).toEqual([
      'Claude 3.5 Sonnet',
      'Claude 3.7 Sonnet',
      'Claude 3.5 Haiku',
    ]);
  });

  it('pin dated snapshots for older Claude releases', () => {
    expect(mapModelToTarget('claude-sonnet-4-5', 'claude', models).value).toBe(
      'claude-sonnet-4-5-20250929'
    );
    expect(mapModelToTarget('haiku', 'factory', models).value).toBe('claude-haiku-4-5-20251001');
  });

  it('keep dateless ids on Cursor', () => {
    expect(mapModelToTarget('claude-sonnet-4-5', 'cursor', models).value).toBe('claude-sonnet-4-5');
    expect(mapModelToTarget('haiku', 'cursor', models).value).toBe('claude-haiku-4-5');
    expect(mapModelToTarget('opus', 'cursor', models).value).toBe('claude-opus-5-5');
  });
});

describe('model sets', () => {
  const models = catalog();

  it('resolves entries and collects unknown ones', () => {
    const set = resolveModelSet(['opus', 'Claude Sonnet 2', 'inherit', 'mystery'], models);

    expect([...set.profileIds]).toEqual(['claude-opus-2-5', 'claude-sonnet-2']);
    expect([...set.floatingAliases]).toEqual(['opus']);
    expect(set.unknown).toEqual(['mystery']);
  });

  it('checks membership for every resolution kind', () => {
    const set = resolveModelSet(['opus', 'gpt-9'], models);
    const check = (reference: string): boolean => {
      const resolution = models.resolve(reference);
      if (!resolution) throw new Error(`unresolved ${reference}`);
      return isInModelSet(resolution, set);
    };

    expect(check('inherit')).toBe(true);
    expect(check('opus')).toBe(true);
    expect(check('claude-opus-2-5')).toBe(true);
    expect(check('gpt-9')).toBe(true);
    expect(check('claude-opus-2')).toBe(false);
    expect(check('sonnet')).toBe(false);
  });

  it('accepts a floating alias when the set pins its current release', () => {
    const set = resolveModelSet(['claude-opus-2-5'], models);
    const resolution = models.resolve('opus');

    expect(resolution && isInModelSet(resolution, set)).toBe(true);
  });
});

describe('mapModelToTarget', () => {
  const models = catalog();

  it('returns the scheme for model-aware targets only', () => {
    expect(getModelTargetScheme('claude')?.keepsFloatingAliases).toBe(true);
    expect(getModelTargetScheme('opencode')).toBeUndefined();
    expect(getModelTargetScheme('toString')).toBeUndefined();
  });

  it('passes references through for targets without a scheme', () => {
    expect(mapModelToTarget(' anything ', 'opencode', models)).toEqual({ value: 'anything' });
  });

  it('omits empty references', () => {
    expect(mapModelToTarget('  ', 'claude', models)).toEqual({});
  });

  it('keeps floating aliases on Claude and resolves them elsewhere', () => {
    expect(mapModelToTarget('Opus', 'claude', models)).toEqual({
      value: 'opus',
      profile: OPUS_2_5,
    });
    expect(mapModelToTarget('opus', 'github', models).value).toBe('Claude Opus 2.5');
    expect(mapModelToTarget('opus', 'factory', models).value).toBe('claude-opus-2-5');
  });

  it('keeps floating aliases backed by custom releases on alias-aware targets', () => {
    // A custom profile defaults to provider "custom", which the provider
    // check would reject even though the alias itself needs no provider.
    const custom = catalog({
      profiles: { 'claude-opus-9': { family: 'claude-opus', version: '9' } },
    });

    expect(mapModelToTarget('opus', 'claude', custom)).toEqual({
      value: 'opus',
      profile: expect.objectContaining({ id: 'claude-opus-9', provider: 'custom' }),
    });
    expect(mapModelToTarget('opus', 'github', custom).value).toBe('claude-opus-9');
    expect(mapModelToTarget('opus', 'codex', custom)).toEqual({
      issue: 'unsupported-provider',
      profile: expect.objectContaining({ id: 'claude-opus-9' }),
    });
  });

  it('writes the profile field each target names pinned releases by', () => {
    expect(mapModelToTarget('opus-1', 'claude', models).value).toBe('claude-opus-1-20240101');
    expect(mapModelToTarget('opus-1', 'factory', models).value).toBe('claude-opus-1-20240101');
    expect(mapModelToTarget('claude-opus-1', 'github', models).value).toBe('Claude Opus 1');
    expect(mapModelToTarget('opus-1', 'cursor', models).value).toBe('claude-opus-1');
    expect(mapModelToTarget('gpt-9', 'cursor', models).value).toBe('gpt-9');
  });

  it('writes or omits inherit per target', () => {
    expect(mapModelToTarget('inherit', 'claude', models)).toEqual({ value: 'inherit' });
    expect(mapModelToTarget('inherit', 'factory', models)).toEqual({ value: 'inherit' });
    expect(mapModelToTarget('inherit', 'github', models)).toEqual({});
    expect(mapModelToTarget('inherit', 'codex', models)).toEqual({});
  });

  it('omits models from providers the target cannot run', () => {
    expect(mapModelToTarget('gpt-9', 'claude', models)).toEqual({
      issue: 'unsupported-provider',
      profile: GPT_9,
    });
    expect(mapModelToTarget('sonnet', 'codex', models)).toEqual({
      issue: 'unsupported-provider',
      profile: SONNET_2,
    });
  });

  it('writes unknown names unchanged on every target', () => {
    for (const target of ['claude', 'github', 'factory', 'codex', 'cursor']) {
      expect(mapModelToTarget(' opusplan ', target, models)).toEqual({
        value: 'opusplan',
        issue: 'unknown-model',
      });
    }
  });

  it('writes native spellings of non-model values', () => {
    expect(mapModelToTarget('AUTO', 'github', models)).toEqual({ value: 'Auto' });
    expect(mapModelToTarget('auto', 'factory', models)).toEqual({
      value: 'auto',
      issue: 'unknown-model',
    });
  });

  it('lets catalog models win over native values', () => {
    const custom = catalog({ profiles: { auto: { displayName: 'Auto Router' } } });

    expect(mapModelToTarget('auto', 'github', custom).value).toBe('Auto Router');
  });

  it('omits names with a line break or control character', () => {
    expect(mapModelToTarget('opus\ntools: Bash', 'claude', models)).toEqual({
      issue: 'invalid-name',
    });
    expect(mapModelToTarget('gpt\u00859', 'opencode', models)).toEqual({ issue: 'invalid-name' });
    expect(mapModelToTarget('Opus\u20281', 'github', models)).toEqual({ issue: 'invalid-name' });
  });

  it('omits profile names with a line break, keeping the profile', () => {
    const custom = catalog({
      profiles: { 'gpt-9': { displayName: 'GPT\n9', targets: { factory: 'gpt-9\nx: y' } } },
    });
    const omitted = { issue: 'invalid-name', profile: expect.objectContaining({ id: 'gpt-9' }) };

    expect(mapModelToTarget('gpt-9', 'github', custom)).toEqual(omitted);
    expect(mapModelToTarget('gpt-9', 'factory', custom)).toEqual(omitted);
    expect(mapModelToTarget('gpt-9', 'cursor', custom)).toEqual({
      value: 'gpt-9',
      profile: expect.objectContaining({ id: 'gpt-9' }),
    });
  });

  it('prefers explicit per-target names, even across providers', () => {
    const custom = catalog({
      profiles: { 'gpt-9': { targets: { claude: 'gpt-9-bridge', github: 'GPT-9 (Preview)' } } },
    });

    expect(mapModelToTarget('gpt-9', 'claude', custom).value).toBe('gpt-9-bridge');
    expect(mapModelToTarget('GPT-9', 'github', custom).value).toBe('GPT-9 (Preview)');
  });

  it('uses the built-in catalog by default', () => {
    expect(mapModelToTarget('inherit', 'claude')).toEqual({ value: 'inherit' });
  });
});
