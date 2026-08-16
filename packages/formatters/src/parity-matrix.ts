/**
 * Parity Matrix - Specification for formatter output consistency.
 *
 * This module defines which AST blocks should produce which sections
 * across all formatters, ensuring consistent behavior and detecting
 * anomalies between formatter implementations.
 *
 * @module parity-matrix
 */

import {
  KNOWN_TARGETS,
  getTargetCapability,
  getTargetSectionCapability,
  type KnownTarget,
} from '@promptscript/core';

/**
 * Formatter names that are subject to parity testing.
 * @deprecated Use `KnownTarget` from `@promptscript/core` directly.
 */
export type FormatterName = KnownTarget;

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
const PARITY_DEFINITIONS: Omit<SectionSpec, 'requiredBy' | 'optionalFor' | 'headerVariations'>[] = [
  {
    id: 'project-identity',
    name: 'Project Identity',
    description: 'Core project description and role definition',
    sources: [{ block: 'identity' }],
    contentPatterns: [/you are|working on|project|developer/i],
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
    contentPatterns: [/typescript|javascript|node|python/i],
  },
  {
    id: 'architecture',
    name: 'Architecture',
    description: 'System structure, components, and dependencies',
    sources: [
      { block: 'context', textPattern: /## Architecture[\s\S]*?```/ },
      { block: 'architecture' },
    ],
    contentPatterns: [/mermaid|flowchart|diagram|component/i],
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
    contentPatterns: [/strict|any|naming|camelCase|PascalCase/i],
  },
  {
    id: 'git-commits',
    name: 'Git Commits',
    description: 'Commit message format and conventions',
    sources: [{ block: 'standards', property: 'git' }],
    contentPatterns: [/conventional|commit|feat|fix|type.*scope/i],
  },
  {
    id: 'config-files',
    name: 'Configuration Files',
    description: 'ESLint, Vite, and other config guidelines',
    sources: [{ block: 'standards', property: 'config' }],
    contentPatterns: [/eslint|vite|config|__dirname/i],
  },
  {
    id: 'commands',
    name: 'Commands',
    description: 'Shortcuts and quick commands',
    sources: [{ block: 'shortcuts' }],
    contentPatterns: [/\/\w+|command|shortcut/i],
  },
  {
    id: 'dev-commands',
    name: 'Development Commands',
    description: 'Build, test, and development scripts',
    sources: [{ block: 'knowledge', textPattern: /## Development Commands[\s\S]*?```/ }],
    contentPatterns: [/pnpm|npm|yarn|install|build|test/i],
  },
  {
    id: 'post-work',
    name: 'Post-Work Verification',
    description: 'Commands to run after completing changes',
    sources: [{ block: 'knowledge', textPattern: /## Post-Work[\s\S]*?```/ }],
    contentPatterns: [/after|verify|format|lint|test/i],
  },
  {
    id: 'documentation',
    name: 'Documentation',
    description: 'Documentation verification guidelines',
    sources: [{ block: 'standards', property: 'documentation' }],
    contentPatterns: [/readme|docs|before|after|verify/i],
  },
  {
    id: 'diagrams',
    name: 'Diagrams',
    description: 'Diagram format and Mermaid guidelines',
    sources: [{ block: 'standards', property: 'diagrams' }],
    contentPatterns: [/mermaid|flowchart|diagram|sequence/i],
  },
  {
    id: 'restrictions',
    name: 'Restrictions',
    description: "Don'ts and forbidden practices",
    sources: [{ block: 'restrictions' }],
    contentPatterns: [/never|don't|do not|avoid|forbidden/i],
  },
];

/**
 * Complete parity matrix projected from canonical target capabilities.
 */
export const PARITY_MATRIX: SectionSpec[] = PARITY_DEFINITIONS.map((definition) => {
  const requiredBy = KNOWN_TARGETS.filter(
    (target) =>
      getTargetSectionCapability(getTargetCapability(target), definition.id)?.support === 'required'
  );
  const optionalFor = KNOWN_TARGETS.filter(
    (target) =>
      getTargetSectionCapability(getTargetCapability(target), definition.id)?.support === 'optional'
  );
  const headerVariations = Object.fromEntries(
    KNOWN_TARGETS.map((target) => [
      target,
      getTargetSectionCapability(getTargetCapability(target), definition.id)?.headers,
    ])
  ) as Partial<Record<FormatterName, string | string[]>>;

  return { ...definition, requiredBy, optionalFor, headerVariations };
});

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
