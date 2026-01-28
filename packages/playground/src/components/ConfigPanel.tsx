import { usePlaygroundStore, type FormatterName, type ConventionType } from '../store';

const TARGET_INFO: Record<
  FormatterName,
  { label: string; versions: string[]; supportsXml: boolean }
> = {
  github: {
    label: 'GitHub Copilot',
    versions: ['simple', 'multifile', 'full'],
    supportsXml: true,
  },
  claude: {
    label: 'Claude Code',
    versions: ['simple', 'multifile', 'full'],
    supportsXml: true,
  },
  cursor: {
    label: 'Cursor',
    versions: ['standard', 'legacy'],
    supportsXml: false, // Cursor only supports markdown
  },
  antigravity: {
    label: 'Antigravity',
    versions: ['simple', 'frontmatter'],
    supportsXml: true,
  },
};

const CONVENTION_OPTIONS: { value: ConventionType; label: string }[] = [
  { value: 'markdown', label: 'Markdown' },
  { value: 'xml', label: 'XML' },
];

const PROSE_WRAP_OPTIONS = ['always', 'never', 'preserve'] as const;
const TAB_WIDTH_OPTIONS = [2, 4] as const;

export function ConfigPanel() {
  const config = usePlaygroundStore((s) => s.config);
  const setTargetEnabled = usePlaygroundStore((s) => s.setTargetEnabled);
  const setTargetVersion = usePlaygroundStore((s) => s.setTargetVersion);
  const setTargetConvention = usePlaygroundStore((s) => s.setTargetConvention);
  const setFormatting = usePlaygroundStore((s) => s.setFormatting);
  const showConfig = usePlaygroundStore((s) => s.showConfig);
  const setShowConfig = usePlaygroundStore((s) => s.setShowConfig);

  if (!showConfig) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-ps-surface border border-ps-border rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-ps-border">
          <h2 className="text-lg font-semibold text-white">Configuration</h2>
          <button
            onClick={() => setShowConfig(false)}
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

        <div className="p-4 space-y-6">
          {/* Targets Section */}
          <section>
            <h3 className="text-sm font-medium text-gray-300 mb-3">Targets</h3>
            <div className="space-y-3">
              {(
                Object.entries(TARGET_INFO) as [
                  FormatterName,
                  (typeof TARGET_INFO)[FormatterName],
                ][]
              ).map(([target, info]) => {
                const settings = config.targets[target];
                return (
                  <div key={target} className="flex items-center gap-3">
                    {/* Enable checkbox */}
                    <label className="flex items-center gap-2 min-w-[140px]">
                      <input
                        type="checkbox"
                        checked={settings.enabled}
                        onChange={(e) => setTargetEnabled(target, e.target.checked)}
                        className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0"
                      />
                      <span className="text-sm text-gray-200">{info.label}</span>
                    </label>

                    {/* Version select */}
                    <select
                      value={settings.version ?? info.versions[0]}
                      onChange={(e) => setTargetVersion(target, e.target.value)}
                      disabled={!settings.enabled}
                      className="flex-1 px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:border-indigo-500"
                    >
                      {info.versions.map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>

                    {/* Convention select */}
                    <select
                      value={settings.convention ?? 'markdown'}
                      onChange={(e) =>
                        setTargetConvention(
                          target,
                          e.target.value === 'markdown'
                            ? undefined
                            : (e.target.value as ConventionType)
                        )
                      }
                      disabled={!settings.enabled || !info.supportsXml}
                      title={!info.supportsXml ? `${info.label} only supports markdown` : undefined}
                      className="w-24 px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:border-indigo-500"
                    >
                      {CONVENTION_OPTIONS.map((opt) => (
                        <option
                          key={opt.value}
                          value={opt.value}
                          disabled={opt.value === 'xml' && !info.supportsXml}
                        >
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Formatting Section */}
          <section>
            <h3 className="text-sm font-medium text-gray-300 mb-3">Formatting</h3>
            <div className="space-y-3">
              {/* Tab Width */}
              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-200 min-w-[100px]">Tab Width</label>
                <div className="flex gap-2">
                  {TAB_WIDTH_OPTIONS.map((width) => (
                    <button
                      key={width}
                      onClick={() => setFormatting({ tabWidth: width })}
                      className={`px-3 py-1 text-sm rounded ${
                        config.formatting.tabWidth === width
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {width}
                    </button>
                  ))}
                </div>
              </div>

              {/* Prose Wrap */}
              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-200 min-w-[100px]">Prose Wrap</label>
                <select
                  value={config.formatting.proseWrap}
                  onChange={(e) =>
                    setFormatting({
                      proseWrap: e.target.value as (typeof PROSE_WRAP_OPTIONS)[number],
                    })
                  }
                  className="flex-1 px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded text-gray-200 focus:outline-none focus:border-indigo-500"
                >
                  {PROSE_WRAP_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {/* Print Width */}
              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-200 min-w-[100px]">Print Width</label>
                <input
                  type="number"
                  min={40}
                  max={200}
                  value={config.formatting.printWidth}
                  onChange={(e) =>
                    setFormatting({ printWidth: parseInt(e.target.value, 10) || 80 })
                  }
                  className="w-20 px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded text-gray-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="flex justify-end px-4 py-3 border-t border-ps-border">
          <button
            onClick={() => setShowConfig(false)}
            className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
