import { describe, expect, it } from 'vitest';
import type { Program, SourceLocation } from '@promptscript/core';
import { HERMES_VERSIONS, HermesFormatter } from '../formatters/hermes.js';

const createLoc = (line: number): SourceLocation => ({
  file: 'hermes.prs',
  line,
  column: 1,
});

function createBlock(name: string, content: Program['blocks'][number]['content'], line: number) {
  return {
    type: 'Block' as const,
    name,
    content,
    loc: createLoc(line),
  };
}

function createProgram(blocks: Program['blocks']): Program {
  return {
    type: 'Program',
    blocks,
    uses: [],
    extends: [],
    loc: createLoc(1),
  };
}

describe('Hermes formatter', () => {
  it('uses one AGENTS.md output for every version alias', () => {
    const formatter = new HermesFormatter();
    const ast = createProgram([
      createBlock(
        'identity',
        { type: 'TextContent', value: 'Hermes project instructions.', loc: createLoc(2) },
        2
      ),
    ]);

    const versions = ['simple', 'multifile', 'full'] as const;
    const outputs = {
      simple: formatter.format(ast, { version: 'simple' }),
      multifile: formatter.format(ast, { version: 'multifile' }),
      full: formatter.format(ast, { version: 'full' }),
    };

    for (const version of versions) {
      const output = outputs[version];

      expect(output.path).toBe('AGENTS.md');
      expect(output.additionalFiles ?? []).toHaveLength(0);
      expect(HERMES_VERSIONS[version]).toEqual({
        name: version,
        description: 'Single AGENTS.md file',
        outputPath: 'AGENTS.md',
      });
    }
    expect(new Set(Object.values(outputs).map((output) => output.content))).toHaveLength(1);
  });

  it('preserves supported instruction blocks in AGENTS.md', () => {
    const formatter = new HermesFormatter();
    const ast = createProgram([
      createBlock(
        'identity',
        { type: 'TextContent', value: 'Project identity.', loc: createLoc(2) },
        2
      ),
      createBlock(
        'context',
        {
          type: 'MixedContent',
          properties: { languages: ['TypeScript'] },
          text: {
            type: 'TextContent',
            value: 'Architecture details.',
            loc: createLoc(3),
          },
          loc: createLoc(3),
        },
        3
      ),
      createBlock(
        'standards',
        {
          type: 'ObjectContent',
          properties: { typescript: ['Use strict mode.'] },
          loc: createLoc(4),
        },
        4
      ),
      createBlock(
        'knowledge',
        {
          type: 'TextContent',
          value: `## Development Commands

\`\`\`bash
pnpm test
\`\`\`

## Additional Knowledge

Keep generated files reviewed.`,
          loc: createLoc(5),
        },
        5
      ),
      createBlock(
        'restrictions',
        { type: 'ArrayContent', elements: ['Never skip tests.'], loc: createLoc(6) },
        6
      ),
    ]);

    const output = formatter.format(ast);

    expect(output.content).toContain('Project identity.');
    expect(output.content).toContain('TypeScript');
    expect(output.content).toContain('Use strict mode.');
    expect(output.content).toContain('pnpm test');
    expect(output.content).toContain('Keep generated files reviewed.');
    expect(output.content).toContain('Never skip tests.');
  });

  it('omits unsupported blocks and reports source-located warnings', () => {
    const formatter = new HermesFormatter();
    const unsupportedNames = [
      'skills',
      'agents',
      'workflows',
      'prompts',
      'shortcuts',
      'guards',
      'local',
      'mcpServers',
      'plugins',
    ] as const;
    const ast = createProgram(
      unsupportedNames.map((name, index) =>
        createBlock(
          name,
          {
            type: 'ObjectContent',
            properties: { value: `${name} content` },
            loc: createLoc(index + 2),
          },
          index + 2
        )
      )
    );

    const output = formatter.format(ast);

    expect(output.additionalFiles ?? []).toHaveLength(0);
    expect(output.content).not.toContain('skills content');
    expect(output.content).not.toContain('agents content');
    expect(output.content).not.toContain('workflows content');
    expect(output.content).not.toContain('prompts content');
    expect(output.content).not.toContain('shortcuts content');
    expect(output.warnings).toHaveLength(unsupportedNames.length);
    expect(output.warnings).toEqual(
      unsupportedNames.map((name, index) =>
        expect.objectContaining({
          code: 'PS4002',
          message: expect.stringContaining(`@${name}`),
          location: createLoc(index + 2),
        })
      )
    );
  });

  it('reports unsupported hooks through the target hook capability registry', () => {
    const formatter = new HermesFormatter();
    const hooksLocation = createLoc(2);
    const ast = createProgram([
      createBlock(
        'hooks',
        {
          type: 'ObjectContent',
          properties: {
            verify: {
              event: 'post-tool-use',
              command: ['echo', 'verify'],
            },
          },
          loc: hooksLocation,
        },
        2
      ),
    ]);

    const output = formatter.format(ast);

    expect(output.warnings).toEqual([
      expect.objectContaining({
        code: 'PS4002',
        message: expect.stringContaining('cannot emit portable @hooks'),
        location: hooksLocation,
      }),
    ]);
  });

  it('does not warn for hooks disabled for Hermes', () => {
    const formatter = new HermesFormatter();
    const ast = createProgram([
      createBlock(
        'hooks',
        {
          type: 'ObjectContent',
          properties: {
            verify: {
              event: 'post-tool-use',
              command: ['echo', 'verify'],
              enabled: false,
            },
          },
          loc: createLoc(2),
        },
        2
      ),
    ]);

    expect(formatter.format(ast).warnings).toBeUndefined();
  });
});
