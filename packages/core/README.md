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
| **canonical-ast**     | Immutable canonical AST factories and legacy compatibility projections             |
| **block-merge**       | Shared inheritance and import block merge policies                                 |
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
  blocks   : string[]         -- block type names available in this version
  features : SyntaxFeature[]  -- non-block syntax available in this version
```

The version string is the key in `SYNTAX_VERSIONS`, not a property of `SyntaxVersionDef`.

| Export                                 | Description                                                                |
| :------------------------------------- | :------------------------------------------------------------------------- |
| `SYNTAX_VERSIONS`                      | Registry of known versions, blocks, and non-block syntax features          |
| `SYNTAX_FEATURES`                      | Stable identifiers for independently versioned syntax features             |
| `SyntaxVersionDef`                     | Interface describing a single version entry (see above)                    |
| `LATEST_SYNTAX_VERSION`                | String constant holding the most recent known syntax version               |
| `getLatestSyntaxVersion()`             | Returns `LATEST_SYNTAX_VERSION`                                            |
| `isKnownSyntaxVersion(v)`              | Returns `true` if `v` is a key in `SYNTAX_VERSIONS`                        |
| `getBlocksForVersion(v)`               | Returns the block names available in version `v`                           |
| `getFeaturesForVersion(v)`             | Returns non-block syntax features available in version `v`                 |
| `getMinimumVersionForBlock(name)`      | Returns the earliest version that introduced block `name`                  |
| `getMinimumVersionForFeature(feature)` | Returns the earliest version that introduced non-block syntax `feature`    |
| `getSyntaxFeatureUsages(ast)`          | Returns versioned non-block syntax usage retained in a parsed/resolved AST |

### String-matching utilities

| Export                                              | Description                                                                                                       |
| :-------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------- |
| `levenshteinDistance(a, b)`                         | Calculates the Levenshtein edit distance between strings `a` and `b`                                              |
| `findClosestMatch(input, candidates, maxDistance?)` | Returns the closest candidate to `input` within `maxDistance` edits (default 2), or `undefined` if none qualifies |

### Canonical AST

`CanonicalProgram` is the immutable, source-ordered AST. Its
`operations` preserve declaration order and each canonical block exposes one
ordered `body.entries` sequence for properties, text, list items, and inline
uses.

Pipeline stages use `CanonicalProgram` as their primary input. `Program` remains
the mutable compatibility API and is exposed as the `LegacyProgram` alias for
integrations that have not migrated.

Compatibility timeline:

1. Current 1.x releases: parser and resolver expose both representations;
   compiler and validator use the canonical representation internally.
2. Remaining 1.x releases: formatter and custom-rule authors can migrate to
   canonical entry points while legacy projections remain supported.
3. Next major release: legacy-only entry points may be removed after formatter
   and integration migration is complete.

| Export                                | Description                                                        |
| :------------------------------------ | :----------------------------------------------------------------- |
| `createCanonicalProgram(init)`        | Creates and deeply freezes a canonical program                     |
| `updateCanonicalProgramOperations()`  | Returns a frozen program with a replacement operation sequence     |
| `updateCanonicalBlockBody()`          | Returns a frozen block with a replacement ordered body             |
| `normalizeProgram(input)`             | Converts canonical or legacy input to a canonical program          |
| `toLegacyProgram(program)`            | Creates a detached mutable compatibility projection                |
| `getCanonicalBlocks(program)`         | Reads blocks from either AST representation                        |
| `mergeBlockContent(base, next, rule)` | Applies a shared inheritance or import content policy              |
| `mergeBlockCollections(...)`          | Merges one cross-layer match while retaining same-layer duplicates |

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
