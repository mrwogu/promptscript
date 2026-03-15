import { useState, useEffect, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
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
  { name: 'factory', label: 'Factory', icon: '🏭' },
  { name: 'opencode', label: 'OpenCode', icon: '💻' },
  { name: 'gemini', label: 'Gemini', icon: '♊' },
  { name: 'windsurf', label: 'Windsurf', icon: '🏄' },
  { name: 'cline', label: 'Cline', icon: '⌨' },
  { name: 'roo', label: 'Roo Code', icon: '🦘' },
  { name: 'codex', label: 'Codex', icon: '📜' },
  { name: 'continue', label: 'Continue', icon: '▶' },
  { name: 'augment', label: 'Augment', icon: '➕' },
  { name: 'goose', label: 'Goose', icon: '🪿' },
  { name: 'kilo', label: 'Kilo Code', icon: '⚖' },
  { name: 'amp', label: 'Amp', icon: '⚡' },
  { name: 'trae', label: 'Trae', icon: '🌲' },
  { name: 'junie', label: 'Junie', icon: '🌸' },
  { name: 'kiro', label: 'Kiro CLI', icon: '🔮' },
  { name: 'cortex', label: 'Cortex Code', icon: '🧠' },
  { name: 'crush', label: 'Crush', icon: '💎' },
  { name: 'command-code', label: 'Command Code', icon: '⌘' },
  { name: 'kode', label: 'Kode', icon: '🔷' },
  { name: 'mcpjam', label: 'MCPJam', icon: '🎵' },
  { name: 'mistral-vibe', label: 'Mistral Vibe', icon: '🌊' },
  { name: 'mux', label: 'Mux', icon: '🔀' },
  { name: 'openhands', label: 'OpenHands', icon: '🤲' },
  { name: 'pi', label: 'Pi', icon: '🥧' },
  { name: 'qoder', label: 'Qoder', icon: '🔢' },
  { name: 'qwen-code', label: 'Qwen Code', icon: '🐦' },
  { name: 'zencoder', label: 'Zencoder', icon: '🧘' },
  { name: 'neovate', label: 'Neovate', icon: '✨' },
  { name: 'pochi', label: 'Pochi', icon: '🐕' },
  { name: 'adal', label: 'AdaL', icon: '🔬' },
  { name: 'iflow', label: 'iFlow CLI', icon: '🌀' },
  { name: 'openclaw', label: 'OpenClaw', icon: '🦀' },
  { name: 'codebuddy', label: 'CodeBuddy', icon: '👥' },
];

function CopyButton({ content }: { content: string }) {
  const [showCopied, setShowCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content).then(() => {
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    });
  };

  return (
    <button
      onClick={handleCopy}
      className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded bg-ps-bg"
    >
      {showCopied ? 'Copied!' : 'Copy'}
    </button>
  );
}

function OutputFileTree({
  outputs,
  activeIndex,
  onSelect,
}: {
  outputs: { path: string; content: string }[];
  activeIndex: number;
  onSelect: (index: number) => void;
}) {
  // Group by directory
  const tree = useMemo(() => {
    const map = new Map<string, { index: number; path: string; fileName: string }[]>();
    for (let i = 0; i < outputs.length; i++) {
      const output = outputs[i]!;
      const parts = output.path.split('/');
      const fileName = parts.pop() ?? output.path;
      const dir = parts.join('/') || '';
      const existing = map.get(dir) ?? [];
      existing.push({ index: i, path: output.path, fileName });
      map.set(dir, existing);
    }
    return map;
  }, [outputs]);

  const sortedDirs = useMemo(() => [...tree.keys()].sort(), [tree]);

  return (
    <div className="w-52 flex-shrink-0 bg-ps-bg border-r border-ps-border overflow-y-auto text-xs">
      <div className="px-3 py-2 text-xs text-gray-500 uppercase tracking-wider">
        Output ({outputs.length})
      </div>
      {sortedDirs.map((dir) => (
        <div key={dir || '__root'}>
          {dir && (
            <div className="px-3 py-1 text-gray-500 flex items-center gap-1 font-mono">
              <span className="text-gray-600">/</span>
              <span>{dir}</span>
            </div>
          )}
          {(tree.get(dir) ?? []).map(({ index, path, fileName }) => (
            <button
              key={path}
              onClick={() => onSelect(index)}
              className={`w-full text-left px-3 py-1 truncate font-mono cursor-pointer ${
                dir ? 'pl-5' : ''
              } ${
                index === activeIndex
                  ? 'bg-ps-surface text-white'
                  : 'text-gray-400 hover:bg-ps-surface/50 hover:text-gray-300'
              }`}
              title={path}
            >
              {fileName}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

type OutputViewMode = 'tree' | 'tabs';

export function OutputPanel() {
  const activeFormatter = usePlaygroundStore((s) => s.activeFormatter);
  const setActiveFormatter = usePlaygroundStore((s) => s.setActiveFormatter);
  const compileResult = usePlaygroundStore((s) => s.compileResult);
  const isCompiling = usePlaygroundStore((s) => s.isCompiling);
  const enabledTargets = usePlaygroundStore(useShallow(selectEnabledTargets));
  const [outputViewMode, setOutputViewMode] = useState<OutputViewMode>('tree');

  const outputs = usePlaygroundStore(
    useShallow((state) => selectOutputsForFormatter(state, activeFormatter))
  );

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

  const currentOutput = outputs[activeOutputIndex];

  return (
    <div className="h-full flex flex-col">
      {/* Formatter tabs — only show enabled targets */}
      <div
        className="flex border-b border-ps-border bg-ps-bg overflow-x-auto"
        role="tablist"
        aria-label="Output formatters"
      >
        {FORMATTERS.filter((formatter) => enabledTargets.includes(formatter.name)).map(
          (formatter) => {
            const isActive = activeFormatter === formatter.name;

            return (
              <button
                key={formatter.name}
                onClick={() => setActiveFormatter(formatter.name)}
                role="tab"
                aria-selected={isActive}
                className={`px-4 py-2 text-sm flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  isActive ? 'tab-active text-white' : 'tab-inactive text-gray-400'
                }`}
              >
                <span>{formatter.icon}</span>
                <span>{formatter.label}</span>
              </button>
            );
          }
        )}
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
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* View mode toggle + tabs view */}
            {outputs.length > 1 && (
              <div className="flex items-center border-b border-ps-border bg-ps-bg">
                <button
                  onClick={() => setOutputViewMode(outputViewMode === 'tree' ? 'tabs' : 'tree')}
                  className="px-2 py-1.5 text-xs text-gray-400 hover:text-white hover:bg-ps-surface/50 flex-shrink-0 cursor-pointer flex items-center gap-1"
                  title={outputViewMode === 'tree' ? 'Switch to tabs' : 'Switch to tree'}
                >
                  {outputViewMode === 'tree' ? (
                    <>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M1 2h5l1 1h7v1H6.5L5.5 3H2v9h4v1H1V2z" />
                        <path d="M7 6h8v8H7V6zm1 1v6h6V7H8z" />
                      </svg>
                      <span>Tree</span>
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <rect x="1" y="2" width="4" height="3" rx="0.5" />
                        <rect x="6" y="2" width="4" height="3" rx="0.5" />
                        <rect x="11" y="2" width="4" height="3" rx="0.5" />
                      </svg>
                      <span>Tabs</span>
                    </>
                  )}
                </button>
                {outputViewMode === 'tabs' && (
                  <div className="flex overflow-x-auto">
                    {outputs.map((output, index) => (
                      <button
                        key={output.path}
                        onClick={() => setActiveOutputIndex(index)}
                        className={`px-3 py-1.5 text-xs font-mono whitespace-nowrap cursor-pointer ${
                          index === activeOutputIndex
                            ? 'bg-ps-surface text-white border-b-2 border-ps-primary'
                            : 'text-gray-400 hover:text-gray-300 hover:bg-ps-surface/50'
                        }`}
                        title={output.path}
                      >
                        {output.path.split('/').pop()}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex-1 flex overflow-hidden">
              {/* Output file tree (when in tree mode) */}
              {outputViewMode === 'tree' && outputs.length > 1 && (
                <OutputFileTree
                  outputs={outputs}
                  activeIndex={activeOutputIndex}
                  onSelect={setActiveOutputIndex}
                />
              )}

              {/* File content */}
              {currentOutput && (
                <div className="flex-1 overflow-auto p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500 font-mono">{currentOutput.path}</span>
                    <CopyButton content={currentOutput.content} />
                  </div>
                  <pre className="text-sm font-mono whitespace-pre-wrap text-gray-300 bg-ps-bg p-4 rounded overflow-auto">
                    {currentOutput.content}
                  </pre>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            No output available
          </div>
        )}
      </div>
    </div>
  );
}
