import { useState } from 'react';
import { usePlaygroundStore } from '../store';

export function FileTabs() {
  const files = usePlaygroundStore((s) => s.files);
  const activeFile = usePlaygroundStore((s) => s.activeFile);
  const setActiveFile = usePlaygroundStore((s) => s.setActiveFile);
  const addFile = usePlaygroundStore((s) => s.addFile);
  const deleteFile = usePlaygroundStore((s) => s.deleteFile);
  const renameFile = usePlaygroundStore((s) => s.renameFile);

  const [editingFile, setEditingFile] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleAddFile = () => {
    const baseName = 'new-file';
    let name = `${baseName}.prs`;
    let counter = 1;
    while (files.some((f) => f.path === name)) {
      name = `${baseName}-${counter}.prs`;
      counter++;
    }
    addFile(name, '@meta {\n  id: "' + name.replace('.prs', '') + '"\n  syntax: "1.0.0"\n}\n');
  };

  const handleDoubleClick = (path: string) => {
    setEditingFile(path);
    setEditValue(path);
  };

  const handleRenameSubmit = (oldPath: string) => {
    if (editValue && editValue !== oldPath) {
      const newPath = editValue.endsWith('.prs') ? editValue : `${editValue}.prs`;
      if (!files.some((f) => f.path === newPath)) {
        renameFile(oldPath, newPath);
      }
    }
    setEditingFile(null);
  };

  return (
    <div className="flex items-center bg-ps-bg border-b border-ps-border overflow-x-auto">
      {files.map((file) => (
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
              <span className="truncate max-w-[120px]">{file.path}</span>
              {files.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteFile(file.path);
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
