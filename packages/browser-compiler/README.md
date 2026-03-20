# @promptscript/browser-compiler

> **Private package** - Part of the [PromptScript](https://github.com/mrwogu/promptscript) monorepo. Not published to npm.

Browser-compatible PromptScript compiler with in-memory file system for client-side compilation.

## Purpose

Provides the full PromptScript compilation pipeline in browser environments. Uses a virtual file system instead of Node.js `fs` operations, making it suitable for playgrounds and web editors.

Used by: `@promptscript/playground`

> **Note:** TypeScript type-checking is intentionally skipped for this package — Vite handles types during bundling.

## Architecture

```
@promptscript/playground
  |
  +---> browser-compiler
          |
          +---> parser
          +---> validator
          +---> formatters
          +---> core
```

## Exports

| Export                    | Kind      | Description                                |
| ------------------------- | --------- | ------------------------------------------ |
| `compile`                 | function  | Main entry point for browser compilation   |
| `compileFor`              | function  | Compile for a single formatter             |
| `BrowserCompiler`         | class     | Full compiler with manual configuration    |
| `createBrowserCompiler`   | function  | Factory for `BrowserCompiler`              |
| `VirtualFileSystem`       | class     | In-memory file system for browser use      |
| `BrowserResolver`         | class     | Resolves imports/inheritance in-memory     |
| `getBundledRegistryFiles` | function  | Returns bundled registry `.prs` files      |
| `CompileResult`           | type      | Compilation result with outputs and errors |
| `CompileError`            | type      | Structured compilation error               |
| `CompileOptions`          | interface | Options for the `compile` function         |
| `CompileStats`            | type      | Compilation statistics                     |
| `TargetConfig`            | type      | Formatter target configuration             |

## Usage

```typescript
import { compile, getBundledRegistryFiles } from '@promptscript/browser-compiler';

// Create file map with project files
const files = new Map([
  [
    'project.prs',
    `
    @meta { id: "my-project" syntax: "1.0.0" }
    @identity { """You are a helpful assistant.""" }
  `,
  ],
]);

// Compile (bundled registry files are included by default)
const result = await compile(files, 'project.prs');

if (result.success) {
  for (const [outputPath, output] of result.outputs) {
    console.log(`${outputPath}:`, output.content);
  }
} else {
  console.error('Compilation errors:', result.errors);
}
```

### Compile for a single formatter

```typescript
import { compileFor } from '@promptscript/browser-compiler';

const result = await compileFor(files, 'project.prs', 'claude');
```

## License

MIT
