import { describe, it, expect } from 'vitest';
import { duplicateBlocks } from '../../rules/duplicate-blocks.js';
import { allRules, getRuleById } from '../../rules/index.js';
import type { RuleContext, ValidationMessage } from '../../types.js';
import type {
  Block,
  ExtendBlock,
  ObjectContent,
  Program,
  SourceLocation,
  TextContent,
} from '@promptscript/core';

function at(line: number, file = 'project.prs'): SourceLocation {
  return { file, line, column: 1, offset: line * 10 };
}

function objectBlock(
  name: string,
  line: number,
  properties: ObjectContent['properties'] = {},
  file = 'project.prs'
): Block {
  return {
    type: 'Block',
    name,
    content: { type: 'ObjectContent', properties, loc: at(line, file) },
    loc: at(line, file),
  };
}

function textBlock(name: string, line: number, value: string, file = 'project.prs'): Block {
  const content: TextContent = { type: 'TextContent', value, loc: at(line, file) };
  return { type: 'Block', name, content, loc: at(line, file) };
}

function makeAST(blocks: Block[], extendsList: ExtendBlock[] = []): Program {
  return {
    type: 'Program',
    uses: [],
    blocks,
    extends: extendsList,
    loc: at(1),
  };
}

function runRule(ast: Program): ValidationMessage[] {
  const messages: ValidationMessage[] = [];
  const ctx: RuleContext = {
    ast,
    config: {},
    report: (msg) => {
      messages.push({
        ...msg,
        ruleId: duplicateBlocks.id,
        ruleName: duplicateBlocks.name,
        severity: duplicateBlocks.defaultSeverity,
      });
    },
  };
  duplicateBlocks.validate(ctx);
  return messages;
}

describe('PS048: duplicate-blocks', () => {
  it('should have correct metadata', () => {
    expect(duplicateBlocks.id).toBe('PS048');
    expect(duplicateBlocks.name).toBe('duplicate-blocks');
    expect(duplicateBlocks.defaultSeverity).toBe('error');
  });

  it('should be registered in the rule list', () => {
    expect(getRuleById('PS048')).toBe(duplicateBlocks);
    expect(allRules).toContain(duplicateBlocks);
  });

  it('should report the second block when an empty block precedes a populated one', () => {
    const ast = makeAST([
      textBlock('identity', 7, 'Probe.'),
      objectBlock('mcpServers', 12),
      objectBlock('mcpServers', 15, { probe: { transport: 'stdio' } }),
    ]);

    const messages = runRule(ast);

    expect(messages).toHaveLength(1);
    expect(messages[0]!.ruleId).toBe('PS048');
    expect(messages[0]!.severity).toBe('error');
    expect(messages[0]!.location).toEqual(at(15));
  });

  it('should name the block and the first declaration in the message', () => {
    const ast = makeAST([objectBlock('mcpServers', 12), objectBlock('mcpServers', 15)]);

    const [message] = runRule(ast);

    expect(message!.message).toContain('@mcpServers');
    expect(message!.message).toContain('already declared at line 12');
    expect(message!.message).not.toContain('project.prs');
    expect(message!.message).toMatch(/only the first/i);
    expect(message!.suggestion).toMatch(/merge/i);
  });

  it('should report every later occurrence against the first block', () => {
    const ast = makeAST([
      objectBlock('standards', 3),
      objectBlock('standards', 8),
      objectBlock('standards', 13),
    ]);

    const messages = runRule(ast);

    expect(messages.map((m) => m.location?.line)).toEqual([8, 13]);
    for (const message of messages) {
      expect(message.message).toContain('already declared at line 3');
    }
  });

  it('should not report different block names', () => {
    const ast = makeAST([
      objectBlock('standards', 3),
      objectBlock('restrictions', 8),
      textBlock('identity', 13, 'Probe.'),
    ]);

    expect(runRule(ast)).toEqual([]);
  });

  it('should not report same-name blocks that come from different files', () => {
    const ast = makeAST([
      objectBlock('standards', 3, {}, 'parent.prs'),
      objectBlock('standards', 3, {}, 'child.prs'),
    ]);

    expect(runRule(ast)).toEqual([]);
  });

  it('should not report repeated @extend declarations for the same target', () => {
    const extension = (line: number): ExtendBlock => ({
      type: 'ExtendBlock',
      targetPath: 'standards',
      content: { type: 'ObjectContent', properties: {}, loc: at(line) },
      loc: at(line),
    });
    const ast = makeAST([objectBlock('standards', 3)], [extension(5), extension(9)]);

    expect(runRule(ast)).toEqual([]);
  });

  it('should ignore internal import markers', () => {
    const ast = makeAST([objectBlock('__import__shared', 3), objectBlock('__import__shared', 8)]);

    expect(runRule(ast)).toEqual([]);
  });

  it('should mention the commands alias when a shortcuts block repeats', () => {
    const ast = makeAST([objectBlock('shortcuts', 3), objectBlock('shortcuts', 9)]);

    const [message] = runRule(ast);

    expect(message!.message).toContain('@shortcuts (alias @commands)');
    expect(message!.location).toEqual(at(9));
  });
});
