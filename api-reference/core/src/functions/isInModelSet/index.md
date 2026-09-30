# isInModelSet()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: isInModelSet()

> **isInModelSet**(`resolution`, `set`): `boolean`

Defined in: [core/src/model-catalog.ts:475](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/model-catalog.ts#L475)

Whether a resolved reference belongs to a model set. `inherit` always
does: it defers to whatever model the tool already runs.

## Parameters

### resolution

[`ModelResolution`](https://getpromptscript.dev/api-reference/core/src/type-aliases/ModelResolution/index.md)

### set

[`ModelSet`](https://getpromptscript.dev/api-reference/core/src/interfaces/ModelSet/index.md)

## Returns

`boolean`