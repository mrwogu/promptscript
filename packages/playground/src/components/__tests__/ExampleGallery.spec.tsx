import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { compile } from '@promptscript/browser-compiler';
import { EXAMPLES, ExampleGallery } from '../ExampleGallery';
import { usePlaygroundStore } from '../../store';

/** Load one gallery example as the compile input files plus entry path. */
function loadExample(id: string): { entry: string; files: Record<string, string> } {
  const example = EXAMPLES.find((candidate) => candidate.id === id);
  if (!example) throw new Error(`Missing example "${id}"`);
  return {
    entry: example.files[0]?.path ?? '',
    files: Object.fromEntries(example.files.map((file) => [file.path, file.content])),
  };
}

/** Compile one gallery example and assert it succeeds. */
async function compileExample(id: string, options: Parameters<typeof compile>[2]) {
  const { entry, files } = loadExample(id);
  const result = await compile(files, entry, options);
  expect(result.success, `Example "${id}" failed to compile`).toBe(true);
  return result;
}

describe('ExampleGallery — gallery examples compile', () => {
  it('uses current syntax for every PromptScript file', () => {
    for (const example of EXAMPLES) {
      for (const file of example.files.filter((candidate) => candidate.path.endsWith('.prs'))) {
        expect(file.content, `${example.id}:${file.path}`).toContain('syntax: "1.5.0"');
      }
    }
  });

  // Each example shipped in the gallery must round-trip through the
  // browser compiler so users never load a broken sample. This guards
  // against syntax drift when new language features are added.
  for (const example of EXAMPLES) {
    it(`compiles example "${example.id}"`, async () => {
      const files: Record<string, string> = {};
      for (const file of example.files) {
        files[file.path] = file.content;
      }

      const entry = example.files[0]?.path;
      expect(entry).toBeDefined();

      const result = await compile(files, entry as string, {
        envVars: example.envVars,
      });

      if (!result.success) {
        const messages = result.errors.map((e) => e.message ?? String(e)).join('\n');
        throw new Error(`Example "${example.id}" failed to compile:\n${messages}`);
      }

      expect(result.success).toBe(true);
      expect(result.outputs.size).toBeGreaterThan(0);
      expect(
        result.warnings.filter((warning) => ['PS018', 'PS038'].includes(warning.ruleId))
      ).toEqual([]);
    });
  }

  it('resolves composition and replacement in declaration order', async () => {
    const result = await compileExample('composition-order', {
      formatters: [{ name: 'github', config: { version: 'full' } }],
    });

    const output = result.outputs.get('.github/copilot-instructions.md')?.content;
    expect(output).toContain('### coverage');
    expect(output).toContain('Minimum 95%');
    expect(output).not.toContain('Minimum 80%');
    expect(output).not.toContain('Minimum 90%');
    expect(output).toContain('Use Jest');
    expect(output).toContain('Require integration tests');
  });

  it('resolves model catalog entries to target-native model names', async () => {
    const result = await compileExample('with-models', {
      formatters: [
        { name: 'claude', config: { version: 'full' } },
        { name: 'github', config: { version: 'full' } },
      ],
    });

    // Claude keeps the floating alias and expands the pinned release to its API id.
    const triage = result.outputs.get('.claude/agents/triage.md')?.content;
    expect(triage).toContain('model: sonnet');
    const reviewer = result.outputs.get('.claude/agents/deep-reviewer.md')?.content;
    expect(reviewer).toContain('model: claude-opus-4-5-20251101');
    // GitHub Copilot wants display names for both, and transforms specModel.
    const githubReviewer = result.outputs.get('.github/agents/deep-reviewer.md')?.content;
    expect(githubReviewer).toContain('model: Claude Opus 4.5');
    const githubSpecWriter = result.outputs.get('.github/agents/spec-writer.md')?.content;
    expect(githubSpecWriter).toContain('specModel: Claude Haiku 4.5');
    // Claude has no specModel slot, so the compiler reports the loss.
    expect(result.warnings).toContainEqual(
      expect.objectContaining({
        ruleId: 'PS4003',
        message:
          'Agent "spec-writer": field "specModel" is not supported by target "claude" and will be omitted.',
      })
    );
  });

  it('qualifies imported agents with their import alias', async () => {
    const result = await compileExample('namespaced-agents', {
      formatters: [{ name: 'claude', config: { version: 'full' } }],
    });

    expect(result.outputs.has('.claude/agents/frontend-reviewer.md')).toBe(true);
    expect(result.outputs.has('.claude/agents/backend-reviewer.md')).toBe(true);
    expect(result.outputs.has('.claude/agents/reviewer.md')).toBe(false);
  });

  it('renders contextual section headers in generated output', async () => {
    const result = await compileExample('custom-section-headers', {
      formatters: [{ name: 'github', config: { version: 'full' } }],
    });

    const output = result.outputs.get('.github/copilot-instructions.md')?.content;
    expect(output).toContain('## Engineering Standards');
    expect(output).toContain('## Commit Policy');
  });

  it('resolves the real-life checkout policy and emits native capabilities', async () => {
    const result = await compileExample('real-life-checkout-service', {
      formatters: [
        { name: 'claude', config: { version: 'full' } },
        { name: 'github', config: { version: 'full' } },
      ],
    });

    // GitHub agent files cannot carry the authored `skills` list; the
    // compile surfaces that loss instead of dropping it silently.
    expect(result.warnings).toEqual([
      expect.objectContaining({
        ruleId: 'PS4003',
        message:
          'Agent "payment-reviewer": field "skills" is not supported by target "github" and will be omitted.',
      }),
    ]);
    const github = result.outputs.get('.github/copilot-instructions.md')?.content;
    expect(github).toContain('Minimum 95% coverage for payment flows');
    expect(github).not.toContain('Minimum 80% coverage');
    expect(github).not.toContain('Test approved, declined, timeout, and retry paths');
    expect(github).toContain('## Checkout Commit Policy');
    expect(github).toContain('Conventional Commits');
    expect(github).toContain('Require one approving review');
    expect(github).toContain('Document rollback steps');
    expect(github).toContain('Use idempotency keys');
    expect(github).toContain('Verify Adyen webhook signatures');
    expect(github).toContain('Bound Adyen retries to 2 attempts with backoff');
    expect(github).toContain("Don't exceed 2 Adyen payment retries");
    expect(github).not.toContain('{{provider}}');
    expect(github).not.toContain('{{maxRetries}}');
    expect(github).not.toContain('Stripe');
    expect(github).toContain(
      "Don't change retry or idempotency behavior without integration tests"
    );
    expect(result.outputs.has('.claude/agents/payment-reviewer.md')).toBe(true);
    expect(result.outputs.has('.claude/skills/payment-security/SKILL.md')).toBe(true);
    expect(result.outputs.get('.claude/commands/release-readiness.md')?.content).toContain(
      'Stop before deployment and request human approval'
    );
    expect(result.outputs.has('AGENTS.md')).toBe(true);
    expect(result.outputs.has('.github/agents/payment-reviewer.md')).toBe(true);
    expect(result.outputs.has('.github/skills/payment-security/SKILL.md')).toBe(true);
    expect(result.outputs.get('.github/prompts/release-readiness.prompt.md')?.content).toContain(
      'Stop before deployment and request human approval'
    );
    expect(JSON.parse(result.outputs.get('.claude/settings.json')!.content)).toMatchObject({
      hooks: {
        PostToolUse: [{ matcher: 'Edit|Write' }],
      },
    });
    expect(
      JSON.parse(result.outputs.get('.github/hooks/promptscript.json')!.content)
    ).toMatchObject({
      hooks: {
        postToolUse: [{ matcher: 'edit|create' }],
      },
    });
  });

  it('shows current Factory and GitHub hook outputs for agent platform example', async () => {
    const result = await compileExample('agent-platform', {
      formatters: [
        { name: 'factory', config: { version: 'full' } },
        { name: 'github', config: { version: 'multifile' } },
      ],
    });

    expect(JSON.parse(result.outputs.get('.factory/hooks.json')!.content)).toMatchObject({
      hooks: {
        PostToolUse: [
          {
            hooks: [
              {
                command: expect.stringContaining(
                  'node "$FACTORY_PROJECT_DIR"/.promptscript/scripts/validate.mjs --strict'
                ),
              },
            ],
          },
        ],
      },
    });
    expect(
      JSON.parse(result.outputs.get('.github/hooks/promptscript.json')!.content)
    ).toMatchObject({
      version: 1,
      hooks: { postToolUse: [{ cwd: '.' }] },
    });
  });
});

describe('ExampleGallery — rendering', () => {
  // The gallery is rendered as an open modal in the playground; tests
  // poke its open state directly via the store and assert the new
  // overlay/sealed/negation badge tags appear so future refactors of
  // the badge detection logic don't silently drop them.
  beforeEach(() => {
    usePlaygroundStore.setState({ showExamples: true });
  });

  afterEach(() => {
    usePlaygroundStore.setState({ showExamples: false });
  });

  it('renders the section headers grouped by complexity', () => {
    render(<ExampleGallery />);
    // 'Intermediate'/'Advanced' also appear as per-card complexity badges,
    // so use getAllByText where the label is duplicated.
    expect(screen.getByText('Getting Started')).toBeTruthy();
    expect(screen.getAllByText('Intermediate').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Advanced').length).toBeGreaterThan(0);
  });

  it('renders the new Skill Overlays example with overlay badge', () => {
    render(<ExampleGallery />);
    expect(screen.getByText('Skill Overlays (@extend)')).toBeTruthy();
    // The 'overlay' badge tag fires when any file content includes @extend
    const overlayBadges = screen.getAllByText('overlay');
    expect(overlayBadges.length).toBeGreaterThan(0);
  });

  it('renders the Sealed & Negation example with both new badges', () => {
    render(<ExampleGallery />);
    expect(screen.getByText('Sealed & Negation')).toBeTruthy();
    expect(screen.getAllByText('sealed').length).toBeGreaterThan(0);
    expect(screen.getAllByText('negation').length).toBeGreaterThan(0);
  });

  it('renders the post-release platform examples with capability badges', () => {
    render(<ExampleGallery />);
    expect(screen.getByText('Regular Field Replacement')).toBeTruthy();
    expect(screen.getByText('Composition & Declaration Order')).toBeTruthy();
    expect(screen.getByText('Custom Section Headers')).toBeTruthy();
    expect(screen.getByText('Complete Agent Platform')).toBeTruthy();
    expect(screen.getByText('Real-Life Checkout Service')).toBeTruthy();
    expect(screen.getAllByText('replacement').length).toBeGreaterThan(0);
    expect(screen.getAllByText('override').length).toBeGreaterThan(0);
    expect(screen.getAllByText('headers').length).toBeGreaterThan(0);
    expect(screen.getAllByText('mcp').length).toBeGreaterThan(0);
    expect(screen.getAllByText('automation').length).toBeGreaterThan(0);
    expect(screen.getAllByText('plugins').length).toBeGreaterThan(0);
  });

  it('loads an example into the store on click and closes the modal', () => {
    render(<ExampleGallery />);
    fireEvent.click(screen.getByText('Hello World'));
    const state = usePlaygroundStore.getState();
    expect(state.showExamples).toBe(false);
    expect(state.files.length).toBeGreaterThan(0);
    expect(state.files[0]?.content).toContain('hello-world');
  });

  it('closes the modal when the close button is clicked', () => {
    render(<ExampleGallery />);
    fireEvent.click(screen.getByLabelText('Close'));
    expect(usePlaygroundStore.getState().showExamples).toBe(false);
  });
});
