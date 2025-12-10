/**
 * Registry of known sections that formatters can generate.
 * Used for parity testing and documentation.
 */

/**
 * Section metadata for documentation and validation.
 */
export interface SectionInfo {
  /** Section identifier (kebab-case) */
  id: string;
  /** Human-readable name */
  name: string;
  /** Description of what this section contains */
  description: string;
  /** Source block(s) in PRS that provide data for this section */
  sourceBlocks: string[];
  /** Whether this section is required for complete output */
  required: boolean;
}

/**
 * All known sections that formatters should support.
 * This is the source of truth for section parity.
 */
export const KNOWN_SECTIONS: SectionInfo[] = [
  {
    id: 'project',
    name: 'Project',
    description: 'Project identity and purpose',
    sourceBlocks: ['identity'],
    required: true,
  },
  {
    id: 'tech-stack',
    name: 'Tech Stack',
    description: 'Languages, frameworks, and tools',
    sourceBlocks: ['context'],
    required: false,
  },
  {
    id: 'architecture',
    name: 'Architecture',
    description: 'System structure and components',
    sourceBlocks: ['context'],
    required: false,
  },
  {
    id: 'code-standards',
    name: 'Code Standards',
    description: 'TypeScript, naming, error handling standards',
    sourceBlocks: ['standards'],
    required: false,
  },
  {
    id: 'commands',
    name: 'Commands',
    description: 'Development commands and shortcuts',
    sourceBlocks: ['shortcuts', 'knowledge'],
    required: false,
  },
  {
    id: 'git-commits',
    name: 'Git Commits',
    description: 'Commit message conventions',
    sourceBlocks: ['standards'],
    required: false,
  },
  {
    id: 'configuration-files',
    name: 'Configuration Files',
    description: 'ESLint, Vite, and other config guidelines',
    sourceBlocks: ['standards'],
    required: false,
  },
  {
    id: 'documentation',
    name: 'Documentation',
    description: 'Documentation verification guidelines',
    sourceBlocks: ['standards'],
    required: false,
  },
  {
    id: 'post-work',
    name: 'Post-Work Verification',
    description: 'Commands to run after changes',
    sourceBlocks: ['knowledge'],
    required: false,
  },
  {
    id: 'diagrams',
    name: 'Diagrams',
    description: 'Diagram format guidelines (Mermaid)',
    sourceBlocks: ['standards'],
    required: false,
  },
  {
    id: 'restrictions',
    name: 'Restrictions',
    description: "Don'ts and forbidden practices",
    sourceBlocks: ['restrictions'],
    required: false,
  },
];

/**
 * Get section IDs that a formatter should generate given available source blocks.
 */
export function getExpectedSections(availableBlocks: string[]): string[] {
  return KNOWN_SECTIONS.filter((section) =>
    section.sourceBlocks.some((block) => availableBlocks.includes(block))
  ).map((s) => s.id);
}

/**
 * Extract section headers from formatted output.
 * Works with both markdown (## section) and XML (<section>) formats.
 */
export function extractSectionsFromOutput(content: string): string[] {
  const sections: string[] = [];

  // Match markdown headers: ## section-name or ### subsection
  const mdMatches = content.matchAll(/^##\s+([a-z][a-z0-9-]*)/gim);
  for (const match of mdMatches) {
    const section = match[1]?.toLowerCase();
    if (section) sections.push(section);
  }

  // Match XML tags: <section-name>
  const xmlMatches = content.matchAll(/<([a-z][a-z0-9-]*)>/gi);
  for (const match of xmlMatches) {
    const section = match[1]?.toLowerCase();
    if (section && !sections.includes(section)) sections.push(section);
  }

  return sections;
}

/**
 * Find sections that are missing from output but expected.
 */
export function findMissingSections(
  outputSections: string[],
  expectedSections: string[]
): string[] {
  const outputSet = new Set(outputSections.map((s) => s.toLowerCase()));
  return expectedSections.filter((s) => !outputSet.has(s.toLowerCase()));
}

/**
 * Normalize section names for comparison.
 * Handles variations like "donts" vs "restrictions", "code-style" vs "code-standards".
 */
export function normalizeSectionName(name: string): string {
  const aliases: Record<string, string> = {
    donts: 'restrictions',
    "don'ts": 'restrictions',
    don: 'restrictions', // partial match from "Don'ts"
    'code-style': 'code-standards',
    code: 'code-standards',
    'post-work-verification': 'post-work',
    'documentation-verification': 'documentation',
  };

  const lower = name.toLowerCase();
  return aliases[lower] ?? lower;
}
