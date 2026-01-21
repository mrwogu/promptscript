# @promptscript/core

> Part of the [PromptScript](https://github.com/mrwogu/promptscript) ecosystem - The Infrastructure-as-Code for AI Context.

Core types, errors, and utilities for the PromptScript toolchain.

## 🏗️ Ecosystem

This package is the foundation of the PromptScript toolchain:

```text
@promptscript/cli
│
└─► @promptscript/compiler
    │
    ├─► @promptscript/parser ────┐
    ├─► @promptscript/resolver ──┤
    ├─► @promptscript/validator ─┤
    └─► @promptscript/formatters ┘
             │
             ▼
    @promptscript/core  ⭐
```

| Package                                                                            | Description                  |
| ---------------------------------------------------------------------------------- | ---------------------------- |
| [@promptscript/cli](https://www.npmjs.com/package/@promptscript/cli)               | Command-line interface       |
| [@promptscript/compiler](https://www.npmjs.com/package/@promptscript/compiler)     | Compilation pipeline         |
| [@promptscript/parser](https://www.npmjs.com/package/@promptscript/parser)         | Chevrotain-based parser      |
| [@promptscript/resolver](https://www.npmjs.com/package/@promptscript/resolver)     | Inheritance & imports        |
| [@promptscript/validator](https://www.npmjs.com/package/@promptscript/validator)   | AST validation rules         |
| [@promptscript/formatters](https://www.npmjs.com/package/@promptscript/formatters) | Output formatters            |
| **@promptscript/core**                                                             | **Types, errors, utilities** |

## Installation

```bash
npm install @promptscript/core
```

## Usage

### Types

```typescript
import type { Program, Block, Value, PromptScriptConfig } from '@promptscript/core';
```

### Errors

```typescript
import { ParseError, ValidationError, PSError } from '@promptscript/core';

try {
  // ...
} catch (error) {
  if (error instanceof ParseError) {
    console.error(error.format());
  }
}
```

### Utilities

```typescript
import { parsePath, parseVersion, deepMerge, formatPath } from '@promptscript/core';

// Parse a path reference
const path = parsePath('@core/guards/compliance@1.0.0');
// { namespace: 'core', segments: ['guards', 'compliance'], version: '1.0.0' }

// Format path back to string
const pathStr = formatPath(path);
// '@core/guards/compliance@1.0.0'

// Parse semantic version
const version = parseVersion('2.1.0');
// { major: 2, minor: 1, patch: 0 }

// Deep merge objects
const merged = deepMerge(parent, child);
```

### Diagnostics

```typescript
import { formatDiagnostic, formatDiagnostics, createLocation } from '@promptscript/core';

// Format a single diagnostic
const output = formatDiagnostic(
  {
    message: 'Missing required field: id',
    severity: 'error',
    location: createLocation('project.prs', 5, 3),
    code: 'E001',
  },
  { color: true }
);

// Format multiple diagnostics
const formatted = formatDiagnostics(diagnostics, { color: true });
```

### Constants

```typescript
import { BLOCK_TYPES, RESERVED_WORDS, isBlockType, isReservedWord } from '@promptscript/core';

// Check if a string is a valid block type
if (isBlockType('identity')) {
  // Valid block type
}

// Check if a string is reserved
if (isReservedWord('meta')) {
  // Reserved word
}
```

## API Reference

See [API Documentation](https://getpromptscript.dev/latest/api-reference/core/src/README/).

## License

MIT
