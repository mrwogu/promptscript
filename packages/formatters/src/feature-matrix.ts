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
export type ToolName =
  // Original 7
  | 'github'
  | 'cursor'
  | 'claude'
  | 'antigravity'
  | 'factory'
  | 'opencode'
  | 'gemini'
  // Tier 1
  | 'windsurf'
  | 'cline'
  | 'roo'
  | 'codex'
  | 'continue'
  // Tier 2
  | 'augment'
  | 'goose'
  | 'kilo'
  | 'amp'
  | 'trae'
  | 'junie'
  | 'kiro'
  // Tier 3
  | 'cortex'
  | 'crush'
  | 'command-code'
  | 'kode'
  | 'mcpjam'
  | 'mistral-vibe'
  | 'mux'
  | 'openhands'
  | 'pi'
  | 'qoder'
  | 'qwen-code'
  | 'zencoder'
  | 'neovate'
  | 'pochi'
  | 'adal'
  | 'iflow'
  | 'openclaw'
  | 'codebuddy';

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
  /** Support status per tool (only tracked tools need entries) */
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
export const FEATURE_MATRIX: FeatureSpec[] = [
  // === Output Format ===
  {
    id: 'markdown-output',
    name: 'Markdown Output',
    description: 'Basic Markdown formatting for rules',
    category: 'output-format',
    tools: {
      // Tier 0
      github: 'supported',
      cursor: 'supported',
      claude: 'supported',
      antigravity: 'supported',
      factory: 'supported',
      opencode: 'supported',
      gemini: 'supported',
      // Tier 1
      windsurf: 'supported',
      cline: 'supported',
      roo: 'supported',
      codex: 'supported',
      continue: 'supported',
      // Tier 2
      augment: 'supported',
      goose: 'supported',
      kilo: 'supported',
      amp: 'supported',
      trae: 'supported',
      junie: 'supported',
      kiro: 'supported',
      // Tier 3
      cortex: 'supported',
      crush: 'supported',
      'command-code': 'supported',
      kode: 'supported',
      mcpjam: 'supported',
      'mistral-vibe': 'supported',
      mux: 'supported',
      openhands: 'supported',
      pi: 'supported',
      qoder: 'supported',
      'qwen-code': 'supported',
      zencoder: 'supported',
      neovate: 'supported',
      pochi: 'supported',
      adal: 'supported',
      iflow: 'supported',
      openclaw: 'supported',
      codebuddy: 'supported',
    },
  },
  {
    id: 'mdc-format',
    name: 'MDC Format',
    description: 'Markdown Components format with enhanced features',
    category: 'output-format',
    tools: {
      // Tier 0
      github: 'not-supported',
      cursor: 'supported',
      claude: 'not-supported',
      antigravity: 'not-supported',
      factory: 'not-supported',
      opencode: 'not-supported',
      gemini: 'not-supported',
      // Tier 1
      windsurf: 'not-supported',
      cline: 'not-supported',
      roo: 'not-supported',
      codex: 'not-supported',
      continue: 'not-supported',
      // Tier 2
      augment: 'not-supported',
      goose: 'not-supported',
      kilo: 'not-supported',
      amp: 'not-supported',
      trae: 'not-supported',
      junie: 'not-supported',
      kiro: 'not-supported',
      // Tier 3
      cortex: 'not-supported',
      crush: 'not-supported',
      'command-code': 'not-supported',
      kode: 'not-supported',
      mcpjam: 'not-supported',
      'mistral-vibe': 'not-supported',
      mux: 'not-supported',
      openhands: 'not-supported',
      pi: 'not-supported',
      qoder: 'not-supported',
      'qwen-code': 'not-supported',
      zencoder: 'supported',
      neovate: 'not-supported',
      pochi: 'not-supported',
      adal: 'not-supported',
      iflow: 'not-supported',
      openclaw: 'not-supported',
      codebuddy: 'not-supported',
    },
  },
  {
    id: 'code-blocks',
    name: 'Code Blocks',
    description: 'Fenced code blocks with syntax highlighting',
    category: 'output-format',
    tools: {
      // Tier 0
      github: 'supported',
      cursor: 'supported',
      claude: 'supported',
      antigravity: 'supported',
      factory: 'supported',
      opencode: 'supported',
      gemini: 'supported',
      // Tier 1
      windsurf: 'supported',
      cline: 'supported',
      roo: 'supported',
      codex: 'supported',
      continue: 'supported',
      // Tier 2
      augment: 'supported',
      goose: 'supported',
      kilo: 'supported',
      amp: 'supported',
      trae: 'supported',
      junie: 'supported',
      kiro: 'supported',
      // Tier 3
      cortex: 'supported',
      crush: 'supported',
      'command-code': 'supported',
      kode: 'supported',
      mcpjam: 'supported',
      'mistral-vibe': 'supported',
      mux: 'supported',
      openhands: 'supported',
      pi: 'supported',
      qoder: 'supported',
      'qwen-code': 'supported',
      zencoder: 'supported',
      neovate: 'supported',
      pochi: 'supported',
      adal: 'supported',
      iflow: 'supported',
      openclaw: 'supported',
      codebuddy: 'supported',
    },
  },
  {
    id: 'mermaid-diagrams',
    name: 'Mermaid Diagrams',
    description: 'Mermaid diagram rendering in code blocks',
    category: 'output-format',
    tools: {
      // Tier 0
      github: 'supported',
      cursor: 'supported',
      claude: 'supported',
      antigravity: 'supported',
      factory: 'supported',
      opencode: 'supported',
      gemini: 'supported',
      // Tier 1
      windsurf: 'supported',
      cline: 'supported',
      roo: 'supported',
      codex: 'not-supported',
      continue: 'not-supported',
      // Tier 2
      augment: 'supported',
      goose: 'not-supported',
      kilo: 'supported',
      amp: 'supported',
      trae: 'supported',
      junie: 'supported',
      kiro: 'not-supported',
      // Tier 3
      cortex: 'not-supported',
      crush: 'not-supported',
      'command-code': 'not-supported',
      kode: 'not-supported',
      mcpjam: 'not-supported',
      'mistral-vibe': 'not-supported',
      mux: 'not-supported',
      openhands: 'supported',
      pi: 'not-supported',
      qoder: 'not-supported',
      'qwen-code': 'supported',
      zencoder: 'supported',
      neovate: 'supported',
      pochi: 'not-supported',
      adal: 'not-supported',
      iflow: 'not-supported',
      openclaw: 'not-supported',
      codebuddy: 'not-supported',
    },
  },

  // === File Structure ===
  {
    id: 'single-file',
    name: 'Single File Output',
    description: 'Output to a single rules file',
    category: 'file-structure',
    tools: {
      // Tier 0
      github: 'supported',
      cursor: 'supported',
      claude: 'supported',
      antigravity: 'supported',
      factory: 'supported',
      opencode: 'supported',
      gemini: 'supported',
      // Tier 1
      windsurf: 'supported',
      cline: 'supported',
      roo: 'supported',
      codex: 'supported',
      continue: 'supported',
      // Tier 2
      augment: 'supported',
      goose: 'supported',
      kilo: 'supported',
      amp: 'supported',
      trae: 'supported',
      junie: 'supported',
      kiro: 'supported',
      // Tier 3
      cortex: 'supported',
      crush: 'supported',
      'command-code': 'supported',
      kode: 'supported',
      mcpjam: 'supported',
      'mistral-vibe': 'supported',
      mux: 'supported',
      openhands: 'supported',
      pi: 'supported',
      qoder: 'supported',
      'qwen-code': 'supported',
      zencoder: 'supported',
      neovate: 'supported',
      pochi: 'supported',
      adal: 'supported',
      iflow: 'supported',
      openclaw: 'supported',
      codebuddy: 'supported',
    },
  },
  {
    id: 'multi-file-rules',
    name: 'Multiple Rule Files',
    description: 'Split rules into multiple files by concern',
    category: 'file-structure',
    tools: {
      // Tier 0
      github: 'supported', // .github/instructions/*.instructions.md (multifile mode)
      cursor: 'supported',
      claude: 'supported', // .claude/rules/*.md (multifile mode)
      antigravity: 'supported',
      factory: 'supported',
      opencode: 'supported', // .opencode/commands/, skills/, agents/
      gemini: 'supported', // .gemini/commands/, skills/
      // Tier 1
      windsurf: 'not-supported',
      cline: 'planned',
      roo: 'planned',
      codex: 'not-supported',
      continue: 'planned',
      // Tier 2
      augment: 'supported',
      goose: 'not-supported',
      kilo: 'supported',
      amp: 'supported',
      trae: 'not-supported',
      junie: 'not-supported',
      kiro: 'planned',
      // Tier 3
      cortex: 'supported',
      crush: 'not-supported',
      'command-code': 'supported',
      kode: 'not-supported',
      mcpjam: 'not-supported',
      'mistral-vibe': 'supported',
      mux: 'not-supported',
      openhands: 'supported',
      pi: 'not-supported',
      qoder: 'not-supported',
      'qwen-code': 'supported',
      zencoder: 'supported',
      neovate: 'partial',
      pochi: 'not-supported',
      adal: 'not-supported',
      iflow: 'not-supported',
      openclaw: 'not-supported',
      codebuddy: 'not-supported',
    },
    testStrategy: 'Check additionalFiles in FormatterOutput',
  },
  {
    id: 'workflows',
    name: 'Workflow Files',
    description: 'Separate workflow/automation files',
    category: 'file-structure',
    tools: {
      // Tier 0
      github: 'not-supported',
      cursor: 'not-supported',
      claude: 'not-supported',
      antigravity: 'supported',
      factory: 'not-supported',
      opencode: 'not-supported',
      gemini: 'not-supported',
      // Tier 1
      windsurf: 'not-supported',
      cline: 'not-supported',
      roo: 'not-supported',
      codex: 'not-supported',
      continue: 'not-supported',
      // Tier 2
      augment: 'not-supported',
      goose: 'not-supported',
      kilo: 'not-supported',
      amp: 'not-supported',
      trae: 'not-supported',
      junie: 'not-supported',
      kiro: 'not-supported',
      // Tier 3
      cortex: 'not-supported',
      crush: 'not-supported',
      'command-code': 'not-supported',
      kode: 'not-supported',
      mcpjam: 'not-supported',
      'mistral-vibe': 'not-supported',
      mux: 'not-supported',
      openhands: 'not-supported',
      pi: 'not-supported',
      qoder: 'not-supported',
      'qwen-code': 'not-supported',
      zencoder: 'not-supported',
      neovate: 'not-supported',
      pochi: 'not-supported',
      adal: 'not-supported',
      iflow: 'not-supported',
      openclaw: 'not-supported',
      codebuddy: 'not-supported',
    },
    testStrategy: 'Check for .agent/workflows/ output',
  },
  {
    id: 'nested-directories',
    name: 'Nested Directory Structure',
    description: 'Support for nested rule directories',
    category: 'file-structure',
    tools: {
      // Tier 0
      github: 'not-supported',
      cursor: 'supported',
      claude: 'not-supported',
      antigravity: 'planned', // was 'supported', downgraded per antigravity-plan.md
      factory: 'not-supported',
      opencode: 'not-supported',
      gemini: 'not-supported',
      // Tier 1
      windsurf: 'not-supported',
      cline: 'not-supported',
      roo: 'supported',
      codex: 'partial',
      continue: 'not-supported',
      // Tier 2
      augment: 'supported',
      goose: 'not-supported',
      kilo: 'partial',
      amp: 'not-supported',
      trae: 'not-supported',
      junie: 'not-supported',
      kiro: 'not-supported',
      // Tier 3
      cortex: 'not-supported',
      crush: 'not-supported',
      'command-code': 'not-supported',
      kode: 'not-supported',
      mcpjam: 'not-supported',
      'mistral-vibe': 'not-supported',
      mux: 'not-supported',
      openhands: 'not-supported',
      pi: 'not-supported',
      qoder: 'not-supported',
      'qwen-code': 'not-supported',
      zencoder: 'not-supported',
      neovate: 'not-supported',
      pochi: 'not-supported',
      adal: 'not-supported',
      iflow: 'not-supported',
      openclaw: 'not-supported',
      codebuddy: 'not-supported',
    },
  },

  // === Metadata ===
  {
    id: 'yaml-frontmatter',
    name: 'YAML Frontmatter',
    description: 'YAML metadata block at start of file',
    category: 'metadata',
    tools: {
      // Tier 0
      github: 'supported', // In .instructions.md and SKILL.md files
      cursor: 'supported',
      claude: 'supported', // In .claude/rules/*.md and skills
      antigravity: 'supported',
      factory: 'supported',
      opencode: 'supported', // In commands, skills, agents
      gemini: 'supported', // In skills (commands use TOML)
      // Tier 1
      windsurf: 'planned',
      cline: 'planned',
      roo: 'not-supported',
      codex: 'not-supported',
      continue: 'planned',
      // Tier 2
      augment: 'supported',
      goose: 'not-supported',
      kilo: 'not-supported',
      amp: 'supported',
      trae: 'not-supported',
      junie: 'not-supported',
      kiro: 'supported',
      // Tier 3
      cortex: 'supported',
      crush: 'not-supported',
      'command-code': 'supported',
      kode: 'not-supported',
      mcpjam: 'not-supported',
      'mistral-vibe': 'supported',
      mux: 'not-supported',
      openhands: 'supported',
      pi: 'not-supported',
      qoder: 'not-supported',
      'qwen-code': 'not-supported',
      zencoder: 'supported',
      neovate: 'not-supported',
      pochi: 'not-supported',
      adal: 'not-supported',
      iflow: 'not-supported',
      openclaw: 'not-supported',
      codebuddy: 'not-supported',
    },
    testStrategy: 'Check for --- delimited YAML block',
  },
  {
    id: 'frontmatter-description',
    name: 'Description in Frontmatter',
    description: 'Rule description in frontmatter metadata',
    category: 'metadata',
    tools: {
      // Tier 0
      github: 'not-supported',
      cursor: 'supported',
      claude: 'not-supported',
      antigravity: 'supported',
      factory: 'supported',
      opencode: 'supported',
      gemini: 'supported',
      // Tier 1
      windsurf: 'not-supported',
      cline: 'not-supported',
      roo: 'not-supported',
      codex: 'not-supported',
      continue: 'planned',
      // Tier 2
      augment: 'supported',
      goose: 'not-supported',
      kilo: 'not-supported',
      amp: 'supported',
      trae: 'not-supported',
      junie: 'not-supported',
      kiro: 'not-supported',
      // Tier 3
      cortex: 'supported',
      crush: 'not-supported',
      'command-code': 'supported',
      kode: 'not-supported',
      mcpjam: 'not-supported',
      'mistral-vibe': 'supported',
      mux: 'not-supported',
      openhands: 'supported',
      pi: 'not-supported',
      qoder: 'not-supported',
      'qwen-code': 'not-supported',
      zencoder: 'supported',
      neovate: 'not-supported',
      pochi: 'not-supported',
      adal: 'not-supported',
      iflow: 'not-supported',
      openclaw: 'not-supported',
      codebuddy: 'not-supported',
    },
  },
  {
    id: 'frontmatter-globs',
    name: 'Globs in Frontmatter',
    description: 'File glob patterns in frontmatter',
    category: 'metadata',
    tools: {
      // Tier 0
      github: 'supported', // applyTo in .instructions.md
      cursor: 'supported',
      claude: 'supported', // paths in .claude/rules/*.md
      antigravity: 'partial', // was 'supported', downgraded per antigravity-plan.md
      factory: 'not-supported',
      opencode: 'not-supported',
      gemini: 'not-supported',
      // Tier 1
      windsurf: 'not-supported',
      cline: 'planned',
      roo: 'not-supported',
      codex: 'not-supported',
      continue: 'planned',
      // Tier 2
      augment: 'not-supported',
      goose: 'not-supported',
      kilo: 'not-supported',
      amp: 'not-supported',
      trae: 'not-supported',
      junie: 'not-supported',
      kiro: 'not-supported',
      // Tier 3
      cortex: 'not-supported',
      crush: 'not-supported',
      'command-code': 'not-supported',
      kode: 'not-supported',
      mcpjam: 'not-supported',
      'mistral-vibe': 'not-supported',
      mux: 'not-supported',
      openhands: 'not-supported',
      pi: 'not-supported',
      qoder: 'not-supported',
      'qwen-code': 'not-supported',
      zencoder: 'supported',
      neovate: 'not-supported',
      pochi: 'not-supported',
      adal: 'not-supported',
      iflow: 'not-supported',
      openclaw: 'not-supported',
      codebuddy: 'not-supported',
    },
  },
  {
    id: 'activation-type',
    name: 'Activation Type',
    description: 'Control when rules are activated (always, manual, auto)',
    category: 'metadata',
    tools: {
      // Tier 0
      github: 'not-supported',
      cursor: 'supported',
      claude: 'not-supported',
      antigravity: 'supported',
      factory: 'not-supported',
      opencode: 'not-supported',
      gemini: 'not-supported',
      // Tier 1
      windsurf: 'planned',
      cline: 'not-supported',
      roo: 'not-supported',
      codex: 'not-supported',
      continue: 'planned',
      // Tier 2
      augment: 'supported',
      goose: 'not-supported',
      kilo: 'not-supported',
      amp: 'not-supported',
      trae: 'not-supported',
      junie: 'not-supported',
      kiro: 'partial',
      // Tier 3
      cortex: 'not-supported',
      crush: 'not-supported',
      'command-code': 'not-supported',
      kode: 'not-supported',
      mcpjam: 'not-supported',
      'mistral-vibe': 'not-supported',
      mux: 'not-supported',
      openhands: 'not-supported',
      pi: 'not-supported',
      qoder: 'not-supported',
      'qwen-code': 'not-supported',
      zencoder: 'supported',
      neovate: 'not-supported',
      pochi: 'not-supported',
      adal: 'not-supported',
      iflow: 'not-supported',
      openclaw: 'not-supported',
      codebuddy: 'not-supported',
    },
  },

  // === Targeting ===
  {
    id: 'glob-patterns',
    name: 'Glob Pattern Targeting',
    description: 'Apply rules to files matching glob patterns',
    category: 'targeting',
    tools: {
      // Tier 0
      github: 'supported', // applyTo in .instructions.md (multifile mode)
      cursor: 'supported',
      claude: 'supported', // paths in .claude/rules/*.md (multifile mode)
      antigravity: 'partial', // was 'supported', downgraded per antigravity-plan.md
      factory: 'not-supported',
      opencode: 'not-supported',
      gemini: 'not-supported',
      // Tier 1
      windsurf: 'not-supported',
      cline: 'planned',
      roo: 'not-supported',
      codex: 'not-supported',
      continue: 'planned',
      // Tier 2
      augment: 'not-supported',
      goose: 'not-supported',
      kilo: 'not-supported',
      amp: 'not-supported',
      trae: 'not-supported',
      junie: 'not-supported',
      kiro: 'not-supported',
      // Tier 3
      cortex: 'not-supported',
      crush: 'not-supported',
      'command-code': 'not-supported',
      kode: 'not-supported',
      mcpjam: 'not-supported',
      'mistral-vibe': 'not-supported',
      mux: 'not-supported',
      openhands: 'not-supported',
      pi: 'not-supported',
      qoder: 'not-supported',
      'qwen-code': 'not-supported',
      zencoder: 'supported',
      neovate: 'not-supported',
      pochi: 'not-supported',
      adal: 'not-supported',
      iflow: 'not-supported',
      openclaw: 'not-supported',
      codebuddy: 'not-supported',
    },
    testStrategy: 'Check globs field in frontmatter',
  },
  {
    id: 'always-apply',
    name: 'Always Apply Rules',
    description: 'Rules that always apply regardless of context',
    category: 'targeting',
    tools: {
      // Tier 0
      github: 'supported', // All rules always apply
      cursor: 'supported',
      claude: 'supported', // All rules always apply
      antigravity: 'supported',
      factory: 'supported',
      opencode: 'supported',
      gemini: 'supported',
      // Tier 1
      windsurf: 'planned',
      cline: 'supported',
      roo: 'supported',
      codex: 'supported',
      continue: 'supported',
      // Tier 2
      augment: 'supported',
      goose: 'supported',
      kilo: 'supported',
      amp: 'supported',
      trae: 'not-supported',
      junie: 'supported',
      kiro: 'supported',
      // Tier 3
      cortex: 'supported',
      crush: 'supported',
      'command-code': 'supported',
      kode: 'supported',
      mcpjam: 'supported',
      'mistral-vibe': 'supported',
      mux: 'supported',
      openhands: 'supported',
      pi: 'supported',
      qoder: 'supported',
      'qwen-code': 'supported',
      zencoder: 'supported',
      neovate: 'supported',
      pochi: 'supported',
      adal: 'supported',
      iflow: 'supported',
      openclaw: 'supported',
      codebuddy: 'supported',
    },
  },
  {
    id: 'manual-activation',
    name: 'Manual Activation',
    description: 'Rules activated manually by user',
    category: 'targeting',
    tools: {
      // Tier 0
      github: 'not-supported',
      cursor: 'partial', // was 'supported', downgraded per cursor-plan.md
      claude: 'not-supported',
      antigravity: 'planned', // was 'supported', downgraded per antigravity-plan.md
      factory: 'not-supported',
      opencode: 'not-supported',
      gemini: 'not-supported',
      // Tier 1
      windsurf: 'not-supported',
      cline: 'not-supported',
      roo: 'not-supported',
      codex: 'not-supported',
      continue: 'not-supported',
      // Tier 2
      augment: 'supported',
      goose: 'not-supported',
      kilo: 'not-supported',
      amp: 'not-supported',
      trae: 'not-supported',
      junie: 'not-supported',
      kiro: 'not-supported',
      // Tier 3
      cortex: 'not-supported',
      crush: 'not-supported',
      'command-code': 'not-supported',
      kode: 'not-supported',
      mcpjam: 'not-supported',
      'mistral-vibe': 'not-supported',
      mux: 'not-supported',
      openhands: 'not-supported',
      pi: 'not-supported',
      qoder: 'not-supported',
      'qwen-code': 'not-supported',
      zencoder: 'supported',
      neovate: 'not-supported',
      pochi: 'not-supported',
      adal: 'not-supported',
      iflow: 'not-supported',
      openclaw: 'not-supported',
      codebuddy: 'not-supported',
    },
  },
  {
    id: 'auto-activation',
    name: 'Auto/Model Activation',
    description: 'Rules activated automatically by AI model',
    category: 'targeting',
    tools: {
      // Tier 0
      github: 'not-supported',
      cursor: 'partial', // was 'supported', downgraded per cursor-plan.md
      claude: 'not-supported',
      antigravity: 'planned', // was 'supported', downgraded per antigravity-plan.md
      factory: 'not-supported',
      opencode: 'not-supported',
      gemini: 'not-supported',
      // Tier 1
      windsurf: 'not-supported',
      cline: 'not-supported',
      roo: 'not-supported',
      codex: 'not-supported',
      continue: 'planned',
      // Tier 2
      augment: 'supported',
      goose: 'not-supported',
      kilo: 'not-supported',
      amp: 'not-supported',
      trae: 'not-supported',
      junie: 'not-supported',
      kiro: 'not-supported',
      // Tier 3
      cortex: 'not-supported',
      crush: 'not-supported',
      'command-code': 'not-supported',
      kode: 'not-supported',
      mcpjam: 'not-supported',
      'mistral-vibe': 'not-supported',
      mux: 'not-supported',
      openhands: 'not-supported',
      pi: 'not-supported',
      qoder: 'not-supported',
      'qwen-code': 'not-supported',
      zencoder: 'not-supported',
      neovate: 'not-supported',
      pochi: 'not-supported',
      adal: 'not-supported',
      iflow: 'not-supported',
      openclaw: 'not-supported',
      codebuddy: 'not-supported',
    },
  },

  // === Content Features ===
  {
    id: 'character-limit',
    name: 'Character Limit Validation',
    description: 'Validate content against tool character limits',
    category: 'content',
    tools: {
      // Tier 0
      github: 'planned', // was 'not-supported', updated per github-plan.md
      cursor: 'not-supported', // No known limit
      claude: 'not-supported', // No known limit
      antigravity: 'supported', // 12,000 chars
      factory: 'not-supported',
      opencode: 'not-supported',
      gemini: 'not-supported',
      // Tier 1
      windsurf: 'not-supported',
      cline: 'not-supported',
      roo: 'not-supported',
      codex: 'not-supported',
      continue: 'not-supported',
      // Tier 2
      augment: 'supported',
      goose: 'not-supported',
      kilo: 'not-supported',
      amp: 'not-supported',
      trae: 'not-supported',
      junie: 'not-supported',
      kiro: 'not-supported',
      // Tier 3
      cortex: 'not-supported',
      crush: 'not-supported',
      'command-code': 'not-supported',
      kode: 'not-supported',
      mcpjam: 'not-supported',
      'mistral-vibe': 'not-supported',
      mux: 'not-supported',
      openhands: 'not-supported',
      pi: 'not-supported',
      qoder: 'not-supported',
      'qwen-code': 'not-supported',
      zencoder: 'not-supported',
      neovate: 'not-supported',
      pochi: 'not-supported',
      adal: 'not-supported',
      iflow: 'not-supported',
      openclaw: 'not-supported',
      codebuddy: 'not-supported',
    },
    testStrategy: 'Check warning for content > limit',
  },
  {
    id: 'sections-splitting',
    name: 'Content Section Splitting',
    description: 'Split large content into logical sections',
    category: 'content',
    tools: {
      // Tier 0
      github: 'supported',
      cursor: 'supported',
      claude: 'supported',
      antigravity: 'supported',
      factory: 'supported',
      opencode: 'supported',
      gemini: 'supported',
      // Tier 1
      windsurf: 'supported',
      cline: 'supported',
      roo: 'supported',
      codex: 'supported',
      continue: 'planned',
      // Tier 2
      augment: 'supported',
      goose: 'supported',
      kilo: 'supported',
      amp: 'supported',
      trae: 'supported',
      junie: 'not-supported',
      kiro: 'supported',
      // Tier 3
      cortex: 'supported',
      crush: 'supported',
      'command-code': 'supported',
      kode: 'supported',
      mcpjam: 'supported',
      'mistral-vibe': 'supported',
      mux: 'supported',
      openhands: 'supported',
      pi: 'supported',
      qoder: 'supported',
      'qwen-code': 'supported',
      zencoder: 'supported',
      neovate: 'supported',
      pochi: 'supported',
      adal: 'supported',
      iflow: 'supported',
      openclaw: 'supported',
      codebuddy: 'supported',
    },
  },

  // === Advanced Features ===
  {
    id: 'context-inclusion',
    name: 'Context File Inclusion',
    description: 'Include other files as context (@file, @folder)',
    category: 'advanced',
    tools: {
      // Tier 0
      github: 'not-supported',
      cursor: 'supported',
      claude: 'planned', // was 'not-supported', updated per claude-plan.md
      antigravity: 'not-supported',
      factory: 'not-supported',
      opencode: 'not-supported',
      gemini: 'not-supported',
      // Tier 1
      windsurf: 'not-supported',
      cline: 'not-supported',
      roo: 'not-supported',
      codex: 'not-supported',
      continue: 'not-supported',
      // Tier 2
      augment: 'not-supported',
      goose: 'not-supported',
      kilo: 'not-supported',
      amp: 'not-supported',
      trae: 'not-supported',
      junie: 'not-supported',
      kiro: 'not-supported',
      // Tier 3
      cortex: 'not-supported',
      crush: 'not-supported',
      'command-code': 'not-supported',
      kode: 'not-supported',
      mcpjam: 'not-supported',
      'mistral-vibe': 'not-supported',
      mux: 'not-supported',
      openhands: 'not-supported',
      pi: 'not-supported',
      qoder: 'not-supported',
      'qwen-code': 'not-supported',
      zencoder: 'not-supported',
      neovate: 'not-supported',
      pochi: 'not-supported',
      adal: 'not-supported',
      iflow: 'not-supported',
      openclaw: 'not-supported',
      codebuddy: 'not-supported',
    },
    testStrategy: 'Check for @file/@folder references',
  },
  {
    id: 'at-mentions',
    name: '@-Mentions',
    description: 'Reference files/symbols with @ syntax',
    category: 'advanced',
    tools: {
      // Tier 0
      github: 'not-supported',
      cursor: 'planned', // was 'supported', downgraded per cursor-plan.md
      claude: 'not-supported',
      antigravity: 'not-supported',
      factory: 'not-supported',
      opencode: 'not-supported',
      gemini: 'not-supported',
      // Tier 1
      windsurf: 'not-supported',
      cline: 'not-supported',
      roo: 'not-supported',
      codex: 'not-supported',
      continue: 'not-supported',
      // Tier 2
      augment: 'supported',
      goose: 'not-supported',
      kilo: 'not-supported',
      amp: 'not-supported',
      trae: 'not-supported',
      junie: 'not-supported',
      kiro: 'not-supported',
      // Tier 3
      cortex: 'not-supported',
      crush: 'not-supported',
      'command-code': 'not-supported',
      kode: 'not-supported',
      mcpjam: 'not-supported',
      'mistral-vibe': 'not-supported',
      mux: 'not-supported',
      openhands: 'not-supported',
      pi: 'not-supported',
      qoder: 'not-supported',
      'qwen-code': 'not-supported',
      zencoder: 'supported',
      neovate: 'not-supported',
      pochi: 'not-supported',
      adal: 'not-supported',
      iflow: 'not-supported',
      openclaw: 'not-supported',
      codebuddy: 'not-supported',
    },
  },
  {
    id: 'tool-integration',
    name: 'Tool Integration',
    description: 'Integration with external tools/commands',
    category: 'advanced',
    tools: {
      // Tier 0
      github: 'not-supported',
      cursor: 'partial', // Via terminal
      claude: 'supported', // was 'not-supported', updated per claude-plan.md
      antigravity: 'not-supported',
      factory: 'not-supported',
      opencode: 'not-supported',
      gemini: 'not-supported',
      // Tier 1
      windsurf: 'not-supported',
      cline: 'not-supported',
      roo: 'not-supported',
      codex: 'not-supported',
      continue: 'not-supported',
      // Tier 2
      augment: 'supported',
      goose: 'not-supported',
      kilo: 'not-supported',
      amp: 'not-supported',
      trae: 'not-supported',
      junie: 'not-supported',
      kiro: 'not-supported',
      // Tier 3
      cortex: 'not-supported',
      crush: 'not-supported',
      'command-code': 'not-supported',
      kode: 'not-supported',
      mcpjam: 'not-supported',
      'mistral-vibe': 'not-supported',
      mux: 'not-supported',
      openhands: 'not-supported',
      pi: 'not-supported',
      qoder: 'not-supported',
      'qwen-code': 'not-supported',
      zencoder: 'not-supported',
      neovate: 'not-supported',
      pochi: 'not-supported',
      adal: 'not-supported',
      iflow: 'not-supported',
      openclaw: 'not-supported',
      codebuddy: 'not-supported',
    },
  },
  {
    id: 'path-specific-rules',
    name: 'Path-Specific Rules',
    description: 'Rules with glob patterns targeting specific file paths',
    category: 'advanced',
    tools: {
      // Tier 0
      github: 'supported', // .github/instructions/*.instructions.md with applyTo
      cursor: 'supported', // globs in frontmatter
      claude: 'supported', // .claude/rules/*.md with paths frontmatter
      antigravity: 'supported',
      factory: 'not-supported',
      opencode: 'not-supported',
      gemini: 'not-supported',
      // Tier 1
      windsurf: 'not-supported',
      cline: 'planned',
      roo: 'not-supported',
      codex: 'partial',
      continue: 'planned',
      // Tier 2
      augment: 'not-supported',
      goose: 'not-supported',
      kilo: 'partial',
      amp: 'not-supported',
      trae: 'not-supported',
      junie: 'not-supported',
      kiro: 'not-supported',
      // Tier 3
      cortex: 'not-supported',
      crush: 'not-supported',
      'command-code': 'not-supported',
      kode: 'not-supported',
      mcpjam: 'not-supported',
      'mistral-vibe': 'not-supported',
      mux: 'not-supported',
      openhands: 'not-supported',
      pi: 'not-supported',
      qoder: 'not-supported',
      'qwen-code': 'not-supported',
      zencoder: 'supported',
      neovate: 'not-supported',
      pochi: 'not-supported',
      adal: 'not-supported',
      iflow: 'not-supported',
      openclaw: 'not-supported',
      codebuddy: 'not-supported',
    },
    testStrategy: 'Check for path-specific files with glob patterns in frontmatter',
  },
  {
    id: 'prompt-files',
    name: 'Prompt Files',
    description: 'Reusable prompt templates for IDE integration',
    category: 'advanced',
    tools: {
      // Tier 0
      github: 'supported', // .github/prompts/*.prompt.md
      cursor: 'not-supported',
      claude: 'not-supported',
      antigravity: 'not-supported',
      factory: 'not-supported',
      opencode: 'not-supported',
      gemini: 'not-supported',
      // Tier 1
      windsurf: 'not-supported',
      cline: 'not-supported',
      roo: 'not-supported',
      codex: 'not-supported',
      continue: 'not-supported',
      // Tier 2
      augment: 'not-supported',
      goose: 'not-supported',
      kilo: 'not-supported',
      amp: 'not-supported',
      trae: 'not-supported',
      junie: 'not-supported',
      kiro: 'not-supported',
      // Tier 3
      cortex: 'not-supported',
      crush: 'not-supported',
      'command-code': 'not-supported',
      kode: 'not-supported',
      mcpjam: 'not-supported',
      'mistral-vibe': 'not-supported',
      mux: 'not-supported',
      openhands: 'not-supported',
      pi: 'not-supported',
      qoder: 'not-supported',
      'qwen-code': 'not-supported',
      zencoder: 'not-supported',
      neovate: 'not-supported',
      pochi: 'not-supported',
      adal: 'not-supported',
      iflow: 'not-supported',
      openclaw: 'not-supported',
      codebuddy: 'not-supported',
    },
    testStrategy: 'Check for .github/prompts/*.prompt.md files',
  },
  {
    id: 'slash-commands',
    name: 'Slash Commands',
    description: 'Executable slash commands invokable via / in chat',
    category: 'advanced',
    tools: {
      // Tier 0
      github: 'supported', // .github/prompts/*.prompt.md (shortcut with prompt: true)
      cursor: 'supported', // .cursor/commands/*.md (multi-line @shortcuts)
      claude: 'supported', // .claude/skills/<name>/SKILL.md (via @skills block)
      antigravity: 'supported', // .agent/workflows/*.yaml (via @shortcuts with steps)
      factory: 'supported', // .factory/skills/<name>/SKILL.md
      opencode: 'supported', // .opencode/commands/<name>.md
      gemini: 'supported', // .gemini/commands/<name>.toml
      // Tier 1
      windsurf: 'not-supported',
      cline: 'not-supported',
      roo: 'not-supported',
      codex: 'not-supported',
      continue: 'not-supported',
      // Tier 2
      augment: 'not-supported',
      goose: 'not-supported',
      kilo: 'not-supported',
      amp: 'not-supported',
      trae: 'not-supported',
      junie: 'not-supported',
      kiro: 'not-supported',
      // Tier 3
      cortex: 'not-supported',
      crush: 'not-supported',
      'command-code': 'supported',
      kode: 'not-supported',
      mcpjam: 'not-supported',
      'mistral-vibe': 'not-supported',
      mux: 'not-supported',
      openhands: 'not-supported',
      pi: 'not-supported',
      qoder: 'not-supported',
      'qwen-code': 'not-supported',
      zencoder: 'not-supported',
      neovate: 'planned',
      pochi: 'not-supported',
      adal: 'not-supported',
      iflow: 'not-supported',
      openclaw: 'not-supported',
      codebuddy: 'not-supported',
    },
    testStrategy:
      'Check for .cursor/commands/*.md, .github/prompts/*.prompt.md, .claude/skills/*/SKILL.md, or .agent/workflows/*.yaml',
    docsUrl: {
      github: 'https://docs.github.com/en/copilot/tutorials/customization-library/prompt-files',
      cursor: 'https://cursor.com/changelog/1-6',
      claude: 'https://code.claude.com/docs/en/skills',
      antigravity: 'https://atamel.dev/posts/2025/11-25_customize_antigravity_rules_workflows/',
    },
  },
  {
    id: 'skills',
    name: 'Skills',
    description: 'Reusable skill definitions for AI agents',
    category: 'advanced',
    tools: {
      // Tier 0
      github: 'supported', // .github/skills/<name>/SKILL.md
      cursor: 'planned', // was 'not-supported', updated per cursor-plan.md
      claude: 'supported', // .claude/skills/<name>/SKILL.md
      antigravity: 'not-supported',
      factory: 'supported',
      opencode: 'supported', // .opencode/skills/<name>/SKILL.md
      gemini: 'supported', // .gemini/skills/<name>/skill.md
      // Tier 1
      windsurf: 'supported',
      cline: 'not-supported',
      roo: 'not-supported',
      codex: 'supported',
      continue: 'not-supported',
      // Tier 2
      augment: 'not-supported',
      goose: 'not-supported',
      kilo: 'planned',
      amp: 'supported',
      trae: 'not-supported',
      junie: 'not-supported',
      kiro: 'not-supported',
      // Tier 3
      cortex: 'supported',
      crush: 'supported',
      'command-code': 'supported',
      kode: 'not-supported',
      mcpjam: 'not-supported',
      'mistral-vibe': 'supported',
      mux: 'not-supported',
      openhands: 'supported',
      pi: 'not-supported',
      qoder: 'not-supported',
      'qwen-code': 'supported',
      zencoder: 'not-supported',
      neovate: 'not-supported',
      pochi: 'not-supported',
      adal: 'not-supported',
      iflow: 'not-supported',
      openclaw: 'not-supported',
      codebuddy: 'not-supported',
    },
    testStrategy: 'Check for skills directory with SKILL.md files',
  },
  {
    id: 'agent-instructions',
    name: 'Agent Instructions',
    description:
      'Special instructions for AI agents (AGENTS.md, .github/agents/, or .claude/agents/)',
    category: 'advanced',
    tools: {
      // Tier 0
      github: 'supported', // AGENTS.md + .github/agents/<name>.md
      cursor: 'planned', // was 'not-supported', updated per cursor-plan.md
      claude: 'supported', // .claude/agents/<name>.md
      antigravity: 'not-supported',
      factory: 'supported', // .factory/droids/<name>.md
      opencode: 'supported', // .opencode/agents/<name>.md
      gemini: 'not-supported',
      // Tier 1
      windsurf: 'not-supported',
      cline: 'not-supported',
      roo: 'not-supported',
      codex: 'supported',
      continue: 'not-supported',
      // Tier 2
      augment: 'supported',
      goose: 'not-supported',
      kilo: 'not-supported',
      amp: 'supported',
      trae: 'not-supported',
      junie: 'not-supported',
      kiro: 'not-supported',
      // Tier 3
      cortex: 'planned',
      crush: 'not-supported',
      'command-code': 'not-supported',
      kode: 'not-supported',
      mcpjam: 'not-supported',
      'mistral-vibe': 'not-supported',
      mux: 'not-supported',
      openhands: 'not-supported',
      pi: 'not-supported',
      qoder: 'not-supported',
      'qwen-code': 'not-supported',
      zencoder: 'not-supported',
      neovate: 'not-supported',
      pochi: 'not-supported',
      adal: 'not-supported',
      iflow: 'not-supported',
      openclaw: 'not-supported',
      codebuddy: 'not-supported',
    },
    testStrategy:
      'Check for AGENTS.md, .github/agents/, .claude/agents/, or .factory/droids/ files',
  },
  {
    id: 'local-memory',
    name: 'Local Memory',
    description: 'Private instructions not committed to git',
    category: 'advanced',
    tools: {
      // Tier 0
      github: 'not-supported',
      cursor: 'not-supported',
      claude: 'partial', // was 'supported', downgraded per claude-plan.md
      antigravity: 'not-supported',
      factory: 'not-supported',
      opencode: 'not-supported',
      gemini: 'not-supported',
      // Tier 1
      windsurf: 'not-supported',
      cline: 'not-supported',
      roo: 'not-supported',
      codex: 'not-supported',
      continue: 'not-supported',
      // Tier 2
      augment: 'not-supported',
      goose: 'not-supported',
      kilo: 'not-supported',
      amp: 'not-supported',
      trae: 'not-supported',
      junie: 'not-supported',
      kiro: 'not-supported',
      // Tier 3
      cortex: 'not-supported',
      crush: 'not-supported',
      'command-code': 'not-supported',
      kode: 'not-supported',
      mcpjam: 'not-supported',
      'mistral-vibe': 'not-supported',
      mux: 'not-supported',
      openhands: 'not-supported',
      pi: 'not-supported',
      qoder: 'not-supported',
      'qwen-code': 'not-supported',
      zencoder: 'partial',
      neovate: 'not-supported',
      pochi: 'not-supported',
      adal: 'not-supported',
      iflow: 'not-supported',
      openclaw: 'not-supported',
      codebuddy: 'not-supported',
    },
    testStrategy: 'Check for CLAUDE.local.md file',
  },
  {
    id: 'nested-memory',
    name: 'Nested Memory',
    description: 'Instructions for specific subdirectories',
    category: 'advanced',
    tools: {
      // Tier 0
      github: 'not-supported',
      cursor: 'planned', // was 'supported', downgraded per cursor-plan.md
      claude: 'planned', // was 'supported', downgraded per claude-plan.md
      antigravity: 'planned', // was 'supported', downgraded per antigravity-plan.md
      factory: 'not-supported',
      opencode: 'not-supported',
      gemini: 'not-supported',
      // Tier 1
      windsurf: 'not-supported',
      cline: 'not-supported',
      roo: 'not-supported',
      codex: 'supported',
      continue: 'not-supported',
      // Tier 2
      augment: 'supported',
      goose: 'not-supported',
      kilo: 'not-supported',
      amp: 'supported',
      trae: 'not-supported',
      junie: 'not-supported',
      kiro: 'not-supported',
      // Tier 3
      cortex: 'not-supported',
      crush: 'not-supported',
      'command-code': 'not-supported',
      kode: 'not-supported',
      mcpjam: 'not-supported',
      'mistral-vibe': 'not-supported',
      mux: 'not-supported',
      openhands: 'not-supported',
      pi: 'not-supported',
      qoder: 'not-supported',
      'qwen-code': 'not-supported',
      zencoder: 'not-supported',
      neovate: 'not-supported',
      pochi: 'not-supported',
      adal: 'not-supported',
      iflow: 'not-supported',
      openclaw: 'not-supported',
      codebuddy: 'not-supported',
    },
    testStrategy: 'Check for nested instruction files',
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
export function getToolComparison(): Record<string, Partial<Record<ToolName, FeatureStatus>>> {
  const comparison: Record<string, Partial<Record<ToolName, FeatureStatus>>> = {};

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
          return '—';
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
