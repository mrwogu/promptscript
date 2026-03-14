export interface FileWatchEvent {
  type: 'file:changed' | 'file:created' | 'file:deleted';
  path: string;
}
