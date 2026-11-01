# isInModelSet()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: isInModelSet()

> **isInModelSet**(`resolution`, `set`): `boolean`

Defined in: [core/src/model-catalog.ts:497](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/model-catalog.ts#L497)

Whether a resolved reference belongs to a model set. `inherit` always
does: it defers to whatever model the tool already runs.

## Parameters

### resolution

[`ModelResolution`](https://getpromptscript.dev/api-reference/core/src/type-aliases/ModelResolution/index.md)

### set

[`ModelSet`](https://getpromptscript.dev/api-reference/core/src/interfaces/ModelSet/index.md)

## Returns

`boolean`