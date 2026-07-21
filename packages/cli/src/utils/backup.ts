import { dirname, isAbsolute, join, parse, resolve } from 'path';
import type { CliServices } from '../services.js';
import { assertSafeWritePath } from './write-plan.js';

export interface BackupResult {
  dir: string;
  files: string[];
}

export function isGitRepo(services: CliServices): boolean {
  let current = resolve(services.cwd || process.cwd());
  const root = parse(current).root;

  while (true) {
    if (services.fs.existsSync(join(current, '.git'))) {
      return true;
    }
    if (current === root) {
      return false;
    }
    current = dirname(current);
  }
}

export async function createBackup(
  filePaths: string[],
  services: CliServices
): Promise<BackupResult> {
  for (const filePath of filePaths) {
    if (
      !filePath ||
      isAbsolute(filePath) ||
      /^[A-Za-z]:/.test(filePath) ||
      filePath.split(/[\\/]/).includes('..')
    ) {
      throw new Error(`Backup path must stay inside the project: ${filePath}`);
    }
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const dir = `.prs-backup/${timestamp}`;
  const destinations = filePaths
    .filter((filePath) => services.fs.existsSync(filePath))
    .map((filePath) => ({ filePath, dest: join(dir, filePath) }));

  await assertSafeWritePath(dir, services);
  for (const { dest } of destinations) {
    await assertSafeWritePath(dest, services);
  }

  await services.fs.mkdir(dir, { recursive: true });

  const backedUp: string[] = [];
  for (const { filePath, dest } of destinations) {
    const content = services.fs.readFileSync(filePath, 'utf-8');
    await services.fs.mkdir(dirname(dest), { recursive: true });
    await services.fs.writeFile(dest, content, 'utf-8');
    backedUp.push(filePath);
  }

  return { dir, files: backedUp };
}
