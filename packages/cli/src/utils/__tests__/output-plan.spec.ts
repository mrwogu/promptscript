import { createOutputPlan, noopLogger } from '@promptscript/core';
import type { CompileResult, FormatterOutput } from '@promptscript/compiler';
import { applyConfiguredHeader, finalizeOutputPlan } from '../output-plan.js';

vi.mock('../../prettier/post-format.js', () => ({
  postFormatWithPrettier: vi.fn(async (outputs: Map<string, FormatterOutput>) => {
    for (const output of outputs.values()) {
      output.content = `formatted\n${output.content}`;
    }
  }),
}));

function createResult(): CompileResult {
  const output: FormatterOutput = {
    path: '.github/instructions.md',
    content: '<!-- PromptScript generated -->\nraw',
  };
  const outputPlan = createOutputPlan([{ owner: 'github', output }]);
  return {
    success: true,
    outputs: new Map([[output.path, { ...output }]]),
    outputPlan,
    errors: [],
    warnings: [],
    stats: {
      resolveTime: 0,
      validateTime: 0,
      formatTime: 0,
      totalTime: 0,
    },
  };
}

describe('finalizeOutputPlan', () => {
  it('derives identical plans for compile, dry-run, and diff consumers', async () => {
    const results = await Promise.all(
      ['compile', 'dry-run', 'diff'].map(async () =>
        finalizeOutputPlan(createResult(), {
          header: '# Header',
          projectRoot: '/project',
          logger: noopLogger,
        })
      )
    );

    const signatures = results.map(({ outputs, outputPlan }) => ({
      paths: outputPlan?.files.map((file) => file.path),
      contents: outputPlan?.files.map((file) => file.content),
      outputPaths: [...outputs.keys()],
    }));

    expect(signatures[0]).toEqual(signatures[1]);
    expect(signatures[1]).toEqual(signatures[2]);
  });

  it('excludes output added after the compiler plan unless explicitly approved', async () => {
    const result = createResult();
    result.outputs.set('unplanned.md', {
      path: 'unplanned.md',
      content: 'must not be written',
    });

    const finalized = await finalizeOutputPlan(result, {
      projectRoot: '/project',
      logger: noopLogger,
    });

    expect(finalized.outputPlan?.files.map((file) => file.path)).toEqual([
      '.github/instructions.md',
    ]);
    expect(finalized.outputs.has('unplanned.md')).toBe(false);
  });

  it('includes an explicitly approved migration output in the final plan', async () => {
    const result = createResult();
    result.outputs.set('.factory/hooks.json', {
      path: '.factory/hooks.json',
      content: '{}',
    });

    const finalized = await finalizeOutputPlan(result, {
      projectRoot: '/project',
      logger: noopLogger,
      additionalOutputPaths: ['.factory/hooks.json'],
    });

    expect(finalized.outputPlan?.files.map((file) => file.path)).toEqual([
      '.factory/hooks.json',
      '.github/instructions.md',
    ]);
  });

  it('applies headers and plans nested additional files', async () => {
    const child: FormatterOutput = {
      path: '.github/prompts/child.md',
      content: '<!-- PromptScript generated -->\nchild content',
    };
    const output: FormatterOutput = {
      path: '.github/instructions.md',
      content: '<!-- PromptScript generated -->\nroot content',
      additionalFiles: [child],
    };
    const result = createResult();
    result.outputs = new Map([[output.path, output]]);
    result.outputPlan = createOutputPlan([{ owner: 'github', output }]);

    const finalized = await finalizeOutputPlan(result, {
      header: '# Header',
      projectRoot: '/project',
      logger: noopLogger,
    });

    expect(finalized.outputPlan.files).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: child.path,
          content: '<!-- PromptScript generated -->\n\n# Header\nchild content',
        }),
      ])
    );
    expect(finalized.outputs.get(child.path)?.content).toBe(
      '<!-- PromptScript generated -->\n\n# Header\nchild content'
    );
  });
});

describe('applyConfiguredHeader for prompt files', () => {
  const marker =
    '<!-- PromptScript 2026-01-01T00:00:00.000Z | source: p.prs | target: x - do not edit -->';

  it('leaves a prompt target output without the header', () => {
    const preview: FormatterOutput = {
      path: 'prompts/reply.md',
      content: `${marker}\n\nSystem text`,
      target: 'prompt-text',
    };
    const coding: FormatterOutput = {
      path: 'CLAUDE.md',
      content: `${marker}\n\nText`,
      target: 'claude',
    };
    const outputs = new Map([preview, coding].map((output) => [output.path, output]));

    applyConfiguredHeader(outputs, '# Header');

    expect(preview.content).not.toContain('# Header');
    expect(coding.content).toContain('# Header');
  });

  it('leaves a bundle file without the header even when it quotes a marker', () => {
    const bundle: FormatterOutput = {
      path: 'prompts/reply.json',
      content: `{\n  "$schema": "https://getpromptscript.dev/schema/prompt-bundle/v1.json",\n  "description": "# promptscript-generated: in a message"\n}\n`,
    };

    applyConfiguredHeader(new Map([[bundle.path, bundle]]), '# Header');

    expect(JSON.parse(bundle.content)).toHaveProperty('description');
    expect(bundle.content).not.toContain('# Header');
  });
});
