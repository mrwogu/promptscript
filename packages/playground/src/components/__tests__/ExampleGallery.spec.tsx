import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { compile } from '@promptscript/browser-compiler';
import { EXAMPLES, ExampleGallery } from '../ExampleGallery';
import { usePlaygroundStore } from '../../store';

describe('ExampleGallery — gallery examples compile', () => {
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
    });
  }
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
