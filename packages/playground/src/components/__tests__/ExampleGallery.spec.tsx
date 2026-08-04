import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { compile } from '@promptscript/browser-compiler';
import { EXAMPLES, ExampleGallery } from '../ExampleGallery';
import { usePlaygroundStore } from '../../store';

describe('ExampleGallery — gallery examples compile', () => {
  it('uses current syntax for every PromptScript file', () => {
    for (const example of EXAMPLES) {
      for (const file of example.files.filter((candidate) => candidate.path.endsWith('.prs'))) {
        expect(file.content, `${example.id}:${file.path}`).toContain('syntax: "1.6.0"');
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
    const example = EXAMPLES.find((candidate) => candidate.id === 'composition-order');
    expect(example).toBeDefined();
    const files = Object.fromEntries(example!.files.map((file) => [file.path, file.content]));

    const result = await compile(files, example!.files[0]!.path, {
      formatters: [{ name: 'github', config: { version: 'full' } }],
    });

    expect(result.success).toBe(true);
    const output = result.outputs.get('.github/copilot-instructions.md')?.content;
    expect(output).toContain('### coverage');
    expect(output).toContain('Minimum 95%');
    expect(output).not.toContain('Minimum 80%');
    expect(output).not.toContain('Minimum 90%');
    expect(output).toContain('Use Jest');
    expect(output).toContain('Require integration tests');
  });

  it('renders contextual section headers in generated output', async () => {
    const example = EXAMPLES.find((candidate) => candidate.id === 'custom-section-headers');
    expect(example).toBeDefined();
    const files = Object.fromEntries(example!.files.map((file) => [file.path, file.content]));

    const result = await compile(files, example!.files[0]!.path, {
      formatters: [{ name: 'github', config: { version: 'full' } }],
    });

    expect(result.success).toBe(true);
    const output = result.outputs.get('.github/copilot-instructions.md')?.content;
    expect(output).toContain('## Engineering Standards');
    expect(output).toContain('## Commit Policy');
  });

  it('resolves the real-life checkout policy and emits native capabilities', async () => {
    const example = EXAMPLES.find((candidate) => candidate.id === 'real-life-checkout-service');
    expect(example).toBeDefined();
    const files = Object.fromEntries(example!.files.map((file) => [file.path, file.content]));

    const result = await compile(files, example!.files[0]!.path, {
      formatters: [
        { name: 'factory', config: { version: 'full' } },
        { name: 'github', config: { version: 'full' } },
      ],
    });

    expect(result.success).toBe(true);
    const github = result.outputs.get('.github/copilot-instructions.md')?.content;
    expect(github).toContain('Minimum 95% coverage for payment flows');
    expect(github).not.toContain('Minimum 80% coverage');
    expect(github).not.toContain('Test approved, declined, timeout, and retry paths');
    expect(github).toContain('## Checkout Commit Policy');
    expect(github).toContain('Conventional Commits');
    expect(github).toContain('Require one approving review');
    expect(github).toContain('Document rollback steps');
    expect(github).toContain('Use idempotency keys');
    expect(github).toContain('Verify webhook signatures');
    expect(github).toContain(
      "Don't change retry or idempotency behavior without integration tests"
    );
    expect(result.outputs.has('.factory/droids/payment-reviewer.md')).toBe(true);
    expect(result.outputs.has('.factory/skills/payment-security/SKILL.md')).toBe(true);
    expect(result.outputs.get('.factory/commands/release-readiness.md')?.content).toContain(
      'Stop before deployment and request human approval'
    );
    expect(result.outputs.has('.github/agents/payment-reviewer.md')).toBe(true);
    expect(result.outputs.has('.github/skills/payment-security/SKILL.md')).toBe(true);
    expect(result.outputs.get('.github/prompts/release-readiness.prompt.md')?.content).toContain(
      'Stop before deployment and request human approval'
    );
    expect(JSON.parse(result.outputs.get('.factory/hooks.json')!.content)).toMatchObject({
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
    const example = EXAMPLES.find((candidate) => candidate.id === 'agent-platform');
    expect(example).toBeDefined();
    const files = Object.fromEntries(example!.files.map((file) => [file.path, file.content]));

    const result = await compile(files, example!.files[0]!.path, {
      formatters: [
        { name: 'factory', config: { version: 'full' } },
        { name: 'github', config: { version: 'multifile' } },
      ],
    });

    expect(result.success).toBe(true);
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
