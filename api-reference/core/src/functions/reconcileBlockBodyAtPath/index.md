# reconcileBlockBodyAtPath()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: reconcileBlockBodyAtPath()

> **reconcileBlockBodyAtPath**(`baseBody`, `incomingBody`, `baseContent`, `incomingContent`, `mergedContent`, `path`): [`BlockBody`](https://getpromptscript.dev/api-reference/core/src/interfaces/BlockBody/index.md)

Defined in: [core/src/canonical-ast.ts:1250](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/core/src/canonical-ast.ts#L1250)

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