import { describe, expect, it } from 'vitest';
import type { OutputPlan, OutputPlanFile } from '@promptscript/core';
import type { FormatterOutput } from '@promptscript/compiler';
import {
  collectResourceKinds,
  filterOutputsByResources,
  parseResourceSelection,
} from '../resource-filter.js';

function createPlanFile(path: string, owner: string, content = 'content'): OutputPlanFile {
  return { path, originalPath: path, content, owner, role: 'primary' };
}

function createPlan(files: readonly OutputPlanFile[]): OutputPlan {
  return {
    files: [...files],
    outputs: new Map(files.map((file) => [file.path, file])),
    owners: new Map(files.map((file) => [file.path, file.owner])),
    collisions: [],
    managedPaths: { directories: [], files: [] },
    resources: [],
    injected: [],
    managedOutputDirectories: [],
    managedOutputFiles: [],
  };
}

describe('parseResourceSelection', () => {
  it('returns empty kinds without values', () => {
    expect(parseResourceSelection(undefined)).toEqual({ kinds: [], invalid: [] });
    expect(parseResourceSelection([])).toEqual({ kinds: [], invalid: [] });
  });

  it('splits comma-separated values and trims whitespace', () => {
    expect(parseResourceSelection([' agents , skills '])).toEqual({
      kinds: ['agents', 'skills'],
      invalid: [],
    });
  });

  it('deduplicates kinds and invalid items in first-seen order', () => {
    expect(parseResourceSelection(['agents', 'agents,skills', 'bogus, bogus, agents'])).toEqual({
      kinds: ['agents', 'skills'],
      invalid: ['bogus'],
    });
  });

  it('skips empty segments', () => {
    expect(parseResourceSelection(['agents,,', ','])).toEqual({ kinds: ['agents'], invalid: [] });
  });

  it('accepts main as a selectable kind', () => {
    expect(parseResourceSelection(['main'])).toEqual({ kinds: ['main'], invalid: [] });
  });
});

describe('collectResourceKinds', () => {
  it('splits and trims one comma-separated flag value', () => {
    expect(collectResourceKinds(' agents , skills ', [])).toEqual(['agents', 'skills']);
  });

  it('accumulates repeated flag occurrences', () => {
    expect(collectResourceKinds('skills', collectResourceKinds('agents', []))).toEqual([
      'agents',
      'skills',
    ]);
  });

  it('drops empty segments from messy values', () => {
    expect(collectResourceKinds(' agents ,, ', ['main'])).toEqual(['main', 'agents']);
  });
});

describe('filterOutputsByResources', () => {
  const files = [
    createPlanFile('CLAUDE.md', 'claude', 'main file'),
    createPlanFile('.claude/agents/reviewer.md', 'claude'),
    createPlanFile('.claude/skills/audit/SKILL.md', 'claude'),
    createPlanFile('.claude/settings.json', 'claude'),
  ];

  it('keeps only files of the selected kinds', () => {
    const outputs = new Map<string, FormatterOutput>(
      files.map((file) => [file.path, { path: file.path, content: file.content }])
    );
    const result = filterOutputsByResources(createPlan(files), outputs, new Set(['agents']));

    expect([...result.outputs.keys()]).toEqual(['.claude/agents/reviewer.md']);
    expect(result.kept).toBe(1);
    expect(result.dropped).toBe(3);
  });

  it('keeps everything when main is selected alongside resources', () => {
    const outputs = new Map<string, FormatterOutput>(
      files.map((file) => [file.path, { path: file.path, content: file.content }])
    );
    const result = filterOutputsByResources(
      createPlan(files),
      outputs,
      new Set(['main', 'agents', 'skills', 'hooks'])
    );

    expect(result.kept).toBe(4);
    expect(result.dropped).toBe(0);
  });

  it('classifies unknown owners as main', () => {
    const cliFiles = [createPlanFile('extra.md', 'cli')];
    const outputs = new Map<string, FormatterOutput>([
      ['extra.md', { path: 'extra.md', content: 'extra' }],
    ]);

    const onlyMain = filterOutputsByResources(createPlan(cliFiles), outputs, new Set(['main']));
    expect(onlyMain.kept).toBe(1);

    const noMain = filterOutputsByResources(createPlan(cliFiles), outputs, new Set(['skills']));
    expect(noMain.kept).toBe(0);
    expect(noMain.dropped).toBe(1);
  });

  it('falls back to plan content for files missing from the outputs map', () => {
    const plan = createPlan([
      createPlanFile('.claude/agents/reviewer.md', 'claude', 'from plan'),
      createPlanFile('CLAUDE.md', 'claude'),
    ]);
    const outputs = new Map<string, FormatterOutput>([
      ['CLAUDE.md', { path: 'CLAUDE.md', content: 'from outputs' }],
    ]);

    const result = filterOutputsByResources(plan, outputs, new Set(['agents']));

    expect(result.kept).toBe(1);
    const reviewer = result.outputs.get('.claude/agents/reviewer.md');
    expect(reviewer?.content).toBe('from plan');
  });

  it('keeps relocated skill outputs via the configured skillBaseDir', () => {
    const skillFile = createPlanFile(
      'plugins/logstrip/.factory/skills/review/SKILL.md',
      'factory',
      'skill'
    );
    const outputs = new Map<string, FormatterOutput>([
      [skillFile.path, { path: skillFile.path, content: 'skill' }],
    ]);

    const withBaseDir = filterOutputsByResources(
      createPlan([skillFile]),
      outputs,
      new Set(['skills']),
      new Map([['factory', 'plugins/logstrip/.factory/skills']])
    );
    expect(withBaseDir.outputs.has(skillFile.path)).toBe(true);

    const withoutBaseDir = filterOutputsByResources(
      createPlan([skillFile]),
      outputs,
      new Set(['skills'])
    );
    expect(withoutBaseDir.outputs.has(skillFile.path)).toBe(false);
  });

  it('preserves write settings from the plan on the fallback path', () => {
    const file: OutputPlanFile = {
      path: '.claude/agents/reviewer.md',
      originalPath: '.claude/agents/reviewer.md',
      content: 'from plan',
      owner: 'claude',
      role: 'resource',
      mode: 0o755,
      merge: { format: 'json', owner: 'claude', operations: [{ path: 'x', value: 1 }] },
      managedOutputDirectories: ['.claude/agents'],
      managedOutputFiles: ['.claude/agents/reviewer.md'],
    };
    const result = filterOutputsByResources(createPlan([file]), new Map(), new Set(['agents']));

    const reviewer = result.outputs.get('.claude/agents/reviewer.md');
    expect(reviewer?.mode).toBe(0o755);
    expect(reviewer?.merge).toEqual({
      format: 'json',
      owner: 'claude',
      operations: [{ path: 'x', value: 1 }],
    });
    expect(reviewer?.managedOutputDirectories).toEqual(['.claude/agents']);
    expect(reviewer?.managedOutputFiles).toEqual(['.claude/agents/reviewer.md']);
  });
});
