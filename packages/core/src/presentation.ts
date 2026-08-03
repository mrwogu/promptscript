import type { BlockEntry, PresentationEntry } from './types/index.js';
import { getPrimarySectionForBlock } from './section-registry.js';
import { compareVersions, isValidVersion } from './utils/version.js';

export type PresentationPrecedence = 'base' | 'incoming';

export interface PresentationSelection {
  readonly base: readonly PresentationEntry[];
  readonly incoming: readonly PresentationEntry[];
}

export function presentationEntryKey(entry: PresentationEntry, blockName?: string): string {
  return (
    entry.sectionId ?? (blockName ? getPrimarySectionForBlock(blockName)?.id : undefined) ?? ''
  );
}

function sourceRank(entry: PresentationEntry): number {
  return entry.source === 'explicit' ? 2 : 1;
}

/**
 * Select presentation metadata by source rank and operation precedence.
 */
export function selectPresentationEntries(
  baseEntries: readonly BlockEntry[],
  incomingEntries: readonly BlockEntry[],
  precedence: PresentationPrecedence,
  blockName?: string
): PresentationSelection {
  const base = baseEntries.filter(
    (entry): entry is PresentationEntry => entry.type === 'PresentationEntry'
  );
  const incoming = incomingEntries.filter(
    (entry): entry is PresentationEntry => entry.type === 'PresentationEntry'
  );
  const selectedBase = new Set<PresentationEntry>();
  const selectedIncoming = new Set<PresentationEntry>();
  const keys = new Set([
    ...base.map((entry) => presentationEntryKey(entry, blockName)),
    ...incoming.map((entry) => presentationEntryKey(entry, blockName)),
  ]);

  for (const key of keys) {
    const baseMatches = base.filter((entry) => presentationEntryKey(entry, blockName) === key);
    const incomingMatches = incoming.filter(
      (entry) => presentationEntryKey(entry, blockName) === key
    );
    const baseRank = Math.max(0, ...baseMatches.map(sourceRank));
    const incomingRank = Math.max(0, ...incomingMatches.map(sourceRank));
    const selectedLayer =
      baseRank > incomingRank ? 'base' : incomingRank > baseRank ? 'incoming' : precedence;
    const matches = selectedLayer === 'base' ? baseMatches : incomingMatches;
    const rank = selectedLayer === 'base' ? baseRank : incomingRank;
    const selected = selectedLayer === 'base' ? selectedBase : selectedIncoming;
    for (const entry of matches) {
      if (sourceRank(entry) === rank) selected.add(entry);
    }
  }

  return {
    base: base.filter((entry) => selectedBase.has(entry)),
    incoming: incoming.filter((entry) => selectedIncoming.has(entry)),
  };
}

/**
 * Promote an initial text heading for opted-in blocks in syntax 1.5.0+.
 */
export function normalizeLegacyHeadingEntries(
  blockName: string,
  entries: readonly BlockEntry[],
  syntaxVersion: string | undefined
): readonly BlockEntry[] {
  const section = getPrimarySectionForBlock(blockName);
  if (
    !syntaxVersion ||
    !isValidVersion(syntaxVersion) ||
    compareVersions(syntaxVersion, '1.5.0') < 0 ||
    !section?.legacyHeadingFallback ||
    entries.some(
      (entry) =>
        entry.type === 'FieldEntry' || entry.type === 'ListEntry' || entry.type === 'InlineUseEntry'
    )
  ) {
    return entries;
  }

  const textIndex = entries.findIndex((entry) => entry.type === 'TextEntry');
  const textEntry = entries[textIndex];
  if (!textEntry || textEntry.type !== 'TextEntry') return entries;
  const heading = /^##[ \t]+([^\r\n]+)(?:\r?\n|$)/.exec(textEntry.text);
  const title = heading?.[1]?.trim();
  if (!heading || !title) return entries;

  const presentation: PresentationEntry = {
    type: 'PresentationEntry',
    title,
    source: 'legacy',
    loc: textEntry.loc,
    titleLoc: textEntry.loc,
  };
  const remainder = textEntry.text.slice(heading[0].length);
  return [
    ...entries.slice(0, textIndex),
    presentation,
    ...(remainder ? [{ ...textEntry, text: remainder }] : []),
    ...entries.slice(textIndex + 1),
  ];
}
