import {
  getModelCatalog,
  RISK_LEVELS,
  validateGovernanceFields,
  type RiskLevel,
  type Value,
} from '@promptscript/core';
import type { RuleContext, ValidationRule } from '../types.js';
import { getPromptExtraction, hasPromptEntries } from './prompt-rule-utils.js';

const ID_SEGMENT = /^@?[A-Za-z0-9][A-Za-z0-9_.-]{0,63}$/;

function idProblem(id: string): string | undefined {
  if (id.includes('..')) return 'must not contain ".."';
  if (id.startsWith('/') || id.endsWith('/')) return 'must not start or end with "/"';
  const segment = id.split('/').find((part) => !ID_SEGMENT.test(part));
  return segment === undefined
    ? undefined
    : `has the segment "${segment}", which must match ${ID_SEGMENT.source}`;
}

function metaRisk(value: Value | undefined): RiskLevel | undefined {
  return (RISK_LEVELS as readonly unknown[]).includes(value) ? (value as RiskLevel) : undefined;
}

function checkMeta(ctx: RuleContext): void {
  const meta = ctx.ast.meta;
  if (!meta) return;
  for (const message of validateGovernanceFields(meta.fields)) {
    ctx.report({
      message,
      location: meta.loc,
      suggestion: 'Fix the governance default in @meta, prompts inherit it.',
    });
  }
  const id = meta.fields['id'];
  if (typeof id !== 'string') return;
  const problem = idProblem(id);
  if (problem) {
    ctx.report({
      message: `@meta id "${id}" ${problem}, but the prompts in this file build their ids from it`,
      location: meta.loc,
      suggestion: 'Use letters, digits, ".", "_" and "-", with "/" between segments.',
    });
  }
}

function checkFloatingModels(ctx: RuleContext): void {
  const catalog = getModelCatalog(ctx.config.models);
  const defaultRisk = metaRisk(ctx.ast.meta?.fields['risk']);
  for (const prompt of getPromptExtraction(ctx).prompts) {
    const ref = prompt.model?.ref;
    const resolution = ref === undefined ? undefined : catalog.resolve(ref);
    if (resolution?.kind !== 'floating') continue;
    const risk = prompt.governance.risk ?? defaultRisk;
    const strict = risk === 'high' || risk === 'critical';
    ctx.report({
      message:
        `Prompt "${prompt.name}": model.ref "${ref}" is a floating alias, so the served model can ` +
        `change without a change to the prompt` +
        (strict ? ` (risk is ${risk})` : ''),
      location: prompt.loc,
      severity: strict ? 'error' : 'warning',
      suggestion: `Pin a release, for example "${resolution.profile.id}".`,
    });
  }
}

/**
 * PS042: Valid prompt definitions.
 *
 * Checks every `@prompts` entry: key, description, messages, `compose`,
 * `model` and its parameters, `inputs`, `output` and governance values.
 * Also checks governance defaults in `@meta`, the shape of `@meta.id` when
 * prompts exist, and floating model aliases (an error at high or critical risk).
 */
export const validPromptDefinition: ValidationRule = {
  id: 'PS042',
  name: 'valid-prompt-definition',
  description: 'Validate @prompts entries, their contracts and governance values',
  defaultSeverity: 'error',
  validate: (ctx) => {
    const extraction = getPromptExtraction(ctx);
    if (!hasPromptEntries(extraction)) return;

    for (const issue of extraction.issues) {
      ctx.report({
        message: issue.message,
        location: issue.loc,
        suggestion: issue.suggestion,
      });
    }
    checkMeta(ctx);
    checkFloatingModels(ctx);
  },
};
