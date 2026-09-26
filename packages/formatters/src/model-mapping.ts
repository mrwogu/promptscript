import {
  TARGET_CAPABILITIES,
  getAgentFieldStatus,
  getModelCatalog,
  getModelTargetScheme,
  isKnownTarget,
  mapModelToTarget,
  type Block,
  type CanonicalAgentField,
  type KnownTarget,
  type ModelProfile,
  type ModelsConfig,
  type Program,
  type TargetModel,
  type Value,
} from '@promptscript/core';
import type { FormatterOutput, FormatterWarning } from './types.js';

/**
 * Stable diagnostic code for model references a target cannot write.
 *
 * PS4003 covers whole agent fields a target drops; a model value the target
 * cannot name gets its own code so CI can tell the two apart.
 */
const MODEL_COMPATIBILITY_CODE = 'PS4004';

const AGENT_MODEL_FIELDS: readonly CanonicalAgentField[] = ['model', 'specModel'];

// Targets whose skill files carry a native `model` field.
const SKILL_MODEL_TARGETS: ReadonlySet<string> = new Set(['claude', 'grok']);

// Parsed by hand, not by regex: a pattern like /^'?model'?:(?:[ \t]+(.*))?$/
// has adjacent variable groups, which static analysis flags as
// super-linear backtracking.
const MODEL_KEY = 'model';

/**
 * One layer of matching quotes stripped from a YAML token.
 */
function unquoteYamlToken(token: string): string {
  const quote = token[0];
  if ((quote === "'" || quote === '"') && token.at(-1) === quote && token.length >= 2) {
    return token.slice(1, -1);
  }
  return token;
}

/**
 * Cut a YAML comment off a value part: a `#` outside quotes that starts
 * the value or follows whitespace.
 */
function stripYamlComment(value: string): string {
  let quote: string | undefined;
  for (let i = 0; i < value.length; i++) {
    const char = value[i];
    if (quote === undefined) {
      if (char === "'" || char === '"') {
        quote = char;
      } else if (char === '#' && (i === 0 || value[i - 1] === ' ' || value[i - 1] === '\t')) {
        return value.slice(0, i);
      }
    } else if (char === quote) {
      quote = undefined;
    }
  }
  return value;
}

/**
 * Split a top-level YAML mapping line into its key and value part, or
 * undefined when the line is not one: nested keys, missing colons, and
 * scalars like `model:x` do not count.
 */
function splitYamlMapping(line: string): [string, string] | undefined {
  if (line.startsWith(' ') || line.startsWith('\t')) return undefined;
  const colon = line.indexOf(':');
  if (colon < 0) return undefined;
  const rest = line.slice(colon + 1);
  if (rest !== '' && !rest.startsWith(' ') && !rest.startsWith('\t')) return undefined;
  return [unquoteYamlToken(line.slice(0, colon).trim()), rest];
}

/**
 * The top-level `model` field of a raw SKILL.md frontmatter: where its
 * key line sits, how many lines the value spans, and its effective
 * value.
 */
export interface FrontmatterModelField {
  /** Zero-based index of the `model` key line. */
  readonly keyIndex: number;
  /** Lines the value spans; 1 unless it is a block scalar. */
  readonly lineCount: number;
  /** Effective value; undefined when the value is empty. */
  readonly value: string | undefined;
}

/**
 * Whether a frontmatter line is the top-level `model` field, quoted key
 * included; indented lines are nested keys, not the model.
 */
export function isFrontmatterModelLine(line: string): boolean {
  return splitYamlMapping(line)?.[0] === MODEL_KEY;
}

/**
 * Block scalar indicator of a value (`|`, `|-`, `|2`, `>`, ...), or
 * undefined when the value is not one.
 */
function blockScalarKind(value: string): 'literal' | 'folded' | undefined {
  const first = value[0];
  if (first !== '|' && first !== '>') return undefined;
  for (const char of value.slice(1)) {
    if (char !== '-' && char !== '+' && (char < '1' || char > '9')) return undefined;
  }
  return first === '|' ? 'literal' : 'folded';
}

/**
 * Indented continuation lines of the block scalar starting after
 * `keyIndex`, without trailing blank lines.
 */
function blockScalarLines(lines: readonly string[], keyIndex: number): string[] {
  const block: string[] = [];
  for (const line of lines.slice(keyIndex + 1)) {
    if (line === '' || line.startsWith(' ') || line.startsWith('\t')) {
      block.push(line);
    } else {
      break;
    }
  }
  while (block.length > 0 && block.at(-1) === '') block.pop();
  return block;
}

/**
 * Effective text of a block scalar: literal scalars keep their line
 * breaks, folded scalars fold them like YAML does.
 */
function blockScalarValue(block: readonly string[], kind: 'literal' | 'folded'): string {
  const indents = block
    .filter((line) => line !== '')
    .map((line) => line.length - line.trimStart().length);
  const indent = indents.length > 0 ? Math.min(...indents) : 0;
  const content = block.map((line) => (line === '' ? '' : line.slice(indent)));
  if (kind === 'literal') {
    return content.join('\n').trim();
  }
  const paragraphs: string[][] = [[]];
  for (const line of content) {
    if (line === '') {
      paragraphs.push([]);
    } else {
      paragraphs.at(-1)?.push(line.trim());
    }
  }
  return paragraphs
    .map((lines) => lines.join(' '))
    .join('\n')
    .trim();
}

/**
 * Find the top-level `model` field of a raw SKILL.md frontmatter, or
 * undefined when there is none. The first `model` line wins.
 */
export function findRawFrontmatterModel(frontmatter: string): FrontmatterModelField | undefined {
  const lines = frontmatter.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line: string | undefined = lines[i];
    if (line === undefined || !isFrontmatterModelLine(line)) continue;
    const valuePart = stripYamlComment(line.slice(line.indexOf(':') + 1)).trim();
    if (!valuePart) {
      return { keyIndex: i, lineCount: 1, value: undefined };
    }
    const kind = blockScalarKind(valuePart);
    if (kind === undefined) {
      return { keyIndex: i, lineCount: 1, value: unquoteYamlToken(valuePart) };
    }
    const block = blockScalarLines(lines, i);
    const value = blockScalarValue(block, kind);
    return { keyIndex: i, lineCount: 1 + block.length, value: value === '' ? undefined : value };
  }
  return undefined;
}

/**
 * Model value of a raw SKILL.md frontmatter, or undefined when the
 * frontmatter has no top-level `model` line or the value is empty.
 * Trailing comments are stripped; quotes around the key and the value
 * are read through; block scalars contribute their effective value.
 */
export function extractRawFrontmatterModel(frontmatter: string): string | undefined {
  return findRawFrontmatterModel(frontmatter)?.value;
}

/**
 * Native model name for a target, or undefined when the field is omitted.
 */
export function toTargetModel(
  model: string | undefined,
  target: string,
  models?: ModelsConfig
): string | undefined {
  if (model === undefined) return undefined;
  return mapModelToTarget(model, target, getModelCatalog(models)).value;
}

function describeInvalidName(
  label: string,
  target: string,
  profile: ModelProfile | undefined
): Pick<FormatterWarning, 'message' | 'suggestion'> {
  if (!profile) {
    return {
      message: `${label} has a line break or control character, so it is omitted.`,
      suggestion: 'Write the model name on one line, without control characters.',
    };
  }
  return {
    message: `${label} maps to a name with a line break or control character on target "${target}", so it is omitted.`,
    suggestion: `Remove line breaks and control characters from models.profiles.${profile.id} in promptscript.yaml.`,
  };
}

function describeOmission(
  label: string,
  target: string,
  mapped: TargetModel
): Pick<FormatterWarning, 'message' | 'suggestion'> | undefined {
  if (mapped.issue === 'invalid-name') return describeInvalidName(label, target, mapped.profile);
  if (mapped.issue !== 'unsupported-provider' || !mapped.profile) return undefined;

  const providers = (getModelTargetScheme(target)?.providers ?? [])
    .map((provider) => `"${provider}"`)
    .join(' or ');
  return {
    message: `${label} comes from provider "${mapped.profile.provider}", which target "${target}" cannot run, so it is omitted.`,
    suggestion: `Use a model from provider ${providers}, or set models.profiles.${mapped.profile.id}.targets.${target} in promptscript.yaml.`,
  };
}

function blockEntries(ast: Program, name: string): Array<[string, Record<string, Value>, Block]> {
  const block = ast.blocks.find((candidate) => candidate.name === name);
  if (!block) return [];
  if (block.content.type !== 'ObjectContent' && block.content.type !== 'MixedContent') return [];
  return Object.entries(block.content.properties).flatMap(([entryName, value]) =>
    value && typeof value === 'object' && !Array.isArray(value)
      ? [
          [entryName, value as Record<string, Value>, block] as [
            string,
            Record<string, Value>,
            Block,
          ],
        ]
      : []
  );
}

function emitsResource(target: KnownTarget, kind: 'agents' | 'skills', version: string): boolean {
  return TARGET_CAPABILITIES[target].resources.some(
    (resource) => resource.kind === kind && resource.versions.includes(version)
  );
}

/**
 * PS4004 warning for one model reference, or undefined when the target
 * writes it.
 */
function modelReferenceWarning(
  owner: string,
  field: string,
  value: Value | undefined,
  block: Block,
  target: string,
  catalog: ReturnType<typeof getModelCatalog>
): FormatterWarning | undefined {
  if (typeof value !== 'string') return undefined;
  // JSON quoting keeps a multi-line value on one line of the warning.
  const described = describeOmission(
    `${owner}: ${field} ${JSON.stringify(value.trim())}`,
    target,
    mapModelToTarget(value, target, catalog)
  );
  return (
    described && {
      code: MODEL_COMPATIBILITY_CODE,
      ruleName: 'model-compatibility',
      ...described,
      location: block.loc,
    }
  );
}

function agentModelWarnings(
  ast: Program,
  target: KnownTarget,
  version: string,
  catalog: ReturnType<typeof getModelCatalog>
): FormatterWarning[] {
  if (!emitsResource(target, 'agents', version)) return [];
  const fields = AGENT_MODEL_FIELDS.filter(
    (field) => getAgentFieldStatus(target, field) !== 'not-supported'
  );
  return blockEntries(ast, 'agents').flatMap(([name, entry, block]) =>
    fields.flatMap((field) => {
      const warning = modelReferenceWarning(
        `Agent "${name}"`,
        field,
        entry[field],
        block,
        target,
        catalog
      );
      return warning ? [warning] : [];
    })
  );
}

// A SKILL.md frontmatter model is mapped too, unless `.prs` overrides it.
function frontmatterModelWarning(
  name: string,
  entry: Record<string, Value>,
  block: Block,
  target: KnownTarget,
  catalog: ReturnType<typeof getModelCatalog>
): FormatterWarning | undefined {
  if (entry['model'] !== undefined) return undefined;
  const frontmatter =
    typeof entry['__rawFrontmatter'] === 'string' ? entry['__rawFrontmatter'] : undefined;
  const rawModel = frontmatter !== undefined ? extractRawFrontmatterModel(frontmatter) : undefined;
  return rawModel === undefined
    ? undefined
    : modelReferenceWarning(`Skill "${name}"`, 'model', rawModel, block, target, catalog);
}

function skillModelWarnings(
  ast: Program,
  target: KnownTarget,
  version: string,
  catalog: ReturnType<typeof getModelCatalog>
): FormatterWarning[] {
  if (!SKILL_MODEL_TARGETS.has(target) || !emitsResource(target, 'skills', version)) return [];
  return blockEntries(ast, 'skills').flatMap(([name, entry, block]) => {
    const warnings = [
      modelReferenceWarning(`Skill "${name}"`, 'model', entry['model'], block, target, catalog),
      frontmatterModelWarning(name, entry, block, target, catalog),
    ].flatMap((warning) => (warning ? [warning] : []));
    return warnings;
  });
}

/**
 * Report model references a target omits: models from a provider it cannot
 * run, and names with a line break or control character. Names missing from
 * the catalog are written as-is, so they are left to PS041. Only agent and
 * skill files the target version emits are checked; a skill's SKILL.md
 * frontmatter model counts only when `.prs` does not override it.
 */
export function getModelCompatibilityWarnings(
  ast: Program,
  target: string,
  version: string,
  models?: ModelsConfig
): FormatterWarning[] {
  if (!isKnownTarget(target) || !getModelTargetScheme(target)) return [];

  const catalog = getModelCatalog(models);
  return [
    ...agentModelWarnings(ast, target, version, catalog),
    ...skillModelWarnings(ast, target, version, catalog),
  ];
}

/**
 * Append model compatibility warnings to a formatter output.
 */
export function appendModelCompatibilityWarnings(
  output: FormatterOutput,
  ast: Program,
  target: string,
  version: string,
  models?: ModelsConfig
): FormatterOutput {
  const warnings = getModelCompatibilityWarnings(ast, target, version, models);
  if (warnings.length === 0) return output;
  return { ...output, warnings: [...(output.warnings ?? []), ...warnings] };
}
