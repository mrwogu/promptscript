---
title: Parser API
description: "@promptscript/parser package API reference"
---

# @promptscript/parser

Chevrotain-based parser for PromptScript syntax.

## Installation

```bash
npm install @promptscript/parser
```

## Functions

### parse

Parse PromptScript source code into an AST.

```typescript
function parse(source: string, options?: ParseOptions): Program;
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `source` | `string` | PromptScript source code |
| `options` | `ParseOptions` | Optional parsing options |

**Returns:** `Program` - The parsed AST

**Throws:** `ParseError` - If the source contains syntax errors

**Example:**

```typescript
import { parse } from '@promptscript/parser';

const source = `
@meta {
  id: "my-project"
  version: "1.0.0"
}

@identity {
  """
  You are a helpful assistant.
  """
}
`;

const ast = parse(source);
console.log(ast.meta.properties.id); // "my-project"
```

### parseFile

Parse a PromptScript file from disk.

```typescript
function parseFile(filePath: string, options?: ParseOptions): Promise<Program>;
```

**Example:**

```typescript
import { parseFile } from '@promptscript/parser';

const ast = await parseFile('./project.prs');
```

## Options

### ParseOptions

```typescript
interface ParseOptions {
  /** Source file path for error messages */
  source?: string;
  
  /** Enable recovery mode for partial parsing */
  recovery?: boolean;
  
  /** Custom error reporter */
  onError?: (error: ParseError) => void;
}
```

## Lexer

### tokenize

Tokenize source code (for advanced use cases):

```typescript
function tokenize(source: string): TokenizeResult;

interface TokenizeResult {
  tokens: IToken[];
  errors: LexerError[];
}
```

**Example:**

```typescript
import { tokenize } from '@promptscript/parser';

const { tokens, errors } = tokenize('@meta { id: "test" }');
```

### Token Types

Available token types:

```typescript
const Tokens = {
  // Keywords
  AtMeta: /@meta/,
  AtIdentity: /@identity/,
  AtContext: /@context/,
  AtStandards: /@standards/,
  AtRestrictions: /@restrictions/,
  AtShortcuts: /@shortcuts/,
  AtParams: /@params/,
  AtGuards: /@guards/,
  AtKnowledge: /@knowledge/,
  AtInherit: /@inherit/,
  AtUse: /@use/,
  AtExtend: /@extend/,
  
  // Literals
  StringLiteral: /"[^"]*"|'[^']*'/,
  NumberLiteral: /-?\d+(\.\d+)?/,
  True: /true/,
  False: /false/,
  Null: /null/,
  
  // Type expressions
  Range: /range/,
  Enum: /enum/,
  
  // Punctuation
  LBrace: /{/,
  RBrace: /}/,
  LBracket: /\[/,
  RBracket: /\]/,
  LParen: /\(/,
  RParen: /\)/,
  Colon: /:/,
  Comma: /,/,
  Dash: /-/,
  DotDot: /\.\./,
  At: /@/,
  
  // Special
  TripleQuote: /"""/,
  Identifier: /[a-zA-Z_][a-zA-Z0-9_-]*/,
  Comment: /#.*/,
  Whitespace: /\s+/,
};
```

## Error Handling

### ParseError

Thrown when parsing fails:

```typescript
import { parse, ParseError } from '@promptscript/parser';

try {
  parse(invalidSource);
} catch (error) {
  if (error instanceof ParseError) {
    console.log(error.message);
    console.log(error.location);
    // {
    //   start: { line: 5, column: 10 },
    //   end: { line: 5, column: 15 }
    // }
  }
}
```

### Recovery Mode

Enable recovery mode to get partial results:

```typescript
const ast = parse(source, {
  recovery: true,
  onError: (error) => {
    console.warn('Parse error:', error.message);
  }
});
// Returns partial AST even with errors
```

## AST Utilities

### visit

Walk the AST with a visitor:

```typescript
import { visit } from '@promptscript/parser';

visit(ast, {
  Block: (node) => {
    console.log('Found block:', node.type);
  },
  StringValue: (node) => {
    console.log('Found string:', node.value);
  }
});
```

### transform

Transform the AST:

```typescript
import { transform } from '@promptscript/parser';

const newAst = transform(ast, {
  StringValue: (node) => ({
    ...node,
    value: node.value.toUpperCase()
  })
});
```

## Advanced Usage

### Custom Parsing

For advanced use cases, access the parser directly:

```typescript
import { PromptScriptParser, PromptScriptLexer } from '@promptscript/parser';

const lexer = new PromptScriptLexer();
const parser = new PromptScriptParser();

const lexResult = lexer.tokenize(source);
parser.input = lexResult.tokens;

const cst = parser.program();
```

### Grammar Access

Access the grammar for tooling:

```typescript
import { getGrammar } from '@promptscript/parser';

const grammar = getGrammar();
// Use for syntax highlighting, completion, etc.
```

## Performance

The parser is optimized for speed:

- Lazy token creation
- Cached grammar rules
- Minimal memory allocation

Typical performance:

| File Size | Parse Time |
|-----------|------------|
| 1 KB | ~1 ms |
| 10 KB | ~5 ms |
| 100 KB | ~30 ms |
