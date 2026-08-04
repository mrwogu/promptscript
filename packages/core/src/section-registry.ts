/**
 * Browser-safe contract for a generated human-readable section.
 */
export const CONTEXTUAL_DIRECTIVES = ['@header'] as const;
export const CONTEXTUAL_OPERATION_DIRECTIVES = ['@override'] as const;

export interface SectionContract {
  readonly id: string;
  readonly defaultTitle: string;
  readonly description: string;
  /** Blocks whose keyless @header directive names this section. */
  readonly primaryForBlocks: readonly string[];
  readonly primaryOwner: string;
  readonly fallbackOwners: readonly string[];
  readonly sourceBlocks: readonly string[];
  readonly required: boolean;
  readonly legacyHeadingFallback: boolean;
  readonly formatterAliases: readonly string[];
}

/**
 * Canonical registry shared by parsing, validation, and formatting.
 */
export const SECTION_REGISTRY: readonly SectionContract[] = [
  {
    id: 'project',
    defaultTitle: 'Project',
    description: 'Project identity and purpose',
    primaryForBlocks: ['identity'],
    primaryOwner: 'identity',
    fallbackOwners: ['context'],
    sourceBlocks: ['identity', 'context'],
    required: true,
    legacyHeadingFallback: true,
    formatterAliases: ['project'],
  },
  {
    id: 'tech-stack',
    defaultTitle: 'Tech Stack',
    description: 'Languages, frameworks, and tools',
    primaryForBlocks: [],
    primaryOwner: 'context',
    fallbackOwners: ['standards'],
    sourceBlocks: ['context', 'standards'],
    required: false,
    legacyHeadingFallback: false,
    formatterAliases: ['techStack'],
  },
  {
    id: 'architecture',
    defaultTitle: 'Architecture',
    description: 'System structure and components',
    primaryForBlocks: [],
    primaryOwner: 'context',
    fallbackOwners: [],
    sourceBlocks: ['context'],
    required: false,
    legacyHeadingFallback: false,
    formatterAliases: ['architecture'],
  },
  {
    id: 'context',
    defaultTitle: 'Context',
    description: 'Additional project context',
    primaryForBlocks: ['context'],
    primaryOwner: 'context',
    fallbackOwners: [],
    sourceBlocks: ['context'],
    required: false,
    legacyHeadingFallback: true,
    formatterAliases: ['context'],
  },
  {
    id: 'code-standards',
    defaultTitle: 'Code Style',
    description: 'Language, naming, error handling, and testing standards',
    primaryForBlocks: ['standards'],
    primaryOwner: 'standards',
    fallbackOwners: [],
    sourceBlocks: ['standards'],
    required: false,
    legacyHeadingFallback: true,
    formatterAliases: ['codeStandards'],
  },
  {
    id: 'git-commits',
    defaultTitle: 'Git Commits',
    description: 'Commit message conventions',
    primaryForBlocks: [],
    primaryOwner: 'standards',
    fallbackOwners: [],
    sourceBlocks: ['standards'],
    required: false,
    legacyHeadingFallback: false,
    formatterAliases: ['gitCommits'],
  },
  {
    id: 'configuration-files',
    defaultTitle: 'Config Files',
    description: 'Configuration file guidelines',
    primaryForBlocks: [],
    primaryOwner: 'standards',
    fallbackOwners: [],
    sourceBlocks: ['standards'],
    required: false,
    legacyHeadingFallback: false,
    formatterAliases: ['configFiles'],
  },
  {
    id: 'commands',
    defaultTitle: 'Commands',
    description: 'Development commands and shortcuts',
    primaryForBlocks: ['shortcuts', 'commands'],
    primaryOwner: 'shortcuts',
    fallbackOwners: ['commands', 'knowledge'],
    sourceBlocks: ['shortcuts', 'commands', 'knowledge'],
    required: false,
    legacyHeadingFallback: true,
    formatterAliases: ['commands'],
  },
  {
    id: 'post-work',
    defaultTitle: 'Post-Work Verification',
    description: 'Commands to run after changes',
    primaryForBlocks: [],
    primaryOwner: 'knowledge',
    fallbackOwners: [],
    sourceBlocks: ['knowledge'],
    required: false,
    legacyHeadingFallback: false,
    formatterAliases: ['postWork'],
  },
  {
    id: 'documentation',
    defaultTitle: 'Documentation',
    description: 'Documentation guidelines',
    primaryForBlocks: [],
    primaryOwner: 'standards',
    fallbackOwners: [],
    sourceBlocks: ['standards'],
    required: false,
    legacyHeadingFallback: false,
    formatterAliases: ['documentation'],
  },
  {
    id: 'diagrams',
    defaultTitle: 'Diagrams',
    description: 'Diagram format guidelines',
    primaryForBlocks: [],
    primaryOwner: 'standards',
    fallbackOwners: [],
    sourceBlocks: ['standards'],
    required: false,
    legacyHeadingFallback: false,
    formatterAliases: ['diagrams'],
  },
  {
    id: 'knowledge',
    defaultTitle: 'Knowledge',
    description: 'Additional project knowledge',
    primaryForBlocks: ['knowledge'],
    primaryOwner: 'knowledge',
    fallbackOwners: [],
    sourceBlocks: ['knowledge'],
    required: false,
    legacyHeadingFallback: true,
    formatterAliases: ['knowledge'],
  },
  {
    id: 'restrictions',
    defaultTitle: 'Restrictions',
    description: 'Forbidden practices',
    primaryForBlocks: ['restrictions'],
    primaryOwner: 'restrictions',
    fallbackOwners: [],
    sourceBlocks: ['restrictions'],
    required: false,
    legacyHeadingFallback: true,
    formatterAliases: ['restrictions'],
  },
  {
    id: 'examples',
    defaultTitle: 'Examples',
    description: 'Input and output examples',
    primaryForBlocks: ['examples'],
    primaryOwner: 'examples',
    fallbackOwners: [],
    sourceBlocks: ['examples'],
    required: false,
    legacyHeadingFallback: true,
    formatterAliases: ['examples'],
  },
] as const;

export function getSectionContract(sectionIdOrAlias: string): SectionContract | undefined {
  return SECTION_REGISTRY.find(
    (section) =>
      section.id === sectionIdOrAlias || section.formatterAliases.includes(sectionIdOrAlias)
  );
}

export function getPrimarySectionForBlock(blockName: string): SectionContract | undefined {
  return SECTION_REGISTRY.find((section) => section.primaryForBlocks.includes(blockName));
}

export function getSectionsForBlock(blockName: string): readonly SectionContract[] {
  return SECTION_REGISTRY.filter(
    (section) => section.primaryOwner === blockName || section.fallbackOwners.includes(blockName)
  );
}

export function blockOwnsSection(blockName: string, sectionIdOrAlias: string): boolean {
  const section = getSectionContract(sectionIdOrAlias);
  return (
    section !== undefined &&
    (section.primaryOwner === blockName || section.fallbackOwners.includes(blockName))
  );
}
