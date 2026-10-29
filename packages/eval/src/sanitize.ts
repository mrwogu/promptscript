// C0 controls, DEL and C1 controls
// eslint-disable-next-line no-control-regex
const CONTROLS = /[\u0000-\u001f\u007f-\u009f]/g;
// Bidi controls: ALM, LRM, RLM, embeddings, overrides and isolates
const BIDI = /[\u061c\u200e\u200f\u202a-\u202e\u2066-\u2069]/g;
// CR, LF and the Unicode line and paragraph separators
const LINE_BREAKS = /[\r\n\u2028\u2029]/g;
// What XML 1.0 cannot hold once controls are gone: lone surrogates, U+FFFE and U+FFFF
const XML_ILLEGAL =
  /[\ud800-\udbff](?![\udc00-\udfff])|(?<![\ud800-\udbff])[\udc00-\udfff]|[\ufffe\uffff]/g;

/**
 * Normalize a string that comes from a model, a provider or a dataset before
 * it is shown or written: line breaks become a space, control and bidi
 * characters are removed. Runs the same on and off a terminal.
 */
export function cleanText(text: string): string {
  return text.replaceAll(LINE_BREAKS, ' ').replaceAll(CONTROLS, '').replaceAll(BIDI, '');
}

/** {@link cleanText} on every string of a JSON-like value; object keys stay. */
export function cleanValue<T>(value: T): T {
  if (typeof value === 'string') return cleanText(value) as T;
  if (Array.isArray(value)) return value.map((item: unknown) => cleanValue(item)) as T;
  if (typeof value === 'object' && value !== null) {
    const copy: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) copy[key] = cleanValue(item);
    return copy as T;
  }
  return value;
}

/**
 * A Markdown code span for untrusted text. The fence is one backtick longer
 * than the longest run inside. Pipes are escaped only in a table `cell`.
 * Text that is empty after cleaning gives `-`, since an empty span is not one.
 */
export function markdownCode(text: string, cell = false): string {
  const cleaned = cleanText(text);
  if (cleaned === '') return '-';
  const clean = cell ? escapeCell(cleaned) : cleaned;
  const longest = Math.max(0, ...(clean.match(/`+/g) ?? []).map((run) => run.length));
  const fence = '`'.repeat(longest + 1);
  const pad = clean.startsWith('`') || clean.endsWith('`') || longest > 0 ? ' ' : '';
  return `${fence}${pad}${clean}${pad}${fence}`;
}

// Backslashes first, so an escaped pipe cannot be turned back into a cell border
function escapeCell(text: string): string {
  const slash = String.fromCodePoint(92);
  return text.replaceAll(slash, slash + slash).replaceAll('|', `${slash}|`);
}

/** Text for an XML 1.0 attribute or element: cleaned, illegal characters removed, escaped. */
export function xmlText(text: string): string {
  return cleanText(text)
    .replaceAll(XML_ILLEGAL, '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}
