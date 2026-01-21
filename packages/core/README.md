# @promptscript/core

> **Internal package** - Part of the [PromptScript](https://github.com/mrwogu/promptscript) monorepo.

Core types, errors, and utilities for the PromptScript toolchain.

## Status

This is an internal package bundled into `@promptscript/cli`. It is not published to npm separately.

## Architecture

```text
@promptscript/cli (published)
│
└─► bundles all internal packages:
    ├─► compiler
    │   ├─► parser
    │   ├─► resolver
    │   ├─► validator
    │   └─► formatters
    └─► core ⭐
```

## Usage (internal)

```typescript
import type { Program, Block, Value } from '@promptscript/core';
import { ParseError, ValidationError } from '@promptscript/core';
import { parsePath, parseVersion, deepMerge } from '@promptscript/core';
```

## License

MIT
