# isInModelSet()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: isInModelSet()

> **isInModelSet**(`resolution`, `set`): `boolean`

Defined in: [core/src/model-catalog.ts:502](https://github.com/mrwogu/promptscript/blob/1b71bccda9a0dc10cb2e852cd08b5bb17ff09055/packages/core/src/model-catalog.ts#L502)

Whether a resolved reference belongs to a model set. `inherit` always
does: it defers to whatever model the tool already runs.

## Parameters

### resolution

[`ModelResolution`](https://getpromptscript.dev/api-reference/core/src/type-aliases/ModelResolution/index.md)

### set

[`ModelSet`](https://getpromptscript.dev/api-reference/core/src/interfaces/ModelSet/index.md)

## Returns

`boolean`