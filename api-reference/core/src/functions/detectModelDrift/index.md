# detectModelDrift()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: detectModelDrift()

> **detectModelDrift**(`entries`, `profiles`): [`ModelDriftReport`](https://getpromptscript.dev/api-reference/core/src/interfaces/ModelDriftReport/index.md)

Defined in: [core/src/model-drift.ts:255](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/model-drift.ts#L255)

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