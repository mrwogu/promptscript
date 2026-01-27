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
