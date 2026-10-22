import { PROMPT_BUNDLE_INDEX_SCHEMA_URL, hashPromptBundle } from '@promptscript/core';

/**
 * First key of every bundle and index file. A bundle or index is told apart from any other JSON
 * file by this line alone, so quoting the URL somewhere else in a file never claims it.
 */
export const PROMPT_BUNDLE_SCHEMA_LINE =
  /^\s*"\$schema": "https:\/\/getpromptscript\.dev\/schema\/prompt-bundle(-index)?\/v1\.json",$/;

/** Whether the file starts like a generated bundle or index: an opening brace, then `$schema`. */
export function hasPromptBundleSchemaLine(content: string): boolean {
  const [first, second] = content.replace(/^\uFEFF/, '').split(/\r?\n/, 2);
  return first?.trim() === '{' && second !== undefined && PROMPT_BUNDLE_SCHEMA_LINE.test(second);
}

/** File name of the index in the default output. */
const PROMPT_BUNDLE_INDEX_FILE = 'index.json';

/**
 * Whether a file is a generated bundle or index that is still what the compiler wrote.
 *
 * It must start with the `$schema` line and parse as JSON. A bundle must carry a `contentHash`
 * that verifies and sit under the name the target gives it, `<last id segment>.json`. An index
 * must be named `index.json`, the name of the default output. A copied, renamed or hand-edited file fails
 * the check, so cleanup never removes it.
 */
export function isVerifiedPromptBundleOutput(content: string, fileName: string): boolean {
  if (!hasPromptBundleSchemaLine(content)) return false;
  let parsed: Record<string, unknown>;
  try {
    // The file starts with an opening brace, so a valid parse is an object.
    parsed = JSON.parse(content) as Record<string, unknown>;
  } catch {
    return false;
  }
  if (parsed['$schema'] === PROMPT_BUNDLE_INDEX_SCHEMA_URL) {
    return Array.isArray(parsed['prompts']) && fileName === PROMPT_BUNDLE_INDEX_FILE;
  }
  try {
    return (
      typeof parsed['contentHash'] === 'string' &&
      hashPromptBundle(parsed) === parsed['contentHash'] &&
      typeof parsed['id'] === 'string' &&
      fileName === `${parsed['id'].split('/').at(-1)}.json`
    );
  } catch {
    return false;
  }
}
