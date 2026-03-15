import { useState } from 'react';
import { usePlaygroundStore } from '../store';

export function FileTabs() {
  const files = usePlaygroundStore((s) => s.files);
  const openTabs = usePlaygroundStore((s) => s.openTabs);
  const activeFile = usePlaygroundStore((s) => s.activeFile);
  const setActiveFile = usePlaygroundStore((s) => s.setActiveFile);
  const addFile = usePlaygroundStore((s) => s.addFile);
  const closeTab = usePlaygroundStore((s) => s.closeTab);
  const renameFile = usePlaygroundStore((s) => s.renameFile);
  const showFileTree = usePlaygroundStore((s) => s.showFileTree);
  const setShowFileTree = usePlaygroundStore((s) => s.setShowFileTree);

  const [editingFile, setEditingFile] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const tabFiles = files.filter((f) => openTabs.includes(f.path));

  const handleAddFile = () => {
    // Detect source directory from existing files (e.g. '.promptscript/')
    const existingDir =
      files.length > 0
        ? (() => {
            const firstPath = files[0]!.path;
            const slashIdx = firstPath.lastIndexOf('/');
            return slashIdx !== -1 ? firstPath.slice(0, slashIdx + 1) : '';
          })()
        : '';

    const baseName = 'new-file';
    let name = `${existingDir}${baseName}.prs`;
    let counter = 1;
    while (files.some((f) => f.path === name)) {
      name = `${existingDir}${baseName}-${counter}.prs`;
      counter++;
    }
    const id = name.replace(/^.*\//, '').replace('.prs', '');
    addFile(name, '@meta {\n  id: "' + id + '"\n  syntax: "1.0.0"\n}\n');
  };

  const handleDoubleClick = (path: string) => {
    setEditingFile(path);
    setEditValue(path);
  };

  const handleRenameSubmit = (oldPath: string) => {
    if (editValue && editValue !== oldPath) {
      const isYaml = editValue.endsWith('.yaml') || editValue.endsWith('.yml');
      const newPath = isYaml
        ? editValue
        : editValue.endsWith('.prs')
          ? editValue
          : `${editValue}.prs`;
      if (!files.some((f) => f.path === newPath)) {
        renameFile(oldPath, newPath);
      }
    }
    setEditingFile(null);
  };

  return (
    <div className="flex items-center bg-ps-bg border-b border-ps-border overflow-x-auto">
      <button
        onClick={() => setShowFileTree(!showFileTree)}
        className={`px-2 py-2 text-gray-500 hover:text-white hover:bg-ps-surface/50 flex-shrink-0 ${showFileTree ? 'text-white bg-ps-surface/50' : ''}`}
        title="Toggle file tree"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M1 2h5l1 1h7v1H6.5L5.5 3H2v9h4v1H1V2z" />
          <path d="M7 6h8v8H7V6zm1 1v6h6V7H8z" />
        </svg>
      </button>

      {tabFiles.map((file) => (
        <div
          key={file.path}
          className={`group flex items-center px-3 py-2 text-sm cursor-pointer border-r border-ps-border ${
            activeFile === file.path
              ? 'bg-ps-surface text-white'
              : 'text-gray-400 hover:bg-ps-surface/50'
          }`}
          onClick={() => setActiveFile(file.path)}
          onDoubleClick={() => handleDoubleClick(file.path)}
        >
          {editingFile === file.path ? (
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={() => handleRenameSubmit(file.path)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRenameSubmit(file.path);
                if (e.key === 'Escape') setEditingFile(null);
              }}
              className="bg-transparent border-b border-ps-primary outline-none w-24"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <>
              <span className="truncate max-w-[120px]">{file.path.split('/').pop()}</span>
              {openTabs.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(file.path);
                  }}
                  className="ml-2 opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400"
                >
                  ×
                </button>
              )}
            </>
          )}
        </div>
      ))}

      <button
        onClick={handleAddFile}
        className="px-3 py-2 text-gray-500 hover:text-white hover:bg-ps-surface/50"
        title="Add new file"
      >
        +
      </button>
    </div>
  );
}
