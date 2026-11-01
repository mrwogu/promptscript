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

function toSlashes(path: string): string {
  return path.replaceAll('\\', '/');
}

/**
 * Build the portable label used in a `composed-from` marker.
 *
 * The label is the source path relative to the project root, with `/`
 * separators. When the source is outside the root, or no root is given,
 * only the file name is returned. An empty root means the virtual root,
 * where Windows drive paths also fall back to the file name.
 * Absolute paths and `..` segments are never returned.
 */
export function getSkillPhaseSourceLabel(source: string, projectRoot?: string): string {
  const normalizedSource = toSlashes(source);
  const trimmedSource = normalizedSource.replace(/\/+$/, '');
  const fileName = trimmedSource.slice(trimmedSource.lastIndexOf('/') + 1) || source;
  if (projectRoot === undefined) {
    return fileName;
  }
  // Virtual file systems have no leading slash, so compare without it.
  const relativeSource = normalizedSource.replace(/^\/+/, '');
  const root = toSlashes(projectRoot)
    .split('/')
    .filter((part) => part !== '' && part !== '.')
    .join('/');
  const prefix = root === '' ? '' : `${root}/`;
  // A drive path at the virtual root is absolute, never project relative.
  if (root === '' && /^[A-Za-z]:/.test(relativeSource)) {
    return fileName;
  }
  if (!relativeSource.startsWith(prefix)) {
    return fileName;
  }
  const parts = relativeSource
    .slice(prefix.length)
    .split('/')
    .filter((part) => part.length > 0 && part !== '.');
  return parts.length === 0 || parts.includes('..') ? fileName : parts.join('/');
}

/**
 * Render a composed skill phase with a portable source marker.
 * Callers build the label with `getSkillPhaseSourceLabel`, so the marker never
 * holds an absolute path. Full source paths remain in the resolver's
 * provenance metadata.
 */
export function buildSkillPhaseSection(phase: SkillPhaseContent, sourceLabel: string): string {
  const lines = [
    `## Phase ${phase.phaseNumber}: ${phase.name}`,
    `<!-- composed-from: ${sourceLabel} -->`,
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
