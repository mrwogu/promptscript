export interface ServerOptions {
  /** Port to listen on */
  port: number;
  /** Host to bind to */
  host: string;
  /** Workspace root directory */
  workspace: string;
  /** Read-only mode */
  readOnly: boolean;
  /** Allowed CORS origin */
  corsOrigin: string;
}

export interface ServerConfig {
  mode: 'readwrite' | 'readonly';
  workspace: string;
}

export interface FileEntry {
  path: string;
  size: number;
  modified: string;
}

export interface FileContent {
  path: string;
  content: string;
}
