import { useState } from 'react';
import { usePlaygroundStore } from '../store';

/**
 * Regex pattern for valid environment variable names.
 * Must start with letter or underscore, followed by letters, numbers, or underscores.
 */
const ENV_VAR_NAME_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;

/**
 * Panel for managing simulated environment variables.
 */
export function EnvVarsPanel() {
  const config = usePlaygroundStore((s) => s.config);
  const setEnvVar = usePlaygroundStore((s) => s.setEnvVar);
  const deleteEnvVar = usePlaygroundStore((s) => s.deleteEnvVar);
  const showEnvVars = usePlaygroundStore((s) => s.showEnvVars);
  const setShowEnvVars = usePlaygroundStore((s) => s.setShowEnvVars);

  const [newName, setNewName] = useState('');
  const [newValue, setNewValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!showEnvVars) return null;

  const envVars = Object.entries(config.envVars);

  const handleAdd = () => {
    const trimmedName = newName.trim();
    const trimmedValue = newValue.trim();

    if (!trimmedName) {
      setError('Variable name is required');
      return;
    }

    if (!ENV_VAR_NAME_PATTERN.test(trimmedName)) {
      setError('Invalid name: must start with letter or underscore');
      return;
    }

    if (config.envVars[trimmedName] !== undefined) {
      setError('Variable already exists');
      return;
    }

    setEnvVar(trimmedName, trimmedValue);
    setNewName('');
    setNewValue('');
    setError(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAdd();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-ps-surface border border-ps-border rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-ps-border">
          <h2 className="text-lg font-semibold text-white">Environment Variables</h2>
          <button
            onClick={() => setShowEnvVars(false)}
            className="text-gray-400 hover:text-white p-1"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Existing variables */}
          {envVars.length > 0 && (
            <div className="space-y-2">
              {envVars.map(([name, value]) => (
                <div key={name} className="flex items-center gap-2 bg-gray-800 rounded px-3 py-2">
                  <span className="font-mono text-sm text-blue-400 min-w-[120px]">{name}</span>
                  <span className="text-gray-400">=</span>
                  <span className="font-mono text-sm text-gray-200 flex-1 truncate">{value}</span>
                  <button
                    onClick={() => deleteEnvVar(name)}
                    className="text-gray-500 hover:text-red-400 p-1"
                    title="Delete variable"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {envVars.length === 0 && (
            <p className="text-gray-500 text-sm text-center py-4">
              No environment variables defined
            </p>
          )}

          {/* Add new variable */}
          <div className="border-t border-ps-border pt-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => {
                  setNewName(e.target.value);
                  setError(null);
                }}
                onKeyDown={handleKeyDown}
                placeholder="NAME"
                className="flex-1 px-3 py-2 text-sm font-mono bg-gray-700 border border-gray-600 rounded text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500"
              />
              <input
                type="text"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="value"
                className="flex-1 px-3 py-2 text-sm font-mono bg-gray-700 border border-gray-600 rounded text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={handleAdd}
                className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded"
              >
                Add
              </button>
            </div>
            {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
          </div>

          {/* Help text */}
          <p className="text-gray-500 text-xs">
            These are simulated variables for testing. Use{' '}
            <code className="text-gray-400">${'{VAR}'}</code> or{' '}
            <code className="text-gray-400">${'{VAR:-default}'}</code> in your PRS files.
            <br />
            <strong>Note:</strong> Do not use real secrets.
          </p>
        </div>

        {/* Footer */}
        <div className="flex justify-end px-4 py-3 border-t border-ps-border">
          <button
            onClick={() => setShowEnvVars(false)}
            className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
