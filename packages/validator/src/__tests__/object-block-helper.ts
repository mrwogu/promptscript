import type { Block, Program, SourceLocation } from '@promptscript/core';

/** Build a block with ObjectContent holding the given properties. */
export function createObjectBlock(name: string, properties: Record<string, unknown>): Block {
  const loc: SourceLocation = { file: 'test.prs', line: 1, column: 1 };
  return {
    type: 'Block',
    name,
    loc,
    content: { type: 'ObjectContent', properties: properties as never, loc },
  };
}

/** Where a scanned payload is planted under a `resources` key outside @skills. */
export const RESOURCES_PLACEMENTS: ReadonlyArray<{
  title: string;
  build: (payload: string) => Block;
}> = [
  {
    title: 'text under resources in @context',
    build: (p) => createObjectBlock('context', { resources: p }),
  },
  {
    title: 'text under a nested resources key in @identity',
    build: (p) => createObjectBlock('identity', { section: { resources: { note: p } } }),
  },
  {
    title: 'text under resources in @prompts',
    build: (p) => createObjectBlock('prompts', { resources: { content: p } }),
  },
  {
    title: 'text under a skill entry key other than resources',
    build: (p) => createObjectBlock('skills', { review: { notes: p } }),
  },
];

/** The one place the scan must stay silent: @skills.<name>.resources. */
export function skillResourcesBlock(payload: string): Block {
  return createObjectBlock('skills', { review: { resources: [payload] } });
}

/** Create a minimal test AST. */
export function createTestProgram(overrides: Partial<Program> = {}): Program {
  const defaultLoc: SourceLocation = { file: 'test.prs', line: 1, column: 1 };
  return {
    type: 'Program',
    loc: defaultLoc,
    meta: {
      type: 'MetaBlock',
      loc: defaultLoc,
      fields: { id: 'test-project', version: '1.0.0' },
    },
    uses: [],
    blocks: [],
    extends: [],
    ...overrides,
  };
}
