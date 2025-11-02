# @promptscript/parser

Chevrotain-based parser for PromptScript language.

## Overview

This package provides lexer and parser components that transform `.prs` source files into an Abstract Syntax Tree (AST).

## Installation

```bash
pnpm add @promptscript/parser
```

## Usage

### Basic Parsing

```typescript
import { parse, parseOrThrow } from '@promptscript/parser';

// Parse with error handling
const result = parse(`
  @meta {
    id: "my-project"
    version: "1.0.0"
  }

  @identity {
    """
    You are a helpful assistant.
    """
  }
`, { filename: 'example.prs' });

if (result.errors.length === 0) {
  console.log(result.ast);
} else {
  console.error('Parse errors:', result.errors);
}

// Parse and throw on error
try {
  const ast = parseOrThrow(source, { filename: 'example.prs' });
  console.log(ast.meta?.fields.id);
} catch (error) {
  console.error('Parse failed:', error);
}
```

### Tokenization

```typescript
import { tokenize } from '@promptscript/parser';

const result = tokenize('@meta { id: "test" }');
console.log(result.tokens);
console.log(result.errors);
```

## API

### `parse(source, options?)`

Parse PromptScript source code into an AST.

- `source`: The source code to parse
- `options.filename`: Filename for error reporting (default: `'<unknown>'`)
- `options.tolerant`: Continue parsing even on errors (default: `false`)

Returns `ParseResult` with:
- `ast`: The parsed `Program` AST or `null`
- `errors`: Array of `ParseError` objects

### `parseOrThrow(source, options?)`

Parse source code and throw on error.

- Returns the parsed `Program` AST
- Throws `ParseError` on failure

### `tokenize(source)`

Tokenize source code without parsing.

- Returns Chevrotain's `ILexingResult` with tokens and errors

## PromptScript Syntax

```promptscript
# Comment
@meta {
  id: "my-project"
  version: "1.0.0"
  tags: [frontend, typescript]
}

@inherit @company/frontend-team

@use @core/guards/compliance
@use @core/guards/security as sec

@identity {
  """
  Multi-line text content.
  """
}

@context {
  project: "Checkout"
  team: "Payments"
}

@standards {
  code: {
    style: "clean"
    testing: { required: true, coverage: 80 }
  }
}

@restrictions {
  - "Never expose secrets"
  - "Always validate input"
}

@shortcuts {
  "/review": "Review code"
}

@params {
  strictness: range(1..5) = 3
  format?: enum("json", "text") = "text"
}

@extend standards.code {
  frameworks: [react]
}
```

## Building

```bash
nx build parser
```

## Testing

```bash
nx test parser
```
