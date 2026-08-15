import type {
  BlockBody,
  CanonicalBlock,
  InlineUseDeclaration,
  ProgramInput,
  ProvenanceAction,
  ProvenanceEntry,
  ProvenanceEvent,
  ProvenanceLink,
  ProvenanceStep,
  ProvenanceTrace,
  SourceLocation,
  ValueNode,
} from './types/index.js';
import { blockContentToBody, isCanonicalProgram } from './canonical-ast.js';
import { deepClone } from './utils/index.js';

interface MutableProvenanceEntry {
  path: string;
  kind: ProvenanceEntry['kind'];
  source: SourceLocation;
  history: ProvenanceStep[];
}

function cloneLocation(location: SourceLocation): SourceLocation {
  return deepClone(location);
}

function declarationStep(source: SourceLocation, action: ProvenanceAction): ProvenanceStep {
  return {
    operation: 'declaration',
    action,
    source: cloneLocation(source),
    chain: [],
  };
}

function isInternalProperty(name: string): boolean {
  return name.startsWith('__') || name === 'composedFrom';
}

function addEntry(
  entries: Map<string, MutableProvenanceEntry>,
  path: string,
  kind: ProvenanceEntry['kind'],
  source: SourceLocation,
  action: ProvenanceAction = 'declared'
): void {
  const existing = entries.get(path);
  if (existing) {
    existing.source = cloneLocation(source);
    existing.kind = kind;
    existing.history.push(declarationStep(source, action));
    return;
  }

  entries.set(path, {
    path,
    kind,
    source: cloneLocation(source),
    history: [declarationStep(source, action)],
  });
}

function collectValueNode(
  entries: Map<string, MutableProvenanceEntry>,
  node: ValueNode,
  path: string
): void {
  switch (node.type) {
    case 'ArrayValueNode':
      node.elements.forEach((element, index) => {
        const elementPath = `${path}[${index}]`;
        addEntry(entries, elementPath, 'list', element.loc);
        collectValueNode(entries, element.value, elementPath);
      });
      return;
    case 'ObjectValueNode':
      node.fields.forEach((field) => {
        if (isInternalProperty(field.name)) return;
        const fieldPath = `${path}.${field.name}`;
        addEntry(entries, fieldPath, 'value', field.loc);
        collectValueNode(entries, field.value, fieldPath);
      });
      return;
    case 'TextValueNode':
    case 'TemplateValueNode':
    case 'TypeExpressionValueNode':
    case 'ScalarValueNode':
      return;
  }
}

function collectBodyEntries(
  entries: Map<string, MutableProvenanceEntry>,
  blockName: string,
  body: BlockBody
): void {
  let textIndex = 0;
  let listIndex = 0;
  let inlineUseIndex = 0;

  for (const entry of body.entries) {
    switch (entry.type) {
      case 'FieldEntry': {
        if (isInternalProperty(entry.name)) break;
        const path = `${blockName}.${entry.name}`;
        addEntry(entries, path, 'field', entry.loc);
        collectValueNode(entries, entry.value, path);
        break;
      }
      case 'ListEntry': {
        const path = `${blockName}[${listIndex}]`;
        listIndex++;
        addEntry(entries, path, 'list', entry.loc);
        collectValueNode(entries, entry.value, path);
        break;
      }
      case 'TextEntry': {
        addEntry(entries, `${blockName}.text[${textIndex}]`, 'text', entry.loc);
        textIndex++;
        break;
      }
      case 'InlineUseEntry':
        addEntry(entries, `${blockName}.@use[${inlineUseIndex}]`, 'inline-use', entry.loc);
        inlineUseIndex++;
        break;
      case 'PresentationEntry':
        addEntry(entries, `${blockName}.$header`, 'value', entry.loc);
        break;
    }
  }
}

function getCanonicalBlocks(input: ProgramInput): readonly CanonicalBlock[] {
  if (isCanonicalProgram(input)) return input.blocks;
  return input.blocks.map((block) => ({
    type: 'CanonicalBlock',
    name: block.name,
    body: block.canonicalBody ?? blockContentToBody(block.content),
    content: block.content,
    loc: block.loc,
  }));
}

function collectEntries(input: ProgramInput): Map<string, MutableProvenanceEntry> {
  const entries = new Map<string, MutableProvenanceEntry>();
  for (const block of getCanonicalBlocks(input)) {
    addEntry(entries, block.name, 'block', block.loc);
    collectBodyEntries(entries, block.name, block.body);
  }
  return entries;
}

function eventStep(event: ProvenanceEvent): ProvenanceStep {
  const { operation, action, source, strategy, target, reference, alias, chain } = event;
  return {
    operation,
    action,
    source: cloneLocation(source),
    ...(strategy ? { strategy } : {}),
    ...(target ? { target } : {}),
    ...(reference ? { reference } : {}),
    ...(alias ? { alias } : {}),
    chain: deepClone(chain ?? []),
  };
}

function sourceKey(source: SourceLocation): string {
  return `${source.file}\0${source.line}\0${source.column}\0${source.offset ?? ''}`;
}

function selectInheritedEntry(
  path: string,
  source: SourceLocation,
  inherited: readonly ProvenanceEntry[]
): ProvenanceEntry | undefined {
  const candidates = inherited.filter((entry) => entry.path === path);
  return (
    candidates.find((entry) => sourceKey(entry.source) === sourceKey(source)) ??
    candidates[candidates.length - 1]
  );
}

function pathSort(left: ProvenanceEntry, right: ProvenanceEntry): number {
  return Number(left.path > right.path) - Number(left.path < right.path);
}

function collectEventValuePaths(
  events: ProvenanceEvent[],
  node: ValueNode,
  path: string,
  source: SourceLocation,
  operation: ProvenanceEvent['operation'],
  action: ProvenanceEvent['action'],
  strategy: string | undefined,
  target: string
): void {
  const valueAction: ProvenanceEvent['action'] =
    action === 'replaced'
      ? 'replaced'
      : operation === 'extend' && (strategy === 'append' || node.type === 'ArrayValueNode')
        ? 'appended'
        : action;
  events.push({
    path,
    operation,
    action: valueAction,
    source,
    ...(strategy ? { strategy } : {}),
    target,
  });
  if (node.type === 'ArrayValueNode') {
    node.elements.forEach((element, index) => {
      collectEventValuePaths(
        events,
        element.value,
        `${path}[${index}]`,
        element.loc,
        operation,
        valueAction,
        strategy,
        target
      );
    });
  } else if (node.type === 'ObjectValueNode') {
    node.fields.forEach((field) => {
      collectEventValuePaths(
        events,
        field.value,
        `${path}.${field.name}`,
        field.loc,
        operation,
        valueAction,
        strategy,
        target
      );
    });
  }
}

function isSourceLocation(value: unknown): value is SourceLocation {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate['file'] === 'string' &&
    typeof candidate['line'] === 'number' &&
    typeof candidate['column'] === 'number' &&
    (candidate['offset'] === undefined || typeof candidate['offset'] === 'number')
  );
}

interface ComposedPhaseMetadata {
  readonly source: string;
  readonly loc?: SourceLocation;
}

function getComposedPhaseMetadata(value: unknown): ComposedPhaseMetadata | undefined {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return undefined;
  const candidate = value as Record<string, unknown>;
  if (typeof candidate['source'] !== 'string') return undefined;
  return {
    source: candidate['source'],
    ...(isSourceLocation(candidate['loc']) ? { loc: candidate['loc'] } : {}),
  };
}

/**
 * Create operation events for an extension or replacement body.
 *
 * Events are separate from AST nodes so internal tracing never reaches
 * formatters unless a formatter explicitly consumes the public trace.
 */
export function collectProvenanceEvents(
  body: BlockBody | undefined,
  targetPath: string,
  operation: Extract<ProvenanceEvent['operation'], 'extend' | 'override'>,
  source: SourceLocation,
  action: Extract<ProvenanceEvent['action'], 'merged' | 'replaced'>,
  strategy?: string
): ProvenanceEvent[] {
  const events: ProvenanceEvent[] = [
    {
      path: targetPath,
      operation,
      action,
      source: cloneLocation(source),
      ...(strategy ? { strategy } : {}),
      target: targetPath,
    },
  ];
  if (!body) return events;

  let textIndex = 0;
  let listIndex = 0;
  for (const entry of body.entries) {
    if (entry.type === 'FieldEntry') {
      const path = `${targetPath}.${entry.name}`;
      collectEventValuePaths(
        events,
        entry.value,
        path,
        entry.loc,
        operation,
        action,
        strategy,
        targetPath
      );
    } else if (entry.type === 'ListEntry') {
      const path = `${targetPath}[${listIndex}]`;
      listIndex++;
      collectEventValuePaths(
        events,
        entry.value,
        path,
        entry.loc,
        operation,
        action,
        strategy,
        targetPath
      );
    } else if (entry.type === 'TextEntry') {
      events.push({
        path: `${targetPath}.text[${textIndex}]`,
        operation,
        action,
        source: cloneLocation(entry.loc),
        ...(strategy ? { strategy } : {}),
        target: targetPath,
      });
      textIndex++;
    }
  }
  return events;
}

/**
 * Create provenance events for composed skill properties.
 *
 * Composition metadata is matched to inline uses by resolved source path.
 * Positional fallback would attribute malformed metadata to the wrong use.
 */
export function collectCompositionProvenanceEvents(
  phases: readonly unknown[],
  inlineUses: readonly { readonly declaration: InlineUseDeclaration }[],
  resolveSource: (declaration: InlineUseDeclaration) => string,
  skillName: string
): ProvenanceEvent[] {
  const events: ProvenanceEvent[] = [];
  const usedInlineUses = new Set<number>();

  for (const phase of phases) {
    const metadata = getComposedPhaseMetadata(phase);
    if (!metadata) continue;

    const matchedIndex = inlineUses.findIndex(({ declaration }, candidateIndex) => {
      if (usedInlineUses.has(candidateIndex)) return false;
      try {
        return resolveSource(declaration) === metadata.source;
      } catch {
        return false;
      }
    });
    if (matchedIndex < 0) continue;

    const use = inlineUses[matchedIndex]?.declaration;
    if (!use) continue;
    usedInlineUses.add(matchedIndex);

    const source = cloneLocation(metadata.loc ?? use.loc);
    const chain: ProvenanceLink = {
      operation: 'compose',
      source: cloneLocation(use.loc),
      target: source.file,
      reference: use.path.raw,
      ...(use.alias ? { alias: use.alias } : {}),
    };
    for (const property of [
      'content',
      'allowedTools',
      'references',
      'requires',
      'inputs',
      'outputs',
    ]) {
      events.push({
        path: `skills.${skillName}.${property}`,
        operation: 'compose',
        action: 'composed',
        source,
        target: source.file,
        reference: use.path.raw,
        chain: [chain],
      });
    }
  }

  return events;
}

/**
 * Create provenance events for a value replacement, including nested fields
 * and list entries.
 */
export function collectProvenanceValueEvents(
  node: ValueNode,
  targetPath: string,
  source: SourceLocation
): ProvenanceEvent[] {
  const events: ProvenanceEvent[] = [];
  collectEventValuePaths(
    events,
    node,
    targetPath,
    cloneLocation(source),
    'override',
    'replaced',
    'replace',
    targetPath
  );
  return events;
}

/**
 * Collect source and composition provenance from a legacy or canonical program.
 *
 * The collector is intentionally separate from AST projections. It can retain
 * exact canonical entry locations while callers continue consuming the legacy
 * mutable AST.
 */
export function collectProvenance(
  input: ProgramInput,
  options: {
    readonly entry?: string;
    readonly inherited?: readonly ProvenanceEntry[];
    readonly events?: readonly ProvenanceEvent[];
  } = {}
): ProvenanceTrace {
  const entries = collectEntries(input);
  const eventsByPath = new Map<string, ProvenanceEvent[]>();
  const eventsBySource = new Map<string, ProvenanceEvent[]>();
  for (const event of options.events ?? []) {
    const existing = eventsByPath.get(event.path) ?? [];
    existing.push(event);
    eventsByPath.set(event.path, existing);
    const sourceEvents = eventsBySource.get(sourceKey(event.source)) ?? [];
    sourceEvents.push(event);
    eventsBySource.set(sourceKey(event.source), sourceEvents);
  }

  const result: ProvenanceEntry[] = [];
  for (const entry of entries.values()) {
    const inheritedCandidates = options.inherited
      ? options.inherited.filter((candidate) => candidate.path === entry.path)
      : [];
    const inherited = selectInheritedEntry(entry.path, entry.source, inheritedCandidates);
    const history: ProvenanceStep[] = [];
    for (const candidate of inheritedCandidates) {
      for (const step of candidate.history) {
        const key = JSON.stringify(step);
        if (!history.some((existing) => JSON.stringify(existing) === key)) {
          history.push(deepClone(step));
        }
      }
    }
    if (history.length === 0) {
      history.push(declarationStep(entry.source, 'selected'));
    } else if (!inherited || sourceKey(inherited.source) !== sourceKey(entry.source)) {
      history.push(declarationStep(entry.source, 'selected'));
    }
    const matchingEvents = [
      ...(eventsByPath.get(entry.path) ?? []),
      ...(eventsBySource.get(sourceKey(entry.source)) ?? []),
    ];
    for (const event of matchingEvents.filter(
      (event, index, all) =>
        all.findIndex((candidate) => JSON.stringify(candidate) === JSON.stringify(event)) === index
    )) {
      history.push(eventStep(event));
    }
    result.push({
      path: entry.path,
      kind: entry.kind,
      source: cloneLocation(entry.source),
      history,
    });
  }

  return {
    version: 1,
    entry: options.entry ?? '<unknown>',
    entries: result.sort(pathSort).map((entry) => deepClone(entry)),
  };
}

/**
 * Prefix every history step with an import or inheritance link.
 */
export function prefixProvenance(trace: ProvenanceTrace, link: ProvenanceLink): ProvenanceTrace {
  return {
    version: 1,
    entry: trace.entry,
    entries: trace.entries.map((entry) => ({
      ...deepClone(entry),
      history: [
        {
          operation: link.operation,
          action: 'selected',
          source: deepClone(link.source),
          ...(link.target ? { target: link.target } : {}),
          ...(link.reference ? { reference: link.reference } : {}),
          ...(link.alias ? { alias: link.alias } : {}),
          chain: [deepClone(link)],
        },
        ...entry.history.map((step) => ({
          ...deepClone(step),
          chain: [deepClone(link), ...step.chain.map((item) => deepClone(item))],
        })),
      ],
    })),
  };
}

/**
 * Return an empty trace for resolver failures that have no AST.
 */
export function emptyProvenance(entry = '<unknown>'): ProvenanceTrace {
  return { version: 1, entry, entries: [] };
}
