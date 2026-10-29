# reconcileBlockBodyAtPath()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: reconcileBlockBodyAtPath()

> **reconcileBlockBodyAtPath**(`baseBody`, `incomingBody`, `baseContent`, `incomingContent`, `mergedContent`, `path`): [`BlockBody`](https://getpromptscript.dev/api-reference/core/src/interfaces/BlockBody/index.md)

Defined in: [core/src/canonical-ast.ts:1250](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/canonical-ast.ts#L1250)

## Parameters

### baseBody

[`BlockBody`](https://getpromptscript.dev/api-reference/core/src/interfaces/BlockBody/index.md) \| `undefined`

### incomingBody

[`BlockBody`](https://getpromptscript.dev/api-reference/core/src/interfaces/BlockBody/index.md) \| `undefined`

### baseContent

[`BlockContent`](https://getpromptscript.dev/api-reference/core/src/type-aliases/BlockContent/index.md)

### incomingContent

[`BlockContent`](https://getpromptscript.dev/api-reference/core/src/type-aliases/BlockContent/index.md)

### mergedContent

[`BlockContent`](https://getpromptscript.dev/api-reference/core/src/type-aliases/BlockContent/index.md)

### path

readonly `string`[]

## Returns

[`BlockBody`](https://getpromptscript.dev/api-reference/core/src/interfaces/BlockBody/index.md)