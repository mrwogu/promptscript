import {
  findClosestMatch,
  GIT_HOST_USER_PATTERN,
  readMetaGovernance,
  type GovernanceMeta,
  type SourceLocation,
} from '@promptscript/core';
import { dataClassVocabulary } from '../policy/parser.js';
import type { RuleContext, ValidationRule } from '../types.js';
import { getPromptExtraction, hasPromptEntries } from './prompt-rule-utils.js';

const TEAM = /^@[A-Za-z0-9][\w.-]*(?:\/[A-Za-z0-9][\w.-]*)+$/;
const EMAIL_LOCAL = /^[\w.%+-]+$/;
const EMAIL_HOST = /^[A-Za-z0-9.-]+$/;
const EMAIL_TLD = /^[A-Za-z]{2,}$/;
const MAX_IDENTITY_LENGTH = 254;

// Same as [A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}, split at the only "@"
// and the last "." so no pattern can backtrack.
function isEmail(value: string): boolean {
  const at = value.indexOf('@');
  if (at < 0 || at !== value.lastIndexOf('@')) return false;
  const local = value.slice(0, at);
  const domain = value.slice(at + 1);
  const dot = domain.lastIndexOf('.');
  return (
    EMAIL_LOCAL.test(local) &&
    dot > 0 &&
    EMAIL_HOST.test(domain.slice(0, dot)) &&
    EMAIL_TLD.test(domain.slice(dot + 1))
  );
}

/**
 * A user (`@jane`), a team (`@acme/legal`, GitLab subgroups allowed) or an email
 * address of at most 254 characters, the owner forms CODEOWNERS takes.
 */
export function isGitHostIdentity(value: string): boolean {
  return (
    value.length <= MAX_IDENTITY_LENGTH &&
    (GIT_HOST_USER_PATTERN.test(value) || TEAM.test(value) || isEmail(value))
  );
}

function checkValues(
  ctx: RuleContext,
  where: string,
  governance: GovernanceMeta,
  location: SourceLocation | undefined,
  known: string[] | undefined
): void {
  const people = [
    ...(governance.owner === undefined ? [] : [{ key: 'owner', value: governance.owner }]),
    ...(governance.reviewers ?? []).map((value) => ({ key: 'reviewer', value })),
  ];
  for (const { key, value } of people) {
    if (isGitHostIdentity(value)) continue;
    ctx.report({
      message: `${where}: ${key} "${value}" is not a Git host identity`,
      location,
      suggestion: 'Use a user (@jane), a team (@acme/legal) or an email address.',
    });
  }
  if (known === undefined) return;
  for (const dataClass of governance.dataClasses ?? []) {
    const lower = dataClass.toLowerCase();
    if (known.includes(lower)) continue;
    const close = findClosestMatch(lower, known);
    ctx.report({
      message: `${where}: data class "${dataClass}" is not in governance.dataClasses`,
      location,
      suggestion: close
        ? `Did you mean "${close.match}"? Otherwise add it to governance.dataClasses.`
        : 'Use a data class from governance.dataClasses or add it there.',
    });
  }
}

/**
 * PS047: Governance values.
 *
 * Runs only when promptscript.yaml has a `governance` section and the program
 * has `@prompts` entries. Warns on owners and reviewers that are not a Git host
 * identity, and, when `governance.dataClasses` is set, on data classes outside
 * it. Data classes compare lowercased. Checks the values authored on each entry
 * and in `@meta`.
 */
export const governanceValues: ValidationRule = {
  id: 'PS047',
  name: 'governance-values',
  description: 'Prompt owners, reviewers and data classes must match the governance config',
  defaultSeverity: 'warning',
  validate: (ctx) => {
    const governance: unknown = ctx.config.governance;
    if (typeof governance !== 'object' || governance === null || Array.isArray(governance)) return;
    const extraction = getPromptExtraction(ctx);
    if (!hasPromptEntries(extraction)) return;

    const known = dataClassVocabulary(governance);
    const meta = ctx.ast.meta;
    if (meta) checkValues(ctx, '@meta', readMetaGovernance(meta.fields), meta.loc, known);
    for (const prompt of extraction.prompts) {
      checkValues(ctx, `Prompt "${prompt.name}"`, prompt.governance, prompt.loc, known);
    }
  },
};
