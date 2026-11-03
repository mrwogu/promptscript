# createOpenAICompatibleProvider()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: createOpenAICompatibleProvider()

> **createOpenAICompatibleProvider**(`config`, `deps?`): [`EvalProvider`](https://getpromptscript.dev/api-reference/eval/src/type-aliases/EvalProvider/index.md)

Defined in: [eval/src/http-provider.ts:392](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/eval/src/http-provider.ts#L392)

Create a provider for an OpenAI-compatible Chat Completions API, with the
same transport rules as [createAnthropicProvider](https://getpromptscript.dev/api-reference/eval/src/functions/createAnthropicProvider/index.md). The request body
follows the public OpenAI documentation, so gateways may differ.

## Parameters

### config

[`ProviderConfig`](https://getpromptscript.dev/api-reference/eval/src/interfaces/ProviderConfig/index.md)

Name, base URL, key and transport limits

### deps?

[`ProviderDeps`](https://getpromptscript.dev/api-reference/eval/src/interfaces/ProviderDeps/index.md) = `{}`

Fetch to use instead of the global one

## Returns

[`EvalProvider`](https://getpromptscript.dev/api-reference/eval/src/type-aliases/EvalProvider/index.md)

The provider

## Throws

EvalProviderError `PS6302` when the base URL is refused