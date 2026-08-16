/**
 * Core types, errors, and utilities for the PromptScript toolchain.
 *
 * This package provides the foundational types and comprehensive error handling classes
 * used across the entire PromptScript ecosystem. It includes:
 *
 * - **Common Types**: AST interfaces, configuration schemas, and shared type definitions.
 * - **Error Handling**: A hierarchy of typed errors (`PSError`) for precise exception management.
 * - **Utilities**: Shared helper functions for path manipulation and validation.
 *
 * @packageDocumentation
 */

// Types
export * from './types/index.js';

// Errors
export * from './errors/index.js';

// Utilities
export * from './utils/index.js';

// Logger
export * from './logger.js';

// Template interpolation
export * from './template.js';

// Canonical AST compatibility layer
export * from './canonical-ast.js';
export * from './block-merge.js';
export * from './block-shapes.js';
export * from './block-aliases.js';
export * from './block-override.js';
export * from './block-import.js';
export * from './agent-names.js';
export * from './inline-uses.js';
export * from './presentation.js';

// Syntax version registry
export * from './syntax-versions.js';
export * from './section-registry.js';

// Target catalog
export * from './target-catalog.js';
export * from './target-capabilities.js';

// Hook capabilities
export * from './hook-capabilities.js';

// Git timeout classification
export * from './git-timeout.js';

// Shared output planning
export * from './structured-output.js';
export * from './output-plan.js';
