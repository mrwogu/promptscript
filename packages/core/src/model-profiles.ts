/**
 * Built-in model profiles.
 *
 * Checked on 2026-09-23 against the provider model and deprecation pages,
 * the Claude Code model configuration, and the GitHub Copilot supported
 * models list. Status and retirement dates follow the provider API; a tool
 * can stop offering a model before the provider does.
 *
 * @module model-profiles
 */

import type { ModelProfile, ModelStatus } from './types/models.js';

interface ReleaseFields {
  readonly apiId?: string;
  readonly displayName?: string;
  readonly aliases?: readonly string[];
  readonly status?: ModelStatus;
  readonly successor?: string;
  readonly releaseDate?: string;
  readonly retirementDate?: string;
}

function release(
  provider: string,
  family: string,
  version: string,
  id: string,
  displayName: string,
  fields: ReleaseFields = {}
): ModelProfile {
  return {
    id,
    provider,
    family,
    version,
    displayName,
    apiId: id,
    aliases: [],
    // A release with a successor is legacy unless it says otherwise.
    status: fields.successor === undefined ? 'current' : 'legacy',
    targets: {},
    ...fields,
  };
}

/**
 * Claude release with the naming Anthropic uses from Claude 4 on:
 * `claude-opus-5-5`, "Claude Opus 5.5", and the short alias `opus-5.5`.
 * The 3.x era put the version first ("Claude 3.5 Sonnet"), so those
 * releases pass `displayName` themselves.
 */
function claude(
  line: string,
  version: string,
  fields: ReleaseFields & { readonly id?: string } = {}
): ModelProfile {
  const { id = `claude-${line}-${version.replaceAll('.', '-')}`, displayName, ...rest } = fields;
  const name = `${line.charAt(0).toUpperCase()}${line.slice(1)}`;
  return release(
    'anthropic',
    `claude-${line}`,
    version,
    id,
    displayName ?? `Claude ${name} ${version}`,
    {
      aliases: [`${line}-${version}`],
      ...rest,
    }
  );
}

const openai = (
  family: string,
  version: string,
  id: string,
  displayName: string,
  fields?: ReleaseFields
): ModelProfile => release('openai', family, version, id, displayName, fields);

const google = (
  family: string,
  version: string,
  id: string,
  displayName: string,
  fields?: ReleaseFields
): ModelProfile => release('google', family, version, id, displayName, fields);

const xai = (
  family: string,
  version: string,
  id: string,
  displayName: string,
  fields?: ReleaseFields
): ModelProfile => release('xai', family, version, id, displayName, fields);

/**
 * Built-in model profiles, grouped by provider and family, oldest first.
 */
export const MODEL_PROFILES: readonly ModelProfile[] = [
  // Anthropic
  claude('opus', '4', {
    apiId: 'claude-opus-4-20250514',
    status: 'retired',
    successor: 'claude-opus-4-1',
    releaseDate: '2025-05-22',
    retirementDate: '2026-06-15',
  }),
  claude('opus', '4.1', {
    apiId: 'claude-opus-4-1-20250805',
    status: 'retired',
    successor: 'claude-opus-4-5',
    releaseDate: '2025-08-05',
    retirementDate: '2026-08-05',
  }),
  claude('opus', '4.5', {
    apiId: 'claude-opus-4-5-20251101',
    successor: 'claude-opus-4-6',
    releaseDate: '2025-11-24',
  }),
  claude('opus', '4.6', { successor: 'claude-opus-4-7' }),
  claude('opus', '4.7', { successor: 'claude-opus-4-8' }),
  claude('opus', '4.8', { successor: 'claude-opus-5' }),
  claude('opus', '5', { successor: 'claude-opus-5-5', releaseDate: '2026-07-24' }),
  claude('opus', '5.5', { releaseDate: '2026-09-22' }),
  claude('sonnet', '3.5', {
    id: 'claude-3-5-sonnet',
    apiId: 'claude-3-5-sonnet-20241022',
    displayName: 'Claude 3.5 Sonnet',
    aliases: ['sonnet-3.5', 'claude-3-5-sonnet-latest'],
    status: 'retired',
    successor: 'claude-3-7-sonnet',
    releaseDate: '2024-10-22',
    retirementDate: '2025-10-28',
  }),
  claude('sonnet', '3.7', {
    id: 'claude-3-7-sonnet',
    apiId: 'claude-3-7-sonnet-20250219',
    displayName: 'Claude 3.7 Sonnet',
    aliases: ['sonnet-3.7', 'claude-3-7-sonnet-latest'],
    status: 'retired',
    successor: 'claude-sonnet-4',
    releaseDate: '2025-02-24',
    retirementDate: '2026-02-19',
  }),
  claude('sonnet', '4', {
    apiId: 'claude-sonnet-4-20250514',
    status: 'retired',
    successor: 'claude-sonnet-4-5',
    releaseDate: '2025-05-22',
    retirementDate: '2026-06-15',
  }),
  claude('sonnet', '4.5', {
    apiId: 'claude-sonnet-4-5-20250929',
    successor: 'claude-sonnet-4-6',
    releaseDate: '2025-09-29',
  }),
  claude('sonnet', '4.6', { successor: 'claude-sonnet-5' }),
  claude('sonnet', '5', { releaseDate: '2026-06-30' }),
  claude('haiku', '3.5', {
    id: 'claude-3-5-haiku',
    apiId: 'claude-3-5-haiku-20241022',
    displayName: 'Claude 3.5 Haiku',
    aliases: ['haiku-3.5', 'claude-3-5-haiku-latest'],
    status: 'retired',
    successor: 'claude-haiku-4-5',
    releaseDate: '2024-10-22',
    retirementDate: '2026-02-19',
  }),
  claude('haiku', '4.5', { apiId: 'claude-haiku-4-5-20251001', releaseDate: '2025-10-15' }),
  claude('fable', '5', { successor: 'claude-fable-5-1', releaseDate: '2026-06-09' }),
  claude('fable', '5.1', { releaseDate: '2026-09-01' }),
  claude('mythos', '5', { successor: 'claude-mythos-5-1', releaseDate: '2026-06-09' }),
  claude('mythos', '5.1', { releaseDate: '2026-09-01' }),

  // OpenAI
  openai('gpt-4o', '4o', 'gpt-4o', 'GPT-4o', { successor: 'gpt-4.1', releaseDate: '2024-05-13' }),
  openai('gpt', '4.1', 'gpt-4.1', 'GPT-4.1', { successor: 'gpt-5.5', releaseDate: '2025-04-14' }),
  openai('gpt', '5', 'gpt-5', 'GPT-5', {
    status: 'deprecated',
    successor: 'gpt-5.1',
    releaseDate: '2025-08-07',
    retirementDate: '2026-12-11',
  }),
  openai('gpt', '5.1', 'gpt-5.1', 'GPT-5.1', {
    status: 'deprecated',
    successor: 'gpt-5.2',
    releaseDate: '2025-11-13',
  }),
  openai('gpt', '5.2', 'gpt-5.2', 'GPT-5.2', { successor: 'gpt-5.4', releaseDate: '2025-12-11' }),
  openai('gpt', '5.4', 'gpt-5.4', 'GPT-5.4', { successor: 'gpt-5.5', releaseDate: '2026-03-05' }),
  openai('gpt', '5.5', 'gpt-5.5', 'GPT-5.5', {
    successor: 'gpt-5.6-sol',
    releaseDate: '2026-04-24',
  }),
  openai('gpt-mini', '5', 'gpt-5-mini', 'GPT-5 mini', {
    status: 'deprecated',
    successor: 'gpt-5.4-mini',
    releaseDate: '2025-08-07',
    retirementDate: '2026-12-11',
  }),
  openai('gpt-mini', '5.4', 'gpt-5.4-mini', 'GPT-5.4 mini', {
    successor: 'gpt-5.6-terra',
    releaseDate: '2026-03-17',
  }),
  openai('gpt-nano', '5', 'gpt-5-nano', 'GPT-5 nano', {
    status: 'deprecated',
    successor: 'gpt-5.4-nano',
    releaseDate: '2025-08-07',
    retirementDate: '2026-12-11',
  }),
  openai('gpt-nano', '5.4', 'gpt-5.4-nano', 'GPT-5.4 nano', {
    successor: 'gpt-5.6-luna',
    releaseDate: '2026-03-17',
  }),
  openai('gpt-codex', '5', 'gpt-5-codex', 'GPT-5-Codex', { successor: 'gpt-5.1-codex' }),
  openai('gpt-codex', '5.1', 'gpt-5.1-codex', 'GPT-5.1-Codex', {
    successor: 'gpt-5.2-codex',
    releaseDate: '2025-11-13',
  }),
  openai('gpt-codex', '5.2', 'gpt-5.2-codex', 'GPT-5.2-Codex', {
    status: 'deprecated',
    successor: 'gpt-5.3-codex',
    releaseDate: '2026-01-14',
  }),
  openai('gpt-codex', '5.3', 'gpt-5.3-codex', 'GPT-5.3-Codex', { releaseDate: '2026-02-24' }),
  openai('gpt-codex-max', '5.1', 'gpt-5.1-codex-max', 'GPT-5.1-Codex-Max', {
    successor: 'gpt-5.2-codex',
    releaseDate: '2025-12-04',
  }),
  openai('gpt-codex-mini', '5.1', 'gpt-5.1-codex-mini', 'GPT-5.1-Codex-Mini', {
    successor: 'gpt-5.3-codex',
    releaseDate: '2025-11-13',
  }),
  openai('gpt-sol', '5.6', 'gpt-5.6-sol', 'GPT-5.6 Sol', {
    successor: 'gpt-6-astra',
    releaseDate: '2026-07-09',
  }),
  openai('gpt-sol', '6', 'gpt-6-sol', 'GPT-6 Sol', { releaseDate: '2026-09-22' }),
  openai('gpt-terra', '5.6', 'gpt-5.6-terra', 'GPT-5.6 Terra', {
    successor: 'gpt-6-sol',
    releaseDate: '2026-07-09',
  }),
  openai('gpt-luna', '5.6', 'gpt-5.6-luna', 'GPT-5.6 Luna', {
    successor: 'gpt-6-luna',
    releaseDate: '2026-07-09',
  }),
  openai('gpt-luna', '6', 'gpt-6-luna', 'GPT-6 Luna', { releaseDate: '2026-09-22' }),
  openai('gpt-astra', '6', 'gpt-6-astra', 'GPT-6 Astra', { releaseDate: '2026-09-03' }),
  openai('o3', '3', 'o3', 'o3', {
    status: 'deprecated',
    successor: 'gpt-5.5',
    releaseDate: '2025-04-16',
    retirementDate: '2026-12-11',
  }),
  openai('o4-mini', '4', 'o4-mini', 'o4-mini', {
    status: 'deprecated',
    successor: 'gpt-5.4-mini',
    releaseDate: '2025-04-16',
    retirementDate: '2026-10-23',
  }),

  // Google
  google('gemini-pro', '2.5', 'gemini-2.5-pro', 'Gemini 2.5 Pro', {
    successor: 'gemini-3.1-pro-preview',
    releaseDate: '2025-06-17',
  }),
  google('gemini-pro', '3.1', 'gemini-3.1-pro-preview', 'Gemini 3.1 Pro', {
    aliases: ['Gemini 3.1 Pro Preview'],
    releaseDate: '2026-02-19',
  }),
  google('gemini-flash', '2.5', 'gemini-2.5-flash', 'Gemini 2.5 Flash', {
    successor: 'gemini-3.5-flash',
    releaseDate: '2025-06-17',
  }),
  google('gemini-flash', '3.5', 'gemini-3.5-flash', 'Gemini 3.5 Flash', {
    successor: 'gemini-3.6-flash',
    releaseDate: '2026-05-19',
  }),
  google('gemini-flash', '3.6', 'gemini-3.6-flash', 'Gemini 3.6 Flash', {
    successor: 'gemini-3.7-flash',
    releaseDate: '2026-07-21',
  }),
  google('gemini-flash', '3.7', 'gemini-3.7-flash', 'Gemini 3.7 Flash', {
    successor: 'gemini-3.8-flash',
    releaseDate: '2026-08-13',
  }),
  google('gemini-flash', '3.8', 'gemini-3.8-flash', 'Gemini 3.8 Flash', {
    releaseDate: '2026-09-02',
  }),
  google('gemini-flash-lite', '2.5', 'gemini-2.5-flash-lite', 'Gemini 2.5 Flash-Lite', {
    successor: 'gemini-3.1-flash-lite',
    releaseDate: '2025-07-22',
  }),
  google('gemini-flash-lite', '3.1', 'gemini-3.1-flash-lite', 'Gemini 3.1 Flash-Lite', {
    status: 'deprecated',
    successor: 'gemini-3.5-flash-lite',
    releaseDate: '2026-05-07',
    retirementDate: '2027-05-07',
  }),
  google('gemini-flash-lite', '3.5', 'gemini-3.5-flash-lite', 'Gemini 3.5 Flash-Lite', {
    releaseDate: '2026-07-21',
  }),

  // xAI
  xai('grok', '4.5', 'grok-4.5', 'Grok 4.5', { successor: 'grok-4.6' }),
  xai('grok', '4.6', 'grok-4.6', 'Grok 4.6', { successor: 'grok-4.7' }),
  xai('grok', '4.7', 'grok-4.7', 'Grok 4.7'),
];
