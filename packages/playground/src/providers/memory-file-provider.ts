import type { FileProvider, FileListEntry } from './file-provider';
import { usePlaygroundStore } from '../store';

export class MemoryFileProvider implements FileProvider {
  readonly isReadOnly = false;

  async listFiles(): Promise<FileListEntry[]> {
    const files = usePlaygroundStore.getState().files;
    return files.map((f) => ({
      path: f.path,
      size: f.content.length,
      modified: new Date().toISOString(),
    }));
  }

  async readFile(path: string): Promise<string> {
    const file = usePlaygroundStore.getState().files.find((f) => f.path === path);
    if (!file) throw new Error(`File not found: ${path}`);
    return file.content;
  }

  async writeFile(path: string, content: string): Promise<void> {
    usePlaygroundStore.getState().updateFile(path, content);
  }

  async createFile(path: string, content: string): Promise<void> {
    usePlaygroundStore.getState().addFile(path, content);
  }

  async deleteFile(path: string): Promise<void> {
    usePlaygroundStore.getState().deleteFile(path);
  }
}
