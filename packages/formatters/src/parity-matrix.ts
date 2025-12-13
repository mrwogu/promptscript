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
export type FormatterName = 'github' | 'cursor' | 'claude' | 'antigravity';

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
  headerVariations: Record<FormatterName, string | string[]>;
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
    requiredBy: ['github', 'cursor', 'claude', 'antigravity'],
    optionalFor: [],
    contentPatterns: [/you are|working on|project|developer/i],
    headerVariations: {
      github: '## Project',
      cursor: '', // Cursor uses inline format
      claude: '## Project',
      antigravity: '## Project Identity',
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
    requiredBy: ['github', 'antigravity'],
    optionalFor: ['cursor', 'claude'],
    contentPatterns: [/typescript|javascript|node|python/i],
    headerVariations: {
      github: '## Tech Stack',
      cursor: 'Tech:', // Label format
      claude: '## Tech Stack',
      antigravity: '## Tech Stack',
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
    optionalFor: ['cursor', 'claude'],
    contentPatterns: [/mermaid|flowchart|diagram|component/i],
    headerVariations: {
      github: '## Architecture',
      cursor: '', // Embedded in context
      claude: '## Architecture',
      antigravity: '## Architecture',
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
    requiredBy: ['github', 'cursor', 'antigravity'],
    optionalFor: ['claude'],
    contentPatterns: [/strict|any|naming|camelCase|PascalCase/i],
    headerVariations: {
      github: '## Code Style',
      cursor: ['TypeScript:', 'Naming:', 'Testing:'],
      claude: '## Code Standards',
      antigravity: '## Code Standards',
    },
  },
  {
    id: 'git-commits',
    name: 'Git Commits',
    description: 'Commit message format and conventions',
    sources: [{ block: 'standards', property: 'git' }],
    requiredBy: ['github', 'antigravity'],
    optionalFor: ['cursor', 'claude'],
    contentPatterns: [/conventional|commit|feat|fix|type.*scope/i],
    headerVariations: {
      github: '## Git Commits',
      cursor: 'Git:', // Label format
      claude: '## Git Commits',
      antigravity: '## Git Commits',
    },
  },
  {
    id: 'config-files',
    name: 'Configuration Files',
    description: 'ESLint, Vite, and other config guidelines',
    sources: [{ block: 'standards', property: 'config' }],
    requiredBy: ['github', 'antigravity'],
    optionalFor: ['cursor', 'claude'],
    contentPatterns: [/eslint|vite|config|__dirname/i],
    headerVariations: {
      github: '## Config Files',
      cursor: 'Config:', // Label format
      claude: '## Configuration Files',
      antigravity: '## Configuration Files',
    },
  },
  {
    id: 'commands',
    name: 'Commands',
    description: 'Shortcuts and quick commands',
    sources: [{ block: 'shortcuts' }],
    requiredBy: ['github', 'cursor', 'claude', 'antigravity'],
    optionalFor: [],
    contentPatterns: [/\/\w+|command|shortcut/i],
    headerVariations: {
      github: '## Commands',
      cursor: 'Commands:',
      claude: '## Commands',
      antigravity: '## Commands',
    },
  },
  {
    id: 'dev-commands',
    name: 'Development Commands',
    description: 'Build, test, and development scripts',
    sources: [{ block: 'knowledge', textPattern: /## Development Commands[\s\S]*?```/ }],
    requiredBy: ['github', 'antigravity'],
    optionalFor: ['cursor', 'claude'],
    contentPatterns: [/pnpm|npm|yarn|install|build|test/i],
    headerVariations: {
      github: '## Dev Commands',
      cursor: '', // Embedded in knowledge
      claude: '## Development Commands',
      antigravity: '## Development Commands',
    },
  },
  {
    id: 'post-work',
    name: 'Post-Work Verification',
    description: 'Commands to run after completing changes',
    sources: [{ block: 'knowledge', textPattern: /## Post-Work[\s\S]*?```/ }],
    requiredBy: ['github', 'antigravity'],
    optionalFor: ['cursor', 'claude'],
    contentPatterns: [/after|verify|format|lint|test/i],
    headerVariations: {
      github: '## Post-Work Verification',
      cursor: '', // Embedded in knowledge
      claude: '## Post-Work Verification',
      antigravity: '## Post-Work Verification',
    },
  },
  {
    id: 'documentation',
    name: 'Documentation',
    description: 'Documentation verification guidelines',
    sources: [{ block: 'standards', property: 'documentation' }],
    requiredBy: ['github', 'antigravity'],
    optionalFor: ['cursor', 'claude'],
    contentPatterns: [/readme|docs|before|after|verify/i],
    headerVariations: {
      github: '## Documentation',
      cursor: '', // May be embedded
      claude: '## Documentation',
      antigravity: '## Documentation',
    },
  },
  {
    id: 'diagrams',
    name: 'Diagrams',
    description: 'Diagram format and Mermaid guidelines',
    sources: [{ block: 'standards', property: 'diagrams' }],
    requiredBy: ['github', 'antigravity'],
    optionalFor: ['cursor', 'claude'],
    contentPatterns: [/mermaid|flowchart|diagram|sequence/i],
    headerVariations: {
      github: '## Diagrams',
      cursor: '', // May be embedded
      claude: '## Diagrams',
      antigravity: '## Diagrams',
    },
  },
  {
    id: 'restrictions',
    name: 'Restrictions',
    description: "Don'ts and forbidden practices",
    sources: [{ block: 'restrictions' }],
    requiredBy: ['github', 'cursor', 'claude', 'antigravity'],
    optionalFor: [],
    contentPatterns: [/never|don't|do not|avoid|forbidden/i],
    headerVariations: {
      github: "## Don'ts",
      cursor: 'Never:',
      claude: "## Don'ts",
      antigravity: "## Don'ts",
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
