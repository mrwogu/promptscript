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
import { getSkillContractWarnings } from '../skill-contract-warnings.js';
import type { FormatterClass, FormatterOutput } from '../types.js';

const loc: SourceLocation = { file: 'contracts.prs', line: 1, column: 1 };
const FILE_MARKER = 'contract-probe-from-skill-file';
const INLINE_MARKER = 'contract-probe-inline';

const RAW_FRONTMATTER = [
  'name: from-file',
  'description: Skill that comes from a SKILL.md file',
  'inputs:',
  '  log:',
  `    description: ${FILE_MARKER}`,
  '    type: string',
].join('\n');

function createBlock(name: string, properties: Record<string, Value>): Block {
  return {
    type: 'Block',
    name,
    content: { type: 'ObjectContent', properties, loc },
    loc,
  };
}

function createProgram(skills: Record<string, Value>): Program {
  return {
    type: 'Program',
    blocks: [
      {
        type: 'Block',
        name: 'identity',
        content: { type: 'TextContent', value: 'Probe.', loc },
        loc,
      },
      createBlock('skills', skills),
    ],
    uses: [],
    extends: [],
    loc,
  };
}

const FROM_FILE_SKILL: Value = {
  description: 'Skill that comes from a SKILL.md file',
  content: 'skill-body-from-file',
  inputs: { log: { description: FILE_MARKER, type: 'string' } },
  __rawFrontmatter: RAW_FRONTMATTER,
};

const INLINE_SKILL: Value = {
  description: 'Skill defined in a .prs file',
  content: 'skill-body-inline',
  inputs: { query: { description: INLINE_MARKER, type: 'string' } },
};

function collectContent(output: FormatterOutput): string {
  const own = output.content + (output.merge ? JSON.stringify(output.merge) : '');
  const nested = (output.additionalFiles ?? []).map((file) => collectContent(file));
  return [own, ...nested].join('\n');
}

function contractWarnings(output: FormatterOutput): string[] {
  return (output.warnings ?? [])
    .filter((warning) => warning.code === 'PS4005')
    .map((warning) => warning.message);
}

describe('skill contract warnings', () => {
  it('warns when factory drops the contract of a skill that comes from a SKILL.md file', () => {
    // Arrange
    const ast = createProgram({
      'maven-log-parser': {
        ...(FROM_FILE_SKILL as Record<string, Value>),
        outputs: { errors: { description: 'JSON list of compile errors', type: 'string' } },
      },
    });

    // Act
    const warnings = getSkillContractWarnings(ast, 'factory', undefined);

    // Assert
    expect(warnings).toEqual([
      {
        code: 'PS4005',
        ruleName: 'target-compatibility',
        message:
          'Target "factory" does not write inputs and outputs of skill "maven-log-parser" to its skill file and will omit the contract.',
        suggestion:
          'factory accepts only a fixed set of SKILL.md frontmatter keys. Describe the expected input and output in the skill body, or compile a target that keeps the contract.',
        location: loc,
      },
    ]);
  });

  it('names only the contract keys the skill declares', () => {
    // Arrange
    const ast = createProgram({
      reporter: {
        description: 'Reports',
        content: 'body',
        outputs: { report: { description: 'The report', type: 'string' } },
        __rawFrontmatter: 'name: reporter',
      },
    });

    // Act
    const warnings = getSkillContractWarnings(ast, 'factory', undefined);

    // Assert
    expect(warnings.map((warning) => warning.message)).toEqual([
      'Target "factory" does not write outputs of skill "reporter" to its skill file and will omit the contract.',
    ]);
  });

  it('stays quiet when claude copies the SKILL.md frontmatter', () => {
    // Arrange
    const ast = createProgram({ 'from-file': FROM_FILE_SKILL });

    // Act
    const warnings = getSkillContractWarnings(ast, 'claude', undefined);

    // Assert
    expect(warnings).toEqual([]);
  });

  it('warns when claude writes a skill defined in a .prs file without its contract', () => {
    // Arrange
    const ast = createProgram({ inline: INLINE_SKILL });

    // Act
    const warnings = getSkillContractWarnings(ast, 'claude', undefined);

    // Assert
    expect(warnings).toEqual([
      {
        code: 'PS4005',
        ruleName: 'target-compatibility',
        message:
          'Target "claude" does not write inputs of skill "inline" to its skill file and will omit the contract.',
        suggestion:
          'The contract is written only for a skill that comes from a SKILL.md file. Move the skill into a SKILL.md file, or describe the expected input and output in the skill body.',
        location: loc,
      },
    ]);
  });

  it('ignores skills without a contract', () => {
    // Arrange
    const ast = createProgram({
      plain: { description: 'No contract', content: 'body' },
      empty: { description: 'Empty contract', content: 'body', inputs: {}, outputs: {} },
    });

    // Act
    const warnings = getSkillContractWarnings(ast, 'factory', undefined);

    // Assert
    expect(warnings).toEqual([]);
  });

  it('counts a contract field whose name starts with two underscores', () => {
    // Arrange
    const ast = createProgram({
      reporter: {
        description: 'Reports',
        content: 'body',
        inputs: { __request: { description: 'The request', type: 'string' } },
        __rawFrontmatter: 'name: reporter',
      },
    });

    // Act
    const warnings = getSkillContractWarnings(ast, 'factory', undefined);

    // Assert
    expect(warnings.map((warning) => warning.message)).toEqual([
      'Target "factory" does not write inputs of skill "reporter" to its skill file and will omit the contract.',
    ]);
  });

  it('ignores a contract that holds only compiler metadata', () => {
    // Arrange
    const ast = createProgram({
      reporter: {
        description: 'Reports',
        content: 'body',
        inputs: { __layerTrace: [] },
        __rawFrontmatter: 'name: reporter',
      },
    });

    // Act
    const warnings = getSkillContractWarnings(ast, 'factory', undefined);

    // Assert
    expect(warnings).toEqual([]);
  });

  it('leaves targets and versions without skill output to the resource warnings', () => {
    // Arrange
    const ast = createProgram({ 'from-file': FROM_FILE_SKILL, inline: INLINE_SKILL });

    // Act
    const noSkillVersion = getSkillContractWarnings(ast, 'cursor', 'modern');
    const unknownTarget = getSkillContractWarnings(ast, 'my-custom-target', undefined);

    // Assert
    expect(noSkillVersion).toEqual([]);
    expect(unknownTarget).toEqual([]);
  });

  it('ignores a skills block without entries', () => {
    // Arrange
    const ast: Program = {
      type: 'Program',
      blocks: [
        { type: 'Block', name: 'skills', content: { type: 'TextContent', value: 'x', loc }, loc },
      ],
      uses: [],
      extends: [],
      loc,
    };

    // Act
    const warnings = getSkillContractWarnings(ast, 'factory', undefined);

    // Assert
    expect(warnings).toEqual([]);
  });

  it('never drops a skill contract silently', () => {
    for (const target of CODING_TARGETS) {
      const formatterClass = BUILTIN_FORMATTERS[target] as FormatterClass;
      for (const version of Object.keys(formatterClass.getSupportedVersions())) {
        // Arrange
        const formatter = new formatterClass();
        const ast = createProgram({ 'from-file': FROM_FILE_SKILL, inline: INLINE_SKILL });

        // Act
        const output = formatProgram(formatter, ast, { version });

        // Assert
        const content = collectContent(output);
        const warned = contractWarnings(output);
        const cases = [
          { skill: 'from-file', body: 'skill-body-from-file', marker: FILE_MARKER },
          { skill: 'inline', body: 'skill-body-inline', marker: INLINE_MARKER },
        ];
        for (const { skill, body, marker } of cases) {
          const label = `${target} ${version} skill "${skill}"`;
          const skillWritten = content.includes(body);
          const contractWritten = content.includes(marker);
          const warnedForSkill = warned.some((message) => message.includes(`skill "${skill}"`));
          if (skillWritten) {
            expect(
              contractWritten || warnedForSkill,
              `${label} dropped its contract silently`
            ).toBe(true);
            expect(contractWritten && warnedForSkill, `${label} false warning`).toBe(false);
          } else {
            expect(warnedForSkill, `${label} warned although no skill file is written`).toBe(false);
          }
        }
      }
    }
  });
});
