import { ConfidenceLevel, type ScoredSection } from './confidence.js';

export interface EmitOptions {
  projectName: string;
}

export function emitPrs(sections: ScoredSection[], options: EmitOptions): string {
  const lines: string[] = [];

  // Emit @meta block
  lines.push('@meta {');
  lines.push(`  id: "${options.projectName}"`);
  lines.push('  syntax: "1.0.0"');
  lines.push('}');

  // Group sections by target block, preserving order of first occurrence
  const grouped = groupByBlock(sections);

  for (const [block, blockSections] of grouped) {
    lines.push('');

    // Add REVIEW comments for non-HIGH confidence sections
    const needsReview = blockSections.some((s) => s.level !== ConfidenceLevel.HIGH);
    if (needsReview) {
      const headings = blockSections
        .filter((s) => s.level !== ConfidenceLevel.HIGH)
        .map((s) => `"${s.heading}" (${Math.round(s.confidence * 100)}%)`)
        .join(', ');
      lines.push(`# REVIEW: ${headings} — verify this block classification`);
    }

    lines.push(`@${block} {`);

    // Merge content from all sections in this block
    const mergedContent = blockSections.map((s) => s.content).join('\n\n');
    lines.push(`  """`);
    for (const contentLine of mergedContent.split('\n')) {
      lines.push(`    ${contentLine}`);
    }
    lines.push(`  """`);
    lines.push('}');
  }

  lines.push('');
  return lines.join('\n');
}

function groupByBlock(sections: ScoredSection[]): Map<string, ScoredSection[]> {
  const grouped = new Map<string, ScoredSection[]>();
  for (const section of sections) {
    const existing = grouped.get(section.targetBlock);
    if (existing) {
      existing.push(section);
    } else {
      grouped.set(section.targetBlock, [section]);
    }
  }
  return grouped;
}
