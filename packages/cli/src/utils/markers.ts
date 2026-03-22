/**
 * PromptScript generation marker utilities.
 *
 * Markers are added to compiled output files so the compiler can identify
 * files it previously generated. These utilities strip markers before
 * content comparison to avoid false diffs from timestamp-only changes.
 */

/** Matches HTML-style markers: <!-- PromptScript 2026-03-22T... - do not edit --> */
const HTML_MARKER_REGEX = /<!-- PromptScript [^>]+ -->\n*/g;

/** Matches YAML-style markers: # promptscript-generated: 2026-03-22T... */
const YAML_MARKER_REGEX = /# promptscript-generated: [^\n]+\n*/g;

/**
 * Strip PromptScript generation markers from content for comparison purposes.
 * This allows comparing actual content changes while ignoring timestamp updates.
 */
export function stripMarkers(content: string): string {
  return content.replace(HTML_MARKER_REGEX, '').replace(YAML_MARKER_REGEX, '');
}
