import { existsSync } from 'fs';
import { resolve, basename } from 'path';
import type { ObjectContent, TextContent } from '@promptscript/core';
import { Resolver } from '@promptscript/resolver';
import type { InspectOptions } from '../types.js';
import { loadConfig } from '../config/loader.js';
import { resolveRegistryPath } from '../utils/registry-resolver.js';
import { ConsoleOutput, createSpinner } from '../output/console.js';

interface LayerTraceEntry {
  property: string;
  source: string;
  strategy: string;
  action: string;
}

/**
 * `prs inspect <skill-name>` — show per-property provenance for a skill.
 */
export async function inspectCommand(skillName: string, options: InspectOptions): Promise<void> {
  const isJson = options.format === 'json';
  const spinner = isJson ? createSpinner('').stop() : createSpinner('Resolving...').start();

  try {
    const config = await loadConfig(options.config);
    const registry = await resolveRegistryPath(config);

    const resolver = new Resolver({
      registryPath: registry.path,
      localPath: './.promptscript',
      registries: config.registries,
    });

    const entryPath = resolve('./.promptscript/project.prs');
    if (!existsSync(entryPath)) {
      spinner.stop();
      ConsoleOutput.error(`Entry file not found: ${entryPath}`);
      process.exitCode = 1;
      return;
    }

    const result = await resolver.resolve(entryPath);

    if (!result.ast) {
      spinner.stop();
      ConsoleOutput.error('Resolution failed');
      for (const err of result.errors) {
        ConsoleOutput.error(`  ${err.message}`);
      }
      process.exitCode = 1;
      return;
    }

    spinner.stop();

    // Find @skills block
    const skillsBlock = result.ast.blocks.find((b) => b.name === 'skills');
    if (!skillsBlock || skillsBlock.content.type !== 'ObjectContent') {
      ConsoleOutput.error('No @skills block in resolved output');
      process.exitCode = 1;
      return;
    }

    const content = skillsBlock.content as ObjectContent;
    const availableSkills = Object.keys(content.properties);

    // Find the target skill
    const skillValue = content.properties[skillName];
    if (
      !skillValue ||
      typeof skillValue !== 'object' ||
      skillValue === null ||
      Array.isArray(skillValue)
    ) {
      ConsoleOutput.error(
        `Skill '${skillName}' not found. Available skills: ${availableSkills.join(', ')}`
      );
      process.exitCode = 1;
      return;
    }

    const skill = skillValue as Record<string, unknown>;
    const trace = (
      Array.isArray(skill['__layerTrace']) ? skill['__layerTrace'] : []
    ) as LayerTraceEntry[];
    const sealed = Array.isArray(skill['sealed'])
      ? (skill['sealed'] as string[])
      : skill['sealed'] === true
        ? ['(all replace)']
        : [];
    const composedFrom = Array.isArray(skill['__composedFrom']) ? skill['__composedFrom'] : null;
    const baseSource = skillsBlock.loc?.file ?? '<unknown>';

    if (isJson) {
      outputJson(skillName, skill, trace, sealed, composedFrom, baseSource);
    } else if (options.layers) {
      outputLayers(skillName, skill, trace, sealed, baseSource);
    } else {
      outputProperties(skillName, skill, trace, sealed, baseSource);
    }
  } catch (error) {
    spinner.stop();
    ConsoleOutput.error(
      `Inspect failed: ${error instanceof Error ? error.message : String(error)}`
    );
    process.exitCode = 1;
  }
}

function summarizeValue(val: unknown): string {
  if (val === undefined || val === null) return '(empty)';
  if (typeof val === 'string') {
    return val.length > 40 ? `"${val.slice(0, 37)}..."` : `"${val}"`;
  }
  if (typeof val === 'boolean') return String(val);
  if (Array.isArray(val)) return `${val.length} items`;
  if (typeof val === 'object' && val !== null) {
    const obj = val as Record<string, unknown>;
    if (obj['type'] === 'TextContent') {
      const text = (obj as unknown as TextContent).value;
      const lines = text.split('\n').length;
      return `(${lines} lines)`;
    }
    return `{${Object.keys(obj).length} keys}`;
  }
  return String(val);
}

function shortPath(source: string): string {
  return basename(source);
}

function getPropertySource(
  propName: string,
  trace: LayerTraceEntry[],
  baseSource: string
): { source: string; strategy: string } {
  for (let i = trace.length - 1; i >= 0; i--) {
    if (trace[i]!.property === propName) {
      return { source: trace[i]!.source, strategy: trace[i]!.strategy };
    }
  }
  return { source: baseSource, strategy: 'base' };
}

const INTERNAL_KEYS = new Set([
  'type',
  'loc',
  'properties',
  '__layerTrace',
  '__composedFrom',
  'composedFrom',
]);

function outputProperties(
  skillName: string,
  skill: Record<string, unknown>,
  trace: LayerTraceEntry[],
  sealed: string[],
  baseSource: string
): void {
  console.log(`\nSkill: ${skillName}\n`);

  const sealedSet = new Set(sealed);

  for (const [key, val] of Object.entries(skill)) {
    if (INTERNAL_KEYS.has(key)) continue;

    const { source, strategy } = getPropertySource(key, trace, baseSource);
    const isSealed = sealedSet.has(key) || (skill['sealed'] === true && strategy === 'base');
    const tag = isSealed ? '[sealed]' : strategy !== 'base' ? `[${strategy}]` : '';
    const summary = summarizeValue(val);

    console.log(
      `  ${key.padEnd(18)} ${summary.padEnd(30)} ${tag.padEnd(10)} <- ${shortPath(source)}`
    );
  }

  console.log('');
}

function outputLayers(
  skillName: string,
  skill: Record<string, unknown>,
  trace: LayerTraceEntry[],
  sealed: string[],
  baseSource: string
): void {
  const layers = new Map<string, LayerTraceEntry[]>();
  for (const entry of trace) {
    const existing = layers.get(entry.source) ?? [];
    existing.push(entry);
    layers.set(entry.source, existing);
  }

  const totalLayers = 1 + layers.size;
  console.log(`\nSkill: ${skillName} (${totalLayers} layer${totalLayers > 1 ? 's' : ''})\n`);

  // Layer 1: base
  console.log(`Layer 1 -- ${shortPath(baseSource)} (base)`);
  for (const [key, val] of Object.entries(skill)) {
    if (INTERNAL_KEYS.has(key)) continue;
    const hasTraceEntry = trace.some((t) => t.property === key);
    if (!hasTraceEntry) {
      console.log(`  + ${key}: ${summarizeValue(val)}`);
    }
  }
  if (sealed.length > 0) {
    console.log(`  + sealed: [${sealed.join(', ')}]`);
  }
  console.log('');

  // Extension layers
  let layerNum = 2;
  for (const [source, entries] of layers) {
    console.log(`Layer ${layerNum} -- ${shortPath(source)} (@extend)`);
    for (const entry of entries) {
      const symbol = entry.action === 'replaced' ? '~' : entry.action === 'negated' ? '-' : '+';
      console.log(`  ${symbol} ${entry.property}: ${entry.action}`);
    }
    console.log('');
    layerNum++;
  }
}

function outputJson(
  skillName: string,
  skill: Record<string, unknown>,
  trace: LayerTraceEntry[],
  sealed: string[],
  composedFrom: unknown,
  baseSource: string
): void {
  const layers = new Map<string, LayerTraceEntry[]>();
  for (const entry of trace) {
    const existing = layers.get(entry.source) ?? [];
    existing.push(entry);
    layers.set(entry.source, existing);
  }

  const properties: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(skill)) {
    if (INTERNAL_KEYS.has(key)) continue;
    const { source, strategy } = getPropertySource(key, trace, baseSource);
    properties[key] = {
      value: summarizeValue(val),
      source: shortPath(source),
      strategy,
      sealed: sealed.includes(key),
    };
  }

  const output = {
    skill: skillName,
    baseSource: shortPath(baseSource),
    layers: Array.from(layers.entries()).map(([source, changes]) => ({
      source: shortPath(source),
      type: 'extend',
      changes,
    })),
    properties,
    sealed,
    composedFrom: composedFrom ?? null,
  };

  console.log(JSON.stringify(output, null, 2));
}
