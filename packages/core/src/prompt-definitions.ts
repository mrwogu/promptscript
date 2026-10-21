import { isCanonicalBlock } from './canonical-ast.js';
import type {
  ComposableBlock,
  GovernanceMeta,
  ModelParams,
  ProgramInput,
  PromptDefinition,
  PromptInput,
  PromptOutputField,
  PromptScalarType,
  RiskLevel,
  SourceLocation,
  Value,
  ValueNode,
} from './types/index.js';
import { findClosestMatch } from './utils/levenshtein.js';

/** One problem found while reading a `@prompts` entry. */
export interface PromptExtractionIssue {
  /** Entry key as authored */
  prompt: string;
  /** Actionable message that names the entry */
  message: string;
  /** How to fix it */
  suggestion: string;
  /** Location of the entry */
  loc: SourceLocation;
}

/** Result of reading every `@prompts` entry of a program. */
export interface PromptExtraction {
  /** Entries with a usable key. Invalid parts are left out, see `issues`. */
  prompts: PromptDefinition[];
  /** Everything wrong with the entries */
  issues: PromptExtractionIssue[];
}

/** Keys an entry accepts. */
export const PROMPT_ENTRY_KEYS: readonly string[] = [
  'description',
  'system',
  'user',
  'compose',
  'model',
  'inputs',
  'output',
  'risk',
  'owner',
  'domain',
  'dataClasses',
  'reviewers',
];

/** Keys the `model` object accepts. */
export const PROMPT_MODEL_KEYS: readonly string[] = [
  'ref',
  'temperature',
  'topP',
  'topK',
  'maxTokens',
  'stop',
  'seed',
];

/** Blocks a prompt can compose into its system message. */
export const COMPOSABLE_BLOCKS: readonly ComposableBlock[] = [
  'identity',
  'context',
  'knowledge',
  'standards',
  'restrictions',
  'examples',
];

/** Risk levels, lowest first. */
export const RISK_LEVELS: readonly RiskLevel[] = ['low', 'medium', 'high', 'critical'];

/** Value types of inputs and output fields. */
export const PROMPT_SCALAR_TYPES: readonly PromptScalarType[] = [
  'string',
  'number',
  'boolean',
  'enum',
];

/** Pattern of a prompt key. The key becomes a file name. */
export const PROMPT_KEY_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/;

/** Pattern of an input name. A slot can only name such an input. */
export const PROMPT_INPUT_NAME_PATTERN = /^[A-Za-z_]\w*$/;

const RESERVED_FILE_NAMES = /^(?:index|readme|con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;
const UNSAFE_NAMES: ReadonlySet<string> = new Set([
  '__proto__',
  'prototype',
  ...Object.getOwnPropertyNames(Object.prototype),
]);
const MAX_SEED = Number.MAX_SAFE_INTEGER;

// ---------------------------------------------------------------------------
// Raw tree: one shape for the canonical and the legacy AST. Object fields stay
// an array, so a key such as `__proto__` is never looked up on a prototype.
// ---------------------------------------------------------------------------

interface RawField {
  name: string;
  value: Raw;
}

type ObjectRaw = { kind: 'object'; fields: RawField[] };

type Raw =
  | ObjectRaw
  | { kind: 'array'; items: Raw[] }
  | { kind: 'scalar'; value: string | number | boolean | null }
  | { kind: 'other' };

const OTHER: Raw = { kind: 'other' };

function fromNode(node: ValueNode): Raw {
  switch (node.type) {
    case 'ScalarValueNode':
    case 'TextValueNode':
      return { kind: 'scalar', value: node.value };
    case 'ArrayValueNode':
      return { kind: 'array', items: node.elements.map((element) => fromNode(element.value)) };
    case 'ObjectValueNode':
      return {
        kind: 'object',
        fields: node.fields.map((field) => ({ name: field.name, value: fromNode(field.value) })),
      };
    default:
      return OTHER;
  }
}

function fromValue(value: Value): Raw {
  if (value === null || typeof value !== 'object') {
    return { kind: 'scalar', value };
  }
  if (Array.isArray(value)) {
    return { kind: 'array', items: value.map(fromValue) };
  }
  const typed = value as { type?: unknown; value?: unknown };
  if (typed.type === 'TextContent' && typeof typed.value === 'string') {
    return { kind: 'scalar', value: typed.value };
  }
  if (typed.type === 'TemplateExpression' || typed.type === 'TypeExpression') {
    return OTHER;
  }
  return {
    kind: 'object',
    fields: Object.entries(value).map(([name, field]) => ({ name, value: fromValue(field) })),
  };
}

function field(object: { fields: RawField[] }, name: string): Raw | undefined {
  return object.fields.find((candidate) => candidate.name === name)?.value;
}

function stringOf(raw: Raw | undefined): string | undefined {
  return raw?.kind === 'scalar' && typeof raw.value === 'string' ? raw.value : undefined;
}

function stringList(raw: Raw): string[] | undefined {
  if (raw.kind !== 'array') return undefined;
  const items = raw.items.map(stringOf);
  return items.every((item): item is string => item !== undefined) ? items : undefined;
}

// ---------------------------------------------------------------------------
// Reading helpers. Each reports through `bad` and returns what it could keep.
// ---------------------------------------------------------------------------

type Report = (message: string, suggestion: string) => void;

function isUnsafeName(name: string): boolean {
  return UNSAFE_NAMES.has(name);
}

function unknownKeys(
  object: { fields: RawField[] },
  known: readonly string[],
  where: string,
  bad: Report
): void {
  for (const { name } of object.fields) {
    if (known.includes(name)) continue;
    const close = findClosestMatch(name, known);
    bad(
      `${where} has unknown key "${name}"`,
      close ? `Did you mean "${close.match}"?` : `Use one of: ${known.join(', ')}`
    );
  }
}

function integerOf(raw: Raw, min: number, max: number): number | undefined {
  return raw.kind === 'scalar' &&
    typeof raw.value === 'number' &&
    Number.isInteger(raw.value) &&
    raw.value >= min &&
    raw.value <= max
    ? raw.value
    : undefined;
}

function numberOf(raw: Raw): number | undefined {
  return raw.kind === 'scalar' && typeof raw.value === 'number' && Number.isFinite(raw.value)
    ? raw.value
    : undefined;
}

type ParamReader = (raw: Raw) => number | string[] | undefined;
const PARAM_READERS: Readonly<Record<keyof ModelParams, { reader: ParamReader; expects: string }>> =
  {
    temperature: { reader: numberOf, expects: 'a number' },
    topP: { reader: numberOf, expects: 'a number' },
    topK: { reader: (raw) => integerOf(raw, 1, MAX_SEED), expects: 'an integer of at least 1' },
    maxTokens: {
      reader: (raw) => integerOf(raw, 1, MAX_SEED),
      expects: 'an integer of at least 1',
    },
    stop: { reader: stringList, expects: 'a list of strings' },
    seed: {
      reader: (raw) => integerOf(raw, 0, MAX_SEED),
      expects: 'an integer from 0 to 9007199254740991',
    },
  };

function readModel(raw: Raw, bad: Report): { ref: string; params: ModelParams } | undefined {
  if (raw.kind !== 'object') {
    bad('model must be an object', 'Write model: { ref: "claude-sonnet-5-5" }');
    return undefined;
  }
  unknownKeys(raw, PROMPT_MODEL_KEYS, 'model', bad);
  const ref = stringOf(field(raw, 'ref'))?.trim();
  if (!ref) {
    bad('model.ref is required and must be a model name', 'Add ref: "<model id or alias>"');
  }
  const params: Record<string, number | string[]> = {};
  for (const [name, { reader, expects }] of Object.entries(PARAM_READERS)) {
    const value = field(raw, name);
    if (value === undefined) continue;
    const read = reader(value);
    if (read === undefined)
      bad(`model.${name} must be ${expects}`, `Set model.${name} to ${expects}.`);
    else params[name] = read;
  }
  return ref ? { ref, params: params as ModelParams } : undefined;
}

function readOptions(raw: Raw | undefined, where: string, bad: Report): string[] | undefined {
  if (raw === undefined) return undefined;
  const options = stringList(raw);
  if (!options) {
    bad(`${where} options must be a list of strings`, 'Write options: ["a", "b"]');
    return undefined;
  }
  if (new Set(options).size !== options.length) {
    bad(`${where} options must be unique`, 'Remove the repeated option');
  }
  return options;
}

function readScalarType(
  object: { fields: RawField[] },
  where: string,
  bad: Report,
  extra: readonly string[] = []
): PromptScalarType | 'list' | undefined {
  const type = stringOf(field(object, 'type'));
  const allowed = [...PROMPT_SCALAR_TYPES, ...extra];
  if (type !== undefined && allowed.includes(type)) return type as PromptScalarType | 'list';
  bad(
    type === undefined ? `${where} needs a type` : `${where} has unknown type "${type}"`,
    `Use one of: ${allowed.join(', ')}`
  );
  return undefined;
}

function defaultMatches(raw: Raw, type: PromptScalarType, options: string[] | undefined): boolean {
  if (raw.kind !== 'scalar') return false;
  switch (type) {
    case 'string':
      return typeof raw.value === 'string';
    case 'number':
      return typeof raw.value === 'number' && Number.isFinite(raw.value);
    case 'boolean':
      return typeof raw.value === 'boolean';
    case 'enum':
      return typeof raw.value === 'string' && (options?.includes(raw.value) ?? false);
  }
}

function readInput(name: string, raw: Raw, bad: Report): PromptInput | undefined {
  const where = `input "${name}"`;
  if (raw.kind !== 'object') {
    bad(
      `${where} must be an object with a type and a description`,
      'Write name: { type: "string" description: "..." }'
    );
    return undefined;
  }
  const type = readScalarType(raw, where, bad) as PromptScalarType | undefined;
  const description = stringOf(field(raw, 'description'));
  if (!description?.trim())
    bad(`${where} needs a description`, 'Add description: "<what it holds>"');
  const options = readOptions(field(raw, 'options'), where, bad);
  checkEnumOptions(type, options, `${where} is`, bad);
  const input: PromptInput = { description: description ?? '', type: type ?? 'string' };
  if (options) input.options = options;
  const fallback = field(raw, 'default');
  if (fallback !== undefined && type) {
    if (defaultMatches(fallback, type, options) && fallback.kind === 'scalar') {
      input.default = fallback.value;
    } else {
      bad(
        `${where} has a default that does not match its type "${type}"` +
          (type === 'enum' ? ' and options' : ''),
        'Change the default or the type'
      );
    }
  }
  return type ? input : undefined;
}

function checkEnumOptions(
  type: string | undefined,
  options: string[] | undefined,
  subject: string,
  bad: Report
): void {
  if (type === 'enum' && (options === undefined || options.length === 0)) {
    bad(`${subject} an enum without options`, 'Add options: ["a", "b"]');
  }
}

function readListItems(
  raw: ObjectRaw,
  where: string,
  bad: Report
): PromptOutputField['items'] | undefined {
  const items = field(raw, 'items');
  if (items?.kind !== 'object') {
    bad(`${where} is a list without items`, 'Add items: { type: "string" }');
    return undefined;
  }
  const type = readScalarType(items, `${where} items`, bad) as PromptScalarType | undefined;
  const options = readOptions(field(items, 'options'), `${where} items`, bad);
  checkEnumOptions(type, options, `${where} items are`, bad);
  return type ? { type, ...(options ? { options } : {}) } : undefined;
}

function readOutputField(name: string, raw: Raw, bad: Report): PromptOutputField | undefined {
  const where = `output "${name}"`;
  if (raw.kind !== 'object') {
    bad(`${where} must be an object with a type`, 'Write name: { type: "string" }');
    return undefined;
  }
  const type = readScalarType(raw, where, bad, ['list']);
  const options = readOptions(field(raw, 'options'), where, bad);
  checkEnumOptions(type, options, `${where} is`, bad);
  const result: PromptOutputField = {
    description: stringOf(field(raw, 'description')) ?? '',
    type: type ?? 'string',
  };
  if (options) result.options = options;
  if (type === 'list') {
    const items = readListItems(raw, where, bad);
    if (items) result.items = items;
  }
  return type ? result : undefined;
}

function readNamedMap<T>(
  raw: Raw,
  kind: 'inputs' | 'output',
  bad: Report,
  read: (name: string, value: Raw) => T | undefined,
  nameRule: RegExp | undefined
): Record<string, T> | undefined {
  if (raw.kind !== 'object') {
    bad(
      `${kind} must be an object that maps names to definitions`,
      `Write ${kind}: { name: { type: "string" } }`
    );
    return undefined;
  }
  const result: Record<string, T> = {};
  for (const { name, value } of raw.fields) {
    const label = kind === 'inputs' ? 'input' : 'output field';
    if (isUnsafeName(name)) {
      bad(
        `${label} name "${name}" is reserved`,
        'Pick another name, object prototype names are not allowed'
      );
      continue;
    }
    if (nameRule && !nameRule.test(name)) {
      bad(
        `${label} name "${name}" cannot be used in a slot`,
        'Use letters, digits and underscores, starting with a letter or underscore'
      );
    }
    const entry = read(name, value);
    if (entry !== undefined) result[name] = entry;
  }
  return result;
}

function readRisk(raw: Raw | undefined, governance: GovernanceMeta, bad: Report): void {
  if (raw === undefined) return;
  const level = stringOf(raw);
  if (level !== undefined && (RISK_LEVELS as readonly string[]).includes(level)) {
    governance.risk = level as RiskLevel;
  } else {
    bad(`risk must be one of: ${RISK_LEVELS.join(', ')}`, 'Set risk to a supported level.');
  }
}

function readGovernanceName(
  key: 'owner' | 'domain',
  raw: Raw | undefined,
  governance: GovernanceMeta,
  bad: Report
): void {
  if (raw === undefined) return;
  const text = stringOf(raw)?.trim();
  if (text) governance[key] = text;
  else
    bad(`${key} must be a non-empty string`, `Set ${key} to a name, for example "team-support".`);
}

function readGovernanceList(
  key: 'dataClasses' | 'reviewers',
  raw: Raw | undefined,
  governance: GovernanceMeta,
  bad: Report
): void {
  if (raw === undefined) return;
  const list = stringList(raw);
  if (list) governance[key] = list;
  else bad(`${key} must be a list of strings`, `Write ${key}: ["a", "b"]`);
}

/**
 * Check governance values and read the ones that are valid.
 * Shared by `@prompts` entries and `@meta`.
 */
function readGovernance(lookup: (name: string) => Raw | undefined, bad: Report): GovernanceMeta {
  const governance: GovernanceMeta = {};
  readRisk(lookup('risk'), governance, bad);
  for (const key of ['owner', 'domain'] as const) {
    readGovernanceName(key, lookup(key), governance, bad);
  }
  for (const key of ['dataClasses', 'reviewers'] as const) {
    readGovernanceList(key, lookup(key), governance, bad);
  }
  return governance;
}

/**
 * Check governance fields of `@meta`, which act as defaults for prompts.
 *
 * @param fields - The `@meta` fields
 * @returns One message per invalid value
 */
export function validateGovernanceFields(fields: Record<string, Value>): string[] {
  const messages: string[] = [];
  // Not fromValue(fields): a field named "type" would make the map look like a typed node.
  const raw: ObjectRaw = {
    kind: 'object',
    fields: Object.entries(fields).map(([name, value]) => ({ name, value: fromValue(value) })),
  };
  const lookup = (name: string): Raw | undefined => field(raw, name);
  readGovernance(lookup, (message) => messages.push(`@meta ${message}`));
  return messages;
}

function readCompose(raw: Raw, blocks: ReadonlySet<string>, bad: Report): ComposableBlock[] {
  const names = stringList(raw);
  if (!names) {
    bad(
      'compose must be a list of block names',
      `Use a subset of: ${COMPOSABLE_BLOCKS.join(', ')}`
    );
    return [];
  }
  const compose: ComposableBlock[] = [];
  for (const name of names) {
    if (!(COMPOSABLE_BLOCKS as readonly string[]).includes(name)) {
      bad(
        `compose names "${name}", which cannot be composed`,
        `Use: ${COMPOSABLE_BLOCKS.join(', ')}`
      );
    } else if (!blocks.has(name)) {
      bad(
        `compose names @${name}, which the resolved program does not have`,
        `Add @${name} or inherit it, or remove it from compose`
      );
    } else if (!compose.includes(name as ComposableBlock)) {
      compose.push(name as ComposableBlock);
    }
  }
  return compose;
}

function reporter(key: string, loc: SourceLocation, issues: PromptExtractionIssue[]): Report {
  return (message, suggestion) =>
    issues.push({
      prompt: key,
      message: `Prompt "${key}": ${message}`,
      suggestion,
      loc,
    });
}

interface EntrySource {
  key: string;
  raw: Raw;
  loc: SourceLocation;
}

function readMessages(raw: ObjectRaw, bad: Report): { system?: string; user?: string } {
  const texts: { system?: string; user?: string } = {};
  for (const role of ['system', 'user'] as const) {
    const value = field(raw, role);
    if (value === undefined) continue;
    const text = stringOf(value);
    if (text === undefined) {
      bad(`${role} must be a string or a text block`, `Write ${role}: "..." or a """ text block.`);
    } else {
      texts[role] = text;
    }
  }
  if (!texts.system?.trim() && !texts.user?.trim()) {
    bad('needs a system or a user message', 'Add user: "<message>"');
  }
  return texts;
}

function readContracts(
  raw: ObjectRaw,
  bad: Report
): { inputs: Record<string, PromptInput>; fields?: Record<string, PromptOutputField> } {
  const inputsRaw = field(raw, 'inputs');
  const outputRaw = field(raw, 'output');
  const inputs =
    inputsRaw &&
    readNamedMap(
      inputsRaw,
      'inputs',
      bad,
      (n, v) => readInput(n, v, bad),
      PROMPT_INPUT_NAME_PATTERN
    );
  const fields =
    outputRaw &&
    readNamedMap(outputRaw, 'output', bad, (n, v) => readOutputField(n, v, bad), undefined);
  return { inputs: inputs ?? {}, ...(fields ? { fields } : {}) };
}

function readEntry(
  { key, raw, loc }: EntrySource,
  blocks: ReadonlySet<string>,
  issues: PromptExtractionIssue[]
): PromptDefinition | undefined {
  const bad = reporter(key, loc, issues);
  if (raw.kind !== 'object') {
    bad('the entry must be an object', 'Write key: { description: "..." user: "..." }');
    return undefined;
  }
  unknownKeys(raw, PROMPT_ENTRY_KEYS, 'the entry', bad);

  const description = stringOf(field(raw, 'description'));
  if (!description?.trim()) bad('description is required', 'Add description: "<what it does>"');
  const texts = readMessages(raw, bad);
  const composeRaw = field(raw, 'compose');
  const modelRaw = field(raw, 'model');
  const { inputs, fields } = readContracts(raw, bad);
  const model = modelRaw && readModel(modelRaw, bad);

  return {
    name: key,
    description: description ?? '',
    ...texts,
    compose: composeRaw ? readCompose(composeRaw, blocks, bad) : [],
    inputs,
    ...(fields ? { output: { fields } } : {}),
    ...(model ? { model } : {}),
    governance: readGovernance((name) => field(raw, name), bad),
    loc,
  };
}

function checkKey(key: string, seen: Map<string, string>, bad: Report): boolean {
  let ok = true;
  if (isUnsafeName(key)) {
    bad('the key is reserved', 'Pick another key, object prototype names are not allowed');
    return false;
  }
  if (!PROMPT_KEY_PATTERN.test(key)) {
    bad(
      'the key must start with a letter or digit and use only letters, digits, "_" and "-" (64 characters at most)',
      'Rename the entry, the key becomes a file name'
    );
    ok = false;
  } else if (RESERVED_FILE_NAMES.test(key)) {
    bad(
      'the key is reserved as a file name',
      'Pick another key, not index, readme or a device name'
    );
    ok = false;
  }
  const folded = key.toLowerCase();
  const first = seen.get(folded);
  if (first !== undefined) {
    bad(
      `the key collides with "${first}" when case is ignored`,
      'Keys must differ by more than case'
    );
    ok = false;
  } else {
    seen.set(folded, key);
  }
  return ok;
}

function entriesOf(block: ProgramInput['blocks'][number]): EntrySource[] {
  if (isCanonicalBlock(block)) {
    return block.body.entries.flatMap((entry) =>
      entry.type === 'FieldEntry'
        ? [{ key: entry.name, raw: fromNode(entry.value), loc: entry.loc }]
        : []
    );
  }
  if (block.content.type !== 'ObjectContent' && block.content.type !== 'MixedContent') return [];
  return Object.entries(block.content.properties).map(([key, value]) => ({
    key,
    raw: fromValue(value),
    loc: block.loc,
  }));
}

function collectEntries(program: ProgramInput): { entries: EntrySource[]; blocks: Set<string> } {
  const blocks = new Set(program.blocks.map((block) => block.name));
  const entries = program.blocks
    .filter((block) => block.name === 'prompts')
    .flatMap((block) => entriesOf(block));
  return { entries, blocks };
}

/**
 * Read every `@prompts` entry of a program into typed definitions.
 *
 * Accepts the canonical AST (`CanonicalBlock` with `FieldEntry` values) and the
 * legacy AST (`ObjectContent` with `TextContent` values). Problems do not stop
 * the read: the entry keeps what is valid and each problem becomes an issue.
 * An entry whose key is reserved, malformed or collides with another key
 * (case-insensitively) is reported and left out of `prompts`.
 *
 * @param program - A resolved program, canonical or legacy
 * @returns The definitions and the issues found
 *
 * @example
 * const { prompts, issues } = extractPromptDefinitions(program);
 */
export function extractPromptDefinitions(program: ProgramInput): PromptExtraction {
  const { entries, blocks } = collectEntries(program);
  const prompts: PromptDefinition[] = [];
  const issues: PromptExtractionIssue[] = [];
  const seen = new Map<string, string>();
  for (const entry of entries) {
    const keyOk = checkKey(entry.key, seen, reporter(entry.key, entry.loc, issues));
    const definition = readEntry(entry, blocks, issues);
    if (keyOk && definition) prompts.push(definition);
  }
  return { prompts, issues };
}
