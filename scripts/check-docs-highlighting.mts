/**
 * Validates that every PromptScript snippet in the documentation can be
 * tokenized by the parser and highlighted by Shiki with the TextMate grammar,
 * the same pair the docs site uses.
 *
 * Snippets are only skipped when they are pseudo-code overviews, so a
 * documented construct that no lexer understands fails the build.
 *
 * Usage: pnpm docs:highlight:check
 * Exit codes:
 *   0 - Every snippet tokenizes
 *   1 - A snippet produced a lexer error
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { createHighlighter, type BundledLanguage, type LanguageRegistration } from 'shiki';
// Uses .js extension per swc-node convention (see check-grammar.mts for reference)
import { tokenize } from '../packages/parser/src/lexer/index.js';

interface Snippet {
  readonly file: string;
  readonly line: number;
  readonly code: string;
}

const DOCS_ROOT = resolve('docs');
// Mirrors the exclusions in validate-docs-examples.mts: generated API pages
// carry TSDoc examples that are not standalone PromptScript.
const EXCLUDED_DIRS = new Set(['__snapshots__', 'api-reference']);
const FENCE = /^```promptscript[^\n]*\n([\s\S]*?)^```/gm;

function collectMarkdownFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    if (EXCLUDED_DIRS.has(entry)) continue;
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      files.push(...collectMarkdownFiles(path));
    } else if (entry.endsWith('.md')) {
      files.push(path);
    }
  }
  return files;
}

function collectSnippets(): Snippet[] {
  const snippets: Snippet[] = [];
  for (const file of collectMarkdownFiles(DOCS_ROOT)) {
    const text = readFileSync(file, 'utf-8');
    for (const match of text.matchAll(FENCE)) {
      snippets.push({
        file: relative(process.cwd(), file),
        line: text.slice(0, match.index).split('\n').length + 1,
        code: match[1]!,
      });
    }
  }
  return snippets;
}

/** Snippets that spell out the shape of the language rather than real code. */
function isPseudoCode(code: string): boolean {
  return code.includes('...') || code.includes('[as alias]');
}

const grammar = JSON.parse(
  readFileSync(resolve('apps/vscode/syntaxes/promptscript.tmLanguage.json'), 'utf-8')
) as LanguageRegistration;
const highlighter = await createHighlighter({
  langs: [{ ...grammar, name: 'promptscript' }],
  themes: ['github-dark'],
});

/**
 * Text the grammar marks invalid, or leaves unscoped while it is not a plain
 * word. Property keys stay unscoped on purpose, so words are fine.
 */
function highlightFailures(code: string): string[] {
  const bad = new Set<string>();
  const lines = highlighter.codeToTokensBase(code, {
    // Registered at runtime from the grammar above, so not a bundled id.
    lang: 'promptscript' as BundledLanguage,
    theme: 'github-dark',
    includeExplanation: true,
  });
  for (const token of lines.flat()) {
    for (const part of token.explanation ?? []) {
      const scopes = part.scopes.map((scope) => scope.scopeName);
      const text = part.content.trim();
      if (scopes.some((scope) => scope.startsWith('invalid'))) bad.add(text);
      else if (scopes.length === 1 && text && !/^[\w\s.-]+$/.test(text)) bad.add(text);
    }
  }
  return [...bad];
}

const snippets = collectSnippets().filter((snippet) => !isPseudoCode(snippet.code));
const errors: string[] = [];

for (const snippet of snippets) {
  const lexerErrors = tokenize(snippet.code).errors ?? [];
  for (const error of lexerErrors) {
    errors.push(`${snippet.file}:${snippet.line} parser lexer: ${error.message}`);
  }
}

for (const snippet of snippets) {
  const tokens = highlightFailures(snippet.code);
  if (tokens.length > 0) {
    errors.push(`${snippet.file}:${snippet.line} TextMate grammar rejects ${tokens.join(', ')}`);
  }
}

if (errors.length > 0) {
  console.error('\nDocumentation snippets that no lexer can highlight:\n');
  for (const error of errors) {
    console.error(`  ${error}`);
  }
  console.error(
    '\nReferences: packages/parser/src/lexer/tokens.ts, apps/vscode/syntaxes/promptscript.tmLanguage.json\n'
  );
  process.exit(1);
}

console.log(`All ${snippets.length} documentation snippets tokenize.`);
