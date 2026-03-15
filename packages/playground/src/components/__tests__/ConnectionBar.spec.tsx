import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConnectionBar } from '../ConnectionBar';

describe('ConnectionBar', () => {
  const defaultProps = {
    status: 'disconnected' as const,
    serverHost: null,
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
