import { useState } from 'react';
import type { ConnectionStatus } from '../hooks/useServerConnection';

interface ConnectionBarProps {
  status: ConnectionStatus;
  serverHost: string | null;
  error: string | null;
  onConnect: (host: string) => void;
  onDisconnect: () => void;
}

const STATUS_COLORS: Record<ConnectionStatus, string> = {
  disconnected: 'bg-gray-500',
  connecting: 'bg-yellow-400 animate-pulse',
  connected: 'bg-green-500',
  reconnecting: 'bg-yellow-400 animate-pulse',
};

const STATUS_LABELS: Record<ConnectionStatus, string> = {
  disconnected: 'Not connected',
  connecting: 'Connecting...',
  connected: 'Connected',
  reconnecting: 'Reconnecting...',
};

export function ConnectionBar({
  status,
  serverHost,
  error,
  onConnect,
  onDisconnect,
}: ConnectionBarProps) {
  const [showInput, setShowInput] = useState(false);
  const [inputValue, setInputValue] = useState('localhost:3000');

  const handleSubmit = (): void => {
    if (inputValue.trim()) {
      onConnect(inputValue.trim());
      setShowInput(false);
    }
  };

  if (status === 'disconnected' && !showInput) {
    return (
      <div className="flex items-center gap-2 px-4 py-1.5 bg-ps-bg border-b border-ps-border text-sm">
        <div className={`w-2 h-2 rounded-full ${error ? 'bg-red-500' : STATUS_COLORS[status]}`} />
        {error ? (
          <span className="text-red-400">{error}</span>
        ) : (
          <span className="text-gray-400">{STATUS_LABELS[status]}</span>
        )}
        <button
          onClick={() => setShowInput(true)}
          className="ml-auto px-2 py-0.5 text-xs bg-ps-primary hover:bg-ps-secondary rounded text-white"
        >
          {error ? 'Retry' : 'Connect to local server'}
        </button>
      </div>
    );
  }

  if (showInput) {
    return (
      <div className="flex items-center gap-2 px-4 py-1.5 bg-ps-bg border-b border-ps-border text-sm">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSubmit();
            if (e.key === 'Escape') setShowInput(false);
          }}
          placeholder="localhost:3000"
          className="bg-ps-surface border border-ps-border rounded px-2 py-0.5 text-white text-xs w-48 outline-none focus:border-ps-primary"
          autoFocus
          onClick={(e) => e.stopPropagation()}
        />
        <button
          onClick={handleSubmit}
          className="px-2 py-0.5 text-xs bg-ps-primary hover:bg-ps-secondary rounded text-white"
        >
          Connect
        </button>
        <button
          onClick={() => setShowInput(false)}
          className="px-2 py-0.5 text-xs text-gray-400 hover:text-white"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-4 py-1.5 bg-ps-bg border-b border-ps-border text-sm">
      <div className={`w-2 h-2 rounded-full ${STATUS_COLORS[status]}`} />
      <span className="text-gray-300">{STATUS_LABELS[status]}</span>
      {serverHost && <span className="text-gray-500 text-xs">{serverHost}</span>}
      {status === 'connected' && (
        <button
          onClick={onDisconnect}
          className="ml-auto px-2 py-0.5 text-xs text-gray-400 hover:text-red-400 cursor-pointer"
        >
          Disconnect
        </button>
      )}
    </div>
  );
}
