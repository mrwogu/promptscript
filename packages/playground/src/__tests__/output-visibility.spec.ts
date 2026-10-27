import { describe, it, expect, beforeEach } from 'vitest';
import { compile } from '@promptscript/browser-compiler';
import type { CompileResult } from '@promptscript/browser-compiler';
import { TARGET_DEFINITIONS, createOutputPlan, isPromptTarget } from '@promptscript/core';
import type { KnownTarget, OutputPlanCandidate } from '@promptscript/core';
import { EXAMPLES } from '../components/ExampleGallery';
import { usePlaygroundStore, selectOutputsForFormatter } from '../store';

const STATS = { resolveTime: 0, validateTime: 0, formatTime: 0, totalTime: 0 };

/** One primary file per owner, as the browser compiler plans them. */
function primary(owner: KnownTarget, path: string, content: string): OutputPlanCandidate {
  return { owner, role: 'primary', output: { path, content } };
}

/** Plan the candidates and load them into the store like a finished compile. */
function showPlanned(candidates: OutputPlanCandidate[]): void {
  const plan = createOutputPlan(candidates);
  const result: CompileResult = {
    success: true,
    outputs: new Map(
      plan.files.map((file) => [file.path, { path: file.path, content: file.content }])
    ),
    outputOwners: plan.owners,
    outputPlan: plan,
    errors: [],
    warnings: [],
    stats: STATS,
  };
  usePlaygroundStore.getState().setCompileResult(result);
}

function pathsFor(formatter: KnownTarget): string[] {
  return selectOutputsForFormatter(usePlaygroundStore.getState(), formatter).map((o) => o.path);
}

describe('Output tabs show what a formatter emitted', () => {
  beforeEach(() => {
    usePlaygroundStore.getState().setCompileResult(null);
  });

  it('shows every file the formatter owns, whatever its path looks like', () => {
    showPlanned([
      {
        owner: 'goose',
        role: 'primary',
        output: {
          path: '.goosehints',
          content: 'main',
          additionalFiles: [
            { path: '.goose/mcp_config.json', content: '{}' },
            { path: '.goose/skills/review/SKILL.md', content: 'skill' },
            { path: '.goose/skills/review/scripts/run.py', content: 'print(1)' },
          ],
        },
      },
    ]);

    const shown = pathsFor('goose');
    expect(shown[0]).toBe('.goosehints');
    expect([...shown].sort()).toEqual(
      [
        '.goosehints',
        '.goose/mcp_config.json',
        '.goose/skills/review/SKILL.md',
        '.goose/skills/review/scripts/run.py',
      ].sort()
    );
  });

  it('puts the primary file first even when its name is not the default output path', () => {
    showPlanned([
      {
        owner: 'cursor',
        role: 'primary',
        output: {
          path: '.cursor/rules/project.mdc',
          content: 'main',
          additionalFiles: [{ path: '.cursor/commands/a-review.md', content: 'cmd' }],
        },
      },
    ]);

    expect(pathsFor('cursor')[0]).toBe('.cursor/rules/project.mdc');
  });

  // Each row: who emits what, in compile order, and what every tab should show.
  it.each([
    {
      name: 'does not show files owned by another formatter',
      emitted: [primary('claude', 'CLAUDE.md', 'claude'), primary('goose', '.goosehints', 'goose')],
      tabs: { claude: ['CLAUDE.md'], goose: ['.goosehints'] },
    },
    {
      name: 'shows a file in every tab that emitted it with the same content',
      emitted: [primary('claude', 'CLAUDE.md', 'same'), primary('grok', 'CLAUDE.md', 'same')],
      tabs: { claude: ['CLAUDE.md'], grok: ['CLAUDE.md'] },
    },
    {
      name: 'does not show another formatter content when a later target replaced the file',
      emitted: [
        primary('aider', 'AGENTS.md', 'same'),
        primary('zed', 'AGENTS.md', 'same'),
        primary('grok', 'AGENTS.md', 'different'),
      ],
      tabs: { grok: ['AGENTS.md'], aider: [], zed: [] },
    },
  ])('$name', ({ emitted, tabs }) => {
    showPlanned(emitted);

    for (const [name, paths] of Object.entries(tabs)) {
      expect(pathsFor(name as KnownTarget), name).toEqual(paths);
    }
  });

  it('falls back to path patterns when the result has no owners', () => {
    const claude = { path: 'CLAUDE.md', content: 'claude' };
    const github = { path: '.github/copilot-instructions.md', content: 'x' };
    usePlaygroundStore.getState().setCompileResult({
      success: true,
      outputs: new Map([
        [claude.path, claude],
        [github.path, github],
      ]),
      errors: [],
      warnings: [],
      stats: STATS,
    });

    expect(pathsFor('claude')).toEqual(['CLAUDE.md']);
  });
});

describe('Output tabs against the real compiler', () => {
  const example = EXAMPLES.find((candidate) => candidate.id === 'agent-platform');
  if (!example) throw new Error('Missing gallery example "agent-platform"');
  const files = Object.fromEntries(example.files.map((file) => [file.path, file.content]));
  const entry = example.files[0].path;

  const compileFor = async (...names: KnownTarget[]): Promise<CompileResult> => {
    const result = await compile(files, entry, {
      bundledRegistry: true,
      formatters: names.map((name) => ({
        name,
        config: { version: TARGET_DEFINITIONS[name].features.defaultVersion },
      })),
    });
    expect(result.success, JSON.stringify(result.errors)).toBe(true);
    usePlaygroundStore.getState().setCompileResult(result);
    return result;
  };

  const targets = (Object.keys(TARGET_DEFINITIONS) as KnownTarget[]).filter(
    (name) => !isPromptTarget(name)
  );

  // A target compiled on its own owns every file it emits, so none may be
  // missing from its tab. Adding a file to a formatter must not need a change
  // in the Playground.
  it.each(targets)(
    '%s tab lists every emitted file',
    async (name) => {
      const result = await compileFor(name);

      const shown = pathsFor(name);
      expect([...shown].sort()).toEqual([...result.outputs.keys()].sort());
      expect(shown[0]).toBe(result.outputPlan?.files.find((f) => f.role === 'primary')?.path);
    },
    60000
  );

  // Two targets that emit the same file: the plan keeps one owner, but both
  // tabs have to show it.
  it('shows CLAUDE.md in both the claude and the grok tab', async () => {
    await compileFor('claude', 'grok');

    expect(pathsFor('claude')).toContain('CLAUDE.md');
    expect(pathsFor('grok')).toContain('CLAUDE.md');
    expect(pathsFor('grok')).toContain('.grok/plugins.json');
  }, 60000);
});
