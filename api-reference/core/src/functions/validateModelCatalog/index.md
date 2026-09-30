# validateModelCatalog()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: validateModelCatalog()

> **validateModelCatalog**(`profiles?`): `string`[]

Defined in: [core/src/model-catalog.ts:421](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/model-catalog.ts#L421)

Consistency issues in a set of model profiles.

Every name must point at one profile, successors must exist without
loops, dates use YYYY-MM-DD, per-target names must belong to targets that
write model names, and every floating alias needs a family to back it.

## Parameters

### profiles?

readonly [`ModelProfile`](https://getpromptscript.dev/api-reference/core/src/interfaces/ModelProfile/index.md)[] = `MODEL_PROFILES`

## Returns

`string`[]