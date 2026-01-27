import { useState, useEffect, useMemo } from 'react';
import {
  usePlaygroundStore,
  selectOutputsForFormatter,
  selectEnabledTargets,
  type FormatterName,
} from '../store';

const FORMATTERS: { name: FormatterName; label: string; icon: string }[] = [
  { name: 'github', label: 'GitHub', icon: '🐙' },
  { name: 'claude', label: 'Claude', icon: '🤖' },
  { name: 'cursor', label: 'Cursor', icon: '↗' },
  { name: 'antigravity', label: 'Antigravity', icon: '🚀' },
];

/**
 * Get display names for output file paths, adding parent folder prefix when names are duplicated.
 * Example: If there are multiple SKILL.md files, they become "refactoring/SKILL.md", "commit/SKILL.md"
 */
function getDisplayNames(paths: string[]): Map<string, string> {
  const result = new Map<string, string>();

  // First pass: extract simple filenames
  const simpleNames = paths.map((path) => {
    const parts = path.split('/');
    return parts[parts.length - 1] ?? path;
  });

  // Count occurrences of each simple name
  const nameCounts = new Map<string, number>();
  for (const name of simpleNames) {
    nameCounts.set(name, (nameCounts.get(name) ?? 0) + 1);
  }

  // Second pass: add parent folder prefix for duplicates
  for (const [i, path] of paths.entries()) {
    const simpleName = simpleNames[i] ?? path;

    if ((nameCounts.get(simpleName) ?? 0) > 1) {
      // Get parent folder name
      const parts = path.split('/');
      if (parts.length >= 2) {
        const parentFolder = parts[parts.length - 2] ?? '';
        result.set(path, `${parentFolder}/${simpleName}`);
      } else {
        result.set(path, simpleName);
      }
    } else {
      result.set(path, simpleName);
    }
  }

  return result;
}

export function OutputPanel() {
  const activeFormatter = usePlaygroundStore((s) => s.activeFormatter);
  const setActiveFormatter = usePlaygroundStore((s) => s.setActiveFormatter);
  const compileResult = usePlaygroundStore((s) => s.compileResult);
  const isCompiling = usePlaygroundStore((s) => s.isCompiling);
  const enabledTargets = usePlaygroundStore(selectEnabledTargets);

  const outputs = usePlaygroundStore((state) => selectOutputsForFormatter(state, activeFormatter));

  // Track active output file index per formatter
  const [activeOutputIndex, setActiveOutputIndex] = useState(0);

  // Reset active output index when formatter changes or outputs change
  useEffect(() => {
    setActiveOutputIndex(0);
  }, [activeFormatter, outputs.length]);

  // Switch to first enabled formatter if current one is disabled
  useEffect(() => {
    if (!enabledTargets.includes(activeFormatter) && enabledTargets.length > 0) {
      setActiveFormatter(enabledTargets[0]!);
    }
  }, [activeFormatter, enabledTargets, setActiveFormatter]);

  // Compute display names with parent folder prefix for duplicates
  const displayNames = useMemo(() => {
    return getDisplayNames(outputs.map((o) => o.path));
  }, [outputs]);

  const currentOutput = outputs[activeOutputIndex];

  return (
    <div className="h-full flex flex-col">
      {/* Formatter tabs */}
      <div className="flex border-b border-ps-border bg-ps-bg">
        {FORMATTERS.map((formatter) => {
          const isEnabled = enabledTargets.includes(formatter.name);
          const isActive = activeFormatter === formatter.name;

          return (
            <button
              key={formatter.name}
              onClick={() => isEnabled && setActiveFormatter(formatter.name)}
              disabled={!isEnabled}
              className={`px-4 py-2 text-sm flex items-center gap-2 ${
                !isEnabled
                  ? 'opacity-30 cursor-not-allowed text-gray-500'
                  : isActive
                    ? 'tab-active text-white'
                    : 'tab-inactive text-gray-400'
              }`}
              title={!isEnabled ? `${formatter.label} is disabled in config` : undefined}
            >
              <span>{formatter.icon}</span>
              <span>{formatter.label}</span>
            </button>
          );
        })}
      </div>

      {/* Output content */}
      <div className="flex-1 flex flex-col overflow-hidden bg-ps-surface">
        {isCompiling ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-ps-primary border-t-transparent rounded-full animate-spin" />
              <span>Compiling...</span>
            </div>
          </div>
        ) : compileResult && !compileResult.success ? (
          <div className="p-4 overflow-auto">
            <div className="text-red-400 font-medium mb-2">Compilation Failed</div>
            <ul className="space-y-2">
              {compileResult.errors.map((error, i) => (
                <li key={i} className="text-sm">
                  <div className="text-red-300">
                    {error.location?.file && (
                      <span className="text-gray-400">
                        {error.location.file}:{error.location.line}:{error.location.column}{' '}
                      </span>
                    )}
                    <span className="text-yellow-400">[{error.code}]</span> {error.message}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : outputs.length > 0 ? (
          <>
            {/* Output file tabs (only show if multiple files) */}
            {outputs.length > 1 && (
              <div className="flex border-b border-ps-border bg-ps-bg overflow-x-auto">
                {outputs.map((output, index) => (
                  <button
                    key={output.path}
                    onClick={() => setActiveOutputIndex(index)}
                    className={`px-3 py-1.5 text-xs font-mono whitespace-nowrap ${
                      index === activeOutputIndex
                        ? 'bg-ps-surface text-white border-b-2 border-ps-primary'
                        : 'text-gray-400 hover:text-gray-300 hover:bg-ps-surface/50'
                    }`}
                    title={output.path}
                  >
                    {displayNames.get(output.path) || output.path}
                  </button>
                ))}
              </div>
            )}

            {/* File content */}
            {currentOutput && (
              <div className="flex-1 overflow-auto p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500 font-mono">{currentOutput.path}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(currentOutput.content);
                    }}
                    className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded bg-ps-bg"
                  >
                    Copy
                  </button>
                </div>
                <pre className="text-sm font-mono whitespace-pre-wrap text-gray-300 bg-ps-bg p-4 rounded overflow-auto">
                  {currentOutput.content}
                </pre>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            No output available
          </div>
        )}
      </div>
    </div>
  );
}
