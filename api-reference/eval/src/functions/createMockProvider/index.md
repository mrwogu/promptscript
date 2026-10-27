# createMockProvider()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: createMockProvider()

> **createMockProvider**(`script`): [`MockProvider`](https://getpromptscript.dev/api-reference/eval/src/type-aliases/MockProvider/index.md)

Defined in: [eval/src/provider.ts:98](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/eval/src/provider.ts#L98)

Create a provider for tests that answers from a table keyed by case id or
from a function, with scripted usage and latency, and records every call.
It has no network code. Usage defaults to zero tokens, latency to 0 and
status to 200.

## Parameters

### script

[`MockScript`](https://getpromptscript.dev/api-reference/eval/src/type-aliases/MockScript/index.md)

Answers by case id, or a function of the request and context

## Returns

[`MockProvider`](https://getpromptscript.dev/api-reference/eval/src/type-aliases/MockProvider/index.md)

The provider, with its received calls in `calls`