import {
  ErrorCode,
  PSError,
  compareVersions,
  extractPromptDefinitions,
  getModelCatalog,
  hashPromptBundle,
  normalizeProvenanceFiles,
  readMetaGovernance,
  type GovernanceMeta,
  type ModelParams,
  type Program,
  type PromptBundleInput,
  type PromptBundleModel,
  type PromptBundleOutput,
  type PromptBundleOutputProperty,
  type PromptBundleSegment,
  type PromptBundleV1,
  type PromptDefinition,
  type PromptOutputField,
  type PromptScalarType,
  type ProvenanceTrace,
  type SourceLocation,
} from '@promptscript/core';
import type { FormatOptions } from '../types.js';
import { composeSystemMessage, normalizeNewlines } from './compose.js';

/** Schema URL of a bundle. It is the version tag and is part of the hash. */
export const PROMPT_BUNDLE_SCHEMA = 'https://getpromptscript.dev/schema/prompt-bundle/v1.json';

/** Schema URL of a bundle index. */
export const PROMPT_BUNDLE_INDEX_SCHEMA =
  'https://getpromptscript.dev/schema/prompt-bundle-index/v1.json';

/** First syntax version that allows prompt definitions. */
export const PROMPT_SYNTAX_VERSION = '1.6.0';

/** A bundle built from one prompt, with what the formatters need besides the bundle. */
export interface BuiltPrompt {
  /** Prompt key, the base name of its files */
  key: string;
  /** The finished bundle */
  bundle: PromptBundleV1;
  /** Location of the entry */
  loc: SourceLocation;
}

/** Everything the prompt formatters need from one program. */
export interface BuiltPrompts {
  /** Bundles in authored order */
  prompts: BuiltPrompt[];
  /** Entry file of the compilation, safe to write into an artifact */
  source: string;
}

/** Raised when a program cannot become bundles. */
export class PromptFormatError extends PSError {
  constructor(message: string, location?: SourceLocation) {
    super(message, ErrorCode.INVALID_VALUE, location ? { location } : undefined);
    this.name = 'PromptFormatError';
  }
}

function byCodeUnits(a: string, b: string): number {
  return Number(a > b) - Number(a < b);
}

function sortedUnique(values: readonly string[]): string[] {
  return [...new Set(values)].sort(byCodeUnits);
}

function deepNormalize<T>(value: T): T {
  if (typeof value === 'string') return normalizeNewlines(value) as T;
  if (Array.isArray(value)) return value.map((item: unknown) => deepNormalize(item)) as T;
  if (typeof value === 'object' && value !== null) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, deepNormalize(item)])
    ) as T;
  }
  return value;
}

/**
 * Refuse a program below syntax 1.6.0 that authors prompts.
 * A program without a readable `syntax` is accepted: the default is the current version.
 */
function assertSyntax(program: Program, target: string): void {
  const declared = program.meta?.fields['syntax'];
  if (typeof declared !== 'string' || !/^\d+\.\d+\.\d+$/.test(declared)) return;
  if (compareVersions(declared, PROMPT_SYNTAX_VERSION) >= 0) return;
  throw new PromptFormatError(
    `The ${target} target needs syntax ${PROMPT_SYNTAX_VERSION}, but the resolved program declares "${declared}". ` +
      `Set syntax: "${PROMPT_SYNTAX_VERSION}" in @meta, or run "prs validate --fix".`,
    program.meta?.loc
  );
}

function metaId(program: Program): string {
  const id = program.meta?.fields['id'];
  if (typeof id !== 'string' || id.length === 0) {
    throw new PromptFormatError(
      'Prompts need an id in @meta, because a prompt id is "<@meta.id>/<key>". Add id: "my-project" to @meta.',
      program.meta?.loc
    );
  }
  return id;
}

/** Governance of a prompt: its own value, else the `@meta` default. */
export function effectiveGovernance(
  entry: GovernanceMeta,
  defaults: GovernanceMeta
): GovernanceMeta {
  const dataClasses = sortedUnique([...(defaults.dataClasses ?? []), ...(entry.dataClasses ?? [])]);
  const reviewers = sortedUnique(entry.reviewers ?? defaults.reviewers ?? []);
  const risk = entry.risk ?? defaults.risk;
  const owner = entry.owner ?? defaults.owner;
  const domain = entry.domain ?? defaults.domain;
  return {
    ...(risk !== undefined ? { risk } : {}),
    ...(owner !== undefined ? { owner } : {}),
    ...(domain !== undefined ? { domain } : {}),
    ...(dataClasses.length > 0 ? { dataClasses } : {}),
    ...(reviewers.length > 0 ? { reviewers } : {}),
  };
}

function buildInputs(prompt: PromptDefinition): Record<string, PromptBundleInput> {
  const inputs: Record<string, PromptBundleInput> = {};
  for (const [name, input] of Object.entries(prompt.inputs)) {
    const fallback = input.default;
    const hasDefault =
      typeof fallback === 'string' || typeof fallback === 'number' || typeof fallback === 'boolean';
    inputs[name] = {
      type: input.type,
      description: input.description,
      ...(input.options ? { options: [...input.options] } : {}),
      ...(hasDefault ? { default: fallback } : {}),
      required: !hasDefault,
    };
  }
  return inputs;
}

type ItemType = 'string' | 'number' | 'boolean';

function jsonType(type: PromptScalarType): ItemType {
  return type === 'enum' ? 'string' : type;
}

function buildProperty(field: PromptOutputField): PromptBundleOutputProperty {
  const description = { description: field.description };
  if (field.type === 'list') {
    const items = field.items ?? { type: 'string' as const };
    return {
      type: 'array',
      ...description,
      items: {
        type: jsonType(items.type),
        ...(items.options ? { enum: [...items.options] } : {}),
      },
    };
  }
  return {
    type: field.type === 'enum' ? 'string' : field.type,
    ...description,
    ...(field.options ? { enum: [...field.options] } : {}),
  };
}

function buildOutput(prompt: PromptDefinition): PromptBundleOutput | undefined {
  if (!prompt.output) return undefined;
  const fields = Object.entries(prompt.output.fields);
  return {
    type: 'object',
    properties: Object.fromEntries(fields.map(([name, field]) => [name, buildProperty(field)])),
    required: fields.map(([name]) => name).sort(byCodeUnits),
    additionalProperties: false,
  };
}

function buildModel(
  prompt: PromptDefinition,
  options: FormatOptions | undefined
): PromptBundleModel | undefined {
  if (!prompt.model) return undefined;
  const { ref, params } = prompt.model;
  const resolution = getModelCatalog(options?.models).resolve(ref);
  if (!resolution || resolution.kind === 'inherit') {
    throw new PromptFormatError(
      `Prompt "${prompt.name}": model "${ref}" is not in the model catalog, so the bundle cannot name the model it runs on. ` +
        'Use a catalog model or declare it under models.profiles in promptscript.yaml.',
      prompt.loc
    );
  }
  const { profile } = resolution;
  const ordered: ModelParams = {};
  for (const key of ['temperature', 'topP', 'topK', 'maxTokens', 'stop', 'seed'] as const) {
    const value = params[key];
    if (value !== undefined) Object.assign(ordered, { [key]: value });
  }
  return {
    ref,
    profile: profile.id,
    provider: profile.provider,
    apiId: profile.apiId,
    params: ordered,
  };
}

function isUnder(path: string, prefix: string): boolean {
  return path === prefix || path.startsWith(`${prefix}.`) || path.startsWith(`${prefix}[`);
}

/** Distinct files that contributed to a block path or its children, in trace order. */
function filesOf(trace: ProvenanceTrace | undefined, path: string): string[] {
  const files: string[] = [];
  for (const entry of trace?.entries ?? []) {
    if (!isUnder(entry.path, path)) continue;
    files.push(entry.source.file);
    for (const step of entry.history) {
      if (['declaration', 'extend', 'override'].includes(step.operation)) {
        files.push(step.source.file);
      }
    }
  }
  return [...new Set(files)];
}

function fallbackSource(program: Program): string {
  const file = program.loc?.file;
  return file ? normalizeProvenanceFiles(syntheticTrace(file), undefined).entry : 'unknown';
}

function syntheticTrace(file: string): ProvenanceTrace {
  return { version: 1, entry: file, entries: [] };
}

function buildSegments(
  prompt: PromptDefinition,
  blocks: readonly string[],
  hasOwnSystem: boolean,
  trace: ProvenanceTrace | undefined
): PromptBundleSegment[] {
  const segment = (message: 'system' | 'user', path: string): PromptBundleSegment => ({
    message,
    path,
    files: filesOf(trace, path),
  });
  return [
    ...blocks.map((block) => segment('system', block)),
    ...(hasOwnSystem ? [segment('system', `prompts.${prompt.name}.system`)] : []),
    ...(prompt.user !== undefined ? [segment('user', `prompts.${prompt.name}.user`)] : []),
  ];
}

function buildBundle(
  program: Program,
  prompt: PromptDefinition,
  options: FormatOptions | undefined,
  trace: ProvenanceTrace | undefined,
  source: string
): PromptBundleV1 {
  const composed = composeSystemMessage(program, prompt);
  const messages: PromptBundleV1['messages'] = [
    ...(composed.text !== undefined ? [{ role: 'system' as const, content: composed.text }] : []),
    ...(prompt.user !== undefined ? [{ role: 'user' as const, content: prompt.user }] : []),
  ];
  if (messages.length === 0) {
    throw new PromptFormatError(
      `Prompt "${prompt.name}" has no message: add system or user text, or compose a block that has content.`,
      prompt.loc
    );
  }
  const output = buildOutput(prompt);
  const model = buildModel(prompt, options);
  const defaults = readMetaGovernance(program.meta?.fields ?? {});
  const withoutHash: Omit<PromptBundleV1, 'contentHash'> = deepNormalize({
    $schema: PROMPT_BUNDLE_SCHEMA,
    id: `${metaId(program)}/${prompt.name}`,
    description: prompt.description,
    messages,
    inputs: buildInputs(prompt),
    ...(output ? { output } : {}),
    ...(model ? { model } : {}),
    governance: effectiveGovernance(prompt.governance, defaults),
    provenance: {
      entry: source,
      segments: buildSegments(
        prompt,
        composed.blocks.map((segment) => segment.block),
        composed.hasOwnText,
        trace
      ),
    },
  });
  const { $schema, id, description, messages: finalMessages, ...rest } = withoutHash;
  return {
    $schema,
    id,
    description,
    contentHash: hashPromptBundle(withoutHash),
    messages: finalMessages,
    ...rest,
  };
}

/**
 * Build the bundles of every prompt in a resolved program.
 *
 * @param program - The resolved program
 * @param options - Format options; `provenance` supplies the source files of each segment
 * @param target - Target name, used in diagnostics
 * @returns One bundle per prompt, in authored order, or none when the program has no prompts
 * @throws {PromptFormatError} when the syntax is below 1.6.0 or an entry or model is invalid
 */
export function buildPromptBundles(
  program: Program,
  options: FormatOptions | undefined,
  target: string
): BuiltPrompts {
  const { prompts, issues } = extractPromptDefinitions(program);
  const first = issues[0];
  if (first) {
    const more = issues.length > 1 ? ` (${issues.length - 1} more problems in @prompts)` : '';
    throw new PromptFormatError(`${first.message}. ${first.suggestion}${more}`, first.loc);
  }
  if (prompts.length === 0) return { prompts: [], source: '' };
  assertSyntax(program, target);

  const trace = options?.provenance
    ? normalizeProvenanceFiles(options.provenance, undefined)
    : undefined;
  const source = trace?.entry ?? fallbackSource(program);
  return {
    prompts: prompts.map((prompt) => ({
      key: prompt.name,
      bundle: buildBundle(program, prompt, options, trace, source),
      loc: prompt.loc,
    })),
    source,
  };
}

/** Serialize a bundle or an index the way every prompt file is written. */
export function toJsonFile(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}
