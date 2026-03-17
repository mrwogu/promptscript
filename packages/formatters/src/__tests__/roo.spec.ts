import { describe, expect, it } from 'vitest';
import type { Program, SourceLocation } from '@promptscript/core';
import { RooFormatter, ROO_VERSIONS } from '../formatters/roo.js';

const createLoc = (): SourceLocation => ({
  file: 'test.prs',
  line: 1,
  column: 1,
});

const createMinimalProgram = (): Program => ({
  type: 'Program',
  uses: [],
  blocks: [],
  extends: [],
  loc: createLoc(),
});

const createProgramWithSkills = (): Program => ({
  ...createMinimalProgram(),
  blocks: [
    {
      type: 'Block',
      name: 'skills',
      content: {
        type: 'ObjectContent',
        properties: {
          'my-skill': {
            description: 'A skill description',
            content: 'Skill body content',
          },
        },
        loc: createLoc(),
      },
      loc: createLoc(),
    },
  ],
});

const createProgramWithShortcuts = (): Program => ({
  ...createMinimalProgram(),
  blocks: [
    {
      type: 'Block',
      name: 'shortcuts',
      content: {
        type: 'ObjectContent',
        properties: {
          review: {
            description: 'Review code',
            content: 'Review the code carefully',
          },
        },
        loc: createLoc(),
      },
      loc: createLoc(),
    },
  ],
});

describe('RooFormatter', () => {
  it('simple mode writes to .roorules with # Project Rules header', () => {
    const formatter = new RooFormatter();
    const result = formatter.format(createMinimalProgram());

    expect(result.path).toBe('.roorules');
    expect(result.content).toContain('# Project Rules');
  });

  it('full mode does NOT emit .roo/skills/ files even when the AST contains a skills block', () => {
    const formatter = new RooFormatter();
    const result = formatter.format(createProgramWithSkills(), { version: 'full' });

    const skillFiles = (result.additionalFiles ?? []).filter((f) => f.path.includes('.roo/skills'));
    expect(skillFiles).toHaveLength(0);
  });

  it('full mode does NOT emit .roo/commands/ files even when the AST contains a shortcuts block', () => {
    const formatter = new RooFormatter();
    const result = formatter.format(createProgramWithShortcuts(), { version: 'full' });

    const commandFiles = (result.additionalFiles ?? []).filter((f) =>
      f.path.includes('.roo/commands')
    );
    expect(commandFiles).toHaveLength(0);
  });

  it('full mode does NOT emit agent files', () => {
    const formatter = new RooFormatter();
    const result = formatter.format(createMinimalProgram(), { version: 'full' });

    const agentFiles = (result.additionalFiles ?? []).filter(
      (f) => f.path.includes('.roo/agents') || f.path.includes('AGENTS.md')
    );
    expect(agentFiles).toHaveLength(0);
  });

  it('output is plain Markdown with no YAML frontmatter', () => {
    const formatter = new RooFormatter();
    const result = formatter.format(createMinimalProgram());

    expect(result.content).not.toMatch(/^---\s*\n/);
    expect(result.content).not.toContain('---');
  });

  it('ROO_VERSIONS has simple, multifile, and full keys all pointing to .roorules', () => {
    expect(ROO_VERSIONS.simple).toBeDefined();
    expect(ROO_VERSIONS.multifile).toBeDefined();
    expect(ROO_VERSIONS.full).toBeDefined();
    expect(ROO_VERSIONS.simple.outputPath).toBe('.roorules');
    expect(ROO_VERSIONS.multifile.outputPath).toBe('.roorules');
    expect(ROO_VERSIONS.full.outputPath).toBe('.roorules');
  });
});
