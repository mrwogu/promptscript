import {
  getPrimarySectionForBlock,
  getSectionContract,
  type PresentationEntry,
  type Program,
  type SectionContract,
} from '@promptscript/core';

export interface SectionTitleOptions {
  readonly formatterTitles?: Readonly<Record<string, string | undefined>>;
  readonly defaultTitle?: string;
  readonly sourceOverrides?: boolean;
}

function presentationSectionId(blockName: string, entry: PresentationEntry): string | undefined {
  if (entry.sectionId) return getSectionContract(entry.sectionId)?.id ?? entry.sectionId;
  return getPrimarySectionForBlock(blockName)?.id;
}

function sourceTitle(ast: Program, section: SectionContract): string | undefined {
  const owners = [section.primaryOwner, ...section.fallbackOwners];
  for (const source of ['explicit', 'legacy'] as const) {
    for (const owner of owners) {
      const candidates = ast.blocks
        .filter((block) => block.name === owner)
        .flatMap((block) =>
          (block.canonicalBody?.entries ?? []).filter(
            (entry): entry is PresentationEntry =>
              entry.type === 'PresentationEntry' &&
              entry.source === source &&
              presentationSectionId(block.name, entry) === section.id
          )
        );
      const selected = candidates.at(-1);
      if (selected) return selected.title;
    }
  }
  return undefined;
}

export function resolveSourceSectionTitle(
  ast: Program,
  sectionIdOrAlias: string
): string | undefined {
  const section = getSectionContract(sectionIdOrAlias);
  return section ? sourceTitle(ast, section) : undefined;
}

function configuredTitle(
  section: SectionContract,
  titles: Readonly<Record<string, string | undefined>> | undefined
): string | undefined {
  if (!titles) return undefined;
  for (const key of [section.id, ...section.formatterAliases]) {
    const title = titles[key];
    if (title !== undefined) return title;
  }
  return undefined;
}

/**
 * Resolve a generated section title without changing its output protocol.
 */
export function resolveSectionTitle(
  ast: Program,
  sectionIdOrAlias: string,
  options: SectionTitleOptions = {}
): string {
  const section = getSectionContract(sectionIdOrAlias);
  if (!section) {
    return options.defaultTitle ?? sectionIdOrAlias;
  }
  return (
    (options.sourceOverrides === false ? undefined : sourceTitle(ast, section)) ??
    configuredTitle(section, options.formatterTitles) ??
    options.defaultTitle ??
    section.defaultTitle
  );
}
