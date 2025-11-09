# @promptscript/compiler

Pipeline orchestration for PromptScript compilation.

## Overview

The compiler orchestrates the full PromptScript compilation pipeline:

1. **Resolve** - Parse and resolve inheritance/imports
2. **Validate** - Check AST against validation rules
3. **Format** - Generate output for target platforms

## Installation

```bash
pnpm add @promptscript/compiler
```

## Usage

```typescript
import { Compiler } from '@promptscript/compiler';
import type { Formatter, FormatterOutput } from '@promptscript/compiler';

// Create a custom formatter
const myFormatter: Formatter = {
  name: 'custom',
  outputPath: './.custom/instructions.md',
  format(ast) {
    return {
      path: this.outputPath,
      content: `# Instructions\n\nID: ${ast.meta?.fields?.['id']}`,
    };
  },
};

// Create compiler
const compiler = new Compiler({
  resolver: {
    registryPath: './registry',
    localPath: './promptscript',
  },
  validator: {
    requiredGuards: ['@core/guards/compliance'],
  },
  formatters: [myFormatter],
});

// Compile
const result = await compiler.compile('./project.prs');

if (result.success) {
  for (const [name, output] of result.outputs) {
    console.log(`✓ ${name}: ${output.path}`);
  }
  console.log(`\nStats: ${result.stats.totalTime}ms`);
} else {
  for (const err of result.errors) {
    console.error(err.format?.() ?? err.message);
  }
}
```

## API

### `Compiler`

Main class for compilation.

```typescript
class Compiler {
  constructor(options: CompilerOptions);
  compile(entryPath: string): Promise<CompileResult>;
  getFormatters(): readonly Formatter[];
}
```

### `CompilerOptions`

```typescript
interface CompilerOptions {
  resolver: ResolverOptions;
  validator?: ValidatorConfig;
  formatters: (Formatter | string)[];
}
```

### `CompileResult`

```typescript
interface CompileResult {
  success: boolean;
  outputs: Map<string, FormatterOutput>;
  errors: CompileError[];
  warnings: ValidationMessage[];
  stats: CompileStats;
}
```

### `Formatter`

Interface for output formatters.

```typescript
interface Formatter {
  readonly name: string;
  readonly outputPath: string;
  format(ast: Program): FormatterOutput;
}
```

## Building

Run `nx build compiler` to build the library.

## Running unit tests

Run `nx test compiler` to execute the unit tests via [Vitest](https://vitest.dev/).
