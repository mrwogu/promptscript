import { toNativeAgentName, type Program, type TargetConfig, type Value } from '@promptscript/core';
import type { FormatterOutput, FormatterWarning } from './types.js';

/**
 * Factory droid tool names and the Claude Code tool doing the same job.
 * Factory has no `LS` twin in Claude Code, `Glob` lists files there.
 *
 * @see https://docs.factory.ai/cli/configuration/custom-droids
 * @see https://code.claude.com/docs/en/tools-reference
 */
const FACTORY_TO_CLAUDE_TOOLS: Readonly<Record<string, string>> = {
  Create: 'Write',
  Execute: 'Bash',
  FetchUrl: 'WebFetch',
  ApplyPatch: 'Edit',
  LS: 'Glob',
};

/**
 * Claude Code tool names and the Factory droid tool doing the same job.
 */
const CLAUDE_TO_FACTORY_TOOLS: Readonly<Record<string, string>> = {
  Write: 'Create',
  Bash: 'Execute',
  WebFetch: 'FetchUrl',
  MultiEdit: 'Edit',
};

/** Targets that write Claude Code agent files. Grok uses the Claude formatter. */
const CLAUDE_TOOL_TARGETS = new Set(['claude', 'grok']);

/** Agent fields that hold tool names. */
const TOOL_FIELDS = ['tools', 'disallowedTools'] as const;

/** Tools that spawn a subagent. Claude Code subagents can not use them. */
const SUBAGENT_SPAWN_TOOLS = new Set(['Task', 'Agent']);

function isPlainObject(value: Value | undefined): value is Record<string, Value> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    (value as { type?: unknown }).type === undefined
  );
}

function toolMapFor(target: string): Readonly<Record<string, string>> | undefined {
  if (CLAUDE_TOOL_TARGETS.has(target)) return FACTORY_TO_CLAUDE_TOOLS;
  if (target === 'factory') return CLAUDE_TO_FACTORY_TOOLS;
  return undefined;
}

/**
 * Rename tool names written for the other tool (Factory or Claude Code) to
 * the names the target knows. Other names and other targets stay as written.
 * Duplicates made by the rename are dropped.
 */
export function mapAgentToolNames(tools: readonly string[], target: string): string[] {
  const map = toolMapFor(target);
  if (!map) return [...tools];
  const mapped = tools.map((tool) => map[tool] ?? tool);
  return [...new Set(mapped)];
}

function mapToolValue(value: Value, target: string): Value {
  if (!Array.isArray(value)) return value;
  if (!value.every((item) => typeof item === 'string')) return value;
  return mapAgentToolNames(value as string[], target);
}

/**
 * Return true when the target config allows emitting the agent. The name can be
 * the source name (`team.reviewer`) or the native file name (`team-reviewer`).
 */
export function shouldIncludeAgent(name: string, targetConfig?: TargetConfig): boolean {
  const names = new Set([name, toNativeAgentName(name)]);
  const matches = (list: readonly string[]): boolean => list.some((entry) => names.has(entry));

  const includeAgents = targetConfig?.includeAgents;
  if (includeAgents === false) return false;
  if (Array.isArray(includeAgents) && !matches(includeAgents)) return false;

  const excludeAgents = targetConfig?.excludeAgents;
  if (Array.isArray(excludeAgents) && matches(excludeAgents)) return false;
  return true;
}

/**
 * Resolve one agent entry for a target: merge `targets.<target>` over the
 * shared fields, drop `targets`, and map tool names for the target.
 */
export function resolveAgentEntry(
  entry: Record<string, Value>,
  target: string
): Record<string, Value> {
  const { targets, ...shared } = entry;
  const override = isPlainObject(targets) ? targets[target] : undefined;
  const merged: Record<string, Value> = isPlainObject(override)
    ? { ...shared, ...override }
    : shared;

  for (const field of TOOL_FIELDS) {
    const value = merged[field];
    if (value !== undefined) merged[field] = mapToolValue(value, target);
  }
  return merged;
}

/**
 * Return the program as one target sees its `@agents` block: agents left out
 * by `includeAgents` / `excludeAgents` are removed and every agent gets its
 * `targets.<target>` override and target tool names. The input is not changed.
 * Running it twice gives the same result.
 */
export function applyAgentTargeting(
  ast: Program,
  target: string,
  targetConfig?: TargetConfig
): Program {
  const index = ast.blocks.findIndex((block) => block.name === 'agents');
  if (index === -1) return ast;
  const block = ast.blocks[index]!;
  const content = block.content;
  if (content.type !== 'ObjectContent' && content.type !== 'MixedContent') return ast;

  const properties: Record<string, Value> = {};
  for (const [name, value] of Object.entries(content.properties)) {
    if (!shouldIncludeAgent(name, targetConfig)) continue;
    properties[name] = isPlainObject(value) ? resolveAgentEntry(value, target) : value;
  }

  const blocks = [...ast.blocks];
  blocks[index] = { ...block, content: { ...content, properties } };
  return { ...ast, blocks };
}

/**
 * Warn when a Claude Code subagent lists a tool that spawns subagents.
 * Claude Code subagents can not spawn other subagents, so the tool does
 * nothing there. Expects a program already passed through
 * {@link applyAgentTargeting}.
 */
export function getAgentSpawnToolWarnings(ast: Program, target: string): FormatterWarning[] {
  if (!CLAUDE_TOOL_TARGETS.has(target)) return [];
  const block = ast.blocks.find((candidate) => candidate.name === 'agents');
  if (!block) return [];
  const content = block.content;
  if (content.type !== 'ObjectContent' && content.type !== 'MixedContent') return [];

  const warnings: FormatterWarning[] = [];
  for (const [name, value] of Object.entries(content.properties)) {
    if (!isPlainObject(value)) continue;
    const tools = value['tools'];
    if (!Array.isArray(tools)) continue;
    const spawnTools = tools.filter(
      (tool): tool is string => typeof tool === 'string' && SUBAGENT_SPAWN_TOOLS.has(tool)
    );
    for (const tool of spawnTools) {
      warnings.push({
        code: 'PS4003',
        ruleName: 'agent-compatibility',
        message: `Agent "${name}": tool "${tool}" does nothing in a ${target} subagent, subagents can not spawn other subagents.`,
        suggestion: `Set targets.${target}.tools without "${tool}", or leave the agent out with excludeAgents for ${target}.`,
        location: block.loc,
      });
    }
  }
  return warnings;
}

/**
 * Append {@link getAgentSpawnToolWarnings} to a formatter output.
 */
export function appendAgentSpawnToolWarnings(
  output: FormatterOutput,
  ast: Program,
  target: string
): FormatterOutput {
  const warnings = getAgentSpawnToolWarnings(ast, target);
  if (warnings.length === 0) return output;
  return { ...output, warnings: [...(output.warnings ?? []), ...warnings] };
}
