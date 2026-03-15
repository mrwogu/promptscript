import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConnectionBar } from '../ConnectionBar';

describe('ConnectionBar', () => {
  const defaultProps = {
    status: 'disconnected' as const,
    serverHost: null,
    error: null,
    onConnect: vi.fn(),
    onDisconnect: vi.fn(),
  };

  it('shows connect button when disconnected', () => {
    render(<ConnectionBar {...defaultProps} />);
    expect(screen.getByText('Connect to local server')).toBeTruthy();
  });

  it('shows input field after clicking connect', () => {
    render(<ConnectionBar {...defaultProps} />);
    fireEvent.click(screen.getByText('Connect to local server'));
    expect(screen.getByPlaceholderText('localhost:3000')).toBeTruthy();
  });

  it('calls onConnect when submitting host', () => {
    const onConnect = vi.fn();
    render(<ConnectionBar {...defaultProps} onConnect={onConnect} />);
    fireEvent.click(screen.getByText('Connect to local server'));
    fireEvent.click(screen.getByText('Connect'));
    expect(onConnect).toHaveBeenCalledWith('localhost:3000');
  });

  it('shows connected state with disconnect button', () => {
    render(<ConnectionBar {...defaultProps} status="connected" serverHost="localhost:3000" />);
    expect(screen.getByText('Connected')).toBeTruthy();
    expect(screen.getByText('localhost:3000')).toBeTruthy();
    expect(screen.getByText('Disconnect')).toBeTruthy();
  });

  it('calls onDisconnect when clicking disconnect', () => {
    const onDisconnect = vi.fn();
    render(
      <ConnectionBar
        {...defaultProps}
        status="connected"
        serverHost="localhost:3000"
        onDisconnect={onDisconnect}
      />
    );
    fireEvent.click(screen.getByText('Disconnect'));
    expect(onDisconnect).toHaveBeenCalled();
  });

  it('shows error message when connection fails', () => {
    render(
      <ConnectionBar
        {...defaultProps}
        error="Could not connect to localhost:3000. Is the server running?"
      />
    );
    expect(screen.getByText(/Could not connect/)).toBeTruthy();
    expect(screen.getByText('Retry')).toBeTruthy();
  });

  it('shows connecting state', () => {
    render(<ConnectionBar {...defaultProps} status="connecting" />);
    expect(screen.getByText('Connecting...')).toBeTruthy();
  });

  it('does not submit when input is empty', () => {
    const onConnect = vi.fn();
    render(<ConnectionBar {...defaultProps} onConnect={onConnect} />);
    fireEvent.click(screen.getByText('Connect to local server'));
    const input = screen.getByPlaceholderText('localhost:3000');
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.click(screen.getByText('Connect'));
    expect(onConnect).not.toHaveBeenCalled();
  });

  it('input click does not propagate to parent', () => {
    const parentClick = vi.fn();
    render(
      <div onClick={parentClick}>
        <ConnectionBar {...defaultProps} />
      </div>
    );
    fireEvent.click(screen.getByText('Connect to local server'));
    // Reset after the button click propagated
    parentClick.mockClear();
    fireEvent.click(screen.getByPlaceholderText('localhost:3000'));
    expect(parentClick).not.toHaveBeenCalled();
  });

  it('shows reconnecting state', () => {
    render(<ConnectionBar {...defaultProps} status="reconnecting" serverHost="localhost:3000" />);
    expect(screen.getByText('Reconnecting...')).toBeTruthy();
  });

  it('submits on Enter key', () => {
    const onConnect = vi.fn();
    render(<ConnectionBar {...defaultProps} onConnect={onConnect} />);
    fireEvent.click(screen.getByText('Connect to local server'));
    fireEvent.keyDown(screen.getByPlaceholderText('localhost:3000'), { key: 'Enter' });
    expect(onConnect).toHaveBeenCalledWith('localhost:3000');
  });

  it('cancels on Escape key', () => {
    render(<ConnectionBar {...defaultProps} />);
    fireEvent.click(screen.getByText('Connect to local server'));
    expect(screen.getByPlaceholderText('localhost:3000')).toBeTruthy();
    fireEvent.keyDown(screen.getByPlaceholderText('localhost:3000'), { key: 'Escape' });
    expect(screen.getByText('Connect to local server')).toBeTruthy();
  });
});
