import { describe, it, expect } from 'vitest';
import { referenceIntegrity } from '../reference-integrity.js';
import type { Program, SourceLocation, Block, Value } from '@promptscript/core';
import { LOCKFILE_VERSION } from '@promptscript/core';
import type { RuleContext, ValidationMessage, ValidatorConfig } from '../../types.js';

const loc: SourceLocation = { file: 'test.prs', line: 1, column: 1 };

function makeSkillsBlock(skills: Record<string, { references?: string[] }>): Block {
  const properties: Record<string, Value> = {};
  for (const [name, skill] of Object.entries(skills)) {
    properties[name] = {
      description: `${name} skill`,
      ...(skill.references ? { references: skill.references } : {}),
    };
  }
  return {
    type: 'Block',
    name: 'skills',
    loc,
    content: { type: 'ObjectContent', properties, loc },
  };
}

function makeAst(blocks: Block[] = []): Program {
  return {
    type: 'Program',
    loc,
    meta: { type: 'MetaBlock', loc, fields: { id: 'test', version: '1.0.0' } },
    uses: [],
    blocks,
    extends: [],
  };
}

function validate(ast: Program, config: ValidatorConfig = {}): ValidationMessage[] {
  const messages: ValidationMessage[] = [];
  const ctx: RuleContext = {
    ast,
    config,
    report: (msg) => {
      messages.push({
        ruleId: referenceIntegrity.id,
        ruleName: referenceIntegrity.name,
        severity: referenceIntegrity.defaultSeverity,
        ...msg,
      });
    },
  };
  referenceIntegrity.validate(ctx);
  return messages;
}

describe('PS031: reference-integrity', () => {
  it('should have correct metadata', () => {
    expect(referenceIntegrity.id).toBe('PS031');
    expect(referenceIntegrity.name).toBe('reference-integrity');
    expect(referenceIntegrity.defaultSeverity).toBe('warning');
  });

  it('should produce no messages when no lockfile', () => {
    const ast = makeAst([makeSkillsBlock({ mySkill: { references: ['ref.md'] } })]);
    const messages = validate(ast, {});
    expect(messages).toHaveLength(0);
  });

  it('should produce no messages when lockfile has no references section', () => {
    const lockfile = { version: LOCKFILE_VERSION, dependencies: {} };
    const ast = makeAst([makeSkillsBlock({ mySkill: { references: ['ref.md'] } })]);
    const messages = validate(ast, { lockfile });
    expect(messages).toHaveLength(0);
  });

  it('should produce no messages when ignoreHashes is true', () => {
    const lockfile = { version: LOCKFILE_VERSION, dependencies: {}, references: {} };
    const registryReferences = new Set(['/cache/registries/org/repo/v1/ref.md']);
    const ast = makeAst([
      makeSkillsBlock({ mySkill: { references: ['/cache/registries/org/repo/v1/ref.md'] } }),
    ]);
    const messages = validate(ast, { lockfile, registryReferences, ignoreHashes: true });
    expect(messages).toHaveLength(0);
  });

  it('should produce no messages for local references (not in registryReferences set)', () => {
    const lockfile = { version: LOCKFILE_VERSION, dependencies: {}, references: {} };
    const registryReferences = new Set<string>();
    const ast = makeAst([makeSkillsBlock({ mySkill: { references: ['local.md'] } })]);
    const messages = validate(ast, { lockfile, registryReferences });
    expect(messages).toHaveLength(0);
  });

  it('should warn when registry reference has no hash entry', () => {
    const lockfile = { version: LOCKFILE_VERSION, dependencies: {}, references: {} };
    const refPath = '/cache/registries/org/repo/v1/ref.md';
    const registryReferences = new Set([refPath]);
    const ast = makeAst([makeSkillsBlock({ mySkill: { references: [refPath] } })]);
    const messages = validate(ast, { lockfile, registryReferences });
    expect(messages).toHaveLength(1);
    expect(messages[0]!.message).toContain('no integrity hash');
    expect(messages[0]!.suggestion).toContain('prs lock');
  });

  it('should produce no messages when registry reference has matching hash entry', () => {
    const refPath = 'references/patterns.md';
    const lockfile = {
      version: LOCKFILE_VERSION,
      dependencies: {},
      references: {
        ['https://github.com/org/repo\0references/patterns.md\0v1.0.0']: {
          hash: 'sha256-abc123',
          lockedAt: '2026-04-01T12:00:00Z',
        },
      },
    };
    const registryReferences = new Set([refPath]);
    const ast = makeAst([makeSkillsBlock({ mySkill: { references: [refPath] } })]);
    const messages = validate(ast, { lockfile, registryReferences });
    expect(messages).toHaveLength(0);
  });

  it('should skip skills blocks without references', () => {
    const lockfile = { version: LOCKFILE_VERSION, dependencies: {}, references: {} };
    const ast = makeAst([makeSkillsBlock({ mySkill: {} })]);
    const messages = validate(ast, { lockfile, registryReferences: new Set() });
    expect(messages).toHaveLength(0);
  });

  it('should skip non-skills blocks', () => {
    const lockfile = { version: LOCKFILE_VERSION, dependencies: {}, references: {} };
    const ast = makeAst([
      {
        type: 'Block',
        name: 'identity',
        loc,
        content: { type: 'TextContent', value: 'test', loc },
      },
    ]);
    const messages = validate(ast, { lockfile, registryReferences: new Set() });
    expect(messages).toHaveLength(0);
  });
});
