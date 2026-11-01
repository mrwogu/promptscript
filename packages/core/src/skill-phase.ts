/** The resolved content needed to render one composed skill phase. */
export interface SkillPhaseContent {
  /** One-based phase position in the composed skill. */
  phaseNumber: number;
  /** Phase display name, including any authored alias. */
  name: string;
  /** Context blocks in their resolved display order. */
  contextBlocks: { blockType: string; text: string }[];
  /** Instructions appended after the context blocks, when present. */
  skillContent?: string;
}

/**
 * Render a composed skill phase with a filename-only source marker.
 * Callers derive the filename with their platform's path implementation.
 * Full source paths remain in the resolver's provenance metadata.
 */
export function buildSkillPhaseSection(phase: SkillPhaseContent, sourceFilename: string): string {
  const lines = [
    `## Phase ${phase.phaseNumber}: ${phase.name}`,
    `<!-- composed-from: ${sourceFilename} -->`,
  ];
  for (const context of phase.contextBlocks) {
    const heading = context.blockType.charAt(0).toUpperCase() + context.blockType.slice(1);
    lines.push('', `### ${heading}`, context.text);
  }
  if (phase.skillContent) {
    lines.push('', '### Instructions', phase.skillContent);
  }
  return lines.join('\n');
}
