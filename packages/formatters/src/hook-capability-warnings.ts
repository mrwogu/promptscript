import {
  isKnownTarget,
  TARGET_CAPABILITIES,
  type HookCapability,
  type Program,
} from '@promptscript/core';
import { extractHooks } from './hook-adapters.js';
import type { HookTarget } from './hook-adapters.js';
import type { FormatterWarning } from './types.js';

export function getTargetHookCapabilityWarnings(
  ast: Program,
  target: string,
  version: string
): FormatterWarning[] {
  const hooksBlock = ast.blocks.find((block) => block.name === 'hooks');
  if (!hooksBlock || !isKnownTarget(target)) return [];

  const enabledHooks = extractHooks(hooksBlock).filter(
    (hook) => (hook.targets?.[target as HookTarget]?.enabled ?? hook.enabled) !== false
  );
  if (enabledHooks.length === 0) return [];

  const capability: HookCapability = TARGET_CAPABILITIES[target].hooks;
  if (capability.status !== 'native' && capability.status !== 'compatible') {
    return [
      {
        code: 'PS4002',
        message: `Target "${target}" cannot emit portable @hooks (${capability.status}) and will omit them.`,
        suggestion: capability.fallback,
        location: hooksBlock.loc,
      },
    ];
  }

  if (capability.nativeVersions && !capability.nativeVersions.includes(version)) {
    return [
      {
        code: 'PS4002',
        message: `Target "${target}" version "${version}" cannot emit @hooks and will omit them.`,
        suggestion: capability.fallback,
        location: hooksBlock.loc,
      },
    ];
  }

  return [];
}

export function appendTargetHookCapabilityWarnings(
  output: import('./types.js').FormatterOutput,
  ast: Program,
  target: string,
  version: string
): import('./types.js').FormatterOutput {
  const warnings = getTargetHookCapabilityWarnings(ast, target, version);
  if (warnings.length === 0) return output;
  return {
    ...output,
    warnings: [...(output.warnings ?? []), ...warnings],
  };
}
