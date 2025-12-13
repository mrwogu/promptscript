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

/**
 * Tool/Formatter names.
 */
export type ToolName = 'github' | 'cursor' | 'claude' | 'antigravity';

/**
 * Feature implementation status.
 */
export type FeatureStatus =
  | 'supported' // Tool supports, formatter implements
  | 'not-supported' // Tool doesn't support this feature
  | 'planned' // Tool supports, formatter doesn't implement yet
  | 'partial'; // Partially implemented

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
  /** Support status per tool */
  tools: Record<ToolName, FeatureStatus>;
  /** How to test this feature */
  testStrategy?: string;
  /** Link to tool documentation */
  docsUrl?: Record<ToolName, string>;
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
export const FEATURE_MATRIX: FeatureSpec[] = [
  // === Output Format ===
  {
    id: 'markdown-output',
    name: 'Markdown Output',
    description: 'Basic Markdown formatting for rules',
    category: 'output-format',
    tools: {
      github: 'supported',
      cursor: 'supported',
      claude: 'supported',
      antigravity: 'supported',
    },
  },
  {
    id: 'mdc-format',
    name: 'MDC Format',
    description: 'Markdown Components format with enhanced features',
    category: 'output-format',
    tools: {
      github: 'not-supported',
      cursor: 'supported',
      claude: 'not-supported',
      antigravity: 'not-supported',
    },
  },
  {
    id: 'code-blocks',
    name: 'Code Blocks',
    description: 'Fenced code blocks with syntax highlighting',
    category: 'output-format',
    tools: {
      github: 'supported',
      cursor: 'supported',
      claude: 'supported',
      antigravity: 'supported',
    },
  },
  {
    id: 'mermaid-diagrams',
    name: 'Mermaid Diagrams',
    description: 'Mermaid diagram rendering in code blocks',
    category: 'output-format',
    tools: {
      github: 'supported',
      cursor: 'supported',
      claude: 'supported',
      antigravity: 'supported',
    },
  },

  // === File Structure ===
  {
    id: 'single-file',
    name: 'Single File Output',
    description: 'Output to a single rules file',
    category: 'file-structure',
    tools: {
      github: 'supported',
      cursor: 'supported',
      claude: 'supported',
      antigravity: 'supported',
    },
  },
  {
    id: 'multi-file-rules',
    name: 'Multiple Rule Files',
    description: 'Split rules into multiple files by concern',
    category: 'file-structure',
    tools: {
      github: 'not-supported',
      cursor: 'supported',
      claude: 'not-supported',
      antigravity: 'supported',
    },
    testStrategy: 'Check additionalFiles in FormatterOutput',
  },
  {
    id: 'workflows',
    name: 'Workflow Files',
    description: 'Separate workflow/automation files',
    category: 'file-structure',
    tools: {
      github: 'not-supported',
      cursor: 'not-supported',
      claude: 'not-supported',
      antigravity: 'supported',
    },
    testStrategy: 'Check for .agent/workflows/ output',
  },
  {
    id: 'nested-directories',
    name: 'Nested Directory Structure',
    description: 'Support for nested rule directories',
    category: 'file-structure',
    tools: {
      github: 'not-supported',
      cursor: 'supported',
      claude: 'not-supported',
      antigravity: 'supported',
    },
  },

  // === Metadata ===
  {
    id: 'yaml-frontmatter',
    name: 'YAML Frontmatter',
    description: 'YAML metadata block at start of file',
    category: 'metadata',
    tools: {
      github: 'not-supported',
      cursor: 'supported',
      claude: 'not-supported',
      antigravity: 'supported',
    },
    testStrategy: 'Check for --- delimited YAML block',
  },
  {
    id: 'frontmatter-description',
    name: 'Description in Frontmatter',
    description: 'Rule description in frontmatter metadata',
    category: 'metadata',
    tools: {
      github: 'not-supported',
      cursor: 'supported',
      claude: 'not-supported',
      antigravity: 'supported',
    },
  },
  {
    id: 'frontmatter-globs',
    name: 'Globs in Frontmatter',
    description: 'File glob patterns in frontmatter',
    category: 'metadata',
    tools: {
      github: 'not-supported',
      cursor: 'supported',
      claude: 'not-supported',
      antigravity: 'supported',
    },
  },
  {
    id: 'activation-type',
    name: 'Activation Type',
    description: 'Control when rules are activated (always, manual, auto)',
    category: 'metadata',
    tools: {
      github: 'not-supported',
      cursor: 'supported',
      claude: 'not-supported',
      antigravity: 'supported',
    },
  },

  // === Targeting ===
  {
    id: 'glob-patterns',
    name: 'Glob Pattern Targeting',
    description: 'Apply rules to files matching glob patterns',
    category: 'targeting',
    tools: {
      github: 'not-supported',
      cursor: 'supported',
      claude: 'not-supported',
      antigravity: 'supported',
    },
    testStrategy: 'Check globs field in frontmatter',
  },
  {
    id: 'always-apply',
    name: 'Always Apply Rules',
    description: 'Rules that always apply regardless of context',
    category: 'targeting',
    tools: {
      github: 'supported', // All rules always apply
      cursor: 'supported',
      claude: 'supported', // All rules always apply
      antigravity: 'supported',
    },
  },
  {
    id: 'manual-activation',
    name: 'Manual Activation',
    description: 'Rules activated manually by user',
    category: 'targeting',
    tools: {
      github: 'not-supported',
      cursor: 'supported',
      claude: 'not-supported',
      antigravity: 'supported',
    },
  },
  {
    id: 'auto-activation',
    name: 'Auto/Model Activation',
    description: 'Rules activated automatically by AI model',
    category: 'targeting',
    tools: {
      github: 'not-supported',
      cursor: 'supported',
      claude: 'not-supported',
      antigravity: 'supported',
    },
  },

  // === Content Features ===
  {
    id: 'character-limit',
    name: 'Character Limit Validation',
    description: 'Validate content against tool character limits',
    category: 'content',
    tools: {
      github: 'not-supported', // No known limit
      cursor: 'not-supported', // No known limit
      claude: 'not-supported', // No known limit
      antigravity: 'supported', // 12,000 chars
    },
    testStrategy: 'Check warning for content > limit',
  },
  {
    id: 'sections-splitting',
    name: 'Content Section Splitting',
    description: 'Split large content into logical sections',
    category: 'content',
    tools: {
      github: 'supported',
      cursor: 'supported',
      claude: 'supported',
      antigravity: 'supported',
    },
  },

  // === Advanced Features ===
  {
    id: 'context-inclusion',
    name: 'Context File Inclusion',
    description: 'Include other files as context (@file, @folder)',
    category: 'advanced',
    tools: {
      github: 'not-supported',
      cursor: 'supported',
      claude: 'not-supported',
      antigravity: 'not-supported',
    },
    testStrategy: 'Check for @file/@folder references',
  },
  {
    id: 'at-mentions',
    name: '@-Mentions',
    description: 'Reference files/symbols with @ syntax',
    category: 'advanced',
    tools: {
      github: 'not-supported',
      cursor: 'supported',
      claude: 'not-supported',
      antigravity: 'not-supported',
    },
  },
  {
    id: 'tool-integration',
    name: 'Tool Integration',
    description: 'Integration with external tools/commands',
    category: 'advanced',
    tools: {
      github: 'not-supported',
      cursor: 'partial', // Via terminal
      claude: 'not-supported',
      antigravity: 'not-supported',
    },
  },
];

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
export function getToolComparison(): Record<string, Record<ToolName, FeatureStatus>> {
  const comparison: Record<string, Record<ToolName, FeatureStatus>> = {};

  for (const feature of FEATURE_MATRIX) {
    comparison[feature.id] = { ...feature.tools };
  }

  return comparison;
}

/**
 * Identify feature gaps - features supported by tool but not implemented.
 */
export function identifyFeatureGaps(tool: ToolName): FeatureSpec[] {
  return FEATURE_MATRIX.filter((f) => f.tools[tool] === 'planned');
}

/**
 * Generate feature matrix report as markdown.
 */
export function generateFeatureMatrixReport(): string {
  const lines: string[] = [
    '# Feature Coverage Matrix',
    '',
    '| Feature | GitHub | Cursor | Claude | Antigravity |',
    '|---------|--------|--------|--------|-------------|',
  ];

  for (const feature of FEATURE_MATRIX) {
    const statusEmoji = (status: FeatureStatus): string => {
      switch (status) {
        case 'supported':
          return '✅';
        case 'partial':
          return '⚠️';
        case 'planned':
          return '📋';
        case 'not-supported':
          return '❌';
      }
    };

    lines.push(
      `| ${feature.name} | ${statusEmoji(feature.tools.github)} | ${statusEmoji(feature.tools.cursor)} | ${statusEmoji(feature.tools.claude)} | ${statusEmoji(feature.tools.antigravity)} |`
    );
  }

  lines.push('');
  lines.push('**Legend:** ✅ Supported | ⚠️ Partial | 📋 Planned | ❌ Not Supported');

  return lines.join('\n');
}
