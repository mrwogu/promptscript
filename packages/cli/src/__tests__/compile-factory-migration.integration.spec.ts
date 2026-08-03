import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { existsSync } from 'node:fs';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { compileCommand } from '../commands/compile.js';

const directories: string[] = [];

async function createProject(settingsContent: string): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'promptscript-factory-migration-'));
  directories.push(directory);
  await mkdir(join(directory, '.promptscript'), { recursive: true });
  await mkdir(join(directory, '.factory'), { recursive: true });
  await writeFile(
    join(directory, 'promptscript.yaml'),
    `version: '1'
project:
  id: factory-migration
targets:
  - factory:
      version: full
`
  );
  await writeFile(
    join(directory, '.promptscript', 'project.prs'),
    `@meta {
  id: "factory-migration"
  syntax: "1.4.0"
}

@identity {
  name: "Factory migration"
}

@hooks {
  check: {
    event: "pre-tool-use"
    command: ["node", "check.mjs"]
  }
}
`
  );
  await writeFile(join(directory, '.factory', 'settings.json'), settingsContent);
  return directory;
}

function legacySettings(): Record<string, unknown> {
  return {
    permissions: { allow: ['Read'] },
    hooks: {
      PreToolUse: [
        {
          matcher: 'Execute',
          hooks: [{ type: 'command', command: 'audit' }],
        },
        {
          hooks: [
            {
              type: 'command',
              command: 'node check.mjs # promptscript-generated:check',
            },
          ],
        },
      ],
    },
  };
}

describe('compile Factory hook migration', () => {
  beforeEach(() => {
    process.exitCode = undefined;
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    process.exitCode = undefined;
    for (const directory of directories.splice(0)) {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it('migrates user hooks, preserves settings, deduplicates owned hooks, and reruns safely', async () => {
    const directory = await createProject(JSON.stringify(legacySettings(), null, 2));

    await compileCommand({ cwd: directory });

    expect(process.exitCode).toBeUndefined();
    expect(
      JSON.parse(await readFile(join(directory, '.factory', 'settings.json'), 'utf-8'))
    ).toEqual({
      permissions: { allow: ['Read'] },
    });
    const firstCanonical = await readFile(join(directory, '.factory', 'hooks.json'), 'utf-8');
    const parsed = JSON.parse(firstCanonical) as {
      hooks: { PreToolUse: Array<{ hooks: Array<{ command: string }> }> };
    };
    expect(
      parsed.hooks.PreToolUse.flatMap((entry) => entry.hooks).filter(
        (handler) => handler.command === 'audit'
      )
    ).toHaveLength(1);
    expect(
      parsed.hooks.PreToolUse.flatMap((entry) => entry.hooks).filter((handler) =>
        handler.command.endsWith('# promptscript-generated:check')
      )
    ).toHaveLength(1);

    await compileCommand({ cwd: directory });

    const secondCanonical = JSON.parse(
      await readFile(join(directory, '.factory', 'hooks.json'), 'utf-8')
    ) as typeof parsed;
    expect(
      secondCanonical.hooks.PreToolUse.flatMap((entry) => entry.hooks).filter(
        (handler) => handler.command === 'audit'
      )
    ).toHaveLength(1);
  });

  it('does not partially write when a legacy event is ambiguous', async () => {
    const settings = {
      hooks: {
        UnknownEvent: [{ hooks: [{ type: 'command', command: 'audit' }] }],
      },
    };
    const content = JSON.stringify(settings, null, 2);
    const directory = await createProject(content);

    await compileCommand({ cwd: directory });

    expect(process.exitCode).toBe(1);
    expect(existsSync(join(directory, '.factory', 'hooks.json'))).toBe(false);
    expect(await readFile(join(directory, '.factory', 'settings.json'), 'utf-8')).toBe(content);
  });

  it('does not partially write malformed legacy settings', async () => {
    const directory = await createProject('{');

    await compileCommand({ cwd: directory });

    expect(process.exitCode).toBe(1);
    expect(existsSync(join(directory, '.factory', 'hooks.json'))).toBe(false);
    expect(await readFile(join(directory, '.factory', 'settings.json'), 'utf-8')).toBe('{');
  });

  it('keeps warning-only behavior when migration is disabled', async () => {
    const content = JSON.stringify(legacySettings(), null, 2);
    const directory = await createProject(content);

    await compileCommand({ cwd: directory, migrateFactoryHooks: false });

    expect(process.exitCode).toBeUndefined();
    expect(await readFile(join(directory, '.factory', 'settings.json'), 'utf-8')).toBe(content);
  });
});
