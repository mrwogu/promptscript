import { basename } from 'path';
import type { CliServices } from '../services.js';

export interface BackupResult {
  dir: string;
  files: string[];
}

export function isGitRepo(services: CliServices): boolean {
  return services.fs.existsSync('.git');
}

export async function createBackup(
  filePaths: string[],
  services: CliServices
): Promise<BackupResult> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const dir = `.prs-backup/${timestamp}`;

  await services.fs.mkdir(dir, { recursive: true });

  const backedUp: string[] = [];
  for (const filePath of filePaths) {
    if (!services.fs.existsSync(filePath)) continue;

    const content = services.fs.readFileSync(filePath, 'utf-8');
    const dest = `${dir}/${basename(filePath)}`;
    await services.fs.writeFile(dest, content, 'utf-8');
    backedUp.push(filePath);
  }

  return { dir, files: backedUp };
}
