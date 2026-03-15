import { usePlaygroundStore } from '../store';

export function FileTree() {
  const files = usePlaygroundStore((s) => s.files);
  const activeFile = usePlaygroundStore((s) => s.activeFile);
  const openTabs = usePlaygroundStore((s) => s.openTabs);
  const openFile = usePlaygroundStore((s) => s.openFile);

  // Group files by directory
  const tree = new Map<string, string[]>();
  for (const file of files) {
    const parts = file.path.split('/');
    if (parts.length > 1) {
      const dir = parts.slice(0, -1).join('/');
      const existing = tree.get(dir) ?? [];
      existing.push(file.path);
      tree.set(dir, existing);
    } else {
      const existing = tree.get('') ?? [];
      existing.push(file.path);
      tree.set('', existing);
    }
  }

  const sortedDirs = [...tree.keys()].sort();

  return (
    <div className="w-48 flex-shrink-0 bg-ps-bg border-r border-ps-border overflow-y-auto text-sm">
      <div className="px-3 py-2 text-xs text-gray-500 uppercase tracking-wider">Files</div>
      {sortedDirs.map((dir) => (
        <div key={dir || '__root'}>
          {dir && (
            <div className="px-3 py-1 text-xs text-gray-500 flex items-center gap-1">
              <span>📁</span>
              <span>{dir}</span>
            </div>
          )}
          {(tree.get(dir) ?? []).sort().map((path) => {
            const fileName = path.split('/').pop() ?? path;
            const isActive = activeFile === path;
            const isOpen = openTabs.includes(path);
            return (
              <button
                key={path}
                onClick={() => openFile(path)}
                className={`w-full text-left px-3 py-1 truncate cursor-pointer ${
                  dir ? 'pl-6' : ''
                } ${
                  isActive
                    ? 'bg-ps-surface text-white'
                    : isOpen
                      ? 'text-gray-300 hover:bg-ps-surface/50'
                      : 'text-gray-500 hover:bg-ps-surface/50 hover:text-gray-300'
                }`}
              >
                {fileName}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
