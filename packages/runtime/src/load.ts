import { PromptLoadError, PromptRenderError } from './errors.js';
import { compareCodeUnits } from './internal/canonical-json.js';
import { hashPromptBundle, PROMPT_BUNDLE_SCHEMA_URL } from './internal/prompt-bundle-hash.js';
import { findRuntimeSlots } from './internal/runtime-slots.js';
import type {
  Prompt,
  PromptGovernance,
  PromptInputSpec,
  PromptMeta,
  PromptModel,
  PromptModelParams,
  PromptOutputSchema,
  RenderedPrompt,
  RenderWarning,
} from './types.js';

type Json = Record<string, unknown>;
type Part = string | { readonly name: string };

/** A bundle that passed every load check, with the messages split at their slots. */
export interface VerifiedBundle {
  readonly id: string;
  readonly contentHash: string;
  readonly description: string;
  readonly inputs: Readonly<Record<string, PromptInputSpec>>;
  readonly output?: PromptOutputSchema;
  readonly model?: PromptModel;
  readonly governance: PromptGovernance;
  readonly messages: readonly { readonly role: 'system' | 'user'; readonly parts: Part[] }[];
  /** Declared input names in UTF-16 code-unit order */
  readonly names: readonly string[];
  /** Slots that name no declared input */
  readonly undeclared: readonly string[];
  readonly warnings: readonly RenderWarning[];
}

export const HASH_PATTERN = /^sha256-[\da-f]{64}$/;
const ID_SEGMENT = /^[A-Za-z\d][\w-]{0,63}$/;
const INPUT_NAME = /^[A-Za-z_]\w*$/;
// The names the bundle schema refuses for inputs and output properties
const UNSAFE_NAMES = new Set([
  '__defineGetter__',
  '__defineSetter__',
  '__lookupGetter__',
  '__lookupSetter__',
  '__proto__',
  'constructor',
  'hasOwnProperty',
  'isPrototypeOf',
  'propertyIsEnumerable',
  'prototype',
  'toLocaleString',
  'toString',
  'valueOf',
]);
const SCALARS = new Set(['string', 'number', 'boolean']);
const PROPERTY_TYPES = new Set([...SCALARS, 'array']);
const RISKS = new Set(['low', 'medium', 'high', 'critical']);
const MAX_EXTRA_NAMES = 10;
const MAX_NAME_LENGTH = 64;

export const isObject = (value: unknown): value is Json =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const isString = (value: unknown): value is string => typeof value === 'string';
/** A prompt id: a path with a slash, whose last segment is a plain name. */
export const isPromptId = (value: unknown): value is string =>
  isString(value) &&
  value.includes('/') &&
  ID_SEGMENT.test(value.slice(value.lastIndexOf('/') + 1));
const isNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);
const isStrings = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every(isString);
const isInteger = (value: unknown, min: number): value is number =>
  Number.isSafeInteger(value) && (value as number) >= min;
const isName = (name: string): boolean => INPUT_NAME.test(name) && !UNSAFE_NAMES.has(name);
const optional = (value: unknown, check: (v: unknown) => boolean): boolean =>
  value === undefined || check(value);
const read = (object: Json, key: string): unknown =>
  Object.hasOwn(object, key) ? object[key] : undefined;

function deepFreeze<T>(value: T): T {
  if (typeof value === 'object' && value !== null && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const member of Object.values(value)) deepFreeze(member);
  }
  return value;
}

/** Thrown inside the structure check, turned into `invalid-bundle` with the file named. */
class Invalid extends Error {
  constructor(readonly field: string) {
    super(field);
  }
}

function need(ok: boolean, field: string): void {
  if (!ok) throw new Invalid(field);
}

function checkInput(name: string, spec: unknown): PromptInputSpec {
  // A bad name is not repeated: it can hold anything, control characters included
  need(isName(name), 'inputs (a name)');
  const field = `inputs.${name}`;
  need(isObject(spec), field);
  const s = spec as Json;
  const type = read(s, 'type');
  const description = read(s, 'description');
  const options = read(s, 'options');
  const value = read(s, 'default');
  const required = read(s, 'required');
  need(type === 'enum' || SCALARS.has(type as string), `${field}.type`);
  need(isString(description), `${field}.description`);
  if (type === 'enum') {
    need(isStrings(options) && options.length > 0, `${field}.options`);
    need(new Set(options as string[]).size === (options as string[]).length, `${field}.options`);
  } else {
    need(options === undefined, `${field}.options`);
  }
  const valid =
    type === 'enum'
      ? isString(value) && (options as string[]).includes(value)
      : typeof value === type && (type !== 'number' || isNumber(value));
  need(value === undefined || valid, `${field}.default`);
  need(required === (value === undefined), `${field}.required`);
  return {
    type: type as PromptInputSpec['type'],
    description: description as string,
    ...(options !== undefined && { options: [...(options as string[])] }),
    ...(value !== undefined && { default: value as string | number | boolean }),
    required: required as boolean,
  };
}

function checkOutput(output: Json): PromptOutputSchema {
  const properties = read(output, 'properties');
  const required = read(output, 'required');
  need(read(output, 'type') === 'object' && isObject(properties), 'output');
  const names = Object.keys(properties as Json);
  for (const name of names) {
    const property = read(properties as Json, name);
    need(isName(name), 'output.properties (a name)');
    const field = `output.properties.${name}`;
    need(isObject(property), field);
    const p = property as Json;
    const items = read(p, 'items');
    need(PROPERTY_TYPES.has(read(p, 'type') as string), `${field}.type`);
    need(optional(read(p, 'description'), isString), `${field}.description`);
    need(optional(read(p, 'enum'), isStrings), `${field}.enum`);
    need(
      items === undefined ||
        (isObject(items) &&
          SCALARS.has(read(items, 'type') as string) &&
          optional(read(items, 'enum'), isStrings)),
      `${field}.items`
    );
  }
  names.sort(compareCodeUnits);
  need(
    isStrings(required) &&
      required.length === names.length &&
      required.every((name, i) => name === names[i]),
    'output.required'
  );
  need(read(output, 'additionalProperties') === false, 'output.additionalProperties');
  // A user-authored JSON Schema: passed on whole, unknown keywords included
  return structuredClone<unknown>(output) as PromptOutputSchema;
}

function checkModel(model: Json): PromptModel {
  const params = read(model, 'params');
  const profile = read(model, 'profile');
  need(isString(read(model, 'ref')), 'model.ref');
  need(optional(profile, isString), 'model.profile');
  need(isString(read(model, 'provider')), 'model.provider');
  need(isString(read(model, 'apiId')), 'model.apiId');
  need(isObject(params), 'model.params');
  const p = params as Json;
  const picked: Record<string, unknown> = {};
  const rules: [keyof PromptModelParams, (v: unknown) => boolean][] = [
    ['temperature', isNumber],
    ['topP', isNumber],
    ['topK', (v) => isInteger(v, 1)],
    ['maxTokens', (v) => isInteger(v, 1)],
    ['stop', isStrings],
    ['seed', (v) => isInteger(v, 0)],
  ];
  for (const [key, check] of rules) {
    const value = read(p, key);
    need(optional(value, check), `model.params.${key}`);
    if (value !== undefined) picked[key] = Array.isArray(value) ? [...value] : value;
  }
  return {
    ref: read(model, 'ref') as string,
    ...(profile !== undefined && { profile: profile as string }),
    provider: read(model, 'provider') as string,
    apiId: read(model, 'apiId') as string,
    params: picked as PromptModelParams,
  };
}

function checkGovernance(governance: unknown): PromptGovernance {
  need(isObject(governance), 'governance');
  const g = governance as Json;
  const picked: Record<string, unknown> = {};
  const rules: [keyof PromptGovernance, (v: unknown) => boolean][] = [
    ['risk', (v) => RISKS.has(v as string)],
    ['owner', isString],
    ['domain', isString],
    ['dataClasses', isStrings],
    ['reviewers', isStrings],
  ];
  for (const [key, check] of rules) {
    const value = read(g, key);
    need(optional(value, check), `governance.${key}`);
    if (value !== undefined) picked[key] = Array.isArray(value) ? [...value] : value;
  }
  return picked as PromptGovernance;
}

function checkMessages(messages: unknown): RawMessage[] {
  need(Array.isArray(messages) && messages.length >= 1 && messages.length <= 2, 'messages');
  const list = (messages as unknown[]).map((message, i) => {
    need(isObject(message), `messages[${i}]`);
    const role = read(message as Json, 'role');
    const content = read(message as Json, 'content');
    need(role === 'system' || role === 'user', `messages[${i}].role`);
    need(isString(content), `messages[${i}].content`);
    return { role: role as 'system' | 'user', content: content as string };
  });
  need(list.length === 1 || (list[0]?.role === 'system' && list[1]?.role === 'user'), 'messages');
  return list;
}

type CheckedFields = Omit<VerifiedBundle, 'messages' | 'undeclared' | 'warnings'>;
type RawMessage = { role: 'system' | 'user'; content: string };

function checkStructure(bundle: Json): { fields: CheckedFields; rawMessages: RawMessage[] } {
  const id = read(bundle, 'id');
  const description = read(bundle, 'description');
  const contentHash = read(bundle, 'contentHash');
  const inputs = read(bundle, 'inputs');
  const output = read(bundle, 'output');
  const model = read(bundle, 'model');
  need(isPromptId(id), 'id');
  need(isString(description), 'description');
  need(isString(contentHash) && HASH_PATTERN.test(contentHash), 'contentHash');
  const rawMessages = checkMessages(read(bundle, 'messages'));
  need(isObject(inputs), 'inputs');
  const specs: Record<string, PromptInputSpec> = {};
  const names = Object.keys(inputs as Json).sort(compareCodeUnits);
  for (const name of names) specs[name] = checkInput(name, read(inputs as Json, name));
  need(optional(output, isObject), 'output');
  need(optional(model, isObject), 'model');
  const fields: CheckedFields = {
    id: id as string,
    contentHash: contentHash as string,
    description: description as string,
    inputs: specs,
    ...(output !== undefined && { output: checkOutput(output as Json) }),
    ...(model !== undefined && { model: checkModel(model as Json) }),
    governance: checkGovernance(read(bundle, 'governance')),
    names,
  };
  return { fields, rawMessages };
}

/**
 * Run the load checks on a parsed bundle: schema version, structure and content hash.
 * Unknown properties are ignored at every level; `provenance` is neither checked nor kept.
 *
 * @param bundle - The parsed bundle
 * @param where - Names the bundle in error messages, such as `Prompt file x.json from <source>`
 * @param path - Source-relative path, set on errors
 * @throws {PromptLoadError} `unsupported-schema`, `invalid-bundle` or `hash-mismatch`
 */
export function verifyBundle(bundle: unknown, where: string, path?: string): VerifiedBundle {
  const fix = 'Compile it again with prs compile and publish the new file.';
  let checked: ReturnType<typeof checkStructure>;
  try {
    if (isObject(bundle) && read(bundle, '$schema') !== PROMPT_BUNDLE_SCHEMA_URL) {
      throw new PromptLoadError(
        'unsupported-schema',
        `${where} is not a prompt bundle v1. This runtime reads v1 bundles; use a runtime that supports its $schema.`,
        path
      );
    }
    if (!isObject(bundle)) throw new Invalid('');
    checked = checkStructure(bundle);
    if (hashPromptBundle(bundle) !== checked.fields.contentHash) {
      throw new PromptLoadError(
        'hash-mismatch',
        `${where} does not match its contentHash. The file changed after it was built: build it again or restore it.`,
        path
      );
    }
  } catch (error) {
    if (error instanceof PromptLoadError) throw error;
    let field = 'it holds a value JSON cannot carry';
    if (error instanceof Invalid) {
      field = error.field ? `field ${error.field} is invalid` : 'it is not a JSON object';
    }
    throw new PromptLoadError(
      'invalid-bundle',
      `${where} is not a valid prompt bundle: ${field}. ${fix}`,
      path
    );
  }
  const undeclared = new Set<string>();
  const warnings: RenderWarning[] = [];
  const messages = checked.rawMessages.map(({ role, content }, index) => ({
    role,
    parts: splitMessage(content, index, checked.fields.inputs, undeclared, warnings),
  }));
  return deepFreeze({
    ...checked.fields,
    messages,
    undeclared: [...undeclared].sort(compareCodeUnits),
    warnings,
  });
}

/**
 * Split a message at its slots once, at load, so a render only joins text and values.
 * Slots that name no declared input go to `undeclared`, invalid ones to `warnings`.
 */
function splitMessage(
  content: string,
  index: number,
  inputs: Readonly<Record<string, PromptInputSpec>>,
  undeclared: Set<string>,
  warnings: RenderWarning[]
): Part[] {
  const parts: Part[] = [];
  let at = 0;
  for (const match of findRuntimeSlots(content)) {
    const end = match.offset + match.length;
    const name = match.name ?? '';
    let part: Part = content.slice(match.offset, end);
    if (match.kind === 'slot') {
      part = { name };
      if (!Object.hasOwn(inputs, name)) undeclared.add(name);
    } else if (match.kind === 'escaped') {
      part = '{{';
    } else {
      warnings.push({
        code: 'invalid-slot',
        message: `Message ${index} has an invalid slot at offset ${match.offset}, kept as text.`,
      });
    }
    parts.push(content.slice(at, match.offset), part);
    at = end;
  }
  parts.push(content.slice(at));
  return parts.filter((part) => part !== '');
}

function inputError(
  id: string,
  name: string,
  spec: PromptInputSpec,
  value: unknown
): PromptRenderError | undefined {
  const type = spec.type === 'enum' ? 'string' : spec.type;
  if (typeof value !== type || (type === 'number' && !isNumber(value))) {
    return new PromptRenderError('invalid-type', `Prompt ${id}: input ${name} must be a ${type}.`, [
      name,
    ]);
  }
  if (spec.options && !spec.options.includes(value as string)) {
    return new PromptRenderError(
      'invalid-option',
      `Prompt ${id}: input ${name} must be one of its options.`,
      [name]
    );
  }
  return undefined;
}

function unknownInputs(bundle: VerifiedBundle, inputs: Json): RenderWarning[] {
  const extra = Object.keys(inputs).filter((key) => !Object.hasOwn(bundle.inputs, key));
  if (extra.length === 0) return [];
  // Names only, never values; odd or long keys are counted, not shown
  const shown = extra.filter((key) => INPUT_NAME.test(key) && key.length <= MAX_NAME_LENGTH);
  const listed = shown.slice(0, MAX_EXTRA_NAMES);
  const more = extra.length - listed.length;
  const names = more > 0 ? [...listed, `${more} more`] : listed;
  return [
    {
      code: 'unknown-input',
      message: `Prompt ${bundle.id}: ignored inputs it does not declare: ${names.join(', ')}.`,
    },
  ];
}

/**
 * The text of every declared input, in name order. Throws `missing-input` listing every
 * missing name first, else the first type or option failure.
 */
function inputValues(bundle: VerifiedBundle, inputs: Json): Record<string, string> {
  const values: Record<string, string> = {};
  const missing = [...bundle.undeclared];
  let failure: PromptRenderError | undefined;
  for (const name of bundle.names) {
    const spec = bundle.inputs[name]!;
    // Read once: a getter cannot change the value between the check and the insert
    const given = Object.hasOwn(inputs, name) ? inputs[name] : undefined;
    // Only undefined takes the default: null is a value of the wrong type
    const value = given === undefined ? spec.default : given;
    if (value === undefined) {
      missing.push(name);
      continue;
    }
    const error = inputError(bundle.id, name, spec, value);
    failure ??= error;
    // Only a checked value is turned into text: String() throws for some objects
    if (!error) values[name] = String(value as string | number | boolean);
  }
  if (missing.length > 0) {
    missing.sort(compareCodeUnits);
    throw new PromptRenderError(
      'missing-input',
      `Prompt ${bundle.id}: missing inputs ${missing.join(', ')}. Pass them to render().`,
      missing
    );
  }
  if (failure) throw failure;
  return values;
}

/**
 * Render a verified bundle in one pass. Values are inserted as text and never scanned
 * again. Errors and warnings name inputs and positions, never values.
 */
function renderBundle(bundle: VerifiedBundle, meta: PromptMeta, inputs: unknown): RenderedPrompt {
  if (!isObject(inputs)) {
    throw new PromptRenderError(
      'invalid-type',
      `Prompt ${bundle.id}: render() takes an object of values by input name.`,
      []
    );
  }
  const values = inputValues(bundle, inputs);
  const text = (part: Part): string =>
    typeof part === 'string' ? part : (values[part.name] ?? '');
  return {
    messages: bundle.messages.map(({ role, parts }) => ({
      role,
      content: parts.map(text).join(''),
    })),
    ...(bundle.model && { model: bundle.model }),
    params: bundle.model?.params ?? {},
    ...(bundle.output && { output: bundle.output }),
    meta: { ...meta, warnings: [...bundle.warnings, ...unknownInputs(bundle, inputs)] },
  };
}

/** Wrap a verified bundle as a frozen {@link Prompt} with its own meta. */
export function toPrompt(bundle: VerifiedBundle, meta: PromptMeta): Prompt {
  const frozenMeta = Object.freeze({ ...meta });
  return Object.freeze({
    id: bundle.id,
    contentHash: bundle.contentHash,
    description: bundle.description,
    inputs: bundle.inputs,
    ...(bundle.output && { output: bundle.output }),
    ...(bundle.model && { model: bundle.model }),
    governance: bundle.governance,
    meta: frozenMeta,
    render: (inputs: unknown = {}) => renderBundle(bundle, frozenMeta, inputs),
  });
}

/**
 * Load a prompt bundle you already hold, such as one imported from a JSON file.
 *
 * Checks the `$schema`, the structure and the `contentHash`, then returns a frozen
 * prompt. Verification cannot be turned off.
 *
 * @param bundle - A parsed prompt bundle v1
 * @returns The verified prompt, with `meta.source` set to `inline`
 * @throws {PromptLoadError} `unsupported-schema`, `invalid-bundle` or `hash-mismatch`
 *
 * @example
 * const prompt = loadPrompt(JSON.parse(text));
 * const { messages } = prompt.render({ message: 'Where is my refund?' });
 */
export function loadPrompt(bundle: unknown): Prompt {
  const verified = verifyBundle(bundle, 'Inline prompt bundle');
  return toPrompt(verified, {
    id: verified.id,
    contentHash: verified.contentHash,
    source: 'inline',
    loadedAt: new Date().toISOString(),
    stale: false,
  });
}
