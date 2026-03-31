import { basename } from 'path';
import type {
  Program,
  Block,
  ObjectContent,
  TextContent,
  Value,
  InlineUseDeclaration,
  ComposedPhase,
  SkillContractField,
} from '@promptscript/core';
import { deepClone, isTextContent, ResolveError } from '@promptscript/core';

// ── Configuration constants ────────────────────────────────────────

/** Maximum nesting depth for skill composition. */
const MAX_COMPOSITION_DEPTH = 3;

/** Maximum content size in bytes after composition. */
const MAX_CONTENT_SIZE = 256 * 1024; // 256 KB

/** Context block types that are extracted and composed into the parent skill. */
const COMPOSABLE_CONTEXT_BLOCKS = new Set(['knowledge', 'restrictions', 'standards']);

// ── Public types ───────────────────────────────────────────────────

/**
 * Options for skill composition resolution.
 */
export interface CompositionOptions {
  /** Resolve a sub-skill file through the full resolver pipeline. */
  resolveFile: (absPath: string) => Promise<Program>;
  /** Resolve a path reference string to an absolute path. */
  resolvePath: (ref: string, fromFile: string) => string;
  /** Absolute path of the file being resolved (for cycle detection). */
  currentFile: string;
  /** Accumulated resolution stack for cycle detection. */
  resolutionStack?: Set<string>;
  /** Current nesting depth (0-based). */
  depth?: number;
}

// ── Main entry point ───────────────────────────────────────────────

/**
 * Resolve inline `@use` declarations inside `@skills` blocks.
 *
 * For each inline `@use`, the referenced sub-skill is loaded through the
 * full resolver pipeline, its skill definition and context blocks are
 * extracted, and the result is flattened into the parent skill as a
 * numbered phase section.
 *
 * @param ast - Program AST that may contain @skills blocks with inlineUses
 * @param options - Composition resolution options
 * @returns Updated AST with inline uses resolved and consumed
 */
export async function resolveSkillComposition(
  ast: Program,
  options: CompositionOptions
): Promise<Program> {
  const depth = options.depth ?? 0;
  const resolutionStack = options.resolutionStack ?? new Set<string>();

  // Quick scan: any @skills blocks with inlineUses?
  const skillsBlocks = ast.blocks.filter(
    (b) =>
      b.name === 'skills' &&
      b.content.type === 'ObjectContent' &&
      (b.content as ObjectContent).inlineUses &&
      (b.content as ObjectContent).inlineUses!.length > 0
  );

  if (skillsBlocks.length === 0) {
    return ast;
  }

  // Process each skills block
  const updatedBlocks = [...ast.blocks];

  for (const skillsBlock of skillsBlocks) {
    const idx = updatedBlocks.indexOf(skillsBlock);
    if (idx === -1) continue;

    const content = skillsBlock.content as ObjectContent;
    const inlineUses = content.inlineUses!;

    // Find the skill entry that owns these inline uses.
    // Inline uses are at the skills block level, so we need to find which
    // skill definition they belong to. Convention: they belong to the skill
    // whose ObjectContent contains the inlineUses.
    // We process per-skill: iterate skill properties and find which ones
    // have ObjectContent with inlineUses attached.
    const updatedContent = await resolveSkillsBlockComposition(
      content,
      inlineUses,
      options,
      depth,
      resolutionStack
    );

    updatedBlocks[idx] = {
      ...skillsBlock,
      content: updatedContent,
    };
  }

  return {
    ...ast,
    blocks: updatedBlocks,
  };
}

// ── Internal helpers ───────────────────────────────────────────────

/**
 * Process all inline @use declarations in a @skills ObjectContent block.
 *
 * The inlineUses are at the block level (not per-skill-property), so we
 * resolve them and compose their content into every skill property in
 * the block. In practice, a @skills block with inline uses usually
 * contains a single skill definition.
 */
async function resolveSkillsBlockComposition(
  content: ObjectContent,
  inlineUses: InlineUseDeclaration[],
  options: CompositionOptions,
  depth: number,
  resolutionStack: Set<string>
): Promise<ObjectContent> {
  // Collect resolved phases
  const phases: ResolvedPhase[] = [];

  for (let i = 0; i < inlineUses.length; i++) {
    const inlineUse = inlineUses[i]!;
    const phase = await resolveInlineUse(inlineUse, i + 1, options, depth, resolutionStack);
    if (phase) {
      phases.push(phase);
    }
  }

  if (phases.length === 0) {
    // Nothing resolved — just clear inlineUses
    return {
      ...content,
      properties: { ...content.properties },
      inlineUses: undefined,
    };
  }

  // Apply phases to each skill property in the block
  const updatedProperties: Record<string, Value> = {};

  for (const [skillName, skillValue] of Object.entries(content.properties)) {
    if (isSkillObject(skillValue)) {
      updatedProperties[skillName] = composeIntoSkill(
        skillValue as Record<string, Value>,
        phases,
        options.currentFile
      );
    } else {
      updatedProperties[skillName] = skillValue;
    }
  }

  return {
    ...content,
    properties: updatedProperties,
    inlineUses: undefined, // consumed
  };
}

/**
 * Metadata for a single resolved phase.
 */
interface ResolvedPhase {
  /** Phase number (1-based) */
  phaseNumber: number;
  /** Display name (alias or skill name) */
  name: string;
  /** Absolute source path */
  source: string;
  /** Alias if specified */
  alias?: string;
  /** Skill description */
  description?: string;
  /** Skill content (instructions) */
  skillContent?: string;
  /** Allowed tools from sub-skill */
  allowedTools: string[];
  /** References from sub-skill */
  references: string[];
  /** Requires from sub-skill */
  requires: string[];
  /** Inputs contract */
  inputs?: Record<string, Value>;
  /** Outputs contract */
  outputs?: Record<string, Value>;
  /** Context blocks extracted (knowledge, restrictions, standards) */
  contextBlocks: ExtractedContext[];
}

/**
 * Extracted context block content.
 */
interface ExtractedContext {
  /** Block type (knowledge, restrictions, standards) */
  blockType: string;
  /** Extracted text content */
  text: string;
}

/**
 * Resolve a single inline @use declaration to a phase.
 */
async function resolveInlineUse(
  inlineUse: InlineUseDeclaration,
  phaseNumber: number,
  options: CompositionOptions,
  depth: number,
  resolutionStack: Set<string>
): Promise<ResolvedPhase | null> {
  // Depth check
  if (depth >= MAX_COMPOSITION_DEPTH) {
    throw new ResolveError(
      `Skill composition depth limit exceeded (max ${MAX_COMPOSITION_DEPTH}): ` +
        `${inlineUse.path.raw} from ${options.currentFile}`,
      inlineUse.loc
    );
  }

  // Resolve the path
  let absPath: string;
  try {
    absPath = options.resolvePath(inlineUse.path.raw, options.currentFile);
  } catch (err) {
    throw new ResolveError(
      `Failed to resolve sub-skill path '${inlineUse.path.raw}': ${err instanceof Error ? err.message : String(err)}`,
      inlineUse.loc
    );
  }

  // Cycle detection
  if (resolutionStack.has(absPath)) {
    throw new ResolveError(
      `Circular skill composition detected: ${inlineUse.path.raw} (${absPath}) ` +
        `is already in the resolution stack`,
      inlineUse.loc
    );
  }

  // Resolve the sub-skill through the full pipeline
  const childStack = new Set(resolutionStack);
  childStack.add(options.currentFile);

  let subAst: Program;
  try {
    subAst = await options.resolveFile(absPath);
  } catch (err) {
    throw new ResolveError(
      `Failed to resolve sub-skill '${inlineUse.path.raw}': ${err instanceof Error ? err.message : String(err)}`,
      inlineUse.loc
    );
  }

  // Extract skill definition from the sub-skill's @skills block
  const skillDef = extractSkillDefinition(subAst, absPath);

  // Extract context blocks
  const contextBlocks = extractContextBlocks(subAst);

  // Determine phase name
  const phaseName = inlineUse.alias ?? skillDef.name;

  return {
    phaseNumber,
    name: phaseName,
    source: absPath,
    alias: inlineUse.alias,
    description: skillDef.description,
    skillContent: skillDef.content,
    allowedTools: skillDef.allowedTools,
    references: skillDef.references,
    requires: skillDef.requires,
    inputs: skillDef.inputs,
    outputs: skillDef.outputs,
    contextBlocks,
  };
}

/**
 * Extracted skill definition from a sub-skill file.
 */
interface ExtractedSkillDef {
  name: string;
  description?: string;
  content?: string;
  allowedTools: string[];
  references: string[];
  requires: string[];
  inputs?: Record<string, Value>;
  outputs?: Record<string, Value>;
}

/**
 * Extract the skill definition from a resolved sub-skill AST.
 *
 * Looks for the @skills block and extracts the first (or filename-matching)
 * skill definition.
 */
function extractSkillDefinition(ast: Program, absPath: string): ExtractedSkillDef {
  const skillsBlock = ast.blocks.find((b) => b.name === 'skills');

  // Default name from filename
  const fileBaseName = basename(absPath).replace(/\.prs$/, '').replace(/\.md$/, '');

  if (!skillsBlock || skillsBlock.content.type !== 'ObjectContent') {
    return {
      name: fileBaseName,
      allowedTools: [],
      references: [],
      requires: [],
    };
  }

  const props = (skillsBlock.content as ObjectContent).properties;
  const skillNames = Object.keys(props);

  // Try to match by filename first, then use first entry
  const matchName = skillNames.find((n) => n === fileBaseName) ?? skillNames[0];
  if (!matchName) {
    return {
      name: fileBaseName,
      allowedTools: [],
      references: [],
      requires: [],
    };
  }

  const skillObj = props[matchName];
  if (!isSkillObject(skillObj)) {
    return {
      name: matchName,
      allowedTools: [],
      references: [],
      requires: [],
    };
  }

  const obj = skillObj as Record<string, Value>;

  return {
    name: matchName,
    description: typeof obj['description'] === 'string' ? obj['description'] : undefined,
    content: extractTextValue(obj['content']),
    allowedTools: extractStringArray(obj['allowedTools']),
    references: extractStringArray(obj['references']),
    requires: extractStringArray(obj['requires']),
    inputs: isSkillObject(obj['inputs']) ? (obj['inputs'] as Record<string, Value>) : undefined,
    outputs: isSkillObject(obj['outputs']) ? (obj['outputs'] as Record<string, Value>) : undefined,
  };
}

/**
 * Extract composable context blocks (knowledge, restrictions, standards) from a Program.
 */
function extractContextBlocks(ast: Program): ExtractedContext[] {
  const contexts: ExtractedContext[] = [];

  for (const block of ast.blocks) {
    if (!COMPOSABLE_CONTEXT_BLOCKS.has(block.name)) {
      continue;
    }

    const text = extractBlockText(block);
    if (text) {
      contexts.push({ blockType: block.name, text });
    }
  }

  return contexts;
}

/**
 * Extract text content from a block, handling different content types.
 */
function extractBlockText(block: Block): string | null {
  const content = block.content;

  switch (content.type) {
    case 'TextContent':
      return content.value;
    case 'ObjectContent': {
      // For knowledge blocks with object properties, serialize key-value pairs
      const parts: string[] = [];
      for (const [key, val] of Object.entries(content.properties)) {
        if (typeof val === 'string') {
          parts.push(`- ${key}: ${val}`);
        } else if (isTextContent(val)) {
          parts.push(`- ${key}: ${(val as TextContent).value}`);
        } else if (typeof val === 'object' && val !== null) {
          parts.push(`- ${key}: ${JSON.stringify(val)}`);
        } else {
          parts.push(`- ${key}: ${String(val)}`);
        }
      }
      return parts.length > 0 ? parts.join('\n') : null;
    }
    case 'ArrayContent': {
      // For restrictions arrays
      const items = content.elements.map((el) => {
        if (typeof el === 'string') return `- ${el}`;
        if (isTextContent(el)) return `- ${(el as TextContent).value}`;
        return `- ${String(el)}`;
      });
      return items.length > 0 ? items.join('\n') : null;
    }
    case 'MixedContent':
      return content.text?.value ?? null;
  }
}

/**
 * Compose resolved phases into a parent skill definition.
 */
function composeIntoSkill(
  skill: Record<string, Value>,
  phases: ResolvedPhase[],
  currentFile: string
): Record<string, Value> {
  const result = deepClone(skill) as Record<string, Value>;

  // Build phase sections and append to content
  const existingContent = extractTextValue(result['content']) ?? '';
  const phaseSections: string[] = [];

  if (existingContent) {
    phaseSections.push(existingContent);
  }

  const composedPhases: ComposedPhase[] = [];
  let allAllowedTools = extractStringArray(result['allowedTools']);
  let allReferences = extractStringArray(result['references']);
  let allRequires = extractStringArray(result['requires']);

  for (const phase of phases) {
    // Build phase section
    const section = buildPhaseSection(phase);
    phaseSections.push(section);

    // Union allowedTools
    for (const tool of phase.allowedTools) {
      if (!allAllowedTools.includes(tool)) {
        allAllowedTools.push(tool);
      }
    }

    // Concat references
    for (const ref of phase.references) {
      if (!allReferences.includes(ref)) {
        allReferences.push(ref);
      }
    }

    // Concat requires
    for (const req of phase.requires) {
      if (!allRequires.includes(req)) {
        allRequires.push(req);
      }
    }

    // Build composedFrom metadata
    const composedBlocks = phase.contextBlocks.map((ctx) => ctx.blockType);
    const composedPhase: ComposedPhase = {
      name: phase.name,
      source: phase.source,
      composedBlocks,
    };

    if (phase.alias) {
      composedPhase.alias = phase.alias;
    }

    if (phase.inputs) {
      composedPhase.inputs = convertToContractFields(phase.inputs);
    }

    if (phase.outputs) {
      composedPhase.outputs = convertToContractFields(phase.outputs);
    }

    composedPhases.push(composedPhase);
  }

  // Check content size limit
  const composedContent = phaseSections.join('\n\n');
  const contentSize = new TextEncoder().encode(composedContent).length;
  if (contentSize > MAX_CONTENT_SIZE) {
    throw new ResolveError(
      `Composed skill content exceeds size limit (${contentSize} bytes > ${MAX_CONTENT_SIZE} bytes) in ${currentFile}`
    );
  }

  // Set composed content
  result['content'] = {
    type: 'TextContent' as const,
    value: composedContent,
    loc: { file: currentFile, line: 1, column: 1, offset: 0 },
  };

  // Set merged arrays
  if (allAllowedTools.length > 0) {
    result['allowedTools'] = allAllowedTools;
  }

  if (allReferences.length > 0) {
    result['references'] = allReferences;
  }

  if (allRequires.length > 0) {
    result['requires'] = allRequires;
  }

  // Store composedFrom metadata (prefixed with __ so it's treated as internal)
  result['__composedFrom'] = composedPhases as unknown as Value;

  return result;
}

/**
 * Build a phase section string for a resolved phase.
 */
function buildPhaseSection(phase: ResolvedPhase): string {
  const lines: string[] = [];

  lines.push(`## Phase ${phase.phaseNumber}: ${phase.name}`);
  lines.push(`<!-- composed-from: ${phase.source} -->`);

  // Context blocks
  for (const ctx of phase.contextBlocks) {
    const heading = capitalize(ctx.blockType);
    lines.push('');
    lines.push(`### ${heading}`);
    lines.push(ctx.text);
  }

  // Instructions
  if (phase.skillContent) {
    lines.push('');
    lines.push('### Instructions');
    lines.push(phase.skillContent);
  }

  return lines.join('\n');
}

// ── Utility helpers ────────────────────────────────────────────────

/**
 * Type guard: check if a value looks like a skill object (non-null, non-array object).
 */
function isSkillObject(value: unknown): boolean {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Extract a plain text string from a Value that might be TextContent or string.
 */
function extractTextValue(value: Value | undefined): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'string') return value;
  if (isTextContent(value)) return (value as TextContent).value;
  return undefined;
}

/**
 * Extract a string array from a Value that might be an array of strings.
 */
function extractStringArray(value: Value | undefined): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === 'string');
}

/**
 * Convert a raw inputs/outputs record to SkillContractField records.
 */
function convertToContractFields(
  raw: Record<string, Value>
): Record<string, SkillContractField> {
  const result: Record<string, SkillContractField> = {};

  for (const [name, val] of Object.entries(raw)) {
    if (isSkillObject(val)) {
      const obj = val as Record<string, Value>;
      result[name] = {
        description: typeof obj['description'] === 'string' ? obj['description'] : '',
        type: (typeof obj['type'] === 'string' ? obj['type'] : 'string') as SkillContractField['type'],
      };
    }
  }

  return result;
}

/**
 * Capitalize first letter.
 */
function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
