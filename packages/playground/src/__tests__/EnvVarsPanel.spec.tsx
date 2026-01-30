import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EnvVarsPanel } from '../components/EnvVarsPanel';
import { usePlaygroundStore } from '../store';

describe('EnvVarsPanel', () => {
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
        envVars: {},
      },
      showEnvVars: false,
    });
  });

  it('should not render when showEnvVars is false', () => {
    render(<EnvVarsPanel />);
    expect(screen.queryByText('Environment Variables')).not.toBeInTheDocument();
  });

  it('should render when showEnvVars is true', () => {
    usePlaygroundStore.setState({ showEnvVars: true });
    render(<EnvVarsPanel />);
    expect(screen.getByText('Environment Variables')).toBeInTheDocument();
  });

  it('should show empty state message when no env vars', () => {
    usePlaygroundStore.setState({ showEnvVars: true });
    render(<EnvVarsPanel />);
    expect(screen.getByText('No environment variables defined')).toBeInTheDocument();
  });

  it('should display existing env vars', () => {
    usePlaygroundStore.setState({
      showEnvVars: true,
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
        envVars: {
          API_KEY: 'test-123',
          PROJECT_NAME: 'my-project',
        },
      },
    });
    render(<EnvVarsPanel />);

    expect(screen.getByText('API_KEY')).toBeInTheDocument();
    expect(screen.getByText('test-123')).toBeInTheDocument();
    expect(screen.getByText('PROJECT_NAME')).toBeInTheDocument();
    expect(screen.getByText('my-project')).toBeInTheDocument();
  });

  it('should add a new env var', () => {
    usePlaygroundStore.setState({ showEnvVars: true });
    render(<EnvVarsPanel />);

    const nameInput = screen.getByPlaceholderText('NAME');
    const valueInput = screen.getByPlaceholderText('value');
    const addButton = screen.getByRole('button', { name: 'Add' });

    fireEvent.change(nameInput, { target: { value: 'NEW_VAR' } });
    fireEvent.change(valueInput, { target: { value: 'new-value' } });
    fireEvent.click(addButton);

    expect(usePlaygroundStore.getState().config.envVars.NEW_VAR).toBe('new-value');
    // Inputs should be cleared
    expect(nameInput).toHaveValue('');
    expect(valueInput).toHaveValue('');
  });

  it('should add env var on Enter key press', () => {
    usePlaygroundStore.setState({ showEnvVars: true });
    render(<EnvVarsPanel />);

    const nameInput = screen.getByPlaceholderText('NAME');
    const valueInput = screen.getByPlaceholderText('value');

    fireEvent.change(nameInput, { target: { value: 'ENTER_VAR' } });
    fireEvent.change(valueInput, { target: { value: 'enter-value' } });
    fireEvent.keyDown(valueInput, { key: 'Enter', code: 'Enter' });

    expect(usePlaygroundStore.getState().config.envVars.ENTER_VAR).toBe('enter-value');
  });

  it('should show error for empty name', () => {
    usePlaygroundStore.setState({ showEnvVars: true });
    render(<EnvVarsPanel />);

    const addButton = screen.getByRole('button', { name: 'Add' });
    fireEvent.click(addButton);

    expect(screen.getByText('Variable name is required')).toBeInTheDocument();
  });

  it('should show error for invalid name format', () => {
    usePlaygroundStore.setState({ showEnvVars: true });
    render(<EnvVarsPanel />);

    const nameInput = screen.getByPlaceholderText('NAME');
    const addButton = screen.getByRole('button', { name: 'Add' });

    fireEvent.change(nameInput, { target: { value: '123INVALID' } });
    fireEvent.click(addButton);

    expect(
      screen.getByText('Invalid name: must start with letter or underscore')
    ).toBeInTheDocument();
  });

  it('should show error for duplicate name', () => {
    usePlaygroundStore.setState({
      showEnvVars: true,
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
        envVars: {
          EXISTING_VAR: 'existing-value',
        },
      },
    });
    render(<EnvVarsPanel />);

    const nameInput = screen.getByPlaceholderText('NAME');
    const addButton = screen.getByRole('button', { name: 'Add' });

    fireEvent.change(nameInput, { target: { value: 'EXISTING_VAR' } });
    fireEvent.click(addButton);

    expect(screen.getByText('Variable already exists')).toBeInTheDocument();
  });

  it('should delete an env var', () => {
    usePlaygroundStore.setState({
      showEnvVars: true,
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
        envVars: {
          TO_DELETE: 'delete-me',
        },
      },
    });
    render(<EnvVarsPanel />);

    const deleteButton = screen.getByRole('button', { name: 'Delete variable' });
    fireEvent.click(deleteButton);

    expect(usePlaygroundStore.getState().config.envVars.TO_DELETE).toBeUndefined();
  });

  it('should close when clicking the close button', () => {
    usePlaygroundStore.setState({ showEnvVars: true });
    render(<EnvVarsPanel />);

    const closeButton = screen.getByRole('button', { name: 'Close' });
    fireEvent.click(closeButton);

    expect(usePlaygroundStore.getState().showEnvVars).toBe(false);
  });

  it('should close when clicking the Done button', () => {
    usePlaygroundStore.setState({ showEnvVars: true });
    render(<EnvVarsPanel />);

    const doneButton = screen.getByRole('button', { name: 'Done' });
    fireEvent.click(doneButton);

    expect(usePlaygroundStore.getState().showEnvVars).toBe(false);
  });

  it('should clear error when typing in name input', () => {
    usePlaygroundStore.setState({ showEnvVars: true });
    render(<EnvVarsPanel />);

    const nameInput = screen.getByPlaceholderText('NAME');
    const addButton = screen.getByRole('button', { name: 'Add' });

    // Trigger error
    fireEvent.click(addButton);
    expect(screen.getByText('Variable name is required')).toBeInTheDocument();

    // Start typing - error should clear
    fireEvent.change(nameInput, { target: { value: 'V' } });
    expect(screen.queryByText('Variable name is required')).not.toBeInTheDocument();
  });

  it('should accept valid name formats', () => {
    usePlaygroundStore.setState({ showEnvVars: true });
    render(<EnvVarsPanel />);

    const nameInput = screen.getByPlaceholderText('NAME');
    const valueInput = screen.getByPlaceholderText('value');
    const addButton = screen.getByRole('button', { name: 'Add' });

    // Test with underscore prefix
    fireEvent.change(nameInput, { target: { value: '_PRIVATE_VAR' } });
    fireEvent.change(valueInput, { target: { value: 'value1' } });
    fireEvent.click(addButton);
    expect(usePlaygroundStore.getState().config.envVars._PRIVATE_VAR).toBe('value1');

    // Test with numbers (not at start)
    fireEvent.change(nameInput, { target: { value: 'VAR_123' } });
    fireEvent.change(valueInput, { target: { value: 'value2' } });
    fireEvent.click(addButton);
    expect(usePlaygroundStore.getState().config.envVars.VAR_123).toBe('value2');
  });

  it('should display help text', () => {
    usePlaygroundStore.setState({ showEnvVars: true });
    render(<EnvVarsPanel />);

    expect(screen.getByText(/These are simulated variables for testing/)).toBeInTheDocument();
    expect(screen.getByText(/Do not use real secrets/)).toBeInTheDocument();
  });
});
