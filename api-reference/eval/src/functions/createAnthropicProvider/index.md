# createAnthropicProvider()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: createAnthropicProvider()

> **createAnthropicProvider**(`config`, `deps?`): [`EvalProvider`](https://getpromptscript.dev/api-reference/eval/src/type-aliases/EvalProvider/index.md)

Defined in: [eval/src/http-provider.ts:354](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/eval/src/http-provider.ts#L354)

Create a provider for the Anthropic Messages API. The body comes from the
runtime mapper; this adds the URL, the fixed headers and the transport
rules: an allowed host, no redirects, a time limit and a 4 MiB body cap.

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