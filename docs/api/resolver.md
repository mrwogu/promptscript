---
title: Resolver API
description: '@promptscript/resolver package API reference'
---

# @promptscript/resolver

Resolves inheritance and imports in PromptScript files.

## Installation

```bash
npm install @promptscript/resolver
```

## Functions

### resolve

Resolve inheritance and imports for a program.

```typescript
function resolve(program: Program, options: ResolveOptions): Promise<ResolvedProgram>;
```

**Parameters:**

| Parameter | Type             | Description        |
| --------- | ---------------- | ------------------ |
| `program` | `Program`        | Parsed AST         |
| `options` | `ResolveOptions` | Resolution options |

**Returns:** `Promise<ResolvedProgram>` - Resolved and merged AST

**Example:**

```typescript
import { parse } from '@promptscript/parser';
import { resolve, createFileSystemRegistry } from '@promptscript/resolver';

const ast = parse(source);
const registry = createFileSystemRegistry('./registry');

const resolved = await resolve(ast, { registry });
```

### createResolver

Create a resolver instance for repeated use.

```typescript
function createResolver(options: ResolverOptions): Resolver;

interface Resolver {
  resolve(program: Program): Promise<ResolvedProgram>;
  clearCache(): void;
}
```

**Example:**

```typescript
import { createResolver } from '@promptscript/resolver';

const resolver = createResolver({
  registry: createFileSystemRegistry('./registry'),
  cache: true,
});

const resolved1 = await resolver.resolve(ast1);
const resolved2 = await resolver.resolve(ast2);
```

## Options

### ResolveOptions

```typescript
interface ResolveOptions {
  /** Registry for resolving imports */
  registry: Registry;

  /** Base path for relative imports */
  basePath?: string;

  /** Enable caching */
  cache?: boolean;

  /** Maximum inheritance depth */
  maxDepth?: number;
}
```

### ResolverOptions

```typescript
interface ResolverOptions {
  /** Registry for resolving imports */
  registry: Registry;

  /** Enable caching */
  cache?: boolean;

  /** Maximum inheritance depth (default: 10) */
  maxDepth?: number;

  /** Custom merge strategy */
  mergeStrategy?: MergeStrategy;
}
```

## Registry

### Registry Interface

```typescript
interface Registry {
  /** Resolve a path to source code */
  resolve(path: PathReference): Promise<string>;

  /** Check if a path exists */
  exists(path: PathReference): Promise<boolean>;

  /** List available paths in a namespace */
  list(namespace: string): Promise<string[]>;
}
```

### createFileSystemRegistry

Create a registry backed by the file system:

```typescript
function createFileSystemRegistry(basePath: string, options?: FileSystemRegistryOptions): Registry;

interface FileSystemRegistryOptions {
  /** File extension (default: '.prs') */
  extension?: string;

  /** Enable watching for changes */
  watch?: boolean;
}
```

**Example:**

```typescript
import { createFileSystemRegistry } from '@promptscript/resolver';

const registry = createFileSystemRegistry('./registry', {
  extension: '.prs',
  watch: false,
});
```

### createHttpRegistry

Create a registry backed by HTTP:

```typescript
function createHttpRegistry(baseUrl: string, options?: HttpRegistryOptions): Registry;

interface HttpRegistryOptions {
  /** Request timeout (ms) */
  timeout?: number;

  /** Enable caching */
  cache?: boolean;

  /** Cache TTL (seconds) */
  cacheTtl?: number;

  /** Number of retries on failure */
  retries?: number;

  /** Authentication configuration */
  auth?: HttpRegistryAuth;
}

interface HttpRegistryAuth {
  /** Authentication type */
  type: 'bearer' | 'basic' | 'api-key';

  /** Token for bearer auth */
  token?: string;

  /** Username for basic auth */
  username?: string;

  /** Password for basic auth */
  password?: string;

  /** API key for api-key auth */
  apiKey?: string;

  /** Header name for API key (default: 'X-API-Key') */
  headerName?: string;
}
```

**Example:**

```typescript
import { createHttpRegistry } from '@promptscript/resolver';

// With bearer token
const registry = createHttpRegistry('https://registry.example.com', {
  cache: true,
  cacheTtl: 3600,
  timeout: 5000,
  retries: 3,
  auth: {
    type: 'bearer',
    token: process.env.REGISTRY_TOKEN,
  },
});

// With basic auth
const basicRegistry = createHttpRegistry('https://registry.example.com', {
  auth: {
    type: 'basic',
    username: 'user',
    password: 'pass',
  },
});

// With API key
const apiKeyRegistry = createHttpRegistry('https://registry.example.com', {
  auth: {
    type: 'api-key',
    apiKey: process.env.API_KEY,
    headerName: 'Authorization',
  },
});
```

### createCompositeRegistry

Combine multiple registries:

```typescript
function createCompositeRegistry(registries: Registry[]): Registry;
```

**Example:**

```typescript
import {
  createCompositeRegistry,
  createFileSystemRegistry,
  createHttpRegistry,
} from '@promptscript/resolver';

const registry = createCompositeRegistry([
  createFileSystemRegistry('./local-registry'),
  createHttpRegistry('https://registry.example.com'),
]);
// Tries local first, then remote
```

## Standalone Function

Quick resolution without creating an instance:

```typescript
import { resolve, createFileSystemRegistry } from '@promptscript/resolver';

const registry = createFileSystemRegistry('./registry');
const resolved = await resolve(ast, { registry });
```

## Resolved Types

### ResolvedProgram

```typescript
interface ResolvedProgram extends Program {
  /** Resolved inheritance chain */
  inheritanceChain: string[];

  /** Resolved imports */
  resolvedUses: Map<string, Program>;

  /** Source file path */
  sourcePath: string;
}
```

## Merge Strategy

### Default Merge Behavior

| Block Type      | Behavior                           |
| --------------- | ---------------------------------- |
| `@identity`     | Concatenate text                   |
| `@context`      | Merge properties, concatenate text |
| `@standards`    | Deep merge objects                 |
| `@restrictions` | Concatenate arrays                 |
| `@shortcuts`    | Merge, child overrides             |
| `@params`       | Merge, child overrides             |
| `@guards`       | Merge properties, concatenate text |
| `@knowledge`    | Concatenate text                   |

### Custom Merge Strategy

```typescript
interface MergeStrategy {
  mergeIdentity(parent: IdentityBlock, child: IdentityBlock): IdentityBlock;
  mergeStandards(parent: StandardsBlock, child: StandardsBlock): StandardsBlock;
  mergeRestrictions(parent: RestrictionsBlock, child: RestrictionsBlock): RestrictionsBlock;
  // ... other blocks
}
```

**Example:**

```typescript
import { createResolver } from '@promptscript/resolver';

const resolver = createResolver({
  registry,
  mergeStrategy: {
    mergeRestrictions: (parent, child) => ({
      // Custom: child replaces instead of concatenates
      ...child,
    }),
    // Use defaults for others
  },
});
```

## Error Handling

### ResolutionError

Thrown when resolution fails:

```typescript
import { resolve, ResolutionError } from '@promptscript/resolver';

try {
  await resolve(ast, { registry });
} catch (error) {
  if (error instanceof ResolutionError) {
    console.log('Failed to resolve:', error.path);
    console.log('Message:', error.message);
  }
}
```

### CircularDependencyError

Thrown for circular inheritance:

```typescript
import { CircularDependencyError } from '@promptscript/resolver';

// Error: Circular inheritance detected: a → b → a
```

## Caching

The resolver supports caching for performance:

```typescript
const resolver = createResolver({
  registry,
  cache: true,
});

// First resolution - fetches from registry
await resolver.resolve(ast1);

// Second resolution - uses cache
await resolver.resolve(ast2);

// Clear cache if needed
resolver.clearCache();
```

## Advanced Usage

### Resolution Hooks

```typescript
const resolver = createResolver({
  registry,
  hooks: {
    beforeResolve: (path) => {
      console.log('Resolving:', path);
    },
    afterResolve: (path, program) => {
      console.log('Resolved:', path);
    },
    onMerge: (parent, child) => {
      console.log('Merging:', parent.meta.id, '←', child.meta.id);
    },
  },
});
```

### Dependency Graph

Get the dependency graph:

```typescript
import { getDependencyGraph } from '@promptscript/resolver';

const graph = await getDependencyGraph(ast, { registry });
// {
//   'my-project': ['@company/frontend'],
//   '@company/frontend': ['@company/base'],
//   '@company/base': []
// }
```
