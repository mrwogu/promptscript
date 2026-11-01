# mergeValueNodeLocations()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: mergeValueNodeLocations()

> **mergeValueNodeLocations**(`base`, `incoming`, `value`, `precedence`, `fallback`): [`ValueNode`](https://getpromptscript.dev/api-reference/core/src/type-aliases/ValueNode/index.md)

Defined in: [core/src/canonical-ast.ts:532](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/canonical-ast.ts#L532)

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