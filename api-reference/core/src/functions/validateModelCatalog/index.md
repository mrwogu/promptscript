# validateModelCatalog()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: validateModelCatalog()

> **validateModelCatalog**(`profiles?`): `string`[]

Defined in: [core/src/model-catalog.ts:443](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/model-catalog.ts#L443)

Consistency issues in a set of model profiles.

Every name must point at one profile, successors must exist without
loops, dates use YYYY-MM-DD, per-target names must belong to targets that
write model names, and every floating alias needs a family to back it.

## Parameters

### profiles?

readonly [`ModelProfile`](https://getpromptscript.dev/api-reference/core/src/interfaces/ModelProfile/index.md)[] = `MODEL_PROFILES`

## Returns

`string`[]