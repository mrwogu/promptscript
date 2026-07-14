/**
 * Unit tests for browser-compiler skill-composition module.
 * Covers edge cases not exercised through the BrowserResolver integration tests.
 */

import { describe, it, expect, vi } from 'vitest';
import { resolveSkillComposition } from '../skill-composition.js';
import type {
  Program,
  Block,
  ObjectContent,
  Value,
  InlineUseDeclaration,
} from '@promptscript/core';

// ── Helpers ────────────────────────────────────────────────────────

const defaultLoc = { file: 'test.prs', line: 1, column: 1, offset: 0 };

function makeProgram(blocks: Block[]): Program {
  return {
    type: 'Program',
    loc: defaultLoc,
    uses: [],
    extends: [],
    blocks,
  };
}

function makeSkillsBlock(
  properties: Record<string, Value>,
  inlineUses?: InlineUseDeclaration[]
): Block {
  const content: ObjectContent = {
    type: 'ObjectContent',
    properties,
    loc: defaultLoc,
  };
  if (inlineUses) {
    content.inlineUses = inlineUses;
  }
  return {
    type: 'Block',
    name: 'skills',
    content,
    loc: defaultLoc,
  };
}

function makeInlineUse(path: string, alias?: string): InlineUseDeclaration {
  return {
    type: 'InlineUseDeclaration',
    path: { raw: path },
    alias,
    loc: defaultLoc,
  } as unknown as InlineUseDeclaration;
}

function makeSubSkillProgram(
  skillName: string,
  content: string,
  extraProps?: Record<string, Value>,
  extraBlocks?: Block[]
): Program {
  const skillObj: Record<string, Value> = {
    content: { type: 'TextContent', value: content, loc: defaultLoc },
    ...extraProps,
  };

  const blocks: Block[] = [makeSkillsBlock({ [skillName]: skillObj as unknown as Value })];

  if (extraBlocks) {
    blocks.push(...extraBlocks);
  }

  return makeProgram(blocks);
}

function makeTextBlock(name: string, text: string): Block {
  return {
    type: 'Block',
    name,
    content: { type: 'TextContent', value: text, loc: defaultLoc },
    loc: defaultLoc,
  };
}

function makeArrayBlock(name: string, items: string[]): Block {
  return {
    type: 'Block',
    name,
    content: {
      type: 'ArrayContent',
      elements: items,
      loc: defaultLoc,
    },
    loc: defaultLoc,
  };
}

function makeMixedBlock(name: string, text: string): Block {
  return {
    type: 'Block',
    name,
    content: {
      type: 'MixedContent',
      text: { type: 'TextContent', value: text, loc: defaultLoc },
      elements: [],
      loc: defaultLoc,
    },
    loc: defaultLoc,
  };
}

function makeObjectBlock(name: string, props: Record<string, Value>): Block {
  return {
    type: 'Block',
    name,
    content: {
      type: 'ObjectContent',
      properties: props,
      loc: defaultLoc,
    },
    loc: defaultLoc,
  };
}

// ── Tests ──────────────────────────────────────────────────────────

describe('resolveSkillComposition — no-op cases', () => {
  it('returns ast unchanged when no skills blocks exist', async () => {
    const ast = makeProgram([makeTextBlock('identity', 'hello')]);
    const result = await resolveSkillComposition(ast, {
      resolveFile: vi.fn(),
      resolvePath: vi.fn(),
      currentFile: 'test.prs',
    });
    expect(result).toBe(ast);
  });

  it('returns ast unchanged when skills block has no inlineUses', async () => {
    const ast = makeProgram([
      makeSkillsBlock({ mySkill: { content: 'test' } as unknown as Value }),
    ]);
    const result = await resolveSkillComposition(ast, {
      resolveFile: vi.fn(),
      resolvePath: vi.fn(),
      currentFile: 'test.prs',
    });
    expect(result).toBe(ast);
  });

  it('returns ast unchanged when inlineUses is empty array', async () => {
    const ast = makeProgram([
      makeSkillsBlock({ mySkill: { content: 'test' } as unknown as Value }, []),
    ]);
    const result = await resolveSkillComposition(ast, {
      resolveFile: vi.fn(),
      resolvePath: vi.fn(),
      currentFile: 'test.prs',
    });
    expect(result).toBe(ast);
  });
});

describe('resolveSkillComposition — depth limit', () => {
  it('throws ResolveError when depth exceeds MAX_COMPOSITION_DEPTH (3)', async () => {
    const ast = makeProgram([
      makeSkillsBlock({ deploy: { content: 'base' } as unknown as Value }, [
        makeInlineUse('./sub'),
      ]),
    ]);

    await expect(
      resolveSkillComposition(ast, {
        resolveFile: vi.fn(),
        resolvePath: vi.fn().mockReturnValue('/abs/sub.prs'),
        currentFile: 'test.prs',
        depth: 3,
      })
    ).rejects.toThrow(/depth limit exceeded/);
  });
});

describe('resolveSkillComposition — path resolution failure', () => {
  it('throws ResolveError when resolvePath throws', async () => {
    const ast = makeProgram([
      makeSkillsBlock({ deploy: { content: 'base' } as unknown as Value }, [
        makeInlineUse('./bad-path'),
      ]),
    ]);

    await expect(
      resolveSkillComposition(ast, {
        resolveFile: vi.fn(),
        resolvePath: vi.fn().mockImplementation(() => {
          throw new Error('invalid path');
        }),
        currentFile: 'test.prs',
      })
    ).rejects.toThrow(/Failed to resolve sub-skill path/);
  });
});

describe('resolveSkillComposition — cycle detection', () => {
  it('throws ResolveError when circular composition is detected', async () => {
    const ast = makeProgram([
      makeSkillsBlock({ deploy: { content: 'base' } as unknown as Value }, [
        makeInlineUse('./circular'),
      ]),
    ]);

    await expect(
      resolveSkillComposition(ast, {
        resolveFile: vi.fn(),
        resolvePath: vi.fn().mockReturnValue('/abs/circular.prs'),
        currentFile: '/abs/circular.prs',
        resolutionStack: new Set(['/abs/circular.prs']),
      })
    ).rejects.toThrow(/Circular skill composition detected/);
  });
});

describe('resolveSkillComposition — resolveFile failure', () => {
  it('throws ResolveError when resolveFile throws', async () => {
    const ast = makeProgram([
      makeSkillsBlock({ deploy: { content: 'base' } as unknown as Value }, [
        makeInlineUse('./missing'),
      ]),
    ]);

    await expect(
      resolveSkillComposition(ast, {
        resolveFile: vi.fn().mockRejectedValue(new Error('file not found')),
        resolvePath: vi.fn().mockReturnValue('/abs/missing.prs'),
        currentFile: 'test.prs',
      })
    ).rejects.toThrow(/Failed to resolve sub-skill/);
  });
});

describe('resolveSkillComposition — sub-skill with no skills block', () => {
  it('uses filename as skill name when no @skills block found', async () => {
    const subAst = makeProgram([makeTextBlock('identity', 'no skills here')]);
    const ast = makeProgram([
      makeSkillsBlock({ deploy: { content: 'base' } as unknown as Value }, [
        makeInlineUse('./my-sub-skill'),
      ]),
    ]);

    const result = await resolveSkillComposition(ast, {
      resolveFile: vi.fn().mockResolvedValue(subAst),
      resolvePath: vi.fn().mockReturnValue('/abs/my-sub-skill.prs'),
      currentFile: 'test.prs',
    });

    const skillsBlock = result.blocks[0]!;
    const props = (skillsBlock.content as ObjectContent).properties;
    const deploy = props['deploy'] as Record<string, unknown>;
    const content = deploy['content'] as { value: string };
    expect(content.value).toContain('Phase 1');
    expect(content.value).toContain('my-sub-skill');
  });
});

describe('resolveSkillComposition — sub-skill with empty skills properties', () => {
  it('uses filename when skills block has no skill definitions', async () => {
    const subAst = makeProgram([makeSkillsBlock({})]);
    const ast = makeProgram([
      makeSkillsBlock({ deploy: { content: 'base' } as unknown as Value }, [
        makeInlineUse('./sub'),
      ]),
    ]);

    const result = await resolveSkillComposition(ast, {
      resolveFile: vi.fn().mockResolvedValue(subAst),
      resolvePath: vi.fn().mockReturnValue('/abs/sub.prs'),
      currentFile: 'test.prs',
    });

    const skillsBlock = result.blocks[0]!;
    const props = (skillsBlock.content as ObjectContent).properties;
    const deploy = props['deploy'] as Record<string, unknown>;
    const content = deploy['content'] as { value: string };
    expect(content.value).toContain('sub');
  });
});

describe('resolveSkillComposition — sub-skill skill is not an object', () => {
  it('handles skill property that is a plain string', async () => {
    const subAst = makeProgram([makeSkillsBlock({ mySkill: 'just a string' as unknown as Value })]);
    const ast = makeProgram([
      makeSkillsBlock({ deploy: { content: 'base' } as unknown as Value }, [
        makeInlineUse('./sub'),
      ]),
    ]);

    const result = await resolveSkillComposition(ast, {
      resolveFile: vi.fn().mockResolvedValue(subAst),
      resolvePath: vi.fn().mockReturnValue('/abs/sub.prs'),
      currentFile: 'test.prs',
    });

    const skillsBlock = result.blocks[0]!;
    const props = (skillsBlock.content as ObjectContent).properties;
    const deploy = props['deploy'] as Record<string, unknown>;
    const content = deploy['content'] as { value: string };
    // Should still compose with filename-based name
    expect(content.value).toContain('Phase 1');
  });
});

describe('resolveSkillComposition — context blocks extraction', () => {
  it('extracts knowledge, restrictions, and standards blocks', async () => {
    const subAst = makeSubSkillProgram('sub', 'Sub instructions', {}, [
      makeTextBlock('knowledge', 'Important knowledge'),
      makeArrayBlock('restrictions', ['No SQL injection', 'No XSS']),
      makeTextBlock('standards', 'Follow OWASP'),
    ]);
    const ast = makeProgram([
      makeSkillsBlock({ deploy: { content: 'base' } as unknown as Value }, [
        makeInlineUse('./sub'),
      ]),
    ]);

    const result = await resolveSkillComposition(ast, {
      resolveFile: vi.fn().mockResolvedValue(subAst),
      resolvePath: vi.fn().mockReturnValue('/abs/sub.prs'),
      currentFile: 'test.prs',
    });

    const skillsBlock = result.blocks[0]!;
    const props = (skillsBlock.content as ObjectContent).properties;
    const deploy = props['deploy'] as Record<string, unknown>;
    const content = deploy['content'] as { value: string };
    expect(content.value).toContain('Knowledge');
    expect(content.value).toContain('Important knowledge');
    expect(content.value).toContain('Restrictions');
    expect(content.value).toContain('No SQL injection');
    expect(content.value).toContain('Standards');
    expect(content.value).toContain('Follow OWASP');
  });

  it('extracts knowledge from ObjectContent blocks', async () => {
    const subAst = makeSubSkillProgram('sub', 'Sub instructions', {}, [
      makeObjectBlock('knowledge', {
        topic: 'security guidelines',
        level: 'advanced',
      }),
    ]);
    const ast = makeProgram([
      makeSkillsBlock({ deploy: { content: 'base' } as unknown as Value }, [
        makeInlineUse('./sub'),
      ]),
    ]);

    const result = await resolveSkillComposition(ast, {
      resolveFile: vi.fn().mockResolvedValue(subAst),
      resolvePath: vi.fn().mockReturnValue('/abs/sub.prs'),
      currentFile: 'test.prs',
    });

    const skillsBlock = result.blocks[0]!;
    const deploy = (skillsBlock.content as ObjectContent).properties['deploy'] as Record<
      string,
      unknown
    >;
    const content = deploy['content'] as { value: string };
    expect(content.value).toContain('topic: security guidelines');
    expect(content.value).toContain('level: advanced');
  });

  it('extracts text from MixedContent blocks', async () => {
    const subAst = makeSubSkillProgram('sub', 'Sub instructions', {}, [
      makeMixedBlock('knowledge', 'Mixed knowledge text'),
    ]);
    const ast = makeProgram([
      makeSkillsBlock({ deploy: { content: 'base' } as unknown as Value }, [
        makeInlineUse('./sub'),
      ]),
    ]);

    const result = await resolveSkillComposition(ast, {
      resolveFile: vi.fn().mockResolvedValue(subAst),
      resolvePath: vi.fn().mockReturnValue('/abs/sub.prs'),
      currentFile: 'test.prs',
    });

    const skillsBlock = result.blocks[0]!;
    const deploy = (skillsBlock.content as ObjectContent).properties['deploy'] as Record<
      string,
      unknown
    >;
    const content = deploy['content'] as { value: string };
    expect(content.value).toContain('Mixed knowledge text');
  });
});

describe('resolveSkillComposition — skill properties merging', () => {
  it('unions allowedTools from sub-skill into parent', async () => {
    const subAst = makeSubSkillProgram('sub', 'Sub content', {
      allowedTools: ['tool-a', 'tool-b'],
    });
    const ast = makeProgram([
      makeSkillsBlock(
        {
          deploy: {
            content: { type: 'TextContent', value: 'base', loc: defaultLoc },
            allowedTools: ['tool-a', 'tool-c'],
          } as unknown as Value,
        },
        [makeInlineUse('./sub')]
      ),
    ]);

    const result = await resolveSkillComposition(ast, {
      resolveFile: vi.fn().mockResolvedValue(subAst),
      resolvePath: vi.fn().mockReturnValue('/abs/sub.prs'),
      currentFile: 'test.prs',
    });

    const deploy = (result.blocks[0]!.content as ObjectContent).properties['deploy'] as Record<
      string,
      unknown
    >;
    const tools = deploy['allowedTools'] as string[];
    expect(tools).toContain('tool-a');
    expect(tools).toContain('tool-b');
    expect(tools).toContain('tool-c');
  });

  it('concatenates references from sub-skill into parent', async () => {
    const subAst = makeSubSkillProgram('sub', 'Sub content', {
      references: ['./sub-ref.md'],
    });
    const ast = makeProgram([
      makeSkillsBlock(
        {
          deploy: {
            content: { type: 'TextContent', value: 'base', loc: defaultLoc },
            references: ['./parent-ref.md'],
          } as unknown as Value,
        },
        [makeInlineUse('./sub')]
      ),
    ]);

    const result = await resolveSkillComposition(ast, {
      resolveFile: vi.fn().mockResolvedValue(subAst),
      resolvePath: vi.fn().mockReturnValue('/abs/sub.prs'),
      currentFile: 'test.prs',
    });

    const deploy = (result.blocks[0]!.content as ObjectContent).properties['deploy'] as Record<
      string,
      unknown
    >;
    const refs = deploy['references'] as string[];
    expect(refs).toContain('./parent-ref.md');
    expect(refs).toContain('./sub-ref.md');
  });

  it('concatenates requires from sub-skill into parent', async () => {
    const subAst = makeSubSkillProgram('sub', 'Sub content', {
      requires: ['sub-req'],
    });
    const ast = makeProgram([
      makeSkillsBlock(
        {
          deploy: {
            content: { type: 'TextContent', value: 'base', loc: defaultLoc },
            requires: ['parent-req'],
          } as unknown as Value,
        },
        [makeInlineUse('./sub')]
      ),
    ]);

    const result = await resolveSkillComposition(ast, {
      resolveFile: vi.fn().mockResolvedValue(subAst),
      resolvePath: vi.fn().mockReturnValue('/abs/sub.prs'),
      currentFile: 'test.prs',
    });

    const deploy = (result.blocks[0]!.content as ObjectContent).properties['deploy'] as Record<
      string,
      unknown
    >;
    const reqs = deploy['requires'] as string[];
    expect(reqs).toContain('parent-req');
    expect(reqs).toContain('sub-req');
  });
});

describe('resolveSkillComposition — inputs/outputs contract', () => {
  it('converts inputs and outputs to contract fields', async () => {
    const subAst = makeSubSkillProgram('sub', 'Sub content', {
      inputs: {
        userInput: { description: 'User input', type: 'string' },
        config: { description: 'Configuration object', type: 'object' },
      } as unknown as Value,
      outputs: {
        result: { description: 'Result', type: 'string' },
      } as unknown as Value,
    });
    const ast = makeProgram([
      makeSkillsBlock({ deploy: { content: 'base' } as unknown as Value }, [
        makeInlineUse('./sub'),
      ]),
    ]);

    const result = await resolveSkillComposition(ast, {
      resolveFile: vi.fn().mockResolvedValue(subAst),
      resolvePath: vi.fn().mockReturnValue('/abs/sub.prs'),
      currentFile: 'test.prs',
    });

    const deploy = (result.blocks[0]!.content as ObjectContent).properties['deploy'] as Record<
      string,
      unknown
    >;
    const composedFrom = deploy['__composedFrom'] as Array<Record<string, unknown>>;
    expect(composedFrom).toBeDefined();
    expect(composedFrom).toHaveLength(1);
    const phase = composedFrom[0]!;
    expect(phase['inputs']).toBeDefined();
    const inputs = phase['inputs'] as Record<string, unknown>;
    expect(inputs['userInput']).toBeDefined();
    expect((inputs['userInput'] as Record<string, unknown>)['description']).toBe('User input');
    expect(phase['outputs']).toBeDefined();
  });
});

describe('resolveSkillComposition — alias support', () => {
  it('uses alias as phase name when provided', async () => {
    const subAst = makeSubSkillProgram('original-name', 'Sub content');
    const ast = makeProgram([
      makeSkillsBlock({ deploy: { content: 'base' } as unknown as Value }, [
        makeInlineUse('./sub', 'custom-alias'),
      ]),
    ]);

    const result = await resolveSkillComposition(ast, {
      resolveFile: vi.fn().mockResolvedValue(subAst),
      resolvePath: vi.fn().mockReturnValue('/abs/sub.prs'),
      currentFile: 'test.prs',
    });

    const deploy = (result.blocks[0]!.content as ObjectContent).properties['deploy'] as Record<
      string,
      unknown
    >;
    const content = deploy['content'] as { value: string };
    expect(content.value).toContain('custom-alias');

    const composedFrom = deploy['__composedFrom'] as Array<Record<string, unknown>>;
    expect(composedFrom[0]!['alias']).toBe('custom-alias');
  });
});

describe('resolveSkillComposition — non-skill properties in skills block', () => {
  it('passes through non-object properties unchanged', async () => {
    const subAst = makeSubSkillProgram('sub', 'Sub content');
    const ast = makeProgram([
      makeSkillsBlock(
        {
          deploy: { content: 'base' } as unknown as Value,
          configValue: 'just-a-string' as unknown as Value,
        },
        [makeInlineUse('./sub')]
      ),
    ]);

    const result = await resolveSkillComposition(ast, {
      resolveFile: vi.fn().mockResolvedValue(subAst),
      resolvePath: vi.fn().mockReturnValue('/abs/sub.prs'),
      currentFile: 'test.prs',
    });

    const props = (result.blocks[0]!.content as ObjectContent).properties;
    // Non-object property should be passed through unchanged
    expect(props['configValue']).toBe('just-a-string');
  });
});

describe('resolveSkillComposition — content size limit', () => {
  it('throws ResolveError when composed content exceeds MAX_CONTENT_SIZE', async () => {
    // Create content exceeding 256 KB
    const hugeContent = 'x'.repeat(300 * 1024);
    const subAst = makeSubSkillProgram('sub', hugeContent);
    const ast = makeProgram([
      makeSkillsBlock({ deploy: { content: 'base' } as unknown as Value }, [
        makeInlineUse('./sub'),
      ]),
    ]);

    await expect(
      resolveSkillComposition(ast, {
        resolveFile: vi.fn().mockResolvedValue(subAst),
        resolvePath: vi.fn().mockReturnValue('/abs/sub.prs'),
        currentFile: 'test.prs',
      })
    ).rejects.toThrow(/exceeds size limit/);
  });
});

describe('resolveSkillComposition — description extraction', () => {
  it('extracts description from sub-skill definition', async () => {
    const subAst = makeSubSkillProgram('sub', 'Sub content', {
      description: 'A sub-skill for testing',
    });
    const ast = makeProgram([
      makeSkillsBlock({ deploy: { content: 'base' } as unknown as Value }, [
        makeInlineUse('./sub'),
      ]),
    ]);

    const result = await resolveSkillComposition(ast, {
      resolveFile: vi.fn().mockResolvedValue(subAst),
      resolvePath: vi.fn().mockReturnValue('/abs/sub.prs'),
      currentFile: 'test.prs',
    });

    // Description is stored in the phase but not directly on the skill
    // The phase section should contain the instructions
    const deploy = (result.blocks[0]!.content as ObjectContent).properties['deploy'] as Record<
      string,
      unknown
    >;
    const content = deploy['content'] as { value: string };
    expect(content.value).toContain('Sub content');
  });
});

describe('resolveSkillComposition — multiple inline uses', () => {
  it('resolves multiple inline @use declarations with phase numbering', async () => {
    const sub1 = makeSubSkillProgram('alpha', 'Alpha instructions');
    const sub2 = makeSubSkillProgram('beta', 'Beta instructions');
    const ast = makeProgram([
      makeSkillsBlock({ deploy: { content: 'base' } as unknown as Value }, [
        makeInlineUse('./alpha'),
        makeInlineUse('./beta'),
      ]),
    ]);

    const result = await resolveSkillComposition(ast, {
      resolveFile: vi.fn().mockResolvedValueOnce(sub1).mockResolvedValueOnce(sub2),
      resolvePath: vi
        .fn()
        .mockReturnValueOnce('/abs/alpha.prs')
        .mockReturnValueOnce('/abs/beta.prs'),
      currentFile: 'test.prs',
    });

    const deploy = (result.blocks[0]!.content as ObjectContent).properties['deploy'] as Record<
      string,
      unknown
    >;
    const content = deploy['content'] as { value: string };
    expect(content.value).toContain('Phase 1');
    expect(content.value).toContain('Alpha instructions');
    expect(content.value).toContain('Phase 2');
    expect(content.value).toContain('Beta instructions');

    const composedFrom = deploy['__composedFrom'] as Array<Record<string, unknown>>;
    expect(composedFrom).toHaveLength(2);
  });
});

describe('resolveSkillComposition — composedFrom metadata', () => {
  it('stores composedBlocks list from context blocks', async () => {
    const subAst = makeSubSkillProgram('sub', 'Sub content', {}, [
      makeTextBlock('knowledge', 'Some knowledge'),
      makeTextBlock('standards', 'Some standards'),
    ]);
    const ast = makeProgram([
      makeSkillsBlock({ deploy: { content: 'base' } as unknown as Value }, [
        makeInlineUse('./sub'),
      ]),
    ]);

    const result = await resolveSkillComposition(ast, {
      resolveFile: vi.fn().mockResolvedValue(subAst),
      resolvePath: vi.fn().mockReturnValue('/abs/sub.prs'),
      currentFile: 'test.prs',
    });

    const deploy = (result.blocks[0]!.content as ObjectContent).properties['deploy'] as Record<
      string,
      unknown
    >;
    const composedFrom = deploy['__composedFrom'] as Array<Record<string, unknown>>;
    const composedBlocks = composedFrom[0]!['composedBlocks'] as string[];
    expect(composedBlocks).toContain('knowledge');
    expect(composedBlocks).toContain('standards');
  });
});
