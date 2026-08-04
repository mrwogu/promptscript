/**
 * Validates that every PromptScript snippet in the documentation can be
 * tokenized by the parser and by the Pygments lexer that renders the site.
 *
 * Snippets are only skipped when they are pseudo-code overviews, so a
 * documented construct that no lexer understands fails the build.
 *
 * Usage: pnpm docs:highlight:check
 * Exit codes:
 *   0 - Every snippet tokenizes
 *   1 - A snippet produced a lexer error
 */

import { spawnSync } from 'node:child_process';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
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

const PYGMENTS_PROGRAM = `
import json, sys
sys.path.insert(0, 'docs_extensions')
from pygments.token import Error
from promptscript_lexer import PromptScriptLexer

lexer = PromptScriptLexer()
failures = []
for item in json.load(sys.stdin):
    bad = sorted({value for token, value in lexer.get_tokens(item["code"]) if token is Error})
    if bad:
        failures.append({"id": item["id"], "tokens": bad})
json.dump(failures, sys.stdout)
`;

function pygmentsFailures(snippets: Snippet[]): Map<number, string[]> {
  const input = snippets.map((snippet, id) => ({ id, code: snippet.code }));
  const result = spawnSync('python3', ['-c', PYGMENTS_PROGRAM], {
    input: JSON.stringify(input),
    encoding: 'utf-8',
  });

  if (result.status !== 0) {
    console.error('Could not run the Pygments lexer:\n');
    console.error(result.stderr || result.error?.message);
    process.exit(1);
  }

  const failures = JSON.parse(result.stdout) as Array<{ id: number; tokens: string[] }>;
  return new Map(failures.map((failure) => [failure.id, failure.tokens]));
}

const snippets = collectSnippets().filter((snippet) => !isPseudoCode(snippet.code));
const errors: string[] = [];

for (const snippet of snippets) {
  const lexerErrors = tokenize(snippet.code).errors ?? [];
  for (const error of lexerErrors) {
    errors.push(`${snippet.file}:${snippet.line} parser lexer: ${error.message}`);
  }
}

for (const [id, tokens] of pygmentsFailures(snippets)) {
  const snippet = snippets[id]!;
  errors.push(`${snippet.file}:${snippet.line} Pygments lexer rejects ${tokens.join(', ')}`);
}

if (errors.length > 0) {
  console.error('\nDocumentation snippets that no lexer can highlight:\n');
  for (const error of errors) {
    console.error(`  ${error}`);
  }
  console.error(
    '\nReferences: packages/parser/src/lexer/tokens.ts, docs_extensions/promptscript_lexer.py\n'
  );
  process.exit(1);
}

console.log(`All ${snippets.length} documentation snippets tokenize.`);
