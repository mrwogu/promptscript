import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { GovernanceError, PS5106_CODEOWNERS_UNMANAGED } from '../../utils/governance-error.js';
import { stripControlCharacters } from '../release/git.js';

const MARKER_PREFIX = '# promptscript-generated: prs governance codeowners | project: ';
const MARKER_SUFFIX = ' | do not edit below';
// The UTF-8 byte order mark, read as latin1 so the bytes above the marker stay exact.
const BOM = '\u00EF\u00BB\u00BF';
// GitLab merges sections of the same name, so a hand-written one could add exceptions to ours.
const PROMPTSCRIPT_SECTION_RE = /^\^?\[\s*promptscript\s*\]/i;
// Each wildcard multiplies the backtracking by the name length, and a pull request
// controls both the lines and the file names, so the overlap check stops at three.
const MAX_PATTERN_WILDCARDS = 3;

/** Where a host looks for CODEOWNERS, decided by the output location. */
export type CodeownersHost = 'github' | 'gitlab';

/** The marker line of the project at `project` (repository-relative, `.` for the root). */
export function codeownersMarker(project: string): string {
  return `${MARKER_PREFIX}${project}${MARKER_SUFFIX}`;
}

/** A CODEOWNERS file split at this project's marker. */
export interface ManagedFile {
  /** The whole file, read as latin1 so every byte maps to one character */
  current: string;
  /** A UTF-8 byte order mark the file starts with, kept on write */
  bom: string;
  /** Every line above the marker, as written */
  above: string[];
}

function refuse(file: string, message: string): never {
  throw new GovernanceError(PS5106_CODEOWNERS_UNMANAGED, `${file} ${message}`, file);
}

/** Split an existing file at this project's marker, or refuse it with PS5106. */
function splitAtMarker(
  content: string,
  marker: string,
  file: string,
  host: CodeownersHost
): string[] {
  const lines = content.split('\n').map((line) => line.replace(/\r$/, ''));
  const markers = lines.flatMap((line, index) => (line.startsWith(MARKER_PREFIX) ? [index] : []));
  if (markers.length > 1) {
    refuse(
      file,
      `has ${markers.length} promptscript-generated marker lines. Keep one, at the start of the generated lines, and run the command again.`
    );
  }
  const [index] = markers;
  const found = index === undefined ? undefined : lines[index];
  const add = `Add this line at the end of ${file} to let prs manage the lines below it: ${marker}`;
  if (found === undefined) refuse(file, `has no marker line, so prs does not change it. ${add}`);
  if (found !== marker) {
    const why =
      found.trimEnd() === marker
        ? `has a marker line that differs from ${JSON.stringify(marker)} in trailing spaces`
        : 'is managed for another project';
    refuse(file, `${why}, so prs does not change it. Replace that line with: ${marker}`);
  }
  const above = content.split('\n').slice(0, index);
  if (host === 'gitlab') {
    const section = above.find((line) => PROMPTSCRIPT_SECTION_RE.test(line.trim()));
    if (section !== undefined) {
      refuse(
        file,
        `has the section "${stripControlCharacters(section.trim())}" above the marker. GitLab merges sections of the same name, so its lines would change the generated ones. Rename that section; prs owns the [PromptScript] section.`
      );
    }
  }
  return above;
}

/** The current file and its lines above this project's marker; undefined when there is no file. */
export async function readManaged(
  path: string,
  file: string,
  marker: string,
  host: CodeownersHost
): Promise<ManagedFile | undefined> {
  if (!existsSync(path)) return undefined;
  const current = await readFile(path, 'latin1');
  if (current.includes('\0')) {
    refuse(
      file,
      'has a NUL byte, and GitLab reads such a file as binary and ignores it, generated lines included. prs changes nothing until the byte is removed.'
    );
  }
  const bom = current.startsWith(BOM) ? BOM : '';
  const above = splitAtMarker(current.slice(bom.length), marker, file, host);
  return { current, bom, above };
}

/** The new file: the kept bytes above the marker, then the generated section. */
export function mergedContent(file: ManagedFile | undefined, section: string): string {
  if (file === undefined) return section;
  const above = file.above.length > 0 ? `${file.above.join('\n')}\n` : '';
  return `${file.bom}${above}${section}`;
}

/** Equal apart from CRLF line ends, which a checkout with core.autocrlf writes. */
export function sameContent(a: string, b: string): boolean {
  return a.replaceAll('\r\n', '\n') === b.replaceAll('\r\n', '\n');
}

/**
 * A hand-written CODEOWNERS pattern as a regular expression over root-relative paths
 * without the leading `/`. Covers `*`, `**`, `?`, anchoring and directory patterns,
 * enough to tell which hand-written lines also match a generated path.
 */
function patternMatcher(pattern: string): RegExp {
  const anchored = pattern.startsWith('/') || pattern.slice(0, -1).includes('/');
  const body = pattern.replace(/^\//, '').replace(/\/$/, '');
  let source = '';
  for (let index = 0; index < body.length; index++) {
    const char = body.charAt(index);
    if (body.startsWith('**/', index)) {
      source += '(?:.*/)?';
      index += 2;
    } else if (body.startsWith('**', index)) {
      source += '.*';
      index += 1;
    } else if (char === '*') {
      source += '[^/]*';
    } else if (char === '?') {
      source += '[^/]';
    } else {
      source += char.replace(/[.+^${}()|[\]\\]/g, String.raw`\$&`);
    }
  }
  return new RegExp(`^${anchored ? '' : '(?:.*/)?'}${source}(?:/.*)?$`);
}

/** The pattern of a hand-written line, or undefined for a comment, a blank or a section line. */
function linePattern(line: string): string | undefined {
  const trimmed = line.trim();
  if (
    trimmed === '' ||
    trimmed.startsWith('#') ||
    trimmed.startsWith('[') ||
    trimmed.startsWith('^[')
  ) {
    return undefined;
  }
  return /^(?:\\ |\S)+/.exec(trimmed)?.[0]?.replaceAll(String.raw`\ `, ' ');
}

/**
 * Warnings for hand-written lines above the marker that match a generated prompt file.
 * GitHub uses the last match, so the generated line wins; GitLab applies every section,
 * so both apply.
 */
export function overlapWarnings(
  above: string[],
  promptPaths: string[],
  file: string,
  host: CodeownersHost
): string[] {
  const warnings: string[] = [];
  for (const line of above) {
    const pattern = linePattern(line);
    if (pattern === undefined || pattern.replaceAll(/[^*?]/g, '').length > MAX_PATTERN_WILDCARDS) {
      continue;
    }
    const matcher = patternMatcher(pattern);
    const matched = promptPaths.filter((path) => matcher.test(path.slice(1)));
    if (matched.length === 0) continue;
    const text = `The line "${stripControlCharacters(line.trim())}" in ${file}`;
    warnings.push(
      host === 'gitlab'
        ? `${text} also matches ${matched.join(', ')}. GitLab applies both, so its owners are asked to review too. Move those owners into the prompts or remove the line.`
        : `${text} no longer applies to ${matched.join(', ')}: the generated lines below the marker come later and win. Move those owners into the prompts or remove the line.`
    );
  }
  return warnings;
}
