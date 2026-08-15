import { createOutputPlan, noopLogger } from '@promptscript/core';
import type { CompileResult, FormatterOutput } from '@promptscript/compiler';
import { finalizeOutputPlan } from '../output-plan.js';

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
});
