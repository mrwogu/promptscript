# @promptscript/resolver

> Part of the [PromptScript](https://github.com/mrwogu/promptscript) ecosystem - the language for standardizing AI instructions across your organization.

Inheritance and import resolution for PromptScript files.

## 🏗️ Ecosystem

```
                         @promptscript/cli
                                │
                         @promptscript/compiler
                                │
       ┌────────────┬───────────┼───────────┬────────────┐
       ▼            ▼           ▼           ▼            ▼
    /parser   ╔══════════╗  /validator   /formatters
       │      ║/resolver ║       │           │
       │      ║    ⭐    ║       │           │
       │      ╚════╤═════╝       │           │
       └───────────┼─────────────┴───────────┘
                   ▼
           @promptscript/core
```

See [all packages](https://github.com/mrwogu/promptscript#packages) in the PromptScript monorepo.

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

### Standalone Function

```typescript
import { resolve, createFileSystemRegistry } from '@promptscript/resolver';

// Quick resolution without creating an instance
const registry = createFileSystemRegistry('./registry');
const resolved = await resolve(ast, { registry });
```

### Registry Types

Three registry implementations are available:

#### FileSystemRegistry

```typescript
import { createFileSystemRegistry } from '@promptscript/resolver';

const registry = createFileSystemRegistry('./registry', {
  extension: '.prs',
});
```

#### HttpRegistry

```typescript
import { createHttpRegistry } from '@promptscript/resolver';

const registry = createHttpRegistry('https://registry.example.com', {
  cache: true,
  cacheTtl: 3600, // seconds
  timeout: 5000, // ms
  retries: 3,
  auth: {
    type: 'bearer',
    token: process.env.REGISTRY_TOKEN,
  },
});
```

#### CompositeRegistry

```typescript
import {
  createCompositeRegistry,
  createFileSystemRegistry,
  createHttpRegistry,
} from '@promptscript/resolver';

const composite = createCompositeRegistry([
  createFileSystemRegistry('./local'), // Check local first
  createHttpRegistry('https://registry.example.com'), // Then remote
]);
```

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
