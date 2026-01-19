# @promptscript/resolver

Inheritance and import resolution for PromptScript files.

## Overview

The resolver handles `@inherit`, `@use`, and `@extend` directives to produce a fully flattened AST.

## Features

- **@inherit**: Single inheritance with deep merge
- **@use**: Import declarations for reusable fragments  
- **@extend**: Block modifications with deep path support
- **Circular dependency detection**: Prevents infinite loops
- **Caching**: Optional caching of resolved ASTs

## Installation

```bash
pnpm add @promptscript/resolver
```

## Usage

```typescript
import { Resolver, createResolver } from '@promptscript/resolver';

// Create a resolver
const resolver = createResolver({
  registryPath: '/path/to/registry',
  localPath: '/path/to/project',
  cache: true,
});

// Resolve a file and all its dependencies
const result = await resolver.resolve('./instructions.prs');

if (result.ast) {
  console.log('Resolved successfully');
  console.log('Sources:', result.sources);
} else {
  console.error('Errors:', result.errors);
}
```

## Resolution Rules

### @inherit (Single Inheritance)

```promptscript
@inherit @company/frontend-team
```

- Copy all parent blocks to child
- Same-named blocks: deep merge (child wins)
- TextContent: concatenate (parent + child)
- Arrays: unique concat
- Objects: deep merge

### @use (Imports)

```promptscript
@use @core/guards/compliance
@use @core/guards/compliance as sec
```

- Import content for reference
- Available for `@extend`

### @extend (Modifications)

```promptscript
@extend standards.code {
  frameworks: [react]
}
```

- Modify existing blocks
- Support dot paths for nested access

## API

### Resolver

Main class for resolving PromptScript files.

```typescript
class Resolver {
  constructor(options: ResolverOptions);
  resolve(entryPath: string): Promise<ResolvedAST>;
  clearCache(): void;
  getLoader(): FileLoader;
}
```

### FileLoader

Utility for loading and resolving file paths.

```typescript
class FileLoader {
  constructor(options: LoaderOptions);
  load(path: string): Promise<string>;
  toAbsolutePath(path: string): string;
  resolveRef(ref: PathReference, fromFile: string): string;
}
```

## Building

Run `nx build resolver` to build the library.

## Running unit tests

Run `nx test resolver` to execute the unit tests via [Vitest](https://vitest.dev/).
