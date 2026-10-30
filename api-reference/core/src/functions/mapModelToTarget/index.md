# mapModelToTarget()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: mapModelToTarget()

> **mapModelToTarget**(`reference`, `target`, `catalog?`): [`TargetModel`](https://getpromptscript.dev/api-reference/core/src/interfaces/TargetModel/index.md)

Defined in: [core/src/model-catalog.ts:634](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/model-catalog.ts#L634)

Map a model reference from `.prs` source to a target's native model name.

Explicit per-target names in a profile always win. Otherwise the target
scheme decides: floating aliases stay as written where the target
understands them, providers it cannot run are omitted, and known models
get the profile field the scheme names. Names missing from the catalog,
and every reference on targets without a scheme, are written as-is.
Names with a line break or control character are omitted, whether they
come from the source or from a profile.

## Parameters

### reference

`string`

### target

`string`

### catalog?

[`ModelCatalog`](https://getpromptscript.dev/api-reference/core/src/interfaces/ModelCatalog/index.md) = `...`

## Returns

[`TargetModel`](https://getpromptscript.dev/api-reference/core/src/interfaces/TargetModel/index.md)