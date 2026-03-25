/**
 * Extractors module - shared logic for extracting structured data from PRS blocks.
 * Ensures parity across all formatters by centralizing extraction logic.
 */

export { GlobCategorizer, CATEGORY_GLOB_HINTS } from './glob-categorizer.js';
export type { CategorizedGlobs } from './glob-categorizer.js';
export { StandardsExtractor } from './standards-extractor.js';
export type {
  ConfigStandards,
  DiagramStandards,
  DocumentationStandards,
  ExtractedStandards,
  GitStandards,
  StandardsEntry,
  StandardsExtractionOptions,
} from './types.js';
export {
  DEFAULT_SECTION_TITLES,
  getSectionTitle,
  NON_CODE_KEYS,
  normalizeSectionName,
} from './types.js';
