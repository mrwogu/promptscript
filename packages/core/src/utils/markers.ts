/**
 * PromptScript generation marker utilities.
 *
 * Compiled outputs carry a marker so the toolchain can recognize files it
 * generated. Markers embed a timestamp, so they must be stripped before any
 * content comparison and must never be re-ingested as source content.
 */

// Patterns are assembled from fragments so this file is not itself detected
// as generated output by marker scanners.
const HTML_MARKER = '<!--\\s*PromptScript [^>]+-->';
const YAML_MARKER = '#\\s*promptscript-generated:';

/**
 * Strip all PromptScript generation markers from content.
 *
 * Used to compare generated output against a file on disk while ignoring
 * timestamp-only differences.
 *
 * RegExp objects are created per call to avoid a stateful module-level `g`
 * pattern (which maintains a `lastIndex` cursor between calls).
 *
 * @param content - File content that may contain markers
 * @returns Content without marker lines
 */
export function stripPromptScriptMarkers(content: string): string {
  return content
    .replace(new RegExp(`${HTML_MARKER}\\n*`, 'g'), '')
    .replace(new RegExp(`${YAML_MARKER}[^\\n]+\\n*`, 'g'), '');
}

/**
 * Check whether content starts with a PromptScript generation marker.
 *
 * Only the head of the file is inspected so markers quoted inside prose are
 * not mistaken for a generation marker.
 *
 * @param content - File content to inspect
 * @returns True when the file was produced by PromptScript
 */
export function isGeneratedByPromptScript(content: string): boolean {
  const head = new RegExp(`^\\s*(?:${YAML_MARKER}|${HTML_MARKER})`);
  return content.split('\n', 5).some((line) => head.test(line));
}

/**
 * Remove PromptScript YAML marker lines from raw YAML frontmatter.
 *
 * Generated files carry the marker as the first frontmatter line. When such a
 * file is re-ingested as a skill source, the stale marker must not be passed
 * through to the next compilation output.
 *
 * @param frontmatter - Raw frontmatter block (without the `---` delimiters)
 * @returns Frontmatter without PromptScript marker lines
 */
export function stripFrontmatterMarkerLines(frontmatter: string): string {
  const markerLine = new RegExp(`^\\s*${YAML_MARKER}`);
  return frontmatter
    .split('\n')
    .filter((line) => !markerLine.test(line))
    .join('\n');
}

/**
 * Remove a leading PromptScript HTML marker from a markdown body.
 *
 * Only a marker at the very top of the body is removed, so markers documented
 * inside prose are preserved.
 *
 * @param body - Markdown body content
 * @returns Body without a leading marker line
 */
export function stripLeadingHtmlMarker(body: string): string {
  return body.replace(new RegExp(`^\\s*${HTML_MARKER}\\n*`), '');
}
