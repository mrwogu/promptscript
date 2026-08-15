# @promptscript/compiler

> **Internal package** - Part of the [PromptScript](https://github.com/mrwogu/promptscript) monorepo.

Pipeline orchestration for PromptScript compilation.

## Status

This is an internal package bundled into `@promptscript/cli`. It is not published to npm separately.

## Architecture

```
  .prs source
      |
      v
+-----------+     +------------+     +------------+     +-----------+
|  Resolver |---->| Validator  |---->| Formatters |---->|  Output   |
| (parse +  |     | (semantic  |     | (target-   |     | (files)   |
|  resolve) |     |  checks)   |     |  specific) |     |           |
+-----------+     +------------+     +------------+     +-----------+
```

## API

### `Compiler`

Main class that orchestrates the compilation pipeline.

### `createCompiler(options)`

Factory function that creates a `Compiler` instance.

### `compile(options)`

Standalone function for one-shot compilation.

### `Compiler.watch(entryPath, options)`

Watch mode monitors the entry file, matching source files, resolver configuration, and all
dependencies discovered during resolution. Successful rebuilds replace the dependency set used
for invalidation and watching. Resolve, validation, or formatting failures retain the last
successful dependency set, so a later fix can still trigger a rebuild through the previous
dependencies. Closing a watcher waits for any in-flight rebuild before returning.

### Types

| Type              | Description                               |
| :---------------- | :---------------------------------------- |
| `CompileOptions`  | Options for the `compile()` function      |
| `CompilerOptions` | Options for the `Compiler` constructor    |
| `CompileResult`   | Result of a compilation run               |
| `CompileStats`    | Statistics (files written, skipped, etc.) |
| `CompileError`    | Compilation error details                 |
| `Formatter`       | Formatter interface                       |
| `FormatterOutput` | Output from a formatter                   |
| `FormatOptions`   | Options passed to formatters              |
| `TargetConfig`    | Per-target configuration                  |
| `WatchCallback`   | Callback for watch mode events            |
| `WatchOptions`    | Watch mode configuration                  |

## Usage (internal)

```typescript
import { Compiler, createCompiler, compile } from '@promptscript/compiler';
import type { CompileOptions, CompileResult } from '@promptscript/compiler';

// One-shot compilation
const result = await compile({ configPath: 'promptscript.yaml' });

// Reusable compiler instance
const compiler = createCompiler({ logger });
const result = await compiler.compile(options);
```

## License

MIT
