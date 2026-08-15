import type { KnownTarget } from './types/config.js';

/**
 * Default output paths for each target.
 */
export const DEFAULT_OUTPUT_PATHS = {
  // Original 7
  github: '.github/copilot-instructions.md',
  claude: 'CLAUDE.md',
  cursor: '.cursor/rules/project.mdc',
  antigravity: '.agent/rules/project.md',
  factory: 'AGENTS.md',
  opencode: 'OPENCODE.md',
  gemini: 'GEMINI.md',
  // Tier 1
  windsurf: '.windsurf/rules/project.md',
  cline: '.clinerules',
  roo: '.roorules',
  codex: 'AGENTS.md',
  continue: '.continue/rules/project.md',
  // Tier 2
  augment: '.augment/rules/project.md',
  goose: '.goosehints',
  kilo: '.kilocode/rules/project.md',
  amp: 'AGENTS.md',
  trae: '.trae/rules/project_rules.md',
  junie: '.junie/guidelines.md',
  kiro: '.kiro/steering/project.md',
  // Tier 3
  cortex: '.cortex/rules/project.md',
  crush: 'AGENTS.md',
  'command-code': '.commandcode/rules/project.md',
  kode: '.kode/rules/project.md',
  mcpjam: '.mcpjam/rules/project.md',
  'mistral-vibe': '.vibe/rules/project.md',
  mux: '.mux/rules/project.md',
  openhands: '.openhands/rules/project.md',
  pi: '.pi/rules/project.md',
  qoder: '.qoder/rules/project.md',
  'qwen-code': '.qwen/rules/project.md',
  zencoder: '.zencoder/rules/project.md',
  neovate: '.neovate/rules/project.md',
  pochi: '.pochi/rules/project.md',
  adal: '.adal/rules/project.md',
  iflow: '.iflow/rules/project.md',
  openclaw: 'INSTRUCTIONS.md',
  codebuddy: '.codebuddy/rules/project.md',
  // AGENTS.md-only targets
  aider: 'AGENTS.md',
  'amazon-q': 'AGENTS.md',
  warp: 'AGENTS.md',
  zed: 'AGENTS.md',
  jules: 'AGENTS.md',
  devin: 'AGENTS.md',
  grok: 'AGENTS.md',
  // Priority B CLI agents
  kimi: 'AGENTS.md',
  mimo: 'AGENTS.md',
  'deep-agents': 'AGENTS.md',
  forgecode: 'AGENTS.md',
  hermes: 'AGENTS.md',
} as const satisfies Record<KnownTarget, string>;
