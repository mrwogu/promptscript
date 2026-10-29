# createOpenAICompatibleProvider()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: createOpenAICompatibleProvider()

> **createOpenAICompatibleProvider**(`config`, `deps?`): [`EvalProvider`](https://getpromptscript.dev/api-reference/eval/src/type-aliases/EvalProvider/index.md)

Defined in: [eval/src/http-provider.ts:392](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/eval/src/http-provider.ts#L392)

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