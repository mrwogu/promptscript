/**
 * Feature Coverage Matrix - Specification of tool capabilities and formatter support.
 *
 * This module defines what features each AI tool supports and tracks
 * which features our formatters implement. Used for:
 * - Documentation of tool capabilities
 * - Testing feature coverage
 * - Identifying gaps in formatter implementations
 *
 * @module feature-matrix
 */

import {
  KNOWN_TARGETS,
  getTargetCapability,
  getTargetFeatureStatus,
  type KnownTarget,
  type TargetFeatureStatus,
} from '@promptscript/core';

/**
 * Tool/Formatter names.
 * @deprecated Use `KnownTarget` from `@promptscript/core` directly.
 */
export type ToolName = KnownTarget;

/**
 * Feature implementation status.
 */
export type FeatureStatus = TargetFeatureStatus;

/**
 * Feature specification.
 */
export interface FeatureSpec {
  /** Unique feature identifier */
  id: string;
  /** Human-readable name */
  name: string;
  /** Description of the feature */
  description: string;
  /** Category for grouping */
  category: FeatureCategory;
  /** Support status for each target; canonical projections include all targets */
  tools: Partial<Record<ToolName, FeatureStatus>>;
  /** How to test this feature */
  testStrategy?: string;
  /** Link to tool documentation */
  docsUrl?: Partial<Record<ToolName, string>>;
}

/**
 * Feature categories.
 */
export type FeatureCategory =
  | 'output-format' // Basic output format features
  | 'file-structure' // File/folder structure
  | 'metadata' // Frontmatter, metadata
  | 'targeting' // Glob patterns, file targeting
  | 'content' // Content features
  | 'advanced'; // Advanced/tool-specific features

/**
 * Complete Feature Coverage Matrix.
 *
 * This is the source of truth for what each tool supports
 * and what our formatters implement.
 */
const FEATURE_DEFINITIONS: Omit<FeatureSpec, 'tools'>[] = [
  // === Output Format ===
  {
    id: 'markdown-output',
    name: 'Markdown Output',
    description: 'Basic Markdown formatting for rules',
    category: 'output-format',
  },
  {
    id: 'mdc-format',
    name: 'MDC Format',
    description: 'Markdown Components format with enhanced features',
    category: 'output-format',
  },
  {
    id: 'code-blocks',
    name: 'Code Blocks',
    description: 'Fenced code blocks with syntax highlighting',
    category: 'output-format',
  },
  {
    id: 'mermaid-diagrams',
    name: 'Mermaid Diagrams',
    description: 'Mermaid diagram rendering in code blocks',
    category: 'output-format',
  },

  // === File Structure ===
  {
    id: 'single-file',
    name: 'Single File Output',
    description: 'Output to a single rules file',
    category: 'file-structure',
  },
  {
    id: 'multi-file-rules',
    name: 'Multiple Rule Files',
    description: 'Split rules into multiple files by concern',
    category: 'file-structure',
    testStrategy: 'Check additionalFiles in FormatterOutput',
  },
  {
    id: 'workflows',
    name: 'Workflow Files',
    description: 'Separate workflow/automation files',
    category: 'file-structure',
    testStrategy: 'Check for .agent/workflows/ output',
  },
  {
    id: 'nested-directories',
    name: 'Nested Directory Structure',
    description: 'Support for nested rule directories',
    category: 'file-structure',
  },

  // === Metadata ===
  {
    id: 'yaml-frontmatter',
    name: 'YAML Frontmatter',
    description: 'YAML metadata block at start of file',
    category: 'metadata',
    testStrategy: 'Check for --- delimited YAML block',
  },
  {
    id: 'frontmatter-description',
    name: 'Description in Frontmatter',
    description: 'Rule description in frontmatter metadata',
    category: 'metadata',
  },
  {
    id: 'frontmatter-globs',
    name: 'Globs in Frontmatter',
    description: 'File glob patterns in frontmatter',
    category: 'metadata',
  },
  {
    id: 'activation-type',
    name: 'Activation Type',
    description: 'Control when rules are activated (always, manual, auto)',
    category: 'metadata',
  },

  // === Targeting ===
  {
    id: 'glob-patterns',
    name: 'Glob Pattern Targeting',
    description: 'Apply rules to files matching glob patterns',
    category: 'targeting',
    testStrategy: 'Check globs field in frontmatter',
  },
  {
    id: 'always-apply',
    name: 'Always Apply Rules',
    description: 'Rules that always apply regardless of context',
    category: 'targeting',
  },
  {
    id: 'manual-activation',
    name: 'Manual Activation',
    description: 'Rules activated manually by user',
    category: 'targeting',
  },
  {
    id: 'auto-activation',
    name: 'Auto/Model Activation',
    description: 'Rules activated automatically by AI model',
    category: 'targeting',
  },

  // === Content Features ===
  {
    id: 'examples',
    name: 'Structured Examples',
    description: 'Support for @examples block with input/output pairs for few-shot prompting',
    category: 'content',
  },
  {
    id: 'character-limit',
    name: 'Character Limit Validation',
    description: 'Validate content against tool character limits',
    category: 'content',
    testStrategy: 'Check warning for content > limit',
  },
  {
    id: 'sections-splitting',
    name: 'Content Section Splitting',
    description: 'Split large content into logical sections',
    category: 'content',
  },

  {
    id: 'guard-requires',
    name: 'Guard Dependencies',
    description: 'Support for requires field in @guards for dependency injection',
    category: 'targeting',
  },

  // === Advanced Features ===
  {
    id: 'context-inclusion',
    name: 'Context File Inclusion',
    description: 'Include other files as context (@file, @folder)',
    category: 'advanced',
    testStrategy: 'Check for @file/@folder references',
  },
  {
    id: 'at-mentions',
    name: '@-Mentions',
    description: 'Reference files/symbols with @ syntax',
    category: 'advanced',
  },
  {
    id: 'tool-integration',
    name: 'Tool Integration',
    description: 'Integration with external tools/commands',
    category: 'advanced',
  },
  {
    id: 'path-specific-rules',
    name: 'Path-Specific Rules',
    description: 'Rules with glob patterns targeting specific file paths',
    category: 'advanced',
    testStrategy: 'Check for path-specific files with glob patterns in frontmatter',
  },
  {
    id: 'prompt-files',
    name: 'Prompt Files',
    description: 'Reusable prompt templates for IDE integration',
    category: 'advanced',
    testStrategy: 'Check for .github/prompts/*.prompt.md files',
  },
  {
    id: 'slash-commands',
    name: 'Slash Commands',
    description: 'Executable slash commands invokable via / in chat',
    category: 'advanced',
    testStrategy:
      'Check for .cursor/commands/*.md, .github/prompts/*.prompt.md, .claude/skills/*/SKILL.md, or .agent/workflows/*.md',
    docsUrl: {
      github: 'https://docs.github.com/en/copilot/tutorials/customization-library/prompt-files',
      cursor: 'https://cursor.com/changelog/1-6',
      claude: 'https://code.claude.com/docs/en/skills',
      antigravity: 'https://atamel.dev/posts/2025/11-25_customize_antigravity_rules_workflows/',
      factory: 'https://docs.factory.ai/cli/configuration',
    },
  },
  {
    id: 'skills',
    name: 'Skills',
    description: 'Reusable skill definitions for AI agents',
    category: 'advanced',
    testStrategy: 'Check for skills directory with SKILL.md files',
    docsUrl: {
      factory: 'https://docs.factory.ai/cli/configuration',
    },
  },
  {
    id: 'agent-instructions',
    name: 'Agent Instructions',
    description:
      'Special instructions for AI agents (AGENTS.md, .github/agents/, or .claude/agents/)',
    category: 'advanced',
    testStrategy:
      'Check for AGENTS.md, .github/agents/, .claude/agents/, or .factory/droids/ files',
    docsUrl: {
      factory: 'https://docs.factory.ai/cli/configuration/custom-droids',
    },
  },
  {
    id: 'local-memory',
    name: 'Local Memory',
    description: 'Private instructions not committed to git',
    category: 'advanced',
    testStrategy: 'Check for CLAUDE.local.md file',
  },
  {
    id: 'nested-memory',
    name: 'Nested Memory',
    description: 'Instructions for specific subdirectories',
    category: 'advanced',
    testStrategy: 'Check for nested instruction files',
  },
];

/**
 * Complete feature matrix projected from the canonical target contract.
 */
export const FEATURE_MATRIX: FeatureSpec[] = FEATURE_DEFINITIONS.map((feature) => ({
  ...feature,
  tools: Object.fromEntries(
    KNOWN_TARGETS.map((target) => [
      target,
      getTargetFeatureStatus(getTargetCapability(target), feature.id),
    ])
  ) as Record<KnownTarget, FeatureStatus>,
}));

/**
 * Get all features for a specific tool.
 */
export function getToolFeatures(tool: ToolName): FeatureSpec[] {
  return FEATURE_MATRIX.filter((f) => f.tools[tool] === 'supported' || f.tools[tool] === 'partial');
}

/**
 * Get features that are planned but not yet implemented for a tool.
 */
export function getPlannedFeatures(tool: ToolName): FeatureSpec[] {
  return FEATURE_MATRIX.filter((f) => f.tools[tool] === 'planned');
}

/**
 * Get features by category.
 */
export function getFeaturesByCategory(category: FeatureCategory): FeatureSpec[] {
  return FEATURE_MATRIX.filter((f) => f.category === category);
}

/**
 * Check if a tool supports a specific feature.
 */
export function toolSupportsFeature(tool: ToolName, featureId: string): boolean {
  const feature = FEATURE_MATRIX.find((f) => f.id === featureId);
  if (!feature) return false;
  return feature.tools[tool] === 'supported' || feature.tools[tool] === 'partial';
}

/**
 * Get feature coverage summary for a tool.
 */
export interface FeatureCoverageSummary {
  tool: ToolName;
  supported: number;
  partial: number;
  planned: number;
  notSupported: number;
  total: number;
  coveragePercent: number;
}

export function getFeatureCoverage(tool: ToolName): FeatureCoverageSummary {
  const supported = FEATURE_MATRIX.filter((f) => f.tools[tool] === 'supported').length;
  const partial = FEATURE_MATRIX.filter((f) => f.tools[tool] === 'partial').length;
  const planned = FEATURE_MATRIX.filter((f) => f.tools[tool] === 'planned').length;
  const notSupported = FEATURE_MATRIX.filter((f) => f.tools[tool] === 'not-supported').length;
  const total = FEATURE_MATRIX.length;

  return {
    tool,
    supported,
    partial,
    planned,
    notSupported,
    total,
    coveragePercent: Math.round(((supported + partial * 0.5) / total) * 100),
  };
}

/**
 * Get comparison matrix between tools.
 */
export function getToolComparison(): Record<string, Partial<Record<ToolName, FeatureStatus>>> {
  const comparison: Record<string, Partial<Record<ToolName, FeatureStatus>>> = {};

  for (const feature of FEATURE_MATRIX) {
    comparison[feature.id] = { ...feature.tools };
  }

  return comparison;
}

/**
 * Generate feature matrix report as markdown.
 */
export function generateFeatureMatrixReport(): string {
  const lines: string[] = [
    '# Feature Coverage Matrix',
    '',
    '| Feature | GitHub | Cursor | Claude | Antigravity | Factory | OpenCode | Gemini |',
    '|---------|--------|--------|--------|-------------|---------|----------|--------|',
  ];

  for (const feature of FEATURE_MATRIX) {
    const statusEmoji = (status: FeatureStatus | undefined): string => {
      switch (status) {
        case 'supported':
          return '✅';
        case 'partial':
          return '⚠️';
        case 'planned':
          return '📋';
        case 'not-supported':
          return '❌';
        default:
          return '-';
      }
    };

    lines.push(
      `| ${feature.name} | ${statusEmoji(feature.tools.github)} | ${statusEmoji(feature.tools.cursor)} | ${statusEmoji(feature.tools.claude)} | ${statusEmoji(feature.tools.antigravity)} | ${statusEmoji(feature.tools.factory)} | ${statusEmoji(feature.tools.opencode)} | ${statusEmoji(feature.tools.gemini)} |`
    );
  }

  lines.push('');
  lines.push('**Legend:** ✅ Supported | ⚠️ Partial | 📋 Planned | ❌ Not Supported');

  return lines.join('\n');
}
