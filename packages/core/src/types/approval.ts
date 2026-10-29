import { ErrorCode, PSError } from '../errors/base.js';
import type { GovernanceRoleName, ReleaseEnvironmentName } from './config.js';

/** Schema URL of an approval record, version 1. */
export const APPROVAL_RECORD_SCHEMA_URL =
  'https://getpromptscript.dev/schema/approval-record/v1.json';

/** Who approved, as the record states it. */
export interface ApprovalApproverV1 {
  /** `asserted`: the identity is a claim, it binds through the review of the change that adds the record */
  source: 'asserted';
  /**
   * Git host user handle, at most 100 characters after the `@`.
   * @pattern ^@[A-Za-z0-9](?:[A-Za-z0-9]|[_.-](?=[A-Za-z0-9]))*$
   * @maxLength 101
   * @example "@jane"
   */
  value: string;
}

/**
 * Approval of one exact prompt version by one approver in one role, version 1.
 * Unsigned: the record is a claim until the change adding it is reviewed.
 */
export interface ApprovalRecordV1 {
  /**
   * Schema URL, the version tag of the record.
   * @example "https://getpromptscript.dev/schema/approval-record/v1.json"
   */
  $schema: 'https://getpromptscript.dev/schema/approval-record/v1.json';
  /**
   * Prompt id, `<@meta.id>/<key>`. No segment ends with a dot.
   * @pattern ^(?!.*\.\.)(?:@?[A-Za-z0-9][A-Za-z0-9_.-]{0,63}(?<!\.)/)+[A-Za-z0-9][A-Za-z0-9_-]{0,63}$
   * @example "acme-support/refund-reply"
   */
  prompt: string;
  /**
   * Content hash of the approved bundle.
   * @pattern ^sha256-[0-9a-f]{64}$
   */
  contentHash: string;
  /** Approval role from `governance.roles` */
  role: GovernanceRoleName;
  /** Who approved */
  approver: ApprovalApproverV1;
  /**
   * Creation time, self-asserted and never used to decide.
   * @pattern ^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$
   * @example "2026-10-22T09:14:03.120Z"
   */
  createdAt: string;
  /** The only environment the approval counts for. Absent means every environment. */
  environment?: ReleaseEnvironmentName;
  /**
   * Note of the approver, without control characters except newline and
   * without lone surrogates.
   * @maxLength 2000
   * @pattern ^(?:[^\p{Cc}\p{Cs}]|\n){0,2000}$
   */
  comment?: string;
  /** Signature format, see `signature`. Reserved, not written or read in this version. */
  signatureType?: 'ssh';
  /**
   * Armored SSH signature over the UTF-8 bytes of the RFC 8785 canonical JSON
   * (`canonicalizeJson`) of the record without `signature`; `signatureType` is
   * included. The signing namespace is `promptscript-approval-<role>`.
   * Reserved, not written or read in this version.
   * @maxLength 8192
   * @pattern ^-----BEGIN SSH SIGNATURE-----\n[A-Za-z0-9+/=\n]{1,8192}-----END SSH SIGNATURE-----\n?$
   */
  signature?: string;
}

/**
 * A Git host user handle: `@`, a letter or digit, then letters, digits, `_`, `.` or `-`,
 * with no two of `_.-` in a row and none at the end. GitLab users may hold `.` and `_`,
 * and GitHub managed users end in `_<shortcode>`. Hosts never issue other handles, and
 * CODEOWNERS ignores an invalid user, so it would drop the rule's protection silently.
 * Governance owners and approvers share this rule. Each character matches one branch
 * and the lookahead reads one character, so the match stays linear.
 */
export const GIT_HOST_USER_PATTERN = /^@[A-Za-z0-9](?:[A-Za-z0-9]|[_.-](?=[A-Za-z0-9]))*$/;

/**
 * Longest approver handle, `@` included. The handle is part of the record file name,
 * so it stays far below the 255 byte limit of a file name.
 */
export const MAX_APPROVER_LENGTH = 101;

/** An approver handle: a {@link GIT_HOST_USER_PATTERN} user of at most {@link MAX_APPROVER_LENGTH} characters. */
export function isApproverHandle(value: string): boolean {
  return value.length <= MAX_APPROVER_LENGTH && GIT_HOST_USER_PATTERN.test(value);
}

// Same patterns as the schema JSDoc; the schema spec checks that both agree.
const PROMPT_ID =
  /^(?!.*\.\.)(?:@?[A-Za-z0-9][A-Za-z0-9_.-]{0,63}(?<!\.)\/)+[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/u;
const CONTENT_HASH = /^sha256-[0-9a-f]{64}$/u;
const ROLE = /^(?!(?:con|prn|aux|nul|com\d|lpt\d)$)[a-z][a-z0-9-]{0,31}$/u;
const CREATED_AT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u;
const ENVIRONMENT = /^[a-z][a-z0-9-]{0,31}$/u;
const COMMENT = /^(?:[^\p{Cc}\p{Cs}]|\n){0,2000}$/u;
const SIGNATURE =
  /^-----BEGIN SSH SIGNATURE-----\n[A-Za-z0-9+/=\n]{1,8192}-----END SSH SIGNATURE-----\n?$/u;

const RECORD_KEYS: ReadonlySet<string> = new Set([
  '$schema',
  'prompt',
  'contentHash',
  'role',
  'approver',
  'createdAt',
  'environment',
  'comment',
  'signatureType',
  'signature',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function matches(value: unknown, pattern: RegExp): boolean {
  return typeof value === 'string' && pattern.test(value);
}

function isApprover(value: unknown): boolean {
  return (
    isRecord(value) &&
    Object.keys(value).every((key) => key === 'source' || key === 'value') &&
    value['source'] === 'asserted' &&
    typeof value['value'] === 'string' &&
    isApproverHandle(value['value'])
  );
}

/**
 * Type guard for an approval record: exact keys, every field pattern of the schema.
 * Use {@link parseApprovalRecord} on file content, it also checks the exact bytes.
 */
export function isApprovalRecordV1(value: unknown): value is ApprovalRecordV1 {
  if (!isRecord(value) || !Object.keys(value).every((key) => RECORD_KEYS.has(key))) return false;
  const optional = (key: string, pattern: RegExp): boolean =>
    !Object.hasOwn(value, key) || matches(value[key], pattern);
  return (
    value['$schema'] === APPROVAL_RECORD_SCHEMA_URL &&
    matches(value['prompt'], PROMPT_ID) &&
    matches(value['contentHash'], CONTENT_HASH) &&
    matches(value['role'], ROLE) &&
    isApprover(value['approver']) &&
    matches(value['createdAt'], CREATED_AT) &&
    optional('environment', ENVIRONMENT) &&
    optional('comment', COMMENT) &&
    (!Object.hasOwn(value, 'signatureType') || value['signatureType'] === 'ssh') &&
    optional('signature', SIGNATURE)
  );
}

/**
 * The exact bytes of an approval record file: fixed key order, two-space indent,
 * one trailing newline.
 */
export function serializeApprovalRecord(record: ApprovalRecordV1): string {
  const ordered = {
    $schema: record.$schema,
    prompt: record.prompt,
    contentHash: record.contentHash,
    role: record.role,
    approver: { source: record.approver.source, value: record.approver.value },
    createdAt: record.createdAt,
    environment: record.environment,
    comment: record.comment,
    signatureType: record.signatureType,
    signature: record.signature,
  };
  return `${JSON.stringify(ordered, null, 2)}\n`;
}

/**
 * Read an approval record file. The bytes must be valid UTF-8, pass
 * {@link isApprovalRecordV1} and equal the UTF-8 bytes of
 * {@link serializeApprovalRecord} of the record, so a record with other key
 * order, escapes, line endings or a byte order mark is refused.
 *
 * @param content - File content as read from disk
 * @returns The record, or undefined when the content is no valid record
 */
export function parseApprovalRecord(content: Uint8Array): ApprovalRecordV1 | undefined {
  let value: unknown;
  try {
    value = JSON.parse(new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(content));
  } catch {
    return undefined;
  }
  if (!isApprovalRecordV1(value)) return undefined;
  const expected = new TextEncoder().encode(serializeApprovalRecord(value));
  return expected.length === content.length && expected.every((byte, i) => byte === content[i])
    ? value
    : undefined;
}

/**
 * Path of an approval record relative to the project root, with `/` separators:
 * `.promptscript/approvals/<role>/<prompt id>/<contentHash>.<approver slug>.json`.
 * The slug is the approver handle without its `@`, lowercased, so one approver
 * has one file per role and hash on every file system. It holds no `/` and always
 * follows `<contentHash>.`, so a `.` in a handle never makes a `.` or `..` segment.
 * @throws PSError when the record fails {@link isApprovalRecordV1}, since its
 * fields would not make a safe path.
 */
export function approvalRecordPath(record: ApprovalRecordV1): string {
  if (!isApprovalRecordV1(record)) {
    throw new PSError(
      'Approval record is not a valid v1 record, so it has no safe path. ' +
        'Check it with isApprovalRecordV1 before building a path.',
      ErrorCode.INVALID_VALUE
    );
  }
  const slug = record.approver.value.slice(1).toLowerCase();
  return `.promptscript/approvals/${record.role}/${record.prompt}/${record.contentHash}.${slug}.json`;
}
