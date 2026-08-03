import type { BlockBody, BlockInput } from './types/index.js';
import { isBlockType, type BlockTypeName } from './types/index.js';
import { blockContentToBody, isCanonicalBlock, reconcileBlockBody } from './canonical-ast.js';

/**
 * Canonical content shapes shared by every PromptScript block.
 */
export type BlockShape = BlockBody['shape'];

/**
 * Shape contract for one built-in block.
 */
export interface BlockShapeContract {
  /** Preferred shape for new files and examples */
  readonly canonicalShape: BlockShape;
  /** Shapes that retain defined behavior */
  readonly supportedShapes: readonly BlockShape[];
  /** Supported shapes that may be formatter-sensitive */
  readonly legacyShapes: readonly BlockShape[];
  /** Minimal canonical replacement used by diagnostics */
  readonly example: string;
}

const OBJECT_ONLY_SHAPES = ['object'] as const;

/**
 * Canonical and compatibility shapes for every built-in block.
 *
 * Custom blocks intentionally remain open-world and are absent from this registry.
 */
export const BLOCK_SHAPE_CONTRACTS = {
  identity: {
    canonicalShape: 'text',
    supportedShapes: ['text', 'object', 'mixed'],
    legacyShapes: ['object', 'mixed'],
    example: '@identity { """You are a helpful assistant.""" }',
  },
  context: {
    canonicalShape: 'mixed',
    supportedShapes: ['text', 'object', 'mixed'],
    legacyShapes: [],
    example: '@context { project: "Example" """Additional project context.""" }',
  },
  standards: {
    canonicalShape: 'object',
    supportedShapes: ['object', 'mixed', 'text'],
    legacyShapes: ['mixed', 'text'],
    example: '@standards { code: ["Use strict TypeScript"] }',
  },
  restrictions: {
    canonicalShape: 'array',
    supportedShapes: ['array', 'text', 'object', 'mixed'],
    legacyShapes: ['text', 'object', 'mixed'],
    example: '@restrictions { - "Never expose secrets" }',
  },
  knowledge: {
    canonicalShape: 'text',
    supportedShapes: ['text', 'object', 'mixed'],
    legacyShapes: ['object', 'mixed'],
    example: '@knowledge { """Project reference material.""" }',
  },
  shortcuts: {
    canonicalShape: 'object',
    supportedShapes: OBJECT_ONLY_SHAPES,
    legacyShapes: [],
    example: '@shortcuts { "/test": { content: """Run tests.""" } }',
  },
  commands: {
    canonicalShape: 'object',
    supportedShapes: OBJECT_ONLY_SHAPES,
    legacyShapes: [],
    example: '@commands { "/test": { content: """Run tests.""" } }',
  },
  guards: {
    canonicalShape: 'object',
    supportedShapes: ['object', 'mixed'],
    legacyShapes: ['mixed'],
    example: '@guards { globs: ["**/*.ts"] }',
  },
  params: {
    canonicalShape: 'object',
    supportedShapes: OBJECT_ONLY_SHAPES,
    legacyShapes: [],
    example: '@params { strictness: range(1..5) = 3 }',
  },
  skills: {
    canonicalShape: 'object',
    supportedShapes: OBJECT_ONLY_SHAPES,
    legacyShapes: [],
    example: '@skills { review: { description: "Review code" content: """Review changes.""" } }',
  },
  local: {
    canonicalShape: 'text',
    supportedShapes: ['text', 'object', 'mixed'],
    legacyShapes: ['object', 'mixed'],
    example: '@local { """Private project instructions.""" }',
  },
  agents: {
    canonicalShape: 'object',
    supportedShapes: OBJECT_ONLY_SHAPES,
    legacyShapes: [],
    example: '@agents { reviewer: { description: "Review code" content: """Review changes.""" } }',
  },
  workflows: {
    canonicalShape: 'object',
    supportedShapes: OBJECT_ONLY_SHAPES,
    legacyShapes: [],
    example:
      '@workflows { release: { description: "Prepare release" content: """Run checks.""" } }',
  },
  hooks: {
    canonicalShape: 'object',
    supportedShapes: OBJECT_ONLY_SHAPES,
    legacyShapes: [],
    example: '@hooks { validate: { event: "pre-tool-use" command: ["pnpm", "test"] } }',
  },
  mcpServers: {
    canonicalShape: 'object',
    supportedShapes: OBJECT_ONLY_SHAPES,
    legacyShapes: [],
    example: '@mcpServers { local: { transport: "stdio" command: ["node", "server.mjs"] } }',
  },
  plugins: {
    canonicalShape: 'object',
    supportedShapes: OBJECT_ONLY_SHAPES,
    legacyShapes: [],
    example: '@plugins { quality: { skills: ["review"] } }',
  },
  prompts: {
    canonicalShape: 'object',
    supportedShapes: OBJECT_ONLY_SHAPES,
    legacyShapes: [],
    example: '@prompts { review: { content: """Review changes.""" } }',
  },
  examples: {
    canonicalShape: 'object',
    supportedShapes: OBJECT_ONLY_SHAPES,
    legacyShapes: [],
    example: '@examples { basic: { input: "Before" output: "After" } }',
  },
} as const satisfies Record<BlockTypeName, BlockShapeContract>;

/**
 * Return the shape contract for a built-in block.
 */
export function getBlockShapeContract(name: string): BlockShapeContract | undefined {
  return isBlockType(name) ? BLOCK_SHAPE_CONTRACTS[name] : undefined;
}

/**
 * Return the observed shape from canonical or compatibility AST input.
 */
export function getObservedBlockShape(block: BlockInput): BlockShape {
  if (isCanonicalBlock(block)) return block.body.shape;
  if (block.canonicalBody) {
    return reconcileBlockBody(block.canonicalBody, block.content).shape;
  }

  return blockContentToBody(block.content).shape;
}
