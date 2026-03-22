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

| Module                | Description                                                                        |
| :-------------------- | :--------------------------------------------------------------------------------- |
| **types/ast**         | AST interfaces (`Program`, `Block`, `Value`, `BlockContent`, etc.)                 |
| **types/config**      | Configuration schema (`PromptScriptConfig`, input/output/registry types)           |
| **types/constants**   | Shared constants (block names, syntax version)                                     |
| **types/convention**  | Convention type definitions for formatter output                                   |
| **types/manifest**    | Registry manifest types                                                            |
| **types/source**      | Source location and mapping types                                                  |
| **types/prettier**    | Prettier configuration types                                                       |
| **errors**            | Error hierarchy (`PSError`, `ParseError`, `ResolveError`, `ValidationError`, etc.) |
| **utils/diagnostic**  | Diagnostic formatting utilities                                                    |
| **utils/merge**       | Deep merge for AST nodes                                                           |
| **utils/package**     | Package metadata helpers                                                           |
| **utils/path**        | Path parsing and formatting (`parsePath`, `formatPath`)                            |
| **utils/version**     | Semantic version comparison (`parseVersion`)                                       |
| **utils/levenshtein** | Edit-distance utilities (`levenshteinDistance`, `findClosestMatch`)                |
| **syntax-versions**   | Syntax version registry and lookup helpers (see API reference below)               |
| **logger**            | `Logger` interface for verbose/debug output                                        |
| **template**          | Template interpolation for parameterized skills                                    |

## API Reference

### Syntax version registry

`SYNTAX_VERSIONS` is a record that maps every known syntax version string to its
`SyntaxVersionDef`.

```
SyntaxVersionDef
  version : string        -- the version string (e.g. "1.0.0")
  blocks  : string[]      -- block type names available in this version
```

| Export                            | Description                                                              |
| :-------------------------------- | :----------------------------------------------------------------------- |
| `SYNTAX_VERSIONS`                 | Registry of all known syntax versions and the blocks each one introduces |
| `SyntaxVersionDef`                | Interface describing a single version entry (see above)                  |
| `LATEST_SYNTAX_VERSION`           | String constant holding the most recent known syntax version             |
| `getLatestSyntaxVersion()`        | Returns `LATEST_SYNTAX_VERSION`                                          |
| `isKnownSyntaxVersion(v)`         | Returns `true` if `v` is a key in `SYNTAX_VERSIONS`                      |
| `getBlocksForVersion(v)`          | Returns the array of block names available in version `v`                |
| `getMinimumVersionForBlock(name)` | Returns the earliest version string that introduced block `name`         |

### String-matching utilities

| Export                                              | Description                                                                                                       |
| :-------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------- |
| `levenshteinDistance(a, b)`                         | Calculates the Levenshtein edit distance between strings `a` and `b`                                              |
| `findClosestMatch(input, candidates, maxDistance?)` | Returns the closest candidate to `input` within `maxDistance` edits (default 2), or `undefined` if none qualifies |

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
