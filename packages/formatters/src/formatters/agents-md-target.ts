import { createSimpleMarkdownFormatter } from '../create-simple-formatter.js';
import type { SimpleFormatterResult } from '../create-simple-formatter.js';

/**
 * Shared configuration helper for AGENTS.md-only targets.
 *
 * These platforms read `AGENTS.md` natively and have no target-specific
 * instruction file contract beyond it. All versions (simple, multifile, full)
 * emit the same single `AGENTS.md` file.
 *
 * Adding a new AGENTS.md-only target requires:
 * 1. One entry in `TARGET_DEFINITIONS` (packages/core/src/target-catalog.ts)
 * 2. One entry in `BUILTIN_FORMATTERS` (packages/formatters/src/builtin-formatters.ts)
 * 3. One public formatter file created via this helper
 *
 * @param name - Target name (e.g. 'aider', 'warp')
 * @param description - Human-readable description for the formatter
 * @returns Formatter class and VERSIONS constant
 */
export function createAgentsMdTarget(
  name: string,
  description: string,
  options?: { mcpConfigPath?: string; mcpConfigFormat?: 'json' | 'toml' }
): SimpleFormatterResult {
  return createSimpleMarkdownFormatter({
    name,
    outputPath: 'AGENTS.md',
    description,
    mainFileHeader: '',
    dotDir: '.agents',
    hasSkills: false,
    hasAgents: false,
    hasCommands: false,
    ...(options?.mcpConfigPath ? { mcpConfigPath: options.mcpConfigPath } : {}),
    ...(options?.mcpConfigFormat ? { mcpConfigFormat: options.mcpConfigFormat } : {}),
  });
}
