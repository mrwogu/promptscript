import { describe, expect, it } from 'vitest';
import { getModelCatalog, type ModelsConfig, type Program, type Value } from '@promptscript/core';
import type { FormatterOutput } from '../types.js';
import {
  appendModelCompatibilityWarnings,
  extractRawFrontmatterModel,
  getModelCompatibilityWarnings,
  toTargetModel,
} from '../model-mapping.js';

function createLoc(line: number) {
  return { file: 'models.prs', line, column: 1 };
}

// Custom profiles keep these tests independent from the built-in model data.
const MODELS: ModelsConfig = {
  profiles: {
    'claude-test-1': {
      provider: 'anthropic',
      family: 'claude-test',
      version: '1',
      displayName: 'Claude Test 1',
      apiId: 'claude-test-1-20990101',
    },
    'gpt-test-1': {
      provider: 'openai',
      family: 'gpt-test',
      version: '1',
      displayName: 'GPT Test 1',
    },
    'acme-1': {
      provider: 'acme',
      family: 'acme',
      version: '1',
      displayName: 'Acme 1',
    },
  },
};

function createProgram(blocks: Record<string, Record<string, Record<string, Value>>>): Program {
  return {
    type: 'Program',
    blocks: Object.entries(blocks).map(([name, entries], index) => ({
      type: 'Block',
      name,
      content: { type: 'ObjectContent', properties: entries, loc: createLoc(index + 2) },
      loc: createLoc(index + 1),
    })),
    uses: [],
    extends: [],
    loc: createLoc(1),
  };
}

function agents(fields: Record<string, Value>): Program {
  return createProgram({ agents: { reviewer: { description: 'Review code', ...fields } } });
}

describe('toTargetModel', () => {
  it('returns undefined without a model', () => {
    expect(toTargetModel(undefined, 'claude')).toBeUndefined();
  });

  it('maps a pinned model to each target naming scheme', () => {
    expect(toTargetModel('claude-test-1', 'claude', MODELS)).toBe('claude-test-1-20990101');
    expect(toTargetModel('claude-test-1', 'github', MODELS)).toBe('Claude Test 1');
    expect(toTargetModel('Claude Test 1', 'factory', MODELS)).toBe('claude-test-1-20990101');
    expect(toTargetModel('claude-test-1', 'cursor', MODELS)).toBe('claude-test-1');
    expect(toTargetModel('gpt-test-1', 'codex', MODELS)).toBe('gpt-test-1');
  });

  it('omits models from providers a target cannot run', () => {
    expect(toTargetModel('gpt-test-1', 'claude', MODELS)).toBeUndefined();
    expect(toTargetModel('claude-test-1', 'codex', MODELS)).toBeUndefined();
  });

  it('keeps floating aliases on Claude and resolves them on other targets', () => {
    const latest = getModelCatalog().getLatest('claude-sonnet');

    expect(toTargetModel('sonnet', 'claude')).toBe('sonnet');
    expect(toTargetModel('sonnet', 'github')).toBe(latest?.displayName);
    expect(toTargetModel('sonnet', 'factory')).toBe(latest?.apiId);
  });

  it('writes names missing from the catalog unchanged on every target', () => {
    expect(toTargetModel('Some Future Model', 'github')).toBe('Some Future Model');
    expect(toTargetModel('opusplan', 'claude')).toBe('opusplan');
    expect(toTargetModel('custom:team-model', 'factory')).toBe('custom:team-model');
  });

  it('leaves targets without a model scheme unchanged', () => {
    expect(toTargetModel('anything', 'opencode')).toBe('anything');
  });

  it('keeps floating aliases backed by provider-less custom releases', () => {
    const models: ModelsConfig = {
      profiles: { 'claude-sonnet-99': { family: 'claude-sonnet', version: '99' } },
    };

    expect(toTargetModel('sonnet', 'claude', models)).toBe('sonnet');
    expect(toTargetModel('sonnet', 'factory', models)).toBe('claude-sonnet-99');
  });
});

describe('extractRawFrontmatterModel', () => {
  it('reads the top-level model line and strips quotes', () => {
    expect(extractRawFrontmatterModel("name: 'commit'\nmodel: sonnet")).toBe('sonnet');
    expect(extractRawFrontmatterModel('model: "sonnet"')).toBe('sonnet');
  });

  it('ignores nested keys, block scalars, empty values, and missing lines', () => {
    expect(extractRawFrontmatterModel('  model: nested')).toBeUndefined();
    expect(extractRawFrontmatterModel('model: |\n  sonnet')).toBeUndefined();
    expect(extractRawFrontmatterModel('model:')).toBeUndefined();
    expect(extractRawFrontmatterModel("name: 'commit'")).toBeUndefined();
  });
});

describe('getModelCompatibilityWarnings', () => {
  it('reports models from a provider the target cannot run', () => {
    const warnings = getModelCompatibilityWarnings(
      agents({ model: 'gpt-test-1' }),
      'claude',
      'full',
      MODELS
    );

    expect(warnings).toEqual([
      {
        code: 'PS4004',
        ruleName: 'model-compatibility',
        message:
          'Agent "reviewer": model "gpt-test-1" comes from provider "openai", which target "claude" cannot run, so it is omitted.',
        suggestion:
          'Use a model from provider "anthropic", or set models.profiles.gpt-test-1.targets.claude in promptscript.yaml.',
        location: createLoc(1),
      },
    ]);
  });

  it('reports names with a line break or control character', () => {
    const warnings = getModelCompatibilityWarnings(
      agents({ model: 'opus\ntools: Bash' }),
      'claude',
      'full',
      MODELS
    );

    expect(warnings).toEqual([
      {
        code: 'PS4004',
        ruleName: 'model-compatibility',
        message:
          'Agent "reviewer": model "opus\\ntools: Bash" has a line break or control character, so it is omitted.',
        suggestion: 'Write the model name on one line, without control characters.',
        location: createLoc(1),
      },
    ]);
  });

  it('reports profile names with a line break or control character', () => {
    const models: ModelsConfig = {
      profiles: { 'acme-1': { provider: 'acme', displayName: 'Acme\n1' } },
    };

    const warnings = getModelCompatibilityWarnings(
      agents({ model: 'acme-1' }),
      'github',
      'full',
      models
    );

    expect(warnings).toEqual([
      expect.objectContaining({
        message:
          'Agent "reviewer": model "acme-1" maps to a name with a line break or control character on target "github", so it is omitted.',
        suggestion:
          'Remove line breaks and control characters from models.profiles.acme-1 in promptscript.yaml.',
      }),
    ]);
  });

  it('does not report models a target writes', () => {
    const ast = agents({ model: ' mystery-model ', specModel: 'acme-1' });

    expect(getModelCompatibilityWarnings(ast, 'claude', 'full', MODELS)).toEqual([]);
    expect(getModelCompatibilityWarnings(ast, 'github', 'full', MODELS)).toEqual([]);
    expect(getModelCompatibilityWarnings(ast, 'factory', 'full', MODELS)).toEqual([]);
    expect(getModelCompatibilityWarnings(agents({ model: 'inherit' }), 'codex', 'full')).toEqual(
      []
    );
  });

  it('checks specModel only where the target emits it', () => {
    const ast = agents({ specModel: 'acme-1' });

    expect(getModelCompatibilityWarnings(ast, 'claude', 'full', MODELS)).toEqual([]);
    expect(getModelCompatibilityWarnings(ast, 'factory', 'full', MODELS)).toEqual([]);
  });

  it('checks Codex agents against OpenAI models', () => {
    const warnings = getModelCompatibilityWarnings(
      agents({ model: 'claude-test-1' }),
      'codex',
      'multifile',
      MODELS
    );

    expect(warnings).toHaveLength(1);
    expect(warnings[0]?.suggestion).toBe(
      'Use a model from provider "openai", or set models.profiles.claude-test-1.targets.codex in promptscript.yaml.'
    );
  });

  it('checks skill models on targets whose skills carry a model', () => {
    const ast = createProgram({ skills: { commit: { model: 'acme-1' } } });

    const claude = getModelCompatibilityWarnings(ast, 'claude', 'full', MODELS);
    expect(claude).toHaveLength(1);
    expect(claude[0]?.message).toContain('Skill "commit": model "acme-1"');
    expect(getModelCompatibilityWarnings(ast, 'grok', 'full', MODELS)).toHaveLength(1);
    expect(getModelCompatibilityWarnings(ast, 'factory', 'full', MODELS)).toEqual([]);
  });

  it('checks the raw frontmatter model of SKILL.md-backed skills', () => {
    const ast = createProgram({
      skills: {
        commit: { __rawFrontmatter: "name: 'commit'\nmodel: gpt-test-1" },
      },
    });

    const warnings = getModelCompatibilityWarnings(ast, 'claude', 'full', MODELS);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]?.message).toContain('Skill "commit": model "gpt-test-1"');
  });

  it('skips the raw frontmatter model when .prs overrides it', () => {
    const ast = createProgram({
      skills: {
        commit: {
          model: 'claude-test-1',
          __rawFrontmatter: "name: 'commit'\nmodel: gpt-test-1",
        },
      },
    });

    expect(getModelCompatibilityWarnings(ast, 'claude', 'full', MODELS)).toEqual([]);
  });

  it('skips versions that emit no agent files', () => {
    const ast = agents({ model: 'gpt-test-1' });

    expect(getModelCompatibilityWarnings(ast, 'claude', 'simple', MODELS)).toEqual([]);
    expect(getModelCompatibilityWarnings(ast, 'codex', 'simple', MODELS)).toEqual([]);
  });

  it('skips targets without a model scheme and unknown targets', () => {
    const ast = agents({ model: 'gpt-test-1' });

    expect(getModelCompatibilityWarnings(ast, 'opencode', 'full', MODELS)).toEqual([]);
    expect(getModelCompatibilityWarnings(ast, 'not-a-target', 'full', MODELS)).toEqual([]);
  });

  it('ignores entries and values that carry no model reference', () => {
    const ast = createProgram({
      agents: {
        numeric: { model: 7 },
        empty: { model: '' },
      },
    });
    ast.blocks.push({
      type: 'Block',
      name: 'skills',
      content: { type: 'TextContent', value: 'model: gpt-test-1', loc: createLoc(9) },
      loc: createLoc(9),
    });

    expect(getModelCompatibilityWarnings(ast, 'claude', 'full', MODELS)).toEqual([]);
  });
});

describe('appendModelCompatibilityWarnings', () => {
  const output: FormatterOutput = {
    path: 'CLAUDE.md',
    content: '# Project',
    warnings: [{ code: 'PS4003', message: 'existing' }],
  };

  it('returns the same output when nothing is omitted', () => {
    expect(appendModelCompatibilityWarnings(output, agents({}), 'claude', 'full', MODELS)).toBe(
      output
    );
  });

  it('appends warnings after the existing ones', () => {
    const result = appendModelCompatibilityWarnings(
      output,
      agents({ model: 'gpt-test-1' }),
      'claude',
      'full',
      MODELS
    );

    expect(result.warnings?.map((warning) => warning.code)).toEqual(['PS4003', 'PS4004']);
    expect(result.content).toBe(output.content);
  });
});
