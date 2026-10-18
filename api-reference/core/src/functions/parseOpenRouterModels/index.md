# parseOpenRouterModels()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: parseOpenRouterModels()

> **parseOpenRouterModels**(`payload`): [`OpenRouterModelEntry`](https://getpromptscript.dev/api-reference/core/src/interfaces/OpenRouterModelEntry/index.md)[]

Defined in: [core/src/model-drift.ts:121](https://github.com/mrwogu/promptscript/blob/c034efd2ff22b5feace7485154a193a44950eeb3/packages/core/src/model-drift.ts#L121)

Read the tracked providers' models out of an OpenRouter /api/v1/models
payload: mirror providers (~), request variants (like :batch), and
providers the catalog does not track drop out.

## Parameters

### payload

`unknown`

## Returns

[`OpenRouterModelEntry`](https://getpromptscript.dev/api-reference/core/src/interfaces/OpenRouterModelEntry/index.md)[]