/**
 * Fails when a pull request makes a breaking change to an API report
 * (packages/<name>/api/*.api.md) or to a JSON schema (schema/*.json) and is
 * not marked as breaking. The base is the merge base of HEAD and origin/main,
 * so only the changes of the pull request itself count.
 *
 * Pull requests are squash-merged. With one commit, its subject lands on main,
 * with more commits the pull request title does. The commit messages become the
 * body. So the pull request counts as breaking when that subject has a "!", or
 * when a commit message has a "BREAKING CHANGE:" line. The description is not used.
 *
 * Usage: PR_TITLE='feat(core)!: drop parseLegacy' pnpm api:breaking
 * Env:   PR_TITLE - the pull request title
 * Exit codes:
 *   0 - No breaking change, or the pull request is marked as breaking
 *   1 - Unmarked breaking change, or the git history is too short
 *
 * Reports of private packages are listed but not enforced, nobody outside the
 * repo depends on them yet.
 */

import { spawnSync } from 'node:child_process';
import { realpathSync } from 'node:fs';
import { basename } from 'node:path';
import { pathToFileURL } from 'node:url';

const BASE = 'origin/main';
const REPORT = /^packages\/([^/]+)\/api\/[^/]+\.api\.md$/;
const SCHEMA = /^schema\/[^/]+\.json$/;
// Written by prs and only read by others, so a new required field is no break but a removed one is.
const OUTPUT_SCHEMAS = new Set([
  'approval-report-v1.json',
  'audit-log-v1.json',
  'diff-v1.json',
  'eval-comparison-v1.json',
  'eval-import-summary-v1.json',
  'eval-report-v1.json',
  'release-report-v1.json',
]);

const ANNOTATIONS = new Set([
  'description',
  'title',
  'default',
  'examples',
  '$comment',
  'deprecated',
]);

type Json = Record<string, unknown>;

interface SchemaRoots {
  base: Json;
  head: Json;
  seen: Set<string>;
  output: boolean;
}

// The squash subject is the only commit subject with one commit, else the pull request title.
export function isMarkedBreaking(title: string, messages: string[]): boolean {
  const subject = messages.length === 1 ? ((messages[0] ?? '').split('\n')[0] ?? '') : title;
  return (
    /^\w+(?:\([^()]*\))?!: /.test(subject) ||
    messages.some((message) => /^BREAKING[ -]CHANGE: /m.test(message))
  );
}

function isJson(value: unknown): value is Json {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isCommentOrImport(line: string): boolean {
  const text = line.trim();
  return text.startsWith('//') || text.startsWith('import ');
}

// Declarations are separated by blank lines.
function splitDeclarations(lines: string[]): string[][] {
  const declarations: string[][] = [[]];
  for (const line of lines) {
    if (line.trim() === '') {
      declarations.push([]);
    } else {
      declarations.at(-1)?.push(line);
    }
  }
  return declarations;
}

// Counts each code line of the public declarations under the key "first line + line".
// The first line is the context, so the same member line in two interfaces stays apart.
// Only a top-level @internal tag is handled, no member-level tags exist yet.
export function publicReportLines(report: string): Map<string, number> {
  const lines = report.replaceAll('\r\n', '\n').split('\n');
  const start = lines.indexOf('```ts');
  const end = lines.lastIndexOf('```');
  const counts = new Map<string, number>();
  if (start === -1 || end <= start) {
    return counts;
  }
  for (const declaration of splitDeclarations(lines.slice(start + 1, end))) {
    if (declaration.some((line) => line.startsWith('// @internal'))) {
      continue;
    }
    const code = declaration.filter((line) => !isCommentOrImport(line));
    for (const line of code) {
      const key = `${code[0] ?? ''}\n${line}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  return counts;
}

function describeLine(key: string): string {
  const [first = '', line = ''] = key.split('\n').map((text) => text.trim());
  return first === line ? line : `${line} (in ${first})`;
}

// A changed first line of a declaration lists the whole declaration.
export function removedReportLines(base: string, head: string | undefined): string[] {
  const headCounts = head === undefined ? new Map<string, number>() : publicReportLines(head);
  const removed: string[] = [];
  for (const [key, count] of publicReportLines(base)) {
    if (count > (headCounts.get(key) ?? 0)) {
      removed.push(describeLine(key));
    }
  }
  return removed;
}

function pointerPart(part: string): string {
  let text = part;
  try {
    text = decodeURIComponent(part);
  } catch {
    // A malformed escape is used as it is, the lookup then finds nothing.
  }
  return text.replaceAll('~1', '/').replaceAll('~0', '~');
}

function resolveRef(root: Json, ref: string): unknown {
  let node: unknown = root;
  for (const part of ref.slice(2).split('/')) {
    node = isJson(node) ? node[pointerPart(part)] : undefined;
  }
  return node;
}

function isLocalRef(node: Json): boolean {
  return typeof node.$ref === 'string' && node.$ref.startsWith('#/');
}

// A ref can point to another ref, follow them until the node is not a ref.
function deref(root: Json, node: Json): Json | undefined {
  const visited = new Set<string>();
  let current: unknown = node;
  while (isJson(current) && isLocalRef(current)) {
    const ref = String(current.$ref);
    if (visited.has(ref)) {
      return undefined;
    }
    visited.add(ref);
    current = resolveRef(root, ref);
  }
  return isJson(current) ? current : undefined;
}

function typesOf(type: unknown): string[] {
  if (typeof type === 'string') {
    return [type];
  }
  return Array.isArray(type) ? type.map(String) : [];
}

function compareProperties(roots: SchemaRoots, base: Json, head: Json, path: string): string[] {
  const baseProps = isJson(base.properties) ? base.properties : {};
  const headProps = isJson(head.properties) ? head.properties : {};
  const breaks: string[] = [];
  for (const [name, baseProp] of Object.entries(baseProps)) {
    const where = path === '' ? name : `${path}.${name}`;
    if (name in headProps) {
      breaks.push(...compareSchemas(roots, baseProp, headProps[name], where));
    } else {
      breaks.push(`${where}: property removed`);
    }
  }
  return breaks;
}

// A new required entry breaks input schemas, a removed one breaks output schemas.
function compareRequired(roots: SchemaRoots, base: Json, head: Json, path: string): string[] {
  const baseRequired = Array.isArray(base.required) ? base.required : [];
  const headRequired = Array.isArray(head.required) ? head.required : [];
  if (roots.output) {
    return baseRequired
      .filter((name) => !headRequired.includes(name))
      .map((name) => `${path}: ${String(name)} is no longer required`);
  }
  return headRequired
    .filter((name) => !baseRequired.includes(name))
    .map((name) => `${path}: ${String(name)} is now required`);
}

// An integer is covered by number, the other way round it is narrower.
function compareType(base: Json, head: Json, path: string): string[] {
  const baseTypes = typesOf(base.type);
  const headTypes = typesOf(head.type);
  if (headTypes.length === 0) {
    return [];
  }
  if (baseTypes.length === 0) {
    // Only a base with nothing but annotations counts, an enum, const, union or properties
    // already limit the value.
    return Object.keys(base).every((key) => ANNOTATIONS.has(key)) ? [`${path}: type added`] : [];
  }
  const covered = (type: string): boolean =>
    headTypes.includes(type) || (type === 'integer' && headTypes.includes('number'));
  return baseTypes.every(covered) ? [] : [`${path}: type narrowed`];
}

// A const is a one value enum.
function valuesOf(node: Json): unknown[] | undefined {
  if (Array.isArray(node.enum)) {
    return node.enum;
  }
  return 'const' in node ? [node.const] : undefined;
}

function compareValues(base: Json, head: Json, path: string): string[] {
  const headValues = valuesOf(head);
  if (!headValues) {
    return [];
  }
  const baseValues = valuesOf(base);
  if (!baseValues) {
    return [`${path}: enum added`];
  }
  const headKeys = new Set(headValues.map((value) => JSON.stringify(value)));
  if (baseValues.every((value) => headKeys.has(JSON.stringify(value)))) {
    return [];
  }
  return [`${path}: ${'const' in head ? 'const changed' : 'enum value removed'}`];
}

function compareAdditional(roots: SchemaRoots, base: Json, head: Json, path: string): string[] {
  const baseValue = base.additionalProperties;
  const headValue = head.additionalProperties;
  if (headValue === false) {
    return baseValue === false ? [] : [`${path}: additionalProperties is now false`];
  }
  if (!isJson(headValue)) {
    return [];
  }
  if (isJson(baseValue)) {
    return compareSchemas(roots, baseValue, headValue, `${path}{}`);
  }
  return baseValue === false ? [] : [`${path}: additionalProperties narrowed`];
}

function compareItems(roots: SchemaRoots, base: Json, head: Json, path: string): string[] {
  const headItems = head.items;
  if (Array.isArray(base.items) && Array.isArray(headItems)) {
    return base.items.flatMap((item, index) =>
      compareSchemas(roots, item, headItems[index], `${path}[${index}]`)
    );
  }
  return compareSchemas(roots, base.items, headItems, `${path}[]`);
}

function withoutUnion(node: Json): Json {
  const copy = { ...node };
  delete copy.anyOf;
  delete copy.oneOf;
  return copy;
}

function unionOf(node: Json): unknown[] | undefined {
  const list = node.anyOf ?? node.oneOf;
  return Array.isArray(list) ? list : undefined;
}

// A base entry is fine when some head entry accepts everything it did, the entry with the
// same index is tried first. Each try has its own copy of seen. If none fits, the breaks of
// the same index try are shown, or of the first try when there is no such index.
function entryBreaks(
  roots: SchemaRoots,
  entry: unknown,
  others: unknown[],
  index: number,
  path: string
): string[] {
  const same = others[index];
  const order = same === undefined ? others : [same, ...others.filter((_, at) => at !== index)];
  let shown: string[] | undefined;
  for (const other of order) {
    const found = compareSchemas({ ...roots, seen: new Set(roots.seen) }, entry, other, path);
    if (found.length === 0) {
      return [];
    }
    shown ??= found;
  }
  return shown ?? [];
}

function compareEntries(
  roots: SchemaRoots,
  names: { list: string; item: string },
  baseList: unknown[],
  headList: unknown[],
  path: string
): string[] {
  if (baseList.length > 0 && headList.length === 0) {
    return [`${path}: ${names.list} is empty`];
  }
  return baseList.flatMap((entry, index) => {
    const found = entryBreaks(roots, entry, headList, index, path);
    return found.length === 0
      ? []
      : [`${path}: ${names.item} ${index} removed or narrowed`, ...found];
  });
}

// anyOf and oneOf count as one union, so a reordered or extended union passes.
// A head without a union is one branch.
function compareUnion(roots: SchemaRoots, base: Json, head: Json, path: string): string[] {
  const baseBranches = unionOf(base);
  if (!baseBranches) {
    return [];
  }
  const headBranches = unionOf(head) ?? [withoutUnion(head)];
  return compareEntries(
    roots,
    { list: 'union', item: 'union branch' },
    baseBranches,
    headBranches,
    path
  );
}

// A base without a union is one branch, the other keywords of the head go into each head branch.
function compareIntoUnion(roots: SchemaRoots, base: Json, head: Json, path: string): string[] {
  const siblings = withoutUnion(head);
  const branches = (unionOf(head) ?? []).map((branch) =>
    isJson(branch) ? { ...siblings, ...branch } : branch
  );
  return compareUnion(roots, { anyOf: [base] }, { anyOf: branches }, path);
}

// Entries are matched like union branches, so an inserted entry passes.
// A new allOf entry is not checked.
function compareAllOf(roots: SchemaRoots, base: Json, head: Json, path: string): string[] {
  if (!Array.isArray(base.allOf) || !Array.isArray(head.allOf)) {
    return [];
  }
  return compareEntries(
    roots,
    { list: 'allOf', item: 'allOf entry' },
    base.allOf,
    head.allOf,
    path
  );
}

// The "if" schema is not compared.
function compareConditional(roots: SchemaRoots, base: Json, head: Json, path: string): string[] {
  const breaks: string[] = [];
  for (const key of ['then', 'else']) {
    const before = base[key];
    const after = head[key];
    if (isJson(before) && isJson(after)) {
      breaks.push(...compareSchemas(roots, before, after, `${path}(${key})`));
    }
  }
  return breaks;
}

interface RefStep {
  pair?: [Json, Json];
  breaks: string[];
}

function isExternalRef(node: Json): boolean {
  return typeof node.$ref === 'string' && !node.$ref.startsWith('#/');
}

// Follows local refs. Two refs are compared once, which ends recursive definitions.
// A ref against inline JSON ends because the inline JSON is finite.
function followRefs(roots: SchemaRoots, base: Json, head: Json, path: string): RefStep {
  if (isExternalRef(base) || isExternalRef(head)) {
    return base.$ref === head.$ref
      ? { pair: [base, head], breaks: [] }
      : { breaks: [`${path}: $ref changed`] };
  }
  if (isLocalRef(base) && isLocalRef(head)) {
    const key = `${String(base.$ref)}|${String(head.$ref)}`;
    if (roots.seen.has(key)) {
      return { breaks: [] };
    }
    roots.seen.add(key);
  }
  const baseTarget = deref(roots.base, base);
  const headTarget = deref(roots.head, head);
  if (!baseTarget) {
    return { breaks: [] };
  }
  if (!headTarget) {
    return { breaks: [`${path}: definition removed`] };
  }
  return { pair: [baseTarget, headTarget], breaks: [] };
}

// Only the parts clients can rely on are compared. not, pattern, min/max bounds, propertyNames,
// dependencies and a closed enum that gets a new value are ignored.
function compareSchemas(roots: SchemaRoots, base: unknown, head: unknown, path: string): string[] {
  if (!isJson(base)) {
    return [];
  }
  if (!isJson(head)) {
    return [`${path}: schema removed`];
  }
  const step =
    base.$ref === undefined && head.$ref === undefined
      ? { pair: [base, head] as [Json, Json], breaks: [] }
      : followRefs(roots, base, head, path);
  if (!step.pair) {
    return step.breaks;
  }
  const [b, h] = step.pair;
  if (!unionOf(b) && unionOf(h)) {
    return compareIntoUnion(roots, b, h, path);
  }
  return [
    ...compareProperties(roots, b, h, path),
    ...compareRequired(roots, b, h, path),
    ...compareType(b, h, path),
    ...compareValues(b, h, path),
    ...compareAdditional(roots, b, h, path),
    ...compareItems(roots, b, h, path),
    ...compareUnion(roots, b, h, path),
    ...compareAllOf(roots, b, h, path),
    ...compareConditional(roots, b, h, path),
  ];
}

export function schemaBreaks(base: unknown, head: unknown, output = false): string[] {
  if (head === undefined) {
    return ['schema removed'];
  }
  if (!isJson(base) || !isJson(head)) {
    return [];
  }
  return compareSchemas({ base, head, seen: new Set(), output }, base, head, '');
}

function git(args: string[]): string | undefined {
  const result = spawnSync(
    'git', // NOSONAR - fixed arguments, PATH lookup is how git is found
    args,
    { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }
  );
  return result.status === 0 ? result.stdout : undefined;
}

function readAt(ref: string, path: string): string | undefined {
  return git(['show', `${ref}:${path}`]);
}

function listAt(ref: string): string[] {
  const files = git(['ls-tree', '-r', '--name-only', ref, '--', 'packages', 'schema']) ?? '';
  return files.split('\n').filter((file) => REPORT.test(file) || SCHEMA.test(file));
}

function breaksIn(base: string, path: string): string[] {
  const baseText = readAt(base, path) ?? '';
  const headText = readAt('HEAD', path);
  if (SCHEMA.test(path)) {
    const head = headText === undefined ? undefined : (JSON.parse(headText) as unknown);
    return schemaBreaks(JSON.parse(baseText) as unknown, head, OUTPUT_SCHEMAS.has(basename(path)));
  }
  return removedReportLines(baseText, headText);
}

function isPrivateReport(base: string, path: string): boolean {
  const name = REPORT.exec(path)?.[1];
  if (name === undefined) {
    return false;
  }
  const file = `packages/${name}/package.json`;
  const text = readAt('HEAD', file) ?? readAt(base, file) ?? '{}';
  return (JSON.parse(text) as Json).private === true;
}

function commitMessages(base: string): string[] {
  const log = git(['log', '--format=%B%x00', `${base}..HEAD`]) ?? '';
  return log
    .split('\0')
    .map((message) => message.trim())
    .filter((message) => message !== '');
}

function printBreaks(title: string, found: Map<string, string[]>): void {
  if (found.size === 0) {
    return;
  }
  console.log(title);
  for (const [path, breaks] of found) {
    console.log(`  ${path}`);
    for (const text of breaks) {
      console.log(`    ${text}`);
    }
  }
}

export function main(): number {
  const base = git(['merge-base', BASE, 'HEAD'])?.trim();
  if (!base) {
    console.error(`Cannot find the merge base with ${BASE}, needs full history (fetch-depth: 0).`);
    return 1;
  }
  const enforced = new Map<string, string[]>();
  const listed = new Map<string, string[]>();
  // Files that exist only at HEAD are additions and pass.
  for (const path of listAt(base)) {
    const breaks = breaksIn(base, path);
    if (breaks.length > 0) {
      (isPrivateReport(base, path) ? listed : enforced).set(path, breaks);
    }
  }
  printBreaks('Breaking changes:', enforced);
  printBreaks('Breaking changes in private packages (not enforced):', listed);
  if (enforced.size === 0) {
    console.log('No enforced breaking changes.');
    return 0;
  }
  if (isMarkedBreaking(process.env.PR_TITLE ?? '', commitMessages(base))) {
    console.log('The pull request is marked as breaking.');
    return 0;
  }
  console.error(
    'Mark the pull request as breaking with "!" in the squash subject (feat(core)!: ...) or undo the change.'
  );
  console.error('If this pull request was stacked on another one, rebase it on main first.');
  return 1;
}

function isMainModule(): boolean {
  const entry = process.argv[1];
  return entry !== undefined && import.meta.url === pathToFileURL(realpathSync(entry)).href;
}

// The spec imports this file, only a direct run starts the check.
if (isMainModule()) {
  process.exit(main());
}
