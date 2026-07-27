/**
 * PromptScript generation marker utilities.
 *
 * Markers are added to compiled output files so the compiler can identify
 * files it previously generated. Stripping them before content comparison
 * avoids false diffs from timestamp-only changes.
 */

export { stripPromptScriptMarkers as stripMarkers } from '@promptscript/core';
