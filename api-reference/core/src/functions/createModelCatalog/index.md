# createModelCatalog()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: createModelCatalog()

> **createModelCatalog**(`config?`, `builtIns?`): [`ModelCatalog`](https://getpromptscript.dev/api-reference/core/src/interfaces/ModelCatalog/index.md)

Defined in: [core/src/model-catalog.ts:263](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/model-catalog.ts#L263)

Create a catalog from the built-in profiles and a project's model config.

A `models.profiles` key that matches a built-in id changes only the fields
it sets (per-target names merge); any other key adds a custom profile.
Custom names win lookups over built-in names they collide with.

## Parameters

### config?

[`ModelsConfig`](https://getpromptscript.dev/api-reference/core/src/interfaces/ModelsConfig/index.md)

### builtIns?

readonly [`ModelProfile`](https://getpromptscript.dev/api-reference/core/src/interfaces/ModelProfile/index.md)[] = `MODEL_PROFILES`

## Returns

[`ModelCatalog`](https://getpromptscript.dev/api-reference/core/src/interfaces/ModelCatalog/index.md)