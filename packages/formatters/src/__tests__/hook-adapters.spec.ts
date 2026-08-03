import { describe, it, expect } from 'vitest';
import {
  extractHooks,
  generateClaudeHooks,
  generateCodexHooks,
  generateCodexHookConfig,
  generateCursorHooks,
  generateFactoryHooks,
  generateGeminiHooks,
  generateGitHubHooks,
  generateGrokHooks,
  generateVSCodeHooks,
  generateWindsurfHooks,
  getEnabledHookScriptResources,
  getHookCompatibilityWarnings,
  mapEvent,
  convertTimeout,
  type HookDefinition,
  type HookTarget,
} from '../hook-adapters.js';
import {
  HOOK_CAPABILITIES,
  HOOK_RUNTIME_CAPABILITIES,
  type HookCapability,
  type Value,
} from '@promptscript/core';

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
              event: 'post-tool-use',
              timeoutMs: 15000,
              statusMessage: 'Running terminal hook',
              continueOnFailure: true,
              cwd: 'scripts',
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
        event: 'post-tool-use',
        timeoutMs: 15000,
        statusMessage: 'Running terminal hook',
        continueOnFailure: true,
        cwd: 'scripts',
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

    it('should ignore malformed script and target override values', () => {
      const block = makeHooksBlock({
        malformedScript: {
          event: 'pre-tool-use',
          script: { path: 42, interpreter: null } as unknown as Value,
        },
        malformedTargets: {
          event: 'pre-tool-use',
          command: ['echo', 'check'],
          targets: {
            vscode: null,
            cursor: [],
            claude: { matcher: 42, timeoutMs: 'slow' },
          } as unknown as Value,
        },
      });

      const hooks = extractHooks(block);
      expect(hooks).toHaveLength(1);
      expect(hooks[0]!.targets).toEqual({ claude: {} });
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

    it.each([
      ['claude', 'PreToolUse'],
      ['cursor', 'preToolUse'],
      ['codex', 'PreToolUse'],
      ['factory', 'PreToolUse'],
      ['gemini', 'BeforeTool'],
      ['windsurf', 'pre_run_command'],
      ['vscode', 'PreToolUse'],
      ['github', null],
      ['grok', null],
    ] as const)(
      'should map pre-terminal-command for %s without overstating coverage',
      (target, event) => {
        expect(mapEvent('pre-terminal-command', target)).toBe(event);
      }
    );
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

    it('should preserve timeout units for unknown targets', () => {
      expect(convertTimeout(1500, 'unknown' as HookTarget)).toBe(1500);
    });

    it('should preserve milliseconds for Gemini and Windsurf', () => {
      expect(convertTimeout(1500, 'gemini')).toBe(1500);
      expect(convertTimeout(1500, 'windsurf')).toBe(1500);
    });
  });

  describe('generateClaudeHooks', () => {
    it('should use the native terminal matcher by default and allow an override', () => {
      const hooks: HookDefinition[] = [
        {
          id: 'default',
          event: 'pre-terminal-command',
          command: ['echo', 'default'],
        },
        {
          id: 'override',
          event: 'pre-terminal-command',
          command: ['echo', 'override'],
          targets: { claude: { matcher: 'CustomShell' } },
        },
      ];

      expect(generateClaudeHooks(hooks)['PreToolUse']).toEqual([
        expect.objectContaining({ matcher: 'Bash' }),
        expect.objectContaining({ matcher: 'CustomShell' }),
      ]);
    });

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

    it('should extract command and script target overrides', () => {
      const hooks = extractHooks(
        makeHooksBlock({
          check: {
            event: 'post-tool-use',
            command: ['node', 'base.mjs'],
            targets: {
              factory: {
                command: ['node', 'factory check.mjs', '--strict mode'],
              },
              github: {
                script: {
                  path: '.promptscript/scripts/github check.py',
                  interpreter: 'python3',
                  args: ['--strict mode'],
                },
              },
            },
          },
        })
      );

      expect(hooks[0]!.targets?.factory?.command).toEqual([
        'node',
        'factory check.mjs',
        '--strict mode',
      ]);
      expect(hooks[0]!.targets?.github?.script).toEqual({
        path: '.promptscript/scripts/github check.py',
        interpreter: 'python3',
        args: ['--strict mode'],
      });
    });
  });

  describe('generateFactoryHooks', () => {
    it('should use Execute for terminal commands and allow a native matcher override', () => {
      const hooks: HookDefinition[] = [
        {
          id: 'default',
          event: 'pre-terminal-command',
          command: ['echo', 'default'],
        },
        {
          id: 'override',
          event: 'pre-terminal-command',
          command: ['echo', 'override'],
          targets: { factory: { matcher: 'CustomExecute' } },
        },
      ];

      expect(generateFactoryHooks(hooks)['PreToolUse']).toEqual([
        expect.objectContaining({ matcher: 'Execute' }),
        expect.objectContaining({ matcher: 'CustomExecute' }),
      ]);
    });

    it('should inherit the base executable when a target does not replace it', () => {
      const hooks = extractHooks(
        makeHooksBlock({
          check: {
            event: 'pre-tool-use',
            command: ['node', 'base hook.mjs'],
            targets: {
              factory: { matcher: 'Edit' },
            },
          },
        })
      );

      expect(generateFactoryHooks(hooks)['PreToolUse']![0]).toEqual({
        matcher: 'Edit',
        hooks: [
          {
            type: 'command',
            command: "node 'base hook.mjs' # promptscript-generated:check",
          },
        ],
      });
    });

    it('should replace a base script with a target command', () => {
      const hooks = extractHooks(
        makeHooksBlock({
          check: {
            event: 'pre-tool-use',
            script: {
              path: '.promptscript/scripts/base.py',
              interpreter: 'python3',
            },
            targets: {
              factory: {
                command: ['node', 'factory check.mjs', '--strict mode'],
              },
            },
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
                command: "node 'factory check.mjs' '--strict mode' # promptscript-generated:check",
              },
            ],
          },
        ],
      });
    });

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

    it('should omit disabled and unsupported Factory hooks', () => {
      expect(
        generateFactoryHooks([
          { id: 'unsupported', event: 'subagent-start', command: ['echo', 'agent'] },
          { id: 'disabled', event: 'pre-tool-use', command: ['echo', 'disabled'], enabled: false },
        ])
      ).toEqual({});
    });

    it('should omit a hook disabled for Factory', () => {
      expect(
        generateFactoryHooks([
          {
            id: 'disabled',
            event: 'pre-tool-use',
            command: ['echo', 'base'],
            targets: { factory: { command: ['echo', 'factory'], enabled: false } },
          },
        ])
      ).toEqual({});
    });
  });

  describe('generateVSCodeHooks', () => {
    it('should emit the best-effort terminal matcher by default', () => {
      const hooks: HookDefinition[] = [
        {
          id: 'terminal',
          event: 'pre-terminal-command',
          command: ['echo', 'terminal'],
          targets: { vscode: {} },
        },
      ];

      expect(generateVSCodeHooks(hooks)['PreToolUse']![0]).toEqual(
        expect.objectContaining({ matcher: 'run_in_terminal' })
      );
    });

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
                command: ['node', 'VS Code hook.mjs', '--label=hello world'],
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
            command:
              "node 'VS Code hook.mjs' '--label=hello world' # promptscript-generated:terminal",
            windows:
              "& 'node' 'VS Code hook.mjs' '--label=hello world' # promptscript-generated:terminal",
            matcher: 'run_in_terminal',
            timeout: 15,
          },
        ],
      });
    });

    it('handles a defensive commandless hook entry', () => {
      const hook: HookDefinition = {
        id: 'commandless',
        event: 'pre-tool-use',
      };

      expect(generateVSCodeHooks([hook])).toEqual({
        PreToolUse: [
          {
            type: 'command',
            command: ' # promptscript-generated:commandless',
            windows: '&  # promptscript-generated:commandless',
          },
        ],
      });
      expect(generateCursorHooks([hook])).toEqual({
        version: 1,
        hooks: {
          preToolUse: [
            {
              matcher: '.*',
              command: ' # promptscript-generated:commandless',
              timeout: 10,
            },
          ],
        },
      });
    });

    it('should omit disabled and unsupported VS Code hooks', () => {
      expect(
        generateVSCodeHooks([
          { id: 'unsupported', event: 'notification', command: ['echo', 'notice'] },
          { id: 'disabled', event: 'pre-tool-use', command: ['echo', 'disabled'], enabled: false },
        ])
      ).toEqual({});
    });
  });

  describe('generateGitHubHooks', () => {
    it('should replace a base command with a target script on Unix and Windows', () => {
      const hooks = extractHooks(
        makeHooksBlock({
          check: {
            event: 'pre-tool-use',
            command: ['node', 'base.mjs'],
            targets: {
              github: {
                script: {
                  path: '.promptscript/scripts/GitHub check.py',
                  interpreter: 'python3',
                  args: ['--label=hello world'],
                },
              },
            },
          },
        })
      );

      expect(generateGitHubHooks(hooks)).toEqual({
        preToolUse: [
          {
            type: 'command',
            bash: "python3 '.promptscript/scripts/GitHub check.py' '--label=hello world' # promptscript-generated:check",
            powershell:
              "& 'py' '-3' '.promptscript/scripts/GitHub check.py' '--label=hello world' # promptscript-generated:check",
            cwd: '.',
          },
        ],
      });
    });

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

    it('should omit the PowerShell command for Unix-only script interpreters', () => {
      const result = generateGitHubHooks([
        {
          id: 'shell',
          event: 'pre-tool-use',
          script: {
            path: '.promptscript/scripts/check.sh',
            interpreter: 'bash',
            args: [],
          },
        },
      ]);

      expect(result['preToolUse']![0]).toEqual({
        type: 'command',
        bash: 'bash .promptscript/scripts/check.sh # promptscript-generated:shell',
        cwd: '.',
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

  describe('getEnabledHookScriptResources', () => {
    it('should include effective base and target scripts without duplicates', () => {
      const hook: HookDefinition = {
        id: 'check',
        event: 'pre-tool-use',
        script: {
          path: '.promptscript/scripts/base.mjs',
          interpreter: 'node',
          args: [],
        },
        targets: {
          factory: {
            matcher: 'Edit',
          },
          github: {
            script: {
              path: '.promptscript/scripts/github.py',
              interpreter: 'python3',
              args: [],
            },
          },
          vscode: {
            command: ['node', 'vscode.mjs'],
          },
        },
      };

      expect(getEnabledHookScriptResources(hook).map((script) => script.path)).toEqual([
        '.promptscript/scripts/base.mjs',
        '.promptscript/scripts/github.py',
      ]);
    });

    it('should include inherited scripts for re-enabled targets only', () => {
      const hook: HookDefinition = {
        id: 'check',
        event: 'pre-tool-use',
        enabled: false,
        script: {
          path: '.promptscript/scripts/base.mjs',
          interpreter: 'node',
          args: [],
        },
        targets: {
          factory: { enabled: true },
          github: {
            enabled: false,
            script: {
              path: '.promptscript/scripts/disabled.py',
              interpreter: 'python3',
              args: [],
            },
          },
        },
      };

      expect(getEnabledHookScriptResources(hook).map((script) => script.path)).toEqual([
        '.promptscript/scripts/base.mjs',
      ]);
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

    it('omits unsupported Windsurf events', () => {
      const hooks = extractHooks(
        makeHooksBlock({
          startup: {
            event: 'session-start',
            command: ['echo', 'startup'],
          },
        })
      );

      expect(generateWindsurfHooks(hooks)).toEqual({});
    });

    it('omits disabled Windsurf and Gemini hooks', () => {
      const hooks: HookDefinition[] = [
        { id: 'disabled', event: 'post-tool-use', command: ['echo', 'disabled'], enabled: false },
        { id: 'unsupported-gemini', event: 'subagent-start', command: ['echo', 'agent'] },
      ];

      expect(generateWindsurfHooks(hooks)).toEqual({});
      expect(generateGeminiHooks(hooks)).toEqual({});
    });

    it('generates Codex status messages', () => {
      const hooks = extractHooks(
        makeHooksBlock({
          status: {
            event: 'post-tool-use',
            command: ['echo', 'status'],
            statusMessage: 'Running status hook',
          },
        })
      );

      expect(generateCodexHooks(hooks)).toContain('statusMessage = "Running status hook"');
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

    it('escapes special characters in Codex TOML hook fields', () => {
      const special = extractHooks(
        makeHooksBlock({
          escaped: {
            event: 'pre-tool-use',
            matcher: 'Edit"Write',
            command: ['echo', 'value'],
            statusMessage: 'line one\nline two',
          },
        })
      );

      const toml = generateCodexHooks(special);
      expect(toml).toContain('matcher = "Edit\\"Write"');
      expect(toml).toContain('statusMessage = "line one\\nline two"');
    });

    it('omits unsupported and disabled Codex hooks', () => {
      const hooks: HookDefinition[] = [
        { id: 'unsupported', event: 'notification', command: ['echo', 'notice'] },
        { id: 'disabled', event: 'pre-tool-use', command: ['echo', 'disabled'], enabled: false },
      ];

      expect(generateCodexHooks(hooks)).toBe('');
      expect(generateCodexHookConfig(hooks)).toEqual({});
    });

    it('generates Codex JSON config for project and root script hooks', () => {
      const hooks = extractHooks(
        makeHooksBlock({
          project: {
            event: 'pre-tool-use',
            matcher: 'Edit',
            script: {
              path: 'scripts/project hook.js',
              interpreter: 'node',
              args: ['--check'],
            },
            cwd: 'project',
            timeoutMs: 2500,
            statusMessage: 'Checking project',
          },
          root: {
            event: 'post-tool-use',
            script: {
              path: 'scripts/root.py',
              interpreter: 'python3',
              args: [],
            },
          },
          shell: {
            event: 'session-start',
            script: {
              path: 'scripts/start.sh',
              interpreter: 'bash',
              args: [],
            },
          },
        })
      );

      const config = generateCodexHookConfig(hooks);
      expect(config['PreToolUse']![0]).toMatchObject({
        matcher: 'Edit',
        hooks: [
          {
            type: 'command',
            command: expect.stringContaining('scripts/project hook.js'),
            commandWindows: expect.stringContaining('Set-Location $promptscriptProjectRoot'),
            timeout: 3,
            statusMessage: 'Checking project',
          },
        ],
      });
      expect(config['PostToolUse']![0]).toMatchObject({
        hooks: [
          {
            type: 'command',
            command: expect.stringContaining('scripts/root.py'),
            commandWindows: expect.stringContaining('git rev-parse --show-toplevel'),
          },
        ],
      });
      expect(config['SessionStart']![0]).toMatchObject({
        hooks: [
          {
            type: 'command',
            command: expect.stringContaining('scripts/start.sh'),
          },
        ],
      });
      const sessionStart = config['SessionStart']![0] as {
        hooks: Record<string, unknown>[];
      };
      expect(sessionStart.hooks[0]).not.toHaveProperty('commandWindows');
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
      'pre-terminal-command',
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

    for (const target of [...targets, 'vscode'] as const) {
      if (mapEvent('pre-terminal-command', target)) {
        const capability: HookCapability = HOOK_RUNTIME_CAPABILITIES[target];
        expect(capability.terminal).toBeDefined();
      }
    }
  });

  describe('getHookCompatibilityWarnings', () => {
    it('reports terminal coverage without warning for guaranteed targets', () => {
      const hooks: HookDefinition[] = [
        {
          id: 'terminal',
          event: 'pre-terminal-command',
          command: ['echo', 'terminal'],
          targets: { vscode: {} },
        },
      ];

      for (const target of ['claude', 'codex', 'factory', 'windsurf'] as const) {
        expect(getHookCompatibilityWarnings(hooks, target)).toEqual([]);
      }
      for (const target of ['cursor', 'gemini', 'vscode'] as const) {
        expect(getHookCompatibilityWarnings(hooks, target)).toEqual([
          expect.objectContaining({
            code: 'PS4002',
            message: expect.stringContaining('best-effort coverage'),
          }),
        ]);
      }
      for (const target of ['github', 'grok'] as const) {
        expect(getHookCompatibilityWarnings(hooks, target)).toEqual([
          expect.objectContaining({
            code: 'PS4002',
            message: expect.stringContaining('cannot guarantee and will omit'),
          }),
        ]);
      }
    });

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
            matcher: 'Execute',
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
      expect(getHookCompatibilityWarnings(hooks, 'windsurf')).toContainEqual({
        code: 'PS4002',
        message: 'Hook "timed" uses matcher, which Windsurf cannot represent and will ignore.',
        suggestion: 'Filter the received hook payload inside the script.',
      });
    });

    it('warns when cloud targets ignore matchers for unsupported events', () => {
      const hooks = extractHooks(
        makeHooksBlock({
          stop: {
            event: 'stop',
            matcher: 'agent',
            command: ['echo', 'done'],
          },
        })
      );

      expect(getHookCompatibilityWarnings(hooks, 'gemini')).toContainEqual(
        expect.objectContaining({
          message: 'Hook "stop" uses matcher with "stop", which gemini ignores.',
        })
      );
    });
  });
});
