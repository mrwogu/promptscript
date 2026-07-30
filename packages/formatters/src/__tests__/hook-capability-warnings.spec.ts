import { describe, expect, it } from 'vitest';
import {
  HOOK_CAPABILITIES,
  KNOWN_TARGETS,
  TARGET_DEFINITIONS,
  type HookCapability,
  type Program,
  type SourceLocation,
} from '@promptscript/core';
import { getTargetHookCapabilityWarnings } from '../hook-capability-warnings.js';
import { BUILTIN_FORMATTERS } from '../builtin-formatters.js';

const loc: SourceLocation = { file: 'hooks.prs', line: 1, column: 1 };
const ast: Program = {
  type: 'Program',
  blocks: [
    {
      type: 'Block',
      name: 'hooks',
      content: {
        type: 'ObjectContent',
        properties: {
          check: {
            event: 'post-tool-use',
            command: ['echo', 'check'],
          },
        },
        loc,
      },
      loc,
    },
  ],
  uses: [],
  extends: [],
  loc,
};

describe('target hook capability warnings', () => {
  it('never silently omits hooks for a non-native built-in target', () => {
    for (const target of KNOWN_TARGETS) {
      const capability: HookCapability = HOOK_CAPABILITIES[target];
      if (capability.status === 'native' || capability.status === 'compatible') continue;

      expect(
        getTargetHookCapabilityWarnings(ast, target, 'full'),
        `Expected an omission warning for ${target}`
      ).toEqual([
        expect.objectContaining({
          code: 'PS4002',
          message: expect.stringContaining(`Target "${target}"`),
          suggestion: capability.fallback,
          location: loc,
        }),
      ]);
    }
  });

  it('surfaces the omission warning through every non-native formatter', () => {
    for (const target of KNOWN_TARGETS) {
      const capability: HookCapability = HOOK_CAPABILITIES[target];
      if (capability.status === 'native' || capability.status === 'compatible') continue;

      const FormatterClass = BUILTIN_FORMATTERS[target];
      const output = new FormatterClass().format(ast, {
        version: TARGET_DEFINITIONS[target].features.defaultVersion,
      });

      expect(output.warnings, `Expected formatter warning for ${target}`).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: 'PS4002',
            message: expect.stringContaining(`Target "${target}"`),
          }),
        ])
      );
    }
  });

  it('warns when a native target mode cannot emit hooks', () => {
    for (const target of KNOWN_TARGETS) {
      const capability: HookCapability = HOOK_CAPABILITIES[target];
      if (capability.status !== 'native' || !capability.nativeVersions) continue;

      expect(getTargetHookCapabilityWarnings(ast, target, 'unsupported-mode')).toEqual([
        expect.objectContaining({
          code: 'PS4002',
          message: expect.stringContaining('version "unsupported-mode"'),
          suggestion: capability.fallback,
        }),
      ]);
      expect(getTargetHookCapabilityWarnings(ast, target, capability.nativeVersions[0]!)).toEqual(
        []
      );
    }
  });

  it('registers native hook files for cleanup in unsupported modes', () => {
    for (const target of KNOWN_TARGETS) {
      const capability: HookCapability = HOOK_CAPABILITIES[target];
      if (capability.status !== 'native' || !capability.configPath) continue;

      const FormatterClass = BUILTIN_FORMATTERS[target];
      const output = new FormatterClass().format(ast, { version: 'simple' });

      expect(output.managedOutputFiles, `Expected cleanup metadata for ${target}`).toContain(
        capability.configPath
      );
    }
  });
});
