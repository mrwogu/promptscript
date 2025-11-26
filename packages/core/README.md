# @promptscript/core

Core types, errors, and utilities for the PromptScript toolchain.

## Installation

```bash
npm install @promptscript/core
```

## Usage

### Types

```typescript
import type { Program, Block, Value } from '@promptscript/core';
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
import { parsePath, parseVersion, deepMerge } from '@promptscript/core';

// Parse a path reference
const path = parsePath('@core/guards/compliance@1.0.0');
// { namespace: 'core', segments: ['guards', 'compliance'], version: '1.0.0' }

// Parse semantic version
const version = parseVersion('2.1.0');
// { major: 2, minor: 1, patch: 0 }

// Deep merge objects
const merged = deepMerge(parent, child);
```

## API Reference

See [API Documentation](https://mrwogu.github.io/promptscript/api/core/).

## License

MIT
