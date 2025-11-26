---
title: Core API
description: "@promptscript/core package API reference"
---

# @promptscript/core

Core types, errors, and utilities shared across all PromptScript packages.

## Installation

```bash
npm install @promptscript/core
```

## Types

### Program

The root AST node representing a parsed PromptScript file.

```typescript
interface Program {
  type: 'Program';
  meta: MetaBlock;
  inherit?: InheritDeclaration;
  uses: UseDeclaration[];
  blocks: Block[];
  extends: ExtendBlock[];
  location: SourceLocation;
}
```

### Block

Union type for all block types:

```typescript
type Block =
  | MetaBlock
  | IdentityBlock
  | ContextBlock
  | StandardsBlock
  | RestrictionsBlock
  | ShortcutsBlock
  | ParamsBlock
  | GuardsBlock
  | KnowledgeBlock;
```

### MetaBlock

Required metadata block:

```typescript
interface MetaBlock {
  type: 'MetaBlock';
  properties: {
    id: string;
    version: string;
    org?: string;
    team?: string;
    tags?: string[];
  };
  location: SourceLocation;
}
```

### IdentityBlock

Identity/persona definition:

```typescript
interface IdentityBlock {
  type: 'IdentityBlock';
  content: TextContent;
  location: SourceLocation;
}
```

### ContextBlock

Project context:

```typescript
interface ContextBlock {
  type: 'ContextBlock';
  properties: Record<string, Value>;
  content?: TextContent;
  location: SourceLocation;
}
```

### StandardsBlock

Coding standards:

```typescript
interface StandardsBlock {
  type: 'StandardsBlock';
  properties: Record<string, Value>;
  location: SourceLocation;
}
```

### RestrictionsBlock

Restrictions list:

```typescript
interface RestrictionsBlock {
  type: 'RestrictionsBlock';
  items: string[];
  location: SourceLocation;
}
```

### ShortcutsBlock

Custom commands:

```typescript
interface ShortcutsBlock {
  type: 'ShortcutsBlock';
  shortcuts: Record<string, string>;
  location: SourceLocation;
}
```

### Value

Union type for all value types:

```typescript
type Value =
  | StringValue
  | NumberValue
  | BooleanValue
  | NullValue
  | ArrayValue
  | ObjectValue
  | TextValue
  | RangeValue
  | EnumValue;

interface StringValue {
  type: 'String';
  value: string;
}

interface NumberValue {
  type: 'Number';
  value: number;
}

interface BooleanValue {
  type: 'Boolean';
  value: boolean;
}

interface ArrayValue {
  type: 'Array';
  items: Value[];
}

interface ObjectValue {
  type: 'Object';
  properties: Record<string, Value>;
}

interface TextValue {
  type: 'Text';
  content: string;
}

interface RangeValue {
  type: 'Range';
  min: number;
  max: number;
  default?: number;
}

interface EnumValue {
  type: 'Enum';
  values: string[];
  default?: string;
}
```

### SourceLocation

Source location for error reporting:

```typescript
interface SourceLocation {
  start: Position;
  end: Position;
  source?: string;
}

interface Position {
  line: number;   // 1-based
  column: number; // 0-based
  offset: number; // Character offset
}
```

### PathReference

Reference to another file:

```typescript
interface PathReference {
  namespace?: string;    // e.g., "company"
  segments: string[];    // e.g., ["team", "frontend"]
  version?: string;      // e.g., "1.0.0"
  isRelative: boolean;
}
```

### Diagnostic

Validation diagnostic:

```typescript
interface Diagnostic {
  severity: 'error' | 'warning' | 'info';
  code: string;
  message: string;
  location: SourceLocation;
  suggestions?: string[];
}
```

## Errors

### PSError

Base error class for all PromptScript errors:

```typescript
class PSError extends Error {
  code: string;
  location?: SourceLocation;
  suggestions?: string[];
}
```

### ParseError

Syntax parsing error:

```typescript
class ParseError extends PSError {
  constructor(message: string, location: SourceLocation);
}
```

### ValidationError

Validation error:

```typescript
class ValidationError extends PSError {
  diagnostics: Diagnostic[];
  
  constructor(diagnostics: Diagnostic[]);
}
```

### ResolutionError

Import/inheritance resolution error:

```typescript
class ResolutionError extends PSError {
  path: PathReference;
  
  constructor(message: string, path: PathReference);
}
```

## Utilities

### parsePath

Parse a path string into a PathReference:

```typescript
function parsePath(path: string): PathReference;
```

**Example:**

```typescript
import { parsePath } from '@promptscript/core';

parsePath('@company/team/frontend@1.0.0');
// {
//   namespace: 'company',
//   segments: ['team', 'frontend'],
//   version: '1.0.0',
//   isRelative: false
// }

parsePath('./parent');
// {
//   segments: ['parent'],
//   isRelative: true
// }
```

### formatPath

Format a PathReference back to string:

```typescript
function formatPath(ref: PathReference): string;
```

### deepMerge

Deep merge objects (used for inheritance):

```typescript
function deepMerge<T>(target: T, source: Partial<T>): T;
```

**Example:**

```typescript
import { deepMerge } from '@promptscript/core';

const result = deepMerge(
  { a: { b: 1, c: 2 } },
  { a: { b: 3 } }
);
// { a: { b: 3, c: 2 } }
```

### formatDiagnostic

Format a diagnostic for display:

```typescript
function formatDiagnostic(diagnostic: Diagnostic): string;
```

### createLocation

Create a source location:

```typescript
function createLocation(
  startLine: number,
  startColumn: number,
  endLine: number,
  endColumn: number,
  source?: string
): SourceLocation;
```

## Constants

### Block Types

```typescript
const BLOCK_TYPES = [
  'meta',
  'identity',
  'context',
  'standards',
  'restrictions',
  'shortcuts',
  'params',
  'guards',
  'knowledge',
] as const;
```

### Reserved Words

```typescript
const RESERVED_WORDS = [
  'true',
  'false',
  'null',
  'range',
  'enum',
] as const;
```
