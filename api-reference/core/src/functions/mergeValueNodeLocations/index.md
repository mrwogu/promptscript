# mergeValueNodeLocations()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: mergeValueNodeLocations()

> **mergeValueNodeLocations**(`base`, `incoming`, `value`, `precedence`, `fallback`): [`ValueNode`](https://getpromptscript.dev/api-reference/core/src/type-aliases/ValueNode/index.md)

Defined in: [core/src/canonical-ast.ts:532](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/canonical-ast.ts#L532)

## Parameters

### base

[`ValueNode`](https://getpromptscript.dev/api-reference/core/src/type-aliases/ValueNode/index.md) \| `undefined`

### incoming

[`ValueNode`](https://getpromptscript.dev/api-reference/core/src/type-aliases/ValueNode/index.md) \| `undefined`

### value

[`Value`](https://getpromptscript.dev/api-reference/core/src/type-aliases/Value/index.md)

### precedence

`"base"` \| `"incoming"`

### fallback

[`ValueNode`](https://getpromptscript.dev/api-reference/core/src/type-aliases/ValueNode/index.md)

## Returns

[`ValueNode`](https://getpromptscript.dev/api-reference/core/src/type-aliases/ValueNode/index.md)