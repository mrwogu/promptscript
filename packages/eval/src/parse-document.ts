import { isNode, LineCounter, parseDocument, visit, type Document } from 'yaml';

/** Path of a value inside a parsed document. */
export type DocumentPath = ReadonlyArray<string | number>;

/** A parsed YAML or JSON document, or where and why parsing failed. */
export type ParsedDocument =
  | { ok: true; value: unknown; line: (path: DocumentPath) => number | undefined }
  | { ok: false; problem: string; line?: number; column?: number };

const MAX_ALIASES = 20;

// Line of the node at `path`, else of its nearest parent that exists.
function lineLookup(
  doc: Document,
  lineCounter: LineCounter
): (path: DocumentPath) => number | undefined {
  return (path) => {
    for (let depth = path.length; depth >= 0; depth--) {
      const node: unknown = doc.getIn(path.slice(0, depth), true);
      if (isNode(node) && node.range) return lineCounter.linePos(node.range[0]).line;
    }
    return undefined;
  };
}

// JSON keeps JSON.parse semantics: no comments, no single quotes. Only the
// position is read from the error, never its message.
function parseJson(text: string): ParsedDocument {
  const lineCounter = new LineCounter();
  // Valid JSON is valid YAML, so the YAML tree gives the lines of values and
  // finds repeated keys, which JSON.parse accepts with the last one winning
  const doc = parseDocument(text, { lineCounter, prettyErrors: false, uniqueKeys: true });
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch (error) {
    const offset = /position (\d+)/.exec(error instanceof Error ? error.message : '')?.[1];
    if (offset === undefined) return { ok: false, problem: 'is not valid JSON' };
    const { line, col } = lineCounter.linePos(Number(offset));
    return { ok: false, problem: 'is not valid JSON', line, column: col };
  }
  const repeated = doc.errors.find((issue) => issue.code === 'DUPLICATE_KEY');
  if (repeated) {
    const { line, col } = lineCounter.linePos(repeated.pos[0]);
    return { ok: false, problem: 'repeats a key', line, column: col };
  }
  return { ok: true, value, line: lineLookup(doc, lineCounter) };
}

/**
 * Parse one YAML document with an alias cap and no tags, or a JSON document
 * with `JSON.parse` when `json` is set. A failure carries a position and a
 * fixed problem text, never the parser message, which can quote the input.
 *
 * @param text - Document text
 * @param json - Parse as JSON instead of YAML
 * @returns The value with a line lookup, or the failure
 */
export function parseDocumentText(text: string, json: boolean): ParsedDocument {
  if (json) return parseJson(text);
  const lineCounter = new LineCounter();
  const doc = parseDocument(text, {
    lineCounter,
    prettyErrors: false,
    schema: 'core',
    uniqueKeys: true,
  });
  const failAt = (offset: number, problem: string): ParsedDocument => {
    const { line, col } = lineCounter.linePos(offset);
    return { ok: false, problem, line, column: col };
  };

  const issue = doc.errors[0] ?? doc.warnings[0];
  if (issue) return failAt(issue.pos[0], 'is not valid YAML');

  let tagAt: number | undefined;
  visit(doc, (_key, node) => {
    if (isNode(node) && node.tag !== undefined) {
      tagAt = node.range?.[0] ?? 0;
      return visit.BREAK;
    }
    return undefined;
  });
  if (tagAt !== undefined) return failAt(tagAt, 'uses a YAML tag, and tags are not supported');

  let value: unknown;
  try {
    value = doc.toJS({ maxAliasCount: MAX_ALIASES });
  } catch {
    return { ok: false, problem: `expands more than ${MAX_ALIASES} aliases` };
  }
  return { ok: true, value, line: lineLookup(doc, lineCounter) };
}
