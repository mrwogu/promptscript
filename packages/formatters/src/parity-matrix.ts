/**
 * Parity Matrix - Specification for formatter output consistency.
 *
 * This module defines which AST blocks should produce which sections
 * across all formatters, ensuring consistent behavior and detecting
 * anomalies between formatter implementations.
 *
 * @module parity-matrix
 */

/**
 * Formatter names that are subject to parity testing.
 */
export type FormatterName =
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
 * Source block configuration for section extraction.
 */
export interface SourceBlockConfig {
  /** Primary block name (e.g., 'context', 'standards') */
  block: string;
  /** Optional nested property path (e.g., 'git', 'typescript') */
  property?: string;
  /** Whether this is a text extraction (vs structured) */
  textPattern?: RegExp;
}

/**
 * Section specification in the parity matrix.
 */
export interface SectionSpec {
  /** Unique section identifier */
  id: string;
  /** Human-readable section name */
  name: string;
  /** Description of section purpose */
  description: string;
  /** Source blocks that provide data for this section */
  sources: SourceBlockConfig[];
  /** Formatters that MUST implement this section */
  requiredBy: FormatterName[];
  /** Formatters that MAY implement this section */
  optionalFor: FormatterName[];
  /** Expected content patterns (regex) to validate output */
  contentPatterns?: RegExp[];
  /** Section header variations across formatters */
  headerVariations: Partial<Record<FormatterName, string | string[]>>;
}

/**
 * Content extraction rule for a specific block.
 */
export interface ExtractionRule {
  /** Block name to extract from */
  block: string;
  /** Property path within block (dot notation) */
  propertyPath?: string;
  /** Expected output sections from this extraction */
  producesSections: string[];
  /** Content validation pattern */
  contentMatcher?: RegExp;
}

/**
 * The Parity Matrix - complete specification of formatter behavior.
 *
 * This is the single source of truth for what each formatter should produce
 * from each AST block. Use this to:
 * - Verify new formatter implementations
 * - Detect regressions in existing formatters
 * - Document expected behavior
 * - Generate test cases automatically
 */
export const PARITY_MATRIX: SectionSpec[] = [
  {
    id: 'project-identity',
    name: 'Project Identity',
    description: 'Core project description and role definition',
    sources: [{ block: 'identity' }],
    requiredBy: [
      'github',
      'cursor',
      'claude',
      'antigravity',
      'factory',
      'opencode',
      'gemini',
      'augment',
      'codex',
      'continue',
      'kiro',
    ],
    optionalFor: [
      'adal',
      'amp',
      'cline',
      'codebuddy',
      'command-code',
      'cortex',
      'crush',
      'goose',
      'iflow',
      'junie',
      'kilo',
      'kode',
      'mcpjam',
      'mistral-vibe',
      'mux',
      'neovate',
      'openclaw',
      'openhands',
      'pi',
      'pochi',
      'qoder',
      'qwen-code',
      'roo',
      'trae',
      'windsurf',
      'zencoder',
    ],
    contentPatterns: [/you are|working on|project|developer/i],
    headerVariations: {
      adal: '## Project',
      amp: '## Project',
      augment: '## Project',
      antigravity: '## Project Identity',
      cline: '## Project',
      claude: '## Project',
      codebuddy: '## Project',
      'command-code': '## Project',
      codex: '## Project',
      continue: '## Project',
      cortex: '## Project',
      crush: '## Project',
      cursor: '', // Cursor uses inline format
      factory: '## Project',
      gemini: '## Project',
      github: '## Project',
      goose: '## Project',
      iflow: '## Project',
      junie: '## Project',
      kilo: '## Project',
      kiro: '## Project',
      kode: '## Project',
      mcpjam: '## Project',
      'mistral-vibe': '## Project',
      mux: '## Project',
      neovate: '## Project',
      openclaw: '## Project',
      opencode: '## Project',
      openhands: '## Project',
      pi: '## Project',
      pochi: '## Project',
      qoder: '## Project',
      'qwen-code': '## Project',
      roo: '## Project',
      trae: '## Project',
      windsurf: '## Project',
      zencoder: '## Project',
    },
  },
  {
    id: 'tech-stack',
    name: 'Tech Stack',
    description: 'Languages, runtime, frameworks, and tools',
    sources: [
      { block: 'context', property: 'languages' },
      { block: 'context', property: 'runtime' },
      { block: 'context', property: 'monorepo' },
      { block: 'context', property: 'frameworks' },
    ],
    requiredBy: ['github', 'antigravity', 'factory'],
    optionalFor: [
      'adal',
      'amp',
      'augment',
      'cline',
      'claude',
      'codebuddy',
      'codex',
      'command-code',
      'continue',
      'cortex',
      'crush',
      'cursor',
      'gemini',
      'goose',
      'iflow',
      'junie',
      'kilo',
      'kiro',
      'kode',
      'mcpjam',
      'mistral-vibe',
      'mux',
      'neovate',
      'openclaw',
      'opencode',
      'openhands',
      'pi',
      'pochi',
      'qoder',
      'qwen-code',
      'roo',
      'trae',
      'windsurf',
      'zencoder',
    ],
    contentPatterns: [/typescript|javascript|node|python/i],
    headerVariations: {
      adal: '## Tech Stack',
      amp: '## Tech Stack',
      antigravity: '## Tech Stack',
      augment: '## Tech Stack',
      cline: '## Tech Stack',
      claude: '## Tech Stack',
      codebuddy: '## Tech Stack',
      codex: '## Tech Stack',
      'command-code': '## Tech Stack',
      continue: '## Tech Stack',
      cortex: '## Tech Stack',
      crush: '## Tech Stack',
      cursor: 'Tech stack:', // Label format (corrected from 'Tech:')
      factory: '## Tech Stack',
      gemini: '## Tech Stack',
      github: '## Tech Stack',
      goose: '## Tech Stack',
      iflow: '## Tech Stack',
      junie: '## Tech Stack',
      kilo: '## Tech Stack',
      kiro: '## Tech Stack',
      kode: '## Tech Stack',
      mcpjam: '## Tech Stack',
      'mistral-vibe': '## Tech Stack',
      mux: '## Tech Stack',
      neovate: '## Tech Stack',
      openclaw: '## Tech Stack',
      opencode: '## Tech Stack',
      openhands: '## Tech Stack',
      pi: '## Tech Stack',
      pochi: '## Tech Stack',
      qoder: '## Tech Stack',
      'qwen-code': '## Tech Stack',
      roo: '## Tech Stack',
      trae: '## Tech Stack',
      windsurf: '## Tech Stack',
      zencoder: '## Tech Stack',
    },
  },
  {
    id: 'architecture',
    name: 'Architecture',
    description: 'System structure, components, and dependencies',
    sources: [
      { block: 'context', textPattern: /## Architecture[\s\S]*?```/ },
      { block: 'architecture' },
    ],
    requiredBy: ['github', 'antigravity'],
    optionalFor: [
      'adal',
      'amp',
      'augment',
      'cline',
      'claude',
      'codebuddy',
      'codex',
      'command-code',
      'continue',
      'cortex',
      'crush',
      'cursor',
      'factory',
      'gemini',
      'goose',
      'iflow',
      'junie',
      'kilo',
      'kiro',
      'kode',
      'mcpjam',
      'mistral-vibe',
      'mux',
      'neovate',
      'openclaw',
      'opencode',
      'openhands',
      'pi',
      'pochi',
      'qoder',
      'qwen-code',
      'roo',
      'trae',
      'windsurf',
      'zencoder',
    ],
    contentPatterns: [/mermaid|flowchart|diagram|component/i],
    headerVariations: {
      adal: '## Architecture',
      amp: '## Architecture',
      antigravity: '## Architecture',
      augment: '## Architecture',
      cline: '## Architecture',
      claude: '## Architecture',
      codebuddy: '## Architecture',
      codex: '## Architecture',
      'command-code': '## Architecture',
      continue: '## Architecture',
      cortex: '## Architecture',
      crush: '## Architecture',
      cursor: '', // Embedded in context
      factory: '## Architecture',
      gemini: '## Architecture',
      github: '## Architecture',
      goose: '## Architecture',
      iflow: '## Architecture',
      junie: '## Architecture',
      kilo: '## Architecture',
      kiro: '## Architecture',
      kode: '## Architecture',
      mcpjam: '## Architecture',
      'mistral-vibe': '## Architecture',
      mux: '## Architecture',
      neovate: '## Architecture',
      openclaw: '## Architecture',
      opencode: '## Architecture',
      openhands: '## Architecture',
      pi: '## Architecture',
      pochi: '## Architecture',
      qoder: '## Architecture',
      'qwen-code': '## Architecture',
      roo: '## Architecture',
      trae: '## Architecture',
      windsurf: '## Architecture',
      zencoder: '## Architecture',
    },
  },
  {
    id: 'code-standards',
    name: 'Code Standards',
    description: 'TypeScript, naming, error handling conventions',
    sources: [
      { block: 'standards', property: 'typescript' },
      { block: 'standards', property: 'naming' },
      { block: 'standards', property: 'errors' },
      { block: 'standards', property: 'testing' },
    ],
    requiredBy: ['github', 'cursor', 'antigravity', 'factory'],
    optionalFor: [
      'adal',
      'amp',
      'augment',
      'cline',
      'claude',
      'codebuddy',
      'codex',
      'command-code',
      'continue',
      'cortex',
      'crush',
      'gemini',
      'goose',
      'iflow',
      'junie',
      'kilo',
      'kiro',
      'kode',
      'mcpjam',
      'mistral-vibe',
      'mux',
      'neovate',
      'openclaw',
      'opencode',
      'openhands',
      'pi',
      'pochi',
      'qoder',
      'qwen-code',
      'roo',
      'trae',
      'windsurf',
      'zencoder',
    ],
    contentPatterns: [/strict|any|naming|camelCase|PascalCase/i],
    headerVariations: {
      adal: '## Code Style',
      amp: '## Code Style',
      antigravity: '## Code Standards',
      augment: '## Code Style',
      cline: '## Code Style',
      claude: '## Code Style',
      codebuddy: '## Code Style',
      codex: '## Code Style',
      'command-code': '## Code Style',
      continue: '## Code Style',
      cortex: '## Code Style',
      crush: '## Code Style',
      cursor: ['TypeScript:', 'Naming:', 'Testing:'],
      factory: '## Conventions & Patterns',
      gemini: '## Code Style',
      github: '## Code Style',
      goose: '## Code Style',
      iflow: '## Code Style',
      junie: '## Code Style',
      kilo: '## Code Style',
      kiro: '## Code Style',
      kode: '## Code Style',
      mcpjam: '## Code Style',
      'mistral-vibe': '## Code Style',
      mux: '## Code Style',
      neovate: '## Code Style',
      openclaw: '## Code Style',
      opencode: '## Code Style',
      openhands: '## Code Style',
      pi: '## Code Style',
      pochi: '## Code Style',
      qoder: '## Code Style',
      'qwen-code': '## Code Style',
      roo: '## Code Style',
      trae: '## Code Style',
      windsurf: '## Code Style',
      zencoder: '## Code Style',
    },
  },
  {
    id: 'git-commits',
    name: 'Git Commits',
    description: 'Commit message format and conventions',
    sources: [{ block: 'standards', property: 'git' }],
    requiredBy: ['github', 'antigravity', 'factory'],
    optionalFor: [
      'adal',
      'amp',
      'augment',
      'cline',
      'claude',
      'codebuddy',
      'codex',
      'command-code',
      'continue',
      'cortex',
      'crush',
      'cursor',
      'gemini',
      'goose',
      'iflow',
      'junie',
      'kilo',
      'kiro',
      'kode',
      'mcpjam',
      'mistral-vibe',
      'mux',
      'neovate',
      'openclaw',
      'opencode',
      'openhands',
      'pi',
      'pochi',
      'qoder',
      'qwen-code',
      'roo',
      'trae',
      'windsurf',
      'zencoder',
    ],
    contentPatterns: [/conventional|commit|feat|fix|type.*scope/i],
    headerVariations: {
      adal: '## Git Commits',
      amp: '## Git Commits',
      antigravity: '## Git Commits',
      augment: '## Git Commits',
      cline: '## Git Commits',
      claude: '## Git Commits',
      codebuddy: '## Git Commits',
      codex: '## Git Commits',
      'command-code': '## Git Commits',
      continue: '## Git Commits',
      cortex: '## Git Commits',
      crush: '## Git Commits',
      cursor: 'Git Commits:', // Label format (corrected from 'Git:')
      factory: '## Git Workflows',
      gemini: '## Git Commits',
      github: '## Git Commits',
      goose: '## Git Commits',
      iflow: '## Git Commits',
      junie: '## Git Commits',
      kilo: '## Git Commits',
      kiro: '## Git Commits',
      kode: '## Git Commits',
      mcpjam: '## Git Commits',
      'mistral-vibe': '## Git Commits',
      mux: '## Git Commits',
      neovate: '## Git Commits',
      openclaw: '## Git Commits',
      opencode: '## Git Commits',
      openhands: '## Git Commits',
      pi: '## Git Commits',
      pochi: '## Git Commits',
      qoder: '## Git Commits',
      'qwen-code': '## Git Commits',
      roo: '## Git Commits',
      trae: '## Git Commits',
      windsurf: '## Git Commits',
      zencoder: '## Git Commits',
    },
  },
  {
    id: 'config-files',
    name: 'Configuration Files',
    description: 'ESLint, Vite, and other config guidelines',
    sources: [{ block: 'standards', property: 'config' }],
    requiredBy: ['github', 'antigravity'],
    optionalFor: [
      'adal',
      'amp',
      'augment',
      'cline',
      'claude',
      'codebuddy',
      'codex',
      'command-code',
      'continue',
      'cortex',
      'crush',
      'cursor',
      'factory',
      'gemini',
      'goose',
      'iflow',
      'junie',
      'kilo',
      'kiro',
      'kode',
      'mcpjam',
      'mistral-vibe',
      'mux',
      'neovate',
      'openclaw',
      'opencode',
      'openhands',
      'pi',
      'pochi',
      'qoder',
      'qwen-code',
      'roo',
      'trae',
      'windsurf',
      'zencoder',
    ],
    contentPatterns: [/eslint|vite|config|__dirname/i],
    headerVariations: {
      adal: '## Config Files',
      amp: '## Config Files',
      antigravity: '## Configuration Files',
      augment: '## Config Files',
      cline: '## Config Files',
      claude: '## Config Files',
      codebuddy: '## Config Files',
      codex: '## Config Files',
      'command-code': '## Config Files',
      continue: '## Config Files',
      cortex: '## Config Files',
      crush: '## Config Files',
      cursor: 'Config:', // Label format
      factory: '## Configuration Files',
      gemini: '## Config Files',
      github: '## Config Files',
      goose: '## Config Files',
      iflow: '## Config Files',
      junie: '## Config Files',
      kilo: '## Config Files',
      kiro: '## Config Files',
      kode: '## Config Files',
      mcpjam: '## Config Files',
      'mistral-vibe': '## Config Files',
      mux: '## Config Files',
      neovate: '## Config Files',
      openclaw: '## Config Files',
      opencode: '## Config Files',
      openhands: '## Config Files',
      pi: '## Config Files',
      pochi: '## Config Files',
      qoder: '## Config Files',
      'qwen-code': '## Config Files',
      roo: '## Config Files',
      trae: '## Config Files',
      windsurf: '## Config Files',
      zencoder: '## Config Files',
    },
  },
  {
    id: 'commands',
    name: 'Commands',
    description: 'Shortcuts and quick commands',
    sources: [{ block: 'shortcuts' }],
    requiredBy: [
      'github',
      'cursor',
      'claude',
      'antigravity',
      'factory',
      'opencode',
      'gemini',
      'kiro',
    ],
    optionalFor: [
      'adal',
      'amp',
      'augment',
      'cline',
      'codebuddy',
      'codex',
      'command-code',
      'continue',
      'cortex',
      'crush',
      'goose',
      'iflow',
      'junie',
      'kilo',
      'kode',
      'mcpjam',
      'mistral-vibe',
      'mux',
      'neovate',
      'openclaw',
      'openhands',
      'pi',
      'pochi',
      'qoder',
      'qwen-code',
      'roo',
      'trae',
      'windsurf',
      'zencoder',
    ],
    contentPatterns: [/\/\w+|command|shortcut/i],
    headerVariations: {
      adal: '## Commands',
      amp: '## Commands',
      antigravity: '## Commands',
      augment: '## Commands',
      cline: '## Commands',
      claude: '## Commands',
      codebuddy: '## Commands',
      codex: '## Commands',
      'command-code': '## Commands',
      continue: '## Commands',
      cortex: '## Commands',
      crush: '## Commands',
      cursor: 'Commands:',
      factory: '## Commands',
      gemini: '## Commands',
      github: '## Commands',
      goose: '## Commands',
      iflow: '## Commands',
      junie: '## Commands',
      kilo: '## Commands',
      kiro: '## Commands',
      kode: '## Commands',
      mcpjam: '## Commands',
      'mistral-vibe': '## Commands',
      mux: '## Commands',
      neovate: '## Commands',
      openclaw: '## Commands',
      opencode: '## Commands',
      openhands: '## Commands',
      pi: '## Commands',
      pochi: '## Commands',
      qoder: '## Commands',
      'qwen-code': '## Commands',
      roo: '## Commands',
      trae: '## Commands',
      windsurf: '## Commands',
      zencoder: '## Commands',
    },
  },
  {
    id: 'dev-commands',
    name: 'Development Commands',
    description: 'Build, test, and development scripts',
    sources: [{ block: 'knowledge', textPattern: /## Development Commands[\s\S]*?```/ }],
    requiredBy: ['github', 'antigravity'],
    optionalFor: [
      'adal',
      'amp',
      'augment',
      'cline',
      'claude',
      'codebuddy',
      'codex',
      'command-code',
      'continue',
      'cortex',
      'crush',
      'cursor',
      'factory',
      'gemini',
      'goose',
      'iflow',
      'junie',
      'kilo',
      'kiro',
      'kode',
      'mcpjam',
      'mistral-vibe',
      'mux',
      'neovate',
      'openclaw',
      'opencode',
      'openhands',
      'pi',
      'pochi',
      'qoder',
      'qwen-code',
      'roo',
      'trae',
      'windsurf',
      'zencoder',
    ],
    contentPatterns: [/pnpm|npm|yarn|install|build|test/i],
    headerVariations: {
      adal: '## Development Commands',
      amp: '## Development Commands',
      antigravity: '## Development Commands',
      augment: '## Development Commands',
      cline: '## Development Commands',
      claude: '## Development Commands',
      codebuddy: '## Development Commands',
      codex: '## Development Commands',
      'command-code': '## Development Commands',
      continue: '## Development Commands',
      cortex: '## Development Commands',
      crush: '## Development Commands',
      cursor: '', // Embedded in knowledge
      factory: '## Development Commands',
      gemini: '## Development Commands',
      github: '## Dev Commands',
      goose: '## Development Commands',
      iflow: '## Development Commands',
      junie: '## Development Commands',
      kilo: '## Development Commands',
      kiro: '## Development Commands',
      kode: '## Development Commands',
      mcpjam: '## Development Commands',
      'mistral-vibe': '## Development Commands',
      mux: '## Development Commands',
      neovate: '## Development Commands',
      openclaw: '## Development Commands',
      opencode: '## Development Commands',
      openhands: '## Development Commands',
      pi: '## Development Commands',
      pochi: '## Development Commands',
      qoder: '## Development Commands',
      'qwen-code': '## Development Commands',
      roo: '## Commands', // Roo uses ## Commands for dev-commands
      trae: '## Development Commands',
      windsurf: '## Commands', // Windsurf uses ## Commands for dev-commands
      zencoder: '## Development Commands',
    },
  },
  {
    id: 'post-work',
    name: 'Post-Work Verification',
    description: 'Commands to run after completing changes',
    sources: [{ block: 'knowledge', textPattern: /## Post-Work[\s\S]*?```/ }],
    requiredBy: ['github', 'antigravity'],
    optionalFor: [
      'adal',
      'amp',
      'augment',
      'cline',
      'claude',
      'codebuddy',
      'codex',
      'command-code',
      'continue',
      'cortex',
      'crush',
      'cursor',
      'factory',
      'gemini',
      'goose',
      'iflow',
      'junie',
      'kilo',
      'kiro',
      'kode',
      'mcpjam',
      'mistral-vibe',
      'mux',
      'neovate',
      'openclaw',
      'opencode',
      'openhands',
      'pi',
      'pochi',
      'qoder',
      'qwen-code',
      'roo',
      'trae',
      'windsurf',
      'zencoder',
    ],
    contentPatterns: [/after|verify|format|lint|test/i],
    headerVariations: {
      adal: '## Post-Work Verification',
      amp: '## Post-Work Verification',
      antigravity: '## Post-Work Verification',
      augment: '## Post-Work Verification',
      cline: '## Post-Work Verification',
      claude: '## Post-Work Verification',
      codebuddy: '## Post-Work Verification',
      codex: '## Post-Work Verification',
      'command-code': '## Post-Work Verification',
      continue: '## Post-Work Verification',
      cortex: '## Post-Work Verification',
      crush: '## Post-Work Verification',
      cursor: '', // Embedded in knowledge
      factory: '## Build & Test',
      gemini: '## Post-Work Verification',
      github: '## Post-Work Verification',
      goose: '## Post-Work Verification',
      iflow: '## Post-Work Verification',
      junie: '## Post-Work Verification',
      kilo: '## Post-Work Verification',
      kiro: '## Post-Work Verification',
      kode: '## Post-Work Verification',
      mcpjam: '## Post-Work Verification',
      'mistral-vibe': '## Post-Work Verification',
      mux: '## Post-Work Verification',
      neovate: '## Post-Work Verification',
      openclaw: '## Post-Work Verification',
      opencode: '## Post-Work Verification',
      openhands: '## Post-Work Verification',
      pi: '## Post-Work Verification',
      pochi: '## Post-Work Verification',
      qoder: '## Post-Work Verification',
      'qwen-code': '## Post-Work Verification',
      roo: '## Post-Work Verification',
      trae: '## Post-Work Verification',
      windsurf: '## Post-Work Verification',
      zencoder: '## Post-Work Verification',
    },
  },
  {
    id: 'documentation',
    name: 'Documentation',
    description: 'Documentation verification guidelines',
    sources: [{ block: 'standards', property: 'documentation' }],
    requiredBy: ['github', 'antigravity'],
    optionalFor: [
      'adal',
      'amp',
      'augment',
      'cline',
      'claude',
      'codebuddy',
      'codex',
      'command-code',
      'continue',
      'cortex',
      'crush',
      'cursor',
      'factory',
      'gemini',
      'goose',
      'iflow',
      'junie',
      'kilo',
      'kiro',
      'kode',
      'mcpjam',
      'mistral-vibe',
      'mux',
      'neovate',
      'openclaw',
      'opencode',
      'openhands',
      'pi',
      'pochi',
      'qoder',
      'qwen-code',
      'roo',
      'trae',
      'windsurf',
      'zencoder',
    ],
    contentPatterns: [/readme|docs|before|after|verify/i],
    headerVariations: {
      adal: '## Documentation',
      amp: '## Documentation',
      antigravity: '## Documentation',
      augment: '## Documentation',
      cline: '## Documentation',
      claude: '## Documentation',
      codebuddy: '## Documentation',
      codex: '## Documentation',
      'command-code': '## Documentation',
      continue: '## Documentation',
      cortex: '## Documentation',
      crush: '## Documentation',
      cursor: '', // May be embedded
      factory: '## Documentation',
      gemini: '## Documentation',
      github: '## Documentation',
      goose: '## Documentation',
      iflow: '## Documentation',
      junie: '## Documentation',
      kilo: '## Documentation',
      kiro: '## Documentation',
      kode: '## Documentation',
      mcpjam: '## Documentation',
      'mistral-vibe': '## Documentation',
      mux: '## Documentation',
      neovate: '## Documentation',
      openclaw: '## Documentation',
      opencode: '## Documentation',
      openhands: '## Documentation',
      pi: '## Documentation',
      pochi: '## Documentation',
      qoder: '## Documentation',
      'qwen-code': '## Documentation',
      roo: '## Documentation',
      trae: '## Documentation',
      windsurf: '## Documentation',
      zencoder: '## Documentation',
    },
  },
  {
    id: 'diagrams',
    name: 'Diagrams',
    description: 'Diagram format and Mermaid guidelines',
    sources: [{ block: 'standards', property: 'diagrams' }],
    requiredBy: ['github', 'antigravity'],
    optionalFor: [
      'adal',
      'amp',
      'augment',
      'cline',
      'claude',
      'codebuddy',
      'codex',
      'command-code',
      'continue',
      'cortex',
      'crush',
      'cursor',
      'factory',
      'gemini',
      'goose',
      'iflow',
      'junie',
      'kilo',
      'kiro',
      'kode',
      'mcpjam',
      'mistral-vibe',
      'mux',
      'neovate',
      'openclaw',
      'opencode',
      'openhands',
      'pi',
      'pochi',
      'qoder',
      'qwen-code',
      'roo',
      'trae',
      'windsurf',
      'zencoder',
    ],
    contentPatterns: [/mermaid|flowchart|diagram|sequence/i],
    headerVariations: {
      adal: '## Diagrams',
      amp: '## Diagrams',
      antigravity: '## Diagrams',
      augment: '## Diagrams',
      cline: '## Diagrams',
      claude: '## Diagrams',
      codebuddy: '## Diagrams',
      codex: '## Diagrams',
      'command-code': '## Diagrams',
      continue: '## Diagrams',
      cortex: '## Diagrams',
      crush: '## Diagrams',
      cursor: '', // May be embedded
      factory: '## Diagrams',
      gemini: '## Diagrams',
      github: '## Diagrams',
      goose: '## Diagrams',
      iflow: '## Diagrams',
      junie: '## Diagrams',
      kilo: '## Diagrams',
      kiro: '## Diagrams',
      kode: '## Diagrams',
      mcpjam: '## Diagrams',
      'mistral-vibe': '## Diagrams',
      mux: '## Diagrams',
      neovate: '## Diagrams',
      openclaw: '## Diagrams',
      opencode: '## Diagrams',
      openhands: '## Diagrams',
      pi: '## Diagrams',
      pochi: '## Diagrams',
      qoder: '## Diagrams',
      'qwen-code': '## Diagrams',
      roo: '## Diagrams',
      trae: '## Diagrams',
      windsurf: '## Diagrams',
      zencoder: '## Diagrams',
    },
  },
  {
    id: 'restrictions',
    name: 'Restrictions',
    description: "Don'ts and forbidden practices",
    sources: [{ block: 'restrictions' }],
    requiredBy: [
      'github',
      'cursor',
      'claude',
      'antigravity',
      'factory',
      'opencode',
      'gemini',
      'augment',
      'codex',
      'continue',
    ],
    optionalFor: [
      'adal',
      'amp',
      'cline',
      'codebuddy',
      'command-code',
      'cortex',
      'crush',
      'goose',
      'iflow',
      'junie',
      'kilo',
      'kiro',
      'kode',
      'mcpjam',
      'mistral-vibe',
      'mux',
      'neovate',
      'openclaw',
      'openhands',
      'pi',
      'pochi',
      'qoder',
      'qwen-code',
      'roo',
      'trae',
      'windsurf',
      'zencoder',
    ],
    contentPatterns: [/never|don't|do not|avoid|forbidden/i],
    headerVariations: {
      adal: '## Restrictions',
      amp: '## Restrictions',
      antigravity: "## Don'ts",
      augment: '## Restrictions',
      cline: '## Restrictions',
      claude: "## Don'ts",
      codebuddy: '## Restrictions',
      codex: "## Don'ts",
      'command-code': '## Restrictions',
      continue: '## Restrictions',
      cortex: '## Restrictions',
      crush: '## Restrictions',
      cursor: 'Never:',
      factory: "## Don'ts",
      gemini: '## Restrictions',
      github: "## Don'ts",
      goose: '## Restrictions',
      iflow: '## Restrictions',
      junie: '## Restrictions',
      kilo: '## Restrictions',
      kiro: '## Restrictions',
      kode: '## Restrictions',
      mcpjam: '## Restrictions',
      'mistral-vibe': '## Restrictions',
      mux: '## Restrictions',
      neovate: '## Restrictions',
      openclaw: '## Restrictions',
      opencode: '## Restrictions',
      openhands: '## Restrictions',
      pi: '## Restrictions',
      pochi: '## Restrictions',
      qoder: '## Restrictions',
      'qwen-code': '## Restrictions',
      roo: '## Restrictions',
      trae: '## Restrictions',
      windsurf: '## Restrictions',
      zencoder: '## Restrictions',
    },
  },
];

/**
 * Extraction rules mapping blocks to expected output sections.
 * Used to verify that formatters extract all expected content.
 */
export const EXTRACTION_RULES: ExtractionRule[] = [
  {
    block: 'identity',
    producesSections: ['project-identity'],
    contentMatcher: /you are|developer|expert/i,
  },
  {
    block: 'context',
    propertyPath: 'languages',
    producesSections: ['tech-stack'],
    contentMatcher: /typescript|javascript|python/i,
  },
  {
    block: 'context',
    propertyPath: 'runtime',
    producesSections: ['tech-stack'],
    contentMatcher: /node|deno|bun/i,
  },
  {
    block: 'context',
    propertyPath: 'monorepo',
    producesSections: ['tech-stack'],
    contentMatcher: /nx|turbo|lerna|pnpm|yarn/i,
  },
  {
    block: 'standards',
    propertyPath: 'typescript',
    producesSections: ['code-standards'],
    contentMatcher: /strict|any|type/i,
  },
  {
    block: 'standards',
    propertyPath: 'naming',
    producesSections: ['code-standards'],
    contentMatcher: /camelCase|PascalCase|kebab/i,
  },
  {
    block: 'standards',
    propertyPath: 'errors',
    producesSections: ['code-standards'],
    contentMatcher: /error|exception|throw/i,
  },
  {
    block: 'standards',
    propertyPath: 'testing',
    producesSections: ['code-standards'],
    contentMatcher: /test|vitest|jest|coverage/i,
  },
  {
    block: 'standards',
    propertyPath: 'git',
    producesSections: ['git-commits'],
    contentMatcher: /commit|conventional|feat|fix/i,
  },
  {
    block: 'standards',
    propertyPath: 'config',
    producesSections: ['config-files'],
    contentMatcher: /eslint|vite|config/i,
  },
  {
    block: 'standards',
    propertyPath: 'documentation',
    producesSections: ['documentation'],
    contentMatcher: /docs|readme|verify/i,
  },
  {
    block: 'standards',
    propertyPath: 'diagrams',
    producesSections: ['diagrams'],
    contentMatcher: /mermaid|flowchart|diagram/i,
  },
  {
    block: 'shortcuts',
    producesSections: ['commands'],
    contentMatcher: /\/\w+/,
  },
  {
    block: 'knowledge',
    producesSections: ['dev-commands', 'post-work'],
    contentMatcher: /pnpm|npm|bash/i,
  },
  {
    block: 'restrictions',
    producesSections: ['restrictions'],
    contentMatcher: /never|don't/i,
  },
];

/**
 * Get sections that a formatter MUST implement.
 */
export function getRequiredSections(formatter: FormatterName): SectionSpec[] {
  return PARITY_MATRIX.filter((spec) => spec.requiredBy.includes(formatter));
}

/**
 * Get sections that a formatter MAY implement.
 */
export function getOptionalSections(formatter: FormatterName): SectionSpec[] {
  return PARITY_MATRIX.filter((spec) => spec.optionalFor.includes(formatter));
}

/**
 * Get all sections a formatter should support (required + optional).
 */
export function getAllSections(formatter: FormatterName): SectionSpec[] {
  return PARITY_MATRIX.filter(
    (spec) => spec.requiredBy.includes(formatter) || spec.optionalFor.includes(formatter)
  );
}

/**
 * Check if a section header matches expected variations for a formatter.
 */
export function matchesSectionHeader(
  content: string,
  sectionId: string,
  formatter: FormatterName
): boolean {
  const spec = PARITY_MATRIX.find((s) => s.id === sectionId);
  if (!spec) return false;

  const variations = spec.headerVariations[formatter];
  if (!variations) return false;

  const headers = Array.isArray(variations) ? variations : [variations];
  return headers.some((header) => {
    if (!header) return true; // Empty header means inline/embedded
    return content.includes(header);
  });
}

/**
 * Validate content against expected patterns for a section.
 */
export function validateSectionContent(content: string, sectionId: string): boolean {
  const spec = PARITY_MATRIX.find((s) => s.id === sectionId);
  if (!spec || !spec.contentPatterns) return true;

  return spec.contentPatterns.some((pattern) => pattern.test(content));
}

/**
 * Get blocks that should produce a given section.
 */
export function getSourceBlocks(sectionId: string): string[] {
  const spec = PARITY_MATRIX.find((s) => s.id === sectionId);
  if (!spec) return [];

  return spec.sources.map((s) => s.block);
}

/**
 * Generate a parity report comparing formatter outputs.
 */
export interface ParityReport {
  formatter: FormatterName;
  presentSections: string[];
  missingSections: string[];
  extraSections: string[];
  contentIssues: Array<{
    section: string;
    issue: string;
  }>;
}

/**
 * Analyze formatter output and generate parity report.
 */
export function analyzeFormatterOutput(
  formatter: FormatterName,
  content: string,
  availableBlocks: string[]
): ParityReport {
  const requiredSections = getRequiredSections(formatter);
  const presentSections: string[] = [];
  const missingSections: string[] = [];
  const contentIssues: Array<{ section: string; issue: string }> = [];

  for (const spec of requiredSections) {
    // Check if source blocks are available
    const hasSourceBlock = spec.sources.some((s) => availableBlocks.includes(s.block));
    if (!hasSourceBlock) continue;

    // Check if section is present
    const isPresent = matchesSectionHeader(content, spec.id, formatter);

    if (isPresent) {
      presentSections.push(spec.id);

      // Validate content
      if (!validateSectionContent(content, spec.id)) {
        contentIssues.push({
          section: spec.id,
          issue: `Content does not match expected patterns`,
        });
      }
    } else {
      missingSections.push(spec.id);
    }
  }

  // Extra sections detection would require content parsing
  const extraSections: string[] = [];

  return {
    formatter,
    presentSections,
    missingSections,
    extraSections,
    contentIssues,
  };
}
