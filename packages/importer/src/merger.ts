import type { ScoredSection } from './confidence.js';

export interface SourcedSection extends ScoredSection {
  source: string;
}

export interface MergedBlock {
  targetBlock: string;
  content: string;
  sources: string[];
  confidence: number;
  reviewComments: string[];
}

export interface MergeResult {
  merged: Map<string, MergedBlock>;
  deduplicatedCount: number;
  overallConfidence: number;
}

export function mergeSections(sections: SourcedSection[]): MergeResult {
  const grouped = new Map<string, SourcedSection[]>();
  for (const s of sections) {
    const existing = grouped.get(s.targetBlock);
    if (existing) {
      existing.push(s);
    } else {
      grouped.set(s.targetBlock, [s]);
    }
  }

  const merged = new Map<string, MergedBlock>();
  let totalDeduped = 0;

  for (const [block, blockSections] of grouped) {
    if (block === 'identity') {
      merged.set(block, mergeIdentity(blockSections));
    } else if (block === 'knowledge') {
      merged.set(block, mergeWithAttribution(blockSections));
    } else {
      const result = mergeUnion(blockSections);
      totalDeduped += result.deduped;
      merged.set(block, result.block);
    }
  }

  const allConfidences = sections.map((s) => s.confidence);
  const overallConfidence =
    allConfidences.length > 0
      ? allConfidences.reduce((a, b) => a + b, 0) / allConfidences.length
      : 0;

  return { merged, deduplicatedCount: totalDeduped, overallConfidence };
}

function mergeIdentity(sections: SourcedSection[]): MergedBlock {
  const sorted = [...sections].sort((a, b) => b.content.trim().length - a.content.trim().length);
  const winner = sorted[0]!;
  const others = sorted.slice(1);

  const reviewComments = others.map(
    (s) => `# REVIEW: alt from ${s.source}: "${s.content.trim().slice(0, 60)}..."`
  );

  return {
    targetBlock: 'identity',
    content: winner.content,
    sources: sections.map((s) => s.source),
    confidence: winner.confidence,
    reviewComments,
  };
}

function mergeWithAttribution(sections: SourcedSection[]): MergedBlock {
  const parts = sections.map((s) => `# Source: ${s.source}\n${s.content}`);
  const avgConfidence = sections.reduce((sum, s) => sum + s.confidence, 0) / sections.length;

  return {
    targetBlock: sections[0]!.targetBlock,
    content: parts.join('\n\n'),
    sources: sections.map((s) => s.source),
    confidence: avgConfidence,
    reviewComments: [],
  };
}

function mergeUnion(sections: SourcedSection[]): { block: MergedBlock; deduped: number } {
  const seenLines = new Set<string>();
  const uniqueLines: string[] = [];
  let deduped = 0;

  for (const s of sections) {
    const lines = s.content.split('\n');
    for (const line of lines) {
      const normalized = line.trim().replace(/\s+/g, ' ');
      if (normalized.length === 0) continue;
      if (seenLines.has(normalized)) {
        deduped++;
        continue;
      }
      seenLines.add(normalized);
      uniqueLines.push(line);
    }
  }

  const avgConfidence = sections.reduce((sum, s) => sum + s.confidence, 0) / sections.length;

  return {
    block: {
      targetBlock: sections[0]!.targetBlock,
      content: uniqueLines.join('\n'),
      sources: sections.map((s) => s.source),
      confidence: avgConfidence,
      reviewComments: [],
    },
    deduped,
  };
}
