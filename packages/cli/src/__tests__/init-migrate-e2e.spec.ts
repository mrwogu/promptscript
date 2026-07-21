import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdtemp, mkdir, readFile, readdir, rm, symlink, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { parse as parseYaml } from 'yaml';
import { initCommand } from '../commands/init.js';
import { migrateCommand } from '../commands/migrate.js';

vi.mock('ora', () => ({
  default: vi.fn().mockReturnValue({
    start: vi.fn().mockReturnThis(),
    succeed: vi.fn().mockReturnThis(),
  }),
}));

describe('init and migrate filesystem contract', () => {
  const originalCwd = process.cwd();
  let projectDir: string;
  let outsideDir: string | undefined;

  beforeEach(async () => {
    process.exitCode = undefined;
    outsideDir = undefined;
    projectDir = await mkdtemp(join(tmpdir(), 'promptscript-init-migrate-'));
    process.chdir(projectDir);
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await rm(projectDir, { recursive: true, force: true });
    if (outsideDir) {
      await rm(outsideDir, { recursive: true, force: true });
    }
  });

  it('creates clean YAML only for explicit targets', async () => {
    await initCommand({
      yes: true,
      targets: ['claude'],
      hooks: false,
    });

    const yaml = await readFile('promptscript.yaml', 'utf-8');
    const config = parseYaml(yaml) as { targets: string[] };
    expect(yaml).not.toContain('#');
    expect(config.targets).toEqual(['claude']);
    expect(existsSync('.github')).toBe(false);
    expect(existsSync('.claude/skills/promptscript/SKILL.md')).toBe(true);
  });

  it('changes nothing when migrate finds no candidates', async () => {
    await mkdir('.promptscript', { recursive: true });
    const config = 'id: preserved\nsyntax: "1.4.0"\ntargets:\n  - factory\n';
    const project = '@meta { id: "preserved" syntax: "1.4.0" }\n';
    await writeFile('promptscript.yaml', config);
    await writeFile('.promptscript/project.prs', project);

    await migrateCommand({ static: true });

    expect(await readFile('promptscript.yaml', 'utf-8')).toBe(config);
    expect(await readFile('.promptscript/project.prs', 'utf-8')).toBe(project);
  });

  it('preserves config and composes static migration under migrated directory', async () => {
    await mkdir('.promptscript', { recursive: true });
    const config = 'id: preserved\nsyntax: "1.4.0"\ntargets:\n  - factory\ncustom: keep-me\n';
    await writeFile('promptscript.yaml', config);
    await writeFile('.promptscript/project.prs', '@meta { id: "preserved" syntax: "1.4.0" }\n');
    await writeFile('AGENTS.md', '# Existing instructions\n\nUse strict TypeScript.\n');

    await migrateCommand({ static: true });

    expect(await readFile('promptscript.yaml', 'utf-8')).toBe(config);
    expect(await readFile('.promptscript/project.prs', 'utf-8')).toContain(
      '@use ./migrated/project'
    );
    expect(existsSync('.promptscript/migrated/project.prs')).toBe(true);
    expect(existsSync('.promptscript/migrated/context.prs')).toBe(true);
  });

  it('is idempotent across repeated static migration', async () => {
    await mkdir('.promptscript', { recursive: true });
    await writeFile('promptscript.yaml', 'id: preserved\nsyntax: "1.4.0"\ntargets:\n  - factory\n');
    await writeFile('.promptscript/project.prs', '@meta { id: "preserved" syntax: "1.4.0" }\n');
    await writeFile('AGENTS.md', '# Existing instructions\n\nUse strict TypeScript.\n');

    await migrateCommand({ static: true });
    const first = await readFile('.promptscript/project.prs', 'utf-8');
    await migrateCommand({ static: true });

    expect(await readFile('.promptscript/project.prs', 'utf-8')).toBe(first);
    expect(first.match(/@use \.\/migrated\/project/g)).toHaveLength(1);

    const firstMigrated = await readFile('.promptscript/migrated/context.prs', 'utf-8');
    await writeFile('AGENTS.md', '# Updated instructions\n\nRequire integration tests.\n');
    await migrateCommand({ static: true });

    expect(await readFile('.promptscript/project.prs', 'utf-8')).toBe(first);
    expect(await readFile('.promptscript/migrated/context.prs', 'utf-8')).not.toBe(firstMigrated);
  });

  it('keeps a stable composition when the configured entry starts missing', async () => {
    await mkdir('.promptscript', { recursive: true });
    await writeFile('promptscript.yaml', 'id: preserved\nsyntax: "1.4.0"\ntargets:\n  - factory\n');
    await writeFile('AGENTS.md', '# Existing instructions\n\nUse strict TypeScript.\n');

    await migrateCommand({ static: true });
    const firstEntry = await readFile('.promptscript/project.prs', 'utf-8');
    const firstMigrated = await readFile('.promptscript/migrated/project.prs', 'utf-8');

    await migrateCommand({ static: true });

    expect(await readFile('.promptscript/project.prs', 'utf-8')).toBe(firstEntry);
    expect(await readFile('.promptscript/migrated/project.prs', 'utf-8')).toBe(firstMigrated);
    expect(firstEntry.match(/@use \.\/migrated\/project/g)).toHaveLength(1);
    expect(firstEntry).not.toContain('@use ./context');
  });

  it('rejects a backup directory symlink that escapes the project', async () => {
    await mkdir('.promptscript', { recursive: true });
    await writeFile('promptscript.yaml', 'id: preserved\nsyntax: "1.4.0"\ntargets:\n  - factory\n');
    await writeFile('.promptscript/project.prs', '@meta { id: "preserved" syntax: "1.4.0" }\n');
    await writeFile('AGENTS.md', '# Existing instructions\n\nUse strict TypeScript.\n');
    outsideDir = await mkdtemp(join(tmpdir(), 'promptscript-backup-outside-'));
    await symlink(outsideDir, '.prs-backup', 'dir');

    await migrateCommand({ static: true, backup: true });

    expect(process.exitCode).toBe(1);
    expect(await readdir(outsideDir)).toEqual([]);
    expect(existsSync('.promptscript/migrated')).toBe(false);
  });
});
