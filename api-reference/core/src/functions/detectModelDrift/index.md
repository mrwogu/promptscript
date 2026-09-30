# detectModelDrift()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: detectModelDrift()

> **detectModelDrift**(`entries`, `profiles`): [`ModelDriftReport`](https://getpromptscript.dev/api-reference/core/src/interfaces/ModelDriftReport/index.md)

Defined in: [core/src/model-drift.ts:230](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/model-drift.ts#L230)

Compare OpenRouter models with the catalog. A model counts as a
candidate when its provider is tracked, its slug fits the id pattern of
a known family, and no catalog release of that family carries its
version.

## Parameters

### entries

readonly [`OpenRouterModelEntry`](https://getpromptscript.dev/api-reference/core/src/interfaces/OpenRouterModelEntry/index.md)[]

### profiles

readonly [`ModelProfile`](https://getpromptscript.dev/api-reference/core/src/interfaces/ModelProfile/index.md)[]

## Returns

[`ModelDriftReport`](https://getpromptscript.dev/api-reference/core/src/interfaces/ModelDriftReport/index.md)