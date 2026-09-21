/**
 * Injects title and description frontmatter into the TypeDoc-generated
 * pages under docs/api-reference/.
 *
 * The docs theme (docs/overrides/main.html) reads page.meta.title and
 * page.meta.description for og:title/og:description, and mkdocs uses the
 * title as the rendered page title. Without this step the generated pages
 * ship weak titles ("core/src") and no meta description at all (issue #475).
 *
 * Runs as the second half of `pnpm docs:generate` (after typedoc) so the
 * tree is left in its desired state. Idempotent: a previously injected
 * frontmatter block is stripped before the current one is written.
 *
 * Usage:
 *   pnpm docs:generate
 *   node --import @swc-node/register/esm-register scripts/add-api-frontmatter.mts
 *   node --import @swc-node/register/esm-register scripts/add-api-frontmatter.mts --check
 * Exit codes:
 *   0 - every page carries the expected frontmatter
 *   1 - a page could not be parsed, or --check found missing/stale frontmatter
 */

import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const API_ROOT = resolve('docs/api-reference');
const CHECK_MODE = process.argv.includes('--check');
const MAX_DESCRIPTION_LENGTH = 280;

interface PageMeta {
  readonly title: string;
  readonly description: string;
}

const ROOT_META: PageMeta = {
  title: 'PromptScript API',
  description: 'Generated API reference for the PromptScript toolchain packages.',
};

// Fixed titles and one-line descriptions for the per-package module pages.
// Descriptions mirror the package doc comments in packages/*/src/index.ts,
// so they stay honest even if a package summary later changes upstream.
const PACKAGE_META: Record<string, PageMeta> = {
  'browser-compiler': {
    title: 'Browser Compiler API',
    description: 'Browser-compatible PromptScript compiler.',
  },
  cli: { title: 'CLI API', description: 'Command-line interface for PromptScript.' },
  compiler: {
    title: 'Compiler API',
    description: 'Pipeline orchestration for PromptScript compilation.',
  },
  core: {
    title: 'Core API',
    description: 'Core types, errors, and utilities for the PromptScript toolchain.',
  },
  formatters: { title: 'Formatters API', description: 'Output formatters for PromptScript.' },
  importer: {
    title: 'Importer API',
    description: 'Import existing AI instruction files to PromptScript format.',
  },
  parser: {
    title: 'Parser API',
    description: 'Chevrotain-based parser for the PromptScript language.',
  },
  resolver: {
    title: 'Resolver API',
    description: 'Inheritance and import resolution for PromptScript files.',
  },
  server: {
    title: 'Server API',
    description: 'Local development server for the PromptScript playground.',
  },
  telemetry: {
    title: 'Telemetry API',
    description: 'Node-only anonymous telemetry client used by PromptScript CLI.',
  },
  validator: {
    title: 'Validator API',
    description: 'AST validation rules for PromptScript files.',
  },
};

// Kind labels used in fallback descriptions when a symbol has no doc summary.
const KIND_LABELS: Record<string, string> = {
  Class: 'Class',
  'Abstract Class': 'Abstract class',
  Interface: 'Interface',
  Enumeration: 'Enumeration',
  Function: 'Function',
  Variable: 'Variable',
  'Type Alias': 'Type alias',
};

interface SymbolHeading {
  readonly kind: string;
  readonly name: string;
  readonly deprecated: boolean;
}

function collectMarkdownFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      files.push(...collectMarkdownFiles(path));
    } else if (entry.endsWith('.md')) {
      files.push(path);
    }
  }
  return files;
}

/** Finds the page H1, ignoring any heading-shaped lines inside code fences. */
function findHeadingIndex(lines: readonly string[]): number {
  let inFence = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    if (line.startsWith('```')) {
      inFence = !inFence;
    } else if (!inFence && line.startsWith('# ')) {
      return i;
    }
  }
  return -1;
}

/** Splits a TypeDoc H1 ("Class: PSError", "~~Type Alias: Foo~~") into parts. */
function parseSymbolHeading(heading: string): SymbolHeading | null {
  let text = heading;
  const deprecated = text.startsWith('~~');
  if (deprecated) {
    text = text.slice(2, text.endsWith('~~') ? -2 : undefined);
  }
  const separator = text.indexOf(': ');
  if (separator === -1) {
    return null;
  }
  return {
    kind: text.slice(0, separator),
    // Typedoc markdown-escapes specials in headings (BLOCK\_ALIASES, DeepReadonly\<T\>)
    name: text.slice(separator + 2).replace(/\\([\\`*_{}[\]()#+.!|<>-])/g, '$1'),
    deprecated,
  };
}

/**
 * Returns the first prose paragraph after the H1, skipping the signature
 * blockquote and the "Defined in" line. Returns null when the page goes
 * straight into a section (symbol has no doc summary).
 */
function extractSummary(lines: readonly string[], headingIndex: number): string | null {
  let index = headingIndex + 1;
  while (index < lines.length) {
    while (index < lines.length && lines[index]!.trim() === '') {
      index++;
    }
    if (index >= lines.length) {
      return null;
    }
    const paragraph: string[] = [];
    while (index < lines.length && lines[index]!.trim() !== '') {
      paragraph.push(lines[index]!.trim());
      index++;
    }
    const first = paragraph[0]!;
    if (first === '***' || first.startsWith('Defined in:') || first.startsWith('>')) {
      continue;
    }
    if (first.startsWith('#') || first.startsWith('- ') || /^\d+\. /.test(first)) {
      return null;
    }
    return paragraph.join(' ');
  }
  return null;
}

/** Strips markdown link/emphasis/code markup and escapes so YAML values stay plain text. */
function cleanSummary(paragraph: string): string {
  let text = paragraph.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');
  text = text.replace(/`/g, '').replace(/\*\*/g, '').replace(/~~/g, '');
  return text
    .replace(/\\([\\`*_{}[\]()#+.!|<>-])/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Caps the description, preferring to end on a sentence boundary. */
function truncateDescription(text: string): string {
  if (text.length <= MAX_DESCRIPTION_LENGTH) {
    return text;
  }
  const cut = text.slice(0, MAX_DESCRIPTION_LENGTH);
  const lastSentence = cut.lastIndexOf('. ');
  if (lastSentence === -1) {
    return `${cut.trimEnd()}...`;
  }
  return cut.slice(0, lastSentence + 1);
}

function packageDisplayName(pkg: string): string {
  return pkg
    .split('-')
    .map((part) => (part === 'cli' ? 'CLI' : part.charAt(0).toUpperCase() + part.slice(1)))
    .join(' ');
}

function computePageMeta(relativePath: string, lines: readonly string[]): PageMeta {
  if (relativePath === 'README.md') {
    return ROOT_META;
  }

  const segments = relativePath.split('/');
  const pkg = segments[0]!;
  const display = packageDisplayName(pkg);
  const headingIndex = findHeadingIndex(lines);
  if (headingIndex === -1) {
    throw new Error(`${relativePath}: no H1 heading to derive a title from`);
  }

  // Per-package module page (docs/api-reference/<pkg>/src/README.md)
  if (segments.length === 3 && segments[1] === 'src' && segments[2] === 'README.md') {
    const known = PACKAGE_META[pkg];
    if (known) {
      return known;
    }
    // Unregistered package: fall back to the module doc summary
    const summary = cleanSummary(extractSummary(lines, headingIndex) ?? '');
    return {
      title: `${display} API`,
      description:
        summary !== ''
          ? truncateDescription(summary)
          : `API reference for the PromptScript ${display} package.`,
    };
  }

  // Symbol page
  const symbol = parseSymbolHeading(lines[headingIndex]!.slice(2).trim());
  if (!symbol) {
    throw new Error(`${relativePath}: unrecognized H1 "${lines[headingIndex]}"`);
  }
  const summary = cleanSummary(extractSummary(lines, headingIndex) ?? '');
  const title = symbol.deprecated ? `${symbol.name} (deprecated)` : symbol.name;
  return {
    title,
    description:
      summary !== ''
        ? truncateDescription(summary)
        : `${KIND_LABELS[symbol.kind] ?? symbol.kind} in the PromptScript ${display} package.`,
  };
}

/** Removes a previously injected frontmatter block so reruns stay idempotent. */
function stripFrontmatter(content: string): string {
  if (!content.startsWith('---\n')) {
    return content;
  }
  const end = content.indexOf('\n---\n', 4);
  if (end === -1) {
    return content;
  }
  return content.slice(end + 5);
}

function renderFrontmatter(meta: PageMeta): string {
  // JSON.stringify output is a valid double-quoted YAML scalar
  return `---\ntitle: ${JSON.stringify(meta.title)}\ndescription: ${JSON.stringify(meta.description)}\n---\n`;
}

const files = collectMarkdownFiles(API_ROOT).sort();
if (files.length === 0) {
  console.error(
    `No markdown pages under ${relative(process.cwd(), API_ROOT)} - run typedoc first (pnpm docs:generate).`
  );
  process.exit(1);
}

const failures: string[] = [];
let updated = 0;
let current = 0;

for (const file of files) {
  const relativePath = relative(API_ROOT, file);
  const content = readFileSync(file, 'utf-8');
  const body = stripFrontmatter(content);
  let meta: PageMeta;
  try {
    meta = computePageMeta(relativePath, body.split('\n'));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
  const desired = `${renderFrontmatter(meta)}${body}`;
  if (desired === content) {
    current++;
    continue;
  }
  if (CHECK_MODE) {
    const status = content.startsWith('---\n') ? 'stale' : 'missing';
    failures.push(`${relativePath} (${status})`);
  } else {
    writeFileSync(file, desired);
    updated++;
  }
}

if (CHECK_MODE) {
  if (failures.length > 0) {
    console.error(`\n${failures.length} API page(s) with missing or stale frontmatter:\n`);
    for (const failure of failures) {
      console.error(`  ${failure}`);
    }
    console.error("\nRun 'pnpm docs:generate' to regenerate the API tree with frontmatter.");
    process.exit(1);
  }
  console.log(
    `All ${files.length} API pages carry the expected title and description frontmatter.`
  );
} else {
  console.log(`API frontmatter: ${updated} page(s) updated, ${current} already current.`);
}
