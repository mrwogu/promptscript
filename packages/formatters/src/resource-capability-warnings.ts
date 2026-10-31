import {
  isKnownTarget,
  isPromptTarget,
  resolveTargetVersion,
  TARGET_CAPABILITIES,
  type Block,
  type Program,
  type TargetResourceCapability,
} from '@promptscript/core';
import type { FormatterOutput, FormatterWarning } from './types.js';

/**
 * Blocks that a target emits as separate resource files. A target that has no
 * such resource, or a version outside the resource's version list, drops the
 * block from the output.
 */
const RESOURCE_BLOCKS = [
  { block: 'skills', kind: 'skills', label: 'skill' },
  { block: 'mcpServers', kind: 'mcp', label: 'MCP' },
  { block: 'plugins', kind: 'plugins', label: 'plugin' },
] as const satisfies readonly {
  block: string;
  kind: TargetResourceCapability['kind'];
  label: string;
}[];

function hasEntries(block: Block): boolean {
  if (block.content.type !== 'ObjectContent' && block.content.type !== 'MixedContent') {
    return false;
  }
  return Object.keys(block.content.properties).some((key) => !key.startsWith('__'));
}

/**
 * Warn when `@skills`, `@mcpServers` or `@plugins` is authored but the target,
 * or the resolved target version, cannot emit it.
 *
 * @internal
 */
export function getResourceCapabilityWarnings(
  ast: Program,
  target: string,
  version: string | undefined
): FormatterWarning[] {
  if (!isKnownTarget(target) || isPromptTarget(target)) return [];

  const capability = TARGET_CAPABILITIES[target];
  const resolvedVersion = resolveTargetVersion(capability, version);
  const warnings: FormatterWarning[] = [];

  for (const { block: blockName, kind, label } of RESOURCE_BLOCKS) {
    const block = ast.blocks.find((candidate) => candidate.name === blockName);
    if (!block || !hasEntries(block)) continue;
    // These targets already report the block through unsupported-block warnings.
    if (capability.unsupportedBlocks.includes(blockName)) continue;

    const resource = capability.resources.find((candidate) => candidate.kind === kind);
    if (!resource) {
      warnings.push({
        code: 'PS4002',
        ruleName: 'target-compatibility',
        message: `Target "${target}" has no native ${label} output and will omit @${blockName}.`,
        suggestion: `Compile a target with ${label} output or configure it in the tool directly.`,
        location: block.loc,
      });
    } else if (!resource.versions.includes(resolvedVersion)) {
      warnings.push({
        code: 'PS4002',
        ruleName: 'target-compatibility',
        message: `Target "${target}" version "${resolvedVersion}" cannot emit @${blockName} and will omit it.`,
        suggestion: `Use a version that emits ${label} output: ${resource.versions.join(', ')}.`,
        location: block.loc,
      });
    }
  }

  return warnings;
}

/** @internal */
export function appendResourceCapabilityWarnings(
  output: FormatterOutput,
  ast: Program,
  target: string,
  version: string | undefined
): FormatterOutput {
  const warnings = getResourceCapabilityWarnings(ast, target, version);
  if (warnings.length === 0) return output;
  return {
    ...output,
    warnings: [...(output.warnings ?? []), ...warnings],
  };
}
