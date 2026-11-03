# isInModelSet()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: isInModelSet()

> **isInModelSet**(`resolution`, `set`): `boolean`

Defined in: [core/src/model-catalog.ts:502](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/core/src/model-catalog.ts#L502)

Whether a resolved reference belongs to a model set. `inherit` always
does: it defers to whatever model the tool already runs.

## Parameters

### resolution

[`ModelResolution`](https://getpromptscript.dev/api-reference/core/src/type-aliases/ModelResolution/index.md)

### set

[`ModelSet`](https://getpromptscript.dev/api-reference/core/src/interfaces/ModelSet/index.md)

## Returns

`boolean`