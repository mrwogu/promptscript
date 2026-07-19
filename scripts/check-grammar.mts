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
import { BLOCK_TYPES } from '../packages/core/src/types/constants.js';
// Uses .js extension per swc-node convention (see validate-docs-examples.mts for reference)
import { allTokens } from '../packages/parser/src/lexer/tokens.js';
import {
  prsLanguageConfiguration,
  prsLanguageDefinition,
} from '../packages/playground/src/utils/prs-language.js';

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
  Into: 'keyword.control',
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
  Bang: 'keyword.operator',
  Dot: 'punctuation',
};

const TOKEN_SAMPLES: Record<string, { source: string; image: string }> = {
  LineComment: { source: '# comment', image: '# comment' },
  TextBlock: { source: '"""', image: '"""' },
  StringLiteral: { source: '"value"', image: '"' },
  NumberLiteral: { source: '-3.14', image: '-3.14' },
  True: { source: 'true', image: 'true' },
  False: { source: 'false', image: 'false' },
  Null: { source: 'null', image: 'null' },
  PathReference: { source: '@scope/path@1.0.0', image: '@scope/path@1.0.0' },
  RelativePath: { source: '../path/file.prs', image: '../path/file.prs' },
  UrlPath: { source: 'github.com/org/repo/path@main', image: 'github.com/org/repo/path@main' },
  Meta: { source: '@meta', image: '@meta' },
  Inherit: { source: '@inherit', image: '@inherit' },
  Use: { source: '@use', image: '@use' },
  Extend: { source: '@extend', image: '@extend' },
  As: { source: 'as', image: 'as' },
  Into: { source: 'into', image: 'into' },
  At: { source: '@custom-block', image: '@custom-block' },
  Range: { source: 'range', image: 'range' },
  Enum: { source: 'enum', image: 'enum' },
  StringType: { source: 'string', image: 'string' },
  NumberType: { source: 'number', image: 'number' },
  BooleanType: { source: 'boolean', image: 'boolean' },
  TemplateOpen: { source: '{{', image: '{{' },
  TemplateClose: { source: '}}', image: '}}' },
  Dash: { source: '- "value"', image: '-' },
  DotDot: { source: '..', image: '..' },
  LBrace: { source: '{', image: '{' },
  RBrace: { source: '}', image: '}' },
  LBracket: { source: '[', image: '[' },
  RBracket: { source: ']', image: ']' },
  LParen: { source: '(', image: '(' },
  RParen: { source: ')', image: ')' },
  Colon: { source: ':', image: ':' },
  Comma: { source: ',', image: ',' },
  Equals: { source: '=', image: '=' },
  Question: { source: '?', image: '?' },
  Bang: { source: '!:', image: '!' },
  Dot: { source: '.', image: '.' },
};

/** Tokens that don't need TextMate scopes. */
const EXCLUDED_TOKENS = new Set(['WhiteSpace', 'Identifier']);

interface TmPattern {
  include?: string;
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

interface VscodeLanguageConfiguration {
  comments?: {
    lineComment?: string;
  };
  brackets?: string[][];
  autoClosingPairs?: Array<{ open: string; close: string; notIn?: string[] }>;
  surroundingPairs?: Array<{ open: string; close: string }>;
  folding?: {
    markers?: {
      start?: string;
      end?: string;
    };
  };
}

function matchesAtStart(pattern: string, sample: { source: string; image: string }): boolean {
  const match = new RegExp(pattern).exec(sample.source);
  return match?.index === 0 && match[0] === sample.image;
}

function providesScope(
  pattern: TmPattern,
  expectedScope: string,
  sample: { source: string; image: string }
): boolean {
  const directScopes = [pattern.name, pattern.contentName].filter(
    (scope): scope is string => scope !== undefined
  );

  if (directScopes.some((scope) => scope.startsWith(expectedScope))) {
    if (pattern.match && matchesAtStart(pattern.match, sample)) return true;
    if (pattern.begin && matchesAtStart(pattern.begin, sample)) return true;
    if (pattern.end && matchesAtStart(pattern.end, sample)) return true;
  }

  if (
    pattern.begin &&
    Object.values(pattern.beginCaptures ?? {}).some((capture) =>
      capture.name?.startsWith(expectedScope)
    ) &&
    matchesAtStart(pattern.begin, sample)
  ) {
    return true;
  }

  if (
    pattern.end &&
    Object.values(pattern.endCaptures ?? {}).some((capture) =>
      capture.name?.startsWith(expectedScope)
    ) &&
    matchesAtStart(pattern.end, sample)
  ) {
    return true;
  }

  return pattern.patterns?.some((child) => providesScope(child, expectedScope, sample)) ?? false;
}

// --- Main ---

const grammarPath = resolve('apps/vscode/syntaxes/promptscript.tmLanguage.json');
const grammarJson = readFileSync(grammarPath, 'utf-8');
const grammar = JSON.parse(grammarJson) as TmGrammar;
const pygmentsPath = resolve('docs_extensions/promptscript_lexer.py');
const pygmentsSource = readFileSync(pygmentsPath, 'utf-8');
const languageConfigurationPath = resolve('apps/vscode/language-configuration.json');
const vscodeLanguageConfiguration = JSON.parse(
  readFileSync(languageConfigurationPath, 'utf-8')
) as VscodeLanguageConfiguration;
const grammarPatterns = [...grammar.patterns, ...Object.values(grammar.repository ?? {})];

// Check each token
const missing: Array<{ token: string; expected: string }> = [];
const syncErrors: string[] = [];

const languageConfigurationComparisons: Array<{
  name: string;
  vscode: unknown;
  monaco: unknown;
}> = [
  {
    name: 'line comments',
    vscode: vscodeLanguageConfiguration.comments?.lineComment,
    monaco: prsLanguageConfiguration.comments?.lineComment,
  },
  {
    name: 'brackets',
    vscode: vscodeLanguageConfiguration.brackets,
    monaco: prsLanguageConfiguration.brackets,
  },
  {
    name: 'auto-closing pairs',
    vscode: vscodeLanguageConfiguration.autoClosingPairs,
    monaco: prsLanguageConfiguration.autoClosingPairs,
  },
  {
    name: 'surrounding pairs',
    vscode: vscodeLanguageConfiguration.surroundingPairs,
    monaco: prsLanguageConfiguration.surroundingPairs,
  },
  {
    name: 'folding start marker',
    vscode: vscodeLanguageConfiguration.folding?.markers?.start,
    monaco: prsLanguageConfiguration.folding?.markers?.start?.source,
  },
  {
    name: 'folding end marker',
    vscode: vscodeLanguageConfiguration.folding?.markers?.end,
    monaco: prsLanguageConfiguration.folding?.markers?.end?.source,
  },
];

for (const comparison of languageConfigurationComparisons) {
  if (JSON.stringify(comparison.vscode) !== JSON.stringify(comparison.monaco)) {
    syncErrors.push(`VS Code and Monaco ${comparison.name} differ`);
  }
}

for (const token of allTokens) {
  const tokenName = token.name;

  if (EXCLUDED_TOKENS.has(tokenName)) continue;

  const expectedPrefix = TOKEN_SCOPE_MAP[tokenName];
  const sample = TOKEN_SAMPLES[tokenName];

  if (!expectedPrefix) {
    missing.push({ token: tokenName, expected: '(not in TOKEN_SCOPE_MAP - add it)' });
    continue;
  }
  if (!sample) {
    missing.push({ token: tokenName, expected: '(not in TOKEN_SAMPLES - add it)' });
    continue;
  }

  const found = grammarPatterns.some((pattern) => providesScope(pattern, expectedPrefix, sample));
  if (!found) {
    missing.push({ token: tokenName, expected: expectedPrefix });
  }
}

const expectedBlockDirectives = BLOCK_TYPES.map((blockType) => `@${blockType}`);
const monacoDirectives = new Set(prsLanguageDefinition.directives as string[]);
for (const directive of expectedBlockDirectives) {
  if (!monacoDirectives.has(directive)) {
    syncErrors.push(`Monaco grammar is missing block directive ${directive}`);
  }
}

const pygmentsBlockMatch = pygmentsSource.match(/BLOCK_DIRECTIVES = \(([\s\S]*?)\)\n\n/);
if (!pygmentsBlockMatch) {
  syncErrors.push('Pygments lexer does not expose BLOCK_DIRECTIVES');
} else {
  const pygmentsBlocks = new Set(
    [...pygmentsBlockMatch[1]!.matchAll(/"([^"]+)"/g)].map((match) => match[1]!)
  );
  for (const blockType of BLOCK_TYPES) {
    if (!pygmentsBlocks.has(blockType)) {
      syncErrors.push(`Pygments lexer is missing block directive @${blockType}`);
    }
  }
  for (const blockType of pygmentsBlocks) {
    if (!(BLOCK_TYPES as readonly string[]).includes(blockType)) {
      syncErrors.push(`Pygments lexer contains unknown block directive @${blockType}`);
    }
  }
}

const textMateBlockPattern = grammar.repository?.['block-directive']?.match;
if (!textMateBlockPattern) {
  syncErrors.push('TextMate grammar does not define block-directive.match');
} else {
  const blockRegex = new RegExp(`^(?:${textMateBlockPattern})$`);
  for (const directive of expectedBlockDirectives) {
    if (!blockRegex.test(directive)) {
      syncErrors.push(`TextMate grammar does not match block directive ${directive}`);
    }
  }
}

for (const stringRule of ['double-string', 'single-string', 'triple-string']) {
  const nestedIncludes = new Set(
    grammar.repository?.[stringRule]?.patterns
      ?.map((pattern) => pattern.include)
      .filter((include): include is string => include !== undefined) ?? []
  );
  for (const requiredInclude of ['#template-in-string', '#env-variable']) {
    if (!nestedIncludes.has(requiredInclude)) {
      syncErrors.push(`TextMate ${stringRule} is missing ${requiredInclude}`);
    }
  }
}

if (missing.length > 0 || syncErrors.length > 0) {
  if (missing.length > 0) {
    console.error('\nTextMate grammar is missing coverage for these tokens:\n');
  }
  for (const { token, expected } of missing) {
    console.error(`  ${token} → expected scope starting with "${expected}"`);
  }
  if (syncErrors.length > 0) {
    console.error('\nSyntax highlighters are out of sync:\n');
  }
  for (const error of syncErrors) {
    console.error(`  ${error}`);
  }
  console.error(
    '\nReferences: packages/parser/src/lexer/tokens.ts, packages/core/src/types/constants.ts\n'
  );
  process.exit(1);
} else {
  console.log('Syntax highlighters cover all parser tokens and block directives.');
}
