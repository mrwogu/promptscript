import { describe, expect, it } from 'vitest';
import {
  detectModelDrift,
  displacedProfile,
  formatProfileEntry,
  parseOpenRouterModels,
} from '../model-drift.js';
import type { ModelDriftCandidate } from '../model-drift.js';
import type { ModelProfile } from '../types/models.js';

function fixture(
  profile: Partial<ModelProfile> & Pick<ModelProfile, 'id' | 'family' | 'version' | 'displayName'>
): ModelProfile {
  return {
    provider: 'anthropic',
    apiId: profile.id,
    aliases: [],
    status: 'current',
    targets: {},
    ...profile,
  };
}

const OPUS_5_5 = fixture({
  id: 'claude-opus-5-5',
  family: 'claude-opus',
  version: '5.5',
  displayName: 'Claude Opus 5.5',
  aliases: ['opus-5.5'],
  releaseDate: '2026-09-22',
});
const SONNET_5 = fixture({
  id: 'claude-sonnet-5',
  family: 'claude-sonnet',
  version: '5',
  displayName: 'Claude Sonnet 5',
  status: 'legacy',
  successor: 'claude-sonnet-5-5',
  releaseDate: '2026-06-30',
});
const OPUS_5_0 = fixture({
  id: 'claude-opus-5',
  family: 'claude-opus',
  version: '5',
  displayName: 'Claude Opus 5',
  status: 'legacy',
  successor: 'claude-opus-5-5',
  releaseDate: '2026-07-24',
});
const GPT_5_2_CODEX = fixture({
  id: 'gpt-5.2-codex',
  provider: 'openai',
  family: 'gpt-codex',
  version: '5.2',
  displayName: 'GPT-5.2-Codex',
  releaseDate: '2026-01-14',
});
const GROK_4_5 = fixture({
  id: 'grok-4.5',
  provider: 'xai',
  family: 'grok',
  version: '4.5',
  displayName: 'Grok 4.5',
  releaseDate: '2026-07-08',
});

const PROFILES: readonly ModelProfile[] = [OPUS_5_0, OPUS_5_5, SONNET_5, GPT_5_2_CODEX, GROK_4_5];

const RELEASE = Math.floor(Date.UTC(2026, 8, 21) / 1000);

function payload(entries: Record<string, unknown>[]): unknown {
  return { data: entries };
}

function entry(
  id: string,
  name: string,
  created: number,
  extra: Record<string, unknown> = {}
): Record<string, unknown> {
  return { id, name, created, ...extra };
}

describe('parseOpenRouterModels', () => {
  it('reads the tracked providers and maps their prefixes', () => {
    const entries = parseOpenRouterModels(
      payload([
        entry('anthropic/claude-opus-5.5', 'Anthropic: Claude Opus 5.5', RELEASE, {
          canonical_slug: 'anthropic/claude-opus-5-5-20260921',
        }),
        entry('x-ai/grok-4.5', 'SpaceXAI: Grok 4.5', RELEASE, {
          canonical_slug: 'x-ai/grok-4.5-20260708',
        }),
      ])
    );

    expect(entries).toEqual([
      {
        slug: 'claude-opus-5.5',
        provider: 'anthropic',
        displayName: 'Claude Opus 5.5',
        releaseDate: '2026-09-21',
        retirementDate: undefined,
        apiId: 'claude-opus-5-5-20260921',
      },
      {
        slug: 'grok-4.5',
        provider: 'xai',
        displayName: 'Grok 4.5',
        releaseDate: '2026-09-21',
        retirementDate: undefined,
        apiId: 'grok-4.5-20260708',
      },
    ]);
  });

  it('drops mirrors, request variants, untracked providers, and malformed entries', () => {
    const entries = parseOpenRouterModels(
      payload([
        entry('~openai/gpt-5.2', 'OpenAI: GPT-5.2', RELEASE),
        entry('openai/gpt-5.2:batch', 'OpenAI: GPT-5.2 (batch)', RELEASE),
        entry('meta/llama-4', 'Meta: Llama 4', RELEASE),
        { id: 'openai/gpt-5.2' },
        { id: 'openai/gpt-5.2', name: 'OpenAI: GPT-5.2', created: 'not-a-number' },
      ])
    );

    expect(entries).toEqual([]);
  });

  it('returns nothing for payloads without a data array', () => {
    expect(parseOpenRouterModels({})).toEqual([]);
    expect(parseOpenRouterModels('nope')).toEqual([]);
  });

  it('keeps an expiration date as a retirement hint', () => {
    const [model] = parseOpenRouterModels(
      payload([
        entry('openai/gpt-5.2', 'OpenAI: GPT-5.2', RELEASE, { expiration_date: '2026-12-11' }),
      ])
    );

    expect(model?.retirementDate).toBe('2026-12-11');
  });
});

describe('detectModelDrift', () => {
  it('drafts a new version of a known family with the provider api id', () => {
    const report = detectModelDrift(
      parseOpenRouterModels(
        payload([
          entry('anthropic/claude-opus-6', 'Anthropic: Claude Opus 6', RELEASE, {
            canonical_slug: 'anthropic/claude-opus-6-20260724',
          }),
        ])
      ),
      PROFILES
    );

    expect(report.candidates).toEqual([
      {
        provider: 'anthropic',
        family: 'claude-opus',
        version: '6',
        id: 'claude-opus-6',
        displayName: 'Claude Opus 6',
        releaseDate: '2026-09-21',
        retirementDate: undefined,
        apiId: 'claude-opus-6-20260724',
      },
    ]);
  });

  it('keeps dotted and dashed versions of catalog releases out of the candidates', () => {
    const report = detectModelDrift(
      parseOpenRouterModels(
        payload([
          entry('anthropic/claude-opus-5.5', 'Anthropic: Claude Opus 5.5', RELEASE),
          entry('anthropic/claude-sonnet-5', 'Anthropic: Claude Sonnet 5', RELEASE),
        ])
      ),
      PROFILES
    );

    expect(report.candidates).toEqual([]);
  });

  it('drafts dotted ids for the non-Anthropic providers', () => {
    const report = detectModelDrift(
      parseOpenRouterModels(
        payload([
          entry('openai/gpt-5.3-codex', 'OpenAI: GPT-5.3-Codex', RELEASE, {
            canonical_slug: 'openai/gpt-5.3-codex-20260224',
          }),
          entry('x-ai/grok-4.6', 'SpaceXAI: Grok 4.6', RELEASE),
        ])
      ),
      PROFILES
    );

    expect(
      report.candidates.map((candidate) => [candidate.id, candidate.family, candidate.version])
    ).toEqual([
      ['gpt-5.3-codex', 'gpt-codex', '5.3'],
      ['grok-4.6', 'grok', '4.6'],
    ]);
  });

  it('reports models no catalog family matches as unmatched', () => {
    const report = detectModelDrift(
      parseOpenRouterModels(
        payload([
          entry('openai/gpt-5.5-pro', 'OpenAI: GPT-5.5 Pro', RELEASE),
          entry('openai/gpt-audio', 'OpenAI: GPT-Audio', RELEASE),
        ])
      ),
      PROFILES
    );

    expect(report.unmatched).toEqual(['gpt-5.5-pro', 'gpt-audio']);
    expect(report.candidates).toEqual([]);
  });

  it('reports catalog releases OpenRouter does not list as absent', () => {
    const report = detectModelDrift(
      parseOpenRouterModels(
        payload([entry('anthropic/claude-opus-5.5', 'Anthropic: Claude Opus 5.5', RELEASE)])
      ),
      PROFILES
    );

    expect(report.absent).toEqual([
      'claude-opus-5',
      'claude-sonnet-5',
      'gpt-5.2-codex',
      'grok-4.5',
    ]);
  });

  it('orders candidates oldest first', () => {
    const report = detectModelDrift(
      parseOpenRouterModels(
        payload([
          entry('x-ai/grok-4.6', 'SpaceXAI: Grok 4.6', RELEASE + 40 * 86400),
          entry('openai/gpt-5.3-codex', 'OpenAI: GPT-5.3-Codex', RELEASE),
        ])
      ),
      PROFILES
    );

    expect(report.candidates.map((candidate) => candidate.id)).toEqual([
      'gpt-5.3-codex',
      'grok-4.6',
    ]);
  });

  it('skips versions the catalog history already covers or predates', () => {
    const report = detectModelDrift(
      parseOpenRouterModels(
        payload([
          entry('openai/gpt-5.1-codex', 'OpenAI: GPT-5.1-Codex', RELEASE),
          entry('openai/gpt-4.3-codex', 'OpenAI: GPT-4.3-Codex', RELEASE),
        ])
      ),
      PROFILES
    );

    expect(report.candidates).toEqual([]);
    expect(report.unmatched).toEqual([]);
  });

  it('skips a newer-looking version listed before the family latest', () => {
    const report = detectModelDrift(
      parseOpenRouterModels(
        payload([
          entry('x-ai/grok-4.5', 'SpaceXAI: Grok 4.5', RELEASE),
          entry('x-ai/grok-4.20', 'SpaceXAI: Grok 4.20', RELEASE - 100 * 86400),
        ])
      ),
      PROFILES
    );

    expect(report.candidates).toEqual([]);
  });
});

describe('displacedProfile', () => {
  const candidate: ModelDriftCandidate = {
    provider: 'anthropic',
    family: 'claude-opus',
    version: '6',
    id: 'claude-opus-6',
    displayName: 'Claude Opus 6',
    releaseDate: '2026-07-24',
  };

  it('returns the current release of the family without a successor', () => {
    expect(displacedProfile(candidate, PROFILES)?.id).toBe('claude-opus-5-5');
  });

  it('returns undefined when every release of the family is superseded', () => {
    expect(displacedProfile({ ...candidate, family: 'claude-sonnet' }, PROFILES)).toBeUndefined();
  });
});

describe('formatProfileEntry', () => {
  it('writes an Anthropic release with the claude helper', () => {
    const text = formatProfileEntry({
      provider: 'anthropic',
      family: 'claude-opus',
      version: '6',
      id: 'claude-opus-6',
      displayName: 'Claude Opus 6',
      releaseDate: '2026-07-24',
      apiId: 'claude-opus-6-20260724',
    });

    expect(text).toBe(
      "  claude('opus', '6', {\n    apiId: 'claude-opus-6-20260724',\n    releaseDate: '2026-07-24',\n  }),"
    );
  });

  it('writes other providers with their own helper and display name', () => {
    const text = formatProfileEntry({
      provider: 'openai',
      family: 'gpt-codex',
      version: '5.3',
      id: 'gpt-5.3-codex',
      displayName: 'GPT-5.3-Codex',
      releaseDate: '2026-02-24',
      apiId: 'gpt-5.3-codex-20260224',
    });

    expect(text).toBe(
      "  openai('gpt-codex', '5.3', 'gpt-5.3-codex', 'GPT-5.3-Codex', {\n    apiId: 'gpt-5.3-codex-20260224',\n    releaseDate: '2026-02-24',\n  }),"
    );
  });

  it('writes a retirement hint as a deprecated release', () => {
    const text = formatProfileEntry({
      provider: 'xai',
      family: 'grok',
      version: '4.6',
      id: 'grok-4.6',
      displayName: 'Grok 4.6',
      releaseDate: '2026-08-10',
      retirementDate: '2027-08-10',
    });

    expect(text).toBe(
      "  xai('grok', '4.6', 'grok-4.6', 'Grok 4.6', {\n    status: 'deprecated',\n    retirementDate: '2027-08-10',\n    releaseDate: '2026-08-10',\n  }),"
    );
  });
});
