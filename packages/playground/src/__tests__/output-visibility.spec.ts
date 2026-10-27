import { describe, it, expect, beforeEach } from 'vitest';
import { compile } from '@promptscript/browser-compiler';
import type { CompileResult } from '@promptscript/browser-compiler';
import { TARGET_DEFINITIONS, createOutputPlan, isPromptTarget } from '@promptscript/core';
import type { KnownTarget, OutputPlanCandidate } from '@promptscript/core';
import { usePlaygroundStore, selectOutputsForFormatter } from '../store';

const STATS = { resolveTime: 0, validateTime: 0, formatTime: 0, totalTime: 0 };

/** Build a compile result the way the browser compiler does, from planned files. */
function resultFrom(candidates: OutputPlanCandidate[]): CompileResult {
  const plan = createOutputPlan(candidates);
  return {
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
}

function pathsFor(formatter: KnownTarget): string[] {
  return selectOutputsForFormatter(usePlaygroundStore.getState(), formatter).map((o) => o.path);
}

describe('Output tabs show what a formatter emitted', () => {
  beforeEach(() => {
    usePlaygroundStore.getState().setCompileResult(null);
  });

  it('shows every file the formatter owns, whatever its path looks like', () => {
    usePlaygroundStore.getState().setCompileResult(
      resultFrom([
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
      ])
    );

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
    usePlaygroundStore.getState().setCompileResult(
      resultFrom([
        {
          owner: 'cursor',
          role: 'primary',
          output: {
            path: '.cursor/rules/project.mdc',
            content: 'main',
            additionalFiles: [{ path: '.cursor/commands/a-review.md', content: 'cmd' }],
          },
        },
      ])
    );

    expect(pathsFor('cursor')[0]).toBe('.cursor/rules/project.mdc');
  });

  it('does not show files owned by another formatter', () => {
    usePlaygroundStore.getState().setCompileResult(
      resultFrom([
        { owner: 'claude', role: 'primary', output: { path: 'CLAUDE.md', content: 'claude' } },
        { owner: 'goose', role: 'primary', output: { path: '.goosehints', content: 'goose' } },
      ])
    );

    expect(pathsFor('claude')).toEqual(['CLAUDE.md']);
    expect(pathsFor('goose')).toEqual(['.goosehints']);
  });

  it('shows a file in every tab that emitted it with the same content', () => {
    usePlaygroundStore.getState().setCompileResult(
      resultFrom([
        { owner: 'claude', role: 'primary', output: { path: 'CLAUDE.md', content: 'same' } },
        { owner: 'grok', role: 'primary', output: { path: 'CLAUDE.md', content: 'same' } },
      ])
    );

    expect(pathsFor('claude')).toEqual(['CLAUDE.md']);
    expect(pathsFor('grok')).toEqual(['CLAUDE.md']);
  });

  it('does not show another formatter content when a later target replaced the file', () => {
    usePlaygroundStore.getState().setCompileResult(
      resultFrom([
        { owner: 'aider', role: 'primary', output: { path: 'AGENTS.md', content: 'same' } },
        { owner: 'zed', role: 'primary', output: { path: 'AGENTS.md', content: 'same' } },
        { owner: 'grok', role: 'primary', output: { path: 'AGENTS.md', content: 'different' } },
      ])
    );

    expect(pathsFor('grok')).toEqual(['AGENTS.md']);
    expect(pathsFor('aider')).toEqual([]);
    expect(pathsFor('zed')).toEqual([]);
  });

  it('falls back to path patterns when the result has no owners', () => {
    usePlaygroundStore.getState().setCompileResult({
      success: true,
      outputs: new Map([
        ['CLAUDE.md', { path: 'CLAUDE.md', content: 'claude' }],
        [
          '.github/copilot-instructions.md',
          { path: '.github/copilot-instructions.md', content: 'x' },
        ],
      ]),
      errors: [],
      warnings: [],
      stats: STATS,
    });

    expect(pathsFor('claude')).toEqual(['CLAUDE.md']);
  });
});

const SOURCE = `@meta {
  id: "checkout-service"
  syntax: "1.5.0"
}

@identity {
  """
  You are working on the checkout service.
  """
}

@standards {
  code: ["Use strict TypeScript"]
}

@shortcuts {
  "/review": {
    prompt: true
    description: "Review current changes"
    content: "Review correctness."
  }
}

@skills {
  security-review: {
    description: "Review payment changes"
    allowedTools: ["Read"]
    content: "Inspect authentication."
  }
}

@mcpServers {
  issue-tracker: {
    transport: "stdio"
    command: ["node", "./tools/issues.mjs"]
  }
}

@agents {
  reviewer: {
    description: "Review changes"
    tools: ["Read"]
    skills: ["security-review"]
    mcpServers: ["issue-tracker"]
    content: "Review changed code."
  }
}

@hooks {
  validate-changes: {
    event: "post-tool-use"
    matcher: "Edit|Write"
    command: ["pnpm", "run", "typecheck"]
  }
}

@workflows {
  release: {
    description: "Prepare a release"
    content: "Run quality gates."
  }
}

@plugins {
  engineering: {
    description: "Shared capabilities"
    version: "1.0.0"
    skills: ["security-review"]
  }
}
`;

describe('Output tabs against the real compiler', () => {
  const targets = (Object.keys(TARGET_DEFINITIONS) as KnownTarget[]).filter(
    (name) => !isPromptTarget(name)
  );

  // A target compiled on its own owns every file it emits, so none may be
  // missing from its tab. Adding a file to a formatter must not need a change
  // in the Playground.
  it.each(targets)(
    '%s tab lists every emitted file',
    async (name) => {
      const result = await compile({ 'project.prs': SOURCE }, 'project.prs', {
        bundledRegistry: true,
        formatters: [
          { name, config: { version: TARGET_DEFINITIONS[name].features.defaultVersion } },
        ],
      });
      expect(result.success, JSON.stringify(result.errors)).toBe(true);
      usePlaygroundStore.getState().setCompileResult(result);

      const shown = pathsFor(name);
      expect([...shown].sort()).toEqual([...result.outputs.keys()].sort());
      expect(shown[0]).toBe(result.outputPlan?.files.find((f) => f.role === 'primary')?.path);
    },
    60000
  );

  // Two targets that emit the same file: the plan keeps one owner, but both
  // tabs have to show it.
  it('shows CLAUDE.md in both the claude and the grok tab', async () => {
    const result = await compile({ 'project.prs': SOURCE }, 'project.prs', {
      bundledRegistry: true,
      formatters: [
        { name: 'claude', config: { version: 'full' } },
        { name: 'grok', config: { version: 'full' } },
      ],
    });
    expect(result.success, JSON.stringify(result.errors)).toBe(true);
    usePlaygroundStore.getState().setCompileResult(result);

    expect(pathsFor('claude')).toContain('CLAUDE.md');
    expect(pathsFor('grok')).toContain('CLAUDE.md');
    expect(pathsFor('grok')).toContain('.grok/plugins.json');
  }, 60000);
});
