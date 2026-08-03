import { afterEach, describe, expect, it } from 'vitest';
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Compiler } from '../compiler.js';

const directories: string[] = [];

function environmentRootGuard(target: string, variable: string): string {
  return `if [ -z "\${${variable}:-}" ]; then printf '%s\\n' 'PromptScript ${target} hook requires non-empty ${variable}.' >&2; exit 1; fi; `;
}

function gitRootGuard(target: string): string {
  const failure = `printf '%s\\n' 'PromptScript ${target} hook requires a Git worktree project root.' >&2; exit 1`;
  return `PROMPTSCRIPT_PROJECT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)" || { ${failure}; }; case "$PROMPTSCRIPT_PROJECT_ROOT" in *[![:space:]]*) ;; *) ${failure} ;; esac; `;
}

afterEach(() => {
  for (const directory of directories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe('Hook target smoke tests', () => {
  it('compiles one portable script to every native hook contract', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'promptscript-hooks-targets-'));
    directories.push(directory);
    mkdirSync(join(directory, '.promptscript', 'scripts'), { recursive: true });
    writeFileSync(
      join(directory, '.promptscript', 'scripts', 'validate script.py'),
      'raise SystemExit(0)\n'
    );
    const entryPath = join(directory, 'project.prs');
    writeFileSync(
      entryPath,
      `@meta {
  id: "hook-target-smoke"
  syntax: "1.4.0"
}

@hooks {
  validate: {
    event: "pre-tool-use"
    matcher: "Edit|Write"
    script: {
      path: ".promptscript/scripts/validate script.py"
      interpreter: "python3"
      args: ["--strict"]
    }
    cwd: "project"
    timeoutMs: 30000
  }
}
`
    );

    const compiler = new Compiler({
      resolver: { registryPath: directory, projectRoot: directory },
      formatters: [
        { name: 'claude', config: { version: 'full' } },
        { name: 'cursor', config: { version: 'full' } },
        { name: 'codex', config: { version: 'full' } },
        { name: 'factory', config: { version: 'full' } },
        { name: 'gemini', config: { version: 'full' } },
        { name: 'github', config: { version: 'full' } },
        { name: 'grok', config: { version: 'full' } },
        { name: 'windsurf', config: { version: 'full' } },
      ],
    });

    const result = await compiler.compile(entryPath);

    expect(result.success).toBe(true);
    expect(JSON.parse(result.outputs.get('.factory/hooks.json')!.content)).toEqual({
      hooks: {
        PreToolUse: [
          {
            matcher: 'Edit|Write',
            hooks: [
              {
                type: 'command',
                command: `${environmentRootGuard('factory', 'FACTORY_PROJECT_DIR')}cd "$FACTORY_PROJECT_DIR" && python3 "$FACTORY_PROJECT_DIR"/'.promptscript/scripts/validate script.py' --strict # promptscript-generated:validate`,
                timeout: 30,
              },
            ],
          },
        ],
      },
    });
    expect(JSON.parse(result.outputs.get('.github/hooks/promptscript.json')!.content)).toEqual({
      version: 1,
      hooks: {
        preToolUse: [
          {
            type: 'command',
            bash: "python3 '.promptscript/scripts/validate script.py' --strict # promptscript-generated:validate",
            powershell:
              "& 'py' '-3' '.promptscript/scripts/validate script.py' '--strict' # promptscript-generated:validate",
            cwd: '.',
            matcher: 'Edit|Write',
            timeoutSec: 30,
          },
        ],
      },
    });
    expect(result.outputs.has('.claude/settings.json')).toBe(true);
    expect(result.outputs.has('.cursor/hooks.json')).toBe(true);
    expect(result.outputs.get('.codex/hooks.json')!.content).toContain('"PreToolUse"');
    expect(result.outputs.has('.gemini/settings.json')).toBe(true);
    expect(result.outputs.has('.grok/hooks/promptscript.json')).toBe(true);
    expect(result.outputs.has('.windsurf/hooks.json')).toBe(true);
  });

  it('compiles terminal command hooks with deterministic native coverage', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'promptscript-terminal-hooks-'));
    directories.push(directory);
    const entryPath = join(directory, 'project.prs');
    writeFileSync(
      entryPath,
      `@meta {
  id: "terminal-hook-smoke"
  syntax: "1.4.0"
}

@hooks {
  terminal-policy: {
    event: "pre-terminal-command"
    command: ["node", "check-terminal.mjs"]
    targets: {
      vscode: {}
    }
  }
}
`
    );

    const compiler = new Compiler({
      resolver: { registryPath: directory, projectRoot: directory },
      formatters: [
        { name: 'claude', config: { version: 'full' } },
        { name: 'codex', config: { version: 'full' } },
        { name: 'factory', config: { version: 'full' } },
        { name: 'github', config: { version: 'full' } },
        { name: 'windsurf', config: { version: 'full' } },
      ],
    });

    const result = await compiler.compile(entryPath);

    expect(result.success).toBe(true);

    const factory = JSON.parse(result.outputs.get('.factory/hooks.json')!.content) as {
      hooks: { PreToolUse: Array<{ matcher: string }> };
    };
    expect(factory.hooks.PreToolUse[0]!.matcher).toBe('Execute');

    const claude = JSON.parse(result.outputs.get('.claude/settings.json')!.content) as {
      hooks: { PreToolUse: Array<{ matcher: string }> };
    };
    expect(claude.hooks.PreToolUse[0]!.matcher).toBe('Bash');

    const codex = JSON.parse(result.outputs.get('.codex/hooks.json')!.content) as {
      hooks: { PreToolUse: Array<{ matcher: string }> };
    };
    expect(codex.hooks.PreToolUse[0]!.matcher).toBe('Bash');

    const windsurf = JSON.parse(result.outputs.get('.windsurf/hooks.json')!.content) as {
      hooks: Record<string, unknown>;
    };
    expect(Object.keys(windsurf.hooks)).toEqual(['pre_run_command']);

    expect(result.outputs.has('.github/hooks/promptscript.json')).toBe(false);
    const vscode = JSON.parse(
      result.outputs.get('.github/hooks/promptscript-vscode.json')!.content
    ) as {
      hooks: { PreToolUse: Array<{ matcher: string }> };
    };
    expect(vscode.hooks.PreToolUse[0]!.matcher).toBe('run_in_terminal');

    expect(result.warnings.map((warning) => warning.message)).toEqual(
      expect.arrayContaining([
        'Hook "terminal-policy" requests terminal command interception, which github cannot guarantee and will omit.',
        'Hook "terminal-policy" maps terminal command interception to vscode with best-effort coverage.',
      ])
    );
  });

  it('compiles target executable overrides to each native contract', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'promptscript-hook-overrides-'));
    directories.push(directory);
    mkdirSync(join(directory, '.promptscript', 'scripts'), { recursive: true });
    writeFileSync(
      join(directory, '.promptscript', 'scripts', 'github check.py'),
      'raise SystemExit(0)\n'
    );
    const entryPath = join(directory, 'project.prs');
    writeFileSync(
      entryPath,
      `@meta {
  id: "hook-target-overrides"
  syntax: "1.4.0"
}

@hooks {
  check: {
    event: "pre-tool-use"
    command: ["node", "base.mjs"]
    targets: {
      factory: {
        command: ["node", "factory check.mjs", "--strict mode"]
      }
      github: {
        script: {
          path: ".promptscript/scripts/github check.py"
          interpreter: "python3"
          args: ["--strict mode"]
        }
      }
      vscode: {
        command: ["node", "VS Code check.mjs", "--strict mode"]
      }
    }
  }
}
`
    );

    const compiler = new Compiler({
      resolver: { registryPath: directory, projectRoot: directory },
      formatters: [
        { name: 'factory', config: { version: 'full' } },
        { name: 'github', config: { version: 'full' } },
      ],
    });

    const result = await compiler.compile(entryPath);

    expect(result.success).toBe(true);
    expect(JSON.parse(result.outputs.get('.factory/hooks.json')!.content)).toEqual({
      hooks: {
        PreToolUse: [
          {
            matcher: '.*',
            hooks: [
              {
                type: 'command',
                command: "node 'factory check.mjs' '--strict mode' # promptscript-generated:check",
              },
            ],
          },
        ],
      },
    });
    expect(JSON.parse(result.outputs.get('.github/hooks/promptscript.json')!.content)).toEqual({
      version: 1,
      hooks: {
        preToolUse: [
          {
            type: 'command',
            bash: "python3 '.promptscript/scripts/github check.py' '--strict mode' # promptscript-generated:check",
            powershell:
              "& 'py' '-3' '.promptscript/scripts/github check.py' '--strict mode' # promptscript-generated:check",
            cwd: '.',
          },
        ],
      },
    });
    expect(
      JSON.parse(result.outputs.get('.github/hooks/promptscript-vscode.json')!.content)
    ).toEqual({
      hooks: {
        PreToolUse: [
          {
            type: 'command',
            command: "node 'VS Code check.mjs' '--strict mode' # promptscript-generated:check",
            windows: "& 'node' 'VS Code check.mjs' '--strict mode' # promptscript-generated:check",
          },
        ],
      },
    });
  });

  it('runs a repository-local script from project root when invoked from a nested directory', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'promptscript hook project '));
    directories.push(directory);
    const scriptDirectory = join(directory, '.promptscript', 'scripts');
    const nestedDirectory = join(directory, 'packages', 'app');
    mkdirSync(scriptDirectory, { recursive: true });
    mkdirSync(nestedDirectory, { recursive: true });
    const scriptPath = join(scriptDirectory, 'record-cwd.sh');
    writeFileSync(scriptPath, '#!/bin/sh\npwd > .promptscript/hook-cwd.txt\n');
    chmodSync(scriptPath, 0o755);
    const entryPath = join(directory, 'project.prs');
    writeFileSync(
      entryPath,
      `@meta {
  id: "hook-root-smoke"
  syntax: "1.4.0"
}

@hooks {
  record-cwd: {
    event: "session-start"
    script: {
      path: ".promptscript/scripts/record-cwd.sh"
      interpreter: "sh"
    }
    cwd: "project"
  }
}
`
    );
    const compiler = new Compiler({
      resolver: { registryPath: directory, projectRoot: directory },
      formatters: [{ name: 'factory', config: { version: 'full' } }],
    });
    const result = await compiler.compile(entryPath);
    const hookFile = JSON.parse(result.outputs.get('.factory/hooks.json')!.content) as {
      hooks: { SessionStart: Array<{ hooks: Array<{ command: string }> }> };
    };

    execFileSync('/bin/sh', ['-c', hookFile.hooks.SessionStart[0]!.hooks[0]!.command], {
      cwd: nestedDirectory,
      env: { ...process.env, FACTORY_PROJECT_DIR: directory },
    });

    expect(readFileSync(join(directory, '.promptscript', 'hook-cwd.txt'), 'utf-8').trim()).toBe(
      directory
    );
  });

  it('fails before script execution when an environment project root is unavailable', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'promptscript missing hook root '));
    directories.push(directory);
    const scriptDirectory = join(directory, '.promptscript', 'scripts');
    const nestedDirectory = join(directory, 'packages', 'app');
    const sentinelPath = join(directory, 'script-ran.txt');
    mkdirSync(scriptDirectory, { recursive: true });
    mkdirSync(nestedDirectory, { recursive: true });
    const scriptPath = join(scriptDirectory, 'record-run.sh');
    writeFileSync(scriptPath, `#!/bin/sh\ntouch ${JSON.stringify(sentinelPath)}\n`);
    chmodSync(scriptPath, 0o755);
    const entryPath = join(directory, 'project.prs');
    writeFileSync(
      entryPath,
      `@meta {
  id: "hook-missing-root"
  syntax: "1.4.0"
}

@hooks {
  record-run: {
    event: "session-start"
    script: {
      path: ".promptscript/scripts/record-run.sh"
      interpreter: "sh"
    }
    cwd: "project"
  }
  record-command: {
    event: "pre-tool-use"
    command: ["touch", ${JSON.stringify(sentinelPath)}]
    cwd: "project"
  }
}
`
    );
    const compiler = new Compiler({
      resolver: { registryPath: directory, projectRoot: directory },
      formatters: [{ name: 'factory', config: { version: 'full' } }],
    });
    const result = await compiler.compile(entryPath);
    const hookFile = JSON.parse(result.outputs.get('.factory/hooks.json')!.content) as {
      hooks: {
        SessionStart: Array<{ hooks: Array<{ command: string }> }>;
        PreToolUse: Array<{ hooks: Array<{ command: string }> }>;
      };
    };
    const commands = [
      hookFile.hooks.SessionStart[0]!.hooks[0]!.command,
      hookFile.hooks.PreToolUse[0]!.hooks[0]!.command,
    ];

    for (const value of [undefined, '']) {
      const env: NodeJS.ProcessEnv = { ...process.env };
      if (value === undefined) delete env['FACTORY_PROJECT_DIR'];
      else env['FACTORY_PROJECT_DIR'] = value;

      for (const command of commands) {
        const execution = spawnSync('/bin/sh', ['-c', command], {
          cwd: nestedDirectory,
          env,
          encoding: 'utf8',
        });

        expect(execution.status).toBe(1);
        expect(execution.stderr).toContain(
          'PromptScript factory hook requires non-empty FACTORY_PROJECT_DIR.'
        );
        expect(existsSync(sentinelPath)).toBe(false);
      }
    }
  });

  it('runs a Git-root script from a repository path containing spaces', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'promptscript git hook project '));
    directories.push(directory);
    execFileSync('git', ['init', '-q'], { cwd: directory });
    const scriptDirectory = join(directory, '.promptscript', 'scripts');
    const nestedDirectory = join(directory, 'packages', 'app');
    mkdirSync(scriptDirectory, { recursive: true });
    mkdirSync(nestedDirectory, { recursive: true });
    const scriptPath = join(scriptDirectory, 'record-cwd.sh');
    writeFileSync(scriptPath, '#!/bin/sh\npwd > .promptscript/hook-git-cwd.txt\n');
    chmodSync(scriptPath, 0o755);
    const entryPath = join(directory, 'project.prs');
    writeFileSync(
      entryPath,
      `@meta {
  id: "hook-git-root-smoke"
  syntax: "1.4.0"
}

@hooks {
  record-cwd: {
    event: "session-start"
    script: {
      path: ".promptscript/scripts/record-cwd.sh"
      interpreter: "sh"
    }
    cwd: "project"
  }
}
`
    );
    const compiler = new Compiler({
      resolver: { registryPath: directory, projectRoot: directory },
      formatters: [{ name: 'cursor', config: { version: 'full' } }],
    });
    const result = await compiler.compile(entryPath);
    const hookFile = JSON.parse(result.outputs.get('.cursor/hooks.json')!.content) as {
      hooks: { sessionStart: Array<{ command: string }> };
    };

    execFileSync('/bin/sh', ['-c', hookFile.hooks.sessionStart[0]!.command], {
      cwd: nestedDirectory,
    });

    expect(readFileSync(join(directory, '.promptscript', 'hook-git-cwd.txt'), 'utf8').trim()).toBe(
      realpathSync(directory)
    );
  });

  it('fails before script execution when a Git project root is unavailable', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'promptscript missing git root '));
    directories.push(directory);
    const scriptDirectory = join(directory, '.promptscript', 'scripts');
    const fakeBin = join(directory, 'fake-bin');
    const sentinelPath = join(directory, 'script-ran.txt');
    mkdirSync(scriptDirectory, { recursive: true });
    mkdirSync(fakeBin);
    const scriptPath = join(scriptDirectory, 'record-run.sh');
    writeFileSync(scriptPath, `#!/bin/sh\ntouch ${JSON.stringify(sentinelPath)}\n`);
    chmodSync(scriptPath, 0o755);
    const entryPath = join(directory, 'project.prs');
    writeFileSync(
      entryPath,
      `@meta {
  id: "hook-missing-git-root"
  syntax: "1.4.0"
}

@hooks {
  record-run: {
    event: "session-start"
    script: {
      path: ".promptscript/scripts/record-run.sh"
      interpreter: "sh"
    }
    cwd: "project"
  }
  record-command: {
    event: "pre-tool-use"
    command: ["touch", ${JSON.stringify(sentinelPath)}]
    cwd: "project"
  }
}
`
    );
    const compiler = new Compiler({
      resolver: { registryPath: directory, projectRoot: directory },
      formatters: [{ name: 'cursor', config: { version: 'full' } }],
    });
    const result = await compiler.compile(entryPath);
    const hookFile = JSON.parse(result.outputs.get('.cursor/hooks.json')!.content) as {
      hooks: {
        sessionStart: Array<{ command: string }>;
        preToolUse: Array<{ command: string }>;
      };
    };
    const commands = [
      hookFile.hooks.sessionStart[0]!.command,
      hookFile.hooks.preToolUse[0]!.command,
    ];

    for (const command of commands) {
      const missing = spawnSync('/bin/sh', ['-c', command], {
        cwd: directory,
        encoding: 'utf8',
      });
      expect(missing.status).toBe(1);
      expect(missing.stderr).toContain(
        'PromptScript cursor hook requires a Git worktree project root.'
      );
      expect(existsSync(sentinelPath)).toBe(false);
    }

    const fakeGit = join(fakeBin, 'git');
    writeFileSync(fakeGit, "#!/bin/sh\nprintf '   \\n'\n");
    chmodSync(fakeGit, 0o755);
    const blank = spawnSync('/bin/sh', ['-c', commands[0]!], {
      cwd: directory,
      env: { ...process.env, PATH: `${fakeBin}:${process.env['PATH'] ?? ''}` },
      encoding: 'utf8',
    });
    expect(blank.status).toBe(1);
    expect(blank.stderr).toContain(
      'PromptScript cursor hook requires a Git worktree project root.'
    );
    expect(existsSync(sentinelPath)).toBe(false);
  });

  it('guards project-relative commands without session cwd fallback warnings', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'promptscript-hooks-cwd-warnings-'));
    directories.push(directory);
    const entryPath = join(directory, 'project.prs');
    writeFileSync(
      entryPath,
      `@meta {
  id: "hook-cwd-warnings"
  syntax: "1.4.0"
}

@hooks {
  validate: {
    event: "post-tool-use"
    command: ["python3", ".promptscript/scripts/check file.py", "--label=hello world"]
    cwd: "project"
  }
}
`
    );
    const compiler = new Compiler({
      resolver: { registryPath: directory, projectRoot: directory },
      formatters: [
        { name: 'claude', config: { version: 'full' } },
        { name: 'cursor', config: { version: 'full' } },
        { name: 'codex', config: { version: 'full' } },
      ],
    });

    const result = await compiler.compile(entryPath);

    expect(result.success).toBe(true);
    expect(result.warnings).toEqual([]);
    const claude = JSON.parse(result.outputs.get('.claude/settings.json')!.content) as {
      hooks: { PostToolUse: Array<{ hooks: Array<{ command: string }> }> };
    };
    expect(claude.hooks.PostToolUse[0]!.hooks[0]!.command).toBe(
      `${environmentRootGuard('claude', 'CLAUDE_PROJECT_DIR')}cd "\${CLAUDE_PROJECT_DIR}" && python3 '.promptscript/scripts/check file.py' '--label=hello world' # promptscript-generated:validate`
    );
    const cursor = JSON.parse(result.outputs.get('.cursor/hooks.json')!.content) as {
      hooks: { postToolUse: Array<{ command: string }> };
    };
    expect(cursor.hooks.postToolUse[0]!.command).toBe(
      `${gitRootGuard('cursor')}cd "$PROMPTSCRIPT_PROJECT_ROOT" && python3 '.promptscript/scripts/check file.py' '--label=hello world' # promptscript-generated:validate`
    );
    expect(result.outputs.get('.codex/hooks.json')!.content).toContain(
      "python3 '.promptscript/scripts/check file.py' '--label=hello world' # promptscript-generated:validate"
    );
  });
});
