import { readFileSync } from 'node:fs';
import { Ajv } from 'ajv';
import { describe, expect, it } from 'vitest';
import { isApprovalRecordV1 } from '@promptscript/core';
import { compileSchema } from './prompt-bundle-validators.js';

type Doc = Record<string, unknown>;

const HASH = `sha256-${'0123456789abcdef'.repeat(4)}`;

const configSchema = JSON.parse(
  readFileSync(new URL('../../../../schema/config.json', import.meta.url), 'utf8')
) as object;

describe('config schema governance key', () => {
  const validate = new Ajv({ strict: false }).compile(configSchema);
  const config = (governance: unknown): Doc => ({
    id: 'test',
    syntax: '1.5.0',
    targets: ['claude'],
    governance,
  });

  it('accepts the documented example', () => {
    const governance = {
      admins: ['@acme/prompt-platform'],
      roles: { legal: ['@acme/legal'], security: ['@acme/appsec', 'jane@acme.io', '@jane'] },
      dataClasses: ['pii', 'phi', 'financial', 'credentials', 'internal', 'public'],
      codeowners: { output: '.github/CODEOWNERS', protect: ['.github/workflows'], prompts: false },
    };

    expect(validate(config(governance)), JSON.stringify(validate.errors)).toBe(true);
  });

  it('accepts GitLab subgroups and 32 roles', () => {
    const roles = Object.fromEntries(
      Array.from({ length: 32 }, (_, i) => [`role-${i}`, ['@acme/legal/eu']])
    );

    expect(validate(config({ roles }))).toBe(true);
  });

  it.each([
    ['an unknown key', { owners: ['@acme/x'] }],
    ['an owner without @', { admins: ['acme/legal'] }],
    ['a user handle of 40 characters', { admins: [`@${'a'.repeat(40)}`] }],
    ['an email without a domain suffix', { admins: ['jane@acme'] }],
    ['an owner of 255 characters', { admins: [`${'a'.repeat(247)}@acme.io`] }],
    ['a duplicate admin', { admins: ['@acme/x', '@acme/x'] }],
    ['an uppercase role', { roles: { Legal: ['@acme/legal'] } }],
    ['a device name role', { roles: { nul: ['@acme/legal'] } }],
    ['a COM0 device name role', { roles: { com0: ['@acme/legal'] } }],
    ['an LPT0 device name role', { roles: { lpt0: ['@acme/legal'] } }],
    ['a role as a string', { roles: { legal: '@acme/legal' } }],
    ['a role without owners', { roles: { legal: [] } }],
    ['a duplicate role owner', { roles: { legal: ['@acme/legal', '@acme/legal'] } }],
    [
      '33 roles',
      {
        roles: Object.fromEntries(Array.from({ length: 33 }, (_, i) => [`role-${i}`, ['@a']])),
      },
    ],
    ['another CODEOWNERS location', { codeowners: { output: 'OWNERS' } }],
  ])('rejects %s', (_name, governance) => {
    expect(validate(config(governance))).toBe(false);
  });
});

describe('config schema prompt policies', () => {
  const validate = new Ajv({ strict: false }).compile(configSchema);
  const config = (policy: Doc): Doc => ({
    id: 'test',
    syntax: '1.5.0',
    targets: ['claude'],
    policies: [{ name: 'p', severity: 'error', ...policy }],
  });
  const match = { minRisk: 'high', domains: ['payments'], dataClasses: ['pii'] };

  it.each([
    ['required-metadata', { kind: 'required-metadata', match, fields: ['risk', 'owner'] }],
    [
      'risk-floor',
      {
        kind: 'risk-floor',
        floors: [
          { dataClasses: ['phi', 'credentials'], minimum: 'critical' },
          { inputTypes: ['string'], minimum: 'medium' },
        ],
      },
    ],
    ['model-allowlist', { kind: 'model-allowlist', match, models: ['claude-sonnet-5-5'] }],
    [
      'required-approvals',
      {
        kind: 'required-approvals',
        match: { minRisk: 'high' },
        environments: ['prod'],
        approvals: [{ role: 'legal', count: 1 }, { role: 'security' }],
      },
    ],
    ['required-evals', { kind: 'required-evals', environments: ['prod'] }],
    [
      'content-rules',
      {
        kind: 'content-rules',
        match: { domains: ['payments'] },
        checks: ['suspicious-urls', 'PS012'],
        deny: ['guaranteed refund'],
        allow: [String.raw`bypass\s+rules`],
      },
    ],
  ])('accepts a %s policy', (_kind, policy) => {
    expect(validate(config(policy)), JSON.stringify(validate.errors)).toBe(true);
  });

  it.each([
    ['a misspelled match key', { kind: 'required-evals', match: { minrisk: 'high' } }],
    ['an unknown risk level', { kind: 'required-evals', match: { minRisk: 'huge' } }],
    ['a field outside governance', { kind: 'required-metadata', fields: ['id'] }],
    ['a floor row without a condition', { kind: 'risk-floor', floors: [{ minimum: 'high' }] }],
    [
      'match on a risk-floor policy',
      { kind: 'risk-floor', match, floors: [{ dataClasses: ['pii'], minimum: 'high' }] },
    ],
    ['an empty model list', { kind: 'model-allowlist', models: [] }],
    [
      'an approval count of 2',
      { kind: 'required-approvals', approvals: [{ role: 'legal', count: 2 }] },
    ],
    ['an approval without a role', { kind: 'required-approvals', approvals: [{ count: 1 }] }],
    ['the path-traversal check', { kind: 'content-rules', checks: ['path-traversal'] }],
  ])('rejects %s', (_name, policy) => {
    expect(validate(config(policy))).toBe(false);
  });
});

describe('approval record schema', () => {
  const validate = compileSchema('approval-record-v1.json');
  const record = (): Doc => ({
    $schema: 'https://getpromptscript.dev/schema/approval-record/v1.json',
    prompt: 'acme-support/refund-reply',
    contentHash: HASH,
    role: 'legal',
    approver: { source: 'asserted', value: '@jane' },
    createdAt: '2026-10-22T09:14:03.120Z',
    environment: 'prod',
    comment: 'Refund wording checked against policy 7.2',
  });
  const without = (key: string): Doc => {
    const value = record();
    delete value[key];
    return value;
  };
  const signature = '-----BEGIN SSH SIGNATURE-----\nU1NIU0lH\n-----END SSH SIGNATURE-----\n';

  it.each([
    ['the example record', record()],
    ['a record without environment and comment', { ...without('environment'), comment: 'ok' }],
    ['a scoped meta id', { ...record(), prompt: '@acme/support/refund-reply' }],
    ['a comment with newlines', { ...record(), comment: 'line one\nline two' }],
    ['a comment of 2000 code points', { ...record(), comment: '\u{1F600}'.repeat(2000) }],
    ['the reserved signature fields', { ...record(), signatureType: 'ssh', signature }],
  ])('accepts %s, like the guard', (_name, value) => {
    expect(validate(value), JSON.stringify(validate.errors)).toBe(true);
    expect(isApprovalRecordV1(value)).toBe(true);
  });

  it.each([
    ['an extra property', { ...record(), note: 'x' }],
    ['no $schema', without('$schema')],
    ['no createdAt', without('createdAt')],
    ['another $schema', { ...record(), $schema: 'https://example.com/approval.json' }],
    ['a prompt without a key', { ...record(), prompt: 'refund-reply' }],
    ['a prompt segment ending in a dot', { ...record(), prompt: 'acme./refund-reply' }],
    ['a prompt with ..', { ...record(), prompt: 'a..b/refund-reply' }],
    ['a short hash', { ...record(), contentHash: 'sha256-3f9a1c2b' }],
    ['a device name role', { ...record(), role: 'aux' }],
    ['a COM0 device name role', { ...record(), role: 'com0' }],
    ['an LPT0 device name role', { ...record(), role: 'lpt0' }],
    ['an email approver', { ...record(), approver: { source: 'asserted', value: 'j@acme.io' } }],
    [
      'a homoglyph approver',
      { ...record(), approver: { source: 'asserted', value: '@j\u0430ne' } },
    ],
    ['a signed approver', { ...record(), approver: { source: 'ssh-key', value: '@jane' } }],
    ['an approver extra key', { ...record(), approver: { source: 'asserted', value: '@j', x: 1 } }],
    ['a date without milliseconds', { ...record(), createdAt: '2026-10-22T09:14:03Z' }],
    ['an uppercase environment', { ...record(), environment: 'Prod' }],
    ['a comment of 2001 characters', { ...record(), comment: 'a'.repeat(2001) }],
    ['a comment with a tab', { ...record(), comment: 'a\tb' }],
    ['a comment with a C1 control', { ...record(), comment: 'a\u009bb' }],
    ['a comment with a lone surrogate', { ...record(), comment: 'a\uDC00b' }],
    ['another signature type', { ...record(), signatureType: 'gpg' }],
    ['a bare signature', { ...record(), signature: 'U1NIU0lH' }],
  ])('rejects %s, like the guard', (_name, value) => {
    expect(validate(value)).toBe(false);
    expect(isApprovalRecordV1(value)).toBe(false);
  });
});
