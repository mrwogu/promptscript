import { readFile, readdir, access, lstat, realpath } from 'fs/promises';
import { basename, resolve, dirname, relative, isAbsolute, sep } from 'path';
import { isAlias, isCollection, isNode, isPair, isSeq, parseDocument } from 'yaml';
import {
  isGeneratedByPromptScript,
  ResolveError,
  stripFrontmatterMarkerLines,
  stripLeadingHtmlMarker,
} from '@promptscript/core';
import type {
  Logger,
  Program,
  Block,
  MixedContent,
  ObjectContent,
  Value,
  TextContent,
  ParamDefinition,
  ParamType,
  SkillContractField,
  SourceLocation,
} from '@promptscript/core';

/**
 * A resource file discovered alongside a skill's SKILL.md.
 */
export interface SkillResource {
  /** Relative path from the skill directory (e.g. "data/colors.csv") */
  relativePath: string;
  /** File content (utf-8) */
  content: string;
  /** Absolute source path used for dependency tracking */
  origin?: string;
  /** Whether the source file had executable mode bits set */
  executable?: boolean;
}

/**
 * Result of parsing a native SKILL.md file.
 */
export interface ParsedSkillMd {
  name?: string;
  description?: string;
  content: string;
  params?: ParamDefinition[];
  inputs?: Record<string, SkillContractField>;
  outputs?: Record<string, SkillContractField>;
  references?: string[];
  scripts?: string[];
  license?: string;
  compatibility?: string;
  metadata?: Record<string, string>;
  allowedTools?: string[];
  rawFrontmatter?: string;
}

interface ParsedSkillFrontmatter {
  name?: string;
  description?: string;
  params?: ParamDefinition[];
  inputs?: Record<string, SkillContractField>;
  outputs?: Record<string, SkillContractField>;
  references?: string[];
  scripts?: string[];
  license?: string;
  compatibility?: string;
  metadata?: Record<string, string>;
  allowedTools?: string[];
}

interface ParsedYamlFrontmatter {
  fields: Record<string, unknown>;
  fieldLocations: ReadonlyMap<string, SourceLocation>;
  fieldItemLocations: ReadonlyMap<string, readonly SourceLocation[]>;
}

const MAX_FRONTMATTER_BYTES = 256 * 1024;
const MAX_FRONTMATTER_NODES = 10_000;
const MAX_FRONTMATTER_DEPTH = 32;
const MAX_FRONTMATTER_COLLECTION_ITEMS = 2_000;
const MAX_FRONTMATTER_STRING_LENGTH = 64 * 1024;

/**
 * A parsed SKILL.md frontmatter block with source offsets preserved.
 */
export interface SkillFrontmatterBlock {
  raw: string;
  body: string;
  location: SourceLocation;
  yamlLocation: SourceLocation;
}

/**
 * Source locations for fields declared in a SKILL.md frontmatter block.
 */
export interface SkillFrontmatterLocations {
  frontmatter: SourceLocation;
  fields: ReadonlyMap<string, SourceLocation>;
  items: ReadonlyMap<string, readonly SourceLocation[]>;
}

const parsedSkillFrontmatterLocations = new WeakMap<ParsedSkillMd, SkillFrontmatterLocations>();

/**
 * Return source locations captured while parsing a SKILL.md frontmatter block.
 */
export function getSkillFrontmatterLocations(
  parsed: ParsedSkillMd
): SkillFrontmatterLocations | undefined {
  return parsedSkillFrontmatterLocations.get(parsed);
}

const YAML_FRONTMATTER_OPTIONS = {
  version: '1.2' as const,
  schema: 'core' as const,
  strict: true,
  stringKeys: true,
  uniqueKeys: true,
  merge: false,
  resolveKnownTags: false,
};

/**
 * Parse a SKILL.md file extracting frontmatter and content.
 *
 * @param content - Raw SKILL.md file content
 * @param sourceFile - Optional source path used in resolver diagnostics
 * @returns Parsed skill metadata and content
 */
export function parseSkillMd(content: string, sourceFile = '<skill>'): ParsedSkillMd {
  const frontmatter = extractSkillFrontmatter(content, sourceFile);

  if (frontmatter !== null) {
    // A SKILL.md that PromptScript generated carries a marker line in its
    // frontmatter. Drop it so re-ingesting the file does not carry a stale
    // marker (and its timestamp) into the next compilation output.
    const rawFrontmatter = stripFrontmatterMarkerLines(frontmatter.raw);
    const yamlFrontmatter = parseYamlFrontmatter(frontmatter, sourceFile);
    const parsed = parseFrontmatterFields(
      yamlFrontmatter.fields,
      sourceFile,
      frontmatter.location,
      yamlFrontmatter.fieldLocations,
      yamlFrontmatter.fieldItemLocations
    );

    const bodyContent = stripLeadingHtmlMarker(frontmatter.body).trim();

    const result: ParsedSkillMd = {
      name: parsed.name,
      description: parsed.description,
      content: bodyContent,
      params: parsed.params,
      inputs: parsed.inputs,
      outputs: parsed.outputs,
      references: parsed.references,
      scripts: parsed.scripts,
      license: parsed.license,
      compatibility: parsed.compatibility,
      metadata: parsed.metadata,
      allowedTools: parsed.allowedTools,
      rawFrontmatter,
    };
    parsedSkillFrontmatterLocations.set(result, {
      frontmatter: frontmatter.location,
      fields: yamlFrontmatter.fieldLocations,
      items: yamlFrontmatter.fieldItemLocations,
    });
    return result;
  }

  return {
    content: stripLeadingHtmlMarker(content).trim(),
  };
}

/**
 * Derive a skill name from a file path by stripping the .md extension.
 *
 * @param filePath - Absolute or relative path to a .md file
 * @returns The filename without the .md extension
 */
export function skillNameFromPath(filePath: string): string {
  return basename(filePath, '.md');
}

function findFrontmatterStart(lines: string[]): number {
  let index = 0;
  while (index < lines.length && (lines[index] ?? '').trim() === '') {
    index++;
  }
  return isFrontmatterDelimiter(lines[index], true) ? index : -1;
}

/**
 * Extract a SKILL.md frontmatter block using the same delimiter rules as the
 * parser and validator.
 */
export function extractSkillFrontmatter(
  content: string,
  sourceFile = '<skill>'
): SkillFrontmatterBlock | null {
  const lines = content.split('\n');
  const frontmatterStart = findFrontmatterStart(lines);
  if (frontmatterStart < 0) return null;

  let frontmatterEnd = -1;
  for (let i = frontmatterStart + 1; i < lines.length; i++) {
    if (isFrontmatterDelimiter(lines[i])) {
      frontmatterEnd = i;
      break;
    }
  }
  if (frontmatterEnd <= frontmatterStart) return null;

  const lineStarts = getLineStartOffsets(content);
  const openingLineStart = lineStarts[frontmatterStart] ?? 0;
  const openingLine = lines[frontmatterStart] ?? '';
  const openingDelimiterOffset =
    frontmatterStart === 0 && openingLine.startsWith('\uFEFF')
      ? openingLineStart + 1
      : openingLineStart;
  const yamlOffset = lineStarts[frontmatterStart + 1] ?? content.length;
  const closingOffset = lineStarts[frontmatterEnd] ?? content.length;
  const bodyOffset = lineStarts[frontmatterEnd + 1] ?? content.length;
  const yamlEnd = removeLineEndingBefore(content, closingOffset, yamlOffset);

  return {
    raw: content.slice(yamlOffset, yamlEnd),
    body: content.slice(bodyOffset),
    location: locationAtOffset(content, openingDelimiterOffset, sourceFile),
    yamlLocation: locationAtOffset(content, yamlOffset, sourceFile),
  };
}

function removeLineEndingBefore(content: string, offset: number, minimum: number): number {
  let end = offset;
  if (end > minimum && content[end - 1] === '\n') end--;
  if (end > minimum && content[end - 1] === '\r') end--;
  return end;
}

function getLineStartOffsets(content: string): number[] {
  const lineStarts = [0];
  for (let index = 0; index < content.length; index++) {
    if (content[index] === '\n') lineStarts.push(index + 1);
  }
  return lineStarts;
}

function locationAtOffset(content: string, offset: number, sourceFile: string): SourceLocation {
  const boundedOffset = Math.max(0, Math.min(offset, content.length));
  const prefix = content.slice(0, boundedOffset);
  const lineBreaks = prefix.match(/\n/g)?.length ?? 0;
  const lastLineBreak = prefix.lastIndexOf('\n');
  const column = lastLineBreak < 0 ? boundedOffset + 1 : boundedOffset - lastLineBreak;

  return {
    file: sourceFile,
    line: lineBreaks + 1,
    column,
    offset: boundedOffset,
  };
}

function isFrontmatterDelimiter(line: string | undefined, allowBom = false): boolean {
  if (line === undefined) return false;
  const withoutCarriageReturn = line.endsWith('\r') ? line.slice(0, -1) : line;
  const candidate =
    allowBom && withoutCarriageReturn.startsWith('\uFEFF')
      ? withoutCarriageReturn.slice(1)
      : withoutCarriageReturn;
  return candidate.trimEnd() === '---';
}

function parseYamlFrontmatter(
  frontmatter: SkillFrontmatterBlock,
  sourceFile: string
): ParsedYamlFrontmatter {
  if (Buffer.byteLength(frontmatter.raw, 'utf8') > MAX_FRONTMATTER_BYTES) {
    throw frontmatterError(
      `frontmatter exceeds ${MAX_FRONTMATTER_BYTES} bytes`,
      sourceFile,
      frontmatter.location
    );
  }

  const document = parseDocument(frontmatter.raw, YAML_FRONTMATTER_OPTIONS);
  if (document.errors.length > 0) {
    const error = document.errors[0]!;
    throw frontmatterError(
      `YAML parse error: ${error.message}`,
      sourceFile,
      getYamlLocation(frontmatter, sourceFile, error.pos[0])
    );
  }
  if (document.warnings.length > 0) {
    const warning = document.warnings[0]!;
    throw frontmatterError(
      `YAML warning is not supported: ${warning.message}`,
      sourceFile,
      getYamlLocation(frontmatter, sourceFile, warning.pos[0])
    );
  }

  rejectUnsafeYamlNodes(document.contents, sourceFile, frontmatter);
  enforceFrontmatterLimits(document.contents, sourceFile, frontmatter);
  const { fields: fieldLocations, items: fieldItemLocations } = getTopLevelFieldLocations(
    document.contents,
    sourceFile,
    frontmatter
  );

  let value: unknown;
  try {
    value = document.toJS({ maxAliasCount: 0 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw frontmatterError(
      `YAML value resolution failed: ${message}`,
      sourceFile,
      frontmatter.location
    );
  }

  if (document.contents === null) {
    return { fields: {}, fieldLocations, fieldItemLocations };
  }
  if (!isRecord(value)) {
    throw frontmatterError(
      'top-level frontmatter value must be a YAML mapping',
      sourceFile,
      frontmatter.location
    );
  }

  return { fields: value, fieldLocations, fieldItemLocations };
}

function getYamlLocation(
  frontmatter: SkillFrontmatterBlock,
  sourceFile: string,
  offset: number
): SourceLocation {
  const source = frontmatter.raw;
  const boundedOffset = Math.max(0, Math.min(offset, source.length));
  const prefix = source.slice(0, boundedOffset);
  const lineBreaks = prefix.match(/\n/g)?.length ?? 0;
  const lastLineBreak = prefix.lastIndexOf('\n');
  const column =
    lastLineBreak < 0
      ? frontmatter.yamlLocation.column + boundedOffset
      : boundedOffset - lastLineBreak;

  return {
    file: sourceFile,
    line: frontmatter.yamlLocation.line + lineBreaks,
    column,
    offset: (frontmatter.yamlLocation.offset ?? 0) + boundedOffset,
  };
}

function getTopLevelFieldLocations(
  node: unknown,
  sourceFile: string,
  frontmatter: SkillFrontmatterBlock
): {
  fields: ReadonlyMap<string, SourceLocation>;
  items: ReadonlyMap<string, readonly SourceLocation[]>;
} {
  const fieldLocations = new Map<string, SourceLocation>();
  const fieldItemLocations = new Map<string, readonly SourceLocation[]>();
  if (!isCollection(node)) return { fields: fieldLocations, items: fieldItemLocations };

  for (const item of node.items) {
    if (!isPair(item)) continue;
    const key = getScalarString(item.key);
    if (key === undefined) continue;

    const keyLocation = getNodeLocation(item.key, sourceFile, frontmatter);
    fieldLocations.set(key, keyLocation);
    if (isCollection(item.value)) {
      fieldItemLocations.set(
        key,
        item.value.items.map((value) => getNodeLocation(value, sourceFile, frontmatter))
      );
    }
  }

  return { fields: fieldLocations, items: fieldItemLocations };
}

function getScalarString(node: unknown): string | undefined {
  if (!isNode(node) || !('value' in node)) return undefined;
  const value = node.value;
  return typeof value === 'string' ? value : undefined;
}

function getNodeLocation(
  node: unknown,
  sourceFile: string,
  frontmatter: SkillFrontmatterBlock
): SourceLocation {
  if (!isNode(node) || !('range' in node)) return frontmatter.location;
  const range = node.range;
  if (!Array.isArray(range) || typeof range[0] !== 'number') return frontmatter.location;
  return getYamlLocation(frontmatter, sourceFile, range[0]);
}

function rejectUnsafeYamlNodes(
  node: unknown,
  sourceFile: string,
  frontmatter: SkillFrontmatterBlock
): void {
  if (!isNode(node)) return;

  if (isAlias(node)) {
    throw frontmatterError(
      'YAML aliases are not allowed',
      sourceFile,
      getNodeLocation(node, sourceFile, frontmatter)
    );
  }
  if (node.tag !== undefined) {
    throw frontmatterError(
      'explicit YAML tags are not allowed',
      sourceFile,
      getNodeLocation(node, sourceFile, frontmatter)
    );
  }
  if ('anchor' in node && node.anchor !== undefined) {
    throw frontmatterError(
      'YAML anchors are not allowed',
      sourceFile,
      getNodeLocation(node, sourceFile, frontmatter)
    );
  }

  if (!isCollection(node)) return;
  for (const item of node.items) {
    if (isPair(item)) {
      rejectUnsafeYamlNodes(item.key, sourceFile, frontmatter);
      rejectUnsafeYamlNodes(item.value, sourceFile, frontmatter);
    } else {
      rejectUnsafeYamlNodes(item, sourceFile, frontmatter);
    }
  }
}

function enforceFrontmatterLimits(
  value: unknown,
  sourceFile: string,
  frontmatter: SkillFrontmatterBlock,
  depth = 0,
  state: { nodes: number } = { nodes: 0 }
): void {
  if (value === null) {
    state.nodes++;
    if (state.nodes > MAX_FRONTMATTER_NODES) {
      throw frontmatterError(
        `frontmatter contains more than ${MAX_FRONTMATTER_NODES} values`,
        sourceFile,
        frontmatter.location
      );
    }
    return;
  }
  if (!isNode(value)) return;

  const location = getNodeLocation(value, sourceFile, frontmatter);
  state.nodes++;
  if (state.nodes > MAX_FRONTMATTER_NODES) {
    throw frontmatterError(
      `frontmatter contains more than ${MAX_FRONTMATTER_NODES} values`,
      sourceFile,
      location
    );
  }
  if (depth > MAX_FRONTMATTER_DEPTH) {
    throw frontmatterError(
      `frontmatter nesting exceeds ${MAX_FRONTMATTER_DEPTH} levels`,
      sourceFile,
      location
    );
  }

  if ('value' in value && typeof value.value === 'string') {
    if (value.value.length > MAX_FRONTMATTER_STRING_LENGTH) {
      throw frontmatterError(
        `frontmatter string exceeds ${MAX_FRONTMATTER_STRING_LENGTH} characters`,
        sourceFile,
        location
      );
    }
    return;
  }

  if (!isCollection(value)) return;
  if (value.items.length > MAX_FRONTMATTER_COLLECTION_ITEMS) {
    const collectionName = isSeq(value) ? 'sequence' : 'mapping';
    throw frontmatterError(
      `frontmatter ${collectionName} exceeds ${MAX_FRONTMATTER_COLLECTION_ITEMS} ${
        isSeq(value) ? 'items' : 'entries'
      }`,
      sourceFile,
      location
    );
  }

  for (const item of value.items) {
    if (isPair(item)) {
      enforceFrontmatterLimits(item.key, sourceFile, frontmatter, depth + 1, state);
      enforceFrontmatterLimits(item.value, sourceFile, frontmatter, depth + 1, state);
    } else {
      enforceFrontmatterLimits(item, sourceFile, frontmatter, depth + 1, state);
    }
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function createSafeRecord<T>(): Record<string, T> {
  return Object.create(null) as Record<string, T>;
}

function frontmatterError(
  message: string,
  sourceFile: string,
  location: SourceLocation
): ResolveError {
  return new ResolveError(`Invalid YAML frontmatter: ${message}`, {
    ...location,
    file: sourceFile,
  });
}

/**
 * Parse supported frontmatter fields.
 *
 * Unknown fields are intentionally ignored after structural YAML validation.
 * They remain available through rawFrontmatter so formatter-specific metadata
 * can round-trip without making the resolver depend on every extension.
 */
function parseFrontmatterFields(
  fields: Record<string, unknown>,
  sourceFile: string,
  fallbackLocation: SourceLocation,
  fieldLocations: ReadonlyMap<string, SourceLocation>,
  fieldItemLocations: ReadonlyMap<string, readonly SourceLocation[]>
): ParsedSkillFrontmatter {
  const name = readOptionalString(
    fields,
    'name',
    sourceFile,
    getFieldLocation('name', fieldLocations, fallbackLocation)
  );
  const description = readOptionalString(
    fields,
    'description',
    sourceFile,
    getFieldLocation('description', fieldLocations, fallbackLocation)
  );
  const license = readOptionalString(
    fields,
    'license',
    sourceFile,
    getFieldLocation('license', fieldLocations, fallbackLocation)
  );
  const compatibility = readCompatibilityField(
    fields,
    sourceFile,
    getFieldLocation('compatibility', fieldLocations, fallbackLocation)
  );
  const params = parseParamsField(
    fields,
    sourceFile,
    getFieldLocation('params', fieldLocations, fallbackLocation)
  );
  const inputs = parseContractFieldsField(
    fields,
    'inputs',
    sourceFile,
    getFieldLocation('inputs', fieldLocations, fallbackLocation)
  );
  const outputs = parseContractFieldsField(
    fields,
    'outputs',
    sourceFile,
    getFieldLocation('outputs', fieldLocations, fallbackLocation)
  );
  const references = parsePathField(
    fields,
    'references',
    sourceFile,
    getFieldLocation('references', fieldLocations, fallbackLocation),
    fieldItemLocations.get('references')
  );
  const scripts = parsePathField(
    fields,
    'scripts',
    sourceFile,
    getFieldLocation('scripts', fieldLocations, fallbackLocation),
    fieldItemLocations.get('scripts')
  );
  const metadata = parseMetadataField(
    fields,
    sourceFile,
    getFieldLocation('metadata', fieldLocations, fallbackLocation)
  );
  const allowedTools = parseAllowedToolsField(
    fields,
    sourceFile,
    getFieldLocation('allowed-tools', fieldLocations, fallbackLocation)
  );

  return {
    name,
    description,
    params,
    inputs,
    outputs,
    references,
    scripts,
    license,
    compatibility,
    metadata,
    allowedTools,
  };
}

function getFieldLocation(
  field: string,
  fieldLocations: ReadonlyMap<string, SourceLocation>,
  fallbackLocation: SourceLocation
): SourceLocation {
  return fieldLocations.get(field) ?? fallbackLocation;
}

function readOptionalString(
  fields: Record<string, unknown>,
  field: string,
  sourceFile: string,
  location: SourceLocation
): string | undefined {
  if (!Object.hasOwn(fields, field)) return undefined;
  const value = fields[field];
  if (typeof value !== 'string') {
    throw frontmatterError(`field "${field}" must be a string`, sourceFile, location);
  }
  return value;
}

function readCompatibilityField(
  fields: Record<string, unknown>,
  sourceFile: string,
  location: SourceLocation
): string | undefined {
  if (!Object.hasOwn(fields, 'compatibility')) return undefined;
  const value = fields['compatibility'];
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && value.every((item) => typeof item === 'string')) {
    return value.join(', ');
  }
  throw frontmatterError(
    'field "compatibility" must be a string or a sequence of strings',
    sourceFile,
    location
  );
}

function parsePathField(
  fields: Record<string, unknown>,
  field: 'references' | 'scripts',
  sourceFile: string,
  location: SourceLocation,
  itemLocations: readonly SourceLocation[] = []
): string[] | undefined {
  if (!Object.hasOwn(fields, field)) return undefined;
  const value = fields[field];
  if (value === null) return [];
  if (!Array.isArray(value)) {
    throw frontmatterError(
      `field "${field}" must be a sequence of relative paths`,
      sourceFile,
      location
    );
  }

  return value.map((item, index) => {
    if (typeof item !== 'string') {
      throw frontmatterError(
        `field "${field}" item ${index + 1} must be a string`,
        sourceFile,
        itemLocations[index] ?? location
      );
    }
    const normalized = normalizeSafeRelativePath(item);
    return normalized ?? item;
  });
}

function parseParamsField(
  fields: Record<string, unknown>,
  sourceFile: string,
  location: SourceLocation
): ParamDefinition[] | undefined {
  if (!Object.hasOwn(fields, 'params')) return undefined;
  const value = fields['params'];
  if (value === null) return [];
  if (!isRecord(value)) {
    throw frontmatterError(
      'field "params" must be a mapping of parameter names',
      sourceFile,
      location
    );
  }

  const params: ParamDefinition[] = [];
  for (const [name, definition] of Object.entries(value)) {
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) {
      throw frontmatterError(
        `parameter name "${name}" must be a valid identifier`,
        sourceFile,
        location
      );
    }
    if (!isRecord(definition)) {
      throw frontmatterError(`parameter "${name}" must be a mapping`, sourceFile, location);
    }

    const paramType = parseTypedFieldType(definition, `parameter "${name}"`, sourceFile, location);
    const hasDefault = Object.hasOwn(definition, 'default');
    const defaultValue = hasDefault
      ? parseTypedDefault(
          definition['default'],
          paramType,
          `parameter "${name}"`,
          sourceFile,
          location
        )
      : undefined;

    let resolvedType = paramType;
    if (paramType.kind === 'enum' && Object.hasOwn(definition, 'options')) {
      resolvedType = {
        kind: 'enum',
        options: readStringSequence(
          definition['options'],
          `parameter "${name}" options`,
          sourceFile,
          location
        ),
      };
    }

    params.push({
      type: 'ParamDefinition',
      name,
      paramType: resolvedType,
      optional: hasDefault,
      ...(hasDefault ? { defaultValue } : {}),
      loc: location,
    });
  }

  return params;
}

function parseContractFieldsField(
  fields: Record<string, unknown>,
  fieldName: 'inputs' | 'outputs',
  sourceFile: string,
  location: SourceLocation
): Record<string, SkillContractField> | undefined {
  if (!Object.hasOwn(fields, fieldName)) return undefined;
  const value = fields[fieldName];
  if (value === null) return createSafeRecord<SkillContractField>();
  if (!isRecord(value)) {
    throw frontmatterError(
      `field "${fieldName}" must be a mapping of fields`,
      sourceFile,
      location
    );
  }

  const result = createSafeRecord<SkillContractField>();
  for (const [name, definition] of Object.entries(value)) {
    if (!isRecord(definition)) {
      throw frontmatterError(
        `${fieldName} field "${name}" must be a mapping`,
        sourceFile,
        location
      );
    }

    const type = parseContractType(
      definition,
      `${fieldName} field "${name}"`,
      sourceFile,
      location
    );
    const description =
      readOptionalStringFromRecord(
        definition,
        'description',
        `${fieldName} field "${name}"`,
        sourceFile,
        location
      ) ?? '';
    const contract: SkillContractField = { description, type };

    if (Object.hasOwn(definition, 'options')) {
      contract.options = readStringSequence(
        definition['options'],
        `${fieldName} field "${name}" options`,
        sourceFile,
        location
      );
    }
    if (Object.hasOwn(definition, 'default')) {
      contract.default = parseTypedDefault(
        definition['default'],
        type,
        `${fieldName} field "${name}"`,
        sourceFile,
        location
      );
    }
    result[name] = contract;
  }

  return result;
}

function parseTypedFieldType(
  definition: Record<string, unknown>,
  context: string,
  sourceFile: string,
  location: SourceLocation
): ParamType {
  if (!Object.hasOwn(definition, 'type')) {
    return { kind: 'string' };
  }
  const value = definition['type'];
  if (typeof value !== 'string' || !['string', 'number', 'boolean', 'enum'].includes(value)) {
    throw frontmatterError(
      `${context} type must be string, number, boolean, or enum`,
      sourceFile,
      location
    );
  }
  if (value === 'enum') return { kind: 'enum', options: [] };
  return { kind: value as 'string' | 'number' | 'boolean' };
}

function parseContractType(
  definition: Record<string, unknown>,
  context: string,
  sourceFile: string,
  location: SourceLocation
): SkillContractField['type'] {
  if (!Object.hasOwn(definition, 'type')) return 'string';
  const value = definition['type'];
  if (typeof value !== 'string' || !['string', 'number', 'boolean', 'enum'].includes(value)) {
    throw frontmatterError(
      `${context} type must be string, number, boolean, or enum`,
      sourceFile,
      location
    );
  }
  return value as SkillContractField['type'];
}

function parseTypedDefault(
  value: unknown,
  type: ParamType | SkillContractField['type'],
  context: string,
  sourceFile: string,
  location: SourceLocation
): Value {
  const kind = typeof type === 'string' ? type : type.kind;
  if (value === null) return null;

  switch (kind) {
    case 'string':
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        return String(value);
      }
      return toPromptValue(value, context, sourceFile, location);
    case 'number': {
      const numberValue =
        typeof value === 'number'
          ? value
          : typeof value === 'string' && value.trim().length > 0
            ? Number(value)
            : NaN;
      if (!Number.isFinite(numberValue)) {
        throw frontmatterError(`${context} default must be a finite number`, sourceFile, location);
      }
      return numberValue;
    }
    case 'boolean':
      if (typeof value === 'boolean') return value;
      if (value === 'true') return true;
      if (value === 'false') return false;
      throw frontmatterError(`${context} default must be a boolean`, sourceFile, location);
    case 'enum':
      if (typeof value !== 'string') {
        throw frontmatterError(`${context} default must be a string`, sourceFile, location);
      }
      return value;
  }
}

function toPromptValue(
  value: unknown,
  context: string,
  sourceFile: string,
  location: SourceLocation
): Value {
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => toPromptValue(item, context, sourceFile, location));
  }
  if (isRecord(value)) {
    const result = createSafeRecord<Value>();
    for (const [key, item] of Object.entries(value)) {
      result[key] = toPromptValue(item, context, sourceFile, location);
    }
    return result;
  }
  throw frontmatterError(`${context} default contains an unsupported value`, sourceFile, location);
}

function readStringSequence(
  value: unknown,
  context: string,
  sourceFile: string,
  location: SourceLocation
): string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    throw frontmatterError(`${context} must be a sequence of strings`, sourceFile, location);
  }
  return value.map((item) => item as string);
}

function readOptionalStringFromRecord(
  record: Record<string, unknown>,
  field: string,
  context: string,
  sourceFile: string,
  location: SourceLocation
): string | undefined {
  if (!Object.hasOwn(record, field)) return undefined;
  const value = record[field];
  if (typeof value !== 'string') {
    throw frontmatterError(`${context} ${field} must be a string`, sourceFile, location);
  }
  return value;
}

function parseMetadataField(
  fields: Record<string, unknown>,
  sourceFile: string,
  location: SourceLocation
): Record<string, string> | undefined {
  if (!Object.hasOwn(fields, 'metadata')) return undefined;
  const value = fields['metadata'];
  if (!isRecord(value)) {
    throw frontmatterError('field "metadata" must be a mapping', sourceFile, location);
  }

  const metadata = createSafeRecord<string>();
  for (const [key, item] of Object.entries(value)) {
    if (typeof item !== 'string') {
      throw frontmatterError(`metadata value "${key}" must be a string`, sourceFile, location);
    }
    metadata[key] = item;
  }
  return metadata;
}

function parseAllowedToolsField(
  fields: Record<string, unknown>,
  sourceFile: string,
  location: SourceLocation
): string[] | undefined {
  if (!Object.hasOwn(fields, 'allowed-tools')) return undefined;
  const value = fields['allowed-tools'];
  if (value === null) return [];
  if (typeof value === 'string') {
    return value.split(/\s+/).filter((item) => item.length > 0);
  }
  return readStringSequence(value, 'field "allowed-tools"', sourceFile, location);
}

function normalizeSafeRelativePath(value: string): string | undefined {
  if (value.length === 0 || value.includes('\0')) return undefined;
  const portable = value.replace(/\\/g, '/');
  if (portable.startsWith('/') || /^[A-Za-z]:/.test(portable)) return undefined;

  const segments = portable.split('/');
  const normalized: string[] = [];
  for (const segment of segments) {
    if (segment === '' || segment === '.') continue;
    if (segment === '..') return undefined;
    normalized.push(segment);
  }
  return normalized.length > 0 ? normalized.join('/') : undefined;
}

function isSafeRelativePath(relPath: string): boolean {
  return normalizeSafeRelativePath(relPath) !== undefined;
}

/**
 * Interpolate skill content with parameter values.
 *
 * Binds provided arguments and defaults to {{variable}} placeholders
 * in the skill content string.
 *
 * @param content - Skill content with {{variable}} placeholders
 * @param params - Parameter definitions from SKILL.md frontmatter
 * @param args - Argument values provided at the call site
 * @returns Interpolated content string
 */
export function interpolateSkillContent(
  content: string,
  params: ParamDefinition[] | undefined,
  args: Record<string, Value>
): string {
  if (!params || params.length === 0) {
    return content;
  }

  // Build bound values map: args override defaults
  const bound = new Map<string, Value>();
  for (const param of params) {
    const argValue = args[param.name];
    if (argValue !== undefined) {
      bound.set(param.name, argValue);
    } else if (param.defaultValue !== undefined) {
      bound.set(param.name, param.defaultValue);
    } else if (!param.optional) {
      throw new Error(`Missing required skill parameter: ${param.name}`);
    }
  }

  // Replace {{variable}} patterns
  return content.replace(/\{\{(\w+)\}\}/g, (_match, varName: string) => {
    const value = bound.get(varName);
    if (value === undefined) {
      return _match;
    }
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    return JSON.stringify(value);
  });
}

/**
 * Extract skill argument values from a .prs skill object.
 * Arguments can be in a nested `params` object or as top-level properties.
 */
const SKILL_RESERVED_KEYS = new Set([
  'description',
  'content',
  'trigger',
  'userInvocable',
  'allowedTools',
  'disableModelInvocation',
  'context',
  'agent',
  'params',
  'type',
  'loc',
  'resources',
  'references',
  'scripts',
  'license',
  'compatibility',
  'metadata',
  'allowed-tools',
]);

function extractSkillArgs(skillObj: Record<string, Value>): Record<string, Value> {
  const args: Record<string, Value> = {};

  // Check for params object (nested arguments)
  const paramsVal = skillObj['params'];
  if (paramsVal && typeof paramsVal === 'object' && !Array.isArray(paramsVal)) {
    const paramsObj = paramsVal as Record<string, Value>;
    for (const [key, value] of Object.entries(paramsObj)) {
      if (key !== 'type' && key !== 'loc') {
        args[key] = value;
      }
    }
  }

  // Also extract top-level non-reserved properties as potential args
  for (const [key, value] of Object.entries(skillObj)) {
    if (!SKILL_RESERVED_KEYS.has(key) && !(key in args)) {
      args[key] = value;
    }
  }

  return args;
}

/** Files to skip when discovering skill resources. */
const SKIP_FILES = new Set([
  'SKILL.md',
  '.skillignore',
  '.DS_Store',
  'Thumbs.db',
  '.gitignore',
  '.gitkeep',
  '.npmrc',
  '.npmignore',
  '.env',
  '.env.local',
  '.env.production',
  '.editorconfig',
  '.prettierrc',
  '.prettierrc.json',
  '.prettierrc.yaml',
  '.prettierrc.yml',
  '.prettierignore',
  '.eslintrc',
  '.eslintrc.js',
  '.eslintrc.cjs',
  '.eslintrc.json',
  '.eslintrc.yaml',
  '.eslintrc.yml',
  'eslint.config.js',
  'eslint.config.cjs',
  'eslint.config.mjs',
  'eslint.base.config.cjs',
  '.release-please-manifest.json',
  'release-please-config.json',
  'package-lock.json',
  'pnpm-lock.yaml',
  'pnpm-workspace.yaml',
  'yarn.lock',
  'tsconfig.json',
  'tsconfig.base.json',
  'tsconfig.build.json',
  'tsconfig.spec.json',
  'jest.config.ts',
  'jest.config.js',
  'vitest.config.ts',
  'vitest.config.js',
  'vite.config.ts',
  'vite.config.js',
  'nx.json',
  'project.json',
  'package.json',
  'Makefile',
  'Dockerfile',
  'docker-compose.yml',
  'docker-compose.yaml',
  '.dockerignore',
  'LICENSE',
  'LICENSE.md',
  'CHANGELOG.md',
  'CONTRIBUTING.md',
  'CODE_OF_CONDUCT.md',
  'ROADMAP.md',
]);

/** Directory names to skip entirely. */
const SKIP_DIRS = new Set([
  'node_modules',
  '__pycache__',
  '.git',
  '.svn',
  '.github',
  '.husky',
  '.vscode',
  '.idea',
  '.verdaccio',
  '.nx',
  '.cache',
  '.turbo',
  'dist',
  'build',
  'out',
  'coverage',
  'tmp',
  '.tmp',
  'e2e',
  '__tests__',
  '__mocks__',
  '__fixtures__',
  'test',
  'tests',
  'spec',
  'fixtures',
]);

/**
 * Convert a simple gitignore-style glob pattern to a RegExp.
 *
 * Supports: `*` (any non-slash chars), `**` (any path), `?` (single char),
 * trailing `/` (directory match), and character classes `[abc]`.
 *
 * Patterns without a `/` match against the basename only.
 * Patterns with a `/` match against the full relative path.
 */
function globToRegex(pattern: string): { regex: RegExp; matchPath: boolean } {
  // If pattern ends with /, it matches directories (we match path prefixes)
  const isDirPattern = pattern.endsWith('/');
  const cleanPattern = isDirPattern ? pattern.slice(0, -1) : pattern;

  // Determine if pattern should match against full path or just basename
  const matchPath = cleanPattern.includes('/');

  let regexStr = '';
  let i = 0;
  while (i < cleanPattern.length) {
    const char = cleanPattern[i]!;
    if (char === '*') {
      if (cleanPattern[i + 1] === '*') {
        // ** matches any path segment(s)
        if (cleanPattern[i + 2] === '/') {
          regexStr += '(?:.+/)?';
          i += 3;
        } else {
          regexStr += '.*';
          i += 2;
        }
      } else {
        // * matches anything except /
        regexStr += '[^/]*';
        i++;
      }
    } else if (char === '?') {
      regexStr += '[^/]';
      i++;
    } else if (char === '[') {
      // Character class - pass through until ]
      const closeIdx = cleanPattern.indexOf(']', i + 1);
      if (closeIdx > i) {
        regexStr += cleanPattern.slice(i, closeIdx + 1);
        i = closeIdx + 1;
      } else {
        regexStr += '\\[';
        i++;
      }
    } else if ('.+^${}()|\\'.includes(char)) {
      regexStr += '\\' + char;
      i++;
    } else {
      regexStr += char;
      i++;
    }
  }

  if (isDirPattern) {
    // Directory pattern matches the dir name or anything under it
    return { regex: new RegExp(`^${regexStr}(?:/|$)`), matchPath: true };
  }

  return { regex: new RegExp(`^${regexStr}$`), matchPath };
}

/**
 * A compiled set of .skillignore rules for matching relative paths.
 */
interface SkillIgnoreRules {
  patterns: Array<{ regex: RegExp; matchPath: boolean; negated: boolean }>;
}

/**
 * Parse a .skillignore file content into compiled rules.
 * Format follows gitignore conventions:
 * - Lines starting with # are comments
 * - Empty lines are ignored
 * - Lines starting with ! are negation (re-include)
 * - Trailing / matches directories
 * - Patterns without / match basename; with / match full path
 */
function parseSkillIgnore(content: string): SkillIgnoreRules {
  const patterns: SkillIgnoreRules['patterns'] = [];

  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const negated = line.startsWith('!');
    const pattern = negated ? line.slice(1) : line;
    if (!pattern) continue;

    const { regex, matchPath } = globToRegex(pattern);
    patterns.push({ regex, matchPath, negated });
  }

  return { patterns };
}

/**
 * Check if a relative path is ignored by .skillignore rules.
 * Uses gitignore semantics: last matching pattern wins.
 */
function isIgnoredByRules(relPath: string, rules: SkillIgnoreRules): boolean {
  const basename = relPath.split('/').pop() ?? relPath;
  let ignored = false;

  for (const { regex, matchPath, negated } of rules.patterns) {
    const target = matchPath ? relPath : basename;
    if (regex.test(target)) {
      ignored = !negated;
    }
  }

  return ignored;
}

/**
 * Load and parse a .skillignore file from a skill directory.
 * Returns null if no .skillignore exists.
 */
async function loadSkillIgnore(skillDir: string): Promise<SkillIgnoreRules | null> {
  const ignorePath = resolve(skillDir, '.skillignore');
  try {
    const content = await readFile(ignorePath, 'utf-8');
    return parseSkillIgnore(content);
  } catch {
    return null;
  }
}

/** Maximum size (in bytes) for a single resource file. */
const MAX_RESOURCE_SIZE = 1_048_576; // 1 MB

/** Maximum total size (in bytes) for all resource files in a skill. */
const MAX_TOTAL_RESOURCE_SIZE = 10_485_760; // 10 MB

/** Maximum number of resource files per skill. */
const MAX_RESOURCE_COUNT = 100;

/**
 * Check if a skill name is safe (no path traversal characters).
 */
function isSafeSkillName(name: string): boolean {
  return !name.includes('..') && !name.includes('/') && !name.includes('\\');
}

/** No-op logger for when no logger is provided. */
const noopLogger: Logger = {
  verbose: () => {},
  debug: () => {},
  /* v8 ignore next 1 */
  warn: () => {},
};

/**
 * Discover resource files in a skill directory (everything except SKILL.md).
 * Skips symlinks, validates paths against traversal, enforces size/count limits,
 * and rejects binary files.
 *
 * @param skillDir - Absolute path to the skill directory
 * @param logger - Optional logger for reporting skipped files
 * @returns Array of resource files with relative paths and content
 */
export async function discoverSkillResources(
  skillDir: string,
  logger: Logger = noopLogger
): Promise<SkillResource[]> {
  // Load .skillignore rules if present
  const ignoreRules = await loadSkillIgnore(skillDir);

  const entries = await readdir(skillDir, { recursive: true, withFileTypes: true });
  const resources: SkillResource[] = [];
  let totalSize = 0;

  // Resolve the real path of the skill directory to compare against
  const realSkillDir = await realpath(skillDir);

  for (const entry of entries) {
    // Enforce aggregate count limit
    if (resources.length >= MAX_RESOURCE_COUNT) {
      logger.verbose(`Skill resource limit reached (${MAX_RESOURCE_COUNT} files) in ${skillDir}`);
      break;
    }

    if (!entry.isFile()) {
      // Skip known junk directories early (won't prevent readdir from listing them,
      // but their children will be filtered by path check below)
      if (entry.isDirectory() && SKIP_DIRS.has(entry.name)) continue;
      continue;
    }
    // Skip symlinks reported by readdir
    if (entry.isSymbolicLink()) continue;

    if (SKIP_FILES.has(entry.name)) continue;

    const fullPath = resolve(entry.parentPath, entry.name);
    const relPath = relative(skillDir, fullPath);

    // Use forward slashes for consistent pattern matching
    const relPathNormalized = relPath.split(sep).join('/');

    // Skip files inside skipped directories
    const pathSegments = relPath.split(sep);
    if (pathSegments.some((s) => SKIP_DIRS.has(s))) continue;

    // Apply .skillignore rules
    if (ignoreRules && isIgnoredByRules(relPathNormalized, ignoreRules)) {
      logger.debug(`Skipping resource ignored by .skillignore: ${relPath}`);
      continue;
    }

    // Validate no path traversal
    if (!isSafeRelativePath(relPath)) {
      logger.verbose(`Skipping resource with unsafe path: ${relPath}`);
      continue;
    }

    try {
      // Use lstat to detect symlinks (stat follows them, lstat does not)
      const fileStat = await lstat(fullPath);
      if (fileStat.isSymbolicLink()) {
        logger.verbose(`Skipping symlink resource: ${relPath}`);
        continue;
      }
      if (fileStat.size > MAX_RESOURCE_SIZE) {
        logger.verbose(`Skipping oversized resource (${fileStat.size} bytes): ${relPath}`);
        continue;
      }

      // Verify the resolved real path is still within the skill directory
      // This catches files inside symlinked directories
      const realFullPath = await realpath(fullPath);
      if (!isInside(realSkillDir, realFullPath) || realFullPath === realSkillDir) {
        logger.verbose(`Skipping resource outside skill directory: ${relPath}`);
        continue;
      }

      // Enforce aggregate size limit
      totalSize += fileStat.size;
      if (totalSize > MAX_TOTAL_RESOURCE_SIZE) {
        logger.verbose(
          `Skill total resource size limit reached (${MAX_TOTAL_RESOURCE_SIZE} bytes)`
        );
        break;
      }

      const content = await readFile(fullPath, 'utf-8');

      // Reject binary files: null bytes are a strong indicator of binary content
      if (content.includes('\0')) {
        logger.verbose(`Skipping binary resource: ${relPath}`);
        totalSize -= fileStat.size; // Don't count rejected files
        continue;
      }

      resources.push({ relativePath: relPath, content, origin: fullPath });
    } catch {
      // Skip files that can't be read (permissions, I/O errors)
      logger.verbose(`Skipping unreadable resource: ${relPath}`);
    }
  }

  return resources;
}

function getResourceFallbackLocation(
  basePath: string,
  frontmatterLocation: SourceLocation | undefined
): SourceLocation {
  return (
    frontmatterLocation ?? {
      file: resolve(basePath, 'SKILL.md'),
      line: 1,
      column: 1,
    }
  );
}

/**
 * Load reference files listed in a SKILL.md `references` frontmatter array.
 *
 * Validates each path against traversal attacks, enforces per-file and
 * aggregate size limits, and enforces the max resource count.
 *
 * @param references - Relative paths listed in the SKILL.md frontmatter
 * @param basePath - Absolute path to the skill directory (anchor for relative paths)
 * @param logger - Optional logger for warnings
 * @param frontmatterLocation - Frontmatter block location for diagnostics
 * @param itemLocations - Locations of individual reference entries
 * @returns Array of loaded SkillResource objects
 */
export async function resolveSkillReferences(
  references: string[],
  basePath: string,
  logger?: Logger,
  frontmatterLocation?: SourceLocation,
  itemLocations: readonly SourceLocation[] = []
): Promise<SkillResource[]> {
  const resources: SkillResource[] = [];
  let totalSize = 0;
  const fallbackLocation = getResourceFallbackLocation(basePath, frontmatterLocation);

  for (const [index, ref] of references.entries()) {
    const resourceLocation = itemLocations[index] ?? fallbackLocation;
    const normalizedRef = normalizeSafeRelativePath(ref);
    if (!normalizedRef) {
      throw new ResolveError(`Unsafe path in references: ${ref} - path traversal not allowed`, {
        ...resourceLocation,
      });
    }

    const fullPath = resolve(basePath, normalizedRef);

    let referenceStat;
    try {
      referenceStat = await lstat(fullPath);
    } catch {
      throw new ResolveError(`Reference file not found: ${normalizedRef}`, {
        ...resourceLocation,
      });
    }
    if (referenceStat.isSymbolicLink()) {
      throw new ResolveError(`Unsafe symbolic link in references: ${normalizedRef}`, {
        ...resourceLocation,
      });
    }

    let realBasePath: string;
    let realFullPath: string;
    try {
      [realBasePath, realFullPath] = await Promise.all([realpath(basePath), realpath(fullPath)]);
    } catch {
      throw new ResolveError(`Reference file not found: ${normalizedRef}`, {
        ...resourceLocation,
      });
    }
    if (!isInside(realBasePath, realFullPath) || realBasePath === realFullPath) {
      throw new ResolveError(`Reference path escapes skill directory: ${normalizedRef}`, {
        ...resourceLocation,
      });
    }

    let content: string;
    try {
      content = await readFile(fullPath, 'utf-8');
    } catch {
      throw new ResolveError(`Reference file not found: ${normalizedRef}`, {
        ...resourceLocation,
      });
    }

    const size = Buffer.byteLength(content, 'utf-8');

    if (size > MAX_RESOURCE_SIZE) {
      throw new ResolveError(
        `Reference file exceeds ${MAX_RESOURCE_SIZE / 1_048_576}MB limit: ${normalizedRef}`,
        resourceLocation
      );
    }

    totalSize += size;
    if (totalSize > MAX_TOTAL_RESOURCE_SIZE) {
      throw new ResolveError(
        `Total reference size exceeds ${MAX_TOTAL_RESOURCE_SIZE / 1_048_576}MB limit for skill`,
        resourceLocation
      );
    }

    if (size === 0) {
      logger?.verbose(`Empty reference file: ${normalizedRef}`);
    }

    resources.push({ relativePath: normalizedRef, content, origin: fullPath });
  }

  // Deduplicate by basename - last occurrence wins (higher layer override)
  const byBasename = new Map<string, number>();
  for (let i = 0; i < resources.length; i++) {
    const bname = resources[i]!.relativePath.split('/').pop() ?? resources[i]!.relativePath;
    const prevIdx = byBasename.get(bname);
    if (prevIdx !== undefined) {
      logger?.verbose(`Reference ${bname} overridden — later layer's version wins`);
      // Mark previous for removal
      resources[prevIdx] = null as unknown as SkillResource;
    }
    byBasename.set(bname, i);
  }
  const deduplicated = resources.filter((r): r is SkillResource => r !== null);

  if (deduplicated.length > MAX_RESOURCE_COUNT) {
    throw new ResolveError(
      `Too many reference files (${deduplicated.length}, max ${MAX_RESOURCE_COUNT})`,
      fallbackLocation
    );
  }

  return deduplicated;
}

/**
 * Load script files listed in a SKILL.md `scripts` frontmatter array.
 *
 * Scripts are loaded under `scripts/<basename>` in the skill resource tree.
 * Source executable mode bits are recorded in the `SkillResource.executable`
 * field for downstream formatter propagation.
 *
 * @param scripts - Relative paths listed in the SKILL.md frontmatter
 * @param basePath - Absolute path to the skill directory
 * @param logger - Optional logger for warnings
 * @param frontmatterLocation - Frontmatter block location for diagnostics
 * @param itemLocations - Locations of individual script entries
 * @returns Array of loaded SkillResource objects with origin and executable metadata
 */
export async function resolveSkillScripts(
  scripts: string[],
  basePath: string,
  logger?: Logger,
  frontmatterLocation?: SourceLocation,
  itemLocations: readonly SourceLocation[] = []
): Promise<SkillResource[]> {
  const fallbackLocation = getResourceFallbackLocation(basePath, frontmatterLocation);
  if (scripts.length > MAX_RESOURCE_COUNT) {
    throw new ResolveError(`Too many script files (${scripts.length}, max ${MAX_RESOURCE_COUNT})`, {
      ...fallbackLocation,
    });
  }

  const resources: SkillResource[] = [];
  let totalSize = 0;
  const seenBasenames = new Set<string>();

  for (const [index, scriptPath] of scripts.entries()) {
    const resourceLocation = itemLocations[index] ?? fallbackLocation;
    const normalizedScriptPath = normalizeSafeRelativePath(scriptPath);
    if (!normalizedScriptPath) {
      throw new ResolveError(`Unsafe path in scripts: ${scriptPath} - path traversal not allowed`, {
        ...resourceLocation,
      });
    }

    const fullPath = resolve(basePath, normalizedScriptPath);
    const basenameStr = basename(normalizedScriptPath);

    // Reject duplicate basenames
    if (seenBasenames.has(basenameStr)) {
      throw new ResolveError(`Duplicate script basename: ${basenameStr}`, {
        ...resourceLocation,
      });
    }
    seenBasenames.add(basenameStr);

    let stat;
    try {
      stat = await lstat(fullPath);
    } catch {
      throw new ResolveError(`Script file not found: ${normalizedScriptPath}`, {
        ...resourceLocation,
      });
    }
    if (stat.isSymbolicLink()) {
      throw new ResolveError(`Unsafe symbolic link in scripts: ${normalizedScriptPath}`, {
        ...resourceLocation,
      });
    }

    let realBasePath: string;
    let realFullPath: string;
    try {
      [realBasePath, realFullPath] = await Promise.all([realpath(basePath), realpath(fullPath)]);
    } catch {
      throw new ResolveError(`Script file not found: ${normalizedScriptPath}`, {
        ...resourceLocation,
      });
    }
    if (!isInside(realBasePath, realFullPath) || realBasePath === realFullPath) {
      throw new ResolveError(`Script path escapes skill directory: ${normalizedScriptPath}`, {
        ...resourceLocation,
      });
    }

    let content: string;
    try {
      content = await readFile(fullPath, 'utf-8');
    } catch {
      throw new ResolveError(`Script file not found: ${normalizedScriptPath}`, {
        ...resourceLocation,
      });
    }

    // Check executable mode bits (any of user/group/other execute)
    const executable = Boolean(stat.mode & 0o111);

    const size = Buffer.byteLength(content, 'utf-8');

    if (size > MAX_RESOURCE_SIZE) {
      throw new ResolveError(
        `Script file exceeds ${MAX_RESOURCE_SIZE / 1_048_576}MB limit: ${normalizedScriptPath}`,
        resourceLocation
      );
    }

    totalSize += size;
    if (totalSize > MAX_TOTAL_RESOURCE_SIZE) {
      throw new ResolveError(
        `Total script size exceeds ${MAX_TOTAL_RESOURCE_SIZE / 1_048_576}MB limit for skill`,
        resourceLocation
      );
    }

    if (size === 0) {
      logger?.verbose(`Empty script file: ${scriptPath}`);
    }

    resources.push({
      relativePath: `scripts/${basenameStr}`,
      content,
      origin: fullPath,
      executable,
    });
  }

  return resources;
}

/**
 * Check if a file exists.
 */
async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * Options for native skill resolution.
 */
export interface NativeSkillOptions {
  /**
   * Path to the universal directory for auto-discovering skills and commands.
   * When set, skills are discovered from `<universalDir>/skills/` and commands from `<universalDir>/commands/`.
   * Defaults to undefined (disabled). Typically set to `.agents`.
   */
  universalDir?: string;
  /**
   * Project root the universal directory sits in. Without it the root is
   * guessed as the parent of `localPath`, which only holds while `localPath`
   * is the `.promptscript` directory.
   */
  projectRoot?: string;
  /** Logger for reporting skipped files and resolution decisions. */
  logger?: Logger;
}

/**
 * Resolve the directory the universal directory (`.agents`, ...) sits in.
 *
 * @param localPath - Base path for local discovery
 * @param projectRoot - Configured project root, when known
 * @returns Absolute path to search the universal directory under
 */
function universalRoot(localPath: string, projectRoot: string | undefined): string {
  return projectRoot ? resolve(projectRoot) : resolve(localPath, '..');
}

function isInside(root: string, candidate: string): boolean {
  const relation = relative(root, candidate);
  return (
    relation === '' ||
    (relation !== '..' && !relation.startsWith(`..${sep}`) && !isAbsolute(relation))
  );
}

async function resolveUniversalDiscoveryDir(
  localPath: string,
  options: NativeSkillOptions,
  contentDir: 'skills' | 'commands' | 'agents'
): Promise<string | null> {
  const portableDir = options.universalDir?.replace(/\\/g, '/');
  if (!portableDir || portableDir.startsWith('/') || /^[a-zA-Z]:\//.test(portableDir)) {
    return null;
  }

  const segments = portableDir.split('/').filter((segment) => segment.length > 0);
  if (
    segments.length === 0 ||
    segments.some((segment) => segment === '..' || /^[a-zA-Z]:/.test(segment))
  ) {
    return null;
  }

  const root = universalRoot(localPath, options.projectRoot);
  const candidate = resolve(root, ...segments, contentDir);

  try {
    const [realRoot, realCandidate] = await Promise.all([realpath(root), realpath(candidate)]);
    return isInside(realRoot, realCandidate) ? realCandidate : null;
  } catch {
    return null;
  }
}

/**
 * Check whether a file is PromptScript compilation output.
 *
 * A universal directory such as `.agents/` doubles as a compile target, so
 * files found there may be output from an earlier run. Such files are never
 * valid sources: re-ingesting them would let generated formatting overwrite
 * the original definition.
 *
 * @param filePath - Absolute path to a candidate source file
 * @returns True when the file carries a PromptScript generation marker
 */
async function isGeneratedOutput(filePath: string): Promise<boolean> {
  try {
    return isGeneratedByPromptScript(await readFile(filePath, 'utf-8'));
  } catch {
    return false;
  }
}

/**
 * Discover skill directories in a given base path, recursively.
 * Each subdirectory containing a SKILL.md is considered a skill.
 * The skill name is the immediate parent directory of SKILL.md.
 * Shallower skills take precedence over deeper ones with the same name.
 *
 * @param basePath - Absolute path to the skills directory (e.g. .promptscript/skills/)
 * @returns Map of skill name → absolute directory path
 */
async function discoverSkillDirs(basePath: string): Promise<Map<string, string>> {
  const result = new Map<string, string>();

  // BFS: process all entries at each depth level before going deeper
  const queue: Array<{ dir: string; depth: number }> = [{ dir: basePath, depth: 0 }];

  while (queue.length > 0) {
    const { dir, depth } = queue.shift()!;

    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (SKIP_DIRS.has(entry.name)) continue;
      if (!isSafeSkillName(entry.name)) continue;

      const subDir = resolve(dir, entry.name);
      const skillMd = resolve(subDir, 'SKILL.md');
      if ((await fileExists(skillMd)) && !(await isGeneratedOutput(skillMd))) {
        // Shallower skills win — only set if not already discovered
        if (!result.has(entry.name)) {
          result.set(entry.name, subDir);
        }
      }

      // Queue subdirectories for later processing (but not too deep)
      if (depth < 3) {
        queue.push({ dir: subDir, depth: depth + 1 });
      }
    }
  }

  return result;
}

/**
 * Resolve native SKILL.md files for skills defined in the AST.
 *
 * For each skill in the @skills block, checks if a corresponding SKILL.md
 * file exists in the local skills directory, optionally in .agents/skills/,
 * or in the registry at @skills/<name>/SKILL.md. If found, the
 * skill's content is replaced with the native file content.
 *
 * @param ast - The resolved AST
 * @param registryPath - Path to the registry
 * @param sourceFile - The source file path (to determine relative skill location)
 * @param localPath - Optional path to local .promptscript directory
 * @param options - Optional skill resolution options
 * @returns Updated AST with native skill content
 */
export async function resolveNativeSkills(
  ast: Program,
  registryPath: string,
  sourceFile: string,
  localPath?: string,
  options?: NativeSkillOptions
): Promise<Program> {
  const logger = options?.logger ?? noopLogger;

  // Find @skills block (may not exist yet if auto-discovery adds skills)
  const skillsBlock = ast.blocks.find((b) => b.name === 'skills');

  const skillsContent: ObjectContent =
    skillsBlock && skillsBlock.content.type === 'ObjectContent'
      ? (skillsBlock.content as ObjectContent)
      : {
          type: 'ObjectContent',
          properties: {},
          loc: { file: sourceFile, line: 1, column: 1 },
        };

  const updatedProperties: Record<string, Value> = { ...skillsContent.properties };
  let hasUpdates = false;

  // Determine base path for skills
  // If source file is in a skills directory, use its parent as base
  const sourceDir = dirname(sourceFile);
  const isSkillsDir = sourceDir.includes('@skills') || sourceDir.endsWith('/skills');

  // Auto-discover skills from local and universal directories
  // Tracks discovered skill name → absolute directory path for later resolution
  const discoveredSkillPaths = new Map<string, string>();
  const universalSkillsDir =
    !isSkillsDir && localPath && options?.universalDir
      ? await resolveUniversalDiscoveryDir(localPath, options, 'skills')
      : null;

  if (!isSkillsDir && localPath) {
    const discoveryDirs: string[] = [resolve(localPath, 'skills')];
    if (universalSkillsDir) discoveryDirs.push(universalSkillsDir);

    for (const dir of discoveryDirs) {
      const discovered = await discoverSkillDirs(dir);
      for (const [skillName, skillDir] of discovered) {
        // Only add if not already declared in @skills block
        if (!(skillName in updatedProperties)) {
          logger.verbose(`Auto-discovered skill: ${skillName} (from ${skillDir})`);
          updatedProperties[skillName] = {};
          hasUpdates = true;
        }
        // Track the path even for explicitly declared skills so we can resolve SKILL.md
        if (!discoveredSkillPaths.has(skillName)) {
          discoveredSkillPaths.set(skillName, skillDir);
        }
      }
    }
  }

  // If no skills block existed and no auto-discovered skills, nothing to do
  if (Object.keys(updatedProperties).length === 0) {
    return ast;
  }

  // Discover shared resources from .promptscript/shared/ directory
  let sharedResources: SkillResource[] = [];
  if (localPath) {
    const sharedDir = resolve(localPath, 'shared');
    if (await fileExists(sharedDir)) {
      try {
        sharedResources = await discoverSkillResources(sharedDir, logger);
        if (sharedResources.length > 0) {
          logger.verbose(`Discovered ${sharedResources.length} shared resources from ${sharedDir}`);
        }
      } catch {
        logger.verbose(`Failed to discover shared resources from ${sharedDir}`);
      }
    }
  }

  // Resolve each skill's SKILL.md content and resources
  for (const [skillName, skillValue] of Object.entries(updatedProperties)) {
    if (typeof skillValue !== 'object' || skillValue === null || Array.isArray(skillValue)) {
      continue;
    }

    // Validate skill name to prevent path traversal
    if (!isSafeSkillName(skillName)) {
      logger.verbose(`Skipping skill with unsafe name: ${skillName}`);
      continue;
    }

    const skillObj = skillValue as Record<string, Value>;

    // Try to find native SKILL.md
    const skillMdPath: string | null = isSkillsDir
      ? resolve(sourceDir, skillName, 'SKILL.md')
      : await (async () => {
          const discoveredDir = discoveredSkillPaths.get(skillName);
          if (discoveredDir) return resolve(discoveredDir, 'SKILL.md');

          const localCandidate = localPath
            ? resolve(localPath, 'skills', skillName, 'SKILL.md')
            : null;
          const universalCandidate = universalSkillsDir
            ? resolve(universalSkillsDir, skillName, 'SKILL.md')
            : null;
          const registryCandidate = resolve(registryPath, '@skills', skillName, 'SKILL.md');

          if (localCandidate && (await fileExists(localCandidate))) return localCandidate;
          if (universalCandidate && (await fileExists(universalCandidate)))
            return universalCandidate;
          return registryCandidate;
        })();

    if (skillMdPath && (await fileExists(skillMdPath))) {
      try {
        const rawContent = await readFile(skillMdPath, 'utf-8');

        if (isGeneratedByPromptScript(rawContent)) {
          logger.verbose(`Ignoring generated SKILL.md for skill '${skillName}': ${skillMdPath}`);
          continue;
        }

        const parsed = parseSkillMd(rawContent, skillMdPath);
        const frontmatterLocations = getSkillFrontmatterLocations(parsed);

        // Update skill with native content
        const updatedSkill: Record<string, Value> = { ...skillObj };

        // Extract skill arguments from .prs for interpolation
        const skillArgs = extractSkillArgs(skillObj);

        // Use native content (with interpolation if params defined)
        if (parsed.content) {
          const interpolated = parsed.params
            ? interpolateSkillContent(parsed.content, parsed.params, skillArgs)
            : parsed.content;
          updatedSkill['content'] = {
            type: 'TextContent',
            value: interpolated,
            loc: { file: skillMdPath, line: 1, column: 1, offset: 0 },
          } as TextContent;
        }

        // Use native description only as fallback when not set in .prs
        // Also interpolate description if it has template vars
        if (parsed.description && !skillObj['description']) {
          updatedSkill['description'] = parsed.params
            ? interpolateSkillContent(parsed.description, parsed.params, skillArgs)
            : parsed.description;
        }

        if (parsed.params !== undefined && !Object.hasOwn(skillObj, 'params')) {
          updatedSkill['params'] = parsed.params as unknown as Value;
        }
        if (parsed.inputs !== undefined && !Object.hasOwn(skillObj, 'inputs')) {
          updatedSkill['inputs'] = parsed.inputs as unknown as Value;
        }
        if (parsed.outputs !== undefined && !Object.hasOwn(skillObj, 'outputs')) {
          updatedSkill['outputs'] = parsed.outputs as unknown as Value;
        }
        if (parsed.references !== undefined) {
          updatedSkill['references'] = parsed.references as unknown as Value;
        }
        if (parsed.scripts !== undefined) {
          updatedSkill['scripts'] = parsed.scripts as unknown as Value;
        }
        if (parsed.compatibility !== undefined && !Object.hasOwn(skillObj, 'compatibility')) {
          updatedSkill['compatibility'] = parsed.compatibility;
        }
        if (parsed.metadata !== undefined && !Object.hasOwn(skillObj, 'metadata')) {
          updatedSkill['metadata'] = parsed.metadata as unknown as Value;
        }
        if (parsed.allowedTools !== undefined && !Object.hasOwn(skillObj, 'allowedTools')) {
          updatedSkill['allowedTools'] = parsed.allowedTools as unknown as Value;
        }

        if (parsed.rawFrontmatter !== undefined) {
          updatedSkill['__rawFrontmatter'] = parsed.rawFrontmatter;
        }

        // Set license from SKILL.md frontmatter if present
        if (parsed.license !== undefined && !skillObj['license']) {
          updatedSkill['license'] = parsed.license;
        }

        // Discover resource files alongside SKILL.md
        const skillDir = dirname(skillMdPath);
        const resources = await discoverSkillResources(skillDir, logger);

        // Merge skill-specific resources with shared resources
        const allResources: SkillResource[] = [...resources];
        for (const shared of sharedResources) {
          allResources.push({
            relativePath: `@shared/${shared.relativePath}`,
            content: shared.content,
            ...(shared.origin ? { origin: shared.origin } : {}),
          });
        }

        if (allResources.length > 0) {
          const resourceValues: Value[] = allResources.map((r) => ({
            relativePath: r.relativePath,
            content: r.content,
            ...(r.origin ? { origin: r.origin } : {}),
            ...(r.executable !== undefined ? { executable: r.executable } : {}),
          }));
          updatedSkill['resources'] = resourceValues;
        }

        // Load reference files listed in the SKILL.md frontmatter
        const skillRefs = parsed.references;
        if (skillRefs && skillRefs.length > 0) {
          const refResources = await resolveSkillReferences(
            skillRefs,
            skillDir,
            logger,
            frontmatterLocations?.frontmatter,
            frontmatterLocations?.items.get('references')
          );
          const existingResources = (updatedSkill['resources'] as Value[] | undefined) ?? [];
          updatedSkill['resources'] = [
            ...existingResources,
            ...refResources.map((r) => ({
              relativePath: r.relativePath,
              content: r.content,
              ...(r.origin ? { origin: r.origin } : {}),
              ...(r.executable !== undefined ? { executable: r.executable } : {}),
            })),
          ];
        }

        // Load script files listed in the SKILL.md frontmatter
        const skillScripts = parsed.scripts;
        if (skillScripts && skillScripts.length > 0) {
          const scriptResources = await resolveSkillScripts(
            skillScripts,
            skillDir,
            logger,
            frontmatterLocations?.frontmatter,
            frontmatterLocations?.items.get('scripts')
          );
          const existingResources = (updatedSkill['resources'] as Value[] | undefined) ?? [];
          updatedSkill['resources'] = [
            ...existingResources,
            ...scriptResources.map((r) => ({
              relativePath: r.relativePath,
              content: r.content,
              ...(r.origin ? { origin: r.origin } : {}),
              ...(r.executable !== undefined ? { executable: r.executable } : {}),
            })),
          ];
        }

        const mergedResources = updatedSkill['resources'];
        if (Array.isArray(mergedResources)) {
          const resourcesByPath = new Map<string, Value>();
          for (const resource of mergedResources) {
            if (typeof resource !== 'object' || resource === null || Array.isArray(resource)) {
              continue;
            }
            const resourceRecord = resource as Record<string, Value>;
            const relativePath = resourceRecord['relativePath'];
            if (typeof relativePath === 'string') {
              resourcesByPath.set(relativePath, resourceRecord);
            }
          }
          updatedSkill['resources'] = [...resourcesByPath.values()];
        }

        updatedProperties[skillName] = updatedSkill;
        hasUpdates = true;
      } catch (error: unknown) {
        if (error instanceof ResolveError) {
          throw error;
        }
        // Failed to read skill file, keep original
        logger.verbose(`Failed to read skill file: ${skillMdPath}`);
      }
    }
  }

  if (!hasUpdates) {
    return ast;
  }

  // Create updated skills block
  const updatedSkillsBlock: Block = {
    ...(skillsBlock ?? {
      type: 'Block' as const,
      name: 'skills',
      content: skillsContent,
      loc: { file: sourceFile, line: 1, column: 1, offset: 0 },
    }),
    content: {
      ...skillsContent,
      properties: updatedProperties,
    },
  };

  // Replace or add skills block in AST
  const updatedBlocks = skillsBlock
    ? ast.blocks.map((b) => (b.name === 'skills' ? updatedSkillsBlock : b))
    : [...ast.blocks, updatedSkillsBlock];

  return {
    ...ast,
    blocks: updatedBlocks,
  };
}

/**
 * Discover command .md files from a directory.
 * Each .md file becomes a shortcut: filename (without .md) → file content.
 *
 * @param dir - Absolute path to the commands directory
 * @param logger - Optional logger
 * @returns Record of command name → TextContent value
 */
async function discoverCommandFiles(
  dir: string,
  logger: Logger = noopLogger
): Promise<Record<string, Value>> {
  const commands: Record<string, Value> = {};
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith('.md')) continue;
      if (entry.isSymbolicLink()) continue;

      const cmdName = '/' + entry.name.replace(/\.md$/, '');
      const fullPath = resolve(dir, entry.name);

      try {
        const fileStat = await lstat(fullPath);
        if (fileStat.isSymbolicLink()) continue;
        if (fileStat.size > MAX_RESOURCE_SIZE) {
          logger.verbose(`Skipping oversized command file: ${entry.name}`);
          continue;
        }

        const content = await readFile(fullPath, 'utf-8');
        if (content.includes('\0')) {
          logger.verbose(`Skipping binary command file: ${entry.name}`);
          continue;
        }
        if (isGeneratedByPromptScript(content)) {
          logger.verbose(`Skipping generated command file: ${entry.name}`);
          continue;
        }

        commands[cmdName] = {
          type: 'TextContent',
          value: content.trim(),
          loc: { file: fullPath, line: 1, column: 1, offset: 0 },
        } as TextContent;

        logger.verbose(`Auto-discovered command: ${cmdName} (from ${dir})`);
      } catch {
        logger.verbose(`Skipping unreadable command file: ${entry.name}`);
      }
    }
  } catch {
    // Directory doesn't exist or can't be read
  }
  return commands;
}

/**
 * Auto-discover command .md files from local and universal directories
 * and inject them into the @shortcuts block.
 *
 * Scans .promptscript/commands/ and optionally .agents/commands/ for .md files.
 * Each file becomes a shortcut entry with the filename as command name.
 * Explicitly declared shortcuts in .prs files take precedence.
 *
 * @param ast - The resolved AST
 * @param sourceFile - The source file path
 * @param localPath - Path to local .promptscript directory
 * @param options - Skill resolution options (reuses universalDir and logger)
 * @returns Updated AST with discovered commands
 */
export async function resolveNativeCommands(
  ast: Program,
  sourceFile: string,
  localPath?: string,
  options?: NativeSkillOptions
): Promise<Program> {
  if (!localPath) return ast;

  const logger = options?.logger ?? noopLogger;

  // Collect commands from discovery directories
  const allCommands: Record<string, Value> = {};

  // Local commands first
  const localCommands = await discoverCommandFiles(resolve(localPath, 'commands'), logger);
  Object.assign(allCommands, localCommands);

  // Universal commands (don't overwrite local)
  if (options?.universalDir) {
    const universalCommandsDir = await resolveUniversalDiscoveryDir(localPath, options, 'commands');
    if (universalCommandsDir) {
      const universalCommands = await discoverCommandFiles(universalCommandsDir, logger);
      for (const [name, value] of Object.entries(universalCommands)) {
        if (!(name in allCommands)) {
          allCommands[name] = value;
        }
      }
    }
  }

  if (Object.keys(allCommands).length === 0) return ast;

  // Find existing @shortcuts block
  const shortcutsBlock = ast.blocks.find((b) => b.name === 'shortcuts');
  const shortcutsContent: ObjectContent =
    shortcutsBlock && shortcutsBlock.content.type === 'ObjectContent'
      ? (shortcutsBlock.content as ObjectContent)
      : {
          type: 'ObjectContent',
          properties: {},
          loc: { file: sourceFile, line: 1, column: 1 },
        };

  // Merge: existing shortcuts take precedence over discovered ones
  const mergedProperties: Record<string, Value> = { ...allCommands };
  for (const [name, value] of Object.entries(shortcutsContent.properties)) {
    mergedProperties[name] = value; // Explicit declarations win
  }

  // Check if anything actually changed
  const existingKeys = new Set(Object.keys(shortcutsContent.properties));
  const hasNewCommands = Object.keys(allCommands).some((k) => !existingKeys.has(k));
  if (!hasNewCommands) return ast;

  const updatedBlock: Block = {
    ...(shortcutsBlock ?? {
      type: 'Block' as const,
      name: 'shortcuts',
      content: shortcutsContent,
      loc: { file: sourceFile, line: 1, column: 1, offset: 0 },
    }),
    content: {
      ...shortcutsContent,
      properties: mergedProperties,
    },
  };

  const updatedBlocks = shortcutsBlock
    ? ast.blocks.map((b) => (b.name === 'shortcuts' ? updatedBlock : b))
    : [...ast.blocks, updatedBlock];

  return {
    ...ast,
    blocks: updatedBlocks,
  };
}

// ============================================================
// Agent auto-discovery
// ============================================================

/**
 * Parse YAML frontmatter from a markdown file.
 * Returns the frontmatter key-value pairs and the body after the closing ---.
 */
function parseAgentFrontmatter(
  content: string
): { frontmatter: Record<string, unknown>; body: string } | null {
  const trimmed = content.trimStart();
  if (!trimmed.startsWith('---')) return null;

  // Find closing --- that starts at the beginning of a line
  let endIdx = -1;
  let searchFrom = 3;
  while (searchFrom < trimmed.length) {
    const idx = trimmed.indexOf('---', searchFrom);
    if (idx === -1) break;
    if (idx === 0 || trimmed[idx - 1] === '\n') {
      endIdx = idx;
      break;
    }
    searchFrom = idx + 1;
  }
  if (endIdx === -1) return null;

  const yamlStr = stripFrontmatterMarkerLines(trimmed.slice(3, endIdx)).trim();
  const body = stripLeadingHtmlMarker(trimmed.slice(endIdx + 3)).trim();

  // Simple YAML key-value parser for agent frontmatter
  const frontmatter: Record<string, unknown> = {};
  for (const line of yamlStr.split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    let val: unknown = line.slice(colonIdx + 1).trim();

    // Parse inline arrays: ["Read", "Grep"]
    if (typeof val === 'string' && val.startsWith('[') && val.endsWith(']')) {
      val = val
        .slice(1, -1)
        .split(',')
        .map((s) => s.trim().replace(/^["']|["']$/g, ''))
        .filter(Boolean);
    }
    // Unquote strings
    if (typeof val === 'string') {
      val = val.replace(/^["']|["']$/g, '');
    }
    frontmatter[key] = val;
  }
  return { frontmatter, body };
}

/**
 * Discover agent .md files from a directory.
 * Reads files with YAML frontmatter (name, description, tools, model)
 * and returns them as ObjectContent property entries for the @agents block.
 */
async function discoverAgentFiles(
  dir: string,
  logger: Logger = noopLogger
): Promise<Record<string, { value: Value; source: string }>> {
  const agents: Record<string, { value: Value; source: string }> = {};
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith('.md')) continue;
      if (entry.isSymbolicLink()) continue;

      const fullPath = resolve(dir, entry.name);

      try {
        const fileStat = await lstat(fullPath);
        if (fileStat.isSymbolicLink()) continue;
        if (fileStat.size > MAX_RESOURCE_SIZE) {
          logger.verbose(`Skipping oversized agent file: ${entry.name}`);
          continue;
        }

        const fileContent = await readFile(fullPath, 'utf-8');
        if (fileContent.includes('\0')) {
          logger.verbose(`Skipping binary agent file: ${entry.name}`);
          continue;
        }
        if (isGeneratedByPromptScript(fileContent)) {
          logger.verbose(`Skipping generated agent file: ${entry.name}`);
          continue;
        }

        const parsed = parseAgentFrontmatter(fileContent);
        if (!parsed) {
          logger.verbose(`Skipping agent file without frontmatter: ${entry.name}`);
          continue;
        }

        const { frontmatter, body: agentBody } = parsed;
        // Use || to fall back on empty string (not just null/undefined)
        const name = (frontmatter['name'] as string) || entry.name.replace(/\.md$/, '');

        // Sanitize name to prevent path traversal in output paths
        if (!isSafeSkillName(name)) {
          logger.verbose(`Skipping agent with unsafe name: ${name}`);
          continue;
        }

        const description = frontmatter['description'] as string | undefined;

        if (!description) {
          logger.verbose(`Skipping agent without description: ${entry.name}`);
          continue;
        }

        const loc = { file: fullPath, line: 1, column: 1, offset: 0 };

        // Build the agent properties as an ObjectContent value
        const agentProps: Record<string, Value> = {
          description: description,
        };

        if (frontmatter['tools'] && Array.isArray(frontmatter['tools'])) {
          agentProps['tools'] = frontmatter['tools'] as string[];
        } else if (frontmatter['tools'] === '') {
          // Block-style YAML tools (- Read\n- Grep) not parsed by simple parser
          logger.verbose(
            `Agent ${name}: tools field detected but not in inline array format. Use tools: ["Read", "Grep"] syntax.`
          );
        }

        if (frontmatter['model']) {
          agentProps['model'] = frontmatter['model'] as string;
        }

        if (agentBody) {
          agentProps['content'] = {
            type: 'TextContent',
            value: agentBody,
            loc,
          } as TextContent;
        }

        agents[name] = { value: agentProps, source: fullPath };
        logger.verbose(`Auto-discovered agent: ${name} (from ${dir})`);
      } catch {
        logger.verbose(`Skipping unreadable agent file: ${entry.name}`);
      }
    }
  } catch {
    // Directory doesn't exist or can't be read
  }
  return agents;
}

/**
 * Auto-discover agent .md files from local and universal directories
 * and inject them into the @agents block.
 *
 * Scans .promptscript/agents/ and optionally <universalDir>/agents/ for .md files
 * with YAML frontmatter. Each file becomes an agent entry.
 * Explicitly declared agents in .prs @agents blocks take precedence.
 */
export async function resolveNativeAgents(
  ast: Program,
  sourceFile: string,
  localPath?: string,
  options?: NativeSkillOptions
): Promise<Program> {
  if (!localPath) return ast;

  const logger = options?.logger ?? noopLogger;

  // Collect agents from discovery directories
  const allAgents: Record<string, Value> = {};
  const discoveredSources = new Map<string, string>();

  // Local agents first
  const localAgents = await discoverAgentFiles(resolve(localPath, 'agents'), logger);
  for (const [name, agent] of Object.entries(localAgents)) {
    allAgents[name] = agent.value;
    discoveredSources.set(name, agent.source);
  }

  // Universal agents (don't overwrite local)
  if (options?.universalDir) {
    const universalAgentsDir = await resolveUniversalDiscoveryDir(localPath, options, 'agents');
    if (universalAgentsDir) {
      const universalAgents = await discoverAgentFiles(universalAgentsDir, logger);
      for (const [name, agent] of Object.entries(universalAgents)) {
        if (!(name in allAgents)) {
          allAgents[name] = agent.value;
          discoveredSources.set(name, agent.source);
        }
      }
    }
  }

  // Find existing @agents block
  const agentsBlock = ast.blocks.find((b) => b.name === 'agents');
  const existingProperties =
    agentsBlock &&
    (agentsBlock.content.type === 'ObjectContent' || agentsBlock.content.type === 'MixedContent')
      ? agentsBlock.content.properties
      : {};
  const existingProvenance = ast.agentProvenance ?? [];
  const knownNames = new Set(existingProvenance.map((entry) => entry.name));
  const fallbackProvenance = Object.keys(existingProperties)
    .filter((name) => !knownNames.has(name))
    .map((name) => ({
      name,
      source: sourceFile,
      action: 'local' as const,
      loc: agentsBlock?.loc ?? { file: sourceFile, line: 1, column: 1, offset: 0 },
    }));

  if (Object.keys(allAgents).length === 0) {
    return fallbackProvenance.length > 0
      ? { ...ast, agentProvenance: [...existingProvenance, ...fallbackProvenance] }
      : ast;
  }

  const agentsContent: ObjectContent | MixedContent =
    agentsBlock &&
    (agentsBlock.content.type === 'ObjectContent' || agentsBlock.content.type === 'MixedContent')
      ? agentsBlock.content
      : {
          type: 'ObjectContent',
          properties: {},
          loc: { file: sourceFile, line: 1, column: 1 },
        };

  // Merge: existing agents take precedence over discovered ones
  const mergedProperties: Record<string, Value> = { ...allAgents };
  for (const [name, value] of Object.entries(agentsContent.properties)) {
    mergedProperties[name] = value;
  }

  // Check if anything actually changed
  const existingKeys = new Set(Object.keys(agentsContent.properties));
  const hasNewAgents = Object.keys(allAgents).some((k) => !existingKeys.has(k));
  const discoveredProvenance = Object.entries(allAgents)
    .filter(([name]) => !existingKeys.has(name))
    .map(([name]) => ({
      name,
      source: discoveredSources.get(name) ?? sourceFile,
      action: 'native' as const,
      loc: { file: discoveredSources.get(name) ?? sourceFile, line: 1, column: 1, offset: 0 },
    }));
  const nextProvenance = [...existingProvenance, ...fallbackProvenance, ...discoveredProvenance];
  if (!hasNewAgents) {
    return nextProvenance.length > existingProvenance.length
      ? { ...ast, agentProvenance: nextProvenance }
      : ast;
  }

  const updatedBlock: Block = {
    ...(agentsBlock ?? {
      type: 'Block' as const,
      name: 'agents',
      content: agentsContent,
      loc: { file: sourceFile, line: 1, column: 1, offset: 0 },
    }),
    content: {
      ...agentsContent,
      properties: mergedProperties,
    },
  };

  const updatedBlocks = agentsBlock
    ? ast.blocks.map((b) => (b.name === 'agents' ? updatedBlock : b))
    : [...ast.blocks, updatedBlock];

  return {
    ...ast,
    blocks: updatedBlocks,
    agentProvenance: nextProvenance,
  };
}
