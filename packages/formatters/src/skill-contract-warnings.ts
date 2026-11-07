import {
  isKnownTarget,
  isPromptTarget,
  resolveTargetVersion,
  TARGET_CAPABILITIES,
  type Program,
  type SourceLocation,
  type Value,
} from '@promptscript/core';
import type { FormatterOutput, FormatterWarning } from './types.js';

/**
 * Stable diagnostic code for skill contracts (`inputs` / `outputs`) that a
 * target does not write to its skill files.
 */
const SKILL_CONTRACT_CODE = 'PS4005';

const CONTRACT_KEYS = ['inputs', 'outputs'] as const;

/**
 * Targets whose SKILL.md writer keeps only an allow-list of frontmatter keys.
 * They drop the contract even for a skill that comes from a SKILL.md file.
 */
const FRONTMATTER_FILTERING_TARGETS: ReadonlySet<string> = new Set(['factory']);

function isRecord(value: Value | undefined): value is Record<string, Value> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasFields(value: Value | undefined): boolean {
  return isRecord(value) && Object.keys(value).some((key) => !key.startsWith('__'));
}

function skillEntries(
  ast: Program
): { readonly location: SourceLocation; readonly entries: Record<string, Value> } | undefined {
  const block = ast.blocks.find((candidate) => candidate.name === 'skills');
  if (!block) return undefined;
  if (block.content.type !== 'ObjectContent' && block.content.type !== 'MixedContent') {
    return undefined;
  }
  return { location: block.loc, entries: block.content.properties };
}

/**
 * Warn when a skill declares `inputs` or `outputs` but the target does not
 * write them to its skill file.
 *
 * A target writes the contract only for a skill that comes from a SKILL.md
 * file, because the frontmatter of that file is copied as it is. A skill
 * defined in a `.prs` file has no frontmatter, so its skill file holds only
 * the fields the target generates. Targets that filter the frontmatter
 * (Factory) drop the contract in both cases.
 *
 * Targets that emit no skill files at all are reported through the resource
 * warnings, so they are skipped here.
 *
 * @internal
 */
export function getSkillContractWarnings(
  ast: Program,
  target: string,
  version: string | undefined
): FormatterWarning[] {
  if (!isKnownTarget(target) || isPromptTarget(target)) return [];

  const skills = skillEntries(ast);
  if (!skills) return [];

  const capability = TARGET_CAPABILITIES[target];
  if (capability.unsupportedBlocks.includes('skills')) return [];
  const resource = capability.resources.find((candidate) => candidate.kind === 'skills');
  if (!resource?.versions.includes(resolveTargetVersion(capability, version))) {
    return [];
  }

  const filtering = FRONTMATTER_FILTERING_TARGETS.has(target);
  const warnings: FormatterWarning[] = [];

  for (const [name, skill] of Object.entries(skills.entries)) {
    if (name.startsWith('__') || !isRecord(skill)) continue;

    const dropped = CONTRACT_KEYS.filter((key) => hasFields(skill[key]));
    if (dropped.length === 0) continue;

    const fromSkillFile = typeof skill['__rawFrontmatter'] === 'string';
    if (fromSkillFile && !filtering) continue;

    warnings.push({
      code: SKILL_CONTRACT_CODE,
      ruleName: 'target-compatibility',
      message: `Target "${target}" does not write ${dropped.join(' and ')} of skill "${name}" to its skill file and will omit the contract.`,
      suggestion: filtering
        ? `${target} accepts only a fixed set of SKILL.md frontmatter keys. Describe the expected input and output in the skill body, or compile a target that keeps the contract.`
        : 'The contract is written only for a skill that comes from a SKILL.md file. Move the skill into a SKILL.md file, or describe the expected input and output in the skill body.',
      location: skills.location,
    });
  }

  return warnings;
}

/** @internal */
export function appendSkillContractWarnings(
  output: FormatterOutput,
  ast: Program,
  target: string,
  version: string | undefined
): FormatterOutput {
  const warnings = getSkillContractWarnings(ast, target, version);
  if (warnings.length === 0) return output;
  return {
    ...output,
    warnings: [...(output.warnings ?? []), ...warnings],
  };
}
