# resolve()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: resolve()

> **resolve**(`entryPath`, `options`): `Promise`\<[`ResolvedAST`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/ResolvedAST/index.md)\>

Defined in: [resolver/src/index.ts:234](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/index.ts#L234)

Resolve a PromptScript file with a standalone function.

## Parameters

### entryPath

`string`

Path to the entry file

### options

[`ResolveOptions`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/ResolveOptions/index.md)

Resolution options

## Returns

`Promise`\<[`ResolvedAST`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/ResolvedAST/index.md)\>

Resolved AST with sources and errors

## Example

```typescript
import { resolve } from '@promptscript/resolver';

const result = await resolve('./project.prs', {
  registryPath: '/path/to/registry',
  localPath: process.cwd(),
});

if (result.ast) {
  console.log('Resolved successfully');
}
```