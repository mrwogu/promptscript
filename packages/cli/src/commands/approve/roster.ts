import { isPlainObject } from '@promptscript/core';
import type { ReleaseDiagnostic } from '../../utils/release-report.js';
import { escapeNonAscii, stripControlCharacters } from '../release/git.js';

// A user handle. A team (`@org/team`) or an email owner does not match.
const USER_HANDLE_RE = /^@[A-Za-z0-9][A-Za-z0-9_.-]*$/;

/**
 * The owners of the roles that list only user handles (approver handles are compared
 * case-insensitively). A role with any team or email owner is left out: a team cannot be resolved
 * offline, so nobody can say who is outside it.
 */
export function individualRosters(governance: unknown): Map<string, string[]> {
  const rosters = new Map<string, string[]>();
  const roles = isPlainObject(governance) ? governance['roles'] : undefined;
  if (!isPlainObject(roles)) return rosters;
  for (const [role, owners] of Object.entries(roles)) {
    if (!Array.isArray(owners) || owners.length === 0) continue;
    if (owners.every((owner) => typeof owner === 'string' && USER_HANDLE_RE.test(owner))) {
      rosters.set(role, owners as string[]);
    }
  }
  return rosters;
}

/**
 * A warning for an approver that is not in the roster of the role, or undefined. `where`
 * says what is judged; control characters are stripped. The record still counts.
 */
export function outsideRosterWarning(
  rosters: ReadonlyMap<string, readonly string[]>,
  role: string,
  approver: string,
  where: string,
  file?: string
): ReleaseDiagnostic | undefined {
  const roster = rosters.get(role);
  if (
    roster === undefined ||
    roster.some((owner) => owner.toLowerCase() === approver.toLowerCase())
  )
    return undefined;
  return {
    message: `${stripControlCharacters(where)}: ${escapeNonAscii(approver)} approved as ${escapeNonAscii(role)}, but is not in governance.roles.${escapeNonAscii(role)} (${roster.map(escapeNonAscii).join(', ')}). It still counts, since the approver is only asserted; check that CODEOWNERS made one of those owners review it.`,
    ...(file === undefined ? {} : { location: { file: stripControlCharacters(file) } }),
  };
}
