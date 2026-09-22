#!/usr/bin/env node --import @swc-node/register/esm-register
/**
 * Script to add "Try in Playground" links after PromptScript code examples in markdown files.
 *
 * A badge is emitted only when the snippet it encodes compiles through
 * `@promptscript/browser-compiler`, the engine the playground itself runs, with
 * the formatters a first-time visitor has enabled. Anything that would open on
 * an error gets no badge.
 *
 * Usage:
 *   pnpm playground:links          # Add links to all docs
 *   pnpm playground:links --check  # Check if links are up to date (CI mode)
 *   pnpm playground:links --clean  # Remove all playground links
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, relative, sep } from 'path';
import LZString from 'lz-string';
import {
  LATEST_SYNTAX_VERSION,
  TARGET_DEFINITIONS,
  type KnownTarget,
} from '../packages/core/src/index.js';
import { BUNDLED_REGISTRY, compile } from '../packages/browser-compiler/src/index.js';

const PLAYGROUND_BASE_URL = 'https://getpromptscript.dev/playground/';
const PLAYGROUND_DEV_URL = 'https://getpromptscript.dev/playground-dev/';

// Top-level docs directories excluded from the site build (mkdocs exclude_docs).
// Regenerating badges for unpublished pages is wasted work, so they are skipped.
const EXCLUDED_DOC_DIRS = new Set(['design', 'plans', 'superpowers']);

// Use production playground by default
const PLAYGROUND_URL = PLAYGROUND_BASE_URL;

// Virtual file name the playground state uses for the single encoded example.
const PLAYGROUND_ENTRY = 'example.prs';

// Marker to identify auto-generated playground links
const LINK_MARKER_START = '<!-- playground-link-start -->';
const LINK_MARKER_END = '<!-- playground-link-end -->';
const SKIP_LINK_MARKER = '<!-- playground-link-skip -->';

// Regex to match playground link blocks (for removal/update)
const LINK_BLOCK_REGEX = new RegExp(
  `\\n?${escapeRegex(LINK_MARKER_START)}[\\s\\S]*?${escapeRegex(LINK_MARKER_END)}\\n?`,
  'g'
);

// Regex to match PRS code blocks
// Matches ```prs, ```promptscript, or ```prs title="..." etc.
// Note: Use [ \t]+ (not \s+) to avoid matching newlines in the optional attribute part
const CODE_BLOCK_REGEX = /```(?:prs|promptscript)(?:[ \t]+[^\n]*)?\n([\s\S]*?)```/g;

interface ShareableState {
  files: Array<{ path: string; content: string }>;
  entry?: string;
  formatter?: string;
  version: string;
}

interface ProcessResult {
  file: string;
  added: number;
  removed: number;
  updated: number;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Formatters a first-time playground visitor has enabled.
 *
 * The badge has to be validated against the same set the playground compiles
 * with on open, otherwise the gate either rejects examples that work or accepts
 * examples that fail. Mirrors `createDefaultTargets` in the playground store.
 */
function playgroundDefaultFormatters(): Array<{ name: KnownTarget }> {
  return (
    Object.entries(TARGET_DEFINITIONS) as Array<
      [KnownTarget, { features: { defaultEnabled: boolean } }]
    >
  )
    .filter(([, definition]) => definition.features.defaultEnabled)
    .map(([name]) => ({ name }));
}

const PLAYGROUND_FORMATTERS = playgroundDefaultFormatters();

/**
 * Remove common leading whitespace from all lines (dedent).
 * This is needed for code blocks inside tabbed content which have extra indentation.
 */
function dedent(text: string): string {
  const lines = text.split('\n');

  // Find minimum indentation (ignoring empty lines)
  let minIndent = Infinity;
  for (const line of lines) {
    if (line.trim().length === 0) continue;
    const match = line.match(/^(\s*)/);
    if (match) {
      minIndent = Math.min(minIndent, match[1].length);
    }
  }

  // If no indentation found or infinite, return as-is
  if (minIndent === Infinity || minIndent === 0) {
    return text;
  }

  // Remove the common indentation from all lines
  return lines.map((line) => line.slice(minIndent)).join('\n');
}

/**
 * Encode playground state to URL-safe string (same as playground uses).
 *
 * The state carries a file list, so an example that imports siblings travels
 * with them instead of arriving broken.
 */
function encodeState(files: Map<string, string>): string {
  const state: ShareableState = {
    files: [...files].map(([path, content]) => ({ path, content })),
    entry: PLAYGROUND_ENTRY,
    version: '1',
  };

  return LZString.compressToEncodedURIComponent(JSON.stringify(state));
}

/** An `@inherit`/`@use` line, split into indent and import target. */
const IMPORT_LINE_REGEX = /^([ \t]*)@(?:inherit|use)[ \t]+(\S+)/;

/** Explicit URL or scp-style git target. */
const URL_TARGET_REGEX = /^(?:https?:\/\/|git@)/;

/** Host-style git target such as `github.com/acme/agent-skills`. */
const HOST_TARGET_REGEX = /^[\w-]+(?:\.[\w-]+)+\//;

/** Paths the bundled playground registry already answers, without the extension. */
const BUNDLED_REGISTRY_IDS = new Set(
  Object.keys(BUNDLED_REGISTRY).map((path) => path.replace(/\.prs$/, ''))
);

/**
 * Classify an import target by what the playground would have to supply, or
 * null when it already resolves on its own.
 *
 * Kept as small separate tests rather than one alternation-heavy pattern, which
 * is both easier to follow and cheap to extend with a new target shape.
 */
function unresolvedImportKind(target: string): 'registry' | 'remote' | 'local' | null {
  if (BUNDLED_REGISTRY_IDS.has(target)) {
    // Already in the bundled registry, so it resolves untouched.
    return null;
  }
  if (target.startsWith('@')) {
    return 'registry';
  }
  if (target.startsWith('./') || target.startsWith('../')) {
    return 'local';
  }
  return URL_TARGET_REGEX.test(target) || HOST_TARGET_REGEX.test(target) ? 'remote' : null;
}

/** Split `./phases/triage(severity: "high")` into target and argument text. */
const PARAMETERIZED_TARGET_REGEX = /^([^(]+)\((.*)\)$/;

/** One `key: value` pair from a parameterized import's argument list. */
const ARGUMENT_REGEX = /([A-Za-z_]\w*)\s*:\s*("[^"]*"|'[^']*'|[\w.-]+)/g;

interface ImportTarget {
  /** Target without its argument list. */
  path: string;
  /** Argument names and the literal each call site passes. */
  args: Array<{ name: string; literal: string }>;
}

function parseImportTarget(target: string): ImportTarget {
  const match = PARAMETERIZED_TARGET_REGEX.exec(target);
  if (match === null) {
    return { path: target, args: [] };
  }
  const args = [...match[2]!.matchAll(ARGUMENT_REGEX)].map((argument) => ({
    name: argument[1]!,
    literal: argument[2]!,
  }));
  return { path: match[1]!, args };
}

/**
 * Virtual file name for a supplied import.
 *
 * Registry and remote targets resolve as `<target>.prs`, which is how the
 * bundled registry is keyed. Local targets keep their path, and an extension is
 * added only when the import omitted one.
 */
function stubFileName(kind: 'registry' | 'remote' | 'local', path: string): string {
  const cleaned = kind === 'local' ? path.replace(/^\.\//, '') : path;
  return /\.(?:prs|md)$/.test(cleaned) ? cleaned : `${cleaned}.prs`;
}

const STUB_NOTICE =
  '# Supplied so the example runs here. Not part of the documentation, and not a real package.';

/** `params` entry per call-site argument, typed from the literal it was given. */
function stubParamsBlock(args: ImportTarget['args']): string {
  if (args.length === 0) {
    return '';
  }
  const entries = args.map(({ name, literal }) => {
    const isQuoted = literal.startsWith('"') || literal.startsWith("'");
    if (isQuoted) return `    ${name}?: string = "example"`;
    if (literal === 'true' || literal === 'false') return `    ${name}?: boolean = false`;
    return Number.isNaN(Number(literal))
      ? `    ${name}?: string = "example"`
      : `    ${name}?: number = 0`;
  });
  return `  params: {\n${entries.join('\n')}\n  }\n`;
}

/**
 * Minimal stand-in for an import the playground cannot fetch.
 *
 * Declaring the parameters the call site passes matters for more than getting
 * past validation: the caller's own values then interpolate into the output, so
 * a parameterized example still demonstrates its real arguments.
 *
 * The blocks are generic but not empty, because an example that overrides or
 * extends a path needs that path to exist in the parent.
 */
function stubContent(fileName: string, target: ImportTarget): string {
  if (fileName.endsWith('.md')) {
    return `<!-- ${STUB_NOTICE.replace(/^# /, '')} -->\n\n# ${target.path}\n\nPlaceholder content.\n`;
  }
  // A local target keeps its path in the import but not in the id, where a
  // leading ./ would only look like a mistake.
  const id = target.path.replace(/^\.{1,2}\//, '');
  return [
    STUB_NOTICE,
    '@meta {',
    `  id: "${id}"`,
    `  syntax: "${LATEST_SYNTAX_VERSION}"`,
    '  mixin: true',
    stubParamsBlock(target.args).replace(/\n$/, ''),
    '}',
    '',
    '@standards {',
    '  code: ["Placeholder standard"]',
    '  testing: ["Placeholder standard"]',
    '}',
    '',
    '@restrictions {',
    '  - "Placeholder restriction"',
    '}',
    '',
  ]
    .filter((line) => line !== '')
    .join('\n');
}

/**
 * Supply a stand-in file for every import the playground cannot fetch, and
 * comment out the ones no stand-in fits.
 *
 * Commenting them all out was the old behaviour and it cost real examples: an
 * `@inherit` line is often the whole point of the section, and disabling it left
 * either a broken badge or a demonstration of nothing. The playground state can
 * carry several files, so the imports stay live and travel with a placeholder.
 */
function supplyUnresolvedImports(code: string): { code: string; stubs: Map<string, string> } {
  const stubs = new Map<string, string>();
  const lines = code.split('\n').map((line) => {
    const match = IMPORT_LINE_REGEX.exec(line);
    if (match === null) {
      return line;
    }
    const target = parseImportTarget(match[2]!);
    const kind = unresolvedImportKind(target.path);
    if (kind === null) {
      return line;
    }
    const fileName = stubFileName(kind, target.path);
    // A traversing path would escape the virtual project, so those stay disabled.
    if (fileName.startsWith('..')) {
      return `${match[1]}# ${line.trim()}  # (${kind} - disabled for playground)`;
    }
    stubs.set(fileName, stubContent(fileName, target));
    return line;
  });
  return { code: lines.join('\n'), stubs };
}

/**
 * Turn a documentation snippet into a playground state.
 *
 * The playground resolves against a small bundled registry and whatever files
 * the state carries, so anything needing a network fetch has to be supplied.
 * Imports get a placeholder file each; only what no placeholder fits, such as a
 * path traversing out of the project, is commented out. The `@meta` header is
 * added when the fragment has none.
 */
function prepareCodeForPlayground(code: string): PreparedSnippet {
  const supplied = supplyUnresolvedImports(code);
  const files = new Map<string, string>([[PLAYGROUND_ENTRY, withPlaygroundMeta(supplied.code)]]);
  for (const [path, content] of supplied.stubs) {
    files.set(path, content);
  }
  return {
    files,
    // The header alone is not a demonstration, so it does not count as content.
    demonstratesExample: hasActiveCode(withoutMetaBlock(supplied.code)),
  };
}

/** A snippet rewritten for the playground, plus whether it is still worth linking. */
interface PreparedSnippet {
  /** Entry file first, then any placeholder it imports. */
  files: Map<string, string>;
  /**
   * False when nothing of the example is left to demonstrate.
   *
   * Such a snippet still compiles once the `@meta` header is supplied, so the
   * badge would open without an error and show an empty project. A button that
   * promises a demonstration and delivers nothing is worse than no button, so
   * these get skipped.
   */
  demonstratesExample: boolean;
}

/**
 * Drop the `@meta` block, leaving only the blocks the example demonstrates.
 *
 * Braces are counted rather than regex-matched so a nested shape inside the
 * header cannot end the block early.
 */
function withoutMetaBlock(code: string): string {
  const start = code.search(META_BLOCK_REGEX);
  if (start === -1) {
    return code;
  }
  let depth = 0;
  for (let index = code.indexOf('{', start); index < code.length; index++) {
    if (code[index] === '{') {
      depth++;
    } else if (code[index] === '}') {
      depth--;
      if (depth === 0) {
        return code.slice(0, start) + code.slice(index + 1);
      }
    }
  }
  return code.slice(0, start);
}

/** True when some line is neither blank nor a comment. */
function hasActiveCode(code: string): boolean {
  return code.split('\n').some((line) => {
    const trimmed = line.trim();
    return trimmed !== '' && !trimmed.startsWith('#');
  });
}

const META_BLOCK_REGEX = /^[ \t]*@meta\s*\{/m;

/**
 * Give a snippet the `@meta` block the compiler requires, when it has none.
 *
 * Most documentation examples show a single block to explain one feature, so
 * they carry no `@meta` and cannot compile on their own - that alone accounted
 * for 169 badges that opened on `@meta block is required`. Supplying the header
 * here keeps the badge working without padding every fragment in the docs with
 * four lines of boilerplate that would distract from what the example teaches.
 *
 * The header is commented as added, in the same spirit as the disabled imports
 * above, so nobody mistakes it for part of the documented example.
 */
function withPlaygroundMeta(code: string): string {
  if (META_BLOCK_REGEX.test(code)) {
    return code;
  }
  return [
    '# @meta added so this fragment compiles on its own in the playground',
    '@meta {',
    '  id: "example"',
    `  syntax: "${LATEST_SYNTAX_VERSION}"`,
    '}',
    '',
    code,
  ].join('\n');
}

/**
 * Compile a prepared snippet the way the playground would.
 *
 * This is the badge gate. Static heuristics can only approximate "will the
 * playground run this", and the approximation was wrong often enough to ship
 * badges that opened on `@meta block is required` or on a failed clone. Running
 * the playground's own compiler answers it exactly.
 */
async function compilesInPlayground(files: Map<string, string>): Promise<boolean> {
  try {
    const result = await compile(files, PLAYGROUND_ENTRY, {
      formatters: PLAYGROUND_FORMATTERS,
      bundledRegistry: true,
    });
    return result.success;
  } catch {
    // A snippet that makes the compiler throw cannot carry a working badge.
    return false;
  }
}

/**
 * Generate the playground URL for an already prepared snippet.
 *
 * Takes the prepared file set rather than raw code so the encoded state is
 * byte-for-byte what `compilesInPlayground` validated.
 */
function playgroundUrlFor(files: Map<string, string>): string {
  return `${PLAYGROUND_URL}?s=${encodeState(files)}`;
}

/**
 * Create the markdown link block.
 */
function createLinkBlock(url: string): string {
  // Using a styled link that works in both GitHub and MkDocs.
  // Blank line before the block and no trailing newline keep the output
  // Prettier-stable, so `format:check` and `playground:links --check` agree.
  return `

${LINK_MARKER_START}
<a href="${url}" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
${LINK_MARKER_END}`;
}

function shouldSkipPlaygroundLink(content: string, offset: number): boolean {
  return content.slice(0, offset).trimEnd().endsWith(SKIP_LINK_MARKER);
}

/** Prose that introduces the following example as something not to do. */
const NEGATIVE_EXAMPLE_REGEX = /(?:^\**\s*(?:wrong|incorrect|bad|avoid|don't|do not|never)\b)|❌/i;

/**
 * True when the line right before the fence presents it as a mistake.
 *
 * A "Try in Playground" button on an anti-pattern misleads either way. When the
 * snippet happens to compile, the badge tells the reader that what the page just
 * called wrong actually works, and supplying a `@meta` header makes that more
 * likely rather than less: the "Missing @meta Block" example under Common
 * Mistakes compiles cleanly once the very header it is criticised for lacking is
 * added. When the snippet does not compile the badge is simply broken. Neither
 * is worth shipping, so negative examples get no badge.
 */
function precedesNegativeExample(content: string, offset: number): boolean {
  const lead = content
    .slice(0, offset)
    .split('\n')
    .findLast((line) => line.trim() !== '');
  return lead !== undefined && NEGATIVE_EXAMPLE_REGEX.test(lead.trim());
}

/**
 * Parse a markdown fence line: backtick count and info string, or null when
 * the line does not open or close a fence. Manual parsing avoids the
 * super-linear backtracking a backtick-plus-anything regex would have.
 */
function parseFence(line: string): { length: number; info: string } | null {
  if (!line.startsWith('```')) {
    return null;
  }
  let length = 3;
  while (length < line.length && line[length] === '`') {
    length++;
  }
  return { length, info: line.slice(length).trim() };
}

/**
 * Find ```prs / ```promptscript fence lines that must not get playground links:
 * - fences nested inside another fence (example content, not runnable code)
 * - fences of four or more backticks, where the code block regex would stop at
 *   the first inner ``` and corrupt the example
 * Returns the character range of each such fence's opening line.
 */
function findUnlinkableFenceLines(content: string): Array<[number, number]> {
  const ranges: Array<[number, number]> = [];
  const stack: number[] = []; // lengths of currently open fences, in backticks
  let offset = 0;

  for (const line of content.split('\n')) {
    const fence = parseFence(line);
    if (fence) {
      const { length, info } = fence;
      const [lang] = info.split(/\s+/);
      const isPrs = lang === 'prs' || lang === 'promptscript';
      const openLength = stack.at(-1);
      if (openLength !== undefined && length >= openLength) {
        stack.pop();
      } else {
        stack.push(length);
        if (isPrs && (stack.length > 1 || length !== 3)) {
          ranges.push([offset, offset + line.length]);
        }
      }
    }
    offset += line.length + 1;
  }

  return ranges;
}

/**
 * Return the playground-ready code for a matched block, or null when the block
 * must not carry a link: skip marker, unsafe fence, or an empty example.
 *
 * Whether the snippet actually runs is decided by `compilesInPlayground`, not
 * here. The shape-guessing this function used to do ("looks complete", "longer
 * than 30 characters") let 169 snippets without an `@meta` block through.
 */
function extractLinkableCode(
  content: string,
  codeContent: string,
  offset: number,
  unlinkableFences: Array<[number, number]>
): string | null {
  if (shouldSkipPlaygroundLink(content, offset) || precedesNegativeExample(content, offset)) {
    return null;
  }

  // Skip fences we cannot link safely (nested or 4+ backticks)
  if (unlinkableFences.some(([start, end]) => offset >= start && offset < end)) {
    return null;
  }

  // Dedent first (removes common leading whitespace from tabbed content), then trim
  const trimmedCode = dedent(codeContent).trim();

  // Skip empty or very short examples
  if (trimmedCode.length < 10) {
    return null;
  }

  return trimmedCode;
}

/** One `prs`/`promptscript` fence considered for a badge. */
interface LinkCandidate {
  /** Full fence text, so the badge can be appended straight after it. */
  block: string;
  /** Offset of the fence within the link-free content. */
  offset: number;
  /** Playground-ready file set, or null when static rules already rejected it. */
  preparedFiles: Map<string, string> | null;
}

function collectLinkCandidates(
  content: string,
  unlinkableFences: Array<[number, number]>
): LinkCandidate[] {
  const candidates: LinkCandidate[] = [];
  CODE_BLOCK_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = CODE_BLOCK_REGEX.exec(content)) !== null) {
    const linkableCode = extractLinkableCode(content, match[1], match.index, unlinkableFences);
    const prepared = linkableCode === null ? null : prepareCodeForPlayground(linkableCode);
    candidates.push({
      block: match[0],
      offset: match.index,
      preparedFiles: prepared?.demonstratesExample ? prepared.files : null,
    });
  }
  return candidates;
}

/**
 * Splice a badge in after every candidate whose snippet compiles.
 */
async function insertPlaygroundLinks(
  content: string,
  candidates: LinkCandidate[]
): Promise<{ content: string; added: number }> {
  const runnable = await Promise.all(
    candidates.map(async (candidate) =>
      candidate.preparedFiles === null ? false : compilesInPlayground(candidate.preparedFiles)
    )
  );

  let result = '';
  let cursor = 0;
  let added = 0;
  for (const [index, candidate] of candidates.entries()) {
    if (!runnable[index]) continue;
    const blockEnd = candidate.offset + candidate.block.length;
    result +=
      content.slice(cursor, blockEnd) + createLinkBlock(playgroundUrlFor(candidate.preparedFiles!));
    cursor = blockEnd;
    added++;
  }
  return { content: result + content.slice(cursor), added };
}

/**
 * Compare regenerated content with the original file and describe the drift.
 * Any difference counts, including stale URLs when the link count is unchanged.
 */
function buildCheckResult(
  filePath: string,
  newContent: string,
  originalContent: string,
  added: number,
  existingLinkCount: number
): ProcessResult {
  if (newContent === originalContent) {
    return { file: filePath, added: 0, removed: 0, updated: 0 };
  }
  if (existingLinkCount === 0 && added > 0) {
    return { file: filePath, added, removed: 0, updated: 0 };
  }
  if (added !== existingLinkCount) {
    return { file: filePath, added: 0, removed: 0, updated: Math.abs(added - existingLinkCount) };
  }
  // Equal link counts but different content: stale URLs after example edits.
  return { file: filePath, added: 0, removed: 0, updated: added };
}

/**
 * Process a single markdown file.
 */
async function processMarkdownFile(
  filePath: string,
  mode: 'add' | 'check' | 'clean'
): Promise<ProcessResult> {
  const originalContent = readFileSync(filePath, 'utf-8');
  let content = originalContent;
  let removed = 0;
  let updated = 0;

  // First, remove all existing playground links
  const withoutLinks = content.replace(LINK_BLOCK_REGEX, '');
  const existingLinkCount = (content.match(LINK_BLOCK_REGEX) || []).length;

  if (mode === 'clean') {
    if (existingLinkCount > 0) {
      writeFileSync(filePath, withoutLinks);
      removed = existingLinkCount;
    }
    return { file: filePath, added: 0, removed, updated: 0 };
  }

  // Work with content without existing links
  content = withoutLinks;
  const unlinkableFences = findUnlinkableFenceLines(content);
  const candidates = collectLinkCandidates(content, unlinkableFences);
  const linked = await insertPlaygroundLinks(content, candidates);
  const newContent = linked.content;
  let added = linked.added;

  if (mode === 'check') {
    // In check mode, compare and report differences
    return buildCheckResult(filePath, newContent, originalContent, added, existingLinkCount);
  }

  // Write the updated content
  if (newContent !== originalContent) {
    writeFileSync(filePath, newContent);
    if (existingLinkCount > 0) {
      updated = added;
      added = 0;
    }
  }

  return { file: filePath, added, removed: 0, updated };
}

/**
 * Recursively find all markdown files in a directory.
 */
function findMarkdownFiles(dir: string): string[] {
  const files: string[] = [];

  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      // Skip node_modules, dist, .git, etc.
      if (!['node_modules', 'dist', '.git', 'coverage', 'api-reference'].includes(entry)) {
        files.push(...findMarkdownFiles(fullPath));
      }
    } else if (entry.endsWith('.md')) {
      files.push(fullPath);
    }
  }

  return files;
}

/** Every markdown file the site publishes: docs/ minus excluded dirs, plus the root README. */
function collectDocFiles(rootDir: string): string[] {
  const docsDir = join(rootDir, 'docs');
  const published = findMarkdownFiles(docsDir).filter((file) => {
    const [topLevel] = relative(docsDir, file).split(sep);
    return !EXCLUDED_DOC_DIRS.has(topLevel);
  });
  return [...published, join(rootDir, 'README.md')];
}

/** Per-file changes, keeping files that ended up unchanged out of the report. */
async function processAll(
  files: string[],
  mode: 'add' | 'check' | 'clean'
): Promise<ProcessResult[]> {
  const results: ProcessResult[] = [];
  for (const file of files) {
    try {
      const result = await processMarkdownFile(file, mode);
      if (result.added > 0 || result.removed > 0 || result.updated > 0) {
        results.push(result);
      }
    } catch (error) {
      console.error(`Error processing ${file}:`, error);
    }
  }
  return results;
}

function describeChanges(result: ProcessResult): string {
  const changes: string[] = [];
  if (result.added > 0) changes.push(`+${result.added} added`);
  if (result.removed > 0) changes.push(`-${result.removed} removed`);
  if (result.updated > 0) changes.push(`~${result.updated} updated`);
  return changes.join(', ');
}

function reportResults(results: ProcessResult[], fileCount: number, rootDir: string): void {
  console.log('Changes:');
  for (const result of results) {
    console.log(`  ${relative(rootDir, result.file)}: ${describeChanges(result)}`);
  }

  const total = (key: 'added' | 'removed' | 'updated'): number =>
    results.reduce((sum, result) => sum + result[key], 0);

  console.log(`\nSummary:`);
  console.log(`  Files processed: ${fileCount}`);
  console.log(`  Files changed: ${results.length}`);
  for (const [key, label] of [
    ['added', 'Links added'],
    ['removed', 'Links removed'],
    ['updated', 'Links updated'],
  ] as const) {
    const count = total(key);
    if (count > 0) console.log(`  ${label}: ${count}`);
  }
  console.log();
}

/**
 * Main function.
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const mode = args.includes('--check') ? 'check' : args.includes('--clean') ? 'clean' : 'add';
  const rootDir = process.cwd();

  console.log(`\n🎮 Playground Links - Mode: ${mode.toUpperCase()}\n`);

  const files = collectDocFiles(rootDir);
  const results = await processAll(files, mode);

  if (results.length === 0) {
    console.log('✅ No changes needed.\n');
    return;
  }

  reportResults(results, files.length, rootDir);

  if (mode === 'check') {
    console.error('❌ Playground links are out of date. Run `pnpm playground:links` to update.\n');
    process.exit(1);
  }

  console.log('✅ Done!\n');
}

await main();
