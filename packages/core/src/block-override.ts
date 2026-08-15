import type {
  Block,
  BlockBody,
  BlockContent,
  BlockReplacement,
  FieldEntry,
  ObjectContent,
  OverrideBlock,
  OverrideReplacement,
  Program,
  SourceLocation,
  Value,
  ValueNode,
} from './types/index.js';
import {
  blockBodyToContent,
  blockContentToBody,
  createBlockBody,
  createValueNode,
  reconcileBlockBody,
  valueNodeToValue,
} from './canonical-ast.js';
import { ResolveError } from './errors/index.js';
import { deepClone } from './utils/index.js';
import { resolveAgentTargetPath } from './agent-names.js';

export const SKILL_REPLACE_PROPERTY_NAMES = [
  'content',
  'description',
  'trigger',
  'userInvocable',
  'allowedTools',
  'disableModelInvocation',
  'context',
  'agent',
  'license',
] as const;

const SKILL_REPLACE_PROPERTIES = new Set<string>(SKILL_REPLACE_PROPERTY_NAMES);

const DEFAULT_IMPORT_MARKER_PREFIX = '__import__';

function isRecord(value: unknown): value is Record<string, Value> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isSourceLocation(value: unknown): value is SourceLocation {
  return (
    isRecord(value) &&
    typeof value['file'] === 'string' &&
    typeof value['line'] === 'number' &&
    typeof value['column'] === 'number'
  );
}

function isObjectContent(value: unknown): value is ObjectContent {
  return (
    isRecord(value) &&
    value['type'] === 'ObjectContent' &&
    isRecord(value['properties']) &&
    isSourceLocation(value['loc'])
  );
}

function getRecord(value: Value | undefined): Record<string, Value> | undefined {
  if (!isRecord(value)) return undefined;
  return isObjectContent(value) ? value.properties : value;
}

function getProperties(content: BlockContent): Record<string, Value> | undefined {
  if (content.type === 'ObjectContent' || content.type === 'MixedContent') {
    return content.properties;
  }
  return undefined;
}

function resolveSealedKeys(value: Value | undefined): Set<string> {
  if (value === true) return new Set(SKILL_REPLACE_PROPERTIES);
  if (!Array.isArray(value)) return new Set();
  return new Set(
    value.filter(
      (entry): entry is string => typeof entry === 'string' && SKILL_REPLACE_PROPERTIES.has(entry)
    )
  );
}

function replacementToBlockContent(
  replacement: OverrideReplacement,
  location: SourceLocation,
  targetPath: string
): BlockContent {
  if (replacement.type === 'BlockReplacement') {
    return blockBodyToContent(replacement.body);
  }

  const node = replacement.value;
  const value = valueNodeToValue(node);
  switch (node.type) {
    case 'ArrayValueNode':
      return {
        type: 'ArrayContent',
        elements: deepClone(value as Value[]),
        loc: deepClone(location),
      };
    case 'ScalarValueNode':
      if (typeof node.value === 'string') {
        return {
          type: 'TextContent',
          value: node.value,
          loc: deepClone(location),
        };
      }
      break;
    case 'TextValueNode':
      return {
        type: 'TextContent',
        value: node.value,
        loc: deepClone(node.loc),
      };
    case 'ObjectValueNode':
      return {
        type: 'ObjectContent',
        properties: deepClone(value as Record<string, Value>),
        loc: deepClone(location),
      };
  }

  const observed = value === null ? 'null' : typeof value;
  throw new ResolveError(
    `Cannot replace block "@${targetPath}" with ${observed} content. ` +
      'Use text, an object, an array, or a regular block body.',
    location
  );
}

function replacementToValue(
  replacement: OverrideReplacement,
  location: SourceLocation,
  targetPath: string
): Value {
  if (replacement.type === 'ValueReplacement') {
    return deepClone(valueNodeToValue(replacement.value));
  }

  const content = blockBodyToContent(replacement.body);
  if (content.type === 'TextContent') return deepClone(content);
  if (content.type === 'ArrayContent') return deepClone(content.elements);
  if (
    content.type === 'ObjectContent' &&
    !content.listItems?.length &&
    !content.inlineUses?.length
  ) {
    return deepClone(content.properties);
  }

  throw new ResolveError(
    `Cannot replace nested target "${targetPath}" with mixed block content. ` +
      'Use one standalone text, object, array, number, boolean, or null value.',
    location
  );
}

function valueReplacementToBlockBody(
  replacement: OverrideReplacement,
  content: BlockContent
): BlockBody {
  if (replacement.type === 'BlockReplacement') {
    return deepClone(replacement.body);
  }

  const node = replacement.value;
  if (node.type === 'ArrayValueNode') {
    return createBlockBody(
      node.elements.map((element) => ({
        type: 'ListEntry',
        value: deepClone(element.value),
        loc: deepClone(element.loc),
      })),
      node.loc,
      { projection: 'ArrayContent' }
    );
  }
  if (node.type === 'ObjectValueNode') {
    return createBlockBody(
      node.fields.map((field) => ({
        type: 'FieldEntry',
        name: field.name,
        value: deepClone(field.value),
        loc: deepClone(field.loc),
      })),
      node.loc,
      { projection: 'ObjectContent' }
    );
  }
  if (
    (node.type === 'ScalarValueNode' || node.type === 'TextValueNode') &&
    typeof node.value === 'string'
  ) {
    return createBlockBody(
      [{ type: 'TextEntry', text: node.value, loc: deepClone(node.loc) }],
      node.loc,
      { projection: 'TextContent' }
    );
  }
  /* v8 ignore next -- root replacement validation rejects this fallback */
  return blockContentToBody(content);
}

function replaceValueNodeAtPath(
  node: ValueNode,
  path: readonly string[],
  replacement: ValueNode
): ValueNode {
  if (path.length === 0) return deepClone(replacement);
  if (node.type !== 'ObjectValueNode') return deepClone(node);

  const segment = path[0]!;
  let targetIndex = -1;
  for (const [index, field] of node.fields.entries()) {
    if (field.name === segment) targetIndex = index;
  }
  if (targetIndex < 0) return deepClone(node);

  return {
    ...deepClone(node),
    fields: node.fields.map((field, index) =>
      index === targetIndex
        ? {
            ...deepClone(field),
            value: replaceValueNodeAtPath(field.value, path.slice(1), replacement),
            loc: deepClone(path.length === 1 ? replacement.loc : field.loc),
          }
        : deepClone(field)
    ),
  };
}

function replaceCanonicalBodyAtPath(
  block: Block,
  content: BlockContent,
  path: readonly string[],
  replacement: OverrideReplacement
): BlockBody {
  const base = block.canonicalBody ?? blockContentToBody(block.content);
  const reconciled = reconcileBlockBody(base, content);
  const root = path[0];
  if (!root) return reconciled;

  let targetIndex = -1;
  for (const [index, entry] of reconciled.entries.entries()) {
    if (entry.type === 'FieldEntry' && entry.name === root) targetIndex = index;
  }
  if (targetIndex < 0) return reconciled;

  const replacementNode =
    replacement.type === 'ValueReplacement'
      ? replacement.value
      : createValueNodeFromBlockReplacement(replacement);

  return createBlockBody(
    reconciled.entries.map((entry, index) =>
      index === targetIndex && entry.type === 'FieldEntry'
        ? ({
            ...deepClone(entry),
            value: replaceValueNodeAtPath(entry.value, path.slice(1), replacementNode),
          } satisfies FieldEntry)
        : deepClone(entry)
    ),
    reconciled.loc,
    {
      ...(reconciled.legacyProjection ? { projection: reconciled.legacyProjection } : {}),
      ...(reconciled.legacyText ? { text: reconciled.legacyText } : {}),
    }
  );
}

function createValueNodeFromBlockReplacement(replacement: BlockReplacement): ValueNode {
  const content = blockBodyToContent(replacement.body);
  const value = replacementToValue(replacement, replacement.loc, '@override');
  const fallback = createValueNode(value, replacement.loc);
  if (content.type === 'TextContent') {
    const text = replacement.body.entries.find((entry) => entry.type === 'TextEntry');
    return createValueNode(value, text?.loc ?? replacement.loc);
  }
  if (fallback.type === 'ArrayValueNode') {
    const entries = replacement.body.entries.filter((entry) => entry.type === 'ListEntry');
    return {
      ...fallback,
      elements: fallback.elements.map((element, index) => {
        const entry = entries[index];
        return entry
          ? {
              type: 'ArrayElementNode',
              value: deepClone(entry.value),
              loc: deepClone(entry.loc),
            }
          : element;
      }),
    };
  }
  if (fallback.type === 'ObjectValueNode') {
    const entries = new Map(
      replacement.body.entries
        .filter((entry): entry is FieldEntry => entry.type === 'FieldEntry')
        .map((entry) => [entry.name, entry])
    );
    return {
      ...fallback,
      fields: fallback.fields.map((field) => {
        const entry = entries.get(field.name);
        return entry
          ? {
              type: 'ObjectFieldNode',
              name: field.name,
              value: deepClone(entry.value),
              loc: deepClone(entry.loc),
            }
          : field;
      }),
    };
  }
  /* v8 ignore next -- block replacements project to text, arrays, or objects */
  return fallback;
}

function missingPathError(
  targetPath: string,
  segment: string,
  location: SourceLocation
): ResolveError {
  return new ResolveError(
    `@override target "${targetPath}" does not exist at segment "${segment}". ` +
      'Declare or import the complete target before replacing it.',
    location
  );
}

function replaceNestedValue(
  current: Value,
  path: readonly string[],
  replacement: Value,
  targetPath: string,
  location: SourceLocation
): Value {
  if (path.length === 0) return deepClone(replacement);

  const segment = path[0]!;
  const record = getRecord(current);
  if (!record) {
    throw new ResolveError(
      `Cannot traverse @override target "${targetPath}" through non-object segment "${segment}".`,
      location
    );
  }
  if (!Object.hasOwn(record, segment)) {
    throw missingPathError(targetPath, segment, location);
  }

  return {
    ...deepClone(record),
    [segment]: replaceNestedValue(
      record[segment]!,
      path.slice(1),
      replacement,
      targetPath,
      location
    ),
  };
}

function assertSealedSkillReplacement(
  content: BlockContent,
  path: readonly string[],
  replacement: OverrideReplacement,
  targetPath: string,
  location: SourceLocation
): void {
  const skills = getProperties(content);
  if (!skills) return;

  if (path.length === 0) {
    const candidate = getProperties(replacementToBlockContent(replacement, location, targetPath));
    if (!candidate) {
      throw new ResolveError(
        'Cannot replace @skills with non-object content because sealed skill properties must remain enforceable.',
        location
      );
    }
    for (const [skillName, skillValue] of Object.entries(skills)) {
      const skill = getRecord(skillValue);
      if (!skill) continue;
      const sealed = resolveSealedKeys(skill['sealed']);
      const candidateSkill = getRecord(candidate[skillName]);
      if (!candidateSkill) {
        if (sealed.size === 0) continue;
        throw new ResolveError(
          `Cannot remove skill "${skillName}" because it contains sealed properties.`,
          location
        );
      }
      assertSealedValues(skillName, skill, candidateSkill, sealed, location);
    }
    for (const [skillName, skillValue] of Object.entries(candidate)) {
      if (Object.hasOwn(skills, skillName)) continue;
      const skill = getRecord(skillValue);
      if (skill && skill['sealed'] !== undefined) {
        throw new ResolveError(
          `Cannot add protected property 'sealed' through @override on skill "${skillName}"`,
          location
        );
      }
    }
    return;
  }

  const skillName = path[0]!;
  const existingSkill = getRecord(skills[skillName]);
  if (!existingSkill) return;
  const sealed = resolveSealedKeys(existingSkill['sealed']);

  if (path.length === 1) {
    const candidateSkill = getRecord(replacementToValue(replacement, location, targetPath));
    if (!candidateSkill) {
      throw new ResolveError(
        `Cannot replace skill "${skillName}" with non-object content because sealed properties must remain enforceable.`,
        location
      );
    }
    assertSealedValues(skillName, existingSkill, candidateSkill, sealed, location);
    return;
  }

  const propertyName = path[1]!;
  if (propertyName === 'sealed') {
    throw new ResolveError("Cannot override protected property 'sealed' on skill", location);
  }
  if (sealed.has(propertyName)) {
    throw new ResolveError(
      `Cannot override sealed property '${propertyName}' on skill "${skillName}"`,
      location
    );
  }
}

function assertSealedValues(
  skillName: string,
  existing: Record<string, Value>,
  candidate: Record<string, Value>,
  sealed: ReadonlySet<string>,
  location: SourceLocation
): void {
  if (!semanticValuesEqual(candidate['sealed'], existing['sealed'], location)) {
    throw new ResolveError(
      `Cannot change protected property 'sealed' on skill "${skillName}"`,
      location
    );
  }
  for (const propertyName of sealed) {
    if (!semanticValuesEqual(candidate[propertyName], existing[propertyName], location)) {
      throw new ResolveError(
        `Cannot change sealed property '${propertyName}' on skill "${skillName}"`,
        location
      );
    }
  }
}

function semanticValuesEqual(
  left: Value | undefined,
  right: Value | undefined,
  location: SourceLocation
): boolean {
  if (left === undefined || right === undefined) return left === right;
  return (
    JSON.stringify(withoutCanonicalLocations(createValueNode(left, location))) ===
    JSON.stringify(withoutCanonicalLocations(createValueNode(right, location)))
  );
}

function withoutCanonicalLocations(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(withoutCanonicalLocations);
  if (!isRecord(value)) return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => key !== 'loc')
      .map(([key, entry]) => [key, withoutCanonicalLocations(entry)])
  );
}

function replaceNestedContent(
  content: BlockContent,
  path: readonly string[],
  replacement: Value,
  targetPath: string,
  location: SourceLocation
): BlockContent {
  const segment = path[0];
  if ((content.type !== 'ObjectContent' && content.type !== 'MixedContent') || !segment) {
    throw new ResolveError(
      `Cannot traverse @override target "${targetPath}" because its root block is not object-shaped.`,
      location
    );
  }
  const properties = content.properties;
  if (!Object.hasOwn(properties, segment)) {
    throw missingPathError(targetPath, segment, location);
  }

  return {
    ...deepClone(content),
    properties: {
      ...deepClone(properties),
      [segment]: replaceNestedValue(
        properties[segment]!,
        path.slice(1),
        replacement,
        targetPath,
        location
      ),
    },
  };
}

export interface ApplyOverrideOptions {
  readonly importMarkerPrefix?: string;
}

/**
 * Atomically replace one existing block or nested value.
 */
export function applyOverride(
  ast: Program,
  override: OverrideBlock,
  options: ApplyOverrideOptions = {}
): Program {
  const markerPrefix = options.importMarkerPrefix ?? DEFAULT_IMPORT_MARKER_PREFIX;
  const parts = override.targetPath.split('.');
  const root = parts[0]!;
  const marker = ast.blocks.find((block) => block.name === `${markerPrefix}${root}`);
  let targetName = marker && parts.length > 1 ? parts[1]! : root;
  let path = marker && parts.length > 1 ? parts.slice(2) : parts.slice(1);
  const agents = ast.blocks.find((block) => block.name === 'agents');
  const agentProperties =
    agents?.content.type === 'ObjectContent' || agents?.content.type === 'MixedContent'
      ? agents.content.properties
      : undefined;
  if (agentProperties) {
    const agentsIndex = marker ? 1 : parts[0] === 'agents' ? 0 : -1;
    const namespace = marker ? root : '';
    const agentPath =
      agentsIndex >= 0
        ? resolveAgentTargetPath(parts, agentsIndex, namespace, agentProperties)
        : !marker
          ? resolveAgentTargetPath(parts, -1, '', agentProperties)
          : undefined;
    if (agentPath) {
      targetName = 'agents';
      path = agentPath;
    }
  }
  const markerBlocks = marker ? getProperties(marker.content)?.['__blocks'] : undefined;
  if (marker && Array.isArray(markerBlocks) && !markerBlocks.some((name) => name === targetName)) {
    throw new ResolveError(
      `@override target "${override.targetPath}" is not exported by alias "${root}".`,
      override.loc
    );
  }
  const index = ast.blocks.findIndex((block) => block.name === targetName);

  if (index < 0) {
    throw new ResolveError(
      `@override target "${override.targetPath}" does not exist. ` +
        'Declare or import it before replacing it.',
      override.loc
    );
  }

  const target = ast.blocks[index]!;
  if (target.name === 'skills') {
    assertSealedSkillReplacement(
      target.content,
      path,
      override.replacement,
      override.targetPath,
      override.loc
    );
  }

  const content =
    path.length === 0
      ? replacementToBlockContent(override.replacement, override.loc, override.targetPath)
      : replaceNestedContent(
          target.content,
          path,
          replacementToValue(override.replacement, override.loc, override.targetPath),
          override.targetPath,
          override.loc
        );
  const replacementBlock: Block = {
    ...deepClone(target),
    content,
    canonicalBody:
      path.length === 0
        ? valueReplacementToBlockBody(override.replacement, content)
        : replaceCanonicalBodyAtPath(target, content, path, override.replacement),
  };

  return {
    ...ast,
    blocks: [...ast.blocks.slice(0, index), replacementBlock, ...ast.blocks.slice(index + 1)],
  };
}
