import { describe, it, expect } from 'vitest';
import {
  extractHooks,
  generateClaudeHooks,
  generateCodexHooks,
  generateCursorHooks,
  generateFactoryHooks,
  generateGeminiHooks,
  generateGitHubHooks,
  generateGrokHooks,
  generateVSCodeHooks,
  generateWindsurfHooks,
  getHookCompatibilityWarnings,
  mapEvent,
  convertTimeout,
} from '../hook-adapters.js';
import { HOOK_CAPABILITIES, type Value } from '@promptscript/core';

function makeLoc() {
  return { file: 'test.prs', line: 1, column: 0 };
}

function makeHooksBlock(hooks: Record<string, Record<string, Value>>) {
  return {
    content: {
      type: 'ObjectContent',
      properties: hooks,
      loc: makeLoc(),
    },
  };
}

describe('hook-adapters', () => {
  describe('extractHooks', () => {
    it('should extract a valid hook definition', () => {
      const block = makeHooksBlock({
        'protect-generated': {
          event: 'pre-tool-use',
          matcher: 'Edit|Write',
          command: ['prs', 'hook', 'pre-edit'],
          cwd: 'project',
          timeoutMs: 5000,
          statusMessage: 'Checking generated files',
          continueOnFailure: false,
          enabled: true,
          targets: {
            vscode: {
              matcher: 'run_in_terminal',
              enabled: false,
            },
          },
        },
      });
      const hooks = extractHooks(block);
      expect(hooks).toHaveLength(1);
      expect(hooks[0]!.id).toBe('protect-generated');
      expect(hooks[0]!.event).toBe('pre-tool-use');
      expect(hooks[0]!.matcher).toBe('Edit|Write');
      expect(hooks[0]!.command).toEqual(['prs', 'hook', 'pre-edit']);
      expect(hooks[0]!.cwd).toBe('project');
      expect(hooks[0]!.timeoutMs).toBe(5000);
      expect(hooks[0]!.statusMessage).toBe('Checking generated files');
      expect(hooks[0]!.continueOnFailure).toBe(false);
      expect(hooks[0]!.enabled).toBe(true);
      expect(hooks[0]!.targets?.vscode).toEqual({
        matcher: 'run_in_terminal',
        enabled: false,
      });
    });

    it('should skip entries without event', () => {
      const block = makeHooksBlock({
        bad: { command: ['prs', 'hook'] },
      });
      expect(extractHooks(block)).toHaveLength(0);
    });

    it('should skip entries without command', () => {
      const block = makeHooksBlock({
        bad: { event: 'pre-tool-use' },
      });
      expect(extractHooks(block)).toHaveLength(0);
    });

    it('should extract a portable script definition', () => {
      const hooks = extractHooks(
        makeHooksBlock({
          check: {
            event: 'post-tool-use',
            script: {
              path: '.promptscript/scripts/check file.py',
              interpreter: 'python3',
              args: ['--strict'],
            },
          },
        })
      );

      expect(hooks[0]!.script).toEqual({
        path: '.promptscript/scripts/check file.py',
        interpreter: 'python3',
        args: ['--strict'],
      });
      expect(hooks[0]!.command).toBeUndefined();
    });

    it('should return empty for non-object content', () => {
      const block = { content: { type: 'TextContent' } };
      expect(extractHooks(block as never)).toHaveLength(0);
    });

    it('should skip entries with an empty command array', () => {
      const block = makeHooksBlock({
        empty: { event: 'pre-tool-use', command: [] },
        valid: { event: 'pre-tool-use', command: ['prs', 'hook', 'pre-edit'] },
      });
      const hooks = extractHooks(block);
      expect(hooks).toHaveLength(1);
      expect(hooks[0]!.id).toBe('valid');
    });

    it('should skip entries whose command filters down to no string arguments', () => {
      const block = makeHooksBlock({
        'non-strings': { event: 'pre-tool-use', command: [1, null] as unknown as Value },
      });
      expect(extractHooks(block)).toHaveLength(0);
    });
  });

  describe('mapEvent', () => {
    it('should map pre-tool-use to Claude PreToolUse', () => {
      expect(mapEvent('pre-tool-use', 'claude')).toBe('PreToolUse');
    });

    it('should map post-tool-use to Claude PostToolUse', () => {
      expect(mapEvent('post-tool-use', 'claude')).toBe('PostToolUse');
    });

    it('should map session-start to Claude SessionStart', () => {
      expect(mapEvent('session-start', 'claude')).toBe('SessionStart');
    });

    it('should map setup to Claude Setup', () => {
      expect(mapEvent('setup', 'claude')).toBe('Setup');
    });

    it('should map pre-tool-use to Codex PreToolUse', () => {
      expect(mapEvent('pre-tool-use', 'codex')).toBe('PreToolUse');
    });

    it('should map pre-tool-use to Cursor preToolUse', () => {
      expect(mapEvent('pre-tool-use', 'cursor')).toBe('preToolUse');
    });

    it('should map post-tool-use to Factory PostToolUse', () => {
      expect(mapEvent('post-tool-use', 'factory')).toBe('PostToolUse');
    });

    it('should reject unsupported Factory subagent-start', () => {
      expect(mapEvent('subagent-start', 'factory')).toBeNull();
    });

    it('should map stop to GitHub agentStop', () => {
      expect(mapEvent('stop', 'github')).toBe('agentStop');
    });

    it('should map pre-tool-use to VS Code PreToolUse', () => {
      expect(mapEvent('pre-tool-use', 'vscode')).toBe('PreToolUse');
    });
  });

  describe('convertTimeout', () => {
    it('should convert ms to seconds for Claude', () => {
      expect(convertTimeout(5000, 'claude')).toBe(5);
    });

    it('should convert ms to seconds for Cursor', () => {
      expect(convertTimeout(15000, 'cursor')).toBe(15);
    });

    it('should convert ms to seconds for Codex', () => {
      expect(convertTimeout(5000, 'codex')).toBe(5);
    });

    it('should convert ms to seconds for Factory', () => {
      expect(convertTimeout(15000, 'factory')).toBe(15);
    });

    it('should round sub-second timeouts up to one second', () => {
      expect(convertTimeout(100, 'factory')).toBe(1);
      expect(convertTimeout(100, 'github')).toBe(1);
    });

    it('should convert milliseconds to seconds for VS Code', () => {
      expect(convertTimeout(15000, 'vscode')).toBe(15);
    });
  });

  describe('generateClaudeHooks', () => {
    it('should generate PreToolUse hook entry', () => {
      const hooks = extractHooks(
        makeHooksBlock({
          protect: {
            event: 'pre-tool-use',
            matcher: 'Edit|Write',
            command: ['prs', 'hook', 'pre-edit'],
            timeoutMs: 5000,
          },
        })
      );
      const result = generateClaudeHooks(hooks);
      expect(result['PreToolUse']).toBeDefined();
      expect(result['PreToolUse']).toHaveLength(1);
    });

    it('should skip disabled hooks', () => {
      const hooks = extractHooks(
        makeHooksBlock({
          disabled: {
            event: 'pre-tool-use',
            command: ['prs', 'hook'],
            enabled: false,
          },
        })
      );
      const result = generateClaudeHooks(hooks);
      expect(Object.keys(result)).toHaveLength(0);
    });

    it('should preserve command argument boundaries', () => {
      const hooks = extractHooks(
        makeHooksBlock({
          test: {
            event: 'pre-tool-use',
            command: ['python3', 'scripts/check file.py', '--label=hello world'],
          },
        })
      );
      const result = generateClaudeHooks(hooks);
      const preToolUse = result['PreToolUse'] as unknown[] | undefined;
      expect(preToolUse).toBeDefined();
      const entry = preToolUse![0] as Record<string, unknown>;
      const hookArr = entry['hooks'] as Record<string, unknown>[];
      expect(hookArr[0]!['command']).toBe(
        "python3 'scripts/check file.py' '--label=hello world' # promptscript-generated:test"
      );
    });

    it('should execute project-relative hooks from the Claude project root', () => {
      const hooks = extractHooks(
        makeHooksBlock({
          test: {
            event: 'pre-tool-use',
            command: ['python3', '.promptscript/scripts/check.py'],
            cwd: 'tools/hook scripts',
          },
        })
      );
      const result = generateClaudeHooks(hooks);
      const entry = (result['PreToolUse'] as Record<string, unknown>[])[0]!;
      const hook = (entry['hooks'] as Record<string, unknown>[])[0]!;

      expect(hook['command']).toBe(
        'cd "${CLAUDE_PROJECT_DIR}"/\'tools/hook scripts\' && python3 .promptscript/scripts/check.py # promptscript-generated:test'
      );
    });
  });

  describe('generateCodexHooks', () => {
    it('should generate TOML hook sections', () => {
      const hooks = extractHooks(
        makeHooksBlock({
          protect: {
            event: 'pre-tool-use',
            matcher: 'Edit|Write',
            command: ['prs', 'hook', 'pre-edit'],
            timeoutMs: 5000,
          },
        })
      );
      const toml = generateCodexHooks(hooks);
      expect(toml).toContain('[[hooks.PreToolUse]]');
      expect(toml).toContain('[[hooks.PreToolUse.hooks]]');
      expect(toml).toContain('type = "command"');
      expect(toml).toContain('command = "prs hook pre-edit # promptscript-generated:protect"');
      expect(toml).toContain(
        "command_windows = \"& 'prs' 'hook' 'pre-edit' # promptscript-generated:protect\""
      );
      expect(toml).toContain('matcher = "Edit|Write"');
      expect(toml).toContain('timeout = 5');
    });

    it('should skip disabled hooks', () => {
      const hooks = extractHooks(
        makeHooksBlock({
          disabled: {
            event: 'pre-tool-use',
            command: ['prs', 'hook'],
            enabled: false,
          },
        })
      );
      const toml = generateCodexHooks(hooks);
      expect(toml.trim()).toBe('');
    });

    it('should preserve command argument boundaries for Codex', () => {
      const hooks = extractHooks(
        makeHooksBlock({
          check: {
            event: 'post-tool-use',
            command: ['python3', 'scripts/check file.py', '--label=hello world'],
          },
        })
      );

      expect(generateCodexHooks(hooks)).toContain(
        "command = \"python3 'scripts/check file.py' '--label=hello world' # promptscript-generated:check\""
      );
    });

    it('should include statusMessage in Claude hooks', () => {
      const hooks = extractHooks(
        makeHooksBlock({
          'status-hook': {
            event: 'pre-tool-use',
            command: ['prs', 'hook'],
            statusMessage: 'Running pre-tool hook',
          },
        })
      );
      const claudeHooks = generateClaudeHooks(hooks);
      expect(claudeHooks).toBeDefined();
      // Verify statusMessage is included somewhere in the structure
      const json = JSON.stringify(claudeHooks);
      expect(json).toContain('statusMessage');
      expect(json).toContain('Running pre-tool hook');
    });
  });

  describe('generateCursorHooks', () => {
    it('should generate enabled hooks with Cursor options', () => {
      const hooks = extractHooks(
        makeHooksBlock({
          active: {
            event: 'pre-tool-use',
            matcher: 'Edit|Write',
            command: ['python3', 'scripts/check file.py', '--label=hello world'],
            timeoutMs: 5000,
            statusMessage: 'Checking files',
            continueOnFailure: true,
          },
          disabled: {
            event: 'pre-tool-use',
            command: ['prs', 'hook'],
            enabled: false,
          },
        })
      );

      expect(generateCursorHooks(hooks)).toEqual({
        version: 1,
        hooks: {
          preToolUse: [
            {
              matcher: 'Edit|Write',
              command:
                "python3 'scripts/check file.py' '--label=hello world' # promptscript-generated:active",
              timeout: 5,
            },
          ],
        },
      });
    });
  });

  describe('generateFactoryHooks', () => {
    it('should generate enabled hooks with Factory options', () => {
      const hooks = extractHooks(
        makeHooksBlock({
          active: {
            event: 'pre-tool-use',
            command: ['prs', 'hook', 'pre-edit'],
            timeoutMs: 5000,
            statusMessage: 'Checking files',
          },
          disabled: {
            event: 'pre-tool-use',
            command: ['prs', 'hook'],
            enabled: false,
          },
        })
      );

      expect(generateFactoryHooks(hooks)).toEqual({
        PreToolUse: [
          {
            matcher: '.*',
            hooks: [
              {
                type: 'command',
                command: 'prs hook pre-edit # promptscript-generated:active',
                timeout: 5,
              },
            ],
          },
        ],
      });
    });

    it('should quote Factory command arguments for the shell', () => {
      const hooks = extractHooks(
        makeHooksBlock({
          quoted: {
            event: 'pre-tool-use',
            command: ['python3', 'scripts/check file.py', "it's safe; echo"],
          },
        })
      );

      expect(generateFactoryHooks(hooks)).toEqual({
        PreToolUse: [
          {
            matcher: '.*',
            hooks: [
              {
                type: 'command',
                command:
                  "python3 'scripts/check file.py' 'it'\"'\"'s safe; echo' # promptscript-generated:quoted",
              },
            ],
          },
        ],
      });
    });

    it('should execute Factory hooks from a project-relative working directory', () => {
      const hooks = extractHooks(
        makeHooksBlock({
          rooted: {
            event: 'pre-tool-use',
            command: ['python3', '.promptscript/scripts/check.py'],
            cwd: 'tools/hook scripts',
          },
        })
      );

      expect(generateFactoryHooks(hooks)).toEqual({
        PreToolUse: [
          {
            matcher: '.*',
            hooks: [
              {
                type: 'command',
                command:
                  'cd "$FACTORY_PROJECT_DIR"/\'tools/hook scripts\' && python3 .promptscript/scripts/check.py # promptscript-generated:rooted',
              },
            ],
          },
        ],
      });
    });
  });

  describe('generateVSCodeHooks', () => {
    it('should apply target overrides and emit the VS Code contract', () => {
      const hooks = extractHooks(
        makeHooksBlock({
          terminal: {
            event: 'pre-tool-use',
            matcher: 'Execute',
            command: ['prs', 'hook', 'pre-edit'],
            timeoutMs: 5000,
            targets: {
              vscode: {
                matcher: 'run_in_terminal',
                timeoutMs: 15000,
              },
            },
          },
        })
      );

      expect(generateVSCodeHooks(hooks)).toEqual({
        PreToolUse: [
          {
            type: 'command',
            command: 'prs hook pre-edit # promptscript-generated:terminal',
            windows: "& 'prs' 'hook' 'pre-edit' # promptscript-generated:terminal",
            matcher: 'run_in_terminal',
            timeout: 15,
          },
        ],
      });
    });
  });

  describe('generateGitHubHooks', () => {
    it('should generate current versioned repository hook entries', () => {
      const hooks = extractHooks(
        makeHooksBlock({
          active: {
            event: 'pre-tool-use',
            matcher: 'edit|create',
            command: ['prs', 'hook', 'pre-edit'],
            cwd: 'project',
            timeoutMs: 5000,
          },
          stopped: {
            event: 'stop',
            matcher: 'ignored',
            command: ['prs', 'hook', 'stop'],
          },
          disabled: {
            event: 'post-tool-use',
            command: ['prs', 'hook'],
            enabled: false,
          },
        })
      );

      expect(generateGitHubHooks(hooks)).toEqual({
        preToolUse: [
          {
            type: 'command',
            bash: 'prs hook pre-edit # promptscript-generated:active',
            powershell: "& 'prs' 'hook' 'pre-edit' # promptscript-generated:active",
            cwd: '.',
            matcher: 'edit|create',
            timeoutSec: 5,
          },
        ],
        agentStop: [
          {
            type: 'command',
            bash: 'prs hook stop # promptscript-generated:stopped',
            powershell: "& 'prs' 'hook' 'stop' # promptscript-generated:stopped",
          },
        ],
      });
    });

    it('should quote GitHub command arguments for each shell', () => {
      const hooks = extractHooks(
        makeHooksBlock({
          quoted: {
            event: 'pre-tool-use',
            command: ['python3', 'scripts/check file.py', "it's safe; echo", '--%', '@name'],
          },
        })
      );

      expect(generateGitHubHooks(hooks)).toEqual({
        preToolUse: [
          {
            type: 'command',
            bash: "python3 'scripts/check file.py' 'it'\"'\"'s safe; echo' --% @name # promptscript-generated:quoted",
            powershell:
              "& 'python3' 'scripts/check file.py' 'it''s safe; echo' '--%' '@name' # promptscript-generated:quoted",
          },
        ],
      });
    });

    it('should emit a project-relative GitHub working directory', () => {
      const hooks = extractHooks(
        makeHooksBlock({
          rooted: {
            event: 'pre-tool-use',
            command: ['python3', '.promptscript/scripts/check.py'],
            cwd: 'tools/hook scripts',
          },
        })
      );

      expect(generateGitHubHooks(hooks)).toEqual({
        preToolUse: [
          {
            type: 'command',
            bash: 'python3 .promptscript/scripts/check.py # promptscript-generated:rooted',
            powershell:
              "& 'python3' '.promptscript/scripts/check.py' # promptscript-generated:rooted",
            cwd: 'tools/hook scripts',
          },
        ],
      });
    });
  });

  describe('portable repository-local scripts', () => {
    const hooks = extractHooks(
      makeHooksBlock({
        validate: {
          event: 'post-tool-use',
          matcher: 'Edit|Write',
          script: {
            path: '.promptscript/scripts/check file.py',
            interpreter: 'python3',
            args: ['--label=hello world'],
          },
          cwd: 'tools/hook scripts',
          timeoutMs: 1501,
        },
      })
    );

    it('generates a Claude project-root invocation', () => {
      const entry = (generateClaudeHooks(hooks)['PostToolUse'] as Record<string, unknown>[])[0]!;
      const handler = (entry['hooks'] as Record<string, unknown>[])[0]!;

      expect(handler).toEqual({
        type: 'command',
        command:
          "cd \"${CLAUDE_PROJECT_DIR}\"/'tools/hook scripts' && python3 \"${CLAUDE_PROJECT_DIR}\"/'.promptscript/scripts/check file.py' '--label=hello world' # promptscript-generated:validate",
        timeout: 2,
      });
    });

    it('generates current Cursor versioned hooks', () => {
      const result = generateCursorHooks(hooks) as {
        hooks: Record<string, Record<string, unknown>[]>;
      };

      expect(result.hooks['postToolUse']![0]).toEqual({
        matcher: 'Edit|Write',
        command:
          'PROMPTSCRIPT_PROJECT_ROOT="$(git rev-parse --show-toplevel)" && cd "$PROMPTSCRIPT_PROJECT_ROOT"/\'tools/hook scripts\' && python3 "$PROMPTSCRIPT_PROJECT_ROOT"/\'.promptscript/scripts/check file.py\' \'--label=hello world\' # promptscript-generated:validate',
        timeout: 2,
      });
    });

    it('generates a Factory project-root invocation', () => {
      const entry = generateFactoryHooks(hooks)['PostToolUse']![0] as Record<string, unknown>;
      const handler = (entry['hooks'] as Record<string, unknown>[])[0]!;

      expect(handler['command']).toBe(
        "cd \"$FACTORY_PROJECT_DIR\"/'tools/hook scripts' && python3 \"$FACTORY_PROJECT_DIR\"/'.promptscript/scripts/check file.py' '--label=hello world' # promptscript-generated:validate"
      );
      expect(handler['timeout']).toBe(2);
    });

    it('generates GitHub Unix and Windows commands with native cwd', () => {
      expect(generateGitHubHooks(hooks)['postToolUse']![0]).toEqual({
        type: 'command',
        bash: "python3 '../../.promptscript/scripts/check file.py' '--label=hello world' # promptscript-generated:validate",
        powershell:
          "& 'py' '-3' '../../.promptscript/scripts/check file.py' '--label=hello world' # promptscript-generated:validate",
        cwd: 'tools/hook scripts',
        matcher: 'Edit|Write',
        timeoutSec: 2,
      });
    });

    it('generates current Codex nested TOML with Windows override', () => {
      const toml = generateCodexHooks(hooks);

      expect(toml).toContain('[[hooks.PostToolUse]]');
      expect(toml).toContain('[[hooks.PostToolUse.hooks]]');
      expect(toml).toContain('timeout = 2');
      expect(toml).toContain('command_windows = ');
      expect(toml).toContain('git rev-parse --show-toplevel');
      expect(toml).toContain('.promptscript/scripts/check file.py');
    });

    it('generates Gemini project-root hooks', () => {
      const entry = generateGeminiHooks(hooks)['AfterTool']![0] as Record<string, unknown>;
      const handler = (entry['hooks'] as Record<string, unknown>[])[0]!;

      expect(handler).toEqual({
        type: 'command',
        command:
          "cd \"$GEMINI_PROJECT_DIR\"/'tools/hook scripts' && python3 \"$GEMINI_PROJECT_DIR\"/'.promptscript/scripts/check file.py' '--label=hello world' # promptscript-generated:validate",
        timeout: 1501,
      });
    });

    it('generates each equivalent Windsurf tool event', () => {
      const result = generateWindsurfHooks(hooks);

      expect(Object.keys(result)).toEqual([
        'post_read_code',
        'post_write_code',
        'post_run_command',
        'post_mcp_tool_use',
      ]);
      expect(result['post_write_code']![0]).toEqual({
        command:
          "python3 '../../.promptscript/scripts/check file.py' '--label=hello world' # promptscript-generated:validate",
        powershell:
          "& 'py' '-3' '../../.promptscript/scripts/check file.py' '--label=hello world' # promptscript-generated:validate",
        working_directory: 'tools/hook scripts',
      });
    });

    it('generates native Grok project hooks', () => {
      const entry = generateGrokHooks(hooks)['PostToolUse']![0] as Record<string, unknown>;
      const handler = (entry['hooks'] as Record<string, unknown>[])[0]!;

      expect(handler).toEqual({
        type: 'command',
        command:
          "cd \"$GROK_WORKSPACE_ROOT\"/'tools/hook scripts' && python3 \"$GROK_WORKSPACE_ROOT\"/'.promptscript/scripts/check file.py' '--label=hello world' # promptscript-generated:validate",
        timeout: 2,
      });
    });

    it('quotes script paths and metacharacter arguments for Unix and Windows', () => {
      const special = extractHooks(
        makeHooksBlock({
          safe: {
            event: 'pre-tool-use',
            script: {
              path: '.promptscript/scripts/check file.mjs',
              interpreter: 'node',
              args: ["it's $safe; & echo"],
            },
          },
        })
      );

      expect(generateGitHubHooks(special)['preToolUse']![0]).toEqual({
        type: 'command',
        bash: `node '.promptscript/scripts/check file.mjs' 'it'"'"'s $safe; & echo' # promptscript-generated:safe`,
        powershell:
          "& 'node' '.promptscript/scripts/check file.mjs' 'it''s $safe; & echo' # promptscript-generated:safe",
        cwd: '.',
      });
    });

    it('uses the Deno run subcommand on Unix and Windows', () => {
      const deno = extractHooks(
        makeHooksBlock({
          deno: {
            event: 'pre-tool-use',
            script: {
              path: '.promptscript/scripts/check.ts',
              interpreter: 'deno',
            },
          },
        })
      );

      expect(generateGitHubHooks(deno)['preToolUse']![0]).toMatchObject({
        bash: 'deno run .promptscript/scripts/check.ts # promptscript-generated:deno',
        powershell: "& 'deno' 'run' '.promptscript/scripts/check.ts' # promptscript-generated:deno",
      });
    });
  });

  it('keeps native capability event metadata aligned with adapters', () => {
    const targets = [
      'claude',
      'cursor',
      'codex',
      'factory',
      'github',
      'gemini',
      'windsurf',
      'grok',
    ] as const;
    const events = [
      'pre-tool-use',
      'post-tool-use',
      'session-start',
      'setup',
      'subagent-start',
      'notification',
      'stop',
    ] as const;

    for (const target of targets) {
      expect(HOOK_CAPABILITIES[target].events).toEqual(
        events.filter((event) => mapEvent(event, target) !== null)
      );
    }
  });

  describe('getHookCompatibilityWarnings', () => {
    it('warns when Factory cannot represent an event or field', () => {
      const hooks = extractHooks(
        makeHooksBlock({
          agent: {
            event: 'subagent-start',
            command: ['echo', 'agent'],
          },
          status: {
            event: 'stop',
            command: ['echo', 'done'],
            statusMessage: 'Stopping',
            continueOnFailure: true,
          },
        })
      );

      expect(
        getHookCompatibilityWarnings(hooks, 'factory').map((warning) => warning.message)
      ).toEqual([
        'Hook "agent" uses event "subagent-start", which factory cannot represent and will omit.',
        'Hook "status" uses statusMessage, which factory cannot represent and will omit.',
        'Hook "status" uses continueOnFailure, which factory cannot represent and will omit.',
      ]);
    });

    it('warns for GitHub matcher and cloud-agent limitations', () => {
      const hooks = extractHooks(
        makeHooksBlock({
          stop: {
            event: 'stop',
            matcher: 'agent',
            command: ['echo', 'done'],
          },
          notify: {
            event: 'notification',
            command: ['echo', 'notice'],
          },
        })
      );

      expect(getHookCompatibilityWarnings(hooks, 'github')).toEqual([
        {
          code: 'PS4002',
          message: 'Hook "stop" uses matcher with "stop", which GitHub ignores.',
          suggestion: 'Remove matcher or use a GitHub event that supports matcher filtering.',
        },
        {
          code: 'PS4002',
          message:
            'Hook "notify" uses notification, which Copilot CLI supports but GitHub Copilot cloud agent does not fire.',
          suggestion: 'Use notification hooks only when Copilot CLI coverage is sufficient.',
        },
      ]);
    });

    it.each(['cursor', 'codex'] as const)(
      'warns when %s cannot guarantee a requested working directory',
      (target) => {
        const hooks = extractHooks(
          makeHooksBlock({
            rooted: {
              event: 'post-tool-use',
              command: ['python3', '.promptscript/scripts/check.py'],
              cwd: 'project',
              statusMessage: 'Checking',
              continueOnFailure: true,
            },
          })
        );

        expect(
          getHookCompatibilityWarnings(hooks, target).map((warning) => warning.message)
        ).toEqual(
          target === 'cursor'
            ? [
                'Hook "rooted" requests cwd "project", which cursor cannot guarantee and will ignore.',
                'Hook "rooted" uses statusMessage, which cursor cannot represent and will omit.',
                'Hook "rooted" uses continueOnFailure, which cursor cannot represent and will omit.',
              ]
            : [
                'Hook "rooted" requests cwd "project", which codex cannot guarantee and will ignore.',
                'Hook "rooted" uses continueOnFailure, which codex cannot represent and will omit.',
              ]
        );
      }
    );

    it('warns when a Windows-capable target cannot invoke a shell interpreter', () => {
      const hooks = extractHooks(
        makeHooksBlock({
          shell: {
            event: 'post-tool-use',
            script: {
              path: '.promptscript/scripts/check.sh',
              interpreter: 'bash',
            },
          },
        })
      );

      expect(
        getHookCompatibilityWarnings(hooks, 'github').map((warning) => warning.message)
      ).toContain(
        'Hook "shell" uses interpreter "bash", which github cannot invoke natively on Windows.'
      );
    });

    it('warns when Windsurf cannot represent timeoutMs', () => {
      const hooks = extractHooks(
        makeHooksBlock({
          timed: {
            event: 'post-tool-use',
            command: ['node', 'check.mjs'],
            timeoutMs: 5000,
          },
        })
      );

      expect(getHookCompatibilityWarnings(hooks, 'windsurf')).toContainEqual({
        code: 'PS4002',
        message: 'Hook "timed" uses timeoutMs, which Windsurf cannot represent and will omit.',
        suggestion: 'Enforce a timeout inside the hook script when required.',
      });
    });
  });
});
