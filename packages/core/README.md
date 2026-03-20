# @promptscript/core

> **Internal package** - Part of the [PromptScript](https://github.com/mrwogu/promptscript) monorepo.

Core types, errors, and utilities for the PromptScript toolchain.

## Status

This is an internal package bundled into `@promptscript/cli`. It is not published to npm separately.

## Architecture

```
@promptscript/cli
│
├─► compiler
│   ├─► resolver ─┬─► parser ──► core ⭐
│   │             └────────────► core ⭐
│   ├─► validator ─────────────► core ⭐
│   └─► formatters ────────────► core ⭐
│
└─► resolver (direct dependency)
```

The `core` package is a foundational dependency used by `parser`, `resolver`, `validator`, and `formatters`.

## Modules

| Module               | Description                                                                        |
| :------------------- | :--------------------------------------------------------------------------------- |
| **types/ast**        | AST interfaces (`Program`, `Block`, `Value`, `BlockContent`, etc.)                 |
| **types/config**     | Configuration schema (`PromptScriptConfig`, input/output/registry types)           |
| **types/constants**  | Shared constants (block names, syntax version)                                     |
| **types/convention** | Convention type definitions for formatter output                                   |
| **types/manifest**   | Registry manifest types                                                            |
| **types/source**     | Source location and mapping types                                                  |
| **types/prettier**   | Prettier configuration types                                                       |
| **errors**           | Error hierarchy (`PSError`, `ParseError`, `ResolveError`, `ValidationError`, etc.) |
| **utils/diagnostic** | Diagnostic formatting utilities                                                    |
| **utils/merge**      | Deep merge for AST nodes                                                           |
| **utils/package**    | Package metadata helpers                                                           |
| **utils/path**       | Path parsing and formatting (`parsePath`, `formatPath`)                            |
| **utils/version**    | Semantic version comparison (`parseVersion`)                                       |
| **logger**           | `Logger` interface for verbose/debug output                                        |
| **template**         | Template interpolation for parameterized skills                                    |

## Usage (internal)

```typescript
// Types
import type { Program, Block, Value } from '@promptscript/core';

// Errors
import { ParseError, ValidationError } from '@promptscript/core';

// Utilities
import { parsePath, parseVersion, deepMerge } from '@promptscript/core';

// Logger
import type { Logger } from '@promptscript/core';

// Template
import { interpolateTemplate } from '@promptscript/core';
```

## License

MIT
