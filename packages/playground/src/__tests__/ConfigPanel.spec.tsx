import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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
        },
        formatting: {
          tabWidth: 2,
          proseWrap: 'preserve',
          printWidth: 80,
        },
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

  it('should display all target options', () => {
    usePlaygroundStore.setState({ showConfig: true });
    render(<ConfigPanel />);

    expect(screen.getByText('GitHub Copilot')).toBeInTheDocument();
    expect(screen.getByText('Claude Code')).toBeInTheDocument();
    expect(screen.getByText('Cursor')).toBeInTheDocument();
    expect(screen.getByText('Antigravity')).toBeInTheDocument();
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

    // Find the version select for GitHub (it's the first one after the checkbox)
    const selects = screen.getAllByRole('combobox');
    const githubVersionSelect = selects[0]; // First select is for GitHub

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

  it('should disable version select when target is disabled', () => {
    usePlaygroundStore.setState({
      showConfig: true,
      config: {
        targets: {
          github: { enabled: false, version: 'full' },
          claude: { enabled: true, version: 'full' },
          cursor: { enabled: true, version: 'standard' },
          antigravity: { enabled: true, version: 'frontmatter' },
        },
        formatting: {
          tabWidth: 2,
          proseWrap: 'preserve',
          printWidth: 80,
        },
      },
    });
    render(<ConfigPanel />);

    const selects = screen.getAllByRole('combobox');
    const githubVersionSelect = selects[0];

    expect(githubVersionSelect).toBeDisabled();
  });
});
