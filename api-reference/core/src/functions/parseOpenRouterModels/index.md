# parseOpenRouterModels()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: parseOpenRouterModels()

> **parseOpenRouterModels**(`payload`): [`OpenRouterModelEntry`](https://getpromptscript.dev/api-reference/core/src/interfaces/OpenRouterModelEntry/index.md)[]

Defined in: [core/src/model-drift.ts:148](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/core/src/model-drift.ts#L148)

Read the tracked providers' models out of an OpenRouter /api/v1/models
payload: mirror providers (~), request variants (like :batch), and
providers the catalog does not track drop out.

## Parameters

### payload

`unknown`

## Returns

[`OpenRouterModelEntry`](https://getpromptscript.dev/api-reference/core/src/interfaces/OpenRouterModelEntry/index.md)[]