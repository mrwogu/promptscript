import { describe, expect, it } from 'vitest';
import {
  CODING_TARGETS,
  type Block,
  type Program,
  type SourceLocation,
  type Value,
} from '@promptscript/core';
import { BUILTIN_FORMATTERS } from '../builtin-formatters.js';
import { formatProgram } from '../formatter-adapter.js';
import { getResourceCapabilityWarnings } from '../resource-capability-warnings.js';
import type { FormatterClass, FormatterOutput } from '../types.js';

const loc: SourceLocation = { file: 'resources.prs', line: 1, column: 1 };
const SKILL_CONTENT = 'resource-probe-skill-content';
const MCP_MARKER = 'resource-probe-mcp';
const PLUGIN_NAME = 'resource-probe-plugin';

const RESOURCE_MARKERS = {
  skills: SKILL_CONTENT,
  mcpServers: MCP_MARKER,
  plugins: PLUGIN_NAME,
} as const;

type ResourceBlock = keyof typeof RESOURCE_MARKERS;

function createBlock(name: string, properties: Record<string, Value>): Block {
  return {
    type: 'Block',
    name,
    content: { type: 'ObjectContent', properties, loc },
    loc,
  };
}

const BLOCKS: Record<ResourceBlock, Block> = {
  skills: createBlock('skills', {
    'resource-probe': { description: 'Resource probe skill', content: SKILL_CONTENT },
  }),
  mcpServers: createBlock('mcpServers', {
    'resource-probe': { url: `https://probe.example/${MCP_MARKER}` },
  }),
  plugins: createBlock('plugins', {
    [PLUGIN_NAME]: { version: '1.0.0', source: 'npm' },
  }),
};

function createProgram(blocks: Block[] = Object.values(BLOCKS)): Program {
  return {
    type: 'Program',
    blocks: [
      {
        type: 'Block',
        name: 'identity',
        content: { type: 'TextContent', value: 'Probe.', loc },
        loc,
      },
      ...blocks,
    ],
    uses: [],
    extends: [],
    loc,
  };
}

function collectContent(output: FormatterOutput): string {
  const own = output.content + (output.merge ? JSON.stringify(output.merge) : '');
  const nested = (output.additionalFiles ?? []).map((file) => collectContent(file));
  return [own, ...nested].join('\n');
}

function warnedBlocks(output: FormatterOutput): ResourceBlock[] {
  return (Object.keys(RESOURCE_MARKERS) as ResourceBlock[]).filter((name) =>
    (output.warnings ?? []).some(
      (warning) => warning.code === 'PS4002' && warning.message.includes(`@${name}`)
    )
  );
}

describe('resource capability warnings', () => {
  it('warns when the default cursor version drops skills, MCP servers and plugins', () => {
    // Arrange
    const ast = createProgram();

    // Act
    const warnings = getResourceCapabilityWarnings(ast, 'cursor', undefined);

    // Assert
    expect(warnings).toEqual([
      {
        code: 'PS4002',
        ruleName: 'target-compatibility',
        message: 'Target "cursor" version "modern" cannot emit @skills and will omit it.',
        suggestion: 'Use a version that emits skill output: full.',
        location: loc,
      },
      {
        code: 'PS4002',
        ruleName: 'target-compatibility',
        message: 'Target "cursor" version "modern" cannot emit @mcpServers and will omit it.',
        suggestion: 'Use a version that emits MCP output: full.',
        location: loc,
      },
      {
        code: 'PS4002',
        ruleName: 'target-compatibility',
        message: 'Target "cursor" version "modern" cannot emit @plugins and will omit it.',
        suggestion: 'Use a version that emits plugin output: full.',
        location: loc,
      },
    ]);
  });

  it('resolves version aliases before checking the resource', () => {
    // Arrange
    const ast = createProgram([BLOCKS.mcpServers]);

    // Act
    const warnings = getResourceCapabilityWarnings(ast, 'cursor', 'standard');

    // Assert
    expect(warnings.map((warning) => warning.message)).toEqual([
      'Target "cursor" version "modern" cannot emit @mcpServers and will omit it.',
    ]);
  });

  it('stays quiet when the version emits every resource', () => {
    // Arrange
    const ast = createProgram();

    // Act
    const warnings = getResourceCapabilityWarnings(ast, 'cursor', 'full');

    // Assert
    expect(warnings).toEqual([]);
  });

  it('reports a target without any native output for the block', () => {
    // Arrange
    const ast = createProgram([BLOCKS.plugins]);

    // Act
    const warnings = getResourceCapabilityWarnings(ast, 'github', 'full');

    // Assert
    expect(warnings).toEqual([
      {
        code: 'PS4002',
        ruleName: 'target-compatibility',
        message: 'Target "github" has no native plugin output and will omit @plugins.',
        suggestion: 'Compile a target with plugin output or configure it in the tool directly.',
        location: loc,
      },
    ]);
  });

  it('leaves blocks to unsupported-block warnings when the target lists them', () => {
    // Arrange
    const ast = createProgram();

    // Act
    const warnings = getResourceCapabilityWarnings(ast, 'hermes', 'simple');

    // Assert
    expect(warnings).toEqual([]);
  });

  it('ignores unknown targets and blocks without entries', () => {
    // Arrange
    const empty = createProgram([createBlock('mcpServers', {})]);
    const text = createProgram([
      { type: 'Block', name: 'skills', content: { type: 'TextContent', value: 'x', loc }, loc },
    ]);
    const full = createProgram();

    // Act
    const emptyWarnings = getResourceCapabilityWarnings(empty, 'cursor', 'modern');
    const textWarnings = getResourceCapabilityWarnings(text, 'cursor', 'modern');
    const customWarnings = getResourceCapabilityWarnings(full, 'my-custom-target', 'full');

    // Assert
    expect(emptyWarnings).toEqual([]);
    expect(textWarnings).toEqual([]);
    expect(customWarnings).toEqual([]);
  });

  it('never drops an authored resource block silently', () => {
    for (const target of CODING_TARGETS) {
      const formatterClass = BUILTIN_FORMATTERS[target] as FormatterClass;
      for (const version of Object.keys(formatterClass.getSupportedVersions())) {
        // Arrange
        const formatter = new formatterClass();

        // Act
        const output = formatProgram(formatter, createProgram(), { version });

        // Assert
        const content = collectContent(output);
        const warned = warnedBlocks(output);
        for (const [name, marker] of Object.entries(RESOURCE_MARKERS)) {
          const emitted = content.includes(marker);
          const label = `${target} ${version} @${name}`;
          expect(
            emitted || warned.includes(name as ResourceBlock),
            `${label} dropped silently`
          ).toBe(true);
          expect(emitted && warned.includes(name as ResourceBlock), `${label} false warning`).toBe(
            false
          );
        }
      }
    }
  });
});
