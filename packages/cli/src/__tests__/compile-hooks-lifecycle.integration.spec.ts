import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { existsSync } from 'node:fs';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { compileCommand } from '../commands/compile.js';

type HookMode = 'multifile' | 'full';

interface FixtureOptions {
  mode: HookMode;
  legacySettings?: Record<string, unknown>;
  unmanagedGithubHook?: boolean;
}

interface HookFixture {
  directory: string;
  sourcePath: string;
  settingsPath: string;
  githubHookPath: string;
  vscodeHookPath: string;
  adjacentUserFile: string;
}

const HOOK_MODES = ['multifile', 'full'] as const;
const directories: string[] = [];
let consoleLog: ReturnType<typeof vi.spyOn>;

function projectSource(options: { hooks: boolean; revision?: string; vscode?: boolean }): string {
  const revision = options.revision ?? 'v1';
  const vscodeScript = options.vscode
    ? `
      vscode: {
        script: {
          path: ".promptscript/scripts/vscode check.py"
          interpreter: "python3"
          args: ["${revision}"]
        }
      }`
    : '';
  const vscodeTerminal = options.vscode
    ? `
      vscode: {
        matcher: "run_in_terminal"
        command: ["node", "vscode-terminal.mjs", "${revision}"]
      }`
    : '';
  const hooks = options.hooks
    ? `
@hooks {
  portable-check: {
    event: "pre-tool-use"
    matcher: "Edit|Write"
    script: {
      path: ".promptscript/scripts/base check.py"
      interpreter: "python3"
      args: ["${revision}"]
    }
    cwd: "project"
    targets: {
      factory: {
        matcher: "Execute"
        script: {
          path: ".promptscript/scripts/factory check.py"
          interpreter: "python3"
          args: ["${revision}"]
        }
      }
      github: {
        script: {
          path: ".promptscript/scripts/github check.py"
          interpreter: "python3"
          args: ["${revision}"]
        }
      }${vscodeScript}
    }
  }
  terminal-policy: {
    event: "pre-terminal-command"
    command: ["node", "terminal-policy.mjs", "${revision}"]
    targets: {${vscodeTerminal}
    }
  }
  delegated: {
    event: "subagent-start"
    command: ["node", "delegate.mjs", "${revision}"]
  }
  stop-filter: {
    event: "stop"
    matcher: "Agent"
    command: ["node", "stop.mjs", "${revision}"]
  }
}
`
    : '';

  return `@meta {
  id: "cross-target-hooks"
  syntax: "1.4.0"
}

@identity {
  """Cross-target hooks"""
}
${hooks}`;
}

function defaultLegacySettings(): Record<string, unknown> {
  return {
    permissions: { allow: ['Read'] },
    hooks: {
      PreToolUse: [
        {
          matcher: 'Execute',
          hooks: [{ type: 'command', command: 'audit-user-action' }],
        },
        {
          hooks: [
            {
              type: 'command',
              command: 'python3 old-check.py # promptscript-generated:portable-check',
            },
          ],
        },
      ],
    },
  };
}

function unmanagedGithubContent(): string {
  return (
    JSON.stringify(
      {
        version: 1,
        hooks: {
          preToolUse: [
            {
              type: 'command',
              bash: 'node user-check.mjs',
              powershell: "& 'node' 'user-check.mjs'",
            },
          ],
        },
      },
      null,
      2
    ) + '\n'
  );
}

async function createHookFixture(options: FixtureOptions): Promise<HookFixture> {
  const directory = await mkdtemp(join(tmpdir(), 'promptscript-hook-lifecycle-'));
  directories.push(directory);
  const promptscriptDirectory = join(directory, '.promptscript');
  const scriptsDirectory = join(promptscriptDirectory, 'scripts');
  const factoryDirectory = join(directory, '.factory');
  const githubHooksDirectory = join(directory, '.github', 'hooks');
  await mkdir(scriptsDirectory, { recursive: true });
  await mkdir(factoryDirectory, { recursive: true });
  await mkdir(githubHooksDirectory, { recursive: true });

  await writeFile(
    join(directory, 'promptscript.yaml'),
    `version: '1'
project:
  id: cross-target-hooks
targets:
  - factory:
      version: ${options.mode}
      output: FACTORY.md
  - github:
      version: ${options.mode}
includePromptScriptSkill: false
`
  );
  const sourcePath = join(promptscriptDirectory, 'project.prs');
  await writeFile(sourcePath, projectSource({ hooks: true, vscode: true }));
  for (const script of [
    'base check.py',
    'factory check.py',
    'github check.py',
    'vscode check.py',
  ]) {
    await writeFile(join(scriptsDirectory, script), 'raise SystemExit(0)\n');
  }

  const settingsPath = join(factoryDirectory, 'settings.json');
  await writeFile(
    settingsPath,
    JSON.stringify(options.legacySettings ?? defaultLegacySettings(), null, 2)
  );
  const githubHookPath = join(githubHooksDirectory, 'promptscript.json');
  if (options.unmanagedGithubHook !== false) {
    await writeFile(githubHookPath, unmanagedGithubContent());
  }
  const adjacentUserFile = join(directory, '.github', 'team.json');
  await writeFile(adjacentUserFile, '{"owner":"team"}\n');

  return {
    directory,
    sourcePath,
    settingsPath,
    githubHookPath,
    vscodeHookPath: join(githubHooksDirectory, 'promptscript-vscode.json'),
    adjacentUserFile,
  };
}

async function readJson(path: string): Promise<Record<string, unknown>> {
  return JSON.parse(await readFile(path, 'utf8')) as Record<string, unknown>;
}

function countMarker(content: string, id: string): number {
  return content.split(`# promptscript-generated:${id}`).length - 1;
}

function outputText(): string {
  const calls = consoleLog.mock.calls as unknown[][];
  return calls.flatMap((call) => call.map(String)).join('\n');
}

async function compileSuccessfully(directory: string): Promise<void> {
  process.exitCode = undefined;
  await compileCommand({ cwd: directory });
  expect(process.exitCode).toBeUndefined();
}

describe('compile cross-target hook lifecycle', () => {
  beforeEach(() => {
    process.exitCode = undefined;
    consoleLog = vi.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    process.exitCode = undefined;
    for (const directory of directories.splice(0)) {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it.each(HOOK_MODES)('merges, updates, gates, and removes hooks in %s mode', async (mode) => {
    const fixture = await createHookFixture({ mode });

    await compileSuccessfully(fixture.directory);

    expect(await readJson(fixture.settingsPath)).toEqual({
      permissions: { allow: ['Read'] },
    });
    const factoryPath = join(fixture.directory, '.factory', 'hooks.json');
    const firstFactory = await readFile(factoryPath, 'utf8');
    const parsedFactory = JSON.parse(firstFactory) as {
      hooks: Record<string, Array<{ matcher?: string; hooks: Array<{ command: string }> }>>;
    };
    const portableFactoryEntry = parsedFactory.hooks['PreToolUse']!.find((entry) =>
      entry.hooks.some((hook) => hook.command.endsWith('# promptscript-generated:portable-check'))
    );
    expect(portableFactoryEntry?.matcher).toBe('Execute');
    expect(parsedFactory.hooks).not.toHaveProperty('SubagentStart');
    expect(firstFactory).toContain('audit-user-action');
    expect(firstFactory).toContain('factory check.py');
    expect(firstFactory).toContain('terminal-policy.mjs');
    expect(countMarker(firstFactory, 'portable-check')).toBe(1);

    const firstGithub = await readFile(fixture.githubHookPath, 'utf8');
    const parsedGithub = JSON.parse(firstGithub) as {
      hooks: { agentStop: Array<Record<string, unknown>> };
    };
    expect(parsedGithub.hooks.agentStop[0]).not.toHaveProperty('matcher');
    expect(firstGithub).toContain('node user-check.mjs');
    expect(firstGithub).toContain('github check.py');
    expect(firstGithub).not.toContain('terminal-policy.mjs');
    expect(countMarker(firstGithub, 'portable-check')).toBe(2);
    expect(countMarker(firstGithub, 'delegated')).toBe(2);
    expect(countMarker(firstGithub, 'stop-filter')).toBe(2);

    const firstVscode = await readFile(fixture.vscodeHookPath, 'utf8');
    expect(firstVscode).toContain('vscode check.py');
    expect(firstVscode).toContain('run_in_terminal');
    expect(firstVscode).toContain('vscode-terminal.mjs');
    expect(firstVscode).toContain('"cwd": "."');

    const warnings = outputText();
    for (const warning of [
      'Hook "delegated" uses event "subagent-start", which factory cannot represent and will omit.',
      'Hook "terminal-policy" requests terminal command interception, which github cannot guarantee and will omit.',
      'Hook "terminal-policy" maps terminal command interception to vscode with best-effort coverage.',
      'Hook "stop-filter" uses matcher with "stop", which GitHub ignores.',
      'Hook "portable-check" uses matcher, which VS Code currently parses but ignores.',
      'Hook "portable-check" relies on github native cwd, so PromptScript cannot independently guarantee project-root execution.',
      'Hook "portable-check" relies on vscode workspace cwd, so PromptScript cannot independently guarantee project-root execution.',
    ]) {
      expect(warnings).toContain(`PS4002: ${warning}`);
    }

    await compileSuccessfully(fixture.directory);

    const repeatedFactory = await readFile(factoryPath, 'utf8');
    const repeatedGithub = await readFile(fixture.githubHookPath, 'utf8');
    const repeatedVscode = await readFile(fixture.vscodeHookPath, 'utf8');
    expect(countMarker(repeatedFactory, 'portable-check')).toBe(1);
    expect(repeatedFactory.split('audit-user-action')).toHaveLength(2);
    expect(countMarker(repeatedGithub, 'portable-check')).toBe(2);
    expect(repeatedGithub.split('node user-check.mjs')).toHaveLength(2);
    expect(countMarker(repeatedVscode, 'portable-check')).toBe(2);

    await writeFile(
      fixture.sourcePath,
      projectSource({ hooks: true, revision: 'v2', vscode: true })
    );
    await compileSuccessfully(fixture.directory);

    const updatedFactory = await readFile(factoryPath, 'utf8');
    const updatedGithub = await readFile(fixture.githubHookPath, 'utf8');
    const updatedVscode = await readFile(fixture.vscodeHookPath, 'utf8');
    for (const content of [updatedFactory, updatedGithub, updatedVscode]) {
      expect(content).toContain('v2');
      expect(content).not.toContain('v1');
    }
    expect(countMarker(updatedFactory, 'portable-check')).toBe(1);
    expect(countMarker(updatedGithub, 'portable-check')).toBe(2);
    expect(countMarker(updatedVscode, 'portable-check')).toBe(2);
    expect(updatedFactory).toContain('audit-user-action');
    expect(updatedGithub).toContain('node user-check.mjs');

    await writeFile(
      fixture.sourcePath,
      projectSource({ hooks: true, revision: 'v2', vscode: false })
    );
    await compileSuccessfully(fixture.directory);

    expect(existsSync(fixture.vscodeHookPath)).toBe(false);
    expect(existsSync(fixture.githubHookPath)).toBe(true);

    await writeFile(fixture.sourcePath, projectSource({ hooks: false }));
    await compileSuccessfully(fixture.directory);

    const remainingFactory = await readFile(factoryPath, 'utf8');
    const remainingGithub = await readFile(fixture.githubHookPath, 'utf8');
    expect(remainingFactory).toContain('audit-user-action');
    expect(remainingFactory).not.toContain('# promptscript-generated:');
    expect(remainingGithub).toContain('node user-check.mjs');
    expect(remainingGithub).not.toContain('# promptscript-generated:');
    expect(existsSync(fixture.adjacentUserFile)).toBe(true);
  });

  it.each(HOOK_MODES)('prunes an empty managed hooks directory in %s mode', async (mode) => {
    const fixture = await createHookFixture({
      mode,
      legacySettings: { permissions: { allow: ['Read'] } },
      unmanagedGithubHook: false,
    });

    await compileSuccessfully(fixture.directory);
    expect(existsSync(fixture.githubHookPath)).toBe(true);
    expect(existsSync(fixture.vscodeHookPath)).toBe(true);

    await writeFile(fixture.sourcePath, projectSource({ hooks: false }));
    await compileSuccessfully(fixture.directory);

    expect(existsSync(join(fixture.directory, '.github', 'hooks'))).toBe(false);
    expect(existsSync(join(fixture.directory, '.factory', 'hooks.json'))).toBe(false);
    expect(existsSync(fixture.adjacentUserFile)).toBe(true);
  });

  it.each(HOOK_MODES)(
    'refuses ambiguous legacy migration before cross-target writes in %s mode',
    async (mode) => {
      const legacySettings = {
        permissions: { allow: ['Read'] },
        hooks: {
          UnknownEvent: [{ hooks: [{ type: 'command', command: 'audit-user-action' }] }],
        },
      };
      const fixture = await createHookFixture({ mode, legacySettings });
      const settingsBefore = await readFile(fixture.settingsPath, 'utf8');
      const githubBefore = await readFile(fixture.githubHookPath, 'utf8');

      await compileCommand({ cwd: fixture.directory });

      expect(process.exitCode).toBe(1);
      expect(existsSync(join(fixture.directory, '.factory', 'hooks.json'))).toBe(false);
      expect(existsSync(fixture.vscodeHookPath)).toBe(false);
      expect(existsSync(join(fixture.directory, 'FACTORY.md'))).toBe(false);
      expect(existsSync(join(fixture.directory, '.github', 'copilot-instructions.md'))).toBe(false);
      expect(existsSync(join(fixture.directory, 'AGENTS.md'))).toBe(false);
      expect(await readFile(fixture.settingsPath, 'utf8')).toBe(settingsBefore);
      expect(await readFile(fixture.githubHookPath, 'utf8')).toBe(githubBefore);
    }
  );
});
