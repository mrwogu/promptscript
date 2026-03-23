/**
 * PromptScript generation marker utilities.
 *
 * Markers are added to compiled output files so the compiler can identify
 * files it previously generated. These utilities strip markers before
 * content comparison to avoid false diffs from timestamp-only changes.
 */

/**
 * Strip PromptScript generation markers from content for comparison purposes.
 * This allows comparing actual content changes while ignoring timestamp updates.
 *
 * Regex literals are inlined to avoid stateful module-level RegExp objects
 * with the `g` flag (which maintain a `lastIndex` cursor between calls).
 */
export function stripMarkers(content: string): string {
  return content
    .replace(/<!-- PromptScript [^>]+ -->\n*/g, '')
    .replace(/# promptscript-generated: [^\n]+\n*/g, '');
}
