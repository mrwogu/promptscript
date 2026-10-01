# mergeValueNodeLocations()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: mergeValueNodeLocations()

> **mergeValueNodeLocations**(`base`, `incoming`, `value`, `precedence`, `fallback`): [`ValueNode`](https://getpromptscript.dev/api-reference/core/src/type-aliases/ValueNode/index.md)

Defined in: [core/src/canonical-ast.ts:527](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/canonical-ast.ts#L527)

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