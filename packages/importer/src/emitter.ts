import { ConfidenceLevel, type ScoredSection } from './confidence.js';
import type { MergedBlock } from './merger.js';

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

    if (block === 'guards') {
      lines.push(`@guards {`);
      for (const section of blockSections) {
        const meta = section.metadata as Record<string, unknown> | undefined;
        const entryName = (meta?.['entryName'] as string) ?? section.heading;
        const applyTo = (meta?.['applyTo'] as string[]) ?? [];
        const description = (meta?.['description'] as string) ?? `${entryName} rules`;
        const applyToStr = applyTo.map((p) => `"${p}"`).join(', ');
        lines.push(`  ${entryName}: {`);
        lines.push(`    applyTo: [${applyToStr}]`);
        lines.push(`    description: "${description}"`);
        lines.push(`    content: """`);
        for (const contentLine of section.content.split('\n')) {
          lines.push(`    ${contentLine}`);
        }
        lines.push(`    """`);
        lines.push(`  }`);
      }
      lines.push(`}`);
      lines.push('');
      continue;
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

export interface ModularEmitOptions {
  projectName: string;
  syntaxVersion?: string;
}

export function emitModularFiles(
  blocks: Map<string, MergedBlock>,
  options: ModularEmitOptions
): Map<string, string> {
  const files = new Map<string, string>();
  const syntaxVersion = options.syntaxVersion ?? '1.0.0';
  const useDirectives: string[] = [];

  const fileBlockMapping: Record<string, string[]> = {
    'context.prs': ['context'],
    'standards.prs': ['standards'],
    'restrictions.prs': ['restrictions'],
    'commands.prs': ['shortcuts', 'knowledge'],
  };

  for (const [filename, blockNames] of Object.entries(fileBlockMapping)) {
    const relevantBlocks = blockNames
      .map((name) => blocks.get(name))
      .filter((b): b is MergedBlock => b !== undefined);
    if (relevantBlocks.length === 0) continue;

    const lines: string[] = [];
    for (const block of relevantBlocks) {
      for (const comment of block.reviewComments) {
        lines.push(comment);
      }
      if (block.confidence < 0.5) {
        lines.push('# REVIEW: low confidence -- verify this mapping');
      }
      lines.push(`@${block.targetBlock} {`);
      lines.push('  """');
      for (const contentLine of block.content.split('\n')) {
        lines.push(`    ${contentLine}`);
      }
      lines.push('  """');
      lines.push('}');
      lines.push('');
    }

    const useName = filename.replace('.prs', '');
    useDirectives.push(`@use ./${useName}`);
    files.set(filename, lines.join('\n'));
  }

  const projectLines: string[] = [];
  projectLines.push('@meta {');
  projectLines.push(`  id: "${options.projectName}"`);
  projectLines.push(`  syntax: "${syntaxVersion}"`);
  projectLines.push('}');
  projectLines.push('');
  for (const dir of useDirectives) {
    projectLines.push(dir);
  }

  const identity = blocks.get('identity');
  if (identity) {
    projectLines.push('');
    for (const comment of identity.reviewComments) {
      projectLines.push(comment);
    }
    projectLines.push('@identity {');
    projectLines.push('  """');
    for (const line of identity.content.split('\n')) {
      projectLines.push(`    ${line}`);
    }
    projectLines.push('  """');
    projectLines.push('}');
  }

  projectLines.push('');
  files.set('project.prs', projectLines.join('\n'));
  return files;
}
