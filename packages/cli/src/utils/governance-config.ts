import { findClosestMatch, isPlainObject } from '@promptscript/core';
import { isGitHostIdentity } from '@promptscript/validator';

/** At most this many approval roles, so a CODEOWNERS file stays readable. */
export const MAX_GOVERNANCE_ROLES = 32;

/** Paths prs can manage a CODEOWNERS file at, relative to the repository root. */
export const CODEOWNERS_LOCATIONS = [
  '.github/CODEOWNERS',
  'CODEOWNERS',
  'docs/CODEOWNERS',
  '.gitlab/CODEOWNERS',
] as const;

// Role names become directory names, so Windows device names are refused.
const ROLE_RE = /^(?!(?:con|prn|aux|nul|com\d|lpt\d)$)[a-z][a-z0-9-]{0,31}$/;
const GOVERNANCE_KEYS = ['admins', 'roles', 'dataClasses', 'codeowners'];
const CODEOWNERS_KEYS = ['output', 'protect', 'prompts'];
const IDENTITY_FIX = 'Use a user (@jane), a team (@acme/legal) or an email address.';

function unknownKeys(value: Record<string, unknown>, allowed: string[], where: string): string[] {
  return Object.keys(value)
    .filter((key) => !allowed.includes(key))
    .map((key) => {
      const close = findClosestMatch(key, allowed);
      const hint = close ? `Did you mean "${close.match}"?` : `Use: ${allowed.join(', ')}.`;
      return `${where} has an unknown key "${key}". ${hint}`;
    });
}

/** Problems of an owner list: not a list, empty, a value that is no Git host identity, a duplicate. */
function ownerProblems(value: unknown, where: string): string[] {
  if (!Array.isArray(value) || value.length === 0) {
    return [`${where} must be a non-empty list of owners. ${IDENTITY_FIX}`];
  }
  const problems: string[] = [];
  const seen = new Set<string>();
  for (const owner of value) {
    if (typeof owner !== 'string' || !isGitHostIdentity(owner)) {
      problems.push(
        `${where} has ${JSON.stringify(owner)}, which is not a Git host identity. ${IDENTITY_FIX}`
      );
    } else if (seen.has(owner)) {
      problems.push(`${where} lists "${owner}" twice. Remove one.`);
    }
    if (typeof owner === 'string') seen.add(owner);
  }
  return problems;
}

function roleProblems(roles: unknown): string[] {
  if (!isPlainObject(roles)) {
    return ['governance.roles must map role names to owner lists, like legal: ["@acme/legal"].'];
  }
  const names = Object.keys(roles);
  const problems: string[] = [];
  if (names.length > MAX_GOVERNANCE_ROLES) {
    problems.push(
      `governance.roles has ${names.length} roles, at most ${MAX_GOVERNANCE_ROLES} are allowed. Merge roles that the same teams review.`
    );
  }
  for (const name of names) {
    if (!ROLE_RE.test(name)) {
      problems.push(
        `governance.roles has the role ${JSON.stringify(name)}. Use lowercase letters, digits and "-", starting with a letter, at most 32 characters, and no Windows device name.`
      );
      continue;
    }
    problems.push(...ownerProblems(roles[name], `governance.roles.${name}`));
  }
  return problems;
}

function codeownersProblems(codeowners: unknown): string[] {
  if (!isPlainObject(codeowners)) {
    return ['governance.codeowners must be a mapping with output, protect or prompts.'];
  }
  const problems = unknownKeys(codeowners, CODEOWNERS_KEYS, 'governance.codeowners');
  const { output, protect, prompts } = codeowners;
  if (output !== undefined && !(CODEOWNERS_LOCATIONS as readonly unknown[]).includes(output)) {
    problems.push(
      `governance.codeowners.output is ${JSON.stringify(output)}. Use one of: ${CODEOWNERS_LOCATIONS.join(', ')}.`
    );
  }
  if (
    protect !== undefined &&
    (!Array.isArray(protect) || !protect.every((path) => typeof path === 'string' && path !== ''))
  ) {
    problems.push(
      'governance.codeowners.protect must be a list of paths, like [.github/workflows].'
    );
  }
  if (prompts !== undefined && typeof prompts !== 'boolean') {
    problems.push('governance.codeowners.prompts must be true or false.');
  }
  return problems;
}

/**
 * Check the `governance` section of promptscript.yaml. The loader does not validate the
 * config against its schema, so each governance command calls this first. Only own keys
 * of plain objects count, so a `__proto__` key is an unknown key. Missing keys are not
 * problems here; a command that needs admins or roles checks that itself.
 *
 * @param governance - The `governance` value of the effective config
 * @returns One message per problem, each with its fix; empty when the section is valid
 */
export function checkGovernanceConfig(governance: unknown): string[] {
  if (governance === undefined) return [];
  if (!isPlainObject(governance)) {
    return ['governance must be a mapping with admins, roles, dataClasses or codeowners.'];
  }
  const problems = unknownKeys(governance, GOVERNANCE_KEYS, 'governance');
  const { admins, roles, dataClasses, codeowners } = governance;
  if (admins !== undefined) problems.push(...ownerProblems(admins, 'governance.admins'));
  if (roles !== undefined) problems.push(...roleProblems(roles));
  if (
    dataClasses !== undefined &&
    (!Array.isArray(dataClasses) || !dataClasses.every((item) => typeof item === 'string'))
  ) {
    problems.push('governance.dataClasses must be a list of names, like [pii, financial].');
  }
  if (codeowners !== undefined) problems.push(...codeownersProblems(codeowners));
  return problems;
}
