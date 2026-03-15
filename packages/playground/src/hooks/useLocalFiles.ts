import { useEffect, useRef, useCallback } from 'react';
import { usePlaygroundStore } from '../store';
import { LocalFileProvider } from '../providers/local-file-provider';
import type { FileWatchEvent } from './types';

interface UseLocalFilesResult {
  saveFile: (path: string, content: string) => Promise<void>;
  provider: LocalFileProvider | null;
}

export function useLocalFiles(
  serverHost: string | null,
  onFileEvent: (handler: (event: FileWatchEvent) => void) => void
): UseLocalFilesResult {
  const setFiles = usePlaygroundStore((s) => s.setFiles);
  const updateFile = usePlaygroundStore((s) => s.updateFile);
  const addFile = usePlaygroundStore((s) => s.addFile);
  const deleteFile = usePlaygroundStore((s) => s.deleteFile);

  const providerRef = useRef<LocalFileProvider | null>(null);
  const recentSavesRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!serverHost) {
      providerRef.current = null;
      return;
    }

    const provider = new LocalFileProvider(serverHost);
    providerRef.current = provider;

    const loadFiles = async (): Promise<void> => {
      try {
        const entries = await provider.listFiles();
        const prsEntries = entries.filter((e) => e.path.endsWith('.prs'));
        const files = await Promise.all(
          prsEntries.map(async (entry) => ({
            path: entry.path,
            content: await provider.readFile(entry.path),
          }))
        );
        if (files.length > 0) {
          setFiles(files);
        }
      } catch (err) {
        console.error('Failed to load files from server:', err);
      }
    };

    loadFiles();
  }, [serverHost, setFiles]);

  useEffect(() => {
    onFileEvent(async (event: FileWatchEvent) => {
      if (recentSavesRef.current.has(event.path)) {
        return;
      }

      const provider = providerRef.current;
      if (!provider) return;

      switch (event.type) {
        case 'file:changed': {
          const content = await provider.readFile(event.path);
          updateFile(event.path, content);
          break;
        }
        case 'file:created': {
          const content = await provider.readFile(event.path);
          addFile(event.path, content);
          break;
        }
        case 'file:deleted':
          deleteFile(event.path);
          break;
      }
    });
  }, [onFileEvent, updateFile, addFile, deleteFile]);

  const saveFile = useCallback(async (path: string, content: string): Promise<void> => {
    const provider = providerRef.current;
    if (!provider) return;

    recentSavesRef.current.add(path);
    setTimeout(() => recentSavesRef.current.delete(path), 1000);

    await provider.writeFile(path, content);
  }, []);

  return { saveFile, provider: providerRef.current };
}
