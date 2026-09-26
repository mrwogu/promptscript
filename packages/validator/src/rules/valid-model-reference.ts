import {
  getModelCatalog,
  isInModelSet,
  resolveModelSet,
  validateModelCatalog,
  type Block,
  type ModelCatalog,
  type ModelProfile,
  type ModelSet,
  type ModelsConfig,
  type SourceLocation,
  type Value,
} from '@promptscript/core';
import type { RuleContext, ValidationRule } from '../types.js';

interface ModelReference {
  /** Owner label used in messages, e.g. `Agent "reviewer"` */
  readonly owner: string;
  readonly field: string;
  readonly value: string;
  readonly location: SourceLocation;
}

// Fields that name a model, per block.
const MODEL_FIELDS: Readonly<Record<string, { label: string; fields: readonly string[] }>> = {
  agents: { label: 'Agent', fields: ['model', 'specModel'] },
  skills: { label: 'Skill', fields: ['model'] },
};

function blockEntries(block: Block): Array<[string, Record<string, Value>]> {
  if (block.content.type !== 'ObjectContent' && block.content.type !== 'MixedContent') return [];
  return Object.entries(block.content.properties).flatMap(([name, value]) =>
    value && typeof value === 'object' && !Array.isArray(value)
      ? [[name, value as Record<string, Value>] as [string, Record<string, Value>]]
      : []
  );
}

function collectReferences(ctx: RuleContext): ModelReference[] {
  const references: ModelReference[] = [];
  for (const block of ctx.ast.blocks) {
    const spec = Object.hasOwn(MODEL_FIELDS, block.name) ? MODEL_FIELDS[block.name] : undefined;
    if (!spec) continue;
    for (const [name, entry] of blockEntries(block)) {
      for (const field of spec.fields) {
        const value = entry[field];
        if (typeof value === 'string' && value.trim().length > 0) {
          references.push({
            owner: `${spec.label} "${name}"`,
            field,
            value: value.trim(),
            location: block.loc,
          });
        }
      }
    }
  }
  return references;
}

const PROFILES_HINT = 'or declare it under models.profiles in promptscript.yaml';
const MODELS_DOC_LINK = 'https://getpromptscript.dev/reference/models/';

/** `models.supported` as written, and resolved against the catalog */
interface SupportedModels {
  readonly entries: readonly string[];
  readonly set: ModelSet;
}

function readSupportedModels(
  config: ModelsConfig | undefined,
  catalog: ModelCatalog
): SupportedModels | undefined {
  if (!Array.isArray(config?.supported)) return undefined;
  const entries = config.supported.filter((entry): entry is string => typeof entry === 'string');
  return { entries, set: resolveModelSet(entries, catalog) };
}

function reportProfileIssues(ctx: RuleContext, catalog: ModelCatalog): void {
  for (const issue of validateModelCatalog(catalog.profiles)) {
    ctx.report({
      message: `models.profiles: ${issue}`,
      suggestion: 'Update the profile under models.profiles in promptscript.yaml.',
    });
  }
}

function reportLifecycle(
  ctx: RuleContext,
  label: string,
  location: SourceLocation,
  profile: ModelProfile,
  catalog: ModelCatalog
): void {
  if (profile.status !== 'retired' && profile.status !== 'deprecated') return;
  const replacement = catalog.getReplacement(profile.id);
  ctx.report({
    message: `${label} resolves to ${profile.displayName}, which is ${profile.status}`,
    location,
    suggestion: replacement
      ? `Switch to ${replacement.id} (${replacement.displayName}).`
      : 'Switch to a current model.',
  });
}

function checkReference(
  ctx: RuleContext,
  reference: ModelReference,
  catalog: ModelCatalog,
  supported: SupportedModels | undefined
): void {
  const label = `${reference.owner}: ${reference.field} "${reference.value}"`;
  const resolution = catalog.resolve(reference.value);
  if (!resolution) {
    if (supported) {
      ctx.report({
        message: `${label} is not in the model catalog`,
        location: reference.location,
        suggestion: `Use a model from models.supported, ${PROFILES_HINT}. See the model list: ${MODELS_DOC_LINK}`,
      });
    }
    return;
  }
  if (resolution.kind === 'inherit') return;

  reportLifecycle(ctx, label, reference.location, resolution.profile, catalog);
  if (supported && !isInModelSet(resolution, supported.set)) {
    ctx.report({
      message: `${label} is outside the supported model set`,
      location: reference.location,
      suggestion: `Use one of: ${supported.entries.join(', ')}; or add it to models.supported.`,
    });
  }
}

/**
 * PS041: Valid model references.
 *
 * Checks `model` and `specModel` in @agents and `model` in @skills against
 * the model catalog (built-in profiles plus `models.profiles`):
 * - retired and deprecated models, with the recommended replacement
 * - with `models.supported` set: unknown models and models outside the set
 *
 * Unknown models are only reported for projects that declare a model set,
 * because tools accept many provider-specific names the catalog lacks.
 * Projects with `models.profiles` also get the catalog consistency issues
 * their profiles cause, such as a profile named after a floating alias.
 */
export const validModelReference: ValidationRule = {
  id: 'PS041',
  name: 'valid-model-reference',
  description: 'Model references must name served models from the project model set',
  defaultSeverity: 'warning',
  validate: (ctx) => {
    const config = ctx.config.models;
    const catalog = getModelCatalog(config);
    const supported = readSupportedModels(config, catalog);

    // Built-in profiles are checked by tests, so only custom ones can add issues.
    if (config?.profiles !== undefined) reportProfileIssues(ctx, catalog);

    for (const entry of supported?.set.unknown ?? []) {
      ctx.report({
        message: `models.supported entry "${entry}" is not in the model catalog`,
        suggestion: `Use a catalog model id or alias, ${PROFILES_HINT}. See the model list: ${MODELS_DOC_LINK}`,
      });
    }
    for (const reference of collectReferences(ctx)) {
      checkReference(ctx, reference, catalog, supported);
    }
  },
};
