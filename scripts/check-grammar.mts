/**
 * Validates that the TextMate grammar covers all Chevrotain lexer tokens.
 * Similar to check-schema.sh — ensures grammar stays in sync with the parser.
 *
 * Usage: pnpm grammar:check
 * Exit codes:
 *   0 - All tokens covered
 *   1 - Missing token coverage
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
// Uses .js extension per swc-node convention (see validate-docs-examples.mts for reference)
import { allTokens } from '../packages/parser/src/lexer/tokens.js';

/** Maps each Chevrotain token name to the required TextMate scope prefix. */
const TOKEN_SCOPE_MAP: Record<string, string> = {
  LineComment: 'comment.line',
  TextBlock: 'string.quoted.triple',
  StringLiteral: 'string.quoted',
  NumberLiteral: 'constant.numeric',
  True: 'constant.language',
  False: 'constant.language',
  Null: 'constant.language',
  PathReference: 'entity.name.import',
  RelativePath: 'entity.name.import',
  UrlPath: 'entity.name.import',
  Meta: 'keyword.control',
  Inherit: 'keyword.control',
  Use: 'keyword.control',
  Extend: 'keyword.control',
  As: 'keyword.control',
  At: 'entity.name.tag',
  Range: 'keyword.other',
  Enum: 'keyword.other',
  StringType: 'support.type',
  NumberType: 'support.type',
  BooleanType: 'support.type',
  TemplateOpen: 'punctuation.definition.template',
  TemplateClose: 'punctuation.definition.template',
  Dash: 'keyword.operator',
  DotDot: 'keyword.operator',
  LBrace: 'punctuation',
  RBrace: 'punctuation',
  LBracket: 'punctuation',
  RBracket: 'punctuation',
  LParen: 'punctuation',
  RParen: 'punctuation',
  Colon: 'punctuation',
  Comma: 'punctuation',
  Equals: 'punctuation',
  Question: 'punctuation',
  Dot: 'punctuation',
};

/** Tokens that don't need TextMate scopes. */
const EXCLUDED_TOKENS = new Set(['WhiteSpace', 'Identifier']);

interface TmPattern {
  name?: string;
  contentName?: string;
  match?: string;
  begin?: string;
  end?: string;
  patterns?: TmPattern[];
  beginCaptures?: Record<string, { name?: string }>;
  endCaptures?: Record<string, { name?: string }>;
}

interface TmGrammar {
  patterns: TmPattern[];
  repository?: Record<string, TmPattern>;
}

/** Recursively collect all scope names from the grammar. */
function collectScopes(pattern: TmPattern): string[] {
  const scopes: string[] = [];

  if (pattern.name) scopes.push(pattern.name);
  if (pattern.contentName) scopes.push(pattern.contentName);

  if (pattern.beginCaptures) {
    for (const cap of Object.values(pattern.beginCaptures)) {
      if (cap.name) scopes.push(cap.name);
    }
  }
  if (pattern.endCaptures) {
    for (const cap of Object.values(pattern.endCaptures)) {
      if (cap.name) scopes.push(cap.name);
    }
  }

  if (pattern.patterns) {
    for (const p of pattern.patterns) {
      scopes.push(...collectScopes(p));
    }
  }

  return scopes;
}

// --- Main ---

const grammarPath = resolve('apps/vscode/syntaxes/promptscript.tmLanguage.json');
const grammarJson = readFileSync(grammarPath, 'utf-8');
const grammar = JSON.parse(grammarJson) as TmGrammar;

// Collect all scopes from top-level patterns and repository
const allScopes: string[] = [];

for (const p of grammar.patterns) {
  allScopes.push(...collectScopes(p));
}

if (grammar.repository) {
  for (const entry of Object.values(grammar.repository)) {
    allScopes.push(...collectScopes(entry));
  }
}

const scopeSet = new Set(allScopes);

// Check each token
const missing: Array<{ token: string; expected: string }> = [];

for (const token of allTokens) {
  const tokenName = token.name;

  if (EXCLUDED_TOKENS.has(tokenName)) continue;

  const expectedPrefix = TOKEN_SCOPE_MAP[tokenName];

  if (!expectedPrefix) {
    missing.push({ token: tokenName, expected: '(not in TOKEN_SCOPE_MAP — add it)' });
    continue;
  }

  const found = [...scopeSet].some((scope) => scope.startsWith(expectedPrefix));
  if (!found) {
    missing.push({ token: tokenName, expected: expectedPrefix });
  }
}

if (missing.length > 0) {
  console.error('\n❌ TextMate grammar is missing coverage for these tokens:\n');
  for (const { token, expected } of missing) {
    console.error(`  ${token} → expected scope starting with "${expected}"`);
  }
  console.error('\nTo fix, add patterns to apps/vscode/syntaxes/promptscript.tmLanguage.json');
  console.error('Reference: packages/parser/src/lexer/tokens.ts\n');
  process.exit(1);
} else {
  console.log('✅ TextMate grammar covers all Chevrotain lexer tokens!');
}
