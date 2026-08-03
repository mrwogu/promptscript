import { afterEach, describe, expect, it } from 'vitest';
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Compiler } from '../compiler.js';

const directories: string[] = [];

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
                command:
                  'cd "$FACTORY_PROJECT_DIR" && python3 "$FACTORY_PROJECT_DIR"/\'.promptscript/scripts/validate script.py\' --strict # promptscript-generated:validate',
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

  it('reports targets that cannot guarantee project-root execution', async () => {
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
    expect(result.warnings.map((warning) => warning.message)).toEqual(
      expect.arrayContaining([
        'Hook "validate" requests cwd "project", which cursor cannot guarantee and will ignore.',
        'Hook "validate" requests cwd "project", which codex cannot guarantee and will ignore.',
      ])
    );
    const claude = JSON.parse(result.outputs.get('.claude/settings.json')!.content) as {
      hooks: { PostToolUse: Array<{ hooks: Array<{ command: string }> }> };
    };
    expect(claude.hooks.PostToolUse[0]!.hooks[0]!.command).toBe(
      "cd \"${CLAUDE_PROJECT_DIR}\" && python3 '.promptscript/scripts/check file.py' '--label=hello world' # promptscript-generated:validate"
    );
    const cursor = JSON.parse(result.outputs.get('.cursor/hooks.json')!.content) as {
      hooks: { postToolUse: Array<{ command: string }> };
    };
    expect(cursor.hooks.postToolUse[0]!.command).toBe(
      "python3 '.promptscript/scripts/check file.py' '--label=hello world' # promptscript-generated:validate"
    );
    expect(result.outputs.get('.codex/hooks.json')!.content).toContain(
      "python3 '.promptscript/scripts/check file.py' '--label=hello world' # promptscript-generated:validate"
    );
  });
});
