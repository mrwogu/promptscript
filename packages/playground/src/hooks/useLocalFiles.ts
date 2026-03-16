import { useEffect, useRef, useCallback } from 'react';
import { usePlaygroundStore, type FormatterName, type PlaygroundConfig } from '../store';
import { LocalFileProvider, type ProjectConfig } from '../providers/local-file-provider';
import type { FileWatchEvent } from './types';

/**
 * Map project config targets to playground config.
 * Enables only the targets listed in promptscript.yaml, with their settings.
 */
export function applyProjectConfig(
  current: PlaygroundConfig,
  projectConfig: ProjectConfig
): PlaygroundConfig {
  const config = { ...current };

  if (projectConfig.targets && projectConfig.targets.length > 0) {
    // Start with all targets disabled
    const targets = { ...config.targets };
    for (const key of Object.keys(targets) as FormatterName[]) {
      targets[key] = { ...targets[key], enabled: false };
    }

    // Enable targets from config
    for (const entry of projectConfig.targets) {
      if (typeof entry === 'string') {
        const name = entry as FormatterName;
        if (targets[name]) {
          targets[name] = { ...targets[name], enabled: true };
        }
      } else {
        for (const [name, settings] of Object.entries(entry)) {
          const key = name as FormatterName;
          if (targets[key]) {
            targets[key] = {
              ...targets[key],
              enabled: true,
              ...(settings?.version && { version: settings.version }),
              ...(settings?.convention && {
                convention: settings.convention as 'markdown' | 'xml',
              }),
            };
          }
        }
      }
    }

    config.targets = targets;
  }

  if (projectConfig.formatting) {
    config.formatting = {
      ...config.formatting,
      ...(projectConfig.formatting.tabWidth != null && {
        tabWidth: projectConfig.formatting.tabWidth as 2 | 4,
      }),
      ...(projectConfig.formatting.proseWrap != null && {
        proseWrap: projectConfig.formatting.proseWrap as 'always' | 'never' | 'preserve',
      }),
      ...(projectConfig.formatting.printWidth != null && {
        printWidth: projectConfig.formatting.printWidth,
      }),
    };
  }

  return config;
}

interface UseLocalFilesResult {
  saveFile: (path: string, content: string) => Promise<void>;
  provider: LocalFileProvider | null;
}

export function useLocalFiles(
  serverHost: string | null,
  onFileEvent: (handler: (event: FileWatchEvent) => void) => void
): UseLocalFilesResult {
  const setFiles = usePlaygroundStore((s) => s.setFiles);
  const setConfig = usePlaygroundStore((s) => s.setConfig);
  const setActiveFormatter = usePlaygroundStore((s) => s.setActiveFormatter);
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

    const loadConfig = async (): Promise<void> => {
      try {
        const projectConfig = await provider.fetchConfig();
        if (projectConfig) {
          const currentConfig = usePlaygroundStore.getState().config;
          const newConfig = applyProjectConfig(currentConfig, projectConfig);
          setConfig(newConfig);

          // Set active formatter to first enabled target
          const firstEnabled = (
            Object.entries(newConfig.targets) as [FormatterName, { enabled: boolean }][]
          ).find(([, s]) => s.enabled);
          if (firstEnabled) {
            setActiveFormatter(firstEnabled[0]);
          }
        }
      } catch (err) {
        console.error('Failed to load config from server:', err);
      }
    };

    loadFiles();
    loadConfig();
  }, [serverHost, setFiles, setConfig, setActiveFormatter]);

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
