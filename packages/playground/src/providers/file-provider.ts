export interface FileListEntry {
  path: string;
  size: number;
  modified: string;
}

export interface FileProvider {
  listFiles(): Promise<FileListEntry[]>;
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  createFile(path: string, content: string): Promise<void>;
  deleteFile(path: string): Promise<void>;
  readonly isReadOnly: boolean;
}
