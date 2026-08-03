import {
  getBlockShapeContract,
  getObservedBlockShape,
  isPortablePathSegment,
  isPlainObject,
  isTextContent,
  type Block,
  type BlockShape,
} from '@promptscript/core';
import type { RuleContext, ValidationRule } from '../types.js';

function formatShapes(shapes: readonly BlockShape[]): string {
  return shapes.join(' or ');
}

function valueShape(value: unknown): string {
  if (isTextContent(value)) return 'multiline scalar';
  if (Array.isArray(value)) return 'array';
  if (
    isPlainObject(value) &&
    (value['type'] === 'TypeExpression' || value['type'] === 'TemplateExpression')
  ) {
    return value['type'] === 'TypeExpression' ? 'type expression' : 'template expression';
  }
  if (isPlainObject(value)) return 'object';
  if (value === null) return 'null';
  return typeof value;
}

function isSafeShortcutName(name: string): boolean {
  const fileName = name.replace(/^\/+/, '');
  return (
    fileName.length > 0 &&
    !fileName.includes('..') &&
    !fileName.includes('/') &&
    !fileName.includes('\\') &&
    !fileName.includes('\u007f') &&
    isPortablePathSegment(fileName)
  );
}

function isShortcutObject(value: unknown): value is Record<string, unknown> {
  return (
    isPlainObject(value) &&
    value['type'] !== 'TypeExpression' &&
    value['type'] !== 'TemplateExpression'
  );
}

interface ShortcutNameSource {
  readonly blockName: string;
  readonly sourceName: string;
}

function isShortcutNameConflict(
  existing: ShortcutNameSource,
  blockName: string,
  sourceName: string
): boolean {
  return existing.sourceName !== sourceName || existing.blockName === blockName;
}

function validateShortcutValues(
  ctx: RuleContext,
  block: Block,
  normalizedNames: Map<string, ShortcutNameSource>,
  targetNames: Map<string, ShortcutNameSource>
): void {
  if (block.content.type !== 'ObjectContent') return;

  for (const [name, value] of Object.entries(block.content.properties)) {
    const normalizedName = name.replace(/^\/+/, '');
    const existingName = normalizedNames.get(normalizedName);
    const hasNormalizedConflict =
      existingName !== undefined && isShortcutNameConflict(existingName, block.name, name);
    if (hasNormalizedConflict) {
      ctx.report({
        message: `@${block.name} entry "${name}" resolves to the same command file name as @${existingName.blockName} entry "${existingName.sourceName}".`,
        location: block.loc,
        suggestion: 'Use one unique command name after removing leading slashes.',
        severity: 'error',
      });
    } else if (!existingName) {
      normalizedNames.set(normalizedName, {
        blockName: block.name,
        sourceName: name,
      });
    }

    const targetName = normalizedName.toLowerCase().replace(/\s+/g, '-');
    const existingTargetName = targetNames.get(targetName);
    if (
      !hasNormalizedConflict &&
      existingTargetName &&
      isShortcutNameConflict(existingTargetName, block.name, name)
    ) {
      ctx.report({
        message: `@${block.name} entry "${name}" resolves to the same target-normalized file name as @${existingTargetName.blockName} entry "${existingTargetName.sourceName}".`,
        location: block.loc,
        suggestion: 'Use command names that remain unique after lowercasing and replacing spaces.',
        severity: 'error',
      });
    } else if (!existingTargetName) {
      targetNames.set(targetName, {
        blockName: block.name,
        sourceName: name,
      });
    }

    if (!isSafeShortcutName(name)) {
      ctx.report({
        message: `@${block.name} entry "${name}" cannot be used as a safe command file name.`,
        location: block.loc,
        suggestion:
          'Use a portable flat name without paths, reserved names or characters, controls, or trailing spaces and dots.',
        severity: 'error',
      });
    }

    if (isTextContent(value) || (typeof value === 'string' && value.includes('\n'))) {
      ctx.report({
        message: `@${block.name} entry "${name}" uses a multiline scalar, which changes native output by target.`,
        location: isTextContent(value) ? value.loc : block.loc,
        suggestion: `Use an explicit content object: "${name}": { content: """...""" }.`,
      });
      continue;
    }

    if (typeof value === 'string') continue;

    if (!isShortcutObject(value)) {
      ctx.report({
        message: `@${block.name} entry "${name}" has unsupported ${valueShape(value)} content.`,
        location: block.loc,
        suggestion: `Use a string or an object: "${name}": { content: """...""" }.`,
        severity: 'error',
      });
      continue;
    }

    const description = value['description'];
    if (
      description !== undefined &&
      typeof description !== 'string' &&
      !isTextContent(description)
    ) {
      ctx.report({
        message: `@${block.name} entry "${name}" has unsupported ${valueShape(description)} description field.`,
        location: block.loc,
        suggestion: `Use: "${name}": { description: "Command summary" content: """Command instructions.""" }.`,
        severity: 'error',
      });
    }

    const content = value['content'];
    if (content !== undefined && typeof content !== 'string' && !isTextContent(content)) {
      ctx.report({
        message: `@${block.name} entry "${name}" has unsupported ${valueShape(content)} content field.`,
        location: block.loc,
        suggestion: `Use: "${name}": { content: """Command instructions.""" }.`,
        severity: 'error',
      });
    }
  }
}

/**
 * PS038: Canonical built-in block shapes.
 *
 * Custom blocks remain open-world. Supported compatibility forms warn only
 * when formatter behavior can differ from the canonical form.
 */
export const validBlockShape: ValidationRule = {
  id: 'PS038',
  name: 'valid-block-shape',
  description: 'Built-in blocks must use supported canonical content shapes',
  defaultSeverity: 'warning',
  validate: (ctx) => {
    const shortcutNames = new Map<string, ShortcutNameSource>();
    const shortcutTargetNames = new Map<string, ShortcutNameSource>();
    for (const block of ctx.ast.blocks) {
      const contract = getBlockShapeContract(block.name);
      if (!contract) continue;

      const observedShape = getObservedBlockShape(block);
      if (!contract.supportedShapes.includes(observedShape)) {
        ctx.report({
          message: `@${block.name} uses unsupported ${observedShape} content; expected ${formatShapes(contract.supportedShapes)}.`,
          location: block.loc,
          suggestion: `Replace it with: ${contract.example}`,
          severity: 'error',
        });
        continue;
      }

      if (contract.legacyShapes.includes(observedShape)) {
        ctx.report({
          message: `@${block.name} uses supported legacy ${observedShape} content; canonical shape is ${contract.canonicalShape}.`,
          location: block.loc,
          suggestion: `Prefer: ${contract.example}`,
        });
      }

      if (block.name === 'shortcuts' || block.name === 'commands') {
        validateShortcutValues(ctx, block, shortcutNames, shortcutTargetNames);
      }
    }
  },
};
