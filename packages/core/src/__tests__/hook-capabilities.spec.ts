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
    expect(HOOK_CAPABILITIES.github.terminal?.guarantee).toBe('not-guaranteed');
    expect(HOOK_RUNTIME_CAPABILITIES.vscode.terminal?.toolNames).toEqual(['run_in_terminal']);
  });
});
