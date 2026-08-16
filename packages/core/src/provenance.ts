import type {
  BlockBody,
  BlockContent,
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
  const { operation, action, source, strategy, target, reference, alias, trace, chain } = event;
  return {
    operation,
    action,
    source: cloneLocation(source),
    ...(strategy ? { strategy } : {}),
    ...(target ? { target } : {}),
    ...(reference ? { reference } : {}),
    ...(alias ? { alias } : {}),
    ...(trace ? { trace: deepClone(trace) } : {}),
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
  target: string,
  finalNode?: ValueNode,
  resolveDetails?: (
    path: string,
    node: ValueNode
  ) => Pick<ProvenanceEvent, 'action' | 'strategy'> | undefined,
  baseNode?: ValueNode
): void {
  const defaultAction: ProvenanceEvent['action'] =
    action === 'replaced'
      ? 'replaced'
      : operation === 'extend' && (strategy === 'append' || node.type === 'ArrayValueNode')
        ? 'appended'
        : action;
  const details = resolveDetails?.(path, node);
  const valueAction = details?.action ?? defaultAction;
  const valueStrategy = details?.strategy ?? strategy;
  events.push({
    path,
    operation,
    action: valueAction,
    source,
    ...(valueStrategy ? { strategy: valueStrategy } : {}),
    target,
  });
  if (node.type === 'ArrayValueNode') {
    const finalElements = finalNode?.type === 'ArrayValueNode' ? finalNode.elements : undefined;
    const baseElements = baseNode?.type === 'ArrayValueNode' ? baseNode.elements : undefined;
    const usedFinalIndexes = new Set<number>();
    node.elements.forEach((element, index) => {
      if (
        valueStrategy === 'append' &&
        baseElements?.some(
          (candidate) =>
            JSON.stringify(valueNodeToValue(candidate.value)) ===
            JSON.stringify(valueNodeToValue(element.value))
        )
      ) {
        return;
      }
      const finalIndex = finalElements
        ? finalElements.findIndex(
            (candidate, candidateIndex) =>
              !usedFinalIndexes.has(candidateIndex) &&
              sourceKey(candidate.loc) === sourceKey(element.loc) &&
              JSON.stringify(valueNodeToValue(candidate.value)) ===
                JSON.stringify(valueNodeToValue(element.value))
          )
        : index;
      if (finalIndex < 0) return;
      usedFinalIndexes.add(finalIndex);
      const finalElement = finalElements?.[finalIndex];
      collectEventValuePaths(
        events,
        element.value,
        `${path}[${finalIndex}]`,
        element.loc,
        operation,
        valueAction,
        valueStrategy,
        target,
        finalElement?.value,
        resolveDetails,
        baseElements?.[index]?.value
      );
    });
  } else if (node.type === 'ObjectValueNode') {
    node.fields.forEach((field) => {
      const finalField =
        finalNode?.type === 'ObjectValueNode'
          ? finalNode.fields.find((candidate) => candidate.name === field.name)
          : undefined;
      const baseField =
        baseNode?.type === 'ObjectValueNode'
          ? baseNode.fields.find((candidate) => candidate.name === field.name)
          : undefined;
      collectEventValuePaths(
        events,
        field.value,
        `${path}.${field.name}`,
        field.loc,
        operation,
        valueAction,
        valueStrategy,
        target,
        finalField?.value,
        resolveDetails,
        baseField?.value
      );
    });
  }
}

function finalNodeForEntry(
  body: BlockBody | undefined,
  entry: Extract<BlockBody['entries'][number], { type: 'FieldEntry' | 'ListEntry' }>
): ValueNode | undefined {
  if (!body) return undefined;
  switch (entry.type) {
    case 'FieldEntry': {
      const match = [...body.entries]
        .reverse()
        .find((candidate) => candidate.type === 'FieldEntry' && candidate.name === entry.name);
      return match?.type === 'FieldEntry' ? match.value : undefined;
    }
    case 'ListEntry': {
      const sourceEntries = body.entries.filter(
        (candidate): candidate is Extract<BlockBody['entries'][number], { type: 'ListEntry' }> =>
          candidate.type === 'ListEntry'
      );
      const index = sourceEntries.findIndex(
        (candidate) =>
          JSON.stringify(valueNodeToValue(candidate.value)) ===
          JSON.stringify(valueNodeToValue(entry.value))
      );
      return index >= 0 ? sourceEntries[index]?.value : undefined;
    }
  }
}

function finalListIndexForEntry(
  body: BlockBody | undefined,
  entry: Extract<BlockBody['entries'][number], { type: 'ListEntry' }>,
  usedIndexes: Set<number>
): number {
  if (!body) return -1;
  const finalEntries = body.entries.filter(
    (candidate): candidate is Extract<BlockBody['entries'][number], { type: 'ListEntry' }> =>
      candidate.type === 'ListEntry'
  );
  return finalEntries.findIndex(
    (candidate, index) =>
      !usedIndexes.has(index) &&
      sourceKey(candidate.loc) === sourceKey(entry.loc) &&
      JSON.stringify(valueNodeToValue(candidate.value)) ===
        JSON.stringify(valueNodeToValue(entry.value))
  );
}

function valueNodeToValue(node: ValueNode): unknown {
  switch (node.type) {
    case 'ArrayValueNode':
      return node.elements.map((element) => valueNodeToValue(element.value));
    case 'ObjectValueNode':
      return Object.fromEntries(
        node.fields.map((field) => [field.name, valueNodeToValue(field.value)])
      );
    case 'TextValueNode':
    case 'ScalarValueNode':
      return node.value;
    case 'TemplateValueNode':
      return { type: node.type, name: node.name };
    case 'TypeExpressionValueNode':
      return { type: node.type, expression: node.expression };
  }
}

export interface ProvenanceEventOptions {
  /** Final content used to map incoming values to final canonical positions. */
  readonly finalContent?: BlockContent;
  /** Final canonical body used to preserve source locations during mapping. */
  readonly finalBody?: BlockBody;
  /** Base canonical body used to suppress duplicate append events. */
  readonly baseBody?: BlockBody;
  /** Base content used to suppress duplicate append events. */
  readonly baseContent?: BlockContent;
  /** Per-path strategy override for skill-aware merges. */
  readonly resolveDetails?: (
    path: string,
    node: ValueNode
  ) => Pick<ProvenanceEvent, 'action' | 'strategy'> | undefined;
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
  readonly definitionLoc?: SourceLocation;
  readonly provenance?: ProvenanceTrace;
}

function isProvenanceTrace(value: unknown): value is ProvenanceTrace {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  return (
    candidate['version'] === 1 &&
    typeof candidate['entry'] === 'string' &&
    Array.isArray(candidate['entries'])
  );
}

function getComposedPhaseMetadata(value: unknown): ComposedPhaseMetadata | undefined {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return undefined;
  const candidate = value as Record<string, unknown>;
  if (typeof candidate['source'] !== 'string') return undefined;
  return {
    source: candidate['source'],
    ...(isSourceLocation(candidate['loc']) ? { loc: candidate['loc'] } : {}),
    ...(isSourceLocation(candidate['definitionLoc'])
      ? { definitionLoc: candidate['definitionLoc'] }
      : {}),
    ...(isProvenanceTrace(candidate['provenance']) ? { provenance: candidate['provenance'] } : {}),
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
  strategy?: string,
  options: ProvenanceEventOptions = {}
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
  const finalBody =
    options.finalBody ??
    (options.finalContent ? blockContentToBody(options.finalContent) : undefined);
  const baseBody =
    options.baseBody ?? (options.baseContent ? blockContentToBody(options.baseContent) : undefined);
  const usedFinalListIndexes = new Set<number>();
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
        targetPath,
        finalNodeForEntry(finalBody, entry),
        options.resolveDetails,
        finalNodeForEntry(baseBody, entry)
      );
    } else if (entry.type === 'ListEntry') {
      const finalIndex = finalListIndexForEntry(finalBody, entry, usedFinalListIndexes);
      if (finalBody && finalIndex < 0) {
        listIndex++;
        continue;
      }
      const path = `${targetPath}[${finalBody ? finalIndex : listIndex}]`;
      listIndex++;
      if (finalBody) usedFinalListIndexes.add(finalIndex);
      collectEventValuePaths(
        events,
        entry.value,
        path,
        entry.loc,
        operation,
        action,
        strategy,
        targetPath,
        finalNodeForEntry(finalBody, entry),
        options.resolveDetails,
        finalNodeForEntry(baseBody, entry)
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
  skillName: string,
  finalProperties?: readonly string[]
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
    const useSource = cloneLocation(metadata.loc ?? use.loc);
    const chain: ProvenanceLink = {
      operation: 'compose',
      source: useSource,
      target: source.file,
      reference: use.path.raw,
      ...(use.alias ? { alias: use.alias } : {}),
    };
    const childLinks = metadata.provenance
      ? metadata.provenance.entries.flatMap((entry) =>
          entry.history.flatMap((step) => {
            const links: ProvenanceLink[] = [];
            if (step.operation !== 'declaration' && step.operation !== 'generated') {
              links.push({
                operation: step.operation,
                source: cloneLocation(step.source),
                ...(step.target ? { target: step.target } : {}),
                ...(step.reference ? { reference: step.reference } : {}),
                ...(step.alias ? { alias: step.alias } : {}),
              });
            }
            links.push(...step.chain.map((link) => deepClone(link)));
            return links;
          })
        )
      : [];
    const mergedChain = [chain, ...childLinks].filter(
      (link, index, links) =>
        links.findIndex((candidate) => JSON.stringify(candidate) === JSON.stringify(link)) === index
    );
    for (const property of ['content', 'allowedTools', 'references', 'requires']) {
      if (finalProperties && !finalProperties.includes(property)) continue;
      events.push({
        path: `skills.${skillName}.${property}`,
        operation: 'compose',
        action: 'composed',
        source,
        target: source.file,
        reference: use.path.raw,
        trace: metadata.provenance ? deepClone(metadata.provenance) : undefined,
        chain: mergedChain,
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
