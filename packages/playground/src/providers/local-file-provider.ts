import type { FileProvider, FileListEntry } from './file-provider';

export class LocalFileProvider implements FileProvider {
  private baseUrl: string;
  readonly isReadOnly: boolean;

  constructor(serverHost: string, readOnly: boolean = false) {
    const protocol = serverHost.endsWith(':443') ? 'https' : 'http';
    this.baseUrl = `${protocol}://${serverHost}`;
    this.isReadOnly = readOnly;
  }

  async listFiles(): Promise<FileListEntry[]> {
    const res = await fetch(`${this.baseUrl}/api/files`);
    if (!res.ok) throw new Error(`Failed to list files: ${res.statusText}`);
    const data = (await res.json()) as { files: FileListEntry[] };
    return data.files;
  }

  async readFile(path: string): Promise<string> {
    const res = await fetch(`${this.baseUrl}/api/files/${path}`);
    if (!res.ok) throw new Error(`Failed to read file: ${res.statusText}`);
    const data = (await res.json()) as { content: string };
    return data.content;
  }

  async writeFile(path: string, content: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/api/files/${path}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    if (!res.ok) throw new Error(`Failed to write file: ${res.statusText}`);
  }

  async createFile(path: string, content: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/api/files/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    if (!res.ok) throw new Error(`Failed to create file: ${res.statusText}`);
  }

  async deleteFile(path: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/api/files/${path}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error(`Failed to delete file: ${res.statusText}`);
  }

  async fetchConfig(): Promise<ProjectConfig | null> {
    try {
      const res = await fetch(`${this.baseUrl}/api/config`);
      if (!res.ok) return null;
      const data = (await res.json()) as { project: ProjectConfig | null };
      return data.project ?? null;
    } catch {
      return null;
    }
  }

  get serverUrl(): string {
    return this.baseUrl;
  }
}

export interface ProjectTargetConfig {
  enabled?: boolean;
  version?: string;
  convention?: string;
}

export interface ProjectConfig {
  targets?: (string | Record<string, ProjectTargetConfig | undefined>)[];
  formatting?: {
    tabWidth?: number;
    proseWrap?: string;
    printWidth?: number;
  };
}
