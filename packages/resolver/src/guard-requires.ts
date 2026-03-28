import type { Program, Block, ObjectContent, TextContent, Value } from '@promptscript/core';
import { CircularGuardRequiresError } from '@promptscript/core';

/**
 * Options for guard requires resolution.
 */
export interface GuardRequiresOptions {
  /** Maximum depth for transitive dependency resolution */
  maxDepth: number;
}

/**
 * Resolved guard dependency entry injected as `__resolvedRequires`.
 */
interface ResolvedGuardDep {
  name: string;
  content: string;
}

/**
 * Extract content string from a guard entry value.
 *
 * Guard content can be a plain string or a TextContent object with a `value` property.
 */
function extractContent(value: Value): string | undefined {
  if (typeof value === 'string') {
    return value;
  }
  if (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    'type' in value &&
    (value as TextContent).type === 'TextContent'
  ) {
    return (value as TextContent).value;
  }
  return undefined;
}

/**
 * Extract the `requires` array from a guard entry's properties.
 */
function extractRequires(guardProps: Record<string, Value>): string[] {
  const req = guardProps['requires'];
  if (!req || !Array.isArray(req)) {
    return [];
  }
  return req.filter((v): v is string => typeof v === 'string');
}

/**
 * Recursively resolve guard dependencies, collecting them in order.
 */
function collectDeps(
  guardName: string,
  guardsMap: Map<string, Record<string, Value>>,
  visited: Set<string>,
  chain: string[],
  depth: number,
  maxDepth: number
): ResolvedGuardDep[] {
  const guardProps = guardsMap.get(guardName);
  if (!guardProps) {
    return [];
  }

  const requires = extractRequires(guardProps);
  if (requires.length === 0) {
    return [];
  }

  const result: ResolvedGuardDep[] = [];

  for (const depName of requires) {
    // Cycle detection
    if (chain.includes(depName)) {
      throw new CircularGuardRequiresError([...chain, depName]);
    }

    // Skip already visited (deduplication)
    if (visited.has(depName)) {
      continue;
    }

    const depProps = guardsMap.get(depName);
    if (!depProps) {
      continue;
    }

    visited.add(depName);

    // Recurse if within depth limit
    if (depth < maxDepth) {
      const transitive = collectDeps(
        depName,
        guardsMap,
        visited,
        [...chain, depName],
        depth + 1,
        maxDepth
      );
      result.push(...transitive);
    }

    // Extract content for this dependency
    const content = extractContent(depProps['content'] ?? '');
    if (content !== undefined) {
      result.push({ name: depName, content });
    }
  }

  return result;
}

/**
 * Resolve guard `requires` dependencies by injecting `__resolvedRequires`
 * into guard entries that declare dependencies.
 *
 * @param ast - The program AST
 * @param options - Resolution options including maxDepth
 * @returns The AST with `__resolvedRequires` injected into guard entries
 */
export function resolveGuardRequires(ast: Program, options: GuardRequiresOptions): Program {
  // Find the @guards block
  const guardsBlockIndex = ast.blocks.findIndex((b: Block) => b.name === 'guards');

  if (guardsBlockIndex === -1) {
    return ast;
  }

  const guardsBlock = ast.blocks[guardsBlockIndex]!;
  if (guardsBlock.content.type !== 'ObjectContent') {
    return ast;
  }

  const objectContent = guardsBlock.content as ObjectContent;
  const properties = objectContent.properties;

  // Build a map of guard name -> properties for lookup
  const guardsMap = new Map<string, Record<string, Value>>();
  for (const [name, value] of Object.entries(properties)) {
    if (
      value !== null &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      !('type' in value && (value as { type: string }).type === 'TextContent')
    ) {
      guardsMap.set(name, value as Record<string, Value>);
    }
  }

  // Check if any guard has requires
  let hasRequires = false;
  for (const props of guardsMap.values()) {
    if (extractRequires(props).length > 0) {
      hasRequires = true;
      break;
    }
  }

  if (!hasRequires) {
    return ast;
  }

  // Resolve requires for each guard entry
  const newProperties: Record<string, Value> = {};

  for (const [name, value] of Object.entries(properties)) {
    const guardProps = guardsMap.get(name);
    if (!guardProps || extractRequires(guardProps).length === 0) {
      newProperties[name] = value;
      continue;
    }

    const visited = new Set<string>();
    const resolved = collectDeps(name, guardsMap, visited, [name], 1, options.maxDepth);

    if (resolved.length > 0) {
      newProperties[name] = {
        ...guardProps,
        __resolvedRequires: resolved.map((dep) => ({
          name: dep.name,
          content: dep.content,
        })),
      } as unknown as Value;
    } else {
      newProperties[name] = value;
    }
  }

  const newContent: ObjectContent = {
    ...objectContent,
    properties: newProperties,
  };

  const newBlock = {
    ...guardsBlock,
    content: newContent,
  } as Block;

  const newBlocks = [...ast.blocks];
  newBlocks[guardsBlockIndex] = newBlock;

  return {
    ...ast,
    blocks: newBlocks,
  };
}
