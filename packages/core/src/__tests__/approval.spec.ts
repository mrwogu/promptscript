import { describe, expect, it } from 'vitest';
import {
  APPROVAL_RECORD_SCHEMA_URL,
  approvalRecordPath,
  GIT_HOST_USER_PATTERN,
  isApprovalRecordV1,
  isApproverHandle,
  MAX_APPROVER_LENGTH,
  parseApprovalRecord,
  serializeApprovalRecord,
  type ApprovalRecordV1,
} from '../types/approval.js';

const HASH = `sha256-${'0123456789abcdef'.repeat(4)}`;

function record(overrides: Partial<ApprovalRecordV1> = {}): ApprovalRecordV1 {
  return {
    $schema: APPROVAL_RECORD_SCHEMA_URL,
    prompt: 'acme-support/refund-reply',
    contentHash: HASH,
    role: 'legal',
    approver: { source: 'asserted', value: '@jane' },
    createdAt: '2026-10-22T09:14:03.120Z',
    ...overrides,
  };
}

const as = (value: string): ApprovalRecordV1['approver'] => ({ source: 'asserted', value });

describe('isApproverHandle', () => {
  it.each(['@jane', '@Jane-Doe', '@jane.doe', '@name_shortcode', '@a-b-c', `@${'a'.repeat(100)}`])(
    'accepts %s',
    (value) => {
      expect(isApproverHandle(value)).toBe(true);
    }
  );

  it.each([
    ['no @', 'jane'],
    ['only @', '@'],
    ['a leading dot', '@.jane'],
    ['two dots', '@..'],
    ['two dots in a row', '@a..b'],
    ['two hyphens in a row', '@a--b'],
    ['a dot and an underscore in a row', '@a._b'],
    ['a trailing dot', '@jane.'],
    ['a trailing hyphen', '@jane-'],
    ['a leading underscore', '@_jane'],
    ['a slash', '@jane/x'],
    ['a parent segment', '@jane/../x'],
    ['a backslash', '@jane\\x'],
    ['a space', '@jane doe'],
    ['a trailing newline', '@jane\n'],
    ['a non-ASCII letter', '@j\u0430ne'],
    ['101 characters after @', `@${'a'.repeat(MAX_APPROVER_LENGTH)}`],
  ])('refuses %s', (_name, value) => {
    expect(isApproverHandle(value)).toBe(false);
  });

  it('follows the governance user rule, only with a length bound', () => {
    const long = `@${'a'.repeat(200)}`;

    expect(GIT_HOST_USER_PATTERN.test(long)).toBe(true);
    expect(isApproverHandle(long)).toBe(false);
  });
});

describe('isApprovalRecordV1', () => {
  it.each(['@jane.doe', '@name_shortcode'])('accepts the approver %s', (value) => {
    expect(isApprovalRecordV1(record({ approver: as(value) }))).toBe(true);
  });

  it('accepts a minimal record', () => {
    expect(isApprovalRecordV1(record())).toBe(true);
  });

  it('accepts a record with every optional field', () => {
    const full = record({
      environment: 'prod',
      comment: 'Checked against policy 7.2\nand the refund table.',
      signatureType: 'ssh',
      signature: '-----BEGIN SSH SIGNATURE-----\nU1NIU0lH\n-----END SSH SIGNATURE-----\n',
    });

    expect(isApprovalRecordV1(full)).toBe(true);
  });

  it('accepts a scoped meta id and a comment of 2000 code points', () => {
    const value = record({
      prompt: '@acme/support.v2/refund_reply',
      comment: '\u{1F600}'.repeat(2000),
    });

    expect(isApprovalRecordV1(value)).toBe(true);
  });

  it.each([
    ['null', null],
    ['an array', []],
    ['an extra key', { ...record(), note: 'x' }],
    ['a __proto__ key', JSON.parse(`{"__proto__":1,${JSON.stringify(record()).slice(1)}`)],
    ['another schema', record({ $schema: 'x' as ApprovalRecordV1['$schema'] })],
    ['a prompt without a key', { ...record(), prompt: 'acme-support' }],
    ['a prompt segment ending in a dot', { ...record(), prompt: 'acme./refund-reply' }],
    ['a prompt with ..', { ...record(), prompt: 'a..b/refund-reply' }],
    ['a prompt key with a dot', { ...record(), prompt: 'acme/refund.reply' }],
    ['a short hash', { ...record(), contentHash: 'sha256-3f9a1c2b' }],
    ['an uppercase hash', { ...record(), contentHash: HASH.toUpperCase() }],
    ['an uppercase role', { ...record(), role: 'Legal' }],
    ['a device name role', { ...record(), role: 'con' }],
    ['a COM0 device name role', { ...record(), role: 'com0' }],
    ['an LPT0 device name role', { ...record(), role: 'lpt0' }],
    ['a role of 33 characters', { ...record(), role: 'a'.repeat(33) }],
    ['an email approver', { ...record(), approver: { source: 'asserted', value: 'jane@acme.io' } }],
    ['a team approver', { ...record(), approver: { source: 'asserted', value: '@acme/legal' } }],
    ['an approver with a leading dot', { ...record(), approver: as('@.jane') }],
    ['an approver of 101 characters', { ...record(), approver: as(`@${'a'.repeat(101)}`) }],
    [
      'a homoglyph approver',
      { ...record(), approver: { source: 'asserted', value: '@j\u0430ne' } },
    ],
    ['a signed approver', { ...record(), approver: { source: 'ssh-key', value: '@jane' } }],
    [
      'an approver with an extra key',
      { ...record(), approver: { source: 'asserted', value: '@jane', name: 'Jane' } },
    ],
    ['a date without milliseconds', { ...record(), createdAt: '2026-10-22T09:14:03Z' }],
    ['an uppercase environment', { ...record(), environment: 'Prod' }],
    ['a comment of 2001 characters', { ...record(), comment: 'a'.repeat(2001) }],
    ['a comment with a carriage return', { ...record(), comment: 'a\r\nb' }],
    ['a comment with a C1 control', { ...record(), comment: 'a\u0085b' }],
    ['a comment with a lone surrogate', { ...record(), comment: 'a\uD800b' }],
    ['a numeric comment', { ...record(), comment: 1 }],
    ['another signature type', { ...record(), signatureType: 'gpg' }],
    ['a bare signature', { ...record(), signature: 'U1NIU0lH' }],
  ])('rejects %s', (_name, value) => {
    expect(isApprovalRecordV1(value)).toBe(false);
  });
});

describe('serializeApprovalRecord', () => {
  it('writes keys in a fixed order with a trailing newline', () => {
    const shuffled = {
      comment: 'ok',
      environment: 'prod',
      createdAt: '2026-10-22T09:14:03.120Z',
      approver: { value: '@jane', source: 'asserted' },
      role: 'legal',
      contentHash: HASH,
      prompt: 'acme-support/refund-reply',
      $schema: APPROVAL_RECORD_SCHEMA_URL,
    } as ApprovalRecordV1;

    const text = serializeApprovalRecord(shuffled);

    expect(text).toBe(
      [
        '{',
        `  "$schema": "${APPROVAL_RECORD_SCHEMA_URL}",`,
        '  "prompt": "acme-support/refund-reply",',
        `  "contentHash": "${HASH}",`,
        '  "role": "legal",',
        '  "approver": {',
        '    "source": "asserted",',
        '    "value": "@jane"',
        '  },',
        '  "createdAt": "2026-10-22T09:14:03.120Z",',
        '  "environment": "prod",',
        '  "comment": "ok"',
        '}',
        '',
      ].join('\n')
    );
  });
});

describe('parseApprovalRecord', () => {
  const bytes = (text: string): Uint8Array => new TextEncoder().encode(text);

  it('reads the bytes the writer produces', () => {
    const value = record({ environment: 'prod', comment: 'line one\nline two' });

    expect(parseApprovalRecord(bytes(serializeApprovalRecord(value)))).toEqual(value);
  });

  it.each([
    ['CRLF line endings', (text: string) => text.replaceAll('\n', '\r\n')],
    ['a byte order mark', (text: string) => `\uFEFF${text}`],
    ['no trailing newline', (text: string) => text.trimEnd()],
    ['compact JSON', (text: string) => JSON.stringify(JSON.parse(text))],
    ['an escaped character', (text: string) => text.replace('"legal"', '"\\u006cegal"')],
    [
      'another key order',
      (text: string) => {
        const { prompt, ...rest } = JSON.parse(text) as Record<string, unknown>;
        return `${JSON.stringify({ prompt, ...rest }, null, 2)}\n`;
      },
    ],
    ['invalid JSON', (text: string) => text.slice(0, -3)],
  ])('refuses %s', (_name, change) => {
    const text = serializeApprovalRecord(record());

    expect(parseApprovalRecord(bytes(change(text)))).toBeUndefined();
  });

  it('refuses a byte that is not UTF-8', () => {
    const content = bytes(serializeApprovalRecord(record({ comment: 'aXb' })));
    content[content.indexOf(0x58)] = 0xff;

    expect(parseApprovalRecord(content)).toBeUndefined();
  });

  it('refuses well-formed bytes that fail the guard', () => {
    const text = serializeApprovalRecord(record({ role: 'Legal' }));

    expect(parseApprovalRecord(bytes(text))).toBeUndefined();
  });
});

describe('approvalRecordPath', () => {
  it('puts the record under its role and prompt id', () => {
    expect(approvalRecordPath(record())).toBe(
      `.promptscript/approvals/legal/acme-support/refund-reply/${HASH}.jane.json`
    );
  });

  it('lowercases the approver so one approver has one file', () => {
    const value = record({
      prompt: '@acme/support/refund-reply',
      role: 'security',
      approver: { source: 'asserted', value: '@Jane-Doe' },
    });

    expect(approvalRecordPath(value)).toBe(
      `.promptscript/approvals/security/@acme/support/refund-reply/${HASH}.jane-doe.json`
    );
  });

  it.each([
    ['@Jane.Doe', 'jane.doe'],
    ['@name_shortcode', 'name_shortcode'],
    ['@a-b-c', 'a-b-c'],
  ])('keeps the approver %s in the file name, never in a segment of its own', (value, slug) => {
    const path = approvalRecordPath(record({ approver: as(value) }));

    expect(path).toBe(
      `.promptscript/approvals/legal/acme-support/refund-reply/${HASH}.${slug}.json`
    );
    expect(path.split('/').filter((segment) => segment === '..' || segment === '.')).toEqual([]);
  });

  it('refuses a record that fails the guard instead of building a path', () => {
    const value = record({ role: '../../../tmp' });

    expect(() => approvalRecordPath(value)).toThrow(
      'Approval record is not a valid v1 record, so it has no safe path.'
    );
  });
});
