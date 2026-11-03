import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { act, render, screen, fireEvent } from '@testing-library/react';
import { TARGET_DEFINITIONS, type KnownTarget } from '@promptscript/core';
import { ConfigPanel } from '../components/ConfigPanel';
import { usePlaygroundStore } from '../store';

describe('ConfigPanel', () => {
  beforeEach(() => {
    // Reset store to initial state
    usePlaygroundStore.setState({
      config: {
        targets: {
          github: { enabled: true, version: 'full' },
          claude: { enabled: true, version: 'full' },
          cursor: { enabled: true, version: 'standard' },
          antigravity: { enabled: true, version: 'frontmatter' },
          factory: { enabled: false, version: 'full' },
          opencode: { enabled: false, version: 'full' },
          gemini: { enabled: false, version: 'full' },
          windsurf: { enabled: false, version: 'full' },
          cline: { enabled: false, version: 'full' },
          roo: { enabled: false, version: 'full' },
          codex: { enabled: false, version: 'full' },
          continue: { enabled: false, version: 'full' },
          augment: { enabled: false, version: 'full' },
          goose: { enabled: false, version: 'full' },
          kilo: { enabled: false, version: 'full' },
          amp: { enabled: false, version: 'full' },
          trae: { enabled: false, version: 'full' },
          junie: { enabled: false, version: 'full' },
          kiro: { enabled: false, version: 'full' },
          cortex: { enabled: false, version: 'full' },
          crush: { enabled: false, version: 'full' },
          'command-code': { enabled: false, version: 'full' },
          kode: { enabled: false, version: 'full' },
          mcpjam: { enabled: false, version: 'full' },
          'mistral-vibe': { enabled: false, version: 'full' },
          mux: { enabled: false, version: 'full' },
          openhands: { enabled: false, version: 'full' },
          pi: { enabled: false, version: 'full' },
          qoder: { enabled: false, version: 'full' },
          'qwen-code': { enabled: false, version: 'full' },
          zencoder: { enabled: false, version: 'full' },
          neovate: { enabled: false, version: 'full' },
          pochi: { enabled: false, version: 'full' },
          adal: { enabled: false, version: 'full' },
          iflow: { enabled: false, version: 'full' },
          openclaw: { enabled: false, version: 'full' },
          codebuddy: { enabled: false, version: 'full' },
        },
        formatting: {
          tabWidth: 2,
          proseWrap: 'preserve',
          printWidth: 80,
        },
        envVars: {},
      },
      showConfig: false,
    });
  });

  it('should not render when showConfig is false', () => {
    render(<ConfigPanel />);
    expect(screen.queryByText('Configuration')).not.toBeInTheDocument();
  });

  it('should render when showConfig is true', () => {
    usePlaygroundStore.setState({ showConfig: true });
    render(<ConfigPanel />);
    expect(screen.getByText('Configuration')).toBeInTheDocument();
  });

  it('should display popular target options by default', () => {
    usePlaygroundStore.setState({ showConfig: true });
    render(<ConfigPanel />);

    // Popular targets visible by default
    expect(screen.getByText('GitHub Copilot')).toBeInTheDocument();
    expect(screen.getByText('Claude Code')).toBeInTheDocument();
    expect(screen.getByText('Cursor')).toBeInTheDocument();
    expect(screen.getByText('Antigravity')).toBeInTheDocument();
    expect(screen.getByText('Windsurf')).toBeInTheDocument();
    expect(screen.getByText('Cline')).toBeInTheDocument();
    expect(screen.getByText('Gemini CLI')).toBeInTheDocument();
    expect(screen.getByText('Codex')).toBeInTheDocument();

    // Non-popular targets hidden by default
    expect(screen.queryByText('Factory AI')).not.toBeInTheDocument();
  });

  it('should display all target options when All tab is clicked', () => {
    usePlaygroundStore.setState({ showConfig: true });
    render(<ConfigPanel />);

    fireEvent.click(screen.getByText(/^All/));

    expect(screen.getByText('Factory AI')).toBeInTheDocument();
    expect(screen.getByText('OpenCode')).toBeInTheDocument();
    expect(screen.getByText('Roo Code')).toBeInTheDocument();
    expect(screen.getByText('Hermes Agent')).toBeInTheDocument();
  });

  it('should display formatting options', () => {
    usePlaygroundStore.setState({ showConfig: true });
    render(<ConfigPanel />);

    expect(screen.getByText('Tab Width')).toBeInTheDocument();
    expect(screen.getByText('Prose Wrap')).toBeInTheDocument();
    expect(screen.getByText('Print Width')).toBeInTheDocument();
  });

  it('should toggle target enabled state', () => {
    usePlaygroundStore.setState({ showConfig: true });
    render(<ConfigPanel />);

    const githubCheckbox = screen.getByRole('checkbox', { name: /GitHub Copilot/i });
    expect(githubCheckbox).toBeChecked();

    fireEvent.click(githubCheckbox);
    expect(usePlaygroundStore.getState().config.targets.github.enabled).toBe(false);
  });

  it('should change target version', () => {
    usePlaygroundStore.setState({ showConfig: true });
    render(<ConfigPanel />);

    // Find the version select for GitHub (selects[0] is ProseWrap from Formatting section)
    const selects = screen.getAllByRole('combobox');
    const githubVersionSelect = selects[1]; // First target select (after ProseWrap)

    fireEvent.change(githubVersionSelect, { target: { value: 'multifile' } });
    expect(usePlaygroundStore.getState().config.targets.github.version).toBe('multifile');
  });

  it('should change tab width', () => {
    usePlaygroundStore.setState({ showConfig: true });
    render(<ConfigPanel />);

    const tabWidth4Button = screen.getByRole('button', { name: '4' });
    fireEvent.click(tabWidth4Button);

    expect(usePlaygroundStore.getState().config.formatting.tabWidth).toBe(4);
  });

  it('should change prose wrap', () => {
    usePlaygroundStore.setState({ showConfig: true });
    render(<ConfigPanel />);

    const proseWrapSelect = screen.getByDisplayValue('preserve');
    fireEvent.change(proseWrapSelect, { target: { value: 'always' } });

    expect(usePlaygroundStore.getState().config.formatting.proseWrap).toBe('always');
  });

  it('should change print width', () => {
    usePlaygroundStore.setState({ showConfig: true });
    render(<ConfigPanel />);

    const printWidthInput = screen.getByDisplayValue('80');
    fireEvent.change(printWidthInput, { target: { value: '120' } });

    expect(usePlaygroundStore.getState().config.formatting.printWidth).toBe(120);
  });

  it('should close when clicking the close button', () => {
    usePlaygroundStore.setState({ showConfig: true });
    render(<ConfigPanel />);

    const closeButton = screen.getByRole('button', { name: 'Close' });
    fireEvent.click(closeButton);

    expect(usePlaygroundStore.getState().showConfig).toBe(false);
  });

  it('should close when clicking the Done button', () => {
    usePlaygroundStore.setState({ showConfig: true });
    render(<ConfigPanel />);

    const doneButton = screen.getByRole('button', { name: 'Done' });
    fireEvent.click(doneButton);

    expect(usePlaygroundStore.getState().showConfig).toBe(false);
  });

  it('should close when pressing Escape key', () => {
    usePlaygroundStore.setState({ showConfig: true });
    render(<ConfigPanel />);

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(usePlaygroundStore.getState().showConfig).toBe(false);
  });

  it('should close when clicking the backdrop', () => {
    usePlaygroundStore.setState({ showConfig: true });
    const { container } = render(<ConfigPanel />);

    // The backdrop is the outermost fixed div
    const backdrop = container.querySelector('.fixed');
    fireEvent.click(backdrop!);

    expect(usePlaygroundStore.getState().showConfig).toBe(false);
  });

  it('should not close when clicking inside the modal content', () => {
    usePlaygroundStore.setState({ showConfig: true });
    render(<ConfigPanel />);

    fireEvent.click(screen.getByText('Configuration'));

    expect(usePlaygroundStore.getState().showConfig).toBe(true);
  });

  it('should change target convention', () => {
    usePlaygroundStore.setState({ showConfig: true });
    render(<ConfigPanel />);

    // Get all comboboxes — find xml convention select for GitHub (which supports XML)
    const selects = screen.getAllByRole('combobox');
    // Convention selects are the 3rd select per target row (version, convention)
    // ProseWrap(0), GitHub version(1), GitHub convention(2)
    const githubConventionSelect = selects[2];

    fireEvent.change(githubConventionSelect!, { target: { value: 'xml' } });
    expect(usePlaygroundStore.getState().config.targets.github.convention).toBe('xml');

    // Change back to markdown — should set convention to undefined
    fireEvent.change(githubConventionSelect!, { target: { value: 'markdown' } });
    expect(usePlaygroundStore.getState().config.targets.github.convention).toBeUndefined();
  });

  it('should disable version select when target is disabled', () => {
    usePlaygroundStore.setState({
      showConfig: true,
      config: {
        targets: {
          github: { enabled: false, version: 'full' },
          claude: { enabled: true, version: 'full' },
          cursor: { enabled: true, version: 'standard' },
          antigravity: { enabled: true, version: 'frontmatter' },
          factory: { enabled: false, version: 'full' },
          opencode: { enabled: false, version: 'full' },
          gemini: { enabled: false, version: 'full' },
          windsurf: { enabled: false, version: 'full' },
          cline: { enabled: false, version: 'full' },
          roo: { enabled: false, version: 'full' },
          codex: { enabled: false, version: 'full' },
          continue: { enabled: false, version: 'full' },
          augment: { enabled: false, version: 'full' },
          goose: { enabled: false, version: 'full' },
          kilo: { enabled: false, version: 'full' },
          amp: { enabled: false, version: 'full' },
          trae: { enabled: false, version: 'full' },
          junie: { enabled: false, version: 'full' },
          kiro: { enabled: false, version: 'full' },
          cortex: { enabled: false, version: 'full' },
          crush: { enabled: false, version: 'full' },
          'command-code': { enabled: false, version: 'full' },
          kode: { enabled: false, version: 'full' },
          mcpjam: { enabled: false, version: 'full' },
          'mistral-vibe': { enabled: false, version: 'full' },
          mux: { enabled: false, version: 'full' },
          openhands: { enabled: false, version: 'full' },
          pi: { enabled: false, version: 'full' },
          qoder: { enabled: false, version: 'full' },
          'qwen-code': { enabled: false, version: 'full' },
          zencoder: { enabled: false, version: 'full' },
          neovate: { enabled: false, version: 'full' },
          pochi: { enabled: false, version: 'full' },
          adal: { enabled: false, version: 'full' },
          iflow: { enabled: false, version: 'full' },
          openclaw: { enabled: false, version: 'full' },
          codebuddy: { enabled: false, version: 'full' },
        },
        formatting: {
          tabWidth: 2,
          proseWrap: 'preserve',
          printWidth: 80,
        },
        envVars: {},
      },
    });
    render(<ConfigPanel />);

    const selects = screen.getAllByRole('combobox');
    const githubVersionSelect = selects[1]; // First target select (after ProseWrap)

    expect(githubVersionSelect).toBeDisabled();
  });
});

describe('ConfigPanel prompt targets', () => {
  afterEach(() => {
    act(() => {
      usePlaygroundStore.getState().setTargetEnabled('bundle', false);
      usePlaygroundStore.getState().setTargetEnabled('prompt-text', false);
      usePlaygroundStore.setState({ showConfig: false });
    });
  });

  it('lists the bundle and prompt-text targets and toggles them', () => {
    usePlaygroundStore.setState({ showConfig: true });
    render(<ConfigPanel />);
    fireEvent.click(screen.getByText(/^All \(/));

    const bundle = screen.getByLabelText('Prompt bundle');
    const text = screen.getByLabelText('Prompt text');
    fireEvent.click(bundle);
    fireEvent.click(text);

    expect(usePlaygroundStore.getState().config.targets['bundle'].enabled).toBe(true);
    expect(usePlaygroundStore.getState().config.targets['prompt-text'].enabled).toBe(true);
  });
});

describe('ConfigPanel version options', () => {
  function versionSelectFor(label: string): HTMLSelectElement {
    const row = screen.getByText(label).closest('div');
    const selects = row?.querySelectorAll('select');
    return selects?.[0] as HTMLSelectElement;
  }

  function optionValues(select: HTMLSelectElement): string[] {
    return Array.from(select.options).map((option) => option.value);
  }

  beforeEach(() => {
    act(() => {
      usePlaygroundStore.setState({ showConfig: true });
      usePlaygroundStore.getState().setTargetEnabled('cursor', true);
      usePlaygroundStore.getState().setTargetEnabled('antigravity', true);
      usePlaygroundStore.getState().setTargetVersion('cursor', 'standard');
    });
  });

  afterEach(() => {
    act(() => {
      usePlaygroundStore.setState({ showConfig: false });
    });
  });

  it('offers every cursor version', () => {
    render(<ConfigPanel />);

    expect(optionValues(versionSelectFor('Cursor'))).toEqual([
      'modern',
      'agents-md',
      'full',
      'multifile',
      'legacy',
    ]);
  });

  it('offers every antigravity version', () => {
    render(<ConfigPanel />);

    expect(optionValues(versionSelectFor('Antigravity'))).toEqual([
      'simple',
      'frontmatter',
      'agents-md',
    ]);
  });

  it('renders the catalog versions for every target', () => {
    render(<ConfigPanel />);
    fireEvent.click(screen.getByText(/^All \(/));

    const targets = Object.keys(TARGET_DEFINITIONS) as KnownTarget[];
    const selects = screen
      .getAllByRole('combobox')
      .filter((select) => select.querySelector('option[value="markdown"]') === null)
      .slice(1);

    expect(selects).toHaveLength(targets.length);
    targets.forEach((target, index) => {
      expect(optionValues(selects[index] as HTMLSelectElement)).toEqual(
        Object.keys(TARGET_DEFINITIONS[target].versions)
      );
    });
  });

  it('shows the alias target of a stored cursor version', () => {
    render(<ConfigPanel />);

    expect(versionSelectFor('Cursor').value).toBe('modern');
  });

  it('stores the version picked for cursor', () => {
    render(<ConfigPanel />);

    fireEvent.change(versionSelectFor('Cursor'), { target: { value: 'full' } });

    expect(usePlaygroundStore.getState().config.targets.cursor.version).toBe('full');
  });

  it('shows the catalog default for a target missing from the store', () => {
    usePlaygroundStore.setState((state) => {
      const targets = { ...state.config.targets };
      delete targets['aider'];
      return { config: { ...state.config, targets } };
    });
    render(<ConfigPanel />);
    fireEvent.click(screen.getByText(/^All \(/));

    expect(versionSelectFor('Aider').value).toBe('full');
  });
});
