/**
 * Browser-compatible resolver for PromptScript files.
 *
 * Replaces the Node.js file-system-based Resolver with one that
 * uses an in-memory VirtualFileSystem.
 */

import { parse } from '@promptscript/parser';
import {
  noopLogger,
  type Logger,
  type Program,
  type PathReference,
  ResolveError,
  CircularDependencyError,
  deepMerge,
  deepClone,
  isTextContent,
  bindParams,
  interpolateAST,
  type TemplateContext,
} from '@promptscript/core';
import { VirtualFileSystem } from './virtual-fs.js';
import type {
  Block,
  BlockContent,
  TextContent,
  ObjectContent,
  ArrayContent,
  MixedContent,
  Value,
  UseDeclaration,
  ExtendBlock,
} from '@promptscript/core';

/**
 * Options for the browser resolver.
 */
export interface BrowserResolverOptions {
  /** Virtual file system containing all files */
  fs: VirtualFileSystem;
  /** Whether to cache resolved ASTs. Defaults to true. */
  cache?: boolean;
  /** Logger for verbose/debug output */
  logger?: Logger;
  /**
   * Simulated environment variables for interpolation.
   * When provided, ${VAR} and ${VAR:-default} syntax in source files
   * will be replaced with values from this map.
   */
  envVars?: Record<string, string>;
}

/**
 * Result of resolving a PromptScript file.
 */
export interface ResolvedAST {
  /** The resolved AST, or null if resolution failed */
  ast: Program | null;
  /** List of all source files involved in resolution */
  sources: string[];
  /** List of errors encountered during resolution */
  errors: ResolveError[];
}

/**
 * Import marker block prefix for storing imported content.
 */
const IMPORT_MARKER_PREFIX = '__import__';

/**
 * Browser-compatible resolver for PromptScript files with inheritance and import support.
 *
 * This resolver uses an in-memory virtual file system instead of Node.js fs.
 */
export class BrowserResolver {
  private readonly fs: VirtualFileSystem;
  private readonly cache: Map<string, ResolvedAST>;
  private readonly resolving: Set<string>;
  private readonly cacheEnabled: boolean;
  private readonly logger: Logger;
  private readonly envVars?: Record<string, string>;

  constructor(options: BrowserResolverOptions) {
    this.fs = options.fs;
    this.cache = new Map();
    this.resolving = new Set();
    this.cacheEnabled = options.cache !== false;
    this.logger = options.logger ?? noopLogger;
    this.envVars = options.envVars;
  }

  /**
   * Resolve a PromptScript file and all its dependencies.
   *
   * @param entryPath - Path to the entry file
   * @returns Resolved AST with sources and errors
   */
  async resolve(entryPath: string): Promise<ResolvedAST> {
    const absPath = this.normalizePath(entryPath);

    // Check for circular dependency
    if (this.resolving.has(absPath)) {
      this.logger.debug(`Circular dependency detected: ${absPath}`);
      throw new CircularDependencyError([...this.resolving, absPath]);
    }

    // Check cache
    if (this.cacheEnabled && this.cache.has(absPath)) {
      this.logger.debug(`Cache hit: ${absPath}`);
      return this.cache.get(absPath)!;
    }

    this.resolving.add(absPath);
    this.logger.verbose(`Parsing ${absPath}`);

    try {
      const result = await this.doResolve(absPath);

      if (this.cacheEnabled) {
        this.logger.debug(`Cache store: ${absPath}`);
        this.cache.set(absPath, result);
      }

      return result;
    } finally {
      this.resolving.delete(absPath);
    }
  }

  /**
   * Normalize a path for consistent lookups.
   */
  private normalizePath(path: string): string {
    let normalized = path.replace(/\\/g, '/');

    // Remove leading slash
    if (normalized.startsWith('/')) {
      normalized = normalized.slice(1);
    }

    // Add .prs extension if missing
    if (!normalized.endsWith('.prs')) {
      normalized = `${normalized}.prs`;
    }

    return normalized;
  }

  /**
   * Resolve a PathReference to a normalized path.
   */
  private resolveRef(ref: PathReference, fromFile: string): string {
    if (ref.isRelative) {
      // Get directory of the current file
      const dir = this.dirname(fromFile);
      // Resolve relative path
      return this.normalizePath(this.joinPath(dir, ref.raw));
    }

    // Registry path: @namespace/path
    if (ref.raw.startsWith('@')) {
      const match = ref.raw.match(/^@([a-zA-Z_][a-zA-Z0-9_-]*)\/(.+?)(?:@[\d.]+)?$/);
      if (match && match[1] && match[2]) {
        const namespace = match[1];
        const segments = match[2];
        const fileName = segments.endsWith('.prs') ? segments : `${segments}.prs`;
        return `@${namespace}/${fileName}`;
      }
    }

    return this.normalizePath(ref.raw);
  }

  /**
   * Get directory name from a path.
   */
  private dirname(path: string): string {
    const lastSlash = path.lastIndexOf('/');
    return lastSlash === -1 ? '' : path.slice(0, lastSlash);
  }

  /**
   * Join path segments.
   */
  private joinPath(...segments: string[]): string {
    const parts: string[] = [];

    for (const segment of segments) {
      if (!segment) continue;

      const subParts = segment.split('/');
      for (const part of subParts) {
        if (part === '..') {
          parts.pop();
        } else if (part !== '.' && part !== '') {
          parts.push(part);
        }
      }
    }

    return parts.join('/');
  }

  /**
   * Perform the actual resolution.
   */
  private async doResolve(absPath: string): Promise<ResolvedAST> {
    const sources: string[] = [absPath];
    const errors: ResolveError[] = [];

    // Load and parse file
    const parseData = this.loadAndParse(absPath, sources, errors);
    if (!parseData.ast) {
      return { ast: null, sources, errors };
    }

    let ast = parseData.ast;

    // Resolve inheritance
    ast = await this.resolveInherit(ast, absPath, sources, errors);

    // Resolve imports
    ast = await this.resolveImports(ast, absPath, sources, errors);

    // Apply extensions
    if (ast.extends.length > 0) {
      this.logger.debug(`Applying ${ast.extends.length} extension(s)`);
    }
    ast = this.applyExtends(ast);

    this.logger.debug(`Resolved ${sources.length} source file(s)`);
    return {
      ast,
      sources: [...new Set(sources)],
      errors,
    };
  }

  /**
   * Load and parse a file.
   */
  private loadAndParse(
    absPath: string,
    _sources: string[],
    errors: ResolveError[]
  ): { ast: Program | null } {
    let source: string;
    try {
      source = this.fs.read(absPath);
    } catch {
      errors.push(new ResolveError(`File not found: ${absPath}`));
      return { ast: null };
    }

    // Configure parsing options
    const parseOptions: Parameters<typeof parse>[1] = { filename: absPath };

    // Enable environment variable interpolation if envVars are provided
    if (this.envVars && Object.keys(this.envVars).length > 0) {
      parseOptions.interpolateEnv = true;
      parseOptions.envProvider = (name: string) => this.envVars?.[name];
    }

    const parseResult = parse(source, parseOptions);

    if (!parseResult.ast) {
      for (const e of parseResult.errors) {
        errors.push(new ResolveError(e.message, e.location));
      }
      return { ast: null };
    }

    for (const err of parseResult.errors) {
      errors.push(new ResolveError(err.message, err.location));
    }

    return { ast: parseResult.ast };
  }

  /**
   * Resolve @inherit declaration.
   */
  private async resolveInherit(
    ast: Program,
    absPath: string,
    sources: string[],
    errors: ResolveError[]
  ): Promise<Program> {
    if (!ast.inherit) {
      return ast;
    }

    const parentPath = this.resolveRef(ast.inherit.path, absPath);
    this.logger.verbose(`Resolving inherit: ${ast.inherit.path.raw}`);
    this.logger.verbose(`  → ${parentPath}`);

    try {
      const parent = await this.resolve(parentPath);
      sources.push(...parent.sources);
      errors.push(...parent.errors);

      if (parent.ast) {
        // Handle parameterized inheritance (template interpolation)
        let resolvedParent = parent.ast;
        if (parent.ast.meta?.params || ast.inherit.params) {
          this.logger.debug(`Binding template parameters for ${parentPath}`);
          try {
            const params = bindParams(
              ast.inherit.params,
              parent.ast.meta?.params,
              parentPath,
              ast.inherit.loc
            );

            if (params.size > 0) {
              const ctx: TemplateContext = { params, sourceFile: parentPath };
              resolvedParent = interpolateAST(parent.ast, ctx);
              this.logger.debug(`Interpolated ${params.size} parameter(s)`);
            }
          } catch (err) {
            errors.push(new ResolveError((err as Error).message, ast.inherit.loc));
            return ast;
          }
        }

        this.logger.debug(`Merging with parent AST`);
        return this.resolveInheritance(resolvedParent, ast);
      }
    } catch (err) {
      if (err instanceof CircularDependencyError) {
        throw err;
      }
      errors.push(new ResolveError(`Failed to resolve parent: ${(err as Error).message}`));
    }

    return ast;
  }

  /**
   * Resolve @use imports.
   */
  private async resolveImports(
    ast: Program,
    absPath: string,
    sources: string[],
    errors: ResolveError[]
  ): Promise<Program> {
    let result = ast;

    for (const use of ast.uses) {
      const importPath = this.resolveRef(use.path, absPath);
      this.logger.verbose(`Resolving import: ${use.path.raw}`);
      this.logger.verbose(`  → ${importPath}`);

      try {
        const imported = await this.resolve(importPath);
        sources.push(...imported.sources);
        errors.push(...imported.errors);

        if (imported.ast) {
          // Handle parameterized imports (template interpolation)
          let resolvedImport = imported.ast;
          if (imported.ast.meta?.params || use.params) {
            this.logger.debug(`Binding template parameters for ${importPath}`);
            try {
              const params = bindParams(use.params, imported.ast.meta?.params, importPath, use.loc);

              if (params.size > 0) {
                const ctx: TemplateContext = { params, sourceFile: importPath };
                resolvedImport = interpolateAST(imported.ast, ctx);
                this.logger.debug(`Interpolated ${params.size} parameter(s)`);
              }
            } catch (err) {
              errors.push(new ResolveError((err as Error).message, use.loc));
              continue;
            }
          }

          this.logger.debug(`Merging import${use.alias ? ` as "${use.alias}"` : ''}`);
          result = this.resolveUses(result, use, resolvedImport);
        }
      } catch (err) {
        if (err instanceof CircularDependencyError) {
          throw err;
        }
        errors.push(new ResolveError(`Failed to resolve import: ${(err as Error).message}`));
      }
    }

    return result;
  }

  /**
   * Clear the resolution cache.
   */
  clearCache(): void {
    this.cache.clear();
  }

  // ============================================================
  // Inheritance Resolution (ported from @promptscript/resolver)
  // ============================================================

  /**
   * Resolve inheritance by merging a parent program into a child program.
   */
  private resolveInheritance(parent: Program, child: Program): Program {
    return {
      ...child,
      meta:
        parent.meta && child.meta
          ? {
              ...child.meta,
              fields: deepMerge(parent.meta.fields, child.meta.fields),
            }
          : (child.meta ?? parent.meta),
      blocks: this.mergeBlocks(parent.blocks, child.blocks),
      inherit: undefined,
      uses: child.uses,
      extends: child.extends,
    };
  }

  /**
   * Merge two arrays of blocks, combining blocks with the same name.
   */
  private mergeBlocks(parent: Block[], child: Block[]): Block[] {
    const childMap = new Map(child.map((b) => [b.name, b]));
    const result: Block[] = [];
    const seen = new Set<string>();

    for (const pb of parent) {
      const cb = childMap.get(pb.name);
      if (cb) {
        result.push(this.mergeBlock(pb, cb));
        seen.add(pb.name);
      } else {
        result.push(deepClone(pb));
      }
    }

    for (const cb of child) {
      if (!seen.has(cb.name)) {
        result.push(deepClone(cb));
      }
    }

    return result;
  }

  /**
   * Merge two blocks with the same name.
   */
  private mergeBlock(parent: Block, child: Block): Block {
    return {
      ...child,
      content: this.mergeBlockContent(parent.content, child.content),
    };
  }

  /**
   * Merge block content based on content types.
   */
  private mergeBlockContent(parent: BlockContent, child: BlockContent): BlockContent {
    if (parent.type === child.type) {
      switch (child.type) {
        case 'TextContent':
          return this.mergeTextContent(parent as TextContent, child);
        case 'ObjectContent':
          return this.mergeObjectContent(parent as ObjectContent, child);
        case 'ArrayContent':
          return this.mergeArrayContent(parent as ArrayContent, child);
        case 'MixedContent':
          return this.mergeMixedContent(parent as MixedContent, child);
      }
    }

    if (parent.type === 'MixedContent' && child.type === 'TextContent') {
      return {
        ...parent,
        text: parent.text ? this.mergeTextContent(parent.text, child) : deepClone(child),
      };
    }

    if (parent.type === 'TextContent' && child.type === 'MixedContent') {
      return {
        ...child,
        text: child.text ? this.mergeTextContent(parent, child.text) : deepClone(parent),
      };
    }

    if (parent.type === 'MixedContent' && child.type === 'ObjectContent') {
      return {
        ...parent,
        properties: deepMerge(parent.properties, child.properties),
      };
    }

    if (parent.type === 'ObjectContent' && child.type === 'MixedContent') {
      return {
        ...child,
        properties: deepMerge(parent.properties, child.properties),
      };
    }

    return deepClone(child);
  }

  /**
   * Merge TextContent by concatenating values.
   */
  private mergeTextContent(parent: TextContent, child: TextContent): TextContent {
    const parentVal = parent.value.trim();
    const childVal = child.value.trim();

    if (parentVal === childVal) {
      return { ...child, value: childVal };
    }

    if (childVal.includes(parentVal)) {
      return { ...child, value: childVal };
    }

    if (parentVal.includes(childVal)) {
      return { ...child, value: parentVal };
    }

    return {
      ...child,
      value: `${parentVal}\n\n${childVal}`,
    };
  }

  /**
   * Merge ObjectContent by deep merging properties.
   */
  private mergeObjectContent(parent: ObjectContent, child: ObjectContent): ObjectContent {
    return {
      ...child,
      properties: this.mergeProperties(parent.properties, child.properties),
    };
  }

  /**
   * Merge object properties with special handling for values.
   */
  private mergeProperties(
    parent: Record<string, Value>,
    child: Record<string, Value>
  ): Record<string, Value> {
    const result: Record<string, Value> = { ...parent };

    for (const [key, childVal] of Object.entries(child)) {
      const parentVal = result[key];

      if (parentVal === undefined) {
        result[key] = this.deepCloneValue(childVal);
      } else if (Array.isArray(childVal) && Array.isArray(parentVal)) {
        result[key] = this.uniqueConcat(parentVal, childVal);
      } else if (isTextContent(childVal) && isTextContent(parentVal)) {
        result[key] = this.deepCloneValue(childVal);
      } else if (this.isPlainObject(childVal) && this.isPlainObject(parentVal)) {
        result[key] = this.mergeProperties(
          parentVal as Record<string, Value>,
          childVal as Record<string, Value>
        );
      } else {
        result[key] = this.deepCloneValue(childVal);
      }
    }

    return result;
  }

  /**
   * Merge ArrayContent by unique concatenation.
   */
  private mergeArrayContent(parent: ArrayContent, child: ArrayContent): ArrayContent {
    return {
      ...child,
      elements: this.uniqueConcat(parent.elements, child.elements),
    };
  }

  /**
   * Merge MixedContent by merging both text and properties.
   */
  private mergeMixedContent(parent: MixedContent, child: MixedContent): MixedContent {
    return {
      ...child,
      text:
        parent.text && child.text
          ? this.mergeTextContent(parent.text, child.text)
          : (child.text ?? parent.text),
      properties: this.mergeProperties(parent.properties, child.properties),
    };
  }

  // ============================================================
  // Import Resolution (ported from @promptscript/resolver)
  // ============================================================

  /**
   * Resolve @use imports by merging blocks into target.
   */
  private resolveUses(target: Program, use: UseDeclaration, source: Program): Program {
    const mergedBlocks = this.mergeBlocksForImport(target.blocks, source.blocks);

    const aliasedBlocks: Block[] = [];
    if (use.alias) {
      const alias = use.alias;
      const markerName = `${IMPORT_MARKER_PREFIX}${alias}`;

      const marker: Block = {
        type: 'Block',
        name: markerName,
        content: {
          type: 'ObjectContent',
          properties: {
            __source: use.path.raw,
            __blocks: source.blocks.map((b) => b.name),
          },
          loc: use.loc,
        } as ObjectContent,
        loc: use.loc,
      };

      aliasedBlocks.push(marker);

      for (const block of source.blocks) {
        aliasedBlocks.push({
          ...block,
          name: `${IMPORT_MARKER_PREFIX}${alias}.${block.name}`,
        });
      }
    }

    return {
      ...target,
      blocks: [...mergedBlocks, ...aliasedBlocks],
    };
  }

  /**
   * Merge blocks for imports (source first, then target).
   */
  private mergeBlocksForImport(target: Block[], source: Block[]): Block[] {
    const targetMap = new Map(target.map((b) => [b.name, b]));
    const result: Block[] = [];
    const seen = new Set<string>();

    for (const tb of target) {
      const sb = source.find((b) => b.name === tb.name);
      if (sb) {
        result.push(this.mergeBlock(sb, tb));
        seen.add(tb.name);
      } else {
        result.push(deepClone(tb));
      }
    }

    for (const sb of source) {
      if (!seen.has(sb.name) && !targetMap.has(sb.name)) {
        result.push(deepClone(sb));
      }
    }

    return result;
  }

  // ============================================================
  // Extension Resolution (ported from @promptscript/resolver)
  // ============================================================

  /**
   * Apply all @extend blocks to resolve extensions.
   */
  private applyExtends(ast: Program): Program {
    let blocks = [...ast.blocks];

    for (const ext of ast.extends) {
      blocks = this.applyExtend(blocks, ext);
    }

    blocks = blocks.filter((b) => !b.name.startsWith(IMPORT_MARKER_PREFIX));

    return {
      ...ast,
      blocks,
      extends: [],
    };
  }

  /**
   * Apply a single @extend block.
   */
  private applyExtend(blocks: Block[], ext: ExtendBlock): Block[] {
    const pathParts = ext.targetPath.split('.');
    const rootName = pathParts[0];

    let targetName = rootName;
    let deepPath = pathParts.slice(1);

    const importMarker = blocks.find((b) => b.name === `${IMPORT_MARKER_PREFIX}${rootName}`);
    if (importMarker && pathParts.length > 1) {
      targetName = `${IMPORT_MARKER_PREFIX}${rootName}.${pathParts[1]}`;
      deepPath = pathParts.slice(2);
    }

    const idx = blocks.findIndex((b) => b.name === targetName);
    if (idx === -1) {
      return blocks;
    }

    const target = blocks[idx];
    if (!target) {
      return blocks;
    }

    const merged = this.mergeExtension(target, deepPath, ext);

    return [...blocks.slice(0, idx), merged, ...blocks.slice(idx + 1)];
  }

  /**
   * Merge extension content into a block.
   */
  private mergeExtension(block: Block, path: string[], ext: ExtendBlock): Block {
    if (path.length === 0) {
      return {
        ...block,
        content: this.mergeExtendContent(block.content, ext.content),
      };
    }

    return {
      ...block,
      content: this.mergeAtPath(block.content, path, ext.content),
    };
  }

  /**
   * Merge content at a deep path.
   */
  private mergeAtPath(
    content: BlockContent,
    path: string[],
    extContent: BlockContent
  ): BlockContent {
    if (path.length === 0) {
      return this.mergeExtendContent(content, extContent);
    }

    const currentKey = path[0];
    if (!currentKey) {
      return this.mergeExtendContent(content, extContent);
    }

    const rest = path.slice(1);

    if (content.type === 'ObjectContent') {
      const existing = content.properties[currentKey];

      if (rest.length === 0) {
        return {
          ...content,
          properties: {
            ...content.properties,
            [currentKey]: this.mergeExtendValue(existing, extContent),
          },
        };
      }

      if (existing && typeof existing === 'object' && !Array.isArray(existing)) {
        return {
          ...content,
          properties: {
            ...content.properties,
            [currentKey]: this.mergeAtPathValue(existing as Value, rest, extContent),
          },
        };
      }

      return {
        ...content,
        properties: {
          ...content.properties,
          [currentKey]: this.buildPathValue(rest, extContent),
        },
      };
    }

    if (content.type === 'MixedContent') {
      const existing = content.properties[currentKey];

      if (rest.length === 0) {
        return {
          ...content,
          properties: {
            ...content.properties,
            [currentKey]: this.mergeExtendValue(existing, extContent),
          },
        };
      }

      if (existing && typeof existing === 'object' && !Array.isArray(existing)) {
        return {
          ...content,
          properties: {
            ...content.properties,
            [currentKey]: this.mergeAtPathValue(existing as Value, rest, extContent),
          },
        };
      }

      return {
        ...content,
        properties: {
          ...content.properties,
          [currentKey]: this.buildPathValue(rest, extContent),
        },
      };
    }

    return content;
  }

  /**
   * Merge at path within a Value.
   */
  private mergeAtPathValue(value: Value, path: string[], extContent: BlockContent): Value {
    if (path.length === 0) {
      return this.mergeExtendValue(value, extContent);
    }

    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return this.buildPathValue(path, extContent);
    }

    const currentKey = path[0];
    if (!currentKey) {
      return this.mergeExtendValue(value, extContent);
    }

    const rest = path.slice(1);
    const obj = value as Record<string, Value>;
    const existing = obj[currentKey];

    if (rest.length === 0) {
      return {
        ...obj,
        [currentKey]: this.mergeExtendValue(existing, extContent),
      };
    }

    if (existing && typeof existing === 'object' && !Array.isArray(existing)) {
      return {
        ...obj,
        [currentKey]: this.mergeAtPathValue(existing as Value, rest, extContent),
      };
    }

    return {
      ...obj,
      [currentKey]: this.buildPathValue(rest, extContent),
    };
  }

  /**
   * Build a nested object from a path and final value.
   */
  private buildPathValue(path: string[], extContent: BlockContent): Value {
    if (path.length === 0) {
      return this.extractValue(extContent);
    }

    const result: Record<string, Value> = {};
    let current = result;

    for (let i = 0; i < path.length - 1; i++) {
      const key = path[i];
      if (key) {
        const next: Record<string, Value> = {};
        current[key] = next;
        current = next;
      }
    }

    const lastKey = path[path.length - 1];
    if (lastKey) {
      current[lastKey] = this.extractValue(extContent);
    }

    return result;
  }

  /**
   * Extract a Value from BlockContent.
   */
  private extractValue(content: BlockContent): Value {
    switch (content.type) {
      case 'TextContent':
        return content.value;
      case 'ObjectContent':
        return deepClone(content.properties);
      case 'ArrayContent':
        return deepClone(content.elements);
      case 'MixedContent':
        return deepClone(content.properties);
    }
  }

  /**
   * Merge a Value with BlockContent.
   */
  private mergeExtendValue(existing: Value | undefined, extContent: BlockContent): Value {
    if (existing === undefined) {
      return this.extractValue(extContent);
    }

    if (Array.isArray(existing) && extContent.type === 'ArrayContent') {
      return this.uniqueConcat(existing, extContent.elements);
    }

    if (
      typeof existing === 'object' &&
      existing !== null &&
      !Array.isArray(existing) &&
      extContent.type === 'ObjectContent'
    ) {
      const merged = deepMerge(
        existing as Record<string, unknown>,
        extContent.properties as Record<string, unknown>
      );
      return merged as unknown as Value;
    }

    if (isTextContent(existing) && extContent.type === 'TextContent') {
      return {
        ...extContent,
        value: `${existing.value}\n\n${extContent.value}`,
      };
    }

    return this.extractValue(extContent);
  }

  /**
   * Merge two BlockContent objects for extensions.
   */
  private mergeExtendContent(target: BlockContent, ext: BlockContent): BlockContent {
    if (target.type === ext.type) {
      switch (ext.type) {
        case 'TextContent':
          return {
            ...ext,
            value: `${(target as TextContent).value}\n\n${ext.value}`,
          };
        case 'ObjectContent':
          return {
            ...ext,
            properties: deepMerge((target as ObjectContent).properties, ext.properties),
          } as ObjectContent;
        case 'ArrayContent':
          return {
            ...ext,
            elements: this.uniqueConcat((target as ArrayContent).elements, ext.elements),
          };
        case 'MixedContent': {
          const targetMixed = target as MixedContent;
          const mergedText =
            targetMixed.text && ext.text
              ? {
                  ...ext.text,
                  value: `${targetMixed.text.value}\n\n${ext.text.value}`,
                }
              : (ext.text ?? targetMixed.text);
          return {
            ...ext,
            text: mergedText,
            properties: deepMerge(targetMixed.properties, ext.properties),
          } as MixedContent;
        }
      }
    }

    if (target.type === 'ObjectContent' && ext.type === 'TextContent') {
      return {
        type: 'MixedContent',
        text: ext,
        properties: (target as ObjectContent).properties,
        loc: ext.loc,
      } as MixedContent;
    }

    if (target.type === 'TextContent' && ext.type === 'ObjectContent') {
      return {
        type: 'MixedContent',
        text: target,
        properties: ext.properties,
        loc: ext.loc,
      } as MixedContent;
    }

    if (target.type === 'MixedContent' && ext.type === 'TextContent') {
      const mixed = target as MixedContent;
      return {
        ...mixed,
        text: mixed.text ? { ...ext, value: `${mixed.text.value}\n\n${ext.value}` } : ext,
      };
    }

    if (target.type === 'MixedContent' && ext.type === 'ObjectContent') {
      const mixed = target as MixedContent;
      return {
        ...mixed,
        properties: deepMerge(mixed.properties, ext.properties),
      };
    }

    return deepClone(ext);
  }

  // ============================================================
  // Utility Methods
  // ============================================================

  /**
   * Unique concatenation of arrays, preserving order.
   */
  private uniqueConcat(parent: Value[], child: Value[]): Value[] {
    const seen = new Set<string>();
    const result: Value[] = [];

    for (const item of [...parent, ...child]) {
      const key = typeof item === 'object' && item !== null ? JSON.stringify(item) : String(item);
      if (!seen.has(key)) {
        seen.add(key);
        result.push(this.deepCloneValue(item));
      }
    }

    return result;
  }

  /**
   * Type guard for plain objects.
   */
  private isPlainObject(val: unknown): val is Record<string, unknown> {
    return (
      typeof val === 'object' &&
      val !== null &&
      !Array.isArray(val) &&
      Object.getPrototypeOf(val) === Object.prototype
    );
  }

  /**
   * Deep clone a value.
   */
  private deepCloneValue(value: Value): Value {
    if (value === null || typeof value !== 'object') {
      return value;
    }

    if (Array.isArray(value)) {
      return value.map((v) => this.deepCloneValue(v));
    }

    const result: Record<string, Value> = {};
    for (const [key, val] of Object.entries(value)) {
      result[key] = this.deepCloneValue(val as Value);
    }
    return result;
  }
}
