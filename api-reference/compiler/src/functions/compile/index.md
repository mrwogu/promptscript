# compile()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: compile()

> **compile**(`entryPath`, `options?`): `Promise`\<[`CompileResult`](https://getpromptscript.dev/api-reference/compiler/src/interfaces/CompileResult/index.md)\>

Defined in: [compiler/src/compiler.ts:1518](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/compiler/src/compiler.ts#L1518)

Compile a PromptScript file using default or specified options.

This is a convenience function that creates a Compiler instance
and runs the compilation pipeline. For repeated compilations,
consider creating a Compiler instance directly for better performance.

## Parameters

### entryPath

`string`

Path to the entry PromptScript file

### options?

[`CompileOptions`](https://getpromptscript.dev/api-reference/compiler/src/interfaces/CompileOptions/index.md) = `{}`

Optional compilation options

## Returns

`Promise`\<[`CompileResult`](https://getpromptscript.dev/api-reference/compiler/src/interfaces/CompileResult/index.md)\>

Compilation result with outputs, errors, and stats

## Example

```typescript
import { compile } from '@promptscript/compiler';

// Simple usage with defaults
const result = await compile('./project.prs');

// With custom options
const result = await compile('./project.prs', {
  formatters: ['github', 'claude'],
  resolver: { registryPath: './registry' },
});

if (result.success) {
  for (const [path, output] of result.outputs) {
    console.log(`Generated: ${path}`);
  }
}
```