import type { AgentProvenance, MixedContent, ObjectContent, Program, Value } from './types/ast.js';
import type { SourceLocation } from './types/source.js';

/**
 * A group of agent definitions that use the same resolved name.
 */
export interface AgentConflict {
  /** Conflicting resolved name */
  name: string;
  /** Definitions that contributed the name */
  provenance: AgentProvenance[];
}

function withoutLocations(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(withoutLocations);
  if (typeof value !== 'object' || value === null) return value;

  const result: Record<string, unknown> = {};
  for (const [key, nested] of Object.entries(value)) {
    if (key !== 'loc') {
      result[key] = withoutLocations(nested);
    }
  }
  return result;
}

function agentValuesEqual(left: Value, right: Value): boolean {
  return JSON.stringify(withoutLocations(left)) === JSON.stringify(withoutLocations(right));
}

/**
 * Build a qualified agent name from an import namespace.
 */
export function qualifyAgentName(namespace: string, name: string): string {
  return `${namespace}.${name}`;
}

/**
 * Convert a PromptScript agent name into a portable native identifier.
 *
 * Dots are namespace separators in qualified names, so native targets use
 * hyphens to avoid target-specific nested-path semantics.
 */
export function toNativeAgentName(name: string): string {
  return name.replace(/\./g, '-');
}

/**
 * Create a deterministic, collision-safe native name map.
 */
export function createNativeAgentNameMap(names: readonly string[]): ReadonlyMap<string, string> {
  const result = new Map<string, string>();
  const used = new Set<string>();

  for (const name of [...new Set(names)].sort()) {
    const baseName = toNativeAgentName(name);
    let nativeName = baseName;
    let suffix = 2;
    while (used.has(nativeName)) {
      nativeName = `${baseName}-${suffix}`;
      suffix += 1;
    }
    used.add(nativeName);
    result.set(name, nativeName);
  }

  return result;
}

/**
 * Return the agents object from a resolved program.
 */
export function getAgentProperties(program: Program): Record<string, Value> {
  const block = program.blocks.find((candidate) => candidate.name === 'agents');
  if (!block) return {};
  if (block.content.type !== 'ObjectContent' && block.content.type !== 'MixedContent') {
    return {};
  }
  return block.content.properties;
}

/**
 * Find provenance for one resolved agent name.
 */
export function getAgentProvenance(program: Program, name: string): AgentProvenance | undefined {
  return getAgentProvenanceEntries(program, name)[0];
}

/**
 * Return every provenance entry for one resolved agent name.
 */
export function getAgentProvenanceEntries(program: Program, name: string): AgentProvenance[] {
  return (program.agentProvenance ?? []).filter((entry) => entry.name === name);
}

/**
 * Add fallback provenance for agent definitions that have no recorded origin.
 */
export function ensureAgentProvenance(
  program: Program,
  source: string,
  action: AgentProvenance['action'] = 'local'
): Program {
  const properties = getAgentProperties(program);
  const names = Object.keys(properties);
  if (names.length === 0) return program;

  const existing = program.agentProvenance ?? [];
  const known = new Set(existing.map((entry) => entry.name));
  const additions = names
    .filter((name) => !known.has(name))
    .map<AgentProvenance>((name) => ({
      name,
      source,
      action,
      loc: program.blocks.find((block) => block.name === 'agents')?.loc,
    }));
  if (additions.length === 0) return program;

  return {
    ...program,
    agentProvenance: [...existing, ...additions],
  };
}

/**
 * Collect conflicting agent definitions before a merge.
 */
export function findAgentConflicts(
  target: Program,
  source: Program,
  sourceImportPath: string,
  importLocation?: SourceLocation
): AgentConflict[] {
  const targetProperties = getAgentProperties(target);
  const sourceProperties = getAgentProperties(source);
  const conflicts: AgentConflict[] = [];

  for (const name of Object.keys(sourceProperties)) {
    if (!Object.hasOwn(targetProperties, name)) continue;
    if (agentValuesEqual(sourceProperties[name]!, targetProperties[name]!)) {
      continue;
    }

    const targetProvenance = getAgentProvenanceEntries(target, name);
    const sourceProvenance = getAgentProvenanceEntries(source, name);
    if (targetProvenance.length === 0) {
      targetProvenance.push({
        name,
        source: target.loc.file,
        action: 'local',
        loc: importLocation,
      });
    }
    if (sourceProvenance.length === 0) {
      sourceProvenance.push({
        name,
        source: source.loc.file,
        importPath: sourceImportPath,
        action: 'imported',
        loc: importLocation,
      });
    }
    conflicts.push({
      name,
      provenance: [...targetProvenance, ...sourceProvenance],
    });
  }

  return conflicts;
}

/**
 * Replace agent property names with an import-qualified namespace.
 */
export function qualifyAgentProperties(
  content: ObjectContent | MixedContent,
  namespace: string,
  source: Program,
  importPath: string,
  importLocation: SourceLocation
): { content: ObjectContent | MixedContent; provenance: AgentProvenance[] } {
  const properties: Record<string, Value> = {};
  const provenance: AgentProvenance[] = [];

  for (const [name, value] of Object.entries(content.properties)) {
    const qualifiedName = qualifyAgentName(namespace, name);
    properties[qualifiedName] = value;
    const originals = getAgentProvenanceEntries(source, name);
    const entries =
      originals.length > 0
        ? originals
        : [
            {
              name,
              source: source.loc.file,
              action: 'imported' as const,
            },
          ];
    provenance.push(
      ...entries.map((original) => ({
        ...original,
        name: qualifiedName,
        importPath,
        namespace: original.namespace ? `${namespace}.${original.namespace}` : namespace,
        action: 'qualified' as const,
        loc: original.loc ?? importLocation,
      }))
    );
  }

  return {
    content: {
      ...content,
      properties,
    },
    provenance,
  };
}
