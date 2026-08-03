import {
  SECTION_REGISTRY,
  blockOwnsSection,
  getPrimarySectionForBlock,
  type PresentationEntry,
} from '@promptscript/core';
import type { ValidationRule } from '../types.js';
import { getBlockName, walkBlocks } from '../walker.js';

/**
 * PS037: Validate contextual section header overrides.
 */
export const validSectionHeaders: ValidationRule = {
  id: 'PS037',
  name: 'valid-section-headers',
  description: 'Validate contextual section header overrides',
  defaultSeverity: 'error',
  validate: (ctx) => {
    walkBlocks(ctx.ast, (block) => {
      const entries = (block.canonicalBody?.entries ?? []).filter(
        (entry): entry is PresentationEntry => entry.type === 'PresentationEntry'
      );
      if (entries.length === 0) return;

      const blockName = getBlockName(block);
      const nestedExtension = block.type === 'ExtendBlock' && block.targetPath.includes('.');
      const seen = new Set<string>();

      for (const entry of entries) {
        if (entry.source !== 'explicit') continue;

        if (typeof entry.title !== 'string' || entry.title.trim().length === 0) {
          ctx.report({
            message: 'Section header title must be a non-empty string.',
            location: entry.titleLoc,
          });
        } else if (/[\r\n\u2028\u2029]/.test(entry.title)) {
          ctx.report({
            message: 'Section header title must fit on one line.',
            location: entry.titleLoc,
          });
        }

        if (nestedExtension) {
          ctx.report({
            message: '@header can only target a root block extension.',
            location: entry.loc,
            suggestion: `Use @extend ${blockName} with @header instead.`,
          });
          continue;
        }

        let sectionId: string | undefined;
        if (entry.sectionId) {
          const section = SECTION_REGISTRY.find((candidate) => candidate.id === entry.sectionId);
          if (!section) {
            ctx.report({
              message: `Unknown section key "${entry.sectionId}".`,
              location: entry.sectionLoc ?? entry.loc,
              suggestion: `Known section keys: ${SECTION_REGISTRY.map((candidate) => candidate.id).join(', ')}.`,
            });
            continue;
          }
          if (!blockOwnsSection(blockName, section.id)) {
            ctx.report({
              message: `Section "${section.id}" is not owned by @${blockName}.`,
              location: entry.sectionLoc ?? entry.loc,
              suggestion: `Move the override to one of: ${section.sourceBlocks.map((owner) => `@${owner}`).join(', ')}.`,
            });
            continue;
          }
          sectionId = section.id;
        } else {
          const primary = getPrimarySectionForBlock(blockName);
          if (!primary) {
            ctx.report({
              message: `Block @${blockName} does not own a primary generated section.`,
              location: entry.loc,
              suggestion: 'Use @header <section-key> only in a registered owner block.',
            });
            continue;
          }
          sectionId = primary.id;
        }

        if (seen.has(sectionId)) {
          ctx.report({
            message: `Duplicate section header override for "${sectionId}".`,
            location: entry.sectionLoc ?? entry.loc,
            suggestion: 'Keep one override for each generated section in a block.',
          });
        }
        seen.add(sectionId);
      }
    });
  },
};
