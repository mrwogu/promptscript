# mergeValueNodeLocations()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: mergeValueNodeLocations()

> **mergeValueNodeLocations**(`base`, `incoming`, `value`, `precedence`, `fallback`): [`ValueNode`](https://getpromptscript.dev/api-reference/core/src/type-aliases/ValueNode/index.md)

Defined in: [core/src/canonical-ast.ts:527](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/canonical-ast.ts#L527)

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