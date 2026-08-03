import { describe, expect, it } from 'vitest';
import {
  HOOK_CAPABILITIES,
  HOOK_RUNTIME_CAPABILITIES,
  KNOWN_TARGETS,
  isPortableHookInterpreter,
  isPortableHookScriptPath,
  type HookCapability,
} from '../index.js';

describe('hook capabilities', () => {
  it('classifies every built-in target', () => {
    expect(Object.keys(HOOK_CAPABILITIES).sort()).toEqual([...KNOWN_TARGETS].sort());
  });

  it('records complete native adapter contracts', () => {
    const nativeTargets = Object.entries(HOOK_CAPABILITIES)
      .filter(([, capability]) => capability.status === 'native')
      .map(([target]) => target)
      .sort();

    expect(nativeTargets).toEqual(
      ['claude', 'codex', 'cursor', 'factory', 'gemini', 'github', 'grok', 'windsurf'].sort()
    );
    for (const target of nativeTargets) {
      const capability: HookCapability =
        HOOK_CAPABILITIES[target as keyof typeof HOOK_CAPABILITIES];
      expect(capability.configPath).not.toBeNull();
      expect(capability.events.length).toBeGreaterThan(0);
      expect(capability.nativeVersions?.length).toBeGreaterThan(0);
      expect(capability.documentationUrl).toMatch(/^https:\/\//);
    }
  });

  it('validates portable script paths and interpreters', () => {
    expect(isPortableHookScriptPath('.promptscript/scripts/check.py')).toBe(true);
    expect(isPortableHookScriptPath('.promptscript/scripts/check scripts/check.py')).toBe(true);
    expect(isPortableHookScriptPath('.promptscript/scripts/../check.py')).toBe(false);
    expect(isPortableHookScriptPath('.promptscript/scripts/CON.py')).toBe(false);
    expect(isPortableHookScriptPath('.promptscript/scripts/bad:name.py')).toBe(false);
    expect(isPortableHookScriptPath('.promptscript/scripts/bad\nname.py')).toBe(false);
    expect(isPortableHookScriptPath('scripts/check.py')).toBe(false);
    expect(isPortableHookInterpreter('python3')).toBe(true);
    expect(isPortableHookInterpreter('custom-runtime')).toBe(false);
  });

  it('describes terminal interception semantics for native hosts', () => {
    expect(HOOK_CAPABILITIES.factory.terminal).toEqual({
      guarantee: 'guaranteed',
      toolNames: ['Execute'],
      notes: expect.stringContaining('Factory Execute'),
    });
    expect(HOOK_CAPABILITIES.claude.terminal).toEqual({
      guarantee: 'guaranteed',
      toolNames: ['Bash'],
      notes: expect.stringContaining('Bash shell commands'),
    });
    expect(HOOK_CAPABILITIES.codex.terminal).toEqual({
      guarantee: 'guaranteed',
      toolNames: ['Bash'],
      notes: expect.stringContaining('unified exec calls'),
    });
    expect(HOOK_CAPABILITIES.windsurf.terminal).toEqual({
      guarantee: 'guaranteed',
      toolNames: ['pre_run_command', 'post_run_command'],
      notes: expect.stringContaining('dedicated pre-run'),
    });
    expect(HOOK_CAPABILITIES.github.terminal?.guarantee).toBe('not-guaranteed');
    expect(HOOK_RUNTIME_CAPABILITIES.vscode.terminal).toEqual({
      guarantee: 'best-effort',
      toolNames: ['run_in_terminal'],
      notes: expect.stringContaining('ignores matcher values'),
    });
  });

  it('classifies project-root resolution strategies for native hosts', () => {
    expect(
      Object.entries(HOOK_RUNTIME_CAPABILITIES)
        .filter(([, capability]) => capability.projectRootStrategy === 'environment')
        .map(([target]) => target)
        .sort()
    ).toEqual(['claude', 'factory', 'gemini', 'grok']);
    expect(
      Object.entries(HOOK_RUNTIME_CAPABILITIES)
        .filter(([, capability]) => capability.projectRootStrategy === 'git-root')
        .map(([target]) => target)
        .sort()
    ).toEqual(['codex', 'cursor']);
    expect(
      Object.entries(HOOK_RUNTIME_CAPABILITIES)
        .filter(([, capability]) => capability.projectRootStrategy === 'native-cwd')
        .map(([target]) => target)
        .sort()
    ).toEqual(['github', 'windsurf']);
    expect(HOOK_RUNTIME_CAPABILITIES.vscode.projectRootStrategy).toBe('workspace-cwd');
  });
});
