/**
 * Import existing AI instruction files to PromptScript format.
 *
 * Supports CLAUDE.md, copilot-instructions.md, .cursorrules, AGENTS.md,
 * and generic markdown files with heuristic section classification.
 *
 * @packageDocumentation
 */

export { importFile } from './importer.js';
export type { ImportOptions, ImportResult } from './importer.js';
export type { DetectedFormat } from './detector.js';
export { detectFormat, getParser } from './detector.js';
export { classifyConfidence, ConfidenceLevel } from './confidence.js';
export type { ScoredSection } from './confidence.js';
export { mapSections } from './mapper.js';
export { emitPrs } from './emitter.js';
export type { EmitOptions } from './emitter.js';
